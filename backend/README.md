# ManhwaTrans Backend

FastAPI backend for the ManhwaTrans application.

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

3. Copy environment file:
```bash
cp .env.example .env
```

4. Run the development server:
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

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── app/
│   ├── __init__.py
│   └── config.py       # Application configuration
└── README.md           # This file
```
