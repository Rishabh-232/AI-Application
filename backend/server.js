require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse-fixed");
const Groq = require("groq-sdk");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize Groq
const groq = new Groq({ apiKey: process.env.API_KEY });

// Create uploads folder if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

let pdfTextStore = {}; // store text per session

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    pdfTextStore[req.file.originalname] = data.text;
    res.json({ message: "Upload successful", filename: req.file.originalname });
  } catch (err) {
    console.error("PDF parsing error:", err);
    res.status(500).json({ message: "Error processing PDF" });
  }
});

// Ask route (with Groq AI)
app.post("/ask", async (req, res) => {
  const { question, filename } = req.body;
  const text = pdfTextStore[filename];

  if (!text) {
    return res.status(400).json({ message: "PDF not found" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that answers questions based only on the provided document text.",
        },
        {
          role: "user",
          content: `Document: ${text}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content || "No response.";
    res.json({ answer });
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ message: "Error generating answer." });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
