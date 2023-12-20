const express = require("express");
const multer = require("multer");
const mysql = require("mysql");
const sizeOf = require("image-size");
const pdfParse = require("pdf-parse");

const app = express();
const port = 8000;

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MySQL setup
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

// Express route for handling file uploads
app.post("/metadata", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Extract metadata based on file type
  const fileType = req.file.mimetype.includes("image") ? "image" : "pdf";
  let metadata = {};

  if (fileType === "image") {
    const dimensions = getImageDimensions(req.file.buffer);
    metadata.dimensions = dimensions;
  } else if (fileType === "pdf") {
    // Extract PDF metadata using pdf-parse
    const pdfData = await getPdfMetadata(req.file.buffer);
    metadata = pdfData.info;
    metadata.createdDate = new Date();
    metadata.author = "John Doe";
  }

  // Store metadata in MySQL database
  const sql =
    "INSERT INTO metadata (fileType, fileName, dimensions, metadata) VALUES (?, ?, ?, ?)";
  const values = [
    fileType,
    req.file.originalname,
    metadata.dimensions,
    JSON.stringify(metadata),
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
    // Handle errors, e.g., if the buffer does not contain a valid image
    console.error("Error extracting image dimensions:", error);
    return "unknown";
  }
}

// Function to extract PDF metadata using pdf-parse
async function getPdfMetadata(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data;
  } catch (error) {
    console.error("Error extracting PDF metadata:", error);
    return {};
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
