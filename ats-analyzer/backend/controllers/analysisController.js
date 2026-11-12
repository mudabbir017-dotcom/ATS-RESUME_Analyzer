const Analysis = require("../models/Analysis");
const { extractTextFromPDF } = require("../utils/pdfParser");
const { splitIntoBullets } = require("../utils/textUtils");

const {
  getEmbedding,
  semanticScore,
  semanticScoreWithEmbedding,
} = require("../utils/embeddings");

const {
  analyzeGaps,
  rewriteBulletUntilGoodEnough,
} = require("../utils/geminiService");

const WEAK_BULLET_THRESHOLD = 60;
const REWRITE_TARGET = 80;
const MAX_BULLETS_TO_REWRITE = 2;

async function analyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume PDF file is required",
      });
    }

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message: "Please provide a fuller job description",
      });
    }

    // Extract Resume
    const resumeText = await extractTextFromPDF(req.file.buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(422).json({
        message: "Could not extract readable text from this PDF",
      });
    }

    // Overall ATS Score
    const overallScore = await semanticScore(
      resumeText,
      jobDescription
    );

    // AI Suggestions
    const {
      missingSkills,
      suggestions,
    } = await analyzeGaps(
      resumeText,
      jobDescription
    );

    // Split Resume
    const bullets = splitIntoBullets(resumeText);

    // ***** IMPORTANT *****
    // Embed JD ONLY ONCE
    const jdEmbedding =
      await getEmbedding(jobDescription);

    const scoredBullets = [];

    // Sequential Scoring
    for (const bullet of bullets) {

      const score =
        await semanticScoreWithEmbedding(
          bullet,
          jdEmbedding
        );

      scoredBullets.push({
        bullet,
        score,
      });
    }

    const weakest = scoredBullets
      .filter(
        (b) => b.score < WEAK_BULLET_THRESHOLD
      )
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_BULLETS_TO_REWRITE);

    const rewrites = [];

    // Sequential Rewrite
    for (const { bullet } of weakest) {

      const rewrite =
        await rewriteBulletUntilGoodEnough(
          bullet,
          jobDescription,
          {
            threshold: REWRITE_TARGET,
            maxAttempts: 3,
          }
        );

      rewrites.push(rewrite);
    }

    const analysis =
      await Analysis.create({

        user: req.user._id,

        resumeFileName:
          req.file.originalname,

        resumeFileData:
          req.file.buffer,

        resumeFileMime:
          req.file.mimetype,

        jobDescription,

        overallScore,

        missingSkills,

        suggestions,

        rewrites,
      });

    const response =
      analysis.toObject();

    delete response.resumeFileData;

    res.status(201).json(response);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        err.message ||
        "Analysis failed",
    });
  }
}

async function getHistory(req, res) {
  try {

    const history =
      await Analysis.find({
        user: req.user._id,
      })
        .sort({
          createdAt: -1,
        })
        .select(
          "resumeFileName overallScore createdAt missingSkills"
        );

    res.json(history);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
}

async function getOne(req, res) {
  try {

    const analysis =
      await Analysis.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).select("-resumeFileData");

    if (!analysis) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    res.json(analysis);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
}

async function getPdf(req, res) {
  try {

    const analysis =
      await Analysis.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).select(
        "resumeFileData resumeFileMime resumeFileName"
      );

    if (
      !analysis ||
      !analysis.resumeFileData
    ) {
      return res.status(404).json({
        message: "PDF not found",
      });
    }

    res.set({
      "Content-Type":
        analysis.resumeFileMime ||
        "application/pdf",

      "Content-Disposition":
        `inline; filename="${analysis.resumeFileName}"`,
    });

    res.send(analysis.resumeFileData);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
}

module.exports = {
  analyze,
  getHistory,
  getOne,
  getPdf,
};