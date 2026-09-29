from pydantic import BaseModel, Field


class ExampleRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Input query")


class ExampleResponse(BaseModel):
    result: str
    processed_length: int
