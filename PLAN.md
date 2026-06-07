# 개인 홈페이지 기획서 — GitHub Pages 배포용

> **배포 환경:** `username.github.io`  
> 이 문서는 AI가 단독으로 홈페이지를 개발할 수 있도록 구조, 컴포넌트, 디자인, 기능을 모두 명세한 완전한 기획서입니다.

---

## 목차

1. [프로젝트 개요 및 GitHub Pages 제약](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#1-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EA%B0%9C%EC%9A%94-%EB%B0%8F-github-pages-%EC%A0%9C%EC%95%BD)
2. [기술 스택](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#2-%EA%B8%B0%EC%88%A0-%EC%8A%A4%ED%83%9D)
3. [파일 및 폴더 구조](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#3-%ED%8C%8C%EC%9D%BC-%EB%B0%8F-%ED%8F%B4%EB%8D%94-%EA%B5%AC%EC%A1%B0)
4. [사이트 구조 (라우팅)](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#4-%EC%82%AC%EC%9D%B4%ED%8A%B8-%EA%B5%AC%EC%A1%B0-%EB%9D%BC%EC%9A%B0%ED%8C%85)
5. [전역 디자인 시스템](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#5-%EC%A0%84%EC%97%AD-%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%8A%A4%ED%85%9C)
6. [공통 컴포넌트](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#6-%EA%B3%B5%ED%86%B5-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8)
7. [페이지별 상세 명세](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#7-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%B3%84-%EC%83%81%EC%84%B8-%EB%AA%85%EC%84%B8)

- 7.1 About 페이지
- 7.2 Publication 페이지
- 7.3 Blog 목록 페이지
- 7.4 Blog 포스트 상세 페이지

8. [데이터 관리 방식](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#8-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EA%B4%80%EB%A6%AC-%EB%B0%A9%EC%8B%9D)
9. [인터랙션 & 애니메이션](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#9-%EC%9D%B8%ED%84%B0%EB%9E%99%EC%85%98--%EC%95%A0%EB%8B%88%EB%A9%94%EC%9D%B4%EC%85%98)
10. [반응형 브레이크포인트](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#10-%EB%B0%98%EC%9D%91%ED%98%95-%EB%B8%8C%EB%A0%88%EC%9D%B4%ED%81%AC%ED%8F%AC%EC%9D%B8%ED%8A%B8)
11. [접근성 & SEO](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#11-%EC%A0%91%EA%B7%BC%EC%84%B1--seo)
12. [블로그 포스트 작성 워크플로](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#12-%EB%B8%94%EB%A1%9C%EA%B7%B8-%ED%8F%AC%EC%8A%A4%ED%8A%B8-%EC%9E%91%EC%84%B1-%EC%9B%8C%ED%81%AC%ED%94%8C%EB%A1%9C)

---

## 1. 프로젝트 개요 및 GitHub Pages 제약

### GitHub Pages 핵심 제약

| 제약                 | 내용                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| **서버 실행 불가**   | Node.js, Python 등 서버 프로세스 없음. 순수 정적 파일만 서빙                 |
| **빌드 도구**        | GitHub Actions로 빌드 후 `gh-pages` 브랜치 또는 `docs/` 폴더 배포            |
| **동적 라우팅 불가** | `/blog/my-post` 같은 URL은 `blog/my-post/index.html` 파일로 미리 생성해야 함 |
| **404 처리**         | `404.html` 파일로 fallback 처리 가능                                         |
| **DB/백엔드 없음**   | 모든 콘텐츠는 빌드 시점에 HTML로 생성되거나 JS로 클라이언트 로딩             |

### 선택한 해결책

**Jekyll (GitHub Pages 공식 지원)** 을 사용한다.

- GitHub Actions 없이 `_config.yml` + Markdown만으로 자동 빌드
- GitHub Pages가 Jekyll을 네이티브 지원 (push만 해도 자동 빌드/배포)
- Liquid 템플릿으로 동적 콘텐츠(논문 목록, 뉴스 등) 생성
- `_data/*.yml` 파일로 데이터 관리 → 코드 수정 없이 콘텐츠 업데이트 가능
- Blog 포스트는 `_posts/` 폴더에 Markdown 파일로 작성

### Secret 포스트 구현 방식

서버가 없으므로 완전한 비공개는 불가하나, **실질적 비공개** 를 구현한다:

- `_posts/` 에 포스트 작성 시 frontmatter에 `secret: true` 설정
- Jekyll 빌드 시 `secret: true` 포스트는 목록(`/blog/`) 에서 제외
- 단, 빌드된 HTML 파일은 URL을 알면 접근 가능 (`/blog/SECRET_TITLE/`)
- `secret: true` 이면 `<meta name="robots" content="noindex, nofollow">` 자동 삽입
- 검색엔진 크롤링 차단 + `sitemap.xml` 미포함 처리

---

## 2. 기술 스택

| 역할                 | 선택                               | 이유                                            |
| -------------------- | ---------------------------------- | ----------------------------------------------- |
| **정적 사이트 생성** | Jekyll 4.x                         | GitHub Pages 네이티브 지원, 별도 Actions 불필요 |
| **템플릿 언어**      | Liquid                             | Jekyll 내장                                     |
| **스타일링**         | 순수 CSS (CSS Variables)           | 외부 빌드 의존성 없음, Jekyll이 그대로 서빙     |
| **JS 번들링**        | 없음 (Vanilla JS, `<script>` 태그) | 빌드 복잡도 제거                                |
| **애니메이션**       | CSS Animations + Vanilla JS        | 라이브러리 없이 구현                            |
| **폰트**             | Google Fonts CDN                   | `@import` 또는 `<link>`                         |
| **아이콘**           | SVG 인라인 또는 Feather Icons CDN  | 의존성 최소화                                   |
| **마크다운 처리**    | kramdown (Jekyll 기본)             | GitHub Pages 지원                               |

### Jekyll 버전 및 플러그인

GitHub Pages에서 허용하는 플러그인만 사용:

- `jekyll-feed` — RSS 피드 생성
- `jekyll-seo-tag` — SEO 메타태그 자동 생성
- `jekyll-sitemap` — sitemap.xml 자동 생성 (secret 포스트 제외 로직 포함)

> ⚠️ 허용되지 않는 플러그인(예: `jekyll-paginate-v2`)은 사용 불가. 페이지네이션이 필요하면 Vanilla JS로 클라이언트 사이드 구현.

---

## 3. 파일 및 폴더 구조

```
username.github.io/
├── _config.yml                  # Jekyll 전역 설정
├── _data/
│   ├── config.yml               # 사이트 개인 설정 (이름, 소셜 링크 등)
│   ├── news.yml                 # News 항목 목록
│   ├── publications.yml         # 논문 목록
│   ├── talks.yml                # Invited Talks 목록
│   └── vitae.yml                # Vitae 항목 목록
├── _includes/
│   ├── head.html                # <head> 공통 (CSS, 폰트, SEO 태그)
│   ├── navbar.html              # 네비게이션 바
│   ├── footer.html              # 푸터
│   ├── paper-card.html          # 논문 카드 컴포넌트
│   ├── blog-card.html           # 블로그 카드 컴포넌트
│   ├── timeline-item.html       # Vitae 타임라인 아이템
│   └── badge.html               # 뱃지 컴포넌트
├── _layouts/
│   ├── default.html             # 기본 레이아웃 (navbar + content + footer)
│   ├── page.html                # 일반 페이지 레이아웃
│   └── post.html                # 블로그 포스트 레이아웃
├── _posts/                      # 블로그 포스트 (YYYY-MM-DD-title.md 형식)
│   ├── 2024-11-01-my-post.md
│   └── 2024-10-15-secret-post.md
├── _sass/                       # SCSS 파일 (Jekyll이 자동 컴파일)
│   ├── _variables.scss          # CSS 변수 및 색상
│   ├── _base.scss               # 기본 리셋 및 타이포그래피
│   ├── _navbar.scss
│   ├── _cards.scss
│   ├── _timeline.scss
│   └── _blog.scss
├── assets/
│   ├── css/
│   │   └── main.scss            # SCSS 진입점 (위 _sass/ 파일들 import)
│   ├── js/
│   │   ├── theme.js             # 다크/라이트 모드 토글
│   │   ├── typewriter.js        # 타이핑 애니메이션
│   │   └── news.js              # News "Show more" 기능
│   └── img/
│       ├── profile.jpg          # 프로필 사진
│       └── cv.pdf               # CV 파일
├── blog/
│   └── index.html               # Blog 목록 페이지
├── publication/
│   └── index.html               # Publication 페이지
├── index.html                   # About 페이지 (홈)
├── 404.html                     # 404 페이지
├── Gemfile                      # Ruby 의존성
└── Gemfile.lock

```

---

## 4. 사이트 구조 (라우팅)

| URL                      | 파일                     | 설명                            |
| ------------------------ | ------------------------ | ------------------------------- |
| `/`                      | `index.html`             | About 페이지                    |
| `/publication/`          | `publication/index.html` | 전체 논문 목록                  |
| `/blog/`                 | `blog/index.html`        | 블로그 목록 (secret 제외)       |
| `/blog/YYYY/MM/DD/slug/` | Jekyll 자동 생성         | 개별 포스트                     |
| `/blog/SECRET_TITLE/`    | Jekyll 자동 생성         | Secret 포스트 (직접 URL 접근만) |

> Jekyll은 `_posts/YYYY-MM-DD-title.md` 파일을 자동으로 `/blog/YYYY/MM/DD/title/index.html` 로 빌드한다. `_config.yml`의 `permalink` 설정으로 URL 형식 제어.

`_config.yml` **permalink 설정:**

```yaml
permalink: /blog/:year/:month/:day/:slug/
```

---

## 5. 전역 디자인 시스템

### 5.1 색상 (CSS Custom Properties)

`_sass/_variables.scss` 에 정의. JavaScript에서도 `document.documentElement.style.setProperty()` 로 접근 가능.

```scss
/* Dark Mode (기본값) */
[data-theme="dark"] {
  --bg-primary: #0e0e10;
  --bg-secondary: #18181b;
  --bg-tertiary: #27272a;
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;
  --border: #27272a;
  --accent: #7c3aed; /* 포인트 색상 */
  --accent-light: #a78bfa;
  --accent-bg: #1e1030;
  --timeline-academy: #7c3aed; /* Vitae Academy 노드 */
  --timeline-industry: #059669; /* Vitae Industry 노드 */
  --link: #a78bfa;
  --link-hover: #c4b5fd;
  --card-shadow: 0 0 0 1px #27272a;
  --card-shadow-hover: 0 0 0 1px #7c3aed;
}

/* Light Mode */
[data-theme="light"] {
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f4f4f5;
  --text-primary: #09090b;
  --text-secondary: #52525b;
  --text-muted: #a1a1aa;
  --border: #e4e4e7;
  --accent: #7c3aed;
  --accent-light: #6d28d9;
  --accent-bg: #ede9fe;
  --timeline-academy: #7c3aed;
  --timeline-industry: #059669;
  --link: #7c3aed;
  --link-hover: #6d28d9;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --card-shadow-hover: 0 0 0 1px #7c3aed, 0 2px 8px rgba(124, 58, 237, 0.12);
}
```

> **포인트 색상 변경 방법:** `--accent`, `--accent-light`, `--accent-bg`, `--timeline-academy` 값만 수정하면 전체 적용.

### 5.2 타이포그래피

```scss
/* _sass/_base.scss */
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap");
```

| 용도              | 폰트           | weight | size                         |
| ----------------- | -------------- | ------ | ---------------------------- |
| 이름 (Hero)       | Syne           | 800    | `clamp(2.5rem, 5vw, 3.5rem)` |
| 타이핑 애니메이션 | Syne           | 500    | `1.15rem`                    |
| 섹션 헤더         | Syne           | 700    | `1.25rem`                    |
| 네비게이션        | Syne           | 600    | `0.875rem`                   |
| 뱃지 / 날짜       | Syne           | 500    | `0.75rem`                    |
| 카드 제목         | Source Serif 4 | 600    | `1rem`                       |
| 본문 / 저자       | Source Serif 4 | 400    | `0.925rem`                   |
| 블로그 본문       | Source Serif 4 | 400    | `1rem`, `line-height: 1.85`  |

### 5.3 레이아웃

```scss
.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px;
}
```

### 5.4 카드 공통 스타일

```scss
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: var(--card-shadow);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;

  &:hover {
    border-color: var(--accent);
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-2px);
  }
}
```

### 5.5 다크/라이트 모드 초기화 전략

`<head>` 최상단 인라인 `<script>` 로 FOUC(flash of unstyled content) 방지:

```html
<!-- _includes/head.html 최상단에 삽입 -->
<script>
  (function () {
    var saved = localStorage.getItem("theme");
    var preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", saved || preferred || "dark");
  })();
</script>
```

---

## 6. 공통 컴포넌트

### 6.1 Navbar (`_includes/navbar.html`)

```
[이름/사이트명]          [About] [Publication] [Blog]  [🌙/☀️]

```

- `position: sticky; top: 0; z-index: 50`
- 배경: `var(--bg-primary)` + `backdrop-filter: blur(12px)`
- 하단 `border-bottom: 1px solid var(--border)`
- 활성 링크: `color: var(--accent)` + `border-bottom: 2px solid var(--accent)` (2px 내려서 navbar 하단선과 겹치도록)
- 활성 링크 판별: Liquid `{{ page.url | contains: '/publication' }}` 등으로 처리
- 다크/라이트 토글 버튼: SVG 아이콘 (달/태양), `assets/js/theme.js` 연결

### 6.2 Section Title

```html
<!-- 사용 예시 -->
{% include section-title.html title="News" id="news" %}
```

```scss
.section-title {
  font-family: "Syne", sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2rem;

  &::before {
    content: "";
    display: block;
    width: 3px;
    height: 1.25rem;
    background: var(--accent);
    border-radius: 2px;
  }
}
```

### 6.3 Badge (`_includes/badge.html`)

```liquid
{% include badge.html label="NeurIPS 2025" variant="venue" %}
{% include badge.html label="Oral" variant="oral" %}
{% include badge.html label="Best Paper" variant="award" %}
{% include badge.html label="transformer" variant="keyword" %}
```

| variant   | 배경                                 | 텍스트                  | 비고           |
| --------- | ------------------------------------ | ----------------------- | -------------- |
| `venue`   | `var(--bg-tertiary)`                 | `var(--text-secondary)` | 기본 컨퍼런스  |
| `oral`    | `#451a03` (dark) / `#fff7ed` (light) | `#fb923c` / `#c2410c`   |                |
| `award`   | `#422006` (dark) / `#fffbeb` (light) | `#fbbf24` / `#b45309`   | 🏆 아이콘 포함 |
| `keyword` | `var(--accent-bg)`                   | `var(--accent-light)`   |                |

공통 스타일:

```scss
.badge {
  font-family: "Syne", sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 2px 9px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
```

### 6.4 Icon Link

```html
<a href="{{ link }}" class="icon-link" target="_blank" rel="noopener noreferrer">
  <!-- SVG 아이콘 -->
  <span>{{ label }}</span>
</a>
```

```scss
.icon-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-family: "Syne", sans-serif;
  font-size: 0.875rem;
  text-decoration: none;
  transition:
    color 0.15s ease,
    transform 0.15s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: var(--accent);
    transform: translateX(3px);
  }
}
```

---

## 7. 페이지별 상세 명세

---

### 7.1 About 페이지 (`index.html`)

**frontmatter:**

```yaml
---
layout: default
title: Home
---
```

**섹션 순서:** `AboutMe → News → Selected Publications → Invited Talks → Vitae`

> **조건부 렌더링 원칙:** 각 섹션은 해당 데이터가 비어있으면 렌더링하지 않는다. Liquid `{% if data.size > 0 %}` 로 제어.

---

#### 7.1.1 AboutMe 섹션

**HTML 구조:**

```html
<section class="about-me">
  <div class="about-left">
    <h1 class="hero-name">{{ site.data.config.name }}</h1>
    <p class="typewriter-prefix">Research: <span id="typewriter"></span><span class="cursor">|</span></p>
    <div class="bio">{{ site.data.config.bio }}</div>
  </div>
  <div class="about-right">
    <img src="/assets/img/profile.jpg" alt="{{ site.data.config.name }}" class="profile-img" />
    <nav class="social-links">
      <!-- 소셜 링크 반복 -->
    </nav>
  </div>
</section>
```

**레이아웃 (CSS):**

```scss
.about-me {
  display: flex;
  gap: 48px;
  align-items: flex-start;
  margin-bottom: 5rem;

  @media (max-width: 640px) {
    flex-direction: column-reverse;
  }
}

.about-left {
  flex: 1;
  min-width: 0;
}

.about-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 180px;
}
```

**프로필 사진:**

```scss
.profile-img {
  width: 180px;
  height: 220px;
  object-fit: cover;
  border-radius: 16px;
  border: 2px solid var(--border);
}
```

**소셜 링크 목록** (`_data/config.yml`에서 루프):

```yaml
# _data/config.yml
social:
  - label: Google Scholar
    icon: graduation-cap # SVG 파일명 또는 Feather Icons 이름
    url: https://scholar.google.com/...
    external: true
  - label: GitHub
    icon: github
    url: https://github.com/...
    external: true
  - label: X
    icon: twitter
    url: https://x.com/...
    external: true
  - label: CV
    icon: file-text
    url: /assets/img/cv.pdf
    external: true
    download: true
  - label: Email
    icon: mail
    url: mailto:user@example.com
    external: false
```

**타이핑 애니메이션 데이터:**

```yaml
# _data/config.yml
research_interests:
  - "Large Language Models"
  - "Multimodal Learning"
  - "AI Alignment"
  - "..."
```

Liquid로 JSON 배열 생성 후 `assets/js/typewriter.js`에 전달:

```html
<script>
  var RESEARCH_INTERESTS = {{ site.data.config.research_interests | jsonify }};
</script>
<script src="/assets/js/typewriter.js"></script>
```

---

#### 7.1.2 News 섹션

**조건:** `site.data.news`가 비어있으면 섹션 미렌더링.

```liquid
{% if site.data.news.size > 0 %}
  <section id="news">
    {% include section-title.html title="News" %}
    <div class="news-list" id="news-list">
      {% for item in site.data.news %}
        <div class="news-item {% if forloop.index > 7 %}news-hidden{% endif %}">
          <span class="news-date">{{ item.date }}</span>
          <span class="news-content">{{ item.content }}</span>
        </div>
      {% endfor %}
    </div>
    {% if site.data.news.size > 7 %}
      <button class="show-more-btn" id="news-toggle" onclick="toggleNews()">Show more ({{ site.data.news.size | minus: 7 }} more)</button>
    {% endif %}
  </section>
{% endif %}
```

**스타일:**

```scss
.news-list {
  display: flex;
  flex-direction: column;
}

.news-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  align-items: baseline;

  &:last-child {
    border-bottom: none;
  }
}

.news-date {
  font-family: "Syne", sans-serif;
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.news-content {
  font-family: "Source Serif 4", serif;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;

  a {
    color: var(--link);
  }
  a:hover {
    color: var(--link-hover);
    text-decoration: underline;
  }
}

.news-hidden {
  display: none;
}

.show-more-btn {
  margin-top: 12px;
  background: none;
  border: none;
  color: var(--accent);
  font-family: "Syne", sans-serif;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 0;

  &:hover {
    text-decoration: underline;
  }
}
```

`assets/js/news.js`**:**

```javascript
function toggleNews() {
  var hidden = document.querySelectorAll(".news-hidden");
  var btn = document.getElementById("news-toggle");
  var isExpanded = btn.dataset.expanded === "true";

  hidden.forEach(function (el) {
    el.style.display = isExpanded ? "none" : "grid";
  });
  btn.dataset.expanded = isExpanded ? "false" : "true";
  btn.textContent = isExpanded ? "Show more (" + hidden.length + " more)" : "Show less";
}
```

`_data/news.yml` **구조:**

```yaml
- date: "2025.03"
  content: "Paper accepted to ICML 2025."
- date: "2025.01"
  content: 'Invited talk at <a href="https://...">Workshop Name</a>.'
```

---

#### 7.1.3 Selected Publications 섹션

**조건:** `publications.yml` 에서 `selected: true` 인 항목이 하나도 없으면 미렌더링.

```liquid
{% assign selected_pubs = site.data.publications | where: 'selected', true %}
{% if selected_pubs.size > 0 %}
  <section id="selected-publications">
    {% include section-title.html title="Selected Publications" %}
    {% for pub in selected_pubs %}
      {% include paper-card.html pub=pub %}
    {% endfor %}
    <a href="/publication/" class="view-all-link">→ View all publications</a>
  </section>
{% endif %}
```

Paper Card 컴포넌트는 [7.2절](https://claude.ai/chat/9c943613-93bd-4e18-8762-3a054b49a3df#72-publication-%ED%8E%98%EC%9D%B4%EC%A7%80)과 동일한 `_includes/paper-card.html` 사용.

---

#### 7.1.4 Invited Talks 섹션

**조건:** `site.data.talks` 비어있으면 미렌더링.

```liquid
{% if site.data.talks.size > 0 %}
  <section id="invited-talks">
    {% include section-title.html title="Invited Talks" %}
    <div class="talks-list">
      {% for talk in site.data.talks %}
        <div class="card talk-card">
          <div class="talk-header">
            <span class="talk-event">{{ talk.event }}</span>
            <span class="talk-date">{{ talk.date }}</span>
          </div>
          <p class="talk-title">{{ talk.title }}</p>
          {% if talk.location %}
            <p class="talk-location">{{ talk.location }}</p>
          {% endif %}
          <div class="talk-links">
            {% if talk.slides %}
              <a href="{{ talk.slides }}" class="link-badge" target="_blank">Slides</a>
            {% endif %}
            {% if talk.video %}
              <a href="{{ talk.video }}" class="link-badge" target="_blank">Video</a>
            {% endif %}
          </div>
        </div>
      {% endfor %}
    </div>
  </section>
{% endif %}
```

`_data/talks.yml` **구조:**

```yaml
- title: "Title of My Talk"
  event: "NeurIPS 2024 Workshop on ..."
  date: "2024.12"
  location: "Vancouver, Canada"
  slides: "https://..."
  video: "" # 없으면 빈 문자열 또는 키 자체 생략
```

---

#### 7.1.5 Vitae 섹션

**조건:** `site.data.vitae` 비어있으면 미렌더링.

**레이아웃 방식:**

데스크탑에서는 CSS Grid `두 컬럼` (Academy 오른쪽, Industry 왼쪽) + 중앙 세로선.  
모바일에서는 단일 컬럼 (왼쪽 세로선).

```html
<!-- _includes/timeline-item.html -->
<div class="timeline-item timeline-{{ include.item.type }}">
  <div class="timeline-content">
    <p class="vitae-period">{{ include.item.period }}</p>
    <p class="vitae-role">{{ include.item.role }}</p>
    <p class="vitae-institution">{{ include.item.institution }}</p>
    {% if include.item.description %}
    <p class="vitae-desc">{{ include.item.description }}</p>
    {% endif %}
  </div>
  <div class="timeline-node"></div>
</div>
```

**CSS 핵심 구조:**

```scss
.timeline {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 2px 1fr; /* 왼쪽 | 선 | 오른쪽 */
  gap: 0 0;

  /* 중앙 세로선 */
  &::before {
    content: "";
    grid-column: 2;
    grid-row: 1 / -1;
    background: var(--border);
    width: 2px;
  }
}

/* Academy: 오른쪽 컬럼 */
.timeline-item.timeline-academy {
  grid-column: 3;
  padding-left: 28px;
  position: relative;

  .timeline-node {
    position: absolute;
    left: -7px; /* 중앙선 위에 */
    top: 8px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--timeline-academy);
  }
}

/* Industry: 왼쪽 컬럼 */
.timeline-item.timeline-industry {
  grid-column: 1;
  text-align: right;
  padding-right: 28px;
  position: relative;

  .timeline-node {
    position: absolute;
    right: -7px;
    top: 8px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: transparent;
    border: 2px solid var(--timeline-industry);
  }
}

/* 모바일: 단일 컬럼 */
@media (max-width: 640px) {
  .timeline {
    grid-template-columns: 20px 1fr;

    &::before {
      grid-column: 1;
    }
  }
  .timeline-item.timeline-academy,
  .timeline-item.timeline-industry {
    grid-column: 2;
    text-align: left;
    padding-left: 20px;
    padding-right: 0;

    .timeline-node {
      left: -27px;
      right: auto;
    }
  }
}
```

`_data/vitae.yml` **구조:**

```yaml
- type: academy # "academy" | "industry"
  period: "2023 – Present"
  role: "PhD Student"
  institution: "Seoul National University"
  description: "Advisor: Prof. Gildong Hong"

- type: industry
  period: "2022 – 2023"
  role: "Research Intern"
  institution: "Kakao Brain"
  description: ""
```

**정렬:** `_data/vitae.yml` 에 최신순으로 직접 입력 (Jekyll은 YAML 순서를 그대로 유지).

---

### 7.2 Publication 페이지 (`publication/index.html`)

**frontmatter:**

```yaml
---
layout: default
title: Publications
---
```

**전체 논문 목록:** `site.data.publications` 전체를 `year` 기준 역순 정렬 후 렌더링.

```liquid
{% assign sorted_pubs = site.data.publications | sort: 'year' | reverse %}
{% for pub in sorted_pubs %}
  {% include paper-card.html pub=pub %}
{% endfor %}
```

---

#### `_includes/paper-card.html` 상세

```html
<article class="card paper-card">
  <!-- 구역 1: Status Badges -->
  <div class="paper-badges">
    {% include badge.html label=include.pub.venue variant="venue" %} {% if include.pub.status == "oral" %} {% include badge.html label="Oral"
    variant="oral" %} {% elsif include.pub.status == "award" %} {% include badge.html label=include.pub.award_name variant="award" %} {% endif %}
  </div>

  <!-- 구역 2: Title -->
  <h3 class="paper-title">{{ include.pub.title }}</h3>

  <!-- 구역 3: Authors -->
  <p class="paper-authors">
    {% for author in include.pub.authors %} {% assign is_me = false %} {% if author == site.data.config.my_name or author contains "*" %} {% assign
    is_me = true %} {% endif %} {% assign clean_author = author | remove: "*" %} {% if include.pub.equal_contribution contains clean_author %} {% if
    is_me %}
    <strong>{{ clean_author }}<sup>*</sup></strong>
    {% else %} {{ clean_author }}<sup>*</sup>
    {% endif %} {% elsif is_me %}
    <strong>{{ clean_author }}</strong>
    {% else %} {{ clean_author }} {% endif %} {% unless forloop.last %}, {% endunless %} {% endfor %} {% if include.pub.equal_contribution.size > 0 %}
    <br /><span class="equal-contrib-note">* Equal contribution</span>
    {% endif %}
  </p>

  <!-- 구역 4: Links -->
  <div class="paper-links">
    {% if include.pub.paper_url == "to-appear" %}
    <span class="link-badge link-badge--disabled">Paper (To Appear)</span>
    {% else %}
    <a href="{{ include.pub.paper_url }}" class="link-badge" target="_blank">Paper</a>
    {% endif %} {% if include.pub.website_url %}
    <a href="{{ include.pub.website_url }}" class="link-badge" target="_blank">Website</a>
    {% endif %} {% if include.pub.code_url %}
    <a href="{{ include.pub.code_url }}" class="link-badge" target="_blank">Code</a>
    {% endif %} {% if include.pub.dataset_url %}
    <a href="{{ include.pub.dataset_url }}" class="link-badge" target="_blank">Dataset</a>
    {% endif %} {% for other in include.pub.others %}
    <a href="{{ other.url }}" class="link-badge" target="_blank">{{ other.title }}</a>
    {% endfor %}
  </div>
</article>
```

**Link Badge 스타일:**

```scss
.link-badge {
  display: inline-block;
  font-family: "Syne", sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  &--disabled {
    opacity: 0.45;
    cursor: default;
    pointer-events: none;
  }
}
```

`_data/publications.yml` **구조:**

```yaml
- title: "Paper Title Here"
  authors:
    - "Gildong Hong" # my_name과 일치하면 자동 볼드
    - "Collaborator A"
    - "Collaborator B"
  equal_contribution:
    - "Gildong Hong"
    - "Collaborator A"
  venue: "NeurIPS 2025"
  status: "oral" # "oral" | "award" | "poster" | (생략 가능)
  award_name: "Best Paper Award" # status가 "award"일 때
  paper_url: "https://arxiv.org/..."
  website_url: "https://..."
  code_url: "https://github.com/..."
  dataset_url: ""
  others:
    - title: "Demo"
      url: "https://..."
  selected: true
  year: 2025
```

---

### 7.3 Blog 목록 페이지 (`blog/index.html`)

**frontmatter:**

```yaml
---
layout: default
title: Blog
---
```

**탭 필터 (Vanilla JS):**

```html
<div class="blog-tabs">
  <button class="tab-btn active" data-filter="research" onclick="filterBlog('research')">Research</button>
  <button class="tab-btn" data-filter="life" onclick="filterBlog('life')">Life</button>
</div>

<div class="blog-grid" id="blog-grid">
  {% assign public_posts = site.posts | where_exp: "post", "post.secret != true" %} {% for post in public_posts %}
  <a href="{{ post.url }}" class="card blog-card" data-category="{{ post.category }}">
    <!-- 구역 1: 대주제 -->
    <div class="blog-meta">
      <span class="blog-category">{{ post.category | capitalize }}</span>
      <span class="blog-date">{{ post.date | date: "%Y.%m" }}</span>
    </div>

    <!-- 구역 2: 제목 -->
    <h3 class="blog-title">{{ post.title }}</h3>

    <!-- 구역 3: TL;DR -->
    {% if post.tldr %}
    <p class="blog-tldr">{{ post.tldr }}</p>
    {% endif %}

    <!-- 구역 4: Keywords -->
    {% if post.keywords %}
    <div class="blog-keywords">{% for kw in post.keywords %} {% include badge.html label=kw variant="keyword" %} {% endfor %}</div>
    {% endif %}
  </a>
  {% endfor %}
</div>
```

**탭 필터 JS:**

```javascript
function filterBlog(category) {
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.filter === category);
  });
  document.querySelectorAll(".blog-card").forEach(function (card) {
    card.style.display = card.dataset.category === category ? "block" : "none";
  });
}
// 초기 실행
filterBlog("research");
```

**Blog Card 스타일:**

```scss
.blog-card {
  display: block;
  text-decoration: none;
  cursor: pointer;

  .blog-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .blog-category {
    font-family: "Syne", sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .blog-date {
    font-family: "Syne", sans-serif;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .blog-title {
    font-family: "Source Serif 4", serif;
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
    margin: 0 0 8px;
  }

  .blog-tldr {
    font-family: "Source Serif 4", serif;
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 10px;
  }

  .blog-keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}
```

---

### 7.4 Blog 포스트 상세 페이지

`_layouts/post.html`**:**

```html
---
layout: default
---

{% if page.secret %}
<meta name="robots" content="noindex, nofollow" />
{% endif %}

<article class="post-container">
  <header class="post-header">
    <span class="post-category">{{ page.category | capitalize }}</span>
    <h1 class="post-title">{{ page.title }}</h1>
    <div class="post-meta">
      <time>{{ page.date | date: "%Y.%m.%d" }}</time>
      {% if page.keywords %}
      <div class="post-keywords">{% for kw in page.keywords %} {% include badge.html label=kw variant="keyword" %} {% endfor %}</div>
      {% endif %}
    </div>
    {% if page.tldr %}
    <blockquote class="post-tldr">{{ page.tldr }}</blockquote>
    {% endif %}
  </header>

  <div class="post-content">{{ content }}</div>
</article>
```

**블로그 포스트 본문 스타일 (**`_sass/_blog.scss`**):**

```scss
.post-content {
  h1,
  h2,
  h3,
  h4 {
    font-family: "Syne", sans-serif;
    font-weight: 700;
    color: var(--text-primary);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 1.35rem;
  }
  h3 {
    font-size: 1.1rem;
  }

  p,
  li {
    font-family: "Source Serif 4", serif;
    font-size: 1rem;
    line-height: 1.85;
    color: var(--text-secondary);
  }

  a {
    color: var(--link);
    text-decoration: none;
    &:hover {
      color: var(--link-hover);
      text-decoration: underline;
    }
  }

  code {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.85em;
    background: var(--bg-tertiary);
    border-radius: 4px;
    padding: 1px 5px;
  }

  pre {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 20px;
    overflow-x: auto;
    margin: 1.5rem 0;

    code {
      background: none;
      padding: 0;
      border-radius: 0;
      font-size: 0.875rem;
    }
  }

  blockquote {
    border-left: 3px solid var(--accent);
    padding-left: 1.25rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: var(--text-secondary);
  }

  img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
}
```

---

## 8. 데이터 관리 방식

### 핵심 원칙

모든 콘텐츠는 `_data/*.yml` 또는 `_posts/*.md` 파일로 관리. 코드(`_includes/`, `_layouts/`) 는 건드리지 않고 데이터 파일만 수정하여 사이트를 업데이트한다.

### `_data/config.yml` (전체 예시)

```yaml
# 기본 정보
name: "홍길동"
name_en: "Gildong Hong"
my_name: "Gildong Hong" # 논문 저자 목록에서 볼드 처리 기준값
position: "PhD Student"
affiliation: "Seoul National University"

# 타이핑 애니메이션
research_interests:
  - "Large Language Models"
  - "Multimodal Learning"
  - "AI Alignment"

# 소개 (HTML 가능)
bio: >
  I am a PhD student at ... My research focuses on ...

# 소셜 링크
social:
  - label: "Google Scholar"
    icon: "graduation-cap"
    url: "https://scholar.google.com/citations?user=..."
    external: true
  - label: "GitHub"
    icon: "github"
    url: "https://github.com/username"
    external: true
  - label: "X"
    icon: "twitter"
    url: "https://x.com/username"
    external: true
  - label: "CV"
    icon: "file-text"
    url: "/assets/img/cv.pdf"
    external: true
  - label: "Email"
    icon: "mail"
    url: "mailto:user@snu.ac.kr"
    external: false

# 사이트 설정
accent_color: "#7c3aed"
```

### `_config.yml` (Jekyll 전체 설정)

```yaml
title: "Gildong Hong"
description: "PhD Student at Seoul National University"
url: "https://username.github.io"
baseurl: ""

# 빌드 설정
markdown: kramdown
highlighter: rouge
permalink: /blog/:year/:month/:day/:slug/

# 플러그인 (GitHub Pages 허용 목록)
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap

# 사이트맵에서 secret 포스트 제외
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      sitemap: true
  - scope:
      path: "_posts"
      type: "posts"
    values:
      layout: "post"

# kramdown 설정
kramdown:
  input: GFM
  hard_wrap: false
  syntax_highlighter: rouge

# 제외 파일
exclude:
  - Gemfile
  - Gemfile.lock
  - README.md
  - "*.sh"
```

### Blog 포스트 Frontmatter (완전한 예시)

**일반 포스트:**

```yaml
---
layout: post
title: "Why Attention Mechanisms Work"
category: research # "research" | "life"
date: 2024-11-01
tldr: "Attention is powerful because it allows dynamic context aggregation."
keywords: [transformer, attention, nlp]
secret: false
---
```

**Secret 포스트:**

```yaml
---
layout: post
title: "My Private Thoughts on Research"
category: research
date: 2024-10-15
tldr: ""
keywords: []
secret: true
slug: my-secret-thoughts # 이 값이 URL이 됨: /blog/.../my-secret-thoughts/
---
```

> Secret 포스트는 `secret: true` 이면 Blog 목록에서 `where_exp: "post", "post.secret != true"` 필터로 제외된다. URL 직접 입력 시 접근 가능.

---

## 9. 인터랙션 & 애니메이션

Jekyll은 빌드 시 정적 HTML을 생성하므로, 모든 애니메이션은 **CSS + Vanilla JS** 로 구현.

### 9.1 타이핑 애니메이션 (`assets/js/typewriter.js`)

```javascript
(function () {
  var el = document.getElementById("typewriter");
  if (!el || !window.RESEARCH_INTERESTS) return;

  var texts = window.RESEARCH_INTERESTS;
  var idx = 0,
    charIdx = 0,
    isDeleting = false;
  var TYPE_SPEED = 60,
    DELETE_SPEED = 40;
  var PAUSE_AFTER_TYPE = 1500,
    PAUSE_AFTER_DELETE = 500;

  function tick() {
    var current = texts[idx];
    if (isDeleting) {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        isDeleting = false;
        idx = (idx + 1) % texts.length;
        setTimeout(tick, PAUSE_AFTER_DELETE);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    } else {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        isDeleting = true;
        setTimeout(tick, PAUSE_AFTER_TYPE);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    }
  }

  // prefers-reduced-motion 대응
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = texts[0];
    return;
  }

  tick();
})();
```

커서 CSS:

```css
.cursor {
  display: inline-block;
  color: var(--accent);
  animation: blink 0.8s step-end infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
```

### 9.2 다크/라이트 토글 (`assets/js/theme.js`)

```javascript
(function () {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    btn.setAttribute("aria-label", theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
    // 아이콘 교체
    document.getElementById("icon-moon").style.display = theme === "dark" ? "none" : "block";
    document.getElementById("icon-sun").style.display = theme === "dark" ? "block" : "none";
  }

  btn.addEventListener("click", function () {
    var current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });

  // 초기 아이콘 설정
  setTheme(document.documentElement.getAttribute("data-theme") || "dark");
})();
```

### 9.3 스크롤 진입 애니메이션

JavaScript 없이 CSS만으로 구현 (Jekyll 환경 단순성 유지):

```css
/* 섹션 fade-in: 스크롤 위치에 따라 CSS만으로는 제한적이므로,
   Intersection Observer를 활용한 가벼운 JS로 구현 */
.fade-in {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-in.visible {
  opacity: 1;
  transform: none;
}
```

```javascript
// assets/js/main.js 에 포함
var observer = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".fade-in").forEach(function (el) {
  observer.observe(el);
});
```

각 섹션 `<section>` 태그에 `.fade-in` 클래스 추가.

---

## 10. 반응형 브레이크포인트

| 브레이크포인트 | 너비            | 주요 변화                                                  |
| -------------- | --------------- | ---------------------------------------------------------- |
| 모바일         | `< 640px`       | About Me: 세로 배치 (사진 위, 소개 아래), Vitae: 단일 컬럼 |
| 태블릿         | `640px – 860px` | 타임라인 양방향 유지, 카드 패딩 조정                       |
| 데스크탑       | `> 860px`       | 전체 레이아웃, max-width 860px 중앙 정렬                   |

네비게이션 모바일 처리:

- 640px 미만에서 링크를 숨기고 햄버거 버튼 표시
- 햄버거 클릭 시 드롭다운 메뉴 토글 (CSS + 인라인 JS)

---

## 11. 접근성 & SEO

### 접근성

- 모든 `<img>`에 `alt` 필수
- 네비게이션: `<nav aria-label="main navigation">`
- 토글 버튼: `aria-label` 동적 변경 (테마 전환 시)
- 색상 대비: WCAG AA 기준 충족 (`--text-primary` on `--bg-primary` 최소 4.5:1)
- `focus-visible` 스타일 전역 적용:

  ```css
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  ```

- `prefers-reduced-motion`: 타이핑 애니메이션 정지, 전환 효과 제거

### SEO

`jekyll-seo-tag` 플러그인 + `_config.yml` 설정으로 자동 처리:

- `<title>`, `<meta description>`, Open Graph 태그, Twitter Card 자동 생성
- Secret 포스트: `<meta name="robots" content="noindex, nofollow">`
- `jekyll-sitemap`: sitemap.xml 자동 생성 (secret 포스트는 frontmatter에 `sitemap: false` 추가)

---

## 12. 블로그 포스트 작성 워크플로

### 일반 포스트

1. `_posts/YYYY-MM-DD-post-slug.md` 파일 생성
2. frontmatter 작성 (위 8절 예시 참고)
3. 본문 Markdown으로 작성
4. git commit & push → GitHub Pages 자동 빌드 (1~3분 소요)

### Secret 포스트

1. `_posts/YYYY-MM-DD-SECRET_TITLE.md` 파일 생성
2. frontmatter에 `secret: true` 설정
3. `slug:` 필드에 접근 URL로 사용할 slug 명시 (예: `slug: my-private-note`)
4. push 후 접근: `https://username.github.io/blog/YYYY/MM/DD/my-private-note/`
5. Blog 목록에는 노출되지 않음. URL 공유 시에만 접근 가능.

### 로컬 개발 환경 (선택사항)

```bash
# Ruby, Bundler 설치 후
bundle install
bundle exec jekyll serve
# → http://localhost:4000 에서 미리보기

```

---

_이 기획서의 모든 색상값, 폰트, 애니메이션 수치는_ `_data/config.yml` _및_ `_sass/_variables.scss` _수정만으로 커스터마이징 가능하도록 설계되었습니다._
