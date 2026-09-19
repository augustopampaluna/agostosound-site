# AGOSTO

Static website for AGOSTO, an Amsterdam-based techno DJ and producer. It is ready to deploy directly to GitHub Pages: no frameworks, packages, npm, or build process are used.

## Requirements

- A modern browser.
- Python 3 only for starting a simple local server. There are no repository dependencies to install.

> Do not open `index.html` directly from the file explorer. The site loads Markdown and JSON from `docs/` using `fetch`, so it must be served over HTTP.

## Run Locally

From the repository root, run:

```powershell
py -m http.server 4173
```

Then open [http://localhost:4173/](http://localhost:4173/) in a browser. Stop the server with `Ctrl+C` in the terminal.

If `py` is unavailable but Python 3 is installed, use:

```powershell
python -m http.server 4173
```

## Structure

```text
.
|-- index.html           # Semantic single-page structure and SEO metadata
|-- styles.css           # Responsive design, theme, animations, and visual accessibility
|-- script.js            # Content loading, player, mobile menu, and interactions
|-- docs/                # Editable content source
|-- static/              # Images and brand assets
`-- README.md
```

### Content (`docs/`)

Editorial content lives outside the code and is loaded by `script.js` when the page opens:

- `bio-short.md` and `bio-long.md`: About section.
- `world.md`, `character.md`, `locations.md`, and `manifesto.md`: World section.
- `links.json`: social, booking, and collective links.
- `releases.json`: singles, EP, tracks, artwork, and SoundCloud URLs.
- `media.json`: reserved for future media content; it is currently not shown because its fields are empty.

When updating `releases.json`, preserve each release's structure. Singles contain one track, while the EP contains three tracks and its playlist URL. The site creates one shared SoundCloud player when a track is selected, so do not add iframes to the HTML.

### Assets (`static/`)

- `branding/`: logo, favicon, and Open Graph image.
- `photos/`: hero, portrait, and live photography.
- `releases/`: artwork referenced by `releases.json`.
- `world/`: entity and narrative-world imagery.

Keep paths relative when editing the site. Local paths use the `./static/...` prefix so they work both on repository-hosted GitHub Pages sites and on a custom domain.

## Deploy With GitHub Pages

1. Push the files to a GitHub repository.
2. In GitHub, open **Settings > Pages**.
3. Select the publishing branch and the root (`/`) folder.
4. GitHub Pages will serve `index.html` automatically.

No output directory needs to be generated. When the `agostosound.com` domain is configured, add it as the GitHub Pages custom domain; the canonical and Open Graph metadata already point to it.

## Quick Checks

- Confirm that the links in `links.json` are not empty before publishing.
- Test every track and the `PLAY FULL EP` button in the Music section.
- Review the mobile navigation at 375px wide.
- Confirm that the images referenced in `releases.json` exist in `static/releases/`.
