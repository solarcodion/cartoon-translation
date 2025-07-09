# ManhwaTrans Backend

FastAPI backend for the ManhwaTrans application - a comprehensive AI-powered manhwa translation platform with advanced OCR, translation memory, and collaborative workflow management.

## 🚀 Features

### Core Functionality

- **User Management**: Complete CRUD operations with role-based access control (Admin, Editor, Translator)
- **Series Management**: Manhwa series organization with language support and metadata
- **Chapter Workflow**: Progress tracking with status management (draft, in_progress, translated)
- **Page Management**: Multi-image upload with automatic processing and organization
- **Text Box System**: Individual text element management with OCR and translation data

### AI & OCR Capabilities

- **Advanced OCR**: Multi-language text extraction (Korean, Japanese, Chinese, Vietnamese, English)
- **OpenAI Integration**: GPT-4o-mini for enhanced OCR accuracy and translation
- **Smart Text Detection**: Automatic text region identification and segmentation
- **Image Preprocessing**: Advanced image enhancement for better OCR results
- **Bounding Box Management**: Interactive text area selection and editing

### Translation & Memory

- **AI-Powered Translation**: Context-aware translation with character name preservation
- **Translation Memory**: Smart suggestions and reuse of previous translations
- **Enhanced Translation**: Series-specific context and terminology consistency
- **Quality Assurance**: Confidence scoring and validation
- **Batch Processing**: Efficient handling of multiple text elements

### Analytics & Collaboration

- **Real-time Dashboard**: Live statistics and progress tracking
- **WebSocket Support**: Real-time notifications and updates
- **Activity Tracking**: Comprehensive audit trail and user actions
- **AI Analysis**: Character identification and terminology extraction
- **Smart Glossary**: Categorized manhwa-specific terminology database

### Technical Features

- **Supabase Integration**: PostgreSQL database with real-time capabilities
- **JWT Authentication**: Secure API endpoints with Supabase JWT tokens
- **RESTful API**: Well-structured REST endpoints with proper HTTP status codes
- **Auto Documentation**: Swagger UI and ReDoc for API documentation
- **Background Processing**: Queue-based image and text processing
- **Error Handling**: Comprehensive error management with detailed responses

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment file and configure:

```bash
cp .env.example .env
```

4. Configure your `.env` file with your Supabase and OpenAI credentials:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (Required for OCR and Translation)
***REMOVED***your_openai_api_key_here

# API Configuration
API_TITLE=ManhwaTrans API
API_VERSION=1.0.0
API_DESCRIPTION=FastAPI backend for ManhwaTrans application

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# OCR Configuration
# Each language is configured to work with English for optimal performance
OCR_LANGUAGE_KOREAN=ko,en
OCR_LANGUAGE_JAPANESE=ja,en
OCR_LANGUAGE_CHINESE=ch_sim,en
OCR_LANGUAGE_VIETNAMESE=vi,en
OCR_LANGUAGE_ENGLISH=en
OCR_AUTO_DETECT_LANGUAGE=true

# Translation Configuration
TRANSLATION_TARGET_LANGUAGE=english
TRANSLATION_SERVICE=openai_gpt

# WebSocket Configuration
WEBSOCKET_ENABLED=true
```

5. Set up your Supabase database with the complete schema:

```sql
-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'translator')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create series table
CREATE TABLE series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    total_chapters INTEGER DEFAULT 0,
    language VARCHAR(20) DEFAULT 'korean' CHECK (language IN ('korean', 'japanese', 'chinese', 'vietnamese', 'english')),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series (id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'in_progress', 'translated')
    ),
    page_count INTEGER DEFAULT 0,
    next_page INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (series_id, chapter_number)
);

-- Create pages table
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (chapter_id, page_number)
);

-- Create text_boxes table
CREATE TABLE text_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    ocr_text TEXT,
    translated_text TEXT,
    confidence FLOAT DEFAULT 0.0,
    tm_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create translation_memory table
CREATE TABLE translation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series (id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    context TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (series_id, source_text)
);

-- Create ai_glossary table
CREATE TABLE ai_glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES series (id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('character', 'place', 'item', 'skill', 'technique', 'organization', 'term', 'other')
    ),
    description TEXT,
    confidence_score FLOAT DEFAULT 0.8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (series_id, original_text, category)
);

