"""
FASE 94: Resource Monitor for Smart Queue with Backpressure

Monitors system resources (memory, CPU) and provides backpressure control
to prevent system overload when running multiple scrapers in parallel.

Updated 2025-12-11: FASE 94.3 - Fixed event loop time() to use time.time() (thread-safe)
"""

import asyncio
import time
from loguru import logger

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("[ResourceMonitor] psutil not available - backpressure disabled")


class ResourceMonitor:
    """
    Monitor de recursos do sistema para controle de backpressure.

    Quando recursos estão acima do threshold, novos scrapers aguardam
    até que recursos fiquem disponíveis, prevenindo OOM e crashes.
    """

    # Thresholds configuráveis
    MEMORY_THRESHOLD = 70  # % máximo de memória antes de pausar
    CPU_THRESHOLD = 85     # % máximo de CPU antes de pausar
    CHECK_INTERVAL = 1.0   # segundos entre verificações

    # Estatísticas
    _wait_count = 0
    _total_wait_time = 0.0

    @staticmethod
    def get_memory_percent() -> float:
        """Retorna % de memória em uso do sistema"""
        if not PSUTIL_AVAILABLE:
            return 0.0
        return psutil.virtual_memory().percent

    @staticmethod
    def get_cpu_percent() -> float:
        """Retorna % de CPU em uso (média rápida)"""
        if not PSUTIL_AVAILABLE:
            return 0.0
        return psutil.cpu_percent(interval=0.1)

    @classmethod
    def get_process_memory_mb(cls) -> float:
        """Retorna memória do processo atual em MB"""
        if not PSUTIL_AVAILABLE:
            return 0.0
        process = psutil.Process()
        return process.memory_info().rss / (1024 * 1024)

    @classmethod
    def is_safe_to_proceed(cls) -> bool:
        """
        Verifica se é seguro iniciar novo scraper.

        Returns:
            True se recursos estão abaixo dos thresholds
        """
        if not PSUTIL_AVAILABLE:
            return True  # Sem psutil, permite tudo

        memory = cls.get_memory_percent()
        cpu = cls.get_cpu_percent()

        safe = memory < cls.MEMORY_THRESHOLD and cpu < cls.CPU_THRESHOLD

        if not safe:
            logger.warning(
                f"[BACKPRESSURE] Memory: {memory:.1f}%, CPU: {cpu:.1f}% - "
                f"thresholds: mem<{cls.MEMORY_THRESHOLD}%, cpu<{cls.CPU_THRESHOLD}%"
            )

        return safe

    @classmethod
    async def wait_until_safe(cls, timeout: float = 60.0) -> bool:
        """
        Aguarda até recursos estarem disponíveis.

        Args:
            timeout: Tempo máximo de espera em segundos

        Returns:
            True se recursos ficaram disponíveis, False se timeout
        """
        if not PSUTIL_AVAILABLE:
            return True

        start = time.time()
        waited = False

        while not cls.is_safe_to_proceed():
            elapsed = time.time() - start

            if elapsed > timeout:
                logger.error(
                    f"[BACKPRESSURE] Timeout após {timeout}s esperando recursos. "
                    f"Memory: {cls.get_memory_percent():.1f}%, CPU: {cls.get_cpu_percent():.1f}%"
                )
                return False

            if not waited:
                waited = True
                cls._wait_count += 1
                logger.info(f"[BACKPRESSURE] Aguardando recursos disponíveis...")

            await asyncio.sleep(cls.CHECK_INTERVAL)

        if waited:
            wait_time = time.time() - start
            cls._total_wait_time += wait_time
            logger.info(f"[BACKPRESSURE] Recursos disponíveis após {wait_time:.1f}s")

        return True

    @classmethod
    def get_stats(cls) -> dict:
        """Retorna estatísticas de backpressure"""
        return {
            "wait_count": cls._wait_count,
            "total_wait_time": cls._total_wait_time,
            "current_memory_percent": cls.get_memory_percent(),
            "current_cpu_percent": cls.get_cpu_percent(),
            "process_memory_mb": cls.get_process_memory_mb(),
            "memory_threshold": cls.MEMORY_THRESHOLD,
            "cpu_threshold": cls.CPU_THRESHOLD,
            "psutil_available": PSUTIL_AVAILABLE,
        }

    @classmethod
    def reset_stats(cls):
        """Reseta estatísticas"""
        cls._wait_count = 0
        cls._total_wait_time = 0.0
