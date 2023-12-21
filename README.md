# express-metadata-api

# express-metadata-api Backend

This Node.js backend provides an API for managing file to extract metadata. It uses Express for handling HTTP requests and MySQL as the database.

## Table of Contents

- [Setup](#setup)
- [Endpoints](#endpoints)
- [Usage](#usage)

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/rashedevs/express-metadata-api.git
   cd express-metadata-api

   ```

2. **Install Dependencies:**

   ```bash
   npm install

   ```

3. **Database Configuration:**

   Set up your MySQL database and configure connection details in a .env file. You can use the .env.example file as a template. Also the variables are used directly in index.js file.

4. **Run the Application:**

   ```bash
   npm start

   ```

   The server will run on http://localhost:8800 by default.
   But you can check the live link here https://metadata-k5w3.onrender.com

## Endpoints

1. GET /metadata:
   Get all extract data.

2. POST /metadata:
   Create a new file entry to extract data.

## Usage

- Use the provided API endpoints to extract metadata.
- Customize the database configuration in the .env file.
- Additional details for each endpoint can be found in the code comments.
