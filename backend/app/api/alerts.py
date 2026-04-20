from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas import AlertSettings
from app.services.lambda_trigger import trigger_alert

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/settings", status_code=202)
async def post_alert_settings(body: AlertSettings, _: dict = Depends(get_current_user)):
    await trigger_alert(body.model_dump())
    return {"status": "accepted"}
