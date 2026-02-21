"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: dialogue_voice.py - Per-character dialogue voice consistency checker
 
Tracks each character's linguistic fingerprint:
- Vocabulary richness (unique words / total words)
- Average sentence length
- Formality score (formal vs casual word usage)
- Punctuation style (exclamation, questions)
- Flags when a character's new dialogue doesn't match their established voice
"""
 
import re
from collections import defaultdict
 
 
FORMAL_WORDS = {
    "however", "therefore", "consequently", "furthermore", "nevertheless",
    "indeed", "certainly", "regarding", "approximately", "sufficient",
    "indicate", "demonstrate", "obtain", "utilize", "facilitate",
    "subsequently", "accordingly", "moreover", "nonetheless", "henceforth"
}
 
CASUAL_WORDS = {
    "yeah", "nope", "gonna", "wanna", "gotta", "kinda", "sorta",
    "dunno", "lemme", "gimme", "yep", "nah", "hey", "ok", "okay",
    "totally", "literally", "honestly", "basically", "like", "super"
}
 
 
class DialogueVoiceChecker:
    """
    Builds a linguistic profile for each character based on their dialogue.
    Detects when new dialogue doesn't match established voice patterns.
    """
 
    def __init__(self, consistency_threshold=0.4):
        self.threshold = consistency_threshold
        self.profiles  = {}   # character → voice profile
        self.dialogues = defaultdict(list)  # character → list of dialogue strings
 
    def extract_dialogues(self, text):
        """
        Extract dialogue attributed to characters.
        Handles patterns like:
          - "Hello," said John.
          - John said, "Hello."
          - John: "Hello."
        """
        dialogues = defaultdict(list)
 
        # Pattern 1: "dialogue," said/asked/replied Character
        pattern1 = re.finditer(
            r'"([^"]+)"\s*,?\s*(?:said|asked|replied|whispered|shouted|muttered|exclaimed|declared)\s+([A-Z][a-z]+)',
            text
        )
        for m in pattern1:
            dialogues[m.group(2)].append(m.group(1))
 
        # Pattern 2: Character said/asked, "dialogue"
        pattern2 = re.finditer(
            r'([A-Z][a-z]+)\s+(?:said|asked|replied|whispered|shouted|muttered|exclaimed|declared)\s*,?\s*"([^"]+)"',
            text
        )
        for m in pattern2:
            dialogues[m.group(1)].append(m.group(2))
 
        # Pattern 3: Character: "dialogue"
        pattern3 = re.finditer(r'([A-Z][a-z]+):\s+"([^"]+)"', text)
        for m in pattern3:
            dialogues[m.group(1)].append(m.group(2))
 
        return dict(dialogues)
 
    def build_profile(self, character, dialogue_lines):
        """Build linguistic profile from a character's dialogue history."""
        if not dialogue_lines:
            return None
 
        all_text  = " ".join(dialogue_lines)
        words     = re.findall(r'\b\w+\b', all_text.lower())
        sentences = re.split(r'[.!?]+', all_text)
        sentences = [s.strip() for s in sentences if s.strip()]
 
        if not words:
            return None
 
        unique_words   = set(words)
        vocab_richness = len(unique_words) / max(len(words), 1)
        avg_sent_len   = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
 
        formal_count   = sum(1 for w in words if w in FORMAL_WORDS)
        casual_count   = sum(1 for w in words if w in CASUAL_WORDS)
        total          = formal_count + casual_count + 1
        formality      = formal_count / total  # 0 = casual, 1 = formal
 
        exclamation_rate = all_text.count('!') / max(len(sentences), 1)
        question_rate    = all_text.count('?') / max(len(sentences), 1)
 
        return {
            'character'       : character,
            'vocab_richness'  : round(vocab_richness, 3),
            'avg_sentence_len': round(avg_sent_len, 1),
            'formality'       : round(formality, 3),
            'exclamation_rate': round(exclamation_rate, 3),
            'question_rate'   : round(question_rate, 3),
            'sample_size'     : len(dialogue_lines),
            'common_words'    : list(unique_words)[:10]
        }
 
    def analyze(self, text):
        """
        Full dialogue voice analysis.
        Returns profiles for all characters + consistency issues.
        """
        dialogues = self.extract_dialogues(text)
        issues    = []
        profiles  = {}
 
        for character, lines in dialogues.items():
            if len(lines) < 2:
                continue  # need at least 2 lines to compare
 
            # Build profile from first half, check second half against it
            split      = max(1, len(lines) // 2)
            base_lines = lines[:split]
            check_lines= lines[split:]
 
            base_profile  = self.build_profile(character, base_lines)
            check_profile = self.build_profile(character, check_lines)
 
            if not base_profile or not check_profile:
                continue
 
            profiles[character] = base_profile
 
            # Check each dimension for drift
            dims = [
                ('formality',       'Formality level',       0.3),
                ('avg_sentence_len','Sentence length style', 5.0),
                ('exclamation_rate','Exclamation usage',     0.4),
            ]
 
            for dim, label, tol in dims:
                base_val  = base_profile[dim]
                check_val = check_profile[dim]
                diff      = abs(base_val - check_val)
 
                if diff > tol:
                    direction = "more formal" if dim == 'formality' and check_val > base_val \
                               else "more casual" if dim == 'formality' \
                               else "longer" if dim == 'avg_sentence_len' and check_val > base_val \
                               else "shorter" if dim == 'avg_sentence_len' \
                               else "more exclamatory" if check_val > base_val \
                               else "less exclamatory"
 
                    issues.append({
                        'type'      : 'voice_drift',
                        'category'  : 'Dialogue Voice',
                        'character' : character,
                        'dimension' : label,
                        'message'   : f"🗣️ '{character}' sounds {direction} in later dialogue (drift: {diff:.2f})",
                        'suggestion': f"Review {character}'s later dialogue to match their established {label.lower()}",
                        'severity'  : 'medium',
                        'base_val'  : base_val,
                        'check_val' : check_val
                    })
 
        return {
            'profiles'  : profiles,
            'issues'    : issues,
            'dialogues' : dialogues
        }
