---
trigger: always_on
---

# xKube Development Rules

## Project Structure
- **Frontend**: React + Vite + Tailwind v4 at `/frontend`
- **Backend**: FastAPI + Python at `/backend`
- **x-ui**: Submodule at `/packages/x-ui`

## UI Development
- Use `@xdev-asia/x-ui-react` components for all UI elements
- ThemeProvider with `defaultTheme="dark"` is required
- Use x-ui MCP server for component generation: `list_components`, `get_component_usage`
- Tailwind v4 requires `@source` directives in `index.css` to include x-ui:
  ```css
  @import "tailwindcss";
  @source "../../packages/x-ui/packages/react/src";
  @source "../../packages/x-ui/packages/core/src";
  ```

## Backend Development
- Backend runs on port 8888: `uvicorn app.main:app --port 8888`
- Use `k8s_insecure=True` for self-signed K8s certificates
- All API endpoints are under `/api/` prefix

## Commands
- Frontend dev: `cd frontend && npm run dev`
- Backend dev: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8888`
- Build x-ui: `cd packages/x-ui && pnpm install && pnpm build`
