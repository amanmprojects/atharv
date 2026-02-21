"""
MODULE 12: Stylometric Watermarking
Embed a statistical writing signature for authorship verification.
"""
import re
import hashlib
import random
from typing import List, Dict, Optional, Tuple
from collections import Counter
from dataclasses import dataclass


@dataclass
class WatermarkResult:
    watermarked_text: str
    watermark_id: str
    bits_encoded: int
    modifications_made: int
    original_length: int
    watermarked_length: int
    detection_confidence: float


class StylometricWatermarker:
    def __init__(self):
        # Synonym pairs for bit encoding
        self.synonym_pairs = [
            ('big', 'large'), ('small', 'tiny'), ('fast', 'quick'),
            ('happy', 'glad'), ('sad', 'unhappy'), ('good', 'fine'),
            ('bad', 'poor'), ('start', 'begin'), ('end', 'finish'),
            ('use', 'utilize'), ('show', 'demonstrate'), ('help', 'assist'),
            ('get', 'obtain'), ('make', 'create'), ('give', 'provide'),
            ('need', 'require'), ('think', 'believe'), ('want', 'desire'),
            ('try', 'attempt'), ('ask', 'inquire'), ('tell', 'inform'),
            ('look', 'appear'), ('find', 'discover'), ('keep', 'maintain'),
            ('move', 'proceed'), ('also', 'additionally'), ('but', 'however'),
            ('so', 'therefore'), ('yet', 'nevertheless'), ('while', 'whereas'),
        ]
        
        # Punctuation micro-patterns for bit encoding
        self.comma_patterns = [
            (r'(\w)\s+(however|therefore|moreover|furthermore)', r'\1, \2'),  # bit=1: add comma
        ]

        # Contraction pairs
        self.contraction_pairs = [
            ("do not", "don't"), ("cannot", "can't"), ("will not", "won't"),
            ("is not", "isn't"), ("are not", "aren't"), ("was not", "wasn't"),
            ("were not", "weren't"), ("have not", "haven't"), ("has not", "hasn't"),
            ("would not", "wouldn't"), ("could not", "couldn't"), ("should not", "shouldn't"),
            ("it is", "it's"), ("that is", "that's"), ("there is", "there's"),
            ("I am", "I'm"), ("I have", "I've"), ("I will", "I'll"),
        ]

    def embed_watermark(self, text: str, watermark_id: Optional[str] = None) -> Dict:
        """Embed a statistical watermark into the text."""
        if not watermark_id:
            watermark_id = hashlib.sha256(text[:50].encode()).hexdigest()[:16]
        
        # Convert watermark ID to bits
        bits = self._string_to_bits(watermark_id)
        
        result_text = text
        modifications = 0
        bit_index = 0
        
        # Strategy 1: Synonym substitution
        for word_a, word_b in self.synonym_pairs:
            if bit_index >= len(bits):
                break
            
            pattern_a = re.compile(r'\b' + re.escape(word_a) + r'\b', re.IGNORECASE)
            matches_a = list(pattern_a.finditer(result_text))
            
            if matches_a:
                bit = bits[bit_index]
                if bit == '1':
                    # Replace first occurrence with synonym
                    match = matches_a[0]
                    replacement = word_b if match.group()[0].islower() else word_b.capitalize()
                    result_text = result_text[:match.start()] + replacement + result_text[match.end():]
                    modifications += 1
                bit_index += 1
        
        # Strategy 2: Contraction encoding
        for full_form, contraction in self.contraction_pairs:
            if bit_index >= len(bits):
                break
            
            pattern = re.compile(re.escape(full_form), re.IGNORECASE)
            matches = list(pattern.finditer(result_text))
            
            if matches:
                bit = bits[bit_index]
                if bit == '1':
                    match = matches[0]
                    result_text = result_text[:match.start()] + contraction + result_text[match.end():]
                    modifications += 1
                bit_index += 1
        
        # Strategy 3: Oxford comma encoding
        # Find "A, B and C" patterns
        oxford_pattern = re.compile(r'(\w+),\s+(\w+)\s+and\s+(\w+)')
        oxford_matches = list(oxford_pattern.finditer(result_text))
        for match in oxford_matches:
            if bit_index >= len(bits):
                break
            bit = bits[bit_index]
            if bit == '1':
                # Add Oxford comma
                original = match.group(0)
                modified = f"{match.group(1)}, {match.group(2)}, and {match.group(3)}"
                result_text = result_text.replace(original, modified, 1)
                modifications += 1
            bit_index += 1
        
        return {
            "watermarked_text": result_text,
            "watermark_id": watermark_id,
            "bits_encoded": bit_index,
            "bits_total": len(bits),
            "modifications_made": modifications,
            "original_length": len(text),
            "watermarked_length": len(result_text),
            "encoding_success_rate": round(bit_index / max(len(bits), 1) * 100, 1),
        }

    def detect_watermark(self, text: str, original_text: Optional[str] = None) -> Dict:
        """Detect and decode watermark from text."""
        bits_detected = []
        evidence = []
        
        # Strategy 1: Check synonym usage patterns
        for word_a, word_b in self.synonym_pairs:
            pattern_b = re.compile(r'\b' + re.escape(word_b) + r'\b', re.IGNORECASE)
            pattern_a = re.compile(r'\b' + re.escape(word_a) + r'\b', re.IGNORECASE)
            
            has_b = bool(pattern_b.search(text))
            has_a = bool(pattern_a.search(text))
            
            if has_b and not has_a:
                bits_detected.append('1')
                evidence.append(f"Synonym detected: '{word_b}' used instead of '{word_a}'")
            elif has_a:
                bits_detected.append('0')
        
        # Strategy 2: Check contraction patterns
        for full_form, contraction in self.contraction_pairs:
            has_contraction = contraction.lower() in text.lower()
            has_full = full_form.lower() in text.lower()
            
            if has_contraction and not has_full:
                bits_detected.append('1')
                evidence.append(f"Contraction: '{contraction}' present")
            elif has_full:
                bits_detected.append('0')
        
        # Try to decode
        bit_string = ''.join(bits_detected)
        decoded_id = self._bits_to_string(bit_string) if len(bit_string) >= 8 else None
        
        # Calculate confidence
        if original_text:
            similarity = self._text_similarity(text, original_text)
            confidence = max(0, min(100, (1 - similarity) * 500 + 50))
        else:
            confidence = min(100, len(evidence) * 10 + 20) if evidence else 0
        
        return {
            "watermark_detected": len(evidence) > 3,
            "decoded_id": decoded_id,
            "bits_detected": len(bits_detected),
            "confidence": round(confidence, 1),
            "evidence": evidence[:10],
            "bit_pattern": bit_string[:64] if bit_string else "",
        }

    def verify_authorship(self, text: str, claimed_watermark_id: str) -> Dict:
        """Verify if a text contains a specific watermark."""
        detection = self.detect_watermark(text)
        
        if detection["decoded_id"] and claimed_watermark_id:
            match_score = self._compare_ids(detection["decoded_id"], claimed_watermark_id)
        else:
            match_score = 0
        
        return {
            "verified": match_score > 0.7,
            "match_score": round(match_score * 100, 1),
            "claimed_id": claimed_watermark_id,
            "detected_id": detection.get("decoded_id"),
            "evidence_count": len(detection.get("evidence", [])),
            "confidence": detection.get("confidence", 0),
        }

    def get_stylometric_signature(self, text: str) -> Dict:
        """Extract a unique stylometric signature from text."""
        words = re.findall(r'\b[a-z]+\b', text.lower())
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        # Feature extraction
        word_lengths = [len(w) for w in words]
        sentence_lengths = [len(s.split()) for s in sentences]
        
        # Character patterns
        letter_freq = Counter(c.lower() for c in text if c.isalpha())
        total_letters = sum(letter_freq.values())
        top_letters = {k: round(v / max(total_letters, 1), 4) for k, v in letter_freq.most_common(10)}
        
        # Punctuation patterns
        punct_freq = Counter(c for c in text if c in '.,;:!?-"\'()[]')
        total_punct = sum(punct_freq.values())
        punct_ratios = {k: round(v / max(total_punct, 1), 4) for k, v in punct_freq.most_common(10)}
        
        # Function word usage
        function_words = ['the', 'of', 'to', 'and', 'a', 'in', 'is', 'it', 'for', 'that',
                         'was', 'on', 'are', 'as', 'with', 'his', 'they', 'be', 'at', 'one']
        func_word_freq = {fw: words.count(fw) / max(len(words), 1) for fw in function_words}
        
        signature_hash = hashlib.sha256(str(sorted(top_letters.items())).encode()).hexdigest()[:16]
        
        return {
            "signature_hash": signature_hash,
            "avg_word_length": round(sum(word_lengths) / max(len(word_lengths), 1), 2),
            "avg_sentence_length": round(sum(sentence_lengths) / max(len(sentence_lengths), 1), 2),
            "vocabulary_richness": round(len(set(words)) / max(len(words), 1), 4),
            "letter_frequencies": top_letters,
            "punctuation_patterns": punct_ratios,
            "function_word_usage": {k: round(v, 4) for k, v in func_word_freq.items() if v > 0},
            "hapax_legomena_ratio": round(len([w for w in Counter(words).values() if w == 1]) / max(len(set(words)), 1), 4),
        }

    def _string_to_bits(self, s: str) -> str:
        return ''.join(format(ord(c), '08b') for c in s)

    def _bits_to_string(self, bits: str) -> Optional[str]:
        try:
            chars = [chr(int(bits[i:i+8], 2)) for i in range(0, len(bits) - 7, 8)]
            result = ''.join(c for c in chars if c.isprintable())
            return result if result else None
        except (ValueError, IndexError):
            return None

    def _text_similarity(self, text_a: str, text_b: str) -> float:
        words_a = Counter(re.findall(r'\b[a-z]+\b', text_a.lower()))
        words_b = Counter(re.findall(r'\b[a-z]+\b', text_b.lower()))
        
        all_words = set(words_a.keys()) | set(words_b.keys())
        if not all_words:
            return 1.0
        
        dot = sum(words_a.get(w, 0) * words_b.get(w, 0) for w in all_words)
        mag_a = sum(v ** 2 for v in words_a.values()) ** 0.5
        mag_b = sum(v ** 2 for v in words_b.values()) ** 0.5
        
        return dot / (mag_a * mag_b) if mag_a and mag_b else 0

    def _compare_ids(self, id_a: Optional[str], id_b: str) -> float:
        if not id_a:
            return 0
        min_len = min(len(id_a), len(id_b))
        if min_len == 0:
            return 0
        matches = sum(1 for a, b in zip(id_a[:min_len], id_b[:min_len]) if a == b)
        return matches / min_len
