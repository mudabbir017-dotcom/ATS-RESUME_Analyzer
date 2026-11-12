const pdfParse = require("pdf-parse");

// Takes the raw Buffer multer gives us and returns plain extracted text.
async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

module.exports = { extractTextFromPDF };
