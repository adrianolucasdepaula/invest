"""
B3 AI Analysis Platform - Configuration API Routes

FastAPI routes for configuration management endpoints:
- GET /api/config/status - Show all configs (hide secrets)
- GET /api/config/validate - Validate current configuration
- POST /api/config/reload - Force reload
- GET /api/config/categories - Get config by category
- GET /api/config/health - Health check with config status
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path to import config_manager
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-scrapers"))

from config_manager import config_manager, ConfigManager


# Pydantic models for request/response
class ConfigStatusResponse(BaseModel):
    """Configuration status response model"""
    loaded: bool
    last_reload: Optional[str]
    sources: List[str]
    total_variables: int
    missing_required: List[str]
    missing_optional: List[str]
    warnings: List[str]
    errors: List[str]
    watch_enabled: bool


class ConfigValidationResponse(BaseModel):
    """Configuration validation response model"""
    valid: bool
    categories: Dict[str, Dict[str, Any]]
    summary: Dict[str, int]
    timestamp: str


class ConfigReloadResponse(BaseModel):
    """Configuration reload response model"""
    success: bool
    message: str
    errors: Optional[List[str]]
    timestamp: str


class ConfigValueResponse(BaseModel):
    """Configuration values response model"""
    config: Dict[str, Any]
    count: int
    timestamp: str


class HealthCheckResponse(BaseModel):
    """Health check response model"""
    status: str
    config_loaded: bool
    config_valid: bool
    missing_critical: List[str]
    timestamp: str


# Create router
router = APIRouter(prefix="/api/config", tags=["configuration"])


@router.get("/status", response_model=ConfigStatusResponse)
async def get_config_status():
    """
    Get current configuration status

    Returns detailed information about:
    - Whether config is loaded
    - Configuration sources used
    - Missing required/optional variables
    - Warnings and errors
    - Hot-reload status

    Secrets are always hidden in this endpoint.
    """
    try:
        status = config_manager.get_status()
        return ConfigStatusResponse(
            loaded=status["loaded"],
            last_reload=status["last_reload"],
            sources=status["sources"],
            total_variables=status["total_variables"],
            missing_required=status["missing_required"],
            missing_optional=status["missing_optional"],
            warnings=status["warnings"],
            errors=status["errors"],
            watch_enabled=status["watch_enabled"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting config status: {str(e)}"
        )


@router.get("/validate", response_model=ConfigValidationResponse)
async def validate_configuration():
    """
    Validate current configuration

    Performs comprehensive validation of all configuration variables:
    - Checks if all required variables are present
    - Validates values using custom validators
    - Groups results by category
    - Provides summary statistics

    Returns:
        ConfigValidationResponse with validation results
    """
    try:
        validation_result = config_manager.validate_config()

        return ConfigValidationResponse(
            valid=validation_result["valid"],
            categories=validation_result["categories"],
            summary=validation_result["summary"],
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating configuration: {str(e)}"
        )


@router.post("/reload", response_model=ConfigReloadResponse)
async def reload_configuration():
    """
    Force reload configuration from all sources

    This endpoint triggers a complete reload of configuration from:
    - Environment variables
    - Docker secrets
    - .env file
    - config.yaml file

    Use this after updating configuration files to apply changes
    without restarting the application.

    Returns:
        ConfigReloadResponse with reload results
    """
    try:
        success = config_manager.reload()
        status_info = config_manager.get_status()

        return ConfigReloadResponse(
            success=success,
            message="Configuration reloaded successfully" if success else "Configuration reload failed",
            errors=status_info["errors"] if not success else None,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reloading configuration: {str(e)}"
        )


@router.get("/all", response_model=ConfigValueResponse)
async def get_all_config(hide_secrets: bool = True):
    """
    Get all configuration values

    Args:
        hide_secrets: If True, replaces secret values with ***

    Returns:
        All configuration variables with their current values
    """
    try:
        config = config_manager.get_all(hide_secrets=hide_secrets)

        return ConfigValueResponse(
            config=config,
            count=len(config),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting configuration: {str(e)}"
        )


@router.get("/categories", response_model=Dict[str, Any])
async def get_config_categories():
    """
    Get list of all configuration categories

    Returns:
        Dictionary mapping categories to their configuration variables
    """
    try:
        categories = {}

        for category in set(v.category for v in ConfigManager.CONFIG_DEFINITIONS.values()):
            categories[category] = config_manager.get_by_category(category, hide_secrets=True)

        return {
            "categories": categories,
            "count": len(categories),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting categories: {str(e)}"
        )


@router.get("/category/{category_name}", response_model=ConfigValueResponse)
async def get_config_by_category(category_name: str, hide_secrets: bool = True):
    """
    Get configuration values for a specific category

    Args:
        category_name: Category name (e.g., 'database', 'redis', 'scrapers')
        hide_secrets: If True, replaces secret values with ***

    Returns:
        Configuration variables for the specified category
    """
    try:
        config = config_manager.get_by_category(category_name, hide_secrets=hide_secrets)

        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{category_name}' not found"
            )

        return ConfigValueResponse(
            config=config,
            count=len(config),
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting category config: {str(e)}"
        )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint with configuration status

    Useful for monitoring and health checks. Returns:
    - Overall health status
    - Whether configuration is loaded
    - Whether configuration is valid
    - List of missing critical variables

    Status:
        - healthy: All required config present
        - degraded: Some optional config missing
        - unhealthy: Required config missing
    """
    try:
        status_info = config_manager.get_status()
        validation = config_manager.validate_config()

        missing_critical = status_info["missing_required"]
        has_errors = len(status_info["errors"]) > 0

        if missing_critical or has_errors:
            health_status = "unhealthy"
        elif status_info["missing_optional"]:
            health_status = "degraded"
        else:
            health_status = "healthy"

        return HealthCheckResponse(
            status=health_status,
            config_loaded=status_info["loaded"],
            config_valid=validation["valid"],
            missing_critical=missing_critical,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing health check: {str(e)}"
        )


