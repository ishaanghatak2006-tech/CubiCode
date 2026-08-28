# CubiCode

CubiCode is a modern, full-stack, LeetCode-like programming platform where users can solve programming challenges (quests), test code execution in real-time, track progress on an interactive developer dashboard, and write code in a fully featured environment powered by Monaco Editor.

---

## 🚀 Key Features

*   **Secure Authentication**: User registration and login utilizing JSON Web Tokens (JWT) and `bcrypt` password hashing.
*   **Rich Coding Workspace**:
    *   Interactive code editor powered by `@monaco-editor/react`.
    *   Multi-language support for **C++**, **Python**, and **JavaScript**.
    *   Automatic class and function boilerplate generator based on the selected language and challenge requirements.
*   **Code Judge Integration**:
    *   Run code against visible example test cases.
    *   Submit solutions to execute against a comprehensive suite of hidden test cases.
    *   Track execution statistics including peak memory (MiB) and run time (ms).
    *   Verdicts including `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Runtime Error`, and `Compilation Error`.
*   **Interactive User Dashboard**:
    *   Total solved count and submissions overview.
    *   Developer activity heatmap and history log.
*   **Admin Panel**:
    *   Management interface to create, read, update, and delete coding challenges.
    *   Configure function parameters, return types, constraints, visible test cases, and hidden judge test cases.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (v19)
*   **Build Tool**: Vite
*   **Routing**: React Router (v7)
*   **Editor**: Monaco Editor (`@monaco-editor/react`)
*   **API Client**: Axios

### Backend
*   **Environment**: Node.js & Express (v5)
*   **Database**: MongoDB (via Mongoose)
*   **Auth**: JSON Web Tokens (JWT) & bcrypt
*   **Client**: Axios (for calling the judge service)

---

## 📂 Project Structure

```text
CubiCode/
├── backend/                  # Express REST API
│   ├── config/               # Database connection config
│   ├── middlewares/          # JWT and authorization middlewares
│   ├── Routes/               # API route definitions
│   │   ├── admin.js          # Challenge creation/editing
│   │   ├── autocomplete.js   # Editor autocomplete logic
│   │   ├── quest.js          # Question data fetching
│   │   ├── submit.js         # Integration with judge and code wrapper
│   │   └── user.js           # User login/register & auth
│   └── schemas/              # Mongoose DB schemas (User, Question, Submission)
│
└── frontend/                 # Vite + React Client
    ├── src/
    │   ├── api/              # API connections
    │   ├── context/          # React Auth State Provider
    │   ├── Pages/            # View Pages
    │   │   ├── Auth.jsx      # Login & Signup forms
    │   │   ├── Dashboard.jsx # User stats & activity tracker
    │   │   ├── Problems.jsx  # Code challenge list view
    │   │   └── Workspace.jsx # Coding workspace with Monaco Editor
    │   └── styles/           # Component-specific styles
    └── vite.config.js
```

---

## ⚖️ Code Judging & Execution (LocalCodeJudge)

CubiCode relies on an external microservice to compile and run user submissions. It integrates with **[LocalCodeJudge](https://github.com/ishaanghatak2006-tech/LocalCodeJudge)**, which runs on port `8000`.

### How it Works:
1. **Code Wrapping**: When a user runs or submits code, the CubiCode backend automatically wraps the class and method definitions into a complete executable file (adding boilerplate code to read inputs, execute solutions, and print outputs based on parameters like vectors, matrices, etc.).
2. **Execution Request**: The backend sends a request containing the code and test cases to the judge endpoint (`http://localhost:8000/judge`).
3. **Verdict Evaluation**: `LocalCodeJudge` runs the binary/interpreter, evaluates the output against expected results, and monitors resource usage (runtime and memory limit constraints).
4. **Result Polling**: The backend polls `http://localhost:8000/status/:jobId` until the verdict is ready, then returns the result (e.g. `Accepted`, `Wrong Answer`, `Runtime Error`, `TLE`) to the frontend workspace.

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB running locally or a MongoDB Atlas URI
*   A running instance of `LocalCodeJudge` or a compatible compiler server running on port `8000` (used for compiling and running submitted code).

### Step 1: Set up the Backend
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Create a `.env` file in the `backend/` directory based on `.env.example`:
    ```env
    MONGO_URI=mongodb://localhost:27017/cubicode
    JWT_SECRET=your_jwt_secret_key_here
    BACKEND_TOKEN=your_backend_secret_token_here
    NODE_ENV=development
    PORT=5000
    CORS_ORIGIN=*
    ```
4.  Start the backend development server:
    ```bash
    npm run dev
    ```
    *The server runs by default on `http://localhost:5000`.*

### Step 2: Set up the Frontend
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
    *The frontend client runs by default on `http://localhost:5173`.*

---

## 🔒 License
This project is licensed under the ISC License.
