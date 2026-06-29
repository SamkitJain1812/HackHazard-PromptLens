## Typing Suggestions (Extensible Feature)

Adds lightweight autocomplete suggestions to the natural-language query input.

### Goals
- Suggest valid queries while the user types (click to apply).
- Prevent obvious gibberish from being sent to the backend.

### Integration points
- Frontend: `frontend/src/pages/DashboardPage.jsx` query textarea
- Backend: `backend/llm.py` validates the query too (defense in depth)

