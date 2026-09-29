from typing import Dict, List, Optional, Any, Tuple
from app.services.providers.base import BaseProvider
from app.services.providers.cloudinary.service import CloudinaryProvider


class ProviderRegistry:
    """Central registry of extensible API Providers"""
    def __init__(self):
        self._providers: Dict[str, BaseProvider] = {}
        # Register default providers
        self.register(CloudinaryProvider())

    def register(self, provider: BaseProvider) -> None:
        self._providers[provider.name.lower()] = provider

    def get(self, name: str) -> Optional[BaseProvider]:
        return self._providers.get(name.lower())

    def list_available(self) -> List[Dict[str, Any]]:
        """List provider blueprints with credential schemas and operations"""
        return [
            {
                "name": p.name,
                "provider_name": p.name,
                "display_name": p.display_name,
                "description": p.description,
                "category": p.category,
                "credential_schema": p.credential_schema,
                "fields": p.credential_schema,
                "operations": p.operations,
                "supported_operations": [op["id"] for op in p.operations],
            }
            for p in self._providers.values()
        ]

    async def test_connection(self, provider_name: str, credentials: Dict[str, Any]) -> Tuple[bool, str]:
        provider = self.get(provider_name)
        if not provider:
            return False, f"Provider '{provider_name}' is not supported"
        return await provider.test_connection(credentials)

    async def execute_operation(
        self,
        provider_name: str,
        operation: str,
        credentials: Dict[str, Any],
        params: Dict[str, Any],
        files: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        provider = self.get(provider_name)
        if not provider:
            raise ValueError(f"Provider '{provider_name}' is not supported")
        return await provider.execute_operation(operation, credentials, params, files)


provider_registry = ProviderRegistry()
