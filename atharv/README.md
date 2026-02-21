# AI-Powered Writer — DevHacks 2026 Challenge 2

A comprehensive AI-powered writing analysis system that deeply understands narrative structure, character development, pacing, genre consistency, dialogue authenticity, and style coherence.

## Project Structure

```
challenge2/
├── backend/
│   ├── main.py                    # FastAPI server + /analyze endpoint
│   ├── character_graph.py         # Character state tracking & contradictions
│   ├── consistency_tracker.py     # Semantic similarity & tense checking
│   ├── text_analyzer.py           # Structure, show-don't-tell, pacing
│   ├── style_transformer.py       # Style profiles & transformations
│   ├── dialogue_voice.py          # Character voice profiling
│   ├── genre_detector.py          # Genre classification & drift
│   ├── plot_arc.py                # Narrative arc phase detection
│   └── requirements.txt           # Python dependencies
│
└── frontend/
    ├── index.html                 # HTML entry point
    ├── package.json               # NPM dependencies
    ├── vite.config.js             # Vite build config
    ├── src/
    │   ├── main.jsx               # React root
    │   ├── App.jsx                # Root component + state management
    │   ├── App.css                # Global styling (600+ lines)
    │   ├── api/
    │   │   └── client.js          # API client (analyzeText, healthCheck)
    │   └── components/
    │       ├── Navbar.jsx         # Navigation with 7 view tabs
    │       ├── Editor.jsx         # Text input/output editor
    │       ├── CharacterUniverse.jsx  # 3D force-directed graph
    │       ├── PacingWave.jsx     # Pacing curve visualization
    │       ├── PlotArcView.jsx    # Narrative arc phases
    │       ├── GenreView.jsx      # Genre profile
    │       ├── DialogueView.jsx   # Character voice profiles
    │       ├── IssuePanel.jsx     # Issue browser
    │       └── Dashboard.jsx      # Live metrics bar
    └── public/                     # Static assets (optional)
```

## Tech Stack

**Backend:**
- **Framework**: FastAPI + Uvicorn
- **NLP**: spaCy (entity recognition), sentence-transformers (semantic similarity), NetworkX (graph analysis)
- **Language**: Python 3.9+

**Frontend:**
- **Framework**: React 18 + Vite
- **Visualization**: Three.js, react-force-graph-3d
- **Styling**: Custom CSS with Space Mono + Syne fonts
- **State Management**: React hooks (useState, useCallback, useEffect)

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd challenge2/backend
   ```

2. **Create a Python virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download spaCy model:**
   ```bash
   python -m spacy download en_core_web_sm
   ```

5. **Start the FastAPI server:**
   ```bash
   python main.py
   ```
   
   The server will start on `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `GET http://localhost:8000/health`
   - Analyze endpoint: `POST http://localhost:8000/analyze`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd challenge2/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will open on `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```
   Output will be in `frontend/dist/`

## API Documentation

### POST `/analyze`

**Request Body:**
```json
{
  "text": "Your text to analyze here...",
  "target_style": "formal",
  "similarity_threshold": 0.7
}
```

**Parameters:**
- `text` (string, required): The document text to analyze
- `target_style` (string, optional): Target writing style (`formal`, `casual`, `dramatic`, `journalistic`)
- `similarity_threshold` (float, optional): Threshold for semantic similarity (0.0-1.0, default: 0.7)

**Response:**
```json
{
  "original_text": "...",
  "enhanced_text": "...",
  "dominant_genre": "thriller",
  "per_paragraph_pacing": [
    {
      "paragraph": 1,
      "pacing_score": 7,
      "action_score": 8,
      "emotion_score": 6,
      "label": "High"
    }
  ],
  "character_profiles": {
    "Alice": {
      "character": "Alice",
      "line_count": 12,
      "vocab_richness": 0.85,
      "formality_ratio": 0.6,
      "exclamation_rate": 0.1,
      "question_rate": 0.25,
      "drift_detected": false
    }
  },
  "arc_curve": [
    {
      "paragraph": 1,
      "phase": "Setup",
      "phase_index": 0
    }
  ],
  "readability_score": 7.5,
  "total_issues": 12,
  "severity_counts": {
    "high": 2,
    "medium": 5,
    "low": 5
  },
  "all_issues": [
    {
      "category": "character",
      "severity": "high",
      "paragraph": 3,
      "message": "Character contradiction: Alice dies in P3 but appears in P5",
      "suggestion": "Clarify the circumstances or remove one appearance"
    }
  ]
}
```

## Features

