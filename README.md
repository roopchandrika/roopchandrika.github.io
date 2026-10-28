# Portfolio: Roop Chandrika Mallela

A single-page, interactive portfolio. Plain HTML, CSS and JavaScript: no build step, no dependencies, ready for GitHub Pages.

## What's on the page

| Section | What it does |
|---|---|
| Hero | Animated agent/data network, typing taglines, headline stats |
| About and Journey | Bio, quick facts, work and education timelines |
| Projects | Every project as a card: filter by area, search, or filter by skill; click for details |
| Deep dives | Step-through explainers for the job-shop agent, fraud investigator and complaint copilot |
| Dashboards | All 20 Power BI dashboards in a gallery with a full-size viewer (arrow keys and swipe) |
| Skills | Click a skill to see the projects that use it |
| Contact | Email, copy-to-clipboard, LinkedIn, GitHub |
| Terminal | Press <kbd>`</kbd> (or the `>_` button) and type `help` |

It has light and dark themes, works on phones, and respects the "reduce motion" setting.

## Updating content

All text lives in [`assets/js/data.js`](assets/js/data.js): profile, stats, work, education, projects, dashboards and skills.
To add a project, copy an entry in `projects`, change the fields, and put its image in `assets/img/projects/` (WebP, about 1400 px wide).

Projects with `pinned: true` (the repos pinned on GitHub) appear on the home page, `index.html`.
Every other project appears on the Additional work page, `work.html`, which has the filters and search.
When you change your GitHub pins, move the `pinned: true` lines to match.

## Run locally

```bash
python -m http.server 5173 --directory portfolio
```

Then open http://localhost:5173.

## Publish on GitHub Pages

Push this folder's contents to the root of a repository, then turn on **Settings → Pages → Deploy from branch → main / root**.
A repository named `roopchandrika.github.io` is served at https://roopchandrika.github.io.
