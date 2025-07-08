from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    EDITOR = "editor"
    TRANSLATOR = "translator"


class SeriesStatus(str, Enum):
    """Series status enumeration"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    DROPPED = "dropped"


class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    name: str
    role: UserRole


class UserCreate(UserBase):
    """User creation model"""
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    role: Optional[UserRole] = None
    avatar_url: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """User profile update model (for users updating their own profile)"""
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserRoleUpdate(BaseModel):
    """User role update model"""
    role: UserRole


class UserResponse(UserBase):
    """User response model"""
    id: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """User model as stored in database"""
    pass


class CreateUserRequest(BaseModel):
    """Request model for creating a user after Supabase auth signup"""
    user_id: str
    email: EmailStr
    name: str
    role: UserRole = UserRole.TRANSLATOR
    avatar_url: str = ""


class ApiResponse(BaseModel):
    """Generic API response model"""
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    error_code: Optional[str] = None


# Series Models
class SeriesBase(BaseModel):
    """Base series model"""
    title: str
    total_chapters: int = 0
    language: str = "korean"


class SeriesCreate(BaseModel):
    """Series creation model - only requires title"""
    title: str
    language: str = "korean"

    class Config:
        # Ensure proper JSON parsing
        str_strip_whitespace = True
        validate_assignment = True


class SeriesUpdate(BaseModel):
    """Series update model"""
    title: Optional[str] = None
    total_chapters: Optional[int] = None
    language: Optional[str] = None


class SeriesResponse(SeriesBase):
    """Series response model"""
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SeriesInDB(SeriesResponse):
    """Series model as stored in database"""
    pass


# Chapter Models
class ChapterStatus(str, Enum):
    """Chapter status enumeration"""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    TRANSLATED = "translated"


class GlossaryCategory(str, Enum):
    """AI Glossary category enumeration"""
    CHARACTER = "character"
    ITEM = "item"
    PLACE = "place"
    TERM = "term"
    OTHER = "other"


class ChapterBase(BaseModel):
    """Base chapter model"""
    chapter_number: int
    status: ChapterStatus = ChapterStatus.DRAFT
    page_count: int = 0
    next_page: int = 1
    context: str = ""


class ChapterCreate(BaseModel):
    """Chapter creation model - only requires chapter_number"""
    chapter_number: int

    class Config:
        str_strip_whitespace = True
        validate_assignment = True
        # Ensure proper JSON parsing
        json_encoders = {}
        # Allow population by field name (Pydantic v2)
        populate_by_name = True


class ChapterUpdate(BaseModel):
    """Chapter update model"""
    chapter_number: Optional[int] = None
    status: Optional[ChapterStatus] = None
    page_count: Optional[int] = None
    next_page: Optional[int] = None
    context: Optional[str] = None


class ChapterResponse(ChapterBase):
    """Chapter response model"""
    id: str
    series_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterInDB(ChapterResponse):
    """Chapter model as stored in database"""
    pass


# Translation Memory Models
class TranslationMemoryBase(BaseModel):
    """Base translation memory model"""
    series_id: str
    source_text: str
    target_text: str
    context: Optional[str] = None
    usage_count: int = 0


class TranslationMemoryCreate(BaseModel):
    """Translation memory creation model"""
    series_id: str
    source_text: str
    target_text: str
    context: Optional[str] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TranslationMemoryUpdate(BaseModel):
    """Translation memory update model"""
    source_text: Optional[str] = None
    target_text: Optional[str] = None
    context: Optional[str] = None
    usage_count: Optional[int] = None


class TranslationMemoryResponse(TranslationMemoryBase):
    """Translation memory response model"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranslationMemoryInDB(TranslationMemoryResponse):
    """Translation memory model as stored in database"""
    pass




    class Config:
        from_attributes = True


# OCR Models
class OCRRequest(BaseModel):
    """OCR request model"""
    image_data: str  # Base64 encoded image data

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class OCRResponse(BaseModel):
    """OCR response model"""
    success: bool
    text: str
    confidence: Optional[float] = None
    processing_time: Optional[float] = None
    detected_language: Optional[str] = None  # Language code detected by OCR
    language_confidence: Optional[float] = None  # Confidence of language detection

    class Config:
        from_attributes = True


