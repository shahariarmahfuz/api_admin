from .service import ExampleModuleService


def get_module_service() -> ExampleModuleService:
    """Dependency provider for module service injection"""
    return ExampleModuleService()
