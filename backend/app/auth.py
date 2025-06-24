from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.database import get_supabase
from typing import Optional, Dict, Any


security = HTTPBearer()


class AuthService:
    """Authentication service for handling Supabase JWT tokens"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify Supabase JWT token and return user data"""
        try:
            # Verify the token with Supabase
            response = self.supabase.auth.get_user(token)
            
            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token"
                )
            
            return {
                "user_id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata or {}
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )
    
    def get_current_user(self, token: str) -> Dict[str, Any]:
        """Get current user from token"""
        return self.verify_token(token)


def get_auth_service(supabase: Client = Depends(get_supabase)) -> AuthService:
    """Dependency to get auth service"""
    return AuthService(supabase)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    return auth_service.get_current_user(credentials.credentials)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> Optional[Dict[str, Any]]:
    """Dependency to get current user (optional)"""
    if not credentials:
        return None
    
    try:
        return auth_service.get_current_user(credentials.credentials)
    except HTTPException:
        return None