class OCRWithTranslationResponse(BaseModel):
    """OCR response model with translation"""
    success: bool
    original_text: str  # Original text from OCR (any supported language)
    translated_text: str  # English translation
    confidence: Optional[float] = None
    processing_time: Optional[float] = None
    translation_time: Optional[float] = None
    total_time: Optional[float] = None
    detected_language: Optional[str] = None  # Language code detected by OCR
    language_confidence: Optional[float] = None  # Confidence of language detection

    class Config:
        from_attributes = True


# Text Region Detection Models
class TextRegion(BaseModel):
    """Individual text region with bounding box and extracted text"""
    x: int
    y: int
    width: int
    height: int
    text: str
    confidence: float

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TextRegionDetectionResponse(BaseModel):
    """Response model for text region detection"""
    success: bool
    text_regions: List[TextRegion]
    processing_time: float
    detected_language: Optional[str] = None
    language_confidence: Optional[float] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


# Translation Models
class TranslationRequest(BaseModel):
    """Translation request model"""
    source_text: str
    target_language: Optional[str] = None
    context: Optional[str] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TranslationResponse(BaseModel):
    """Translation response model"""
    success: bool
    source_text: str
    translated_text: str
    target_language: str
    processing_time: Optional[float] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None

    class Config:
        from_attributes = True


class EnhancedTranslationRequest(BaseModel):
    """Enhanced translation request with series context"""
    source_text: str
    target_language: Optional[str] = None
    series_context: Optional[str] = None
    character_names: Optional[list[str]] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


# Text Box Translation Data for Chapter Analysis
class TextBoxTranslationData(BaseModel):
    """Translation data for a text box in chapter analysis"""
    x: int
    y: int
    w: int
    h: int
    ocr_text: Optional[str] = None
    translated_text: Optional[str] = None
    corrected_text: Optional[str] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


# Chapter Analysis Models
class PageAnalysisData(BaseModel):
    """Data for a single page in chapter analysis"""
    page_number: int
    image_url: str
    ocr_context: Optional[str] = None
    text_boxes: Optional[list[TextBoxTranslationData]] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class ChapterAnalysisRequest(BaseModel):
    """Chapter analysis request model"""
    pages: list[PageAnalysisData]  # Sorted page images and OCR contexts by page number
    translation_info: list[str]  # Translation information/rules to follow
    existing_context: Optional[str] = None  # Existing context to follow for consistency

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


# Page Models
class PageBase(BaseModel):
    """Base page model"""
    chapter_id: str
    page_number: int
    file_name: str
    width: Optional[int] = 0
    height: Optional[int] = 0

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class PageCreate(BaseModel):
    """Page creation model"""
    chapter_id: str
    page_number: int
    file_name: str
    width: Optional[int] = 0
    height: Optional[int] = 0

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class PageUpdate(BaseModel):
    """Page update model"""
    page_number: Optional[int] = None
    file_name: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class PageResponse(BaseModel):
    """Page response model"""
    id: str
    chapter_id: str
    page_number: int
    file_path: str
    file_name: str
    width: int
    height: int
    created_at: str
    updated_at: str

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class BatchCreatePageData(BaseModel):
    """Batch page creation model"""
    chapter_id: str
    start_page_number: int

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class BatchPageUploadResponse(BaseModel):
    """Batch page upload response model"""
    success: bool
    message: str
    pages: List[PageResponse]
    total_uploaded: int
    failed_uploads: List[str]

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


# People Analysis Models
class PersonInfo(BaseModel):
    """Information about a person/character detected in the series - DEPRECATED: Use TerminologyInfo instead"""
    id: str
    name: str
    description: str
    image_url: Optional[str] = None
    mentioned_chapters: list[int]
    confidence_score: Optional[float] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TerminologyInfo(BaseModel):
    """Terminology information model for AI glossary analysis"""
    id: str
    name: str  # Display name
    translated_text: str  # English translation of description
    category: GlossaryCategory  # Type: character, place, item, skill, technique, organization, etc.
    description: str  # Detailed description in series language
    mentioned_chapters: list[int] = []
    confidence_score: Optional[float] = 0.8
    image_url: Optional[str] = None  # Best image showing this term

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class PeopleAnalysisRequest(BaseModel):
    series_id: str
    force_refresh: bool = False  # Whether to force re-analysis even if data exists

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TerminologyAnalysisRequest(BaseModel):
    series_id: str
    force_refresh: bool = False  # Whether to force re-analysis even if data exists

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class PeopleAnalysisResponse(BaseModel):
    success: bool
    people: list[PersonInfo]
    total_people_found: int
    processing_time: Optional[float] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None

    class Config:
        from_attributes = True


