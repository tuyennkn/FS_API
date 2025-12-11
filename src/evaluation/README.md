# Evaluation Scripts

This folder contains scripts to evaluate the performance and accuracy of the AI modules.

## Prerequisites

1.  Ensure `FS_API` dependencies are installed (`npm install`).
2.  Ensure `.env` file is present in `FS_API` root with valid `MONGODB_URI` and `GEMINI_API_KEY`.
3.  For `evaluate_performance.js`, the API server must be running (`npm start` in `FS_API`).

## Running Evaluations

Run the scripts using `node` from the `FS_API` root directory (to ensure imports work correctly).

### 1. Search Evaluation (Precision, Recall, MRR)
Compares Keyword Search vs Semantic Search.

```bash
.\node_modules\.bin\babel-node src\evaluation\evaluate_search.js
```

### 2. Classification Evaluation (Accuracy)
Evaluates the AI's ability to categorize books based on genre/title.

```bash
.\node_modules\.bin\babel-node src\evaluation\evaluate_classification.js
```

### 3. Performance Evaluation (Latency)
Measures response times of API endpoints. **Server must be running.**

```bash
.\node_modules\.bin\babel-node src\evaluation\evaluate_performance.js
```
