"""
B3 AI Analysis Platform - Automated Configuration Manager

This module provides a comprehensive configuration management system that:
- Auto-loads from multiple sources (.env, environment variables, config.yaml, Docker secrets)
- Validates required variables
- Provides default values for optional configurations
- Supports hot-reload of configuration files
- Generates .env template if missing
- Emits events on configuration changes
"""

import os
import sys
import yaml
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Callable, Set
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock, Thread
from time import sleep
import hashlib
from dotenv import load_dotenv, dotenv_values

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ConfigVariable:
    """Configuration variable definition with metadata"""
    name: str
    required: bool = False
    default: Optional[Any] = None
    description: str = ""
    secret: bool = False
    validator: Optional[Callable] = None
    category: str = "general"


@dataclass
class ConfigStatus:
    """Configuration status information"""
    loaded: bool = False
    last_reload: Optional[datetime] = None
    sources: List[str] = field(default_factory=list)
    missing_required: List[str] = field(default_factory=list)
    missing_optional: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)


class ConfigManager:
    """
    Automated configuration manager for B3 AI Analysis Platform

    Features:
    - Multi-source loading (.env, environment, config.yaml, Docker secrets)
    - Validation with required/optional variables
    - Auto-detection and warnings
    - Hot-reload support
    - Event emission on changes
    """

    # Define all configuration variables with metadata
    CONFIG_DEFINITIONS = {
        # Database
        "DB_HOST": ConfigVariable(
            "DB_HOST", required=True, default="localhost",
            description="Database host", category="database"
        ),
        "DB_PORT": ConfigVariable(
            "DB_PORT", required=True, default="5432",
            description="Database port", category="database"
        ),
        "DB_NAME": ConfigVariable(
            "DB_NAME", required=True, default="invest_db",
            description="Database name", category="database"
        ),
        "DB_DATABASE": ConfigVariable(
            "DB_DATABASE", required=False, default="invest_db",
            description="Database name (alias)", category="database"
        ),
        "DB_USER": ConfigVariable(
            "DB_USER", required=True, default="invest_user",
            description="Database user", category="database"
        ),
        "DB_USERNAME": ConfigVariable(
            "DB_USERNAME", required=False, default="invest_user",
            description="Database username (alias)", category="database"
        ),
        "DB_PASSWORD": ConfigVariable(
            "DB_PASSWORD", required=True, secret=True,
            description="Database password", category="database"
        ),

        # Redis
        "REDIS_HOST": ConfigVariable(
            "REDIS_HOST", required=True, default="localhost",
            description="Redis host", category="redis"
        ),
        "REDIS_PORT": ConfigVariable(
            "REDIS_PORT", required=True, default="6379",
            description="Redis port", category="redis"
        ),
        "REDIS_PASSWORD": ConfigVariable(
            "REDIS_PASSWORD", required=False, secret=True,
            description="Redis password", category="redis"
        ),
        "REDIS_DB": ConfigVariable(
            "REDIS_DB", required=False, default="0",
            description="Redis database number", category="redis"
        ),

        # Scraper Credentials
        "OPCOES_USERNAME": ConfigVariable(
            "OPCOES_USERNAME", required=False,
            description="Opcoes.net.br username", category="scrapers"
        ),
        "OPCOES_PASSWORD": ConfigVariable(
            "OPCOES_PASSWORD", required=False, secret=True,
            description="Opcoes.net.br password", category="scrapers"
        ),
        "GOOGLE_EMAIL": ConfigVariable(
            "GOOGLE_EMAIL", required=False,
            description="Google email for auto-login", category="scrapers"
        ),
        "GOOGLE_PASSWORD": ConfigVariable(
            "GOOGLE_PASSWORD", required=False, secret=True,
            description="Google password", category="scrapers"
        ),
        "BTG_LOGIN_TOKEN": ConfigVariable(
            "BTG_LOGIN_TOKEN", required=False, secret=True,
            description="BTG Pactual login token", category="scrapers"
        ),
        "XPI_LOGIN_TOKEN": ConfigVariable(
            "XPI_LOGIN_TOKEN", required=False, secret=True,
            description="XPI login token", category="scrapers"
        ),

        # Paths
        "COOKIES_FILE": ConfigVariable(
            "COOKIES_FILE", required=False, default="./cookies.json",
            description="Path to cookies file", category="paths"
        ),
        "LOG_FILE": ConfigVariable(
            "LOG_FILE", required=False, default="/app/logs/scrapers.log",
            description="Path to log file", category="paths"
        ),
        "LOG_FILE_PATH": ConfigVariable(
            "LOG_FILE_PATH", required=False, default="./logs",
            description="Path to log directory", category="paths"
        ),
        "BROWSER_PROFILES_PATH": ConfigVariable(
            "BROWSER_PROFILES_PATH", required=False, default="./browser-profiles",
            description="Path to browser profiles", category="paths"
        ),
        "CHROME_USER_DATA_DIR": ConfigVariable(
            "CHROME_USER_DATA_DIR", required=False, default="./browser-profiles",
            description="Chrome user data directory", category="paths"
        ),
        "UPLOAD_DIR": ConfigVariable(
            "UPLOAD_DIR", required=False, default="./uploads",
            description="Upload directory", category="paths"
        ),
        "REPORTS_DIR": ConfigVariable(
            "REPORTS_DIR", required=False, default="./reports",
            description="Reports directory", category="paths"
        ),

        # Scraper Configuration
        "CHROME_HEADLESS": ConfigVariable(
            "CHROME_HEADLESS", required=False, default="true",
            description="Run Chrome in headless mode", category="scrapers"
        ),
        "CHROME_EXECUTABLE_PATH": ConfigVariable(
            "CHROME_EXECUTABLE_PATH", required=False, default="/usr/bin/chromium-browser",
            description="Chrome executable path", category="scrapers"
        ),
        "SCRAPER_TIMEOUT": ConfigVariable(
            "SCRAPER_TIMEOUT", required=False, default="30000",
            description="Scraper timeout in milliseconds", category="scrapers"
        ),
        "SCRAPER_MAX_RETRIES": ConfigVariable(
            "SCRAPER_MAX_RETRIES", required=False, default="3",
            description="Maximum retry attempts", category="scrapers"
        ),
        "SCRAPER_CONCURRENT_JOBS": ConfigVariable(
            "SCRAPER_CONCURRENT_JOBS", required=False, default="3",
            description="Number of concurrent scraper jobs", category="scrapers"
        ),
        "SCRAPING_TIMEOUT": ConfigVariable(
            "SCRAPING_TIMEOUT", required=False, default="30000",
            description="Scraping timeout", category="scrapers"
        ),
        "SCRAPING_MAX_RETRIES": ConfigVariable(
            "SCRAPING_MAX_RETRIES", required=False, default="3",
            description="Maximum scraping retries", category="scrapers"
        ),
        "SCRAPING_CONCURRENT_JOBS": ConfigVariable(
            "SCRAPING_CONCURRENT_JOBS", required=False, default="10",
            description="Concurrent scraping jobs", category="scrapers"
        ),

        # Application
        "NODE_ENV": ConfigVariable(
            "NODE_ENV", required=False, default="development",
            description="Node environment", category="application"
        ),
        "LOG_LEVEL": ConfigVariable(
            "LOG_LEVEL", required=False, default="INFO",
            description="Logging level", category="application"
        ),
        "APP_PORT": ConfigVariable(
            "APP_PORT", required=False, default="3101",
            description="Application port", category="application"
        ),

        # API Keys
        "BRAPI_API_KEY": ConfigVariable(
            "BRAPI_API_KEY", required=False, secret=True,
            description="BRAPI API key", category="api"
        ),
        "OPENAI_API_KEY": ConfigVariable(
            "OPENAI_API_KEY", required=False, secret=True,
            description="OpenAI API key", category="api"
        ),
        "ANTHROPIC_API_KEY": ConfigVariable(
            "ANTHROPIC_API_KEY", required=False, secret=True,
            description="Anthropic API key", category="api"
        ),
    }

    def __init__(
        self,
        base_path: Optional[Path] = None,
        auto_load: bool = True,
        watch: bool = False
    ):
        """
        Initialize ConfigManager

        Args:
            base_path: Base path for configuration files (defaults to project root)
            auto_load: Automatically load configuration on init
            watch: Enable file watching for hot-reload
        """
        self.base_path = base_path or Path(__file__).parent.parent
        self.config: Dict[str, Any] = {}
        self.status = ConfigStatus()
        self.lock = Lock()
        self.listeners: List[Callable] = []
        self.watch_enabled = watch
        self.watch_thread: Optional[Thread] = None
        self._file_hashes: Dict[str, str] = {}

        logger.info(f"ConfigManager initialized with base_path: {self.base_path}")

        if auto_load:
            self.load()

        if watch:
            self.start_watching()

    def load(self) -> bool:
        """
        Load configuration from all sources

        Priority (highest to lowest):
        1. Environment variables
        2. Docker secrets
        3. .env file
        4. config.yaml file
        5. Default values

        Returns:
            bool: True if configuration loaded successfully
        """
        with self.lock:
            logger.info("Loading configuration from all sources...")
            self.config = {}
            self.status = ConfigStatus()
            self.status.sources = []

            try:
                # 1. Load from config.yaml (lowest priority)
                self._load_from_yaml()

                # 2. Load from .env file
                self._load_from_env_file()

                # 3. Load from Docker secrets
                self._load_from_docker_secrets()

                # 4. Load from environment variables (highest priority)
                self._load_from_environment()

                # 5. Apply defaults for missing values
                self._apply_defaults()

                # Validate configuration
                self._validate()

                # Update status
                self.status.loaded = True
                self.status.last_reload = datetime.now()

                # Log results
                self._log_status()

                # Generate .env template if missing
                if not (self.base_path / ".env").exists():
                    self._generate_env_template()

                # Notify listeners
                self._notify_listeners()

                return len(self.status.errors) == 0

            except Exception as e:
                logger.error(f"Error loading configuration: {e}")
                self.status.errors.append(str(e))
                return False

    def _load_from_yaml(self):
        """Load configuration from config.yaml"""
        yaml_path = self.base_path / "config.yaml"
        if yaml_path.exists():
            try:
                with open(yaml_path, 'r') as f:
                    yaml_config = yaml.safe_load(f) or {}
                    self.config.update(yaml_config)
                self.status.sources.append("config.yaml")
                logger.info(f"Loaded {len(yaml_config)} variables from config.yaml")
            except Exception as e:
                logger.warning(f"Error loading config.yaml: {e}")
                self.status.warnings.append(f"Failed to load config.yaml: {e}")

    def _load_from_env_file(self):
        """Load configuration from .env file"""
        env_path = self.base_path / ".env"
        if env_path.exists():
            try:
                # Load .env file
                env_values = dotenv_values(str(env_path))
                self.config.update(env_values)
                self.status.sources.append(".env")
                logger.info(f"Loaded {len(env_values)} variables from .env")

                # Also load into os.environ
                load_dotenv(str(env_path), override=False)
            except Exception as e:
                logger.warning(f"Error loading .env file: {e}")
                self.status.warnings.append(f"Failed to load .env: {e}")

    def _load_from_docker_secrets(self):
        """Load configuration from Docker secrets (/run/secrets/)"""
        secrets_path = Path("/run/secrets")
        if secrets_path.exists():
            try:
                secret_count = 0
                for secret_file in secrets_path.iterdir():
                    if secret_file.is_file():
                        try:
                            with open(secret_file, 'r') as f:
                                value = f.read().strip()
                                key = secret_file.name.upper()
                                self.config[key] = value
                                secret_count += 1
                        except Exception as e:
                            logger.warning(f"Error reading secret {secret_file.name}: {e}")

                if secret_count > 0:
                    self.status.sources.append("docker-secrets")
                    logger.info(f"Loaded {secret_count} variables from Docker secrets")
            except Exception as e:
                logger.warning(f"Error loading Docker secrets: {e}")

    def _load_from_environment(self):
        """Load configuration from environment variables"""
        env_count = 0
        for var_name in self.CONFIG_DEFINITIONS.keys():
            if var_name in os.environ:
                self.config[var_name] = os.environ[var_name]
                env_count += 1

        if env_count > 0:
            self.status.sources.append("environment")
            logger.info(f"Loaded {env_count} variables from environment")

    def _apply_defaults(self):
        """Apply default values for missing configuration variables"""
        default_count = 0
        for var_name, var_def in self.CONFIG_DEFINITIONS.items():
            if var_name not in self.config and var_def.default is not None:
                self.config[var_name] = var_def.default
                default_count += 1

        if default_count > 0:
            logger.info(f"Applied {default_count} default values")

    def _validate(self):
        """Validate configuration"""
        self.status.missing_required = []
        self.status.missing_optional = []

        for var_name, var_def in self.CONFIG_DEFINITIONS.items():
            value = self.config.get(var_name)

            if var_def.required and not value:
                self.status.missing_required.append(var_name)
                self.status.errors.append(f"Required variable missing: {var_name}")
            elif not var_def.required and not value:
                self.status.missing_optional.append(var_name)

            # Run custom validator if provided
            if value and var_def.validator:
                try:
                    if not var_def.validator(value):
                        self.status.warnings.append(f"Validation failed for {var_name}")
                except Exception as e:
                    self.status.warnings.append(f"Validator error for {var_name}: {e}")

    def _log_status(self):
        """Log configuration status"""
        logger.info("=" * 80)
        logger.info("Configuration Status:")
        logger.info(f"  Sources: {', '.join(self.status.sources)}")
        logger.info(f"  Loaded variables: {len(self.config)}")
        logger.info(f"  Missing required: {len(self.status.missing_required)}")
        logger.info(f"  Missing optional: {len(self.status.missing_optional)}")
        logger.info(f"  Warnings: {len(self.status.warnings)}")
        logger.info(f"  Errors: {len(self.status.errors)}")

        if self.status.missing_required:
            logger.error(f"Missing required variables: {', '.join(self.status.missing_required)}")

        if self.status.missing_optional:
            logger.warning(f"Missing optional variables: {', '.join(self.status.missing_optional)}")

        for warning in self.status.warnings:
            logger.warning(warning)

        for error in self.status.errors:
            logger.error(error)

        logger.info("=" * 80)

    def _generate_env_template(self):
        """Generate .env.template file with all configuration variables"""
        template_path = self.base_path / ".env.template"

        try:
            with open(template_path, 'w') as f:
                f.write("# B3 AI Analysis Platform - Environment Variables Template\n")
                f.write("# Generated by ConfigManager\n")
                f.write(f"# Generated at: {datetime.now().isoformat()}\n\n")

                # Group by category
                categories: Dict[str, List[ConfigVariable]] = {}
                for var_def in self.CONFIG_DEFINITIONS.values():
                    if var_def.category not in categories:
                        categories[var_def.category] = []
                    categories[var_def.category].append(var_def)

                # Write each category
                for category, vars_list in sorted(categories.items()):
                    f.write(f"\n# {category.upper()}\n")
                    f.write("# " + "=" * 78 + "\n")

                    for var_def in sorted(vars_list, key=lambda x: x.name):
                        if var_def.description:
                            f.write(f"# {var_def.description}\n")

                        required_marker = " (required)" if var_def.required else " (optional)"
                        secret_marker = " [SECRET]" if var_def.secret else ""
                        f.write(f"# {required_marker}{secret_marker}\n")

                        default_value = var_def.default if var_def.default is not None else ""
                        if var_def.secret and default_value:
                            default_value = "***CHANGE_THIS***"

                        f.write(f"{var_def.name}={default_value}\n\n")

            logger.info(f"Generated .env.template at {template_path}")
            self.status.warnings.append(f".env file not found, template generated at {template_path}")

        except Exception as e:
            logger.error(f"Error generating .env.template: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self.config.get(key, default)

    def get_all(self, hide_secrets: bool = True) -> Dict[str, Any]:
        """
        Get all configuration values

        Args:
            hide_secrets: Hide secret values (replace with ***)

        Returns:
            Dictionary of configuration values
        """
        if not hide_secrets:
            return self.config.copy()

        result = {}
        for key, value in self.config.items():
            var_def = self.CONFIG_DEFINITIONS.get(key)
            if var_def and var_def.secret:
                result[key] = "***" if value else None
            else:
                result[key] = value

        return result

    def get_by_category(self, category: str, hide_secrets: bool = True) -> Dict[str, Any]:
        """Get configuration values by category"""
        result = {}
        for var_name, var_def in self.CONFIG_DEFINITIONS.items():
            if var_def.category == category:
                value = self.config.get(var_name)
                if hide_secrets and var_def.secret:
                    result[var_name] = "***" if value else None
                else:
                    result[var_name] = value

        return result

    def reload(self) -> bool:
        """Reload configuration from all sources"""
        logger.info("Reloading configuration...")
        return self.load()

    def add_listener(self, callback: Callable):
        """
        Add configuration change listener

        Args:
            callback: Function to call when configuration changes
        """
        self.listeners.append(callback)
        logger.info(f"Added configuration change listener: {callback.__name__}")

    def remove_listener(self, callback: Callable):
        """Remove configuration change listener"""
        if callback in self.listeners:
            self.listeners.remove(callback)
            logger.info(f"Removed configuration change listener: {callback.__name__}")

    def _notify_listeners(self):
        """Notify all listeners of configuration change"""
        for listener in self.listeners:
            try:
                listener(self.config.copy())
            except Exception as e:
                logger.error(f"Error notifying listener {listener.__name__}: {e}")

    def start_watching(self):
        """Start watching configuration files for changes"""
        if self.watch_thread and self.watch_thread.is_alive():
            logger.warning("File watching already started")
            return

        self.watch_enabled = True
        self.watch_thread = Thread(target=self._watch_files, daemon=True)
        self.watch_thread.start()
        logger.info("Started watching configuration files for changes")

    def stop_watching(self):
        """Stop watching configuration files"""
        self.watch_enabled = False
        if self.watch_thread:
            logger.info("Stopped watching configuration files")

    def _watch_files(self):
        """Watch configuration files for changes (runs in background thread)"""
        watched_files = [
            self.base_path / ".env",
            self.base_path / "config.yaml"
        ]

        # Initialize file hashes
        for file_path in watched_files:
            if file_path.exists():
                self._file_hashes[str(file_path)] = self._get_file_hash(file_path)

        while self.watch_enabled:
            try:
                sleep(2)  # Check every 2 seconds

                for file_path in watched_files:
                    if not file_path.exists():
                        continue

                    current_hash = self._get_file_hash(file_path)
                    previous_hash = self._file_hashes.get(str(file_path))

                    if previous_hash and current_hash != previous_hash:
                        logger.info(f"Configuration file changed: {file_path.name}")
                        self._file_hashes[str(file_path)] = current_hash
                        self.reload()
                        break  # Reload once per change detection cycle

                    self._file_hashes[str(file_path)] = current_hash

            except Exception as e:
                logger.error(f"Error watching files: {e}")

    def _get_file_hash(self, file_path: Path) -> str:
        """Get MD5 hash of file content"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            logger.error(f"Error hashing file {file_path}: {e}")
            return ""

    def get_status(self) -> Dict[str, Any]:
        """Get configuration status as dictionary"""
        return {
            "loaded": self.status.loaded,
            "last_reload": self.status.last_reload.isoformat() if self.status.last_reload else None,
            "sources": self.status.sources,
            "total_variables": len(self.config),
            "missing_required": self.status.missing_required,
            "missing_optional": self.status.missing_optional,
            "warnings": self.status.warnings,
            "errors": self.status.errors,
            "watch_enabled": self.watch_enabled
        }

    def validate_config(self) -> Dict[str, Any]:
        """
        Validate current configuration and return detailed results

        Returns:
            Dictionary with validation results
        """
        results = {
            "valid": len(self.status.missing_required) == 0 and len(self.status.errors) == 0,
            "categories": {},
            "summary": {
                "total": len(self.CONFIG_DEFINITIONS),
                "configured": len(self.config),
                "missing_required": len(self.status.missing_required),
                "missing_optional": len(self.status.missing_optional),
                "warnings": len(self.status.warnings),
                "errors": len(self.status.errors)
            }
        }

        # Validate by category
        for category in set(v.category for v in self.CONFIG_DEFINITIONS.values()):
            category_vars = [
                v for v in self.CONFIG_DEFINITIONS.values()
                if v.category == category
            ]

            configured = sum(1 for v in category_vars if self.config.get(v.name))
            required = sum(1 for v in category_vars if v.required)
            required_configured = sum(
                1 for v in category_vars
                if v.required and self.config.get(v.name)
            )

            results["categories"][category] = {
                "total": len(category_vars),
                "configured": configured,
                "required": required,
                "required_configured": required_configured,
                "valid": required_configured == required
            }

        return results

    @property
    def database_url(self) -> str:
        """Get database connection URL"""
        user = self.get("DB_USER") or self.get("DB_USERNAME", "invest_user")
        password = self.get("DB_PASSWORD", "invest_password")
        host = self.get("DB_HOST", "localhost")
        port = self.get("DB_PORT", "5432")
        database = self.get("DB_NAME") or self.get("DB_DATABASE", "invest_db")

        return f"postgresql://{user}:{password}@{host}:{port}/{database}"

    @property
    def redis_url(self) -> str:
        """Get Redis connection URL"""
        host = self.get("REDIS_HOST", "localhost")
        port = self.get("REDIS_PORT", "6379")
        db = self.get("REDIS_DB", "0")
        password = self.get("REDIS_PASSWORD")

        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        else:
            return f"redis://{host}:{port}/{db}"


# Global configuration manager instance
config_manager = ConfigManager(auto_load=True, watch=False)


# Convenience functions
def get_config(key: str, default: Any = None) -> Any:
    """Get configuration value"""
    return config_manager.get(key, default)


def reload_config() -> bool:
    """Reload configuration"""
    return config_manager.reload()


def get_all_config(hide_secrets: bool = True) -> Dict[str, Any]:
    """Get all configuration values"""
    return config_manager.get_all(hide_secrets)


def get_config_status() -> Dict[str, Any]:
    """Get configuration status"""
    return config_manager.get_status()


def validate_config() -> Dict[str, Any]:
    """Validate configuration"""
    return config_manager.validate_config()


# Example usage
if __name__ == "__main__":
    # Initialize config manager
    manager = ConfigManager(auto_load=True, watch=True)

    # Get configuration values
    db_host = manager.get("DB_HOST")
    redis_port = manager.get("REDIS_PORT")

    print(f"Database Host: {db_host}")
    print(f"Redis Port: {redis_port}")
    print(f"Database URL: {manager.database_url}")
    print(f"Redis URL: {manager.redis_url}")

    # Get status
    status = manager.get_status()
    print("\nConfiguration Status:")
    print(f"  Loaded: {status['loaded']}")
    print(f"  Sources: {status['sources']}")
    print(f"  Missing Required: {status['missing_required']}")

    # Validate
    validation = manager.validate_config()
    print(f"\nConfiguration Valid: {validation['valid']}")
    print(f"Summary: {validation['summary']}")

    # Add listener for changes
    def on_config_change(config: Dict[str, Any]):
        print("\n🔄 Configuration changed!")
        print(f"Total variables: {len(config)}")

    manager.add_listener(on_config_change)

    print("\nWatching for configuration changes... (Ctrl+C to stop)")
    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        manager.stop_watching()
        print("\nStopped watching.")
