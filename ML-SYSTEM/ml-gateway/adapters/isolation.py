"""
Module and Environment Isolation Context Manager for ML Gateway Adapters.
Guarantees zero module namespace leakage between Model 1, Model 2, Model 3, Model 4, and Model 5
when running in in-process fallback mode.
"""

import sys
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def isolate_model_environment(model_dir: Path):
    """
    Temporarily cleanses colliding top-level namespaces (src, config, schemas)
    and places the target model directory at the front of sys.path.
    Restores the original environment upon exit.
    """
    collide_names = ("src", "config", "schemas")
    saved_modules = {}

    for k in list(sys.modules.keys()):
        if any(k == name or k.startswith(f"{name}.") for name in collide_names):
            saved_modules[k] = sys.modules.pop(k)

    saved_sys_path = list(sys.path)
    model_str = str(model_dir)
    if model_str in sys.path:
        sys.path.remove(model_str)
    sys.path.insert(0, model_str)

    try:
        yield
    finally:
        sys.path = saved_sys_path
        for k in list(sys.modules.keys()):
            if any(k == name or k.startswith(f"{name}.") for name in collide_names):
                sys.modules.pop(k, None)
        for k, v in saved_modules.items():
            sys.modules[k] = v
