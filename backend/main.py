"""
Render compatibility entrypoint.

Allows `uvicorn main:app` when the service root directory is `backend/`.
"""

from app.main import app

""