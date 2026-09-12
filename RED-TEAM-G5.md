# MEDX G5 — RED TEAM / LAUNCH GATE

Date: 2026-09-12

## Scope

Adversarial launch review of the current public MEDX web surface for «Поза Шумом».

## Findings

### Domain / transport
- PASS — https://pozashumom.com/ is the canonical root.
- PASS — https://www.pozashumom.com/ resolves to the canonical apex.
- PASS — http://pozashumom.com/ upgrades to HTTPS.
- PASS — http://www.pozashumom.com/ upgrades and canonicalizes to the HTTPS apex.
- PASS — GitHub Pages DNS validation completed.
- PASS — HTTPS enforcement enabled.

### Rendering / UX
- PASS — desktop live visual QA.
- PASS — mobile live visual QA.
- PASS — no visible horizontal overflow/clipping in supplied mobile frames.
- PASS — canonical DEC-017 logo/visual system renders correctly.

### Routing
- PASS — /instagram
- PASS — /threads
- PASS — /facebook
- PASS — /youtube
- PASS — /tiktok
- PASS — /telegram
All six source routes resolve to the canonical landing without 404 errors.

### SEO / sharing
- PASS — canonical URL.
- PASS — OpenGraph title/description/image.
- PASS — Twitter summary_large_image card.
- PASS — robots.txt.
- PASS — sitemap.xml.
- PASS — unknown route returns 404.

### Outbound destinations
Root landing exposes only the approved six public platform destinations:
Telegram, YouTube, Instagram, TikTok, Threads, Facebook.

### Repository hygiene
- PASS — no matches found for contact mailbox, system Gmail, API_KEY, SECRET, TOKEN, password, Cloudflare, wrangler, or retired slogan strings in the public repo.
- PASS — contact mailbox is not published in production source.

### Platform rollout
- PASS — Instagram branded link installed and verified.
- PASS — Threads branded link installed and verified.
- PASS — Facebook branded link installed and verified.
- PASS — YouTube branded link installed and verified.
- DEFERRED BY OWNER — TikTok placement; current profile editor exposes no dedicated website field.
- DEFERRED BY OWNER — Telegram placement; current channel settings expose no dedicated website field.
- DEFERRED BY OWNER — contact mailbox hardening/publication; mailbox stays non-public and /contact stays outside current public launch scope.

## Residual risk

Current static GitHub Pages v1 has no forms, login, payments, or PII collection. Custom application response-security headers are not configured in the repository. This is accepted as a low-risk residual item for the current static launch and must be re-audited before any dynamic functionality is introduced.

## Verdict

**PASS WITH DOCUMENTED DEFERRED ITEMS.**

No critical blocker found for the current public landing and the four supported/approved platform profile links.
