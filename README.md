# AI Writer - Script & Content Enhancement System

An intelligent writing assistant for narrative consistency, content enhancement, and controlled style transformation.

## Features

- **Entity Tracking**: Extracts and tracks characters, locations, and other entities across your text
- **Consistency Checking**: Detects contradictions in character attributes, name variants, and temporal inconsistencies
- **Style Transformation**: Convert between formal and casual tones with adjustable intensity
- **Clarity Analysis**: Readability scores, passive voice detection, and improvement suggestions
- **Explainable Output**: Every change shows what was modified and why

## Quick Start

### Backend Setup

```bash
cd backend

# Install dependencies using UV
uv pip install -r requirements.txt

# Download spaCy model (optional but recommended)
python -m spacy download en_core_web_sm

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ai-writer/
├── backend/
│   ├── app/
│   │   ├── core/           # Core NLP modules (custom-built)
│   │   │   ├── entity_tracker.py
│   │   │   ├── consistency_checker.py
│   │   │   ├── style_engine.py
│   │   │   └── clarity_analyzer.py
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # Pydantic schemas
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/            # API client
│   │   └── app/            # Next.js pages
│   └── package.json
└── docs/
    └── ARCHITECTURE.md     # Custom vs External documentation
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Full text analysis |
| `/api/analyze/entities` | GET | Extract entities |
| `/api/analyze/style-analysis` | GET | Style analysis |
| `/api/enhance/suggestions` | POST | Get enhancement suggestions |
| `/api/enhance/readability` | POST | Readability scores |
| `/api/transform/style` | POST | Transform text style |
| `/api/transform/diff` | GET | Compare original vs transformed |

## Technology Stack

- **Backend**: Python, FastAPI, spaCy, NetworkX
- **Frontend**: Next.js, React, TipTap, Tailwind CSS
- **Architecture**: Custom NLP pipeline with minimal external dependencies

## Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed breakdown of custom-built vs external components.

## License

MIT
