"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: consistency_tracker.py - Semantic & narrative consistency checking
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
    - Inconsistent terminology (character name spelling variants)
    - Tense inconsistencies
    """
 
    def __init__(self, similarity_threshold=0.25):
        self.threshold = similarity_threshold
        self.model = None
        self._load_model()
 
    def _load_model(self):
        """Try to load sentence-transformers, fall back to TF-IDF."""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.use_transformer = True
            print("Loaded sentence-transformers model")
        except Exception:
            self.use_transformer = False
            print("sentence-transformers not found - using TF-IDF fallback")
 
    def analyze(self, text):
        """
        Analyze semantic consistency across all paragraphs.
        
        Returns:
            dict with issues, similarity scores per paragraph pair
        """
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        if len(paragraphs) < 2:
            return {'issues': [], 'similarity_scores': [], 'paragraphs': paragraphs}
 
        issues = []
 
        if self.use_transformer:
            similarity_scores = self._transformer_similarity(paragraphs)
        else:
            similarity_scores = self._tfidf_similarity(paragraphs)
 
        for i, sim in enumerate(similarity_scores):
            if sim < self.threshold:
                issues.append({
                    'type'      : 'semantic_shift',
                    'category'  : 'Consistency',
                    'paragraphs': (i + 1, i + 2),
                    'similarity': round(sim, 3),
                    'message'   : f'⚠️  Abrupt topic shift between paragraphs {i+1} and {i+2} '
                                  f'(similarity: {sim:.2f})',
                    'suggestion': 'Consider adding a transitional sentence to connect these sections',
                    'severity'  : 'medium' if sim < 0.15 else 'low'
                })
 
        # Tense consistency check
        tense_issues = self._check_tense_consistency(paragraphs)
        issues.extend(tense_issues)
 
        # Name variant check
        name_issues = self._check_name_variants(text)
        issues.extend(name_issues)
 
        return {
            'issues'           : issues,
            'similarity_scores': similarity_scores,
            'paragraphs'       : paragraphs,
            'avg_similarity'   : round(sum(similarity_scores) / max(len(similarity_scores), 1), 3)
        }
 
    def _transformer_similarity(self, paragraphs):
        """Compute cosine similarity between consecutive paragraphs using embeddings."""
        embeddings = self.model.encode(paragraphs)
        scores = []
        for i in range(len(embeddings) - 1):
            a, b = embeddings[i], embeddings[i+1]
            cos_sim = self._cosine(a, b)
            scores.append(cos_sim)
        return scores
 
    def _tfidf_similarity(self, paragraphs):
        """TF-IDF based cosine similarity (fallback, no ML needed)."""
        def tokenize(text):
            return re.findall(r'\b\w+\b', text.lower())
 
        def tfidf_vector(tokens, vocab, idf):
            tf = Counter(tokens)
            vec = {w: tf[w] * idf.get(w, 1) for w in tokens}
            return vec
 
        def dot(a, b):
            return sum(a.get(k, 0) * b.get(k, 0) for k in a)
 
        def norm(v):
            return math.sqrt(sum(x**2 for x in v.values()))
 
        all_tokens = [tokenize(p) for p in paragraphs]
        vocab = set(w for tokens in all_tokens for w in tokens)
 
        doc_freq = defaultdict(int)
        for tokens in all_tokens:
            for w in set(tokens):
                doc_freq[w] += 1
 
        N = len(paragraphs)
        idf = {w: math.log(N / (1 + doc_freq[w])) for w in vocab}
 
        vectors = [tfidf_vector(tokens, vocab, idf) for tokens in all_tokens]
 
        scores = []
        for i in range(len(vectors) - 1):
            a, b  = vectors[i], vectors[i+1]
            na, nb = norm(a), norm(b)
            if na == 0 or nb == 0:
                scores.append(0.0)
            else:
                scores.append(dot(a, b) / (na * nb))
        return scores
 
    def _cosine(self, a, b):
        import numpy as np
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))
 
    def _check_tense_consistency(self, paragraphs):
        """Detect paragraphs that switch between past and present tense."""
        past_keywords    = ['was', 'were', 'had', 'did', 'said', 'went', 'came', 'took']
        present_keywords = ['is', 'are', 'has', 'does', 'says', 'goes', 'comes', 'takes']
 
        issues = []
        para_tenses = []
 
        for para in paragraphs:
            words = para.lower().split()
            past_count    = sum(1 for w in words if w in past_keywords)
            present_count = sum(1 for w in words if w in present_keywords)
            tense = 'past' if past_count > present_count else 'present' if present_count > past_count else 'mixed'
            para_tenses.append(tense)
 
        # Flag sudden tense switches
        for i in range(1, len(para_tenses)):
            if para_tenses[i] != para_tenses[i-1] and para_tenses[i] != 'mixed' and para_tenses[i-1] != 'mixed':
                issues.append({
                    'type'      : 'tense_shift',
                    'category'  : 'Consistency',
                    'paragraphs': (i, i+1),
                    'message'   : f'📝 Tense shift between paragraphs {i} ({para_tenses[i-1]}) and {i+1} ({para_tenses[i]})',
                    'suggestion': 'Maintain consistent tense throughout your narrative',
                    'severity'  : 'medium'
                })
 
        return issues
 
    def _check_name_variants(self, text):
        """Detect potential name spelling variants (e.g., 'Jon' vs 'John')."""
        words       = re.findall(r'\b[A-Z][a-z]+\b', text)
        name_counts = Counter(words)
 
        # Find names that appear only once — potential typos
        issues = []
        common_names = {name for name, count in name_counts.items() if count >= 2}
 
        for name, count in name_counts.items():
            if count == 1:
                # Check if a similar name exists (Levenshtein distance 1-2)
                for common in common_names:
                    if name != common and self._edit_distance(name, common) <= 2:
                        issues.append({
                            'type'      : 'name_variant',
                            'category'  : 'Consistency',
                            'message'   : f"🔤 '{name}' appears once — did you mean '{common}'?",
                            'suggestion': f"Check if '{name}' and '{common}' refer to the same character",
                            'severity'  : 'low'
                        })
                        break
 
        return issues
 
    def _edit_distance(self, a, b):
        """Levenshtein distance between two strings."""
        m, n = len(a), len(b)
        dp = [[0] * (n+1) for _ in range(m+1)]
        for i in range(m+1): dp[i][0] = i
        for j in range(n+1): dp[0][j] = j
        for i in range(1, m+1):
            for j in range(1, n+1):
                cost = 0 if a[i-1] == b[j-1] else 1
                dp[i][j] = min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost)
        return dp[m][n]

