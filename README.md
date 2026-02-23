<div align="center">

  # ✨ ScriptIQ
  ### AI-Powered Writer – Script & Content Enhancement System

  <p align="center">
    <strong>Elevate your writing with comprehensive AI-powered analysis, real-time feedback, and dynamic narrative tracking.</strong>
  </p>

  <p align="center">
    <a href="#core-features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#project-structure">Architecture</a> •
    <a href="#getting-started">Installation</a> •
    <a href="#license">License</a>
  </p>

  <div>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    
</div>

---

## 📖 What is ScriptIQ?

**ScriptIQ** is a state-of-the-state Narrative Intelligence Platform specifically built for authors, screenwriters, and creative professionals. It goes beyond basic grammar checking to deeply understand the context, pacing, consistency, and structural arcs of your writing. Utilizing a custom NLP engine powered by *DeepAnalysisEngine* and *Gemini API*, it seamlessly integrates directly into your workspace.

Whether you're developing character universes, analyzing dialogue voices, or tracking narrative consistency over a long-form document, **ScriptIQ** is your dedicated AI co-writer.

---

## 🌟 Core Features

### 🧠 Advanced NLP DeepAnalysis Engine
- **Narrative Consistency Tracking:** Contextual memory logic to track plots, items, and rules across your text.
- **Controlled Style & Tone Modification:** Fine-tune your writing using advanced embeddings (e.g., `all-MiniLM-L6-v2`) and Gemini LLM.
- **Explainable Output:** Understand exactly *why* an AI suggestion was made, ensuring you stay in constant control of the narrative.

### ✍️ AI Writer Workbench (Frontend)
- **Interactive Narrative Knowledge Graph:** View full 3D nodes of your characters, locations, and narrative items.
- **Character Universe Dashboard:** Detailed profiles, including automatic character detection via Fountain/text parsing.
- **Author Style Fingerprint:** Deep dive into your genre, pacing, dialogue voice, and stylistic trends.
- **Side-by-Side Comparison:** Compare revisions, visually contrasting structure, pacing, and tone.

### 🌐 Cross-Platform Accessibility
- **Chrome Extension integration:** Bring ScriptIQ's power everywhere. Get instantaneous, non-intrusive structural and style suggestions directly on any webpage editor.
- **Docs-Clone Dashboard:** Write in a native-feeling word processor tailored for creative writing without distractions.

---

## 🛠️ Tech Stack

We utilize a modern, robust, and scalable technology stack:

| Domain | Technologies Used |
| :--- | :--- |
| **Backend API** | FastAPI, Uvicorn, Python 3 |
| **NLP & AI Models** | Transformers (Hugging Face), spaCy, NLTK, Scikit-learn, NetworkX, OpenAI/Gemini LLM |
| **Frontend UI** | React 18, Vite, React Router DOM, React-Force-Graph-3D, Three.js |
| **Database & Cloud** | Firebase, Firestore, Storage, PostgreSQL/SQLAlchemy, Redis |
| **Browser Integration** | Chrome Extensions API (Manifest V3) |

---

## 📁 Project Structure

```text
atharv/
│
├── backend/               # FastAPI Server & DeepAnalysisEngine
│   ├── app/               # Core application logic, routing, and models
│   ├── scripts/           # ML/NLP auxiliary scripts (Fountain Parser, etc.)
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React + Vite Web Application
│   ├── src/               # UI Components, Pages, and Global CSS
│   ├── public/            # Static assets
│   └── package.json       # Node.js dependencies
│
├── chrome-extension/      # Manifest V3 Extension
│   ├── background.js      # Service worker for background execution
│   ├── content.js/css     # Page overlay injections
│   └── popup.html/js      # Extension popup UI
│
├── stitch_writing_workspace_analysis_editor/ # Core Dashboard UI Prototypes
├── setup.sh               # One-click environment bootstrap script
├── .firebaserc            # Firebase project configuration
└── firebase.json          # Firebase hosting/firestore rules
```

---

## 🚀 Getting Started

Follow these steps to get a local instance of **ScriptIQ** up and running on your machine.

### Prerequisites
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/en/)
- A **Gemini API Key** or equivalent for LLM configurations.

### Option 1: Quick Setup

Use the provided shell script from the project root to automatically bootstrap the backend:
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### 1. Start the Backend API
Navigate to the `backend` directory, set up your Python virtual environment, install the modules, and launch FastAPI:

```bash
cd backend
python -m venv .venv

# Activate Virtual Environment (Windows)
.venv\Scripts\activate
# Activate Virtual Environment (Mac/Linux)
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Download NLTK datasets
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('punkt_tab')"

# Setup environment variables (add your keys to .env)
cp .env.example .env

# Run FastAPI Server
uvicorn app.main:app --reload
```
*The API will be live at: http://localhost:8000*

#### 2. Start the Frontend Application
In a new terminal, navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```
*The web app will be live at: http://localhost:5173*

#### 3. Load the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on (top right corner).
3. Click **Load unpacked**.
4. Select the `chrome-extension/` directory from this project.
5. Pinned the extension to activate ScriptIQ on any webpage!

---

## 💡 Usage Guide

1. **Dashboard & Workspaces:** Navigate through the Frontend Sidebar to access the "Timeline", "Consistency", "Vibe Graph", and "Explainability" tools.
2. **Analysis Workarounds:** Paste your script, novel chapter, or plain text into the editor. ScriptIQ's DeepAnalysis engine starts functioning the moment you pause.
3. **Refining Custom Nodes:** For interactive stories, visit `/character-universe` to explore the generated 3D Force Graph generated by NetworkX & Three.js.

---

