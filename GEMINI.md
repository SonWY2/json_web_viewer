# Gemini Project Context: JSONL Web Viewer

This document provides a summary of the `json_web_viewer` project for the Gemini agent.

## 1. Project Overview

This is a web-based tool designed to efficiently view, browse, and analyze large JSONL (JSON Lines) files. It features a separate backend and frontend, allowing for robust data processing on the server while providing a responsive user interface in the browser.

**Key Features:**
-   **File System Explorer**: Securely browse the local file system to select JSONL or JSON files.
-   **Large File Support**: Handles files up to 10GB by using streaming techniques on the backend, ensuring low memory usage.
-   **Advanced Data Grid**: Displays data with features like pagination, sorting, advanced filtering, column selection, and column reordering.
-   **On-Demand Analysis**: Performs statistical analysis on specific columns when requested by the user, complete with visualizations.
-   **Data Export**: Exports data (original, filtered, or selected) to various formats like CSV, JSON, and Excel.

## 2. Tech Stack

-   **Backend**:
    -   **Framework**: Python 3.8+ with FastAPI
    -   **Key Libraries**: `pydantic` for data validation, `pandas` for data manipulation, `ijson` for streaming parsing.
    -   **Server**: Uvicorn
-   **Frontend**:
    -   **Framework**: React 18 with TypeScript
    -   **Build Tool**: Vite
    -   **Styling**: Tailwind CSS
    -   **State Management**: Zustand
    -   **Charting**: Recharts

## 3. Project Structure

The project is a monorepo with two main directories:

-   `backend/`: Contains the FastAPI application.
    -   `backend/app/api/`: API endpoint definitions.
    -   `backend/app/services/`: Core business logic for file processing, data analysis, etc.
    -   `backend/app/models/`: Pydantic data models.
    -   `backend/main.py`: Application entry point.
-   `frontend/`: Contains the React application.
    -   `frontend/src/components/`: Reusable React components.
    -   `frontend/src/stores/`: Zustand state management stores.
    -   `frontend/src/services/`: API client for communicating with the backend.
    -   `frontend/src/App.tsx`: Main application component.

## 4. How to Run the Project

**1. Start the Backend Server:**
```bash
cd backend
# Install dependencies if you haven't already
# pip install -r requirements.txt
python main.py
```
The backend will be available at `http://localhost:8000`.

**2. Start the Frontend Development Server:**
In a new terminal:
```bash
cd frontend
# Install dependencies if you haven't already
# npm install
npm run dev
```
The frontend will be available at `http://localhost:5173` and will connect to the backend.

## 5. Current Status

The project is nearly feature-complete. Most core functionalities, including file system browsing, data loading, filtering, sorting, analysis, and export, are implemented.

Remaining tasks (`TODO` in `구현상황.md`) are primarily focused on:
-   UI/UX enhancements (e.g., resizable columns/sidebars).
-   State persistence (e.g., maintaining state on page refresh).
-   Minor bug fixes.

## 6. Agent Instructions

Please respond in Korean.