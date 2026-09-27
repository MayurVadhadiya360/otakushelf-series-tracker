"""
Logging setup for OtakuShelf.

Logs go to two places:
  - A rotating file under app_data/logs/ (a mounted volume), so logs
    survive container restarts.
  - stdout, so `docker compose logs -f backend` also shows them live.
"""

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from .config import get_config

_logger: logging.Logger = None


def setup_logging() -> logging.Logger:
    global _logger
    if _logger is not None:
        return _logger

    config = get_config()
    log_dir = Path(config.log_dir)

    logger = logging.getLogger("otakushelf")
    logger.setLevel(getattr(logging, config.log_level.upper(), logging.INFO))
    logger.handlers.clear()
    logger.propagate = False

    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler — best-effort. If the volume isn't writable for some
    # reason, fall back to console-only logging rather than crashing.
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_dir / "app.log", maxBytes=10 * 1024 * 1024, backupCount=5
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except OSError as e:
        logging.getLogger("otakushelf.startup").warning(
            f"Could not set up file logging at {log_dir}: {e}"
        )

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    _logger = logger
    return logger


def get_logger() -> logging.Logger:
    return _logger or setup_logging()
