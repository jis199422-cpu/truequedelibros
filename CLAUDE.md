# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trueque de Libros** is a book-swap/exchange platform. The repository is a monorepo with two independent projects:

- `backend/truequedelibros/` — Spring Boot 4.0.6 (Java 21) REST API
- `frontend/` — React 19 + Vite 8 SPA

## Backend Commands

Run from `backend/truequedelibros/`:

```bash
# Start dev server
./mvnw spring-boot:run

# Build
./mvnw package

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=TruequedelibrosApplicationTests

# Run a single test method
./mvnw test -Dtest=TruequedelibrosApplicationTests#contextLoads
```

On Windows use `mvnw.cmd` instead of `./mvnw`.

## Frontend Commands

Run from `frontend/`:

```bash
npm install        # install dependencies
npm run dev        # dev server with HMR (default: http://localhost:5173)
npm run build      # production build to dist/
npm run preview    # preview production build
npm run lint       # ESLint check
```

## Architecture

### Backend

Spring Boot app with the standard layered architecture. Key tech:

- **Spring Data JPA + PostgreSQL** — persistence; database connection must be configured in `application.properties` (currently only `spring.application.name` is set — add `spring.datasource.*` before running)
- **Spring Security** — authentication/authorization (on classpath but not yet configured)
- **Spring Validation** — bean validation via `@Valid`
- **Lombok** — reduces boilerplate; Lombok annotation processor is wired in the Maven compiler plugin for both `compile` and `test-compile` phases

### Frontend

React SPA scaffolded with Vite. Uses:

- `@vitejs/plugin-react` (Oxc-based transform)
- ESLint with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- No TypeScript — plain `.js`/`.jsx`

### Cross-cutting

The backend and frontend are completely decoupled (no shared build). The frontend will communicate with the backend via HTTP; configure a Vite proxy in `vite.config.js` to avoid CORS issues during development.

Coding standards:

- SOLID
- Clean code
- Avoid God classes
- Prefer composition
- Keep methods small
- Use DTOs between API and domain
- Explicit validation

Backend rules:

- Never access repository from controller
- Service layer mandatory
- Use constructor injection
- Add tests for business logic

Frontend rules:

- Reusable components
- Feature-based folder structure
- Avoid giant components
- API client abstraction

Development workflow:

1. Plan first
2. Propose architecture
3. Wait approval
4. Implement incrementally
5. Run tests
6. Refactor if needed

Important:
Never generate huge files (>300 LOC).
Always explain tradeoffs before big architectural decisions.
