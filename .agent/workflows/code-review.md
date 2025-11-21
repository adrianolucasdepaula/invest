---
description: Code Review (Pre-Flight Check)
---

# Code Review & Health Check

This workflow runs a comprehensive check of the codebase to ensure quality before committing or deploying.

1.  **Backend Checks**
    ```bash
    cd backend
    echo "Running Backend Lint..."
    npm run lint
    echo "Running Backend Tests..."
    npm run test
    ```

2.  **Frontend Checks**
    ```bash
    cd frontend
    echo "Running Frontend Lint..."
    npm run lint
    echo "Building Frontend (Type Check)..."
    npm run build
    ```

3.  **Report Generation**
    -   The agent will analyze the output of the above commands.
    -   If any step fails, the agent will report the specific error.
    -   If all steps pass, the agent will certify the codebase as "Healthy".
