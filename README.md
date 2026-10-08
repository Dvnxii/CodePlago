# CodePlago — Code Plagiarism Detector

CodePlago is a web-based tool that checks multiple code files for similarity. You can upload a set of submissions, run a plagiarism check, and see which files have similar code. The results also include a side-by-side comparison of matching code.

## Features

- Upload code files using drag and drop
- Supports common programming languages such as `.js`, `.py`, `.java`, `.c`, `.cpp`, `.ts`, `.go`, `.rb`, `.php`, `.rs`, `.swift`, `.kt`, and more
- Uses Winnowing with k-gram fingerprinting to compare code
- Normalizes code before comparison so simple variable renaming doesn't affect the result too much
- Shows similarity scores between files
- Displays High, Medium, or Low risk based on the similarity
- Side-by-side comparison with matched lines highlighted
- Dashboard for viewing previous plagiarism checks
- SQLite database for storing check results

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Detection | Winnowing / K-gram fingerprinting |

## Running the Project

### Requirements

Before running the project, make sure you have:

- Node.js 16 or higher
- npm 8 or higher

### 1. Get the project

If you have the ZIP file:

```bash
unzip codeplago.zip
cd codeplago
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Run the server:

```bash
npm run dev
```

For a normal production start:

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The frontend should open at:

```text
http://localhost:3000
```

The frontend is configured to forward `/api` requests to the backend running on port 5000.

## Project Structure

```text
codeplago/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── db/
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   └── checks.js
│   │   └── services/
│   │       └── plagiarismEngine.js
│   ├── data/
│   ├── uploads/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── NewCheckPage.jsx
    │   │   ├── CheckPage.jsx
    │   │   └── ComparePage.jsx
    │   └── utils/
    │       └── api.js
    └── package.json
```

## How the Plagiarism Check Works

CodePlago uses a few steps to compare two submissions.

### 1. Code normalization

The code is cleaned before comparison. Comments and unnecessary whitespace are removed, while strings and numbers are replaced with generic tokens.

Identifiers such as variable and function names are also replaced with generic values like:

```text
ID
STR
NUM
```

This helps detect similarities even when someone changes variable names.

### 2. K-grams

After normalization, the code is converted into a token sequence. The sequence is then divided into overlapping groups of tokens called k-grams.

The default value used by the project is:

```text
k = 5
```

### 3. Winnowing

The generated k-grams are hashed and processed using the Winnowing algorithm. A sliding window is used to select hashes that form the fingerprint of each file.

The current window size is:

```text
window = 4
```

### 4. Similarity score

The fingerprints of two files are compared using Jaccard similarity:

```text
similarity = intersection / union
```

The result is a value between 0 and 1, which is then used to calculate the similarity percentage shown in the application.

### 5. Matching lines

The application also checks normalized lines separately. Matching lines are shown in the comparison page so that it is easier to see where the similarities occur.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/checks` | Upload files and run a check |
| GET | `/api/checks` | Get previous checks |
| GET | `/api/checks/:id` | Get results for a particular check |
| GET | `/api/checks/:id/compare/:aId/:bId` | Compare two files |
| DELETE | `/api/checks/:id` | Delete a check |
| GET | `/api/health` | Check whether the backend is running |

## Database and Storage

The project uses SQLite, so there is no separate database server required for local development.

The database is created at:

```text
backend/data/codeplago.db
```

Uploaded files are temporarily stored in:

```text
backend/uploads/
```

The database and uploaded files should be handled appropriately before deploying the application.

## Limitations / Future Improvements

There are a few things that could be improved for a production deployment:

- Move from SQLite to PostgreSQL for larger applications
- Store uploaded files using a service such as S3 instead of local storage
- Move plagiarism analysis to a background job for large batches
- Improve language-specific code parsing
- Add authentication and user accounts
- Improve the similarity thresholds based on different programming languages

The current plagiarism engine runs synchronously, so very large batches may take longer to process.

## License

MIT