"""
Configuration loader for OtakuShelf.

Primary source: a config.json file mounted via Docker volume (default path
/app/app_data/config.json, overridable with the CONFIG_PATH env var).

If no config.json is found (e.g. running the backend directly on a host
machine without Docker), sensible values are pulled from environment
variables instead, so local development doesn't strictly require the file.
"""

import json
import os
from pathlib import Path
from functools import lru_cache
from typing import Any, Dict, List

DEFAULT_CONFIG_PATH = os.getenv("CONFIG_PATH", "/app/app_data/config.json")


class Config:
    def __init__(self, config_path: str = None):
        self.config_path = Path(config_path or DEFAULT_CONFIG_PATH)
        self.data: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.config_path.exists():
            with open(self.config_path, "r") as f:
                return json.load(f)

        # Fallback for local/non-Docker development.
        return {
            "mongodb": {
                "connection_string": os.getenv(
                    "MONGODB_URL", "mongodb://localhost:27017/otakushelf"
                ),
                "database_name": os.getenv("MONGODB_DB_NAME", "otakushelf"),
            },
            "app": {
                "secret_key": os.getenv(
                    "SECRET_KEY", "dev-secret-key-change-me-in-production"
                ),
                "access_token_expire_minutes": int(
                    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
                ),
                "debug": os.getenv("DEBUG", "false").lower() == "true",
                "cors_origins": [
                    o.strip()
                    for o in os.getenv(
                        "CORS_ORIGINS", "http://localhost:5173,http://localhost:8000"
                    ).split(",")
                    if o.strip()
                ],
            },
            "logging": {
                "level": os.getenv("LOG_LEVEL", "INFO"),
                "log_dir": os.getenv("LOG_DIR", "/app/app_data/logs"),
            },
        }

    # --- MongoDB ---
    @property
    def mongodb_url(self) -> str:
        return self.data["mongodb"]["connection_string"]

    @property
    def mongodb_database_name(self) -> str:
        return self.data["mongodb"].get("database_name", "otakushelf")

    # --- App / security ---
    @property
    def secret_key(self) -> str:
        return self.data["app"]["secret_key"]

    @property
    def access_token_expire_minutes(self) -> int:
        return int(self.data["app"].get("access_token_expire_minutes", 1440))

    @property
    def debug(self) -> bool:
        return bool(self.data["app"].get("debug", False))

    @property
    def cors_origins(self) -> List[str]:
        return self.data["app"].get(
            "cors_origins", ["http://localhost:5173", "http://localhost:8000"]
        )

    # --- Logging ---
    @property
    def log_level(self) -> str:
        return self.data.get("logging", {}).get("level", "INFO")

    @property
    def log_dir(self) -> str:
        return self.data.get("logging", {}).get("log_dir", "/app/app_data/logs")


@lru_cache()
def get_config() -> Config:
    return Config()
