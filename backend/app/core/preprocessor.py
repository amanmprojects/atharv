import re
import unicodedata
from typing import List, Tuple, Optional
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

class TextPreprocessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
    
    def normalize(self, text: str) -> str:
        text = unicodedata.normalize('NFKC', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def segment_paragraphs(self, text: str) -> List[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    def segment_sentences(self, text: str) -> List[str]:
        try:
            return sent_tokenize(text)
        except:
            return [s.strip() for s in text.split('.') if s.strip()]
    
    def tokenize(self, text: str) -> List[str]:
        try:
            return word_tokenize(text.lower())
        except:
            return text.lower().split()
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        return [t for t in tokens if t.isalpha() and t not in self.stop_words]
    
    def get_text_statistics(self, text: str) -> dict:
        paragraphs = self.segment_paragraphs(text)
        sentences = self.segment_sentences(text)
        words = self.tokenize(text)
        
        return {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "paragraph_count": len(paragraphs),
            "avg_words_per_sentence": len(words) / len(sentences) if sentences else 0,
            "avg_sentences_per_paragraph": len(sentences) / len(paragraphs) if paragraphs else 0,
            "unique_words": len(set(w.lower() for w in words if w.isalpha())),
        }
    
    def detect_language(self, text: str) -> str:
        common_english = {'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should'}
        tokens = set(self.tokenize(text))
        overlap = len(tokens & common_english)
        return "en" if overlap > 2 else "unknown"
    
    def extract_structure(self, text: str) -> dict:
        paragraphs = self.segment_paragraphs(text)
        structure = {
            "paragraphs": [],
            "headings": [],
        }
        
        for i, para in enumerate(paragraphs):
            sentences = self.segment_sentences(para)
            para_info = {
                "index": i,
                "text": para,
                "sentence_count": len(sentences),
                "word_count": len(self.tokenize(para)),
                "sentences": sentences,
            }
            structure["paragraphs"].append(para_info)
            
            if para.startswith('#') or (len(para) < 100 and not para.endswith('.')):
                structure["headings"].append({"index": i, "text": para})
        
        return structure
