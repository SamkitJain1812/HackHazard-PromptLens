## Query Explainer (Extensible Feature)

Adds a small **"How was this generated?"** toggle on each chart.

When expanded, it shows the **SQL** used to generate that chart (the SQL Gemini produced, or fallback SQL when Gemini is unavailable).

### Data contract (backend → frontend)

Each chart object in the `/query` response should include:

- `chart.sql`: the SQL string that was executed
- `chart.data`: rows returned from SQLite (array of objects)
- `chart.x_key`: x-axis column name in `chart.data`
- `chart.y_keys`: list of y-axis column names in `chart.data`

The current frontend uses these to render the chart and to display SQL in the explainer panel.

