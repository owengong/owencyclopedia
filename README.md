# Owencyclopedia — MVP (Fractal “Focus Lens”)

This is a **lightweight, static** prototype for navigating Owen’s life taxonomy as a **fractal**:

- You see **big domains** at the top (Health, Relationships, Mastery, …)
- Click any node to **zoom in** (that node becomes the center, its children appear around it)
- “Related” links support **rare cross-domain blends** without turning the whole thing into a messy graph

## Run it

Option A (simplest): open this file in your browser:

- `index.html`

Option B (recommended): run a local server from the repo root:

```bash
cd /Users/owengong/Desktop/owencyclopedia
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/`

## Edit the structure

Open `data.js`.

Each entry is a node:

- `id`: stable unique key (don’t change often)
- `title`: what you see
- `blurb`: short description
- `content`: long-form notes for the main page (simple Markdown-ish supported)
- `children`: nested pages
- `related`: rare cross-links between branches

## What to iterate next (fast)

- Decide if you prefer **focus-lens coherence** (this MVP) vs **free-roam universe** (your `mvp-v1`)
- Add “backlinks” (show what links *to* the current page) to make cross-links feel natural


