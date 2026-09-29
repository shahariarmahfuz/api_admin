from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple, Optional


class BaseProvider(ABC):
    """
    Abstract interface for dynamic API Provider integrations.
    Every provider specifies its credential requirements, available operations,
    connection test logic, and execution handler.
    """
    name: str
    display_name: str
    description: str
    category: str
    credential_schema: List[Dict[str, Any]]
    operations: List[Dict[str, Any]]

    @abstractmethod
    async def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Verify that the provided credentials successfully authenticate with the provider API.
        Returns:
            (success: bool, message: str)
        """
        pass

    @abstractmethod
    async def execute_operation(
        self,
        operation: str,
        credentials: Dict[str, Any],
        params: Dict[str, Any],
        files: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Execute an operation against the provider using decrypted credentials.
        Returns the provider's standardized response payload.
        """
        pass
