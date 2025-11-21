---
description: Scaffold New NestJS Resource
---

# Scaffold NestJS Resource

This workflow generates a new NestJS resource (Module, Controller, Service, DTO) following the project's strict architectural rules.

1.  **Prompt User for Resource Name**
    -   Ask the user for the name of the resource (e.g., `users`, `products`).

2.  **Generate Files**
    -   Create the directory structure: `backend/src/<resource_name>`
    -   **DTO**: Create `dto/create-<resource_name>.dto.ts` and `dto/update-<resource_name>.dto.ts`. Use `class-validator`.
    -   **Entity**: Create `entities/<resource_name>.entity.ts` (TypeORM).
    -   **Service**: Create `<resource_name>.service.ts`. Inject Repository.
    -   **Controller**: Create `<resource_name>.controller.ts`. Use `ParseIntPipe` for IDs.
    -   **Module**: Create `<resource_name>.module.ts`. Register Controller and Service.

3.  **Register Module**
    -   Import the new module in `app.module.ts`.

4.  **Run Tests**
    -   Run `npm run test` in `backend` to ensure no regressions.
