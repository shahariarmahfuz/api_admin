# API Module Architecture Template

Every new API module in Orvia follows this standardized, isolated pattern:

```
app/api/v1/{module_name}/
├── __init__.py
├── router.py          # FastAPI route declarations & input validation
├── schemas.py         # Pydantic v2 request/response models
├── service.py         # Pure business logic and third-party integrations
├── dependencies.py    # Service factory and DI providers
└── tests/             # Pytest asynchronous unit and integration tests
    └── test_{module_name}.py
```

### Adding a New API in 3 Steps:

1. Copy this template directory to `app/api/v1/<your_module_name>/` or run `python create_api_module.py <your_module_name>`.
2. Implement your endpoints in `router.py` and logic in `service.py`.
3. Mount the new router in `app/api/v1/router.py`:
   ```python
   from app.api.v1.<your_module_name>.router import router as your_module_router
   api_v1_router.include_router(your_module_router)
   ```
4. Register the new API in the database catalog via Admin Dashboard or seed script.
