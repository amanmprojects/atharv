"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: backend/main.py - COMPLETE FastAPI backend with ALL 8 unique features
 
Run with:
    uvicorn main:app --reload --port 8000
"""
 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys, os, random, re, warnings

# Suppress annoying huggingface_hub warnings until they update their internal calls
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub")
 
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
 
from character_graph     import CharacterGraph
from consistency_tracker import SemanticConsistencyTracker
from text_analyzer       import StructureAnalyzer, ShowDontTellDetector, PacingAnalyzer
from style_transformer   import StyleTransformer, ExplainabilityEngine
from dialogue_voice      import DialogueVoiceChecker
from genre_detector      import GenreDetector
from plot_arc            import PlotArcDetector
from llm_verifier        import MinimalLLMVerifier
from context_manager     import ContextManager
from trend_matcher       import match_trends
from image_generator     import build_scene_cards
 
app = FastAPI(title="AI Writer — DevHacks 2026", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)
 
_consistency = SemanticConsistencyTracker()
_structure   = StructureAnalyzer()
_show_tell   = ShowDontTellDetector()
_pacing      = PacingAnalyzer()
_transformer = StyleTransformer()
_explainer   = ExplainabilityEngine()
_dialogue    = DialogueVoiceChecker()
_genre       = GenreDetector()
_plot_arc    = PlotArcDetector()
_context_mgr = ContextManager()
USE_LLM_REVIEW = os.getenv("USE_LLM_REVIEW", "false").lower() == "true"
LLM_REVIEW_MODEL = os.getenv("LLM_REVIEW_MODEL", "qwen2.5:14b")
LLM_REVIEW_ENDPOINT = os.getenv("LLM_REVIEW_ENDPOINT", "http://127.0.0.1:11434/api/generate")
LLM_REVIEW_SHARE = min(max(float(os.getenv("LLM_REVIEW_SHARE", "0.2")), 0.0), 0.2)
LLM_REVIEW_MAX_ISSUES = max(int(os.getenv("LLM_REVIEW_MAX_ISSUES", "8")), 0)
_llm_verifier = (
    MinimalLLMVerifier(
        model=LLM_REVIEW_MODEL,
        endpoint=LLM_REVIEW_ENDPOINT,
        max_review_issues=LLM_REVIEW_MAX_ISSUES,
    )
    if USE_LLM_REVIEW
    else None
)
 
 
class AnalyzeRequest(BaseModel):
    text                : str
    target_style        : Optional[str]   = "formal"
    similarity_threshold: Optional[float] = 0.25
    context             : Optional[Dict[str, Any]] = None
    image_mode          : Optional[str] = "mock"
    art_style           : Optional[str] = "cinematic"
 
 
@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if not req.text or len(req.text.strip()) < 2:
        raise HTTPException(status_code=400, detail="Text is empty")
    try:
        text       = req.text
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        context = _context_mgr.normalize(req.context or {})
        pacing_target = _context_mgr.pacing_target(context)
        show_tell_policy = _context_mgr.show_tell_policy(context)
        inferred_style = _context_mgr.style_hint(context)
        style_choice = req.target_style or inferred_style
 
        cg              = CharacterGraph()
        char_result     = cg.process_text(paragraphs)
        consistency_res = _consistency.analyze(text)
        structure_res   = _structure.analyze(text)
        show_tell_res   = _show_tell.analyze(text, policy=show_tell_policy)
        pacing_res      = _pacing.analyze(text, target_band=pacing_target)
        style_res       = _transformer.transform(text, style_choice)
        dialogue_res    = _dialogue.analyze(text)
        genre_res       = _genre.analyze(text)
        plot_arc_res    = _plot_arc.analyze(text)
        timeline_res    = _plot_arc.build_character_timeline(
            char_result.get('characters', {}),
            plot_arc_res.get('arc_map', []),
        )
        market_trends   = match_trends(
            genre=genre_res.get('dominant_genre', 'unknown'),
            text=text,
            pacing_rows=pacing_res.get('pacing', []),
            genre_rows=genre_res.get('per_paragraph', []),
            dialogue_profiles=dialogue_res.get('profiles', {}),
            context=context,
        )
        art_style = (req.art_style or context.get("tone", {}).get("art_style") or "cinematic").strip().lower()
        image_mode = (req.image_mode or "mock").strip().lower()
        illustrations = build_scene_cards(
            paragraphs=paragraphs,
            pacing_rows=pacing_res.get('pacing', []),
            dominant_genre=genre_res.get('dominant_genre', 'unknown'),
            art_style=art_style,
            character_summary=cg.get_character_summary(),
            mode=image_mode,
        )
 
        all_issues = []
        all_issues.extend(char_result.get('issues', []))
        all_issues.extend(consistency_res.get('issues', []))
        all_issues.extend(structure_res.get('issues', []))
        all_issues.extend(show_tell_res)
        all_issues.extend(dialogue_res.get('issues', []))
        all_issues.extend(genre_res.get('drift_issues', []))
        all_issues.extend(plot_arc_res.get('issues', []))
        all_issues.extend([{**s,'category':'Pacing','issue':s['message']} for s in pacing_res.get('suggestions',[])])
        all_issues.extend([
            {
                'category': 'Character Timeline',
                'severity': 'medium',
                'message': row['warning'],
                'suggestion': f"Reintroduce {row['character']} near paragraph {row['prediction_window'][0]}-{row['prediction_window'][1]}.",
            }
            for row in timeline_res.get('rows', [])
            if row.get('warning')
        ])
        all_issues.extend([
            {
                'category': 'Market Trends',
                'severity': 'low',
                'message': gap,
                'suggestion': 'Consider this change if it fits your story intent and voice.',
            }
            for gap in market_trends.get('gaps', [])[:3]
        ])
        all_issues.extend(_input_quality_checks(text, paragraphs))
 
        sev = {'high':0,'medium':1,'low':2}
        all_issues.sort(key=lambda x: sev.get(x.get('severity','low'), 2))

        llm_meta = {
            'enabled': USE_LLM_REVIEW,
            'target_share': LLM_REVIEW_SHARE,
            'actual_share': 0.0,
            'reviewed_target': 0,
            'applied_reviews': 0,
            'calls': 0,
            'model': None,
            'error': None,
        }

        # Optional, budgeted LLM refinement (max 20% of issues).
        if USE_LLM_REVIEW and _llm_verifier is not None:
            selected_pairs = _select_issues_for_llm(all_issues)
            llm_meta['reviewed_target'] = len(selected_pairs)

            if selected_pairs:
                subset = [issue for _, issue in selected_pairs]
                index_map = [idx for idx, _ in selected_pairs]
                try:
                    llm_result = _llm_verifier.review_once(text, subset)
                    llm_meta['calls'] = int(llm_result.get('calls_made', 1))
                    llm_meta['model'] = llm_result.get('model', LLM_REVIEW_MODEL)
                    applied = 0

                    for review in llm_result.get('reviews', []):
                        idx = review.get('index')
                        if not isinstance(idx, int) or idx < 0 or idx >= len(index_map):
                            continue
                        full_idx = index_map[idx]
                        confidence = review.get('confidence', 'medium')
                        _blend_issue_severity(all_issues[full_idx], confidence)
                        all_issues[full_idx]['llm_confidence'] = str(confidence).lower()
                        applied += 1

                    llm_meta['applied_reviews'] = applied
                except Exception as llm_err:
                    llm_meta['error'] = str(llm_err)[:240]

            llm_meta['actual_share'] = round(
                llm_meta['reviewed_target'] / max(len(all_issues), 1), 3
            )
            all_issues.sort(key=lambda x: sev.get(x.get('severity','low'), 2))
 
        report = {
            'total_issues'     : len(all_issues),
            'high_severity'    : sum(1 for i in all_issues if i.get('severity')=='high'),
            'medium_severity'  : sum(1 for i in all_issues if i.get('severity')=='medium'),
            'low_severity'     : sum(1 for i in all_issues if i.get('severity')=='low'),
            'all_issues'       : all_issues,
            'readability_score': structure_res.get('readability_score', 0),
            'word_count'       : structure_res.get('total_words', 0),
            'pipeline_mix'     : _pipeline_mix(llm_meta),
            'llm_review'       : llm_meta,
            'analysis_context' : _context_mgr.summarize(context),
            'context_adaptations': {
                'pacing_target': pacing_target,
                'show_dont_tell_policy': show_tell_policy,
                'style_selected': style_choice,
                'style_inferred': inferred_style,
                'image_mode': image_mode,
                'art_style': art_style,
            },
        }
 
        nodes, edges = _build_graph(char_result, cg, paragraphs)
 
        return {
            'characters'           : char_result.get('characters', {}),
            'character_issues'     : char_result.get('issues', []),
            'character_graph_nodes': nodes,
            'character_graph_edges': edges,
            'character_summary'    : cg.get_character_summary(),
            'consistency_issues'   : consistency_res.get('issues', []),
            'similarity_scores'    : consistency_res.get('similarity_scores', []),
            'avg_similarity'       : consistency_res.get('avg_similarity', 0),
            'structure_issues'     : structure_res.get('issues', []),
            'readability_score'    : structure_res.get('readability_score', 0),
            'avg_sentence_len'     : structure_res.get('avg_sentence_len', 0),
            'show_dont_tell_issues': show_tell_res,
            'pacing'               : pacing_res.get('pacing', []),
            'pacing_suggestions'   : pacing_res.get('suggestions', []),
            'style_result'         : {
                'enhanced'   : style_res.get('enhanced', text),
                'style'      : style_res.get('style', req.target_style),
                'description': style_res.get('description', ''),
                'change_log' : style_res.get('change_log', []),
                'num_changes': style_res.get('num_changes', 0),
                'diff'       : style_res.get('diff', []),
            },
            'dialogue_profiles'    : dialogue_res.get('profiles', {}),
            'dialogue_issues'      : dialogue_res.get('issues', []),
            'dialogue_map'         : dialogue_res.get('dialogues', {}),
            'dominant_genre'       : genre_res.get('dominant_genre', 'unknown'),
            'genre_color'          : genre_res.get('genre_color', '#64748b'),
            'genre_per_paragraph'  : genre_res.get('per_paragraph', []),
            'genre_drift_issues'   : genre_res.get('drift_issues', []),
            'genre_curve'          : genre_res.get('genre_curve', []),
            'top_genres'           : genre_res.get('top_genres', []),
            'arc_map'              : plot_arc_res.get('arc_map', []),
            'arc_curve'            : plot_arc_res.get('arc_curve', []),
            'phase_counts'         : plot_arc_res.get('phase_counts', {}),
            'arc_issues'           : plot_arc_res.get('issues', []),
            'phase_colors'         : plot_arc_res.get('phase_colors', {}),
            'character_timeline'   : timeline_res,
            'market_trends'        : market_trends,
            'illustrations'        : illustrations,
            'analysis_context'     : _context_mgr.summarize(context),
            'report'               : report,
            'enhanced_text'        : style_res.get('enhanced', text),
            'pipeline_mix'         : report['pipeline_mix'],
            'llm_review'           : llm_meta,
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
 
 
def _build_graph(char_result, cg, paragraphs):
    characters = char_result.get('characters', {})
    flagged    = {i['character'] for i in char_result.get('issues', [])}
    nodes = []

    if not characters:
        paragraph_count = max(len(paragraphs), 1)
        nodes.append({
            'id': 'Narrator',
            'name': 'Narrator',
            'val': paragraph_count * 3,
            'color': '#22d3ee',
            'paragraphs': list(range(paragraph_count)),
            'appearances': paragraph_count,
            'hasIssue': False,
            'locations': [],
            'emotions': [],
            'x': random.uniform(-120, 120),
            'y': random.uniform(-120, 120),
            'z': random.uniform(-120, 120),
        })
        return nodes, []

    for name, para_list in characters.items():
        summary = cg.get_character_summary().get(name, {})
        nodes.append({
            'id': name, 'name': name,
            'val': len(para_list) * 3,
            'color': '#ef4444' if name in flagged else '#22d3ee',
            'paragraphs': para_list,
            'appearances': len(para_list),
            'hasIssue': name in flagged,
            'locations': summary.get('locations_mentioned', []),
            'emotions': summary.get('emotional_states', []),
            'x': random.uniform(-200,200),
            'y': random.uniform(-200,200),
            'z': random.uniform(-200,200),
        })
    edges = []
    char_list = list(characters.keys())
    for i in range(len(char_list)):
        for j in range(i+1, len(char_list)):
            shared = set(characters[char_list[i]]) & set(characters[char_list[j]])
            if shared:
                edges.append({
                    'source': char_list[i], 'target': char_list[j],
                    'value': len(shared),
                    'color': '#f59e0b' if len(shared) > 2 else '#4b5563',
                    'label': f"Appear together in {len(shared)} paragraph(s)"
                })
    return nodes, edges


def _input_quality_checks(text, paragraphs):
    """
    Create baseline diagnostics so low-signal text still gets
    actionable feedback.
    """
    issues = []
    words = re.findall(r"\b\w+\b", text)
    alpha_words = [w for w in words if re.search(r"[A-Za-z]", w)]
    unique_words = set(w.lower() for w in alpha_words)
    lexical_diversity = len(unique_words) / max(len(alpha_words), 1)
    punctuation_count = len(re.findall(r"[.!?]", text))

    if len(paragraphs) < 2:
        issues.append({
            'category': 'Input Quality',
            'severity': 'medium',
            'message': 'Only one paragraph detected; arc and pacing analysis improves with multiple paragraphs.',
            'suggestion': 'Split the writing into 3+ paragraphs for stronger narrative analysis.'
        })

    if punctuation_count == 0:
        issues.append({
            'category': 'Input Quality',
            'severity': 'medium',
            'message': 'No sentence punctuation found, which reduces structure and style accuracy.',
            'suggestion': 'Add periods, question marks, or exclamation marks to mark sentence boundaries.'
        })

    if lexical_diversity < 0.30 and len(alpha_words) >= 8:
        issues.append({
            'category': 'Input Quality',
            'severity': 'low',
            'message': 'Very low lexical variety detected; text may be repetitive or noisy.',
            'suggestion': 'Use more distinct words and clearer sentence context to improve analysis precision.'
        })

    if len(alpha_words) < 8:
        issues.append({
            'category': 'Input Quality',
            'severity': 'medium',
            'message': 'Very little readable language detected; advanced modules may return minimal insights.',
            'suggestion': 'Provide a few complete natural-language sentences for full analysis coverage.'
        })

    return issues


def _select_issues_for_llm(all_issues):
    """
    Select only a small, high-value subset for optional LLM review.
    Enforces the 20% budget.
    """
    total = len(all_issues)
    if total == 0 or LLM_REVIEW_MAX_ISSUES <= 0 or LLM_REVIEW_SHARE <= 0:
        return []

    budget = int(total * LLM_REVIEW_SHARE)
    if budget <= 0:
        return []
    budget = min(budget, LLM_REVIEW_MAX_ISSUES)

    sev_rank = {'high': 0, 'medium': 1, 'low': 2}

    # Prefer core-analysis issues first, then input-quality meta issues.
    ranked = sorted(
        enumerate(all_issues),
        key=lambda pair: (
            pair[1].get('category') == 'Input Quality',
            sev_rank.get(pair[1].get('severity', 'low'), 2),
        ),
    )
    return ranked[:budget]


def _pipeline_mix(llm_meta):
    llm_share = min(max(float(llm_meta.get('actual_share', 0.0)), 0.0), 0.2)
    logic_share = round(1.0 - llm_share, 3)
    return {
        'custom_logic_share': logic_share,
        'llm_share': round(llm_share, 3),
        'policy': 'Custom logic dominant; LLM capped to <=20% review budget',
    }


def _blend_issue_severity(issue, confidence):
    confidence = str(confidence).lower()
    current = issue.get('severity', 'low')
    if confidence == 'high':
        return
    if confidence == 'medium':
        if current == 'high':
            issue['severity'] = 'medium'
        return
    if confidence == 'low':
        if current == 'high':
            issue['severity'] = 'medium'
        elif current == 'medium':
            issue['severity'] = 'low'
 
 
@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "modules": [
        "character_graph", "consistency_tracker", "structure_analyzer",
        "show_dont_tell", "pacing", "style_transformer",
        "dialogue_voice", "genre_detector", "plot_arc",
        "context_manager", "trend_matcher", "image_generator"
    ],
    "llm_review": {
        "enabled": USE_LLM_REVIEW,
        "model": LLM_REVIEW_MODEL if USE_LLM_REVIEW else None,
        "max_share": LLM_REVIEW_SHARE,
        "max_issues": LLM_REVIEW_MAX_ISSUES,
    }}
