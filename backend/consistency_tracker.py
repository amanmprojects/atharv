"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: consistency_tracker.py - Semantic & narrative consistency checking

Upgraded to fully leverage sentence-transformers (all-MiniLM-L6-v2) when
available, with adaptive thresholds, redundancy detection, global
coherence tracking, and improved tense/name-variant analysis.

Fallback: TF-IDF cosine similarity when sentence-transformers is absent.
"""

import re
import math
from collections import defaultdict, Counter


class SemanticConsistencyTracker:
    """
    Tracks semantic consistency across paragraphs using sentence embeddings.

    Uses sentence-transformers if available, falls back to TF-IDF cosine
    similarity for environments without GPU/heavy dependencies.

    Detects:
    - Abrupt topic shifts between paragraphs
    - Gradual topic drift from the document centroid
    - Near-duplicate / overly repetitive paragraphs
    - Inconsistent terminology (character name spelling variants)
    - Tense inconsistencies
    """

    def __init__(self, similarity_threshold=0.25):
        self.threshold = similarity_threshold
        self.model = None
        self.use_transformer = False
        self._load_model()

    def _load_model(self):
        """Try to load sentence-transformers, fall back to TF-IDF."""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.use_transformer = True
            print("[ConsistencyTracker] Loaded sentence-transformers model")
        except Exception:
            self.use_transformer = False
            print("[ConsistencyTracker] sentence-transformers not found - using TF-IDF fallback")

    def analyze(self, text):
        """
        Analyze semantic consistency across all paragraphs.

        Returns:
            dict with issues, similarity scores per paragraph pair
        """
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        if len(paragraphs) < 2:
            return {'issues': [], 'similarity_scores': [], 'paragraphs': paragraphs,
                    'avg_similarity': 0}

        issues = []

        if self.use_transformer:
            similarity_scores, embeddings = self._transformer_similarity(paragraphs)
        else:
            similarity_scores = self._tfidf_similarity(paragraphs)
            embeddings = None

        threshold = self._adaptive_threshold(similarity_scores)

        for i, sim in enumerate(similarity_scores):
            if sim < threshold:
                severity = 'high' if sim < threshold * 0.5 else 'medium' if sim < threshold * 0.8 else 'low'
                issues.append({
                    'type'      : 'semantic_shift',
                    'category'  : 'Consistency',
                    'paragraphs': (i + 1, i + 2),
                    'similarity': round(sim, 3),
                    'message'   : (f'Abrupt topic shift between paragraphs {i+1} and {i+2} '
                                   f'(similarity: {sim:.2f})'),
                    'suggestion': self._shift_suggestion(i, paragraphs),
                    'severity'  : severity,
                })

        redundancy_issues = self._check_redundancy(similarity_scores, paragraphs)
        issues.extend(redundancy_issues)

        if embeddings is not None:
            drift_issues = self._check_global_drift(embeddings, paragraphs)
            issues.extend(drift_issues)

        tense_issues = self._check_tense_consistency(paragraphs)
        issues.extend(tense_issues)

        name_issues = self._check_name_variants(text)
        issues.extend(name_issues)

        return {
            'issues'           : issues,
            'similarity_scores': similarity_scores,
            'paragraphs'       : paragraphs,
            'avg_similarity'   : round(sum(similarity_scores) / max(len(similarity_scores), 1), 3),
        }

    def _transformer_similarity(self, paragraphs):
        """Compute cosine similarity between consecutive paragraphs using embeddings."""
        embeddings = self.model.encode(paragraphs, normalize_embeddings=True,
                                       show_progress_bar=False)
        scores = []
        for i in range(len(embeddings) - 1):
            cos_sim = self._cosine(embeddings[i], embeddings[i + 1])
            scores.append(max(0.0, cos_sim))
        return scores, embeddings

    def _tfidf_similarity(self, paragraphs):
        """TF-IDF based cosine similarity (fallback, no ML needed)."""
        def tokenize(text):
            return re.findall(r'\b\w+\b', text.lower())

        def tfidf_vector(tokens, idf):
            tf = Counter(tokens)
            return {w: tf[w] * idf.get(w, 1) for w in tokens}

        def dot(a, b):
            return sum(a.get(k, 0) * b.get(k, 0) for k in a)

        def norm(v):
            return math.sqrt(sum(x ** 2 for x in v.values()))

        all_tokens = [tokenize(p) for p in paragraphs]
        vocab = set(w for tokens in all_tokens for w in tokens)

        doc_freq = defaultdict(int)
        for tokens in all_tokens:
            for w in set(tokens):
                doc_freq[w] += 1

        N = len(paragraphs)
        idf = {w: math.log(N / (1 + doc_freq[w])) for w in vocab}

        vectors = [tfidf_vector(tokens, idf) for tokens in all_tokens]

        scores = []
        for i in range(len(vectors) - 1):
            a, b = vectors[i], vectors[i + 1]
            na, nb = norm(a), norm(b)
            if na == 0 or nb == 0:
                scores.append(0.0)
            else:
                scores.append(max(0.0, dot(a, b) / (na * nb)))
        return scores

    def _cosine(self, a, b):
        import numpy as np
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))

    def _adaptive_threshold(self, scores):
        """Compute a threshold relative to the document's own similarity distribution."""
        if not scores:
            return self.threshold
        median = sorted(scores)[len(scores) // 2]
        adaptive = min(median * 0.6, self.threshold)
        return max(adaptive, 0.08)

    def _shift_suggestion(self, transition_index, paragraphs):
        """Generate a context-aware suggestion for a detected topic shift."""
        if transition_index + 1 >= len(paragraphs):
            return 'Consider adding a transitional sentence to connect these sections.'
        prev_words = set(re.findall(r'\b\w+\b', paragraphs[transition_index].lower()))
        next_words = set(re.findall(r'\b\w+\b', paragraphs[transition_index + 1].lower()))
        shared = (prev_words & next_words) - {'the', 'a', 'an', 'and', 'or', 'but', 'in',
                                                'on', 'at', 'to', 'is', 'was', 'of', 'for',
                                                'it', 'he', 'she', 'they', 'with', 'that',
                                                'this', 'from', 'as', 'by', 'not', 'had',
                                                'have', 'has', 'are', 'were', 'been'}
        if shared:
            bridge = ', '.join(list(shared)[:3])
            return (f'These paragraphs share concepts ({bridge}) but shift abruptly. '
                    f'Add a bridging sentence that connects the ideas.')
        return ('These paragraphs cover very different topics. '
                'Consider adding a transitional sentence or reordering for smoother flow.')

    def _check_redundancy(self, similarity_scores, paragraphs):
        """Flag consecutive paragraphs that are suspiciously similar (near-duplicates)."""
        issues = []
        redundancy_threshold = 0.92 if self.use_transformer else 0.85
        for i, sim in enumerate(similarity_scores):
            if sim > redundancy_threshold:
                issues.append({
                    'type'      : 'redundancy',
                    'category'  : 'Consistency',
                    'paragraphs': (i + 1, i + 2),
                    'similarity': round(sim, 3),
                    'message'   : (f'Paragraphs {i+1} and {i+2} are very similar '
                                   f'(similarity: {sim:.2f}) and may be redundant.'),
                    'suggestion': 'Merge these paragraphs or differentiate their content to avoid repetition.',
                    'severity'  : 'medium',
                })
        return issues

    def _check_global_drift(self, embeddings, paragraphs):
        """
        Detect paragraphs that drift far from the document's semantic centroid.
        Only available when sentence-transformers embeddings are provided.
        """
        import numpy as np
        issues = []
        centroid = np.mean(embeddings, axis=0)
        centroid_norm = centroid / (np.linalg.norm(centroid) + 1e-8)

        distances = []
        for emb in embeddings:
            emb_norm = emb / (np.linalg.norm(emb) + 1e-8)
            distances.append(float(np.dot(emb_norm, centroid_norm)))

        if len(distances) < 3:
            return issues

        mean_dist = sum(distances) / len(distances)
        std_dist = math.sqrt(sum((d - mean_dist) ** 2 for d in distances) / len(distances))
        drift_cutoff = mean_dist - 1.5 * max(std_dist, 0.05)

        for i, dist in enumerate(distances):
            if dist < drift_cutoff:
                issues.append({
                    'type'      : 'global_drift',
                    'category'  : 'Consistency',
                    'paragraphs': (i + 1,),
                    'similarity': round(dist, 3),
                    'message'   : (f'Paragraph {i+1} drifts significantly from the '
                                   f'overall document theme (coherence: {dist:.2f}).'),
                    'suggestion': ('This paragraph feels thematically disconnected. '
                                   'Tie it back to the central narrative or consider moving it.'),
                    'severity'  : 'low',
                })
        return issues

    def _check_tense_consistency(self, paragraphs):
        """Detect paragraphs that switch between past and present tense."""
        past_keywords = {
            'was', 'were', 'had', 'did', 'said', 'went', 'came', 'took',
            'knew', 'thought', 'felt', 'saw', 'heard', 'told', 'found',
            'gave', 'made', 'stood', 'ran', 'fell', 'left', 'called',
            'began', 'seemed', 'kept', 'brought', 'lost', 'held',
        }
        present_keywords = {
            'is', 'are', 'has', 'does', 'says', 'goes', 'comes', 'takes',
            'knows', 'thinks', 'feels', 'sees', 'hears', 'tells', 'finds',
            'gives', 'makes', 'stands', 'runs', 'falls', 'leaves', 'calls',
            'begins', 'seems', 'keeps', 'brings', 'loses', 'holds',
        }

        issues = []
        para_tenses = []

        for para in paragraphs:
            words = re.findall(r"\b\w+\b", para.lower())
            past_count = sum(1 for w in words if w in past_keywords)
            present_count = sum(1 for w in words if w in present_keywords)
            ed_endings = len(re.findall(r'\b\w+ed\b', para.lower()))
            past_count += ed_endings * 0.5

            if past_count > present_count * 1.3:
                tense = 'past'
            elif present_count > past_count * 1.3:
                tense = 'present'
            else:
                tense = 'mixed'
            para_tenses.append(tense)

        for i in range(1, len(para_tenses)):
            if (para_tenses[i] != para_tenses[i - 1]
                    and para_tenses[i] != 'mixed'
                    and para_tenses[i - 1] != 'mixed'):
                issues.append({
                    'type'      : 'tense_shift',
                    'category'  : 'Consistency',
                    'paragraphs': (i, i + 1),
                    'message'   : (f'Tense shift: paragraph {i} is {para_tenses[i-1]} tense '
                                   f'but paragraph {i+1} switches to {para_tenses[i]} tense.'),
                    'suggestion': 'Maintain consistent tense throughout your narrative unless '
                                  'the shift is intentional (e.g. flashback).',
                    'severity'  : 'medium',
                })

        return issues

    def _check_name_variants(self, text):
        """Detect potential name spelling variants (e.g., 'Jon' vs 'John')."""
        words = re.findall(r'\b[A-Z][a-z]+\b', text)
        name_counts = Counter(words)

        issues = []
        common_names = {name for name, count in name_counts.items() if count >= 2}

        for name, count in name_counts.items():
            if count == 1:
                for common in common_names:
                    if name != common and self._edit_distance(name, common) <= 2:
                        issues.append({
                            'type'      : 'name_variant',
                            'category'  : 'Consistency',
                            'message'   : (f"'{name}' appears once — did you mean '{common}' "
                                           f"(appears {name_counts[common]}x)?"),
                            'suggestion': f"Check if '{name}' and '{common}' refer to the same character.",
                            'severity'  : 'low',
                        })
                        break

        return issues

    def _edit_distance(self, a, b):
        """Levenshtein distance between two strings."""
        m, n = len(a), len(b)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                cost = 0 if a[i - 1] == b[j - 1] else 1
                dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        return dp[m][n]
