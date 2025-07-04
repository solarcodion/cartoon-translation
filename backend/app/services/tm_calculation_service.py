from typing import List, Optional, Tuple
import difflib
import re
from supabase import Client
from app.services.translation_memory_service import TranslationMemoryService
from app.models import TranslationMemoryResponse


class TMCalculationService:
    """Service for calculating Translation Memory similarity scores"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.tm_service = TranslationMemoryService(supabase)
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two text strings using multiple algorithms
        
        Args:
            text1: First text string
            text2: Second text string
            
        Returns:
            Similarity score between 0.0 and 1.0
        """
        if not text1 or not text2:
            return 0.0
        
        # Normalize texts for comparison
        norm_text1 = self._normalize_text(text1)
        norm_text2 = self._normalize_text(text2)
        
        if norm_text1 == norm_text2:
            return 1.0
        
        # Use difflib's SequenceMatcher for similarity calculation
        similarity = difflib.SequenceMatcher(None, norm_text1, norm_text2).ratio()
        
        # Apply fuzzy matching bonus for partial matches
        fuzzy_bonus = self._calculate_fuzzy_bonus(norm_text1, norm_text2)
        
        # Combine similarity with fuzzy bonus (weighted average)
        final_score = (similarity * 0.8) + (fuzzy_bonus * 0.2)
        
        return min(final_score, 1.0)
    
    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for comparison by removing extra whitespace,
        converting to lowercase, and removing punctuation
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common punctuation but keep essential characters
        text = re.sub(r'[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ一-龯ひらがなカタカナ]', '', text)
        
        return text.strip()
    
    def _calculate_fuzzy_bonus(self, text1: str, text2: str) -> float:
        """
        Calculate fuzzy matching bonus for partial word matches
        """
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        # Calculate word overlap
        common_words = words1.intersection(words2)
        total_words = words1.union(words2)
        
        if not total_words:
            return 0.0
        
        return len(common_words) / len(total_words)
    
    async def calculate_tm_score(
        self, 
        ocr_text: str, 
        series_id: str,
        threshold: float = 0.3
    ) -> Tuple[float, Optional[TranslationMemoryResponse]]:
        """
        Calculate TM score for OCR text against existing translation memory
        
        Args:
            ocr_text: The OCR text to match against
            series_id: The series ID to search TM entries for
            threshold: Minimum similarity threshold (default: 0.3)
            
        Returns:
            Tuple of (best_score, best_match_entry)
        """
        try:
            if not ocr_text or not ocr_text.strip():
                return 0.0, None
            
            # Get all TM entries for the series
            tm_entries = await self.tm_service.get_all_tm_entries_for_analysis(series_id)
            
            if not tm_entries:
                return 0.0, None
            
            best_score = 0.0
            best_match = None
            
            # Compare OCR text with each TM entry's source text
            for tm_entry in tm_entries:
                if not tm_entry.source_text:
                    continue
                
                # Calculate similarity with source text
                similarity = self.calculate_similarity(ocr_text, tm_entry.source_text)
                
                # Update best match if this is better
                if similarity > best_score and similarity >= threshold:
                    best_score = similarity
                    best_match = tm_entry
            
            return best_score, best_match
            
        except Exception as e:
            print(f"❌ Error calculating TM score: {str(e)}")
            return 0.0, None
    
    async def calculate_tm_score_with_suggestions(
        self, 
        ocr_text: str, 
        series_id: str,
        max_suggestions: int = 3,
        threshold: float = 0.3
    ) -> Tuple[float, List[Tuple[TranslationMemoryResponse, float]]]:
        """
        Calculate TM score and return top matching suggestions
        
        Args:
            ocr_text: The OCR text to match against
            series_id: The series ID to search TM entries for
            max_suggestions: Maximum number of suggestions to return
            threshold: Minimum similarity threshold
            
        Returns:
            Tuple of (best_score, list_of_suggestions_with_scores)
        """
        try:
            if not ocr_text or not ocr_text.strip():
                return 0.0, []
            
            # Get all TM entries for the series
            tm_entries = await self.tm_service.get_all_tm_entries_for_analysis(series_id)
            
            if not tm_entries:
                return 0.0, []
            
            suggestions = []
            
            # Calculate similarity for each TM entry
            for tm_entry in tm_entries:
                if not tm_entry.source_text:
                    continue
                
                similarity = self.calculate_similarity(ocr_text, tm_entry.source_text)
                
                if similarity >= threshold:
                    suggestions.append((tm_entry, similarity))
            
            # Sort by similarity score (descending)
            suggestions.sort(key=lambda x: x[1], reverse=True)
            
            # Limit to max_suggestions
            suggestions = suggestions[:max_suggestions]
            
            # Get best score
            best_score = suggestions[0][1] if suggestions else 0.0
            
            return best_score, suggestions
            
        except Exception as e:
            print(f"❌ Error calculating TM score with suggestions: {str(e)}")
            return 0.0, []
    
    def get_tm_quality_label(self, score: float) -> str:
        """
        Get a human-readable label for TM quality based on score
        
        Args:
            score: TM similarity score (0.0 to 1.0)
            
        Returns:
            Quality label string
        """
        if score >= 0.95:
            return "Perfect Match"
        elif score >= 0.85:
            return "Excellent Match"
        elif score >= 0.75:
            return "Good Match"
        elif score >= 0.60:
            return "Fair Match"
        elif score >= 0.40:
            return "Partial Match"
        elif score >= 0.20:
            return "Weak Match"
        else:
            return "No Match"
    
    def get_tm_quality_color(self, score: float) -> str:
        """
        Get a color code for TM quality visualization
        
        Args:
            score: TM similarity score (0.0 to 1.0)
            
        Returns:
            Color code string (for CSS classes)
        """
        if score >= 0.95:
            return "green"
        elif score >= 0.85:
            return "blue"
        elif score >= 0.75:
            return "yellow"
        elif score >= 0.60:
            return "orange"
        elif score >= 0.40:
            return "red"
        else:
            return "gray"
