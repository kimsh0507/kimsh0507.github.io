# Sunghwan Kim Homepage

This repository is a Jekyll-based personal academic homepage for GitHub Pages.

## Local Preview

Install Ruby gems once:

```bash
bundle install
```

Run the site locally:

```bash
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/` in your browser.

## Edit Profile Content

Most homepage content is stored in `_data/`.

- `_data/config.yml`: name, position, affiliation, bio, research interests, and profile links
- `_data/news.yml`: homepage news items
- `_data/publications.yml`: publication list and paper links
- `_data/talks.yml`: invited talks
- `_data/vitae.yml`: education and experience timeline

Profile assets are stored in `assets/img/`.

- `assets/img/profile.jpg`: profile photo
- `assets/img/cv.pdf`: CV file

## Publications

Edit `_data/publications.yml` to add or update papers. Papers are shown in the same order as this file. Set `selected: true` to show a paper on the homepage. Empty link fields such as `website_url`, `code_url`, and `dataset_url` are hidden automatically.

Example:

```yaml
- title: "Paper Title"
  authors:
    - "Sunghwan Kim"
    - "Coauthor Name"
  venue: "ACL 2026"
  year: 2026
  selected: true
  paper_url: "https://arxiv.org/abs/..."
  website_url: ""
  code_url: ""
  dataset_url: ""
  keywords:
    - "Language Agents"
```

Use `paper_url: "to-appear"` when the paper exists but the PDF is not public yet.

## Blog Posts

Create posts in `_posts/` using the Jekyll filename format. The folder name must be `_posts`, not `_post`.

```text
YYYY-MM-DD-post-title.md
```

Post files are Markdown files, not standalone YAML files. Add YAML front matter at the top of each `.md` file:

```yaml
---
layout: post
title: "Post Title"
date: 2026-06-07
visible: true
sitemap: true
keywords:
  - Research
---
```

Only posts with `visible: true` are shown in the blog list and RSS feed. Add `sitemap: true` to public posts that should appear in the sitemap.

Secret posts can be published by URL while staying out of the blog list, RSS feed, and sitemap:

```yaml
---
layout: post
title: "Hidden Post"
date: 2026-06-07
secret: true
hidden: true
sitemap: false
---
```

## Styling

Main styles are loaded from `assets/css/main.scss`, which imports partials in `_sass/`.

- `_sass/_base.scss`: global layout, About section, typography
- `_sass/_cards.scss`: paper, news, talk, and blog cards
- `_sass/_timeline.scss`: Vitae timeline
- `_sass/_navbar.scss`: navigation and theme toggle
- `_sass/_blog.scss`: blog and post pages

## Build Check

Before pushing, run:

```bash
bundle exec jekyll build
```

GitHub Pages will build the site from the repository root.
