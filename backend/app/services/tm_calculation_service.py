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
            text1: First text string (OCR text)
            text2: Second text string (TM source text)

        Returns:
            Similarity score between 0.0 and 1.0
        """
        if not text1 or not text2:
            return 0.0

        # Normalize texts for comparison
        norm_text1 = self._normalize_text(text1)
        norm_text2 = self._normalize_text(text2)

        # Exact match after normalization
        if norm_text1 == norm_text2:
            return 1.0

        # Check for exact word matches (case-insensitive)
        word_match_score = self._calculate_word_match_score(norm_text1, norm_text2)
        if word_match_score >= 0.9:  # If we have a very high word match, return it
            return word_match_score

        # Check if shorter text is contained in longer text (substring matching)
        substring_score = self._calculate_substring_score(norm_text1, norm_text2)

        # Use difflib's SequenceMatcher for similarity calculation
        sequence_similarity = difflib.SequenceMatcher(None, norm_text1, norm_text2).ratio()

        # Apply fuzzy matching bonus for partial matches
        fuzzy_bonus = self._calculate_fuzzy_bonus(norm_text1, norm_text2)

        # Combine all scores with weights
        # Prioritize word matches and substring matches over sequence similarity
        final_score = max(
            word_match_score,
            substring_score,
            (sequence_similarity * 0.6) + (fuzzy_bonus * 0.4)
        )

        # Debug logging for similarity calculation
        if word_match_score > 0 or substring_score > 0 or sequence_similarity > 0.1:
            print(f"  📊 Similarity breakdown: word={word_match_score:.3f}, substring={substring_score:.3f}, sequence={sequence_similarity:.3f}, fuzzy={fuzzy_bonus:.3f} -> final={final_score:.3f}")

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

    def _calculate_word_match_score(self, text1: str, text2: str) -> float:
        """
        Calculate similarity based on exact word matches
        Handles cases like "AIR" matching "air" perfectly
        """
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0.0

        # Check for exact word matches
        common_words = words1.intersection(words2)

        if not common_words:
            return 0.0

        # If one text is a single word and it matches a word in the other text
        if len(words2) == 1 and words2.issubset(words1):
            return 1.0  # Perfect match for single word
        elif len(words1) == 1 and words1.issubset(words2):
            return 1.0  # Perfect match for single word

        # Calculate score based on word overlap
        total_unique_words = len(words1.union(words2))
        return len(common_words) / total_unique_words

    def _calculate_substring_score(self, text1: str, text2: str) -> float:
        """
        Calculate similarity based on substring containment
        """
        # Check if shorter text is contained in longer text
        shorter = text1 if len(text1) <= len(text2) else text2
        longer = text2 if len(text1) <= len(text2) else text1

        if shorter in longer:
            # Score based on how much of the longer text the shorter text represents
            return len(shorter) / len(longer)

        return 0.0

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
        threshold: float = 0.1
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

                # Debug logging for TM calculation
                print(f"🔍 TM Debug: OCR='{ocr_text}' vs TM='{tm_entry.source_text}' -> Score: {similarity:.3f}")

                # Update best match if this is better
                if similarity > best_score and similarity >= threshold:
                    best_score = similarity
                    best_match = tm_entry
                    print(f"✅ New best match: {similarity:.3f} for '{tm_entry.source_text}'")

            print(f"🎯 Final TM result: Best score = {best_score:.3f}, Threshold = {threshold}")
            
            return best_score, best_match
            
        except Exception as e:
            print(f"❌ Error calculating TM score: {str(e)}")
            return 0.0, None
    
    async def calculate_tm_score_with_suggestions(
        self,
        ocr_text: str,
        series_id: str,
        max_suggestions: int = 3,
        threshold: float = 0.1
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