@router.get("/watch/status")
async def get_watch_status():
    """
    Get file watching status

    Returns information about the hot-reload feature:
    - Whether watching is enabled
    - Which files are being watched
    """
    try:
        return {
            "watch_enabled": config_manager.watch_enabled,
            "watched_files": [
                ".env",
                "config.yaml"
            ],
            "check_interval": "2 seconds",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting watch status: {str(e)}"
        )


@router.post("/watch/start")
async def start_watching():
    """
    Start watching configuration files for changes

    Enables hot-reload feature that monitors .env and config.yaml
    files for changes and automatically reloads configuration.
    """
    try:
        if config_manager.watch_enabled:
            return JSONResponse(
                content={
                    "success": False,
                    "message": "File watching is already enabled",
                    "timestamp": datetime.now().isoformat()
                },
                status_code=status.HTTP_200_OK
            )

        config_manager.start_watching()

        return {
            "success": True,
            "message": "File watching started",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting file watching: {str(e)}"
        )


@router.post("/watch/stop")
async def stop_watching():
    """
    Stop watching configuration files

    Disables the hot-reload feature.
    """
    try:
        if not config_manager.watch_enabled:
            return JSONResponse(
                content={
                    "success": False,
                    "message": "File watching is already disabled",
                    "timestamp": datetime.now().isoformat()
                },
                status_code=status.HTTP_200_OK
            )

        config_manager.stop_watching()

        return {
            "success": True,
            "message": "File watching stopped",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error stopping file watching: {str(e)}"
        )


@router.get("/db-url")
async def get_database_url(hide_password: bool = True):
    """
    Get database connection URL

    Args:
        hide_password: If True, replaces password with ***

    Returns:
        Database connection string
    """
    try:
        db_url = config_manager.database_url

        if hide_password:
            # Replace password with ***
            import re
            db_url = re.sub(r':([^@]+)@', ':***@', db_url)

        return {
            "database_url": db_url,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting database URL: {str(e)}"
        )


@router.get("/redis-url")
async def get_redis_url(hide_password: bool = True):
    """
    Get Redis connection URL

    Args:
        hide_password: If True, replaces password with ***

    Returns:
        Redis connection string
    """
    try:
        redis_url = config_manager.redis_url

        if hide_password:
            # Replace password with ***
            import re
            redis_url = re.sub(r'://([^:]+):([^@]+)@', r'://\1:***@', redis_url)

        return {
            "redis_url": redis_url,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting Redis URL: {str(e)}"
        )


# Error handlers
@router.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Handle any unhandled exceptions"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )
