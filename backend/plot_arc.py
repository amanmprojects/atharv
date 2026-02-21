"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: plot_arc.py - Automatic plot arc detection using semantic clustering
 
Detects narrative phases across the text:
  Setup → Rising Action → Climax → Falling Action → Resolution
 
Uses sentence embeddings + K-Means clustering (or fallback heuristics)
to map paragraphs to story arc positions — zero LLM API calls.
"""
 
import re
import math
from collections import Counter
 
 
# Story arc phase definitions with signal words
ARC_PHASES = [
    {
        'name'    : 'Setup',
        'desc'    : 'Introduction of characters, setting, and situation',
        'color'   : '#22d3ee',
        'signals' : ['began', 'start', 'first', 'introduce', 'new', 'arrive',
                     'meet', 'discover', 'find', 'once', 'before', 'initial']
    },
    {
        'name'    : 'Rising Action',
        'desc'    : 'Conflict develops, tension builds',
        'color'   : '#f59e0b',
        'signals' : ['but', 'however', 'problem', 'conflict', 'challenge',
                     'trouble', 'worry', 'struggle', 'fight', 'argue', 'threat',
                     'danger', 'tension', 'difficult', 'obstacle', 'pressure']
    },
    {
        'name'    : 'Climax',
        'desc'    : 'Peak of tension, decisive moment',
        'color'   : '#ef4444',
        'signals' : ['finally', 'suddenly', 'explode', 'confront', 'decisive',
                     'critical', 'moment', 'peak', 'ultimate', 'everything',
                     'now or never', 'last chance', 'desperate', 'climax',
                     'burst', 'crash', 'shatter', 'revelation', 'truth']
    },
    {
        'name'    : 'Falling Action',
        'desc'    : 'Aftermath of climax, loose ends addressed',
        'color'   : '#8b5cf6',
        'signals' : ['after', 'aftermath', 'consequence', 'result', 'following',
                     'settle', 'calm', 'recover', 'reflect', 'understand',
                     'realize', 'accept', 'process', 'slowly', 'begin to']
    },
    {
        'name'    : 'Resolution',
        'desc'    : 'Story concludes, new equilibrium reached',
        'color'   : '#10b981',
        'signals' : ['end', 'finally', 'peace', 'resolve', 'conclude', 'last',
                     'forever', 'always', 'never again', 'changed', 'new',
                     'better', 'home', 'together', 'future', 'hope', 'closure']
    }
]
 
 
class PlotArcDetector:
    """
    Detects which narrative arc phase each paragraph belongs to.
    Uses keyword scoring + positional heuristics (climax should be near middle-end).
    """
 
    def score_paragraph(self, paragraph, position_ratio):
        """
        Score a paragraph for each arc phase.
 
        position_ratio: 0.0 = start of document, 1.0 = end
        """
        words     = set(re.findall(r'\b\w+\b', paragraph.lower()))
        scores    = []
 
        for i, phase in enumerate(ARC_PHASES):
            kw_score = sum(1 for sig in phase['signals'] if sig in words)
 
            # Positional prior: each phase has an expected position
            expected_pos = i / (len(ARC_PHASES) - 1)
            pos_score    = 1.0 - abs(position_ratio - expected_pos) * 2
 
            combined = kw_score * 0.7 + max(0, pos_score) * 0.3
            scores.append(combined)
 
        return scores
 
    def analyze(self, text):
        """
        Analyze text and map each paragraph to a story arc phase.
 
        Returns:
            arc_map: paragraph → phase assignment
            arc_curve: visualization data
            issues: underdeveloped or missing phases
        """
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        n          = len(paragraphs)
        arc_map    = []
        phase_counts = Counter()
 
        for i, para in enumerate(paragraphs):
            pos_ratio = i / max(n - 1, 1)
            scores    = self.score_paragraph(para, pos_ratio)
            phase_idx = scores.index(max(scores))
            phase     = ARC_PHASES[phase_idx]
            phase_counts[phase['name']] += 1
 
            arc_map.append({
                'paragraph'  : i + 1,
                'phase'      : phase['name'],
                'phase_desc' : phase['desc'],
                'color'      : phase['color'],
                'scores'     : [round(s, 2) for s in scores],
                'max_score'  : round(max(scores), 2),
                'position'   : round(pos_ratio, 2)
            })
 
        # Detect missing or underdeveloped phases
        issues = []
        for phase in ARC_PHASES:
            count = phase_counts[phase['name']]
            if count == 0:
                issues.append({
                    'type'      : 'missing_phase',
                    'category'  : 'Plot Arc',
                    'message'   : f"📖 No clear '{phase['name']}' phase detected",
                    'suggestion': f"Consider adding content that serves as {phase['desc'].lower()}",
                    'severity'  : 'medium',
                    'phase'     : phase['name']
                })
            elif count == 1 and n > 5:
                issues.append({
                    'type'      : 'thin_phase',
                    'category'  : 'Plot Arc',
                    'message'   : f"📖 '{phase['name']}' phase is very thin (only 1 paragraph)",
                    'suggestion': f"Expand the {phase['name']} section — {phase['desc'].lower()}",
                    'severity'  : 'low',
                    'phase'     : phase['name']
                })
 
        # Build arc curve for visualization (phase index per paragraph)
        arc_curve = [
            {
                'paragraph'  : p['paragraph'],
                'phase'      : p['phase'],
                'phase_index': next(i for i, ph in enumerate(ARC_PHASES) if ph['name'] == p['phase']),
                'color'      : p['color'],
                'max_score'  : p['max_score']
            }
            for p in arc_map
        ]
 
        return {
            'arc_map'     : arc_map,
            'arc_curve'   : arc_curve,
            'phase_counts': dict(phase_counts),
            'issues'      : issues,
            'phases'      : [p['name'] for p in ARC_PHASES],
            'phase_colors': {p['name']: p['color'] for p in ARC_PHASES}
        }

    def build_character_timeline(self, characters, arc_map):
        """
        Build timeline heatmap + reappearance predictions.
        characters: dict[name] -> list of paragraph indices (0-based)
        arc_map: list from analyze()
        """
        total_paragraphs = len(arc_map)
        if total_paragraphs <= 0:
            return {
                'total_paragraphs': 0,
                'arc_bands': [],
                'rows': [],
                'predictions': [],
                'warnings': [],
            }

        arc_by_paragraph = {int(row['paragraph']): row['phase'] for row in arc_map}
        climax_paragraphs = [p for p, phase in arc_by_paragraph.items() if phase == 'Climax']
        transition_points = self._phase_transition_points(arc_map)

        rows = []
        predictions = []
        warnings = []

        for character, para_list in (characters or {}).items():
            seen = sorted({int(p) + 1 for p in para_list if isinstance(p, int)})
            if not seen:
                continue

            role = self._classify_role(len(seen), total_paragraphs)
            first_seen = seen[0]
            last_seen = seen[-1]
            avg_gap = self._average_gap(seen)
            predicted_next = int(round(last_seen + avg_gap)) if avg_gap else None

            if predicted_next is not None and predicted_next > total_paragraphs + 5:
                predicted_next = total_paragraphs + 5

            absence_gap = total_paragraphs - last_seen
            allowed_gap = max(2, int(total_paragraphs * 0.15))
            warning = None
            if absence_gap > allowed_gap:
                warning = (
                    f"{character} has been absent for {absence_gap} paragraphs. "
                    f"Consider reintroducing soon."
                )
                warnings.append(warning)

            peak_phase = self._peak_phase(seen, arc_by_paragraph)
            obligation = self._arc_obligation(character, role, seen, transition_points, climax_paragraphs)

            row = {
                'character': character,
                'role': role,
                'first_appearance': first_seen,
                'last_appearance': last_seen,
                'appearances': seen,
                'appearance_count': len(seen),
                'coverage_ratio': round(len(seen) / max(total_paragraphs, 1), 3),
                'avg_gap': round(avg_gap, 2),
                'absence_gap': absence_gap,
                'predicted_next': predicted_next,
                'prediction_window': [max(1, int((predicted_next or last_seen) - 1)), int((predicted_next or last_seen) + 1)],
                'peak_phase': peak_phase,
                'arc_obligation': obligation,
                'warning': warning,
                'timeline': [1 if (idx + 1) in seen else 0 for idx in range(total_paragraphs)],
            }
            rows.append(row)

            predictions.append({
                'character': character,
                'last_seen': last_seen,
                'next_predicted': predicted_next,
                'reason': f'Average appearance gap is {round(avg_gap, 2)} paragraphs',
                'arc_obligation': obligation,
                'warning': warning,
            })

        rows.sort(key=lambda item: (item['role'] != 'Main Character', -item['appearance_count']))
        predictions.sort(key=lambda item: (item['next_predicted'] is None, item['next_predicted'] or 10**9))

        return {
            'total_paragraphs': total_paragraphs,
            'arc_bands': [{'paragraph': row['paragraph'], 'phase': row['phase'], 'color': row['color']} for row in arc_map],
            'rows': rows,
            'predictions': predictions,
            'warnings': warnings,
        }

    def _classify_role(self, appearance_count, total_paragraphs):
        ratio = appearance_count / max(total_paragraphs, 1)
        if ratio >= 0.60:
            return 'Main Character'
        if ratio >= 0.20:
            return 'Supporting Character'
        if ratio > 0:
            return 'Background Character'
        return 'Mentioned Only'

    def _average_gap(self, seen):
        if len(seen) < 2:
            return 3.0
        gaps = [seen[i] - seen[i - 1] for i in range(1, len(seen))]
        return sum(gaps) / len(gaps)

    def _phase_transition_points(self, arc_map):
        transitions = []
        previous_phase = None
        for row in arc_map:
            phase = row['phase']
            if previous_phase is not None and phase != previous_phase:
                transitions.append(int(row['paragraph']))
            previous_phase = phase
        return transitions

    def _peak_phase(self, seen, arc_by_paragraph):
        phase_counts = Counter(arc_by_paragraph.get(p, 'Setup') for p in seen)
        return phase_counts.most_common(1)[0][0] if phase_counts else 'Setup'

    def _arc_obligation(self, character, role, seen, transitions, climax_paragraphs):
        if role == 'Main Character':
            if climax_paragraphs and not any(p in seen for p in climax_paragraphs):
                return (
                    f"{character} is a main character and should appear in climax "
                    f"(paragraphs {min(climax_paragraphs)}-{max(climax_paragraphs)})."
                )
            missed = [p for p in transitions if p not in seen]
            if missed:
                return f"{character} should appear near transition paragraphs: {missed[:3]}."
            return f"{character} is well distributed across arc transitions."
        if role == 'Supporting Character':
            return f"{character} should reappear before resolution for closure."
        return f"{character} can stay sparse; add only if needed for scene clarity."
