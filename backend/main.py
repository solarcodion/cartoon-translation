from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import json
from typing import Dict, Set
from app.config import settings
from app.routers import users, series, chapters, pages, translation_memory, ocr, translation, text_boxes, ai_glossary, dashboard
from app.services.notification_service import notification_service


app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            disconnected_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    disconnected_connections.append(connection)

            # Remove disconnected connections
            for connection in disconnected_connections:
                self.active_connections[user_id].discard(connection)

manager = ConnectionManager()

# Initialize notification service with the manager
notification_service.set_manager(manager)


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


app.include_router(users.router, prefix="/api")
app.include_router(series.router, prefix="/api")
app.include_router(chapters.router, prefix="/api")
app.include_router(pages.router, prefix="/api")
app.include_router(translation_memory.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(translation.router, prefix="/api")
app.include_router(text_boxes.router, prefix="/api")
app.include_router(ai_glossary.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@app.get("/")
async def root():
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
