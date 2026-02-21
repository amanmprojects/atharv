"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: style_transformer.py - Rule-based + ML style transformation with explainability
"""
 
import re
import difflib
from collections import defaultdict
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  STYLE PROFILES
# ─────────────────────────────────────────────────────────────────────────────
 
STYLE_PROFILES = {
    'formal': {
        'description'  : 'Professional, structured, academic tone',
        'contractions' : False,
        'replacements' : {
            "don't": "do not", "can't": "cannot", "won't": "will not",
            "it's": "it is", "I'm": "I am", "they're": "they are",
            "we're": "we are", "you're": "you are", "isn't": "is not",
            "wasn't": "was not", "weren't": "were not", "haven't": "have not",
            "lots of": "numerous", "kind of": "somewhat", "a lot": "considerably",
            "get": "obtain", "use": "utilize", "show": "demonstrate",
            "think": "consider", "help": "facilitate", "look at": "examine"
        }
    },
    'casual': {
        'description'  : 'Relaxed, conversational, approachable tone',
        'contractions' : True,
        'replacements' : {
            "do not": "don't", "cannot": "can't", "will not": "won't",
            "it is": "it's", "I am": "I'm", "they are": "they're",
            "numerous": "lots of", "utilize": "use", "demonstrate": "show",
            "facilitate": "help", "obtain": "get", "subsequently": "then",
            "furthermore": "also", "nevertheless": "but still",
            "consequently": "so", "therefore": "so"
        }
    },
    'dramatic': {
        'description'  : 'Intense, vivid, emotionally heightened tone',
        'contractions' : True,
        'replacements' : {
            "walked": "strode", "said": "declared", "looked": "gazed",
            "ran": "sprinted", "spoke": "proclaimed", "came": "arrived",
            "went": "ventured", "got": "seized", "took": "claimed",
            "very": "utterly", "big": "colossal", "small": "minuscule",
            "good": "exceptional", "bad": "catastrophic", "scared": "terrified",
            "happy": "elated", "sad": "devastated", "tired": "utterly exhausted"
        }
    },
    'journalistic': {
        'description'  : 'Clear, direct, fact-first, objective tone',
        'contractions' : False,
        'replacements' : {
            "said": "stated", "told": "reported", "thought": "indicated",
            "I think": "According to reports", "probably": "reportedly",
            "maybe": "possibly", "very": "", "really": "",
            "amazing": "notable", "terrible": "concerning",
            "great": "significant", "awesome": "impressive"
        }
    }
}
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  STYLE TRANSFORMER
# ─────────────────────────────────────────────────────────────────────────────
 
class StyleTransformer:
    """
    Transforms text between writing styles with full explainability.
    
    Each transformation is logged with:
    - What was changed (original → new)
    - Why it was changed (rule category)
    - Which style rule triggered it
    """
 
    def transform(self, text, target_style='formal'):
        """
        Apply style transformation to text.
        
        Returns:
            dict with enhanced text, change log, and explanation summary
        """
        if target_style not in STYLE_PROFILES:
            return {'error': f'Unknown style: {target_style}. Choose from: {list(STYLE_PROFILES.keys())}'}
 
        profile    = STYLE_PROFILES[target_style]
        change_log = []
        result     = text
 
        # Apply word/phrase replacements
        for original, replacement in profile['replacements'].items():
            if not replacement:
                continue  # skip empty replacements for now
 
            # Case-insensitive search with word boundaries
            pattern = r'\b' + re.escape(original) + r'\b'
            matches = list(re.finditer(pattern, result, re.IGNORECASE))
 
            for match in reversed(matches):  # reverse to preserve indices
                matched_text = match.group()
                # Preserve capitalization
                new_text = replacement
                if matched_text[0].isupper():
                    new_text = new_text[0].upper() + new_text[1:] if new_text else new_text
 
                result = result[:match.start()] + new_text + result[match.end():]
                change_log.append({
                    'original'   : matched_text,
                    'replacement': new_text,
                    'rule'       : 'Vocabulary',
                    'reason'     : f'"{matched_text}" → "{new_text}" for {target_style} tone',
                    'category'   : 'Style'
                })
 
        # Baseline polish gives minimum quality improvement even when
        # vocabulary replacements do not match the input text.
        result = self._baseline_polish(result, change_log)

        # Generate diff for explainability
        diff = self._generate_diff(text, result)
 
        return {
            'original'    : text,
            'enhanced'    : result,
            'style'       : target_style,
            'description' : profile['description'],
            'change_log'  : change_log,
            'diff'        : diff,
            'num_changes' : len(change_log)
        }

    def _baseline_polish(self, text, change_log):
        """Apply lightweight cleanup that works on any text."""
        paragraphs = text.split('\n\n')
        polished = []

        for para in paragraphs:
            before = para
            para = re.sub(r'\s+', ' ', para).strip()
            if not para:
                polished.append('')
                continue

            if para[0].isalpha() and para[0].islower():
                para = para[0].upper() + para[1:]
                change_log.append({
                    'original'   : before[:20].strip() or '(start)',
                    'replacement': para[:20],
                    'rule'       : 'Clarity',
                    'reason'     : 'Capitalized the first character of paragraph',
                    'category'   : 'Style'
                })

            if para[-1] not in '.!?':
                old_end = para[-20:]
                para = para + '.'
                change_log.append({
                    'original'   : old_end,
                    'replacement': para[-21:],
                    'rule'       : 'Clarity',
                    'reason'     : 'Added terminal punctuation',
                    'category'   : 'Style'
                })

            polished.append(para)

        return '\n\n'.join(polished).strip()
 
    def _generate_diff(self, original, enhanced):
        """Generate a readable diff between original and enhanced text."""
        orig_words = original.split()
        new_words  = enhanced.split()
 
        matcher = difflib.SequenceMatcher(None, orig_words, new_words)
        diff_blocks = []
 
        for opcode, i1, i2, j1, j2 in matcher.get_opcodes():
            if opcode == 'replace':
                diff_blocks.append({
                    'type'    : 'replace',
                    'original': ' '.join(orig_words[i1:i2]),
                    'new'     : ' '.join(new_words[j1:j2])
                })
            elif opcode == 'delete':
                diff_blocks.append({
                    'type'    : 'delete',
                    'original': ' '.join(orig_words[i1:i2]),
                    'new'     : ''
                })
            elif opcode == 'insert':
                diff_blocks.append({
                    'type'    : 'insert',
                    'original': '',
                    'new'     : ' '.join(new_words[j1:j2])
                })
 
        return diff_blocks
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  EXPLAINABILITY ENGINE
# ─────────────────────────────────────────────────────────────────────────────
 
class ExplainabilityEngine:
    """
    Aggregates all analysis results into a unified explanation report.
    Every issue gets: what it is, where it is, why it matters, how to fix it.
    """
 
    SEVERITY_ORDER = {'high': 0, 'medium': 1, 'low': 2}
 
    def generate_report(self, structure_result, consistency_result,
                        character_result, pacing_result, show_dont_tell_result,
                        style_result=None):
        """
        Combine all analysis results into a single structured report.
        """
        all_issues = []
 
        # Collect all issues from all analyzers
        if structure_result:
            all_issues.extend(structure_result.get('issues', []))
            all_issues.extend([{**s, 'issue': s['message'], 'sentence': ''} 
                               for s in structure_result.get('suggestions', [])])
 
        if consistency_result:
            all_issues.extend(consistency_result.get('issues', []))
 
        if character_result:
            all_issues.extend(character_result.get('issues', []))
 
        if pacing_result:
            all_issues.extend([{**s, 'category': 'Pacing', 'issue': s['message']} 
                               for s in pacing_result.get('suggestions', [])])
 
        if show_dont_tell_result:
            all_issues.extend(show_dont_tell_result)
 
        # Sort by severity
        all_issues.sort(key=lambda x: self.SEVERITY_ORDER.get(x.get('severity', 'low'), 2))
 
        # Group by category
        by_category = defaultdict(list)
        for issue in all_issues:
            cat = issue.get('category', 'General')
            by_category[cat].append(issue)
 
        # Build summary stats
        summary = {
            'total_issues'   : len(all_issues),
            'high_severity'  : sum(1 for i in all_issues if i.get('severity') == 'high'),
            'medium_severity': sum(1 for i in all_issues if i.get('severity') == 'medium'),
            'low_severity'   : sum(1 for i in all_issues if i.get('severity') == 'low'),
            'categories'     : dict(by_category),
            'all_issues'     : all_issues
        }
 
        if structure_result:
            summary['readability_score'] = structure_result.get('readability_score', 0)
            summary['word_count']        = structure_result.get('total_words', 0)
 
        if style_result and 'num_changes' in style_result:
            summary['style_changes'] = style_result['num_changes']
 
        return summary
