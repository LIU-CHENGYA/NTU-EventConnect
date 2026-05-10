"""Daily data refresh job.

NTU policy: 資料抓取は夜間のみ。APScheduler が毎日 02:00 (Asia/Taipei) に
`scripts.seed_events` を呼び出し、最新 CSV を DB に upsert する。

CSV 自体の更新（fetch_data/crawl_*.py）は外部運用 (cron / GitHub Actions /
専用 worker) で先行させる前提。本ジョブは backend 内蔵の最終取込のみを扱う。
"""

from __future__ import annotations

import asyncio
import logging
import subprocess
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent  # backend-v2/
# sys.executable: Docker image and venv use the same interpreter that runs the API,
# avoiding a brittle PATH lookup for "python".
SEED_CMD = [sys.executable, "-m", "scripts.seed_events"]


def _run_seed_blocking() -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        SEED_CMD,
        cwd=str(BACKEND_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )


async def run_daily_refresh() -> None:
    logger.info("daily_refresh: starting seed_events run")
    result = await asyncio.to_thread(_run_seed_blocking)
    if result.returncode != 0:
        logger.error(
            "daily_refresh failed (exit %s)\nstdout: %s\nstderr: %s",
            result.returncode,
            result.stdout,
            result.stderr,
        )
        return
    logger.info("daily_refresh: completed\n%s", result.stdout.strip())
