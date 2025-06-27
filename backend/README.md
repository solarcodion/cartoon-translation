# ManhwaTrans Backend

FastAPI backend for the ManhwaTrans application with Supabase integration.

## Features

- **User Management**: Complete CRUD operations for users
- **Supabase Integration**: Authentication and database operations
- **JWT Authentication**: Secure API endpoints with Supabase JWT tokens
- **RESTful API**: Well-structured REST endpoints with proper HTTP status codes
- **Auto Documentation**: Swagger UI and ReDoc for API documentation

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

4. Configure your `.env` file with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

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
```

5. Set up your Supabase database table:

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

-- Create RLS policies (optional, for additional security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all users
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own records
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to do everything (for backend operations)
CREATE POLICY "Service role can do everything" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create series table
CREATE TABLE series (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  total_chapters INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  series_id INTEGER NOT NULL REFERENCES series (id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (
    status IN (
      'draft',
      'in_progress',
      'translated'
    )
  ),
  page_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (series_id, chapter_number)
);
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

## API Endpoints

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

### Dashboard

- `GET /api/dashboard/` - Get complete dashboard data (stats + recent activities) - **Requires authentication**
- `GET /api/dashboard/stats` - Get overall dashboard statistics - **Requires authentication**
- `GET /api/dashboard/stats/chapters` - Get chapter status statistics - **Requires authentication**
- `GET /api/dashboard/stats/users` - Get user role statistics - **Requires authentication**
- `GET /api/dashboard/activities` - Get recent activities (with optional limit parameter) - **Requires authentication**

### Authentication

All endpoints except the root endpoint require authentication via Supabase JWT token.
Include the token in the Authorization header: `Bearer <your_jwt_token>`

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── app/
│   ├── __init__.py
│   ├── config.py             # Application configuration
│   ├── database.py           # Supabase client setup
│   ├── auth.py               # Authentication middleware
│   ├── models.py             # Pydantic models
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── users.py          # User management endpoints
│   │   ├── series.py         # Series management endpoints
│   │   └── chapters.py       # Chapter management endpoints
│   └── services/
│       ├── __init__.py
│       ├── user_service.py   # User business logic
│       ├── series_service.py # Series business logic
│       └── chapter_service.py # Chapter business logic
└── README.md                 # This file
```

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **User Registration**: When users sign up via Supabase Auth UI in the frontend, the AuthProvider automatically calls the backend to create a user record in the database.

2. **Authentication**: The frontend passes Supabase JWT tokens to authenticate API requests.

3. **User Management**: The Users page in the frontend uses these APIs to display and manage users.

## Development Notes

- The backend uses Supabase's service key for database operations
- JWT tokens are verified using Supabase's auth system
- All user operations are logged for debugging
- Error handling includes proper HTTP status codes and descriptive messages
