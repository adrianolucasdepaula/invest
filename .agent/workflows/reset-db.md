---
description: Reset Database (Hard Reset)
---

# Reset Database

This workflow performs a "Hard Reset" of the database by removing the Docker volumes.
**WARNING**: This will delete ALL data in the local database.

1. Stop containers and remove volumes
   ```bash
   docker-compose down --volumes
   ```

2. Start the database and redis services
   ```bash
   docker-compose up -d postgres redis
   ```

3. Wait for database to be ready
   ```bash
   # Simple wait strategy (adjust sleep if needed)
   sleep 5
   ```

4. Run Migrations
   ```bash
   cd backend
   npm run migration:run
   ```

5. (Optional) Seed Data
   <!-- If you have a seed script, uncomment the following: -->
   <!-- npm run seed -->
