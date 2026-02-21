"""
MODULE 9: SEO Optimization Mode
Intelligent SEO scoring — keyword density, heading hierarchy, semantic coverage.
Not keyword stuffing.
"""
import re
import math
from typing import List, Dict, Optional, Tuple
from collections import Counter
from dataclasses import dataclass, field


@dataclass
class SEOIssue:
    issue_type: str
    severity: str  # 'high', 'medium', 'low'
    location: Optional[Dict] = None
    explanation: str = ""
    suggestion: str = ""
    score: float = 0.0


@dataclass
class SEOResult:
    overall_score: float  # 0-100
    keyword_analysis: Dict
    heading_analysis: Dict
    content_analysis: Dict
    issues: List[Dict]
    recommendations: List[str]
    meta_suggestions: Dict


class SEOOptimizer:
    def __init__(self):
        self.ideal_keyword_density = (0.01, 0.03)  # 1-3%
        self.min_content_length = 300  # words
        self.ideal_heading_ratio = 0.05  # ~1 heading per 200 words
        self.semantic_keywords_threshold = 5  # minimum LSI-like terms
        
        self.stop_words = {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
            'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
            'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
            'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
            'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
            'give', 'day', 'most', 'us', 'is', 'was', 'are', 'were', 'been',
            'has', 'had', 'did', 'does', 'am',
        }

    def analyze(self, text: str, target_keywords: List[str] = None) -> Dict:
        paragraphs = self._split_paragraphs(text)
        sentences = self._split_sentences(text)
        words = self._tokenize(text)
        
        # Auto-detect keywords if not provided
        if not target_keywords:
            target_keywords = self._extract_keywords(words)
        
        # Keyword analysis
        keyword_analysis = self._analyze_keywords(text, words, target_keywords)
        
        # Heading analysis
        heading_analysis = self._analyze_headings(text)
        
        # Content analysis
        content_analysis = self._analyze_content(text, words, sentences, paragraphs)
        
        # Internal linking opportunities
        linking = self._analyze_internal_linking(paragraphs, target_keywords)
        
        # Collect issues
        issues = []
        
        # Check keyword density
        for kw, data in keyword_analysis.get("keyword_data", {}).items():
            density = data.get("density", 0)
            if density > 0.03:
                issues.append(SEOIssue(
                    issue_type="keyword_over_optimization",
                    severity="high",
                    explanation=f"Keyword '{kw}' density is {density:.1%}, which exceeds the ideal 3% maximum. This may trigger search engine penalties.",
                    suggestion=f"Reduce usage of '{kw}' — consider using synonyms or related terms.",
                    score=density
                ))
            elif density < 0.005 and len(words) > 100:
                issues.append(SEOIssue(
                    issue_type="keyword_underuse",
                    severity="low",
                    explanation=f"Keyword '{kw}' density is only {density:.1%}. Consider naturally incorporating it more.",
                    suggestion=f"Try to include '{kw}' more naturally throughout the content.",
                    score=density
                ))
        
        # Check heading hierarchy
        if heading_analysis.get("hierarchy_valid") is False:
            issues.append(SEOIssue(
                issue_type="heading_hierarchy_broken",
                severity="medium",
                explanation="Heading hierarchy is broken — levels are skipped (e.g., H1 → H3 without H2).",
                suggestion="Ensure proper heading nesting: H1 → H2 → H3.",
                score=0.5
            ))
        
        if heading_analysis.get("h1_count", 0) == 0:
            issues.append(SEOIssue(
                issue_type="missing_h1",
                severity="high",
                explanation="No H1 heading found. Every page should have exactly one H1.",
                suggestion="Add a clear, keyword-rich H1 heading at the top of your content.",
                score=0.0
            ))
        elif heading_analysis.get("h1_count", 0) > 1:
            issues.append(SEOIssue(
                issue_type="multiple_h1",
                severity="medium",
                explanation=f"Found {heading_analysis['h1_count']} H1 headings. A page should have exactly one.",
                suggestion="Keep only one H1 heading and convert others to H2.",
                score=0.5
            ))
        
        # Check content length
        word_count = len(words)
        if word_count < self.min_content_length:
            issues.append(SEOIssue(
                issue_type="thin_content",
                severity="high",
                explanation=f"Content is only {word_count} words. Search engines prefer content of 300+ words.",
                suggestion="Expand your content with more relevant, detailed information.",
                score=word_count / self.min_content_length
            ))
        
        # Check semantic coverage
        semantic_score = content_analysis.get("semantic_richness", 0)
        if semantic_score < 0.3:
            issues.append(SEOIssue(
                issue_type="low_semantic_coverage",
                severity="medium",
                explanation="Low semantic coverage — content may not cover the topic comprehensively.",
                suggestion="Include related subtopics and synonyms to improve topical authority.",
                score=semantic_score
            ))
        
        # Meta suggestions
        meta = self._generate_meta_suggestions(text, target_keywords)
        
        # Recommendations
        recommendations = self._generate_recommendations(
            keyword_analysis, heading_analysis, content_analysis, issues
        )
        
        # Overall SEO score
        overall_score = self._calculate_overall_score(
            keyword_analysis, heading_analysis, content_analysis, issues
        )
        
        return {
            "overall_score": round(overall_score, 1),
            "keyword_analysis": keyword_analysis,
            "heading_analysis": heading_analysis,
            "content_analysis": content_analysis,
            "issues": [self._issue_to_dict(i) for i in issues],
            "recommendations": recommendations,
            "meta_suggestions": meta,
        }

    def _split_paragraphs(self, text: str) -> List[str]:
        return [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    def _split_sentences(self, text: str) -> List[str]:
        return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-z]+\b', text.lower())

    def _extract_keywords(self, words: List[str], top_n: int = 5) -> List[str]:
        """Auto-extract top keywords using TF analysis."""
        filtered = [w for w in words if w not in self.stop_words and len(w) > 2]
        counter = Counter(filtered)
        
        # Also extract bigrams
        bigrams = []
        for i in range(len(filtered) - 1):
            bigram = f"{filtered[i]} {filtered[i+1]}"
            bigrams.append(bigram)
        bigram_counter = Counter(bigrams)
        
        # Combine top unigrams and bigrams
        top_unigrams = [word for word, _ in counter.most_common(top_n)]
        top_bigrams = [bg for bg, count in bigram_counter.most_common(3) if count > 1]
        
        return top_unigrams + top_bigrams

    def _analyze_keywords(self, text: str, words: List[str], keywords: List[str]) -> Dict:
        text_lower = text.lower()
        total_words = len(words)
        
        keyword_data = {}
        for kw in keywords:
            count = len(re.findall(re.escape(kw.lower()), text_lower))
            density = count / total_words if total_words > 0 else 0
            
            # Check distribution across content
            positions = [m.start() / len(text) for m in re.finditer(re.escape(kw.lower()), text_lower)]
            distribution_score = self._calculate_distribution_score(positions)
            
            in_ideal_range = self.ideal_keyword_density[0] <= density <= self.ideal_keyword_density[1]
            
            keyword_data[kw] = {
                "count": count,
                "density": round(density, 4),
                "in_ideal_range": in_ideal_range,
                "distribution_score": round(distribution_score, 2),
                "positions": positions[:10],
            }
        
        avg_density = sum(d["density"] for d in keyword_data.values()) / max(len(keyword_data), 1)
        
        return {
            "target_keywords": keywords,
            "keyword_data": keyword_data,
            "average_density": round(avg_density, 4),
            "keyword_score": self._keyword_score(keyword_data),
        }

    def _calculate_distribution_score(self, positions: List[float]) -> float:
        """How evenly are keywords distributed throughout the content?"""
        if not positions or len(positions) < 2:
            return 0.5
        
        # Ideal = evenly spaced
        n = len(positions)
        ideal_spacing = 1.0 / n
        actual_spacings = [positions[i+1] - positions[i] for i in range(n-1)]
        
        if not actual_spacings:
            return 0.5
        
        avg_spacing = sum(actual_spacings) / len(actual_spacings)
        variance = sum((s - avg_spacing) ** 2 for s in actual_spacings) / len(actual_spacings)
        
        return max(0, 1 - variance * 10)

    def _keyword_score(self, keyword_data: Dict) -> float:
        if not keyword_data:
            return 50
        scores = []
        for data in keyword_data.values():
            if data["in_ideal_range"]:
                scores.append(100)
            elif data["density"] > 0.03:
                scores.append(max(0, 100 - (data["density"] - 0.03) * 3000))
            elif data["density"] < 0.01:
                scores.append(max(0, data["density"] / 0.01 * 100))
            else:
                scores.append(70)
        return round(sum(scores) / len(scores), 1)

    def _analyze_headings(self, text: str) -> Dict:
        """Validate heading hierarchy (markdown-style headings)."""
        headings = []
        for line in text.split('\n'):
            line = line.strip()
            match = re.match(r'^(#{1,6})\s+(.+)$', line)
            if match:
                level = len(match.group(1))
                content = match.group(2)
                headings.append({"level": level, "content": content})
        
        # Also detect uppercase headings (common in plain text)
        for para in self._split_paragraphs(text):
            if len(para) < 80 and para.isupper():
                headings.append({"level": 2, "content": para})
        
        h1_count = sum(1 for h in headings if h["level"] == 1)
        
        # Check hierarchy
        hierarchy_valid = True
        prev_level = 0
        for h in headings:
            if h["level"] > prev_level + 1 and prev_level > 0:
                hierarchy_valid = False
            prev_level = h["level"]
        
        return {
            "headings": headings,
            "h1_count": h1_count,
            "total_headings": len(headings),
            "hierarchy_valid": hierarchy_valid,
            "heading_score": self._heading_score(headings, h1_count, hierarchy_valid),
        }

    def _heading_score(self, headings: List, h1_count: int, hierarchy_valid: bool) -> float:
        score = 100
        if h1_count == 0:
            score -= 30
        elif h1_count > 1:
            score -= 15
        if not hierarchy_valid:
            score -= 20
        if len(headings) == 0:
            score -= 25
        return max(0, score)

    def _analyze_content(self, text: str, words: List[str], sentences: List[str],
                         paragraphs: List[str]) -> Dict:
        word_count = len(words)
        sentence_count = len(sentences)
        paragraph_count = len(paragraphs)
        
        # Average sentence length
        avg_sentence_length = word_count / max(sentence_count, 1)
        
        # Vocabulary richness (type-token ratio)
        unique_words = set(words)
        ttr = len(unique_words) / max(word_count, 1)
        
        # Semantic richness = unique meaningful words / total
        meaningful = [w for w in words if w not in self.stop_words and len(w) > 3]
        semantic_richness = len(set(meaningful)) / max(len(meaningful), 1)
        
        # Check for repeated patterns (potential keyword stuffing)
        word_freq = Counter(words)
        most_common = word_freq.most_common(20)
        repetition_issues = [
            {"word": w, "count": c, "density": c / word_count}
            for w, c in most_common
            if w not in self.stop_words and c / word_count > 0.03
        ]
        
        # First paragraph analysis (important for SEO)
        first_para_quality = self._analyze_first_paragraph(paragraphs[0] if paragraphs else "")
        
        return {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "paragraph_count": paragraph_count,
            "avg_sentence_length": round(avg_sentence_length, 1),
            "vocabulary_richness": round(ttr, 3),
            "semantic_richness": round(semantic_richness, 3),
            "repetition_issues": repetition_issues,
            "first_paragraph_quality": first_para_quality,
            "content_score": self._content_score(word_count, avg_sentence_length, semantic_richness),
        }

    def _analyze_first_paragraph(self, first_para: str) -> Dict:
        word_count = len(first_para.split())
        has_hook = bool(re.search(r'[?!]|".*"', first_para))
        
        return {
            "word_count": word_count,
            "has_hook": has_hook,
            "length_adequate": word_count >= 30,
        }

    def _content_score(self, word_count: int, avg_sentence_length: float,
                       semantic_richness: float) -> float:
        score = 100
        if word_count < 300:
            score -= 30
        if word_count < 100:
            score -= 20
        if avg_sentence_length > 30:
            score -= 15
        if avg_sentence_length < 8:
            score -= 10
        if semantic_richness < 0.3:
            score -= 15
        return max(0, score)

    def _analyze_internal_linking(self, paragraphs: List[str], keywords: List[str]) -> Dict:
        """Detect topical overlap opportunities for internal linking."""
        opportunities = []
        for i, para in enumerate(paragraphs):
            for kw in keywords:
                if kw.lower() in para.lower():
                    opportunities.append({
                        "paragraph": i,
                        "keyword": kw,
                        "suggestion": f"Consider linking '{kw}' to related content."
                    })
        return {"opportunities": opportunities[:10]}

    def _generate_meta_suggestions(self, text: str, keywords: List[str]) -> Dict:
        """Generate title tag and meta description suggestions."""
        # Extract first meaningful sentence
        sentences = self._split_sentences(text)
        first_sentence = sentences[0] if sentences else text[:160]
        
        # Title suggestion (50-60 chars ideal)
        title_words = [w for w in first_sentence.split()[:10] if len(w) > 2]
        title_base = ' '.join(title_words)
        if len(title_base) > 60:
            title_base = title_base[:57] + '...'
        
        # Meta description (150-160 chars ideal)
        meta_desc = first_sentence[:157] + '...' if len(first_sentence) > 160 else first_sentence
        
        return {
            "suggested_title": title_base,
            "suggested_meta_description": meta_desc,
            "title_length": len(title_base),
            "meta_description_length": len(meta_desc),
            "keywords_in_title": [kw for kw in keywords if kw.lower() in title_base.lower()],
            "keywords_in_meta": [kw for kw in keywords if kw.lower() in meta_desc.lower()],
        }

    def _generate_recommendations(self, keyword_analysis: Dict, heading_analysis: Dict,
                                    content_analysis: Dict, issues: List[SEOIssue]) -> List[str]:
        recommendations = []
        
        if content_analysis.get("word_count", 0) < 300:
            recommendations.append("📝 Expand your content to at least 300 words for better SEO performance.")
        
        if heading_analysis.get("h1_count", 0) == 0:
            recommendations.append("🏷️ Add a clear H1 heading that includes your primary keyword.")
        
        if heading_analysis.get("total_headings", 0) < 2:
            recommendations.append("📋 Add subheadings (H2, H3) to break up content and improve scannability.")
        
        if content_analysis.get("semantic_richness", 0) < 0.4:
            recommendations.append("🔤 Diversify your vocabulary — use synonyms and related terms.")
        
        if content_analysis.get("avg_sentence_length", 0) > 25:
            recommendations.append("✂️ Break up long sentences for better readability and SEO.")
        
        has_overopt = any(i.issue_type == "keyword_over_optimization" for i in issues)
        if has_overopt:
            recommendations.append("⚠️ Reduce keyword repetition — search engines may penalize over-optimization.")
        
        if not content_analysis.get("first_paragraph_quality", {}).get("has_hook"):
            recommendations.append("🎣 Start with a compelling hook — questions or bold statements engage readers.")
        
        if keyword_analysis.get("keyword_score", 100) < 50:
            recommendations.append("🎯 Improve keyword usage — aim for 1-3% density naturally throughout the content.")
        
        if not recommendations:
            recommendations.append("✅ Content is well-optimized! Keep maintaining quality and relevance.")
        
        return recommendations

    def _calculate_overall_score(self, keyword_analysis: Dict, heading_analysis: Dict,
                                   content_analysis: Dict, issues: List[SEOIssue]) -> float:
        keyword_score = keyword_analysis.get("keyword_score", 50)
        heading_score = heading_analysis.get("heading_score", 50)
        content_score = content_analysis.get("content_score", 50)
        
        # Weight: content 40%, keywords 35%, headings 25%
        base_score = content_score * 0.4 + keyword_score * 0.35 + heading_score * 0.25
        
        # Penalty for high-severity issues
        high_issues = sum(1 for i in issues if i.severity == "high")
        penalty = high_issues * 10
        
        return max(0, min(100, base_score - penalty))

    def _issue_to_dict(self, issue: SEOIssue) -> Dict:
        return {
            "issue_type": issue.issue_type,
            "severity": issue.severity,
            "location": issue.location,
            "explanation": issue.explanation,
            "suggestion": issue.suggestion,
            "score": issue.score,
        }