1. **Character State Graph** — Detects contradictions (death conflicts, location impossibilities)
2. **Semantic Consistency** — Analyzes paragraph-level semantic coherence with fallback TF-IDF
3. **Structure Analysis** — Identifies passive voice, calculates readability (Flesch-Kincaid)
4. **Show-Don't-Tell Detection** — Flags "telling" patterns with "showing" suggestions
5. **Pacing Analysis** — Scores narrative momentum per paragraph (action + emotion density)
6. **Vibe Graph** — Combines emotion/action/pacing into per-paragraph vibe score with genre-drift highlighting
7. **Style Transformation** — Offers 4 writing styles with vocabulary replacement
8. **Dialogue Voice** — Profiles character speech patterns, detects voice drift
9. **Genre Detection** — Identifies dominant genre, tracks genre drift across paragraphs
10. **Plot Arc Mapping** — Maps narrative to 5 phases (Setup → Resolution) with consistency checks

## UI Components

- **Navbar** — 9-tab navigation (Editor, Character Universe, Pacing, Vibe Graph, Plot Arc, Genre, Dialogue, Explainability, Issues)
- **Editor** — Split-pane view: left (input + analysis button), right (enhanced text + readability)
- **Character Universe** — 3D force-directed graph of characters with contradictions flagged
- **Pacing Wave** — Interactive SVG curve showing pacing momentum + table
- **Vibe Graph** — Weighted vibe chart (emotion/action/pacing), genre-aware coloring, and drift flags
- **Plot Arc** — Mountain curve visualization of narrative phases
- **Genre View** — Dominant genre chip, per-paragraph genre strip, distribution bars
- **Dialogue View** — Character profile cards with linguistic metrics
- **Explainability Center** — Dedicated audit view showing style change log, diff blocks, issue rationale, and downloadable JSON report
- **Issue Panel** — Categorized issue browser with filters
- **Dashboard** — Fixed bottom bar with 8 live metrics

## Custom vs External Components

### Custom-built logic (team-owned)
- Character contradiction detection and state tracking pipeline
- Paragraph-level semantic flow scoring and drift heuristics
- Structure/readability/show-don't-tell analyzers with rule-based issue generation
- Style transformation profiles and explainable replacement/diff pipeline
- Dialogue voice fingerprinting and drift detection
- Genre scoring and paragraph drift alerts
- Plot arc phase mapping heuristics and arc consistency checks
- Unified report aggregation and severity ranking

### External libraries (infrastructure only)
- **spaCy**: tokenization + entity extraction primitives
- **sentence-transformers**: local embeddings (no hosted API)
- **NetworkX**: graph data structure utilities
- **FastAPI/Uvicorn**: API serving layer
- **React/Vite/Three.js/react-force-graph-3d**: UI framework and rendering

## Styling

- **Theme**: Deep-space editorial aesthetic (dark background with cyan/amber/red accents)
- **Colors**: 12 CSS variables defined (primary, secondary, accent shades)
- **Fonts**: Space Mono (monospace code), Syne (display headings)
- **Animations**: Glow drift, spin, pulse, grid animation, button hover states
- **Responsive**: Grid-based layout with breakpoints

## Development

### Adding a New NLP Module

1. Create a new file in `backend/` (e.g., `new_analyzer.py`)
2. Implement your analyzer class with an `analyze(text)` method
3. Import and instantiate in `main.py`
4. Call it in the `/analyze` endpoint
5. Return results in the unified response structure

### Adding a New Visualization Component

1. Create a new JSX file in `frontend/src/components/`
2. Accept `result` data via props from `App.jsx`
3. Render visualization (SVG, Three.js, HTML/CSS)
4. Add corresponding view tab in `Navbar.jsx`
5. Update `App.jsx` routing logic

## Testing

### Analyze Sample Text

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sarah walked into the room. She looked around nervously. The old house creaked with every step. Suddenly, a door slammed shut behind her.",
    "target_style": "formal"
  }'
```

### Health Check

```bash
curl http://localhost:8000/health
```

## DevHacks 2026 Submission Notes

- **Challenge**: Build an AI writing assistant for analyzing/enhancing scripts, articles, stories
- **Constraints**: No external LLM API calls (Claude, GPT, etc.)
- **Solution**: 8 custom NLP modules using open-source libraries (spaCy, sentence-transformers)
- **Submission Files**: All code contained in `challenge2/` directory
- **Runnable**: Backend + Frontend fully functional with zero external LLM dependencies

## Future Enhancements

1. **Advanced Similarity**: Support multiple embedding models (BERT, RoBERTa, DPR)
2. **Character Arcs**: Track emotional/psychological character evolution
3. **Dialogue Tags**: Improved dialogue parsing with nested dialogue support
4. **Collaborative Editing**: Real-time multi-user editing with WebSockets
5. **Export Features**: PDF reports, inline comments export, DOCX suggestions
6. **Fine-tuning**: Custom NLP models trained on author-specific corpuses

## License

MIT License - DevHacks 2026 Challenge 2 Submission

## Contact

For questions or feedback, refer to the DevHacks 2026 challenge guidelines.