-- Create dashboard table for analytics
CREATE TABLE dashboard (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_series INTEGER DEFAULT 0,
    progress_chapters INTEGER DEFAULT 0,
    processed_pages INTEGER DEFAULT 0,
    translated_textbox INTEGER DEFAULT 0,
    recent_activities TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial dashboard record
INSERT INTO dashboard (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
```

6. Run the development server:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, you can access:

- API Documentation (Swagger UI): http://localhost:8000/docs
- Alternative API Documentation (ReDoc): http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## 📚 API Endpoints

### User Management

- `POST /api/users/` - Create a new user
- `GET /api/users/` - Get all users (with pagination) - **Requires authentication**
- `GET /api/users/me` - Get current user profile - **Requires authentication**
- `GET /api/users/{user_id}` - Get user by ID - **Requires authentication**
- `GET /api/users/email/{email}` - Get user by email - **Requires authentication**
- `PUT /api/users/me` - Update own profile (name, avatar) - **Requires authentication**
- `PUT /api/users/{user_id}` - Update user information - **Requires authentication + admin for other users**
- `PUT /api/users/{user_id}/role` - Update user role - **Requires admin permissions**
- `DELETE /api/users/{user_id}` - Delete user - **Requires admin permissions**

#### User Update API Details

**Update Own Profile** (`PUT /api/users/me`)

- Users can update their own name and avatar_url
- Users cannot update their own role (admin-only operation)
- Request body: `{"name": "string", "avatar_url": "string"}`

**Update Any User** (`PUT /api/users/{user_id}`)

- Users can update their own profile (name, avatar_url only)
- Admins can update any user's information including role
- Users cannot update their own role even through this endpoint
- Request body: `{"name": "string", "role": "admin|editor|translator", "avatar_url": "string"}`

**Update User Role** (`PUT /api/users/{user_id}/role`)

- Only admins can update user roles
- Users cannot update their own role (another admin must do it)
- Request body: `{"role": "admin|editor|translator"}`

#### Authorization Rules

1. **Self-Profile Updates**: Users can update their own name and avatar_url
2. **Role Updates**: Only admins can update roles, and users cannot update their own role
3. **Admin Operations**: Admins can update any user's information and delete users
4. **Self-Protection**: Users cannot delete their own account or update their own role

### Series Management

- `POST /api/series/` - Create a new series - **Requires authentication**
- `GET /api/series/` - Get all series (with pagination) - **Requires authentication**
- `GET /api/series/{series_id}` - Get series by ID - **Requires authentication**
- `PUT /api/series/{series_id}` - Update series - **Requires authentication**
- `DELETE /api/series/{series_id}` - Delete series - **Requires authentication**
- `GET /api/series/stats` - Get series statistics - **Requires authentication**

### Chapter Management

- `POST /api/chapters/series/{series_id}` - Create a new chapter for a series - **Requires authentication**
- `GET /api/chapters/series/{series_id}` - Get all chapters for a series (with pagination) - **Requires authentication**
- `GET /api/chapters/{chapter_id}` - Get chapter by ID - **Requires authentication**
- `PUT /api/chapters/{chapter_id}` - Update chapter - **Requires authentication**
- `DELETE /api/chapters/{chapter_id}` - Delete chapter - **Requires authentication**
- `GET /api/chapters/series/{series_id}/count` - Get chapter count for a series - **Requires authentication**
- `POST /api/chapters/{chapter_id}/reset` - Reset chapter context and translations - **Requires authentication**

### Page Management

- `POST /api/pages/chapter/{chapter_id}` - Create new pages for a chapter - **Requires authentication**
- `GET /api/pages/chapter/{chapter_id}` - Get all pages for a chapter - **Requires authentication**
- `GET /api/pages/{page_id}` - Get page by ID - **Requires authentication**
- `PUT /api/pages/{page_id}` - Update page information - **Requires authentication**
- `DELETE /api/pages/{page_id}` - Delete page - **Requires authentication**
- `POST /api/pages/{page_id}/process` - Process page for text detection - **Requires authentication**
- `POST /api/pages/upload` - Upload multiple images and create pages - **Requires authentication**

### Text Box Management

- `GET /api/text-boxes/page/{page_id}` - Get all text boxes for a page - **Requires authentication**
- `POST /api/text-boxes/` - Create a new text box - **Requires authentication**
- `PUT /api/text-boxes/{text_box_id}` - Update text box - **Requires authentication**
- `DELETE /api/text-boxes/{text_box_id}` - Delete text box - **Requires authentication**
- `POST /api/text-boxes/{text_box_id}/calculate-tm` - Calculate translation memory score - **Requires authentication**
- `POST /api/text-boxes/batch-update` - Update multiple text boxes - **Requires authentication**

### OCR & Text Detection

- `POST /api/ocr/extract-text` - Extract text from image using OCR - **Requires authentication**
- `POST /api/ocr/extract-text-enhanced` - Enhanced OCR with preprocessing - **Requires authentication**
- `POST /api/ocr/extract-text-with-translation` - OCR + translation in one step - **Requires authentication**
- `POST /api/ocr/extract-text-enhanced-with-translation` - Enhanced OCR + translation - **Requires authentication**
- `POST /api/ocr/detect-text-regions` - Detect multiple text regions in image - **Requires authentication**

### Translation Services

- `POST /api/translation/translate` - Translate text using AI - **Requires authentication**
- `POST /api/translation/translate-enhanced` - Enhanced translation with context - **Requires authentication**
- `POST /api/translation/batch-translate` - Translate multiple texts - **Requires authentication**

### Translation Memory

- `GET /api/translation-memory/series/{series_id}` - Get translation memory for series - **Requires authentication**
- `POST /api/translation-memory/` - Create translation memory entry - **Requires authentication**
- `PUT /api/translation-memory/{tm_id}` - Update translation memory entry - **Requires authentication**
- `DELETE /api/translation-memory/{tm_id}` - Delete translation memory entry - **Requires authentication**
- `POST /api/translation-memory/search` - Search translation memory - **Requires authentication**

### AI Glossary

- `GET /api/ai-glossary/series/{series_id}` - Get AI glossary for series - **Requires authentication**
- `POST /api/ai-glossary/` - Create glossary entry - **Requires authentication**
- `PUT /api/ai-glossary/{glossary_id}` - Update glossary entry - **Requires authentication**
- `DELETE /api/ai-glossary/{glossary_id}` - Delete glossary entry - **Requires authentication**
- `GET /api/ai-glossary/categories` - Get available categories - **Requires authentication**

### Dashboard

- `GET /api/dashboard/` - Get complete dashboard data (stats + recent activities) - **Requires authentication**
- `GET /api/dashboard/stats` - Get overall dashboard statistics - **Requires authentication**
- `GET /api/dashboard/stats/chapters` - Get chapter status statistics - **Requires authentication**
- `GET /api/dashboard/stats/users` - Get user role statistics - **Requires authentication**
- `GET /api/dashboard/activities` - Get recent activities (with optional limit parameter) - **Requires authentication**

### Authentication

All endpoints except the root endpoint require authentication via Supabase JWT token.
Include the token in the Authorization header: `Bearer <your_jwt_token>`

## 📁 Project Structure

```
backend/
├── main.py                           # FastAPI application entry point
├── requirements.txt                  # Python dependencies
├── .env.example                     # Environment variables template
├── Dockerfile                       # Docker configuration
├── migrations/                      # Database migration scripts
│   └── add_next_page_to_chapters.sql
├── app/
│   ├── __init__.py
│   ├── config.py                    # Application configuration
│   ├── database.py                  # Supabase client setup
│   ├── auth.py                      # Authentication middleware
│   ├── models.py                    # Pydantic models and schemas
│   ├── routers/                     # API endpoint definitions
│   │   ├── __init__.py
│   │   ├── users.py                 # User management endpoints
│   │   ├── series.py                # Series management endpoints
│   │   ├── chapters.py              # Chapter management endpoints
│   │   ├── pages.py                 # Page management endpoints
│   │   ├── text_boxes.py            # Text box management endpoints
│   │   ├── ocr.py                   # OCR and text detection endpoints
│   │   ├── translation.py           # Translation service endpoints
│   │   ├── translation_memory.py    # Translation memory endpoints
│   │   ├── ai_glossary.py           # AI glossary endpoints
│   │   └── dashboard.py             # Dashboard and analytics endpoints
│   └── services/                    # Business logic and service layer
│       ├── __init__.py
│       ├── user_service.py          # User business logic
│       ├── series_service.py        # Series business logic
│       ├── chapter_service.py       # Chapter business logic
│       ├── page_service.py          # Page business logic
│       ├── text_box_service.py      # Text box business logic
│       ├── ocr_service.py           # OCR and image processing
│       ├── translation_service.py   # AI translation services
│       ├── translation_memory_service.py # Translation memory logic
│       ├── ai_glossary_service.py   # AI glossary management
│       ├── dashboard_service.py     # Dashboard analytics
│       ├── notification_service.py  # WebSocket notifications
│       └── people_analysis_service.py # Character and terminology analysis
└── README.md                        # This file
```

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **User Registration**: When users sign up via Supabase Auth UI in the frontend, the AuthProvider automatically calls the backend to create a user record in the database.

2. **Authentication**: The frontend passes Supabase JWT tokens to authenticate API requests.

3. **User Management**: The Users page in the frontend uses these APIs to display and manage users.

## 🔧 Development

### Key Technologies

- **FastAPI**: Modern, fast web framework for building APIs with Python
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **OpenAI GPT-4o-mini**: AI model for OCR enhancement and translation
- **EasyOCR**: Optical character recognition library
- **OpenCV**: Computer vision library for image processing
- **Pillow**: Python Imaging Library for image manipulation
- **WebSocket**: Real-time communication for notifications

### Development Workflow

1. **Environment Setup**: Configure `.env` with all required API keys
2. **Database Migration**: Run SQL scripts to set up database schema
3. **Service Testing**: Use Swagger UI at `/docs` for API testing
4. **Background Processing**: Monitor queue-based image processing
5. **Error Monitoring**: Check logs for OCR and translation errors

### Code Organization

- **Models**: Pydantic schemas for request/response validation
- **Routers**: FastAPI route handlers organized by feature
- **Services**: Business logic separated from API endpoints
- **Dependencies**: Dependency injection for database and external services
- **Middleware**: Authentication, CORS, and error handling

### Testing

```bash
# Run tests (when implemented)
python -m pytest tests/

# Test specific endpoints
python -m pytest tests/test_ocr.py
python -m pytest tests/test_translation.py
```

### Performance Considerations

- **Background Processing**: OCR and translation run in background queues
- **Caching**: Translation memory provides caching for repeated translations
- **Database Optimization**: Proper indexing on frequently queried fields
- **Image Processing**: Efficient image preprocessing and compression
- **Rate Limiting**: OpenAI API rate limiting and retry logic

## 🚢 Deployment

### Docker Deployment

```bash
# Build the Docker image
docker build -t manhwatrans-backend .

# Run the container
docker run -d \
  --name manhwatrans-backend \
  -p 8000:8000 \
  --env-file .env \
  manhwatrans-backend
```

### Production Environment Variables

```env
# Production Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_production_service_key
SUPABASE_ANON_KEY=your_production_anon_key

# Production OpenAI
***REMOVED***your_production_openai_key

# Production Server
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Production CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Health Checks

- **Health Endpoint**: `GET /health` - Basic health check
- **Database Check**: Verify Supabase connection
- **OpenAI Check**: Verify API key and service availability
- **OCR Check**: Test EasyOCR initialization

### Monitoring

- **Logs**: Structured logging for all operations
- **Metrics**: API response times and error rates
- **Alerts**: Failed OCR/translation operations
- **Database**: Monitor connection pool and query performance

## 🐛 Troubleshooting

### Common Issues

1. **OCR Initialization Error**

   - Ensure sufficient memory for EasyOCR models
   - Check system dependencies (OpenCV, etc.)

2. **OpenAI API Errors**

   - Verify API key validity
   - Check rate limits and billing status

3. **Database Connection Issues**

   - Verify Supabase credentials
   - Check network connectivity

4. **Image Processing Errors**
   - Validate image format and size
   - Check file upload limits

### Debug Mode

Enable debug logging by setting `DEBUG=true` in your `.env` file:

```env
DEBUG=true
```

This will provide detailed logs for:

- OCR processing steps
- Translation API calls
- Database operations
- Image processing pipeline

## 📝 Development Notes

- The backend uses Supabase's service key for database operations
- JWT tokens are verified using Supabase's auth system
- All user operations are logged for debugging
- Error handling includes proper HTTP status codes and descriptive messages
- Background processing ensures responsive API performance
- Translation memory improves consistency and reduces API costs
- WebSocket connections provide real-time updates to frontend
