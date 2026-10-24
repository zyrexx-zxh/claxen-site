# CLAXEN website

A multi-page, static website: a home page and one landing page for each service.
No frameworks and no dependencies. It is plain HTML, CSS and a little JavaScript, so it is fast and easy for Google to read.

```
dist/       the finished site. Upload this folder to your host.
preview/    the same site with links that work when you double-click preview/index.html on your computer.
src/        the source: site.js (all copy and links), pages/, lib/, assets/ (css, js, fonts, images)
tools/      build.js, audit.js, set-domain.js, make-images.js
```

## 1. Put it online

Upload the contents of `dist/` to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, or any web server).
Every page lives in its own folder (`/website-development/`), so the URLs are clean and need no server settings.

## 2. Set your real domain (important for SEO)

The site is built with the placeholder `https://your-domain.example`. Replace it once you know your address:

```
node tools/set-domain.js https://www.yourdomain.com
```

This updates the canonical links, sitemap, robots.txt, social-share tags, structured data and llms.txt in `dist/`, and remembers the domain for future builds.
Then submit `https://www.yourdomain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## 3. Change the text, then rebuild

All names, links, prices, service copy and FAQ answers are in `src/site.js`. Home page sections are in `src/pages/home.js`.

```
node tools/build.js      # rebuilds dist/ and preview/
node tools/audit.js      # checks titles, descriptions, headings, links, schema, sitemap
node tools/make-images.js  # redraws the social-share images and icons (needs Playwright)
```

Needs only Node 18 or newer. There is nothing to install.

## What is inside

- Home page: animated loop of the four services, services as stacking cards, three live demos (Telegram bot, terminal, text tool), process, budget slider, FAQ and a brief builder that writes your message.
- Four service pages with their own copy, FAQ, breadcrumbs and structured data.
- Command menu (Ctrl or Cmd + K, or press /), light and blue themes with a circular reveal, kinetic type.
- SEO: unique titles and descriptions, canonical links, Open Graph and Twitter cards with images, JSON-LD (WebSite, Person, ProfessionalService, Service, FAQPage, BreadcrumbList), sitemap.xml, robots.txt, llms.txt, web manifest, favicons.
- Accessibility and performance: semantic HTML, skip link, keyboard-friendly, reduced-motion support, self-hosted fonts, no third-party requests, no layout shift.

## Things to check before launch

- The process steps, FAQ answers, ownership wording and the pricing guide on the slider are drafts written for you. Edit them so they match how you really work.
- The contact section shows a clock in IST. Remove the `data-clock` line in `src/pages/home.js` if you do not want it.
- There are no testimonials, client logos or statistics on purpose. Add real ones when you have them.
