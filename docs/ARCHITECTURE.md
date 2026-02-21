# AI Writer - Architecture Documentation

## Overview

AI Writer is an intelligent writing assistant designed to enhance narrative content through entity tracking, consistency checking, style transformation, and clarity analysis. This document outlines which components are custom-built versus externally sourced.

---

## Component Breakdown

### 1. Entity Tracker (`backend/app/core/entity_tracker.py`)

| Sub-component | Custom-Built | External |
|---------------|--------------|----------|
| Entity extraction patterns | ✅ Custom regex patterns for character names, locations, dates | |
| Entity merging logic | ✅ Custom deduplication and alias detection | |
| Knowledge graph construction | ✅ Custom graph building with NetworkX | NetworkX library |
| Relationship extraction | ✅ Custom pattern matching for relationship types | |
| Attribute extraction | ✅ Custom patterns for age, hair color, eye color, etc. | |
| NLP parsing (optional) | | spaCy NER model (optional enhancement) |

**Custom Logic Highlights:**
- `extract_entities()`: Regex-based entity extraction with fallback when spaCy unavailable
- `build_entity_graph()`: Constructs directed graph of entities and relationships
- `_extract_relationships()`: Detects relationships between entities based on proximity and text patterns
- `get_entity_attributes()`: Extracts character attributes using custom patterns

---

### 2. Consistency Checker (`backend/app/core/consistency_checker.py`)

| Sub-component | Custom-Built | External |
|---------------|--------------|----------|
| Name consistency checker | ✅ Custom variant detection algorithm | |
| Attribute contradiction detector | ✅ Custom attribute tracking and comparison | |
| Pronoun reference checker | ✅ Custom antecedent resolution | |
| Temporal consistency checker | ✅ Custom timeline analysis | |

**Custom Logic Highlights:**
- `_check_name_consistency()`: Detects multiple name variants for same entity
- `_check_attribute_consistency()`: Tracks entity attributes over time, detects contradictions
- `_check_pronoun_references()`: Identifies ambiguous pronouns without clear antecedents
- `_check_temporal_consistency()`: Analyzes time markers for logical flow

---

### 3. Style Engine (`backend/app/core/style_engine.py`)

| Sub-component | Custom-Built | External |
|---------------|--------------|----------|
| Formal-to-casual mappings | ✅ Custom contraction and word mappings | |
| Casual-to-formal mappings | ✅ Custom expansion and formal word list | |
| Sentence transformation rules | ✅ Custom pattern-based restructuring | |
| Style analysis algorithm | ✅ Custom formality scoring | |
| Intensity control | ✅ Custom graduated transformation | |

**Custom Logic Highlights:**
- `transform()`: Orchestrates style transformation with intensity control
- `_to_casual()`: Applies contractions, simplifies vocabulary
- `_to_formal()`: Expands contractions, formalizes sentence structure
- `get_style_analysis()`: Calculates formality score based on multiple factors
- `_calculate_formality_score()`: Weighted scoring algorithm

---

### 4. Clarity Analyzer (`backend/app/core/clarity_analyzer.py`)

| Sub-component | Custom-Built | External |
|---------------|--------------|----------|
| Syllable counting | ✅ Custom syllable estimation algorithm | |
| Readability formulas | ✅ Custom implementation of Flesch-Kincaid, Gunning Fog | Formula references |
| Passive voice detector | ✅ Custom regex patterns | |
| Flow analyzer | ✅ Custom transition word detection and coherence scoring | |
| Clarity issue detector | ✅ Custom vague word, cliché, repetition detection | |

**Custom Logic Highlights:**
- `_count_syllables()`: Algorithm for estimating syllables without dictionary
- `_calculate_readability()`: Implements standard readability formulas
- `_analyze_flow()`: Detects transition words and calculates flow quality
- `_detect_clarity_issues()`: Identifies vague words, clichés, long sentences, repetition
- `_generate_suggestions()`: Creates actionable improvement suggestions

---

### 5. API Layer (`backend/app/routers/`)

| Sub-component | Custom-Built | External |
|---------------|--------------|----------|
| Route handlers | ✅ Custom endpoint logic | FastAPI framework |
| Request/response schemas | ✅ Custom Pydantic models | Pydantic library |
| Error handling | ✅ Custom error responses | |
| Pipeline orchestration | ✅ Custom module coordination | |

---

### 6. Frontend (`frontend/src/`)

| Sub-component | Custom-Built | External |
|---------------|--------------|----------|
| Editor component | ✅ Custom TipTap integration | TipTap editor |
| Entity sidebar | ✅ Custom React component | React, Lucide icons |
| Suggestion panel | ✅ Custom React component | |
| Diff modal | ✅ Custom React component | diff library |
| API client | ✅ Custom fetch wrappers | |
| Page layout | ✅ Custom responsive design | Tailwind CSS |

---

## Data Flow

```
User Input (Frontend)
        │
        ▼
    API Gateway (FastAPI)
        │
        ├──► Entity Tracker
        │         │
        │         ├── Extract entities (custom regex/spaCy)
        │         ├── Build knowledge graph (custom + NetworkX)
        │         └── Extract attributes (custom patterns)
        │
        ├──► Consistency Checker
        │         │
        │         ├── Check name variants (custom)
        │         ├── Check attribute contradictions (custom)
        │         └── Check pronoun references (custom)
        │
        ├──► Style Engine
        │         │
        │         ├── Apply transformation rules (custom)
        │         ├── Adjust intensity (custom)
        │         └── Calculate formality score (custom)
        │
        └──► Clarity Analyzer
                  │
                  ├── Calculate readability (custom formulas)
                  ├── Analyze flow (custom transition detection)
                  └── Detect issues (custom pattern matching)
        │
        ▼
Aggregated Response (Frontend)
```

---

## External Dependencies Summary

### Backend
| Package | Purpose | License |
|---------|---------|---------|
| FastAPI | Web framework | MIT |
| Pydantic | Data validation | MIT |
| spaCy | NLP (optional enhancement) | MIT |
| NetworkX | Graph data structure | BSD-3 |
| uvicorn | ASGI server | BSD-3 |

### Frontend
| Package | Purpose | License |
|---------|---------|---------|
| Next.js | React framework | MIT |
| TipTap | Rich text editor | MIT |
| Tailwind CSS | Styling | MIT |
| Lucide React | Icons | ISC |

---

## Innovation Highlights

1. **Rule-Based Style Transformation**: Unlike LLM-based approaches, our style engine uses deterministic rules for predictable, controllable output.

2. **Entity Knowledge Graph**: Custom-built graph structure tracks narrative entities without requiring pre-trained models.

3. **Consistency Detection**: Novel approach to detecting narrative inconsistencies through attribute tracking and temporal analysis.

4. **Explainable Changes**: Every transformation includes clear explanations of what changed and why.

5. **Intensity Control**: Graduated style transformation allows fine-grained control over output.

---

## LLM Usage Policy Compliance

This solution adheres to the hackathon LLM usage policy:

- ✅ Minimal LLM dependency (spaCy is optional, regex fallback included)
- ✅ Core logic is custom-designed and implemented
- ✅ All pipelines are custom-built
- ✅ Clear documentation of custom vs external components
- ✅ Solution is not primarily prompt engineering

The only external AI component is the optional spaCy NER model, which can be replaced with the built-in regex patterns for a fully deterministic solution.
