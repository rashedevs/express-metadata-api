const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const mysql = require("mysql");
const sizeOf = require("image-size");

const app = express();
const port = 8000;

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MySQL setup
const db = mysql.createConnection({
  //   host: process.env.DB_HOST,
  //   user: process.env.DB_USER,
  //   password: process.env.DB_PASSWORD,
  //   database: process.env.DB_DATABASE,
  //   port: process.env.DB_PORT,
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "redass@15108058", // Replace with your MySQL password
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

// Express route for handling file uploads and metadata extraction
app.post("/metadata", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Extract metadata based on file type
  const fileType = req.file.mimetype.includes("image") ? "image" : "pdf";
  let metadata = {};

  if (fileType === "image") {
    // Extract image dimensions
    const dimensions = getImageDimensions(req.file.buffer);
    metadata.dimensions = dimensions;
  } else if (fileType === "pdf") {
    // Implement PDF metadata extraction using Tesseract.js
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

    // Return JSON response
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
    // Use the 'image-size' library to get image dimensions
    const dimensions = sizeOf(imageBuffer);

    // Return dimensions in the format "width x height"
    return `${dimensions.width}x${dimensions.height}`;
  } catch (error) {
    // Handle errors, e.g., if the buffer does not contain a valid image
    console.error("Error extracting image dimensions:", error);
    return "unknown";
  }
}

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
