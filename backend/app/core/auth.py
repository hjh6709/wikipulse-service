from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

_bearer = HTTPBearer(auto_error=False)

# Week 1: mock secret — replace with Keycloak JWKS in Week 2
_MOCK_SECRET = "wikipulse-dev-secret"
_ALGORITHM = "HS256"


def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, _MOCK_SECRET, algorithms=[_ALGORITHM])
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return verify_jwt(credentials.credentials)
