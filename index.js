const express = require("express");
const multer = require("multer");
const pdf = require("pdf-parse");
const mysql = require("mysql");
const sizeOf = require("image-size");
const moment = require("moment");

const app = express();
const port = 8000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "redass@15108058",
  database: "metadata",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

app.get("/", (req, res) => {
  res.send("Hello, this is the root endpoint!");
});

app.post("/metadata", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileType = req.file.mimetype.includes("image") ? "image" : "pdf";
  let metadata = {};

  if (fileType === "image") {
    // Extract image dimensions
    const dimensions = getImageDimensions(req.file.buffer);
    metadata.dimensions = dimensions;
  } else if (fileType === "pdf") {
    try {
      // Extract author from PDF
      const author = await extractAuthorFromPdf(req.file.buffer);
      metadata.author = author;

      // Extract other metadata from PDF (createdDate)
      const { createdDate } = await extractPdfMetadata(req.file.buffer);
      metadata.createdDate = createdDate;
    } catch (error) {
      console.error("Error extracting PDF metadata:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const sql =
    "INSERT INTO metadata (fileType, fileName, dimensions, metadata, author) VALUES (?, ?, ?, ?, ?)";
  const values = [
    fileType,
    req.file.originalname,
    metadata.dimensions || "It's pdf",
    JSON.stringify(metadata),
    metadata.author,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting metadata into MySQL:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    console.log("Metadata inserted into MySQL:", result);

    res.json({
      fileType,
      fileName: req.file.originalname,
      metadata,
    });
  });
});

// Function to extract image dimensions
function getImageDimensions(imageBuffer) {
  try {
    const dimensions = sizeOf(imageBuffer);
    return `${dimensions.width}x${dimensions.height}`;
  } catch (error) {
    console.error("Error extracting image dimensions:", error);
    return "unknown";
  }
}

// Function to extract author from PDF
async function extractAuthorFromPdf(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);
    const author = data.info.Author || "Unknown Author";
    return author;
  } catch (error) {
    console.error("Error extracting author from PDF:", error);
    return "Unknown Author";
  }
}

// Function to extract other PDF metadata
async function extractPdfMetadata(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);
    const createdDate = formatPdfCreationDate(data.info.CreationDate);
    return { createdDate };
  } catch (error) {
    console.error("Error extracting PDF metadata:", error);
    return { createdDate: "Invalid date" };
  }
}

// Function to format PDF creation date
function formatPdfCreationDate(pdfCreationDate) {
  const momentDate = moment(pdfCreationDate, "ddd MMM DD HH:mm:ss YYYY", "en");
  if (momentDate.isValid()) {
    return momentDate.format("YYYY-MM-DD");
  } else {
    console.error("Invalid PDF creation date:", pdfCreationDate);
    return "Invalid date";
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
