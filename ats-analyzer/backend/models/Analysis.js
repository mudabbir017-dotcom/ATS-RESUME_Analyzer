const mongoose = require("mongoose");

const rewriteSchema = new mongoose.Schema(
  {
    original: String,
    finalRewrite: String,
    initialScore: Number,
    finalScore: Number,
    attempts: Number,
    history: [
      {
        attempt: Number,
        text: String,
        score: Number,
        reasoning: String,
      },
    ],
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeFileName: String,
    resumeFileData: Buffer, // the raw PDF bytes, so it can be re-downloaded later
    resumeFileMime: { type: String, default: "application/pdf" },
    jobDescription: String,
    overallScore: { type: Number, required: true }, // 0-100, semantic match
    missingSkills: [String],
    suggestions: [String],
    rewrites: [rewriteSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);
