from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import users, series, chapters, translation_memory

# Create FastAPI instance
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed information"""
    print(f"Validation error on {request.method} {request.url}")
    print(f"Validation errors: {exc.errors()}")

    # Convert validation errors to a serializable format
    errors = []
    for error in exc.errors():
        error_dict = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "input": str(error.get("input")) if error.get("input") is not None else None,
            "url": error.get("url")
        }
        errors.append(error_dict)

    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(series.router, prefix="/api")
app.include_router(chapters.router, prefix="/api")
app.include_router(translation_memory.router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "ManhwaTrans API is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        reload_dirs=["./app", "./"]
    )
