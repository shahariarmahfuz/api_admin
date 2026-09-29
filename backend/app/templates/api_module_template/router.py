from fastapi import APIRouter, Depends, HTTPException
from app.schemas.common import StandardResponse
from app.api.dependencies import require_api_key
from .schemas import ExampleRequest, ExampleResponse
from .service import ExampleModuleService
from .dependencies import get_module_service

router = APIRouter(prefix="/example", tags=["Example Module"])


@router.post("/action", response_model=StandardResponse[ExampleResponse])
async def execute_action(
    payload: ExampleRequest,
    service: ExampleModuleService = Depends(get_module_service),
    auth=Depends(require_api_key),
):
    """
    Template endpoint action documentation.
    """
    result = await service.process_action(payload)
    return StandardResponse.ok(
        data=result,
        message="Action completed successfully",
    )