class TerminologyAnalysisResponse(BaseModel):
    success: bool
    terminology: list[TerminologyInfo]
    total_terms_found: int
    processing_time: Optional[float] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None

    class Config:
        from_attributes = True


# AI Glossary Models
class AIGlossaryBase(BaseModel):
    """Base AI glossary model"""
    name: str  # Display name
    translated_text: str  # English translation of description
    category: GlossaryCategory  # Type of term: character, place, item, skill, technique, organization, etc.
    description: str  # Detailed description in series language
    tm_related_ids: Optional[List[str]] = None  # TM entry IDs that helped create this glossary entry

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class AIGlossaryCreate(BaseModel):
    """AI glossary creation model"""
    series_id: str
    name: str  # Display name
    translated_text: str  # English translation of description
    category: GlossaryCategory  # Term category
    description: str  # Description in series language
    tm_related_ids: Optional[List[str]] = None  # Optional for backward compatibility

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class AIGlossaryUpdate(BaseModel):
    """AI glossary update model"""
    name: Optional[str] = None
    translated_text: Optional[str] = None
    category: Optional[GlossaryCategory] = None
    description: Optional[str] = None
    tm_related_ids: Optional[List[str]] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class AIGlossaryResponse(AIGlossaryBase):
    """AI glossary response model"""
    id: str
    series_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AIGlossaryInDB(AIGlossaryResponse):
    """AI glossary model for database operations"""
    pass


class ChapterAnalysisResponse(BaseModel):
    """Chapter analysis response model"""
    success: bool
    chapter_context: str
    analysis_summary: str
    processing_time: Optional[float] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None

    class Config:
        from_attributes = True


# Text Box Models
class TextBoxBase(BaseModel):
    """Base text box model"""
    page_id: str
    image: Optional[str] = None  # URL of the original page image
    x: int
    y: int
    w: int
    h: int
    ocr: Optional[str] = None
    corrected: Optional[str] = None
    tm: Optional[float] = None  # Translation memory score
    reason: Optional[str] = None


class TextBoxCreate(BaseModel):
    """Text box creation model"""
    page_id: str
    image: Optional[str] = None
    x: int
    y: int
    w: int
    h: int
    ocr: Optional[str] = None
    corrected: Optional[str] = None
    tm: Optional[float] = None
    reason: Optional[str] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class TextBoxUpdate(BaseModel):
    """Text box update model"""
    image: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None
    w: Optional[int] = None
    h: Optional[int] = None
    ocr: Optional[str] = None
    corrected: Optional[str] = None
    tm: Optional[float] = None
    reason: Optional[str] = None


class TextBoxResponse(TextBoxBase):
    """Text box response model"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TextBoxInDB(TextBoxResponse):
    """Text box model as stored in database"""
    pass


# Dashboard Models
class DashboardTableRecord(BaseModel):
    """Dashboard table record model"""
    id: int
    total_series: int
    progress_chapters: int
    processed_pages: int
    translated_textbox: int
    recent_activities: list[str]

    class Config:
        str_strip_whitespace = True
        validate_assignment = True


class DashboardUpdateRequest(BaseModel):
    """Dashboard update request model"""
    total_series: Optional[int] = None
    progress_chapters: Optional[int] = None
    processed_pages: Optional[int] = None
    translated_textbox: Optional[int] = None
    recent_activities: Optional[list[str]] = None

    class Config:
        str_strip_whitespace = True
        validate_assignment = True





class DashboardResponse(BaseModel):
    """Complete dashboard response model"""
    total_series: int
    progress_chapters: int
    processed_pages: int
    translated_textbox: int
    recent_activities: list[str]

    class Config:
        str_strip_whitespace = True
        validate_assignment = True
