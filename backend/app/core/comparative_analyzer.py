"""
MODULE 7: Comparative Document Analysis
Compare two versions of the same document and quantify improvement.
"""
import re
from typing import List, Dict, Tuple, Optional
from collections import Counter
from dataclasses import dataclass, field


@dataclass
class DiffSegment:
    segment_type: str  # 'added', 'removed', 'modified', 'unchanged'
    original_text: str = ""
    modified_text: str = ""
    paragraph_index: int = 0
    change_significance: float = 0.0


class ComparativeAnalyzer:
    def __init__(self):
        self.stop_words = {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'is', 'was',
            'are', 'were', 'been', 'has', 'had',
        }

    def compare(self, text_a: str, text_b: str) -> Dict:
        paras_a = self._split_paragraphs(text_a)
        paras_b = self._split_paragraphs(text_b)
        
        # Structural diff
        structural_diff = self._structural_diff(paras_a, paras_b)
        
        # Word-level statistics
        word_stats = self._word_level_stats(text_a, text_b)
        
        # Readability comparison
        readability_delta = self._readability_comparison(text_a, text_b)
        
        # Style fingerprint comparison
        style_delta = self._style_comparison(text_a, text_b)
        
        # Vocabulary comparison
        vocab_comparison = self._vocabulary_comparison(text_a, text_b)
        
        # Sentence-level diff
        sentence_diff = self._sentence_level_diff(text_a, text_b)
        
        # Overall improvement score
        improvement_score = self._calculate_improvement_score(
            structural_diff, readability_delta, style_delta, word_stats
        )
        
        return {
            "structural_diff": structural_diff,
            "word_stats": word_stats,
            "readability_delta": readability_delta,
            "style_delta": style_delta,
            "vocabulary_comparison": vocab_comparison,
            "sentence_diff": sentence_diff,
            "improvement_score": improvement_score,
            "summary": self._generate_summary(structural_diff, readability_delta, improvement_score),
        }

    def _split_paragraphs(self, text: str) -> List[str]:
        return [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    def _split_sentences(self, text: str) -> List[str]:
        return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-z]+\b', text.lower())

    def _structural_diff(self, paras_a: List[str], paras_b: List[str]) -> Dict:
        """Compare paragraph-level structure."""
        len_a = len(paras_a)
        len_b = len(paras_b)
        
        # Simple LCS-based paragraph matching
        matched_pairs = []
        unmatched_a = list(range(len_a))
        unmatched_b = list(range(len_b))
        
        for i, pa in enumerate(paras_a):
            best_match = -1
            best_sim = 0
            for j in unmatched_b:
                sim = self._text_similarity(pa, paras_b[j])
                if sim > best_sim and sim > 0.3:
                    best_sim = sim
                    best_match = j
            if best_match >= 0:
                matched_pairs.append({
                    "original_index": i,
                    "modified_index": best_match,
                    "similarity": round(best_sim, 3),
                    "change_type": "unchanged" if best_sim > 0.95 else "modified",
                    "original_preview": pa[:100],
                    "modified_preview": paras_b[best_match][:100] if best_match < len_b else "",
                })
                unmatched_a.remove(i)
                unmatched_b.remove(best_match)
        
        additions = [{"index": j, "preview": paras_b[j][:100]} for j in unmatched_b]
        deletions = [{"index": i, "preview": paras_a[i][:100]} for i in unmatched_a]
        
        # Reorganization detection
        reordered = False
        if matched_pairs:
            indices_b = [m["modified_index"] for m in matched_pairs]
            reordered = indices_b != sorted(indices_b)
        
        return {
            "paragraphs_original": len_a,
            "paragraphs_modified": len_b,
            "matched_pairs": matched_pairs,
            "additions": additions,
            "deletions": deletions,
            "paragraphs_added": len(additions),
            "paragraphs_deleted": len(deletions),
            "paragraphs_modified": len([m for m in matched_pairs if m["change_type"] == "modified"]),
            "paragraphs_unchanged": len([m for m in matched_pairs if m["change_type"] == "unchanged"]),
            "reordered": reordered,
        }

    def _text_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate cosine similarity using bag-of-words."""
        words_a = Counter(self._tokenize(text_a))
        words_b = Counter(self._tokenize(text_b))
        
        if not words_a or not words_b:
            return 0.0
        
        all_words = set(words_a.keys()) | set(words_b.keys())
        dot_product = sum(words_a.get(w, 0) * words_b.get(w, 0) for w in all_words)
        mag_a = sum(v ** 2 for v in words_a.values()) ** 0.5
        mag_b = sum(v ** 2 for v in words_b.values()) ** 0.5
        
        if mag_a == 0 or mag_b == 0:
            return 0.0
        
        return dot_product / (mag_a * mag_b)

    def _word_level_stats(self, text_a: str, text_b: str) -> Dict:
        words_a = self._tokenize(text_a)
        words_b = self._tokenize(text_b)
        
        set_a = set(words_a)
        set_b = set(words_b)
        
        return {
            "word_count_original": len(words_a),
            "word_count_modified": len(words_b),
            "word_count_delta": len(words_b) - len(words_a),
            "word_count_change_pct": round((len(words_b) - len(words_a)) / max(len(words_a), 1) * 100, 1),
            "unique_words_original": len(set_a),
            "unique_words_modified": len(set_b),
            "words_added": len(set_b - set_a),
            "words_removed": len(set_a - set_b),
            "words_shared": len(set_a & set_b),
            "overall_similarity": round(self._text_similarity(text_a, text_b), 3),
        }

    def _readability_comparison(self, text_a: str, text_b: str) -> Dict:
        """Compare readability metrics between two texts."""
        score_a = self._simple_readability(text_a)
        score_b = self._simple_readability(text_b)
        
        return {
            "original": score_a,
            "modified": score_b,
            "delta": {
                "flesch_kincaid": round(score_b["flesch_kincaid"] - score_a["flesch_kincaid"], 1),
                "avg_sentence_length": round(score_b["avg_sentence_length"] - score_a["avg_sentence_length"], 1),
                "avg_word_length": round(score_b["avg_word_length"] - score_a["avg_word_length"], 2),
            },
            "readability_improved": score_b["flesch_kincaid"] > score_a["flesch_kincaid"],
        }

    def _simple_readability(self, text: str) -> Dict:
        words = self._tokenize(text)
        sentences = self._split_sentences(text)
        
        word_count = len(words)
        sentence_count = max(len(sentences), 1)
        
        total_syllables = sum(self._count_syllables(w) for w in words)
        avg_sentence_length = word_count / sentence_count
        avg_syllables_per_word = total_syllables / max(word_count, 1)
        avg_word_length = sum(len(w) for w in words) / max(word_count, 1)
        
        # Flesch-Kincaid
        flesch = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        return {
            "flesch_kincaid": round(max(0, min(100, flesch)), 1),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_word_length": round(avg_word_length, 2),
            "total_syllables": total_syllables,
        }

    def _count_syllables(self, word: str) -> int:
        word = word.lower().strip()
        if len(word) <= 2:
            return 1
        vowels = 'aeiouy'
        count = 0
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word.endswith('e') and count > 1:
            count -= 1
        return max(1, count)

    def _style_comparison(self, text_a: str, text_b: str) -> Dict:
        """Compare writing style between two texts."""
        style_a = self._extract_style_metrics(text_a)
        style_b = self._extract_style_metrics(text_b)
        
        delta = {}
        for key in style_a:
            delta[key] = round(style_b.get(key, 0) - style_a.get(key, 0), 3)
        
        return {
            "original": style_a,
            "modified": style_b,
            "delta": delta,
        }

    def _extract_style_metrics(self, text: str) -> Dict:
        words = self._tokenize(text)
        sentences = self._split_sentences(text)
        
        word_count = max(len(words), 1)
        sentence_count = max(len(sentences), 1)
        
        # Sentence length variance
        sentence_lengths = [len(s.split()) for s in sentences]
        avg_len = sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
        variance = sum((l - avg_len) ** 2 for l in sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
        
        # Passive voice ratio
        passive_count = len(re.findall(r'\b(?:was|were|been|being|is|are)\s+\w+ed\b', text.lower()))
        passive_ratio = passive_count / sentence_count
        
        # Vocabulary complexity
        unique = set(words)
        ttr = len(unique) / word_count
        
        # Adverb usage
        adverb_count = len([w for w in words if w.endswith('ly') and len(w) > 3])
        adverb_ratio = adverb_count / word_count
        
        # Dialogue percentage
        dialogue_chars = len(re.findall(r'"[^"]*"', text))
        dialogue_pct = dialogue_chars / max(len(text), 1)
        
        return {
            "avg_sentence_length": round(avg_len, 1),
            "sentence_length_variance": round(variance, 1),
            "passive_voice_ratio": round(passive_ratio, 3),
            "vocabulary_complexity": round(ttr, 3),
            "adverb_usage_rate": round(adverb_ratio, 4),
            "dialogue_percentage": round(dialogue_pct, 3),
        }

    def _vocabulary_comparison(self, text_a: str, text_b: str) -> Dict:
        words_a = [w for w in self._tokenize(text_a) if w not in self.stop_words]
        words_b = [w for w in self._tokenize(text_b) if w not in self.stop_words]
        
        freq_a = Counter(words_a)
        freq_b = Counter(words_b)
        
        new_terms = [w for w in set(words_b) - set(words_a) if freq_b[w] > 1]
        removed_terms = [w for w in set(words_a) - set(words_b) if freq_a[w] > 1]
        
        # Most changed frequencies
        changed_freq = {}
        all_words = set(words_a) | set(words_b)
        for w in all_words:
            if w in self.stop_words:
                continue
            delta = freq_b.get(w, 0) - freq_a.get(w, 0)
            if abs(delta) >= 2:
                changed_freq[w] = delta
        
        top_changes = sorted(changed_freq.items(), key=lambda x: abs(x[1]), reverse=True)[:10]
        
        return {
            "new_terms": new_terms[:20],
            "removed_terms": removed_terms[:20],
            "frequency_changes": [{"word": w, "delta": d} for w, d in top_changes],
            "vocabulary_growth": len(set(words_b)) - len(set(words_a)),
        }

    def _sentence_level_diff(self, text_a: str, text_b: str) -> Dict:
        sents_a = self._split_sentences(text_a)
        sents_b = self._split_sentences(text_b)
        
        # Find added and removed sentences
        added = []
        removed = []
        modified = []
        unchanged = 0
        
        matched_b = set()
        
        for sa in sents_a:
            best_match = -1
            best_sim = 0
            for j, sb in enumerate(sents_b):
                if j in matched_b:
                    continue
                sim = self._text_similarity(sa, sb)
                if sim > best_sim:
                    best_sim = sim
                    best_match = j
            
            if best_sim > 0.95:
                unchanged += 1
                matched_b.add(best_match)
            elif best_sim > 0.3:
                modified.append({
                    "original": sa[:150],
                    "modified": sents_b[best_match][:150] if best_match >= 0 else "",
                    "similarity": round(best_sim, 3),
                })
                if best_match >= 0:
                    matched_b.add(best_match)
            else:
                removed.append(sa[:150])
        
        for j, sb in enumerate(sents_b):
            if j not in matched_b:
                added.append(sb[:150])
        
        return {
            "sentences_original": len(sents_a),
            "sentences_modified": len(sents_b),
            "sentences_added": len(added),
            "sentences_removed": len(removed),
            "sentences_modified_count": len(modified),
            "sentences_unchanged": unchanged,
            "added_sentences": added[:10],
            "removed_sentences": removed[:10],
            "modified_sentences": modified[:10],
        }

    def _calculate_improvement_score(self, structural_diff: Dict, readability_delta: Dict,
                                       style_delta: Dict, word_stats: Dict) -> Dict:
        scores = {}
        
        # Structure score: fewer deletions, meaningful additions
        struct_additions = structural_diff.get("paragraphs_added", 0)
        struct_mods = structural_diff.get("paragraphs_modified", 0)
        scores["structure"] = min(100, 50 + struct_additions * 10 + struct_mods * 5)
        
        # Readability score
        readability_improved = readability_delta.get("readability_improved", False)
        fk_delta = readability_delta.get("delta", {}).get("flesch_kincaid", 0)
        scores["readability"] = min(100, 50 + fk_delta * 2) if readability_improved else max(0, 50 + fk_delta * 2)
        
        # Style consistency
        style_d = style_delta.get("delta", {})
        style_change = sum(abs(v) for v in style_d.values()) / max(len(style_d), 1)
        scores["style_consistency"] = max(0, 100 - style_change * 100)
        
        # Content growth
        word_delta_pct = word_stats.get("word_count_change_pct", 0)
        if word_delta_pct > 0:
            scores["content_growth"] = min(100, 50 + word_delta_pct)
        else:
            scores["content_growth"] = max(0, 50 + word_delta_pct)
        
        # Overall weighted score
        overall = (
            scores["structure"] * 0.25 +
            scores["readability"] * 0.30 +
            scores["style_consistency"] * 0.20 +
            scores["content_growth"] * 0.25
        )
        
        return {
            "overall": round(overall, 1),
            "breakdown": {k: round(v, 1) for k, v in scores.items()},
        }

    def _generate_summary(self, structural_diff: Dict, readability_delta: Dict,
                           improvement_score: Dict) -> str:
        parts = []
        
        overall = improvement_score.get("overall", 50)
        if overall >= 70:
            parts.append("📈 Significant improvement detected across the revision.")
        elif overall >= 50:
            parts.append("📊 Moderate changes with mixed improvement indicators.")
        else:
            parts.append("📉 The revision may have introduced some regressions.")
        
        added = structural_diff.get("paragraphs_added", 0)
        deleted = structural_diff.get("paragraphs_deleted", 0)
        if added > 0:
            parts.append(f"Added {added} new paragraph(s).")
        if deleted > 0:
            parts.append(f"Removed {deleted} paragraph(s).")
        
        if readability_delta.get("readability_improved"):
            parts.append("Readability improved.")
        else:
            parts.append("Readability decreased slightly.")
        
        return " ".join(parts)
