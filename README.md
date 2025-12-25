# Owencyclopedia — MVP (content-first fractal map)

This is a **lightweight, static** personal website for navigating Owen’s life taxonomy as a **fractal** — with the **page content front-and-center** and navigation (outline + map) secondary.

## What it does

- **Content-first page view**: each node renders as a readable “paper” page (notes + sections).
- **Outline (collapsible)**: quickly jump through the tree without getting lost.
- **Map (fractal lens)**: focused node in the center, **children ring** around it, and a **parent node** above (when applicable).
- **Search**: type to jump anywhere fast (keyboard friendly).
- **Deep links**: URL hash updates (`#id=...`) so you can share a specific node.

## Controls

- **Outline**: toggle in the header → click any node to focus.
- **Map**:
  - Scroll to **zoom** (bounded)
  - Drag to **pan** (bounded)
  - Double-click to **reset**
  - The **Parent** node (dashed) is clickable and navigates “up”
- **Search**: type → arrow keys → Enter

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
- `content`: long-form notes for the main page (**simple Markdown-ish supported**: `#`, `##`, `###`, `-` lists)
- `children`: nested pages
- `related`: rare cross-links between branches

## Deploy (GitHub Pages)

This repo is “Pages-ready” because the site lives at the root:

- GitHub → **Settings → Pages**
- **Deploy from a branch**
- Branch: `main`
- Folder: `/ (root)`

## Next ideas (fast)

- **Backlinks**: show what links *to* the current page (makes cross-links feel natural).
- **Content import**: Notion export → generate `data.js` nodes/content.
- **Richer markdown**: bold/italics, links, and inline code in `content`.


