from .schemas import ExampleRequest, ExampleResponse


class ExampleModuleService:
    async def process_action(self, payload: ExampleRequest) -> ExampleResponse:
        # Reusable business logic isolated from HTTP routing
        processed = payload.query.strip().upper()
        return ExampleResponse(
            result=f"Processed: {processed}",
            processed_length=len(processed),
        )
