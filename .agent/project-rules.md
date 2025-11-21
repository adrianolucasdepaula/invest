# Project Rules & Context

## Technology Stack
-   **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL, Redis.
-   **Frontend**: Next.js (App Router), React, Tailwind CSS, Radix UI.
-   **Testing**: Playwright (E2E), Jest (Unit).

## Architectural Patterns
-   **Backend**:
    -   Follow **Module** pattern (Controller -> Service -> Repository).
    -   Use **DTOs** (Data Transfer Objects) for validation.
    -   Keep business logic in **Services**.
-   **Frontend**:
    -   Use **Server Components** by default; add `"use client"` only when interactivity is needed.
    -   Use **Tailwind** for styling; avoid CSS modules unless necessary.
    -   **Zod** for schema validation.

## Coding Standards
-   **TypeScript**: Strict mode enabled. No `any`.
-   **Formatting**: Prettier (2 spaces, single quotes).
-   **Naming**:
    -   Files: `kebab-case.ts`
    -   Classes: `PascalCase`
    -   Variables/Functions: `camelCase`

## AI Agent Behavior
-   **Always** run tests after modifying logic.
-   **Always** check for existing components before creating new ones.
-   **Prefer** small, incremental changes over massive refactors.
