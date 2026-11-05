import sys
import os
import pytest

if __name__ == "__main__":
    os.environ["ENVIRONMENT"] = "testing"
    os.environ["SCHEDULER_ENABLED"] = "False"
    sys.exit(pytest.main(["backend/tests", "-v"]))

