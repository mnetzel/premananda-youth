import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const pages = JSON.parse(fs.readFileSync(path.join(root, ".migration/pages.json"), "utf8"));
const posts = JSON.parse(fs.readFileSync(path.join(root, ".migration/posts.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(root, ".migration/categories.json"), "utf8"));
const media = JSON.parse(fs.readFileSync(path.join(root, ".migration/media.json"), "utf8"));

const SITE = {
  title: "Premananda Youth",
  description: "International group of young people, connected through spirituality!",
  email: "international@premananda-youth.org",
  url: "https://premananda-youth.org",
};

const pageBySlug = Object.fromEntries(pages.map((page) => [page.slug, page]));
const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]));

function decode(value = "") {
  return value
    .replaceAll("&#8230;", "…")
    .replaceAll("&#8211;", "–")
    .replaceAll("&#8217;", "’")
    .replaceAll("&#8220;", "“")
    .replaceAll("&#8221;", "”")
    .replaceAll("&#038;", "&")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ");
}

function escapeHtml(value = "") {
  return decode(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripHtml(value = "") {
  return decode(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function excerpt(value, length = 175) {
  const text = stripHtml(value);
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

function mediaMap() {
  const result = new Map();
  for (const item of media) {
    const local = `/uploads/${item.media_details.file}`;
    result.set(item.source_url, local);
    for (const size of Object.values(item.media_details.sizes || {})) {
      if (size.source_url) result.set(size.source_url, local);
    }
  }
  return result;
}

const mediaUrls = mediaMap();

function cleanWordpressHtml(html = "") {
  let cleaned = decode(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+srcset="[^"]*"/gi, "")
    .replace(/\s+sizes="[^"]*"/gi, "")
    .replace(/\s+loading="[^"]*"/gi, "")
    .replace(/\s+decoding="[^"]*"/gi, "");

  for (const [remote, local] of mediaUrls) cleaned = cleaned.replaceAll(remote, local);
  cleaned = cleaned.replaceAll("http://premananda-youth.org", "");
  cleaned = cleaned.replaceAll("https://premananda-youth.org", "");
  return cleaned;
}

function formMarkup(kind) {
  const membership = kind === "membership";
  const fields = membership
    ? [
        ["Spiritual name", "spiritual-name", "text", false],
        ["First name", "first-name", "text", true],
        ["Last name", "last-name", "text", true],
        ["Date of birth", "birth-date", "date", true],
        ["Full address", "address", "text", false],
        ["Country", "country", "text", true],
        ["Email", "email", "email", true],
        ["Phone number", "phone", "tel", false],
        ["Skype name", "skype", "text", false],
      ]
    : [
        ["Spiritual name", "spiritual-name", "text", false],
        ["First name", "first-name", "text", true],
        ["Last name", "last-name", "text", true],
        ["Date of birth", "birth-date", "date", true],
        ["Country", "country", "text", true],
        ["Email", "email", "email", true],
        ["Address (to send physical card)", "address", "text", false],
      ];

  const subject = membership ? "New Premananda Youth member" : "Premananda Youth membership card";
  return `
    <form class="email-form" data-email-form data-subject="${subject}">
      <div class="form-grid">
        ${fields
          .map(
            ([label, name, type, required]) => `
              <label>${label}${required ? " *" : ""}
                <input type="${type}" name="${name}" ${required ? "required" : ""}>
              </label>`,
          )
          .join("")}
      </div>
      <label>${membership ? "Why do I join Premananda Youth?" : "Message"}
        <textarea name="message" rows="6"></textarea>
      </label>
      <div class="form-note">
        <strong>Please also send your photo to ${SITE.email}.</strong>
        The button opens a prepared message in your email application.
      </div>
      <button class="button" type="submit">Prepare email</button>
    </form>`;
}

function newsletterForm() {
  return `
    <form class="email-form compact-form" data-email-form data-subject="Premananda Youth Newsletter subscription">
      <label>Your name <input type="text" name="name" required></label>
      <label>Your email <input type="email" name="email" required></label>
      <button class="button" type="submit">Subscribe by email</button>
    </form>`;
}

function nav(current = "") {
  const item = (href, label, id) =>
    `<a href="${href}" ${current === id ? 'aria-current="page"' : ""}>${label}</a>`;
  return `
    <nav class="site-nav" aria-label="Main navigation">
      ${item("/", "Home", "home")}
      ${item("/news/", "News", "news")}
      ${item("/what-is-py/", "Experiences", "experiences")}
      ${item("/activities/", "Activities", "activities")}
      ${item("/newsletter/", "Newsletter", "newsletter")}
      ${item("/contact/", "Contact", "contact")}
    </nav>`;
}

function layout({ title, current, content, description = SITE.description, bodyClass = "" }) {
  const fullTitle = title === SITE.title ? title : `${title} · ${SITE.title}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#0c789e">
  <title>${escapeHtml(fullTitle)}</title>
  <link rel="icon" href="/uploads/2017/10/cropped-logo-1.png">
  <link rel="stylesheet" href="/assets/site.css">
  <script src="/assets/site.js" defer></script>
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="nav-shell">
      <a class="brand-small" href="/" aria-label="Premananda Youth home">
        <img src="/uploads/2017/10/cropped-logo-1.png" alt="">
        <span>Premananda Youth</span>
      </a>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="main-menu">Menu</button>
      <div id="main-menu">${nav(current)}</div>
    </div>
  </header>
  <main id="main">${content}</main>
  <footer class="site-footer">
    <div>
      <img src="/uploads/2017/10/new_logo_design.png" alt="Premananda Youth International">
      <p>${SITE.description}</p>
    </div>
    <div class="footer-links">
      <a href="/news/">News</a>
      <a href="/py-member-registration-form/">Become a member</a>
      <a href="/contact/">Contact</a>
      <a href="mailto:${SITE.email}">${SITE.email}</a>
    </div>
    <p class="copyright">© ${new Date().getFullYear()} International Premananda Youth</p>
  </footer>
</body>
</html>`;
}

function hero() {
  return `
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="hero-inner">
        <p class="eyebrow">Spirituality · Service · Friendship</p>
        <img class="hero-logo" src="/uploads/2017/10/new_logo_design.png" alt="Premananda Youth International">
        <h1>Growing together.<br><em>Serving with love.</em></h1>
        <p class="hero-copy">${SITE.description}</p>
        <div class="hero-actions">
          <a class="button" href="/py-member-registration-form/">Join Premananda Youth</a>
          <a class="text-link" href="/what-is-py/">Discover our story <span>→</span></a>
        </div>
      </div>
      <div class="hero-photo">
        <img src="/uploads/2017/10/IMG_1449.jpg" alt="Young people joining hands around a painted globe">
      </div>
    </section>`;
}

function postCard(post) {
  const featured = post._embedded?.["wp:featuredmedia"]?.[0];
  const image = featured ? mediaUrls.get(featured.source_url) : null;
  const cats = (post.categories || []).map((id) => categoryById[id]?.name).filter(Boolean);
  return `
    <article class="post-card">
      ${image ? `<a class="card-image" href="/${post.slug}/"><img src="${image}" alt="${escapeHtml(featured.alt_text || "")}"></a>` : ""}
      <div class="card-content">
        ${cats.length ? `<p class="card-meta">${escapeHtml(cats[0])}</p>` : ""}
        <h3><a href="/${post.slug}/">${decode(post.title.rendered)}</a></h3>
        <p>${escapeHtml(excerpt(post.excerpt?.rendered || post.content.rendered))}</p>
        <a class="text-link" href="/${post.slug}/">Read story <span>→</span></a>
      </div>
    </article>`;
}

function homePage() {
  const source = pageBySlug["welcome-to-the-premananda-youth-website"];
  return layout({
    title: SITE.title,
    current: "home",
    bodyClass: "home",
    content: `
      ${hero()}
      <section class="intro section">
        <div class="section-heading">
          <p class="eyebrow">Who we are</p>
          <h2>A worldwide youth family with a shared purpose</h2>
        </div>
        <div class="intro-grid prose">${cleanWordpressHtml(source.content.rendered)}</div>
      </section>
      <section class="values-band">
        <div><span>01</span><h3>Spirituality</h3><p>Explore timeless values, meditation, yoga, devotional singing and meaningful discussion.</p></div>
        <div><span>02</span><h3>Service</h3><p>Turn kindness into action through projects that make a real difference for others.</p></div>
        <div><span>03</span><h3>Friendship</h3><p>Meet young people from many countries in a warm, respectful and joyful community.</p></div>
      </section>
      <section class="section stories">
        <div class="section-heading split-heading">
          <div><p class="eyebrow">Stories & teachings</p><h2>From our community</h2></div>
          <a class="text-link" href="/news/">View all stories <span>→</span></a>
        </div>
        <div class="card-grid">${posts.slice(0, 3).map(postCard).join("")}</div>
      </section>
      <section class="join-banner">
        <p class="eyebrow">There is a place for you here</p>
        <h2>Bring your energy, creativity and heart.</h2>
        <a class="button light" href="/py-member-registration-form/">Become a member</a>
      </section>`,
  });
}

function articlePage(post) {
  const title = decode(post.title.rendered);
  const date = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(post.date),
  );
  return layout({
    title,
    current: "news",
    description: excerpt(post.excerpt?.rendered || post.content.rendered),
    content: `
      <article class="article">
        <header class="page-hero compact">
          <p class="eyebrow">Premananda Youth story</p>
          <h1>${title}</h1>
          <p class="article-date">${date}</p>
        </header>
        <div class="article-shell">
          <div class="prose article-content">${cleanWordpressHtml(post.content.rendered)}</div>
          <aside class="article-aside">
            <p class="eyebrow">Keep exploring</p>
            <h2>More from our community</h2>
            ${posts
              .filter((item) => item.id !== post.id)
              .slice(0, 3)
              .map((item) => `<a href="/${item.slug}/">${decode(item.title.rendered)} <span>→</span></a>`)
              .join("")}
          </aside>
        </div>
      </article>`,
  });
}

function listingPage({ title, intro, filteredPosts = posts, current = "news", eyebrow = "Latest" }) {
  return layout({
    title,
    current,
    content: `
      <header class="page-hero">
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p>${intro}</p>
      </header>
      <section class="section">
        <div class="search-row">
          <label for="story-search">Search stories</label>
          <input id="story-search" type="search" placeholder="Type a word…" data-card-search>
        </div>
        <div class="card-grid" data-card-list>${filteredPosts.map(postCard).join("")}</div>
        <p class="no-results" data-no-results hidden>No stories match your search.</p>
      </section>`,
  });
}

function simplePage({ title, slug, current, eyebrow = "Premananda Youth", extra = "" }) {
  const page = pageBySlug[slug];
  return layout({
    title,
    current,
    content: `
      <header class="page-hero compact">
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
      </header>
      <section class="section narrow">
        <div class="prose">${cleanWordpressHtml(page?.content?.rendered || "")}${extra}</div>
      </section>`,
  });
}

function writePage(route, html) {
  const directory = route ? path.join(output, route) : output;
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "index.html"), html);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.cpSync(path.join(root, "public"), output, { recursive: true });

writePage("", homePage());
writePage(
  "news",
  listingPage({
    title: "News & stories",
    intro: "Teachings, experiences and service projects shared by the Premananda Youth community.",
  }),
);
writePage(
  "activities",
  listingPage({
    title: "Activities",
    intro: "See how Premananda Youth groups turn spiritual values into joyful, practical service.",
    filteredPosts: posts.filter((post) => post.categories.some((id) => [8, 10].includes(id))),
    current: "activities",
    eyebrow: "Service in action",
  }),
);
writePage(
  "what-is-py",
  simplePage({
    title: "A satsang for the youth",
    slug: "what-is-py",
    current: "experiences",
    eyebrow: "Words from Swami Premananda",
  }),
);
writePage(
  "newsletter",
  simplePage({
    title: "Youth Newsletter",
    slug: "newsletter",
    current: "newsletter",
    eyebrow: "Stay connected",
    extra: newsletterForm(),
  }),
);
writePage(
  "contact",
  simplePage({
    title: "Contact",
    slug: "contact",
    current: "contact",
    eyebrow: "Around the world",
    extra: `<div class="contact-callout"><h2>Write to the international coordinators</h2><a class="button" href="mailto:${SITE.email}">${SITE.email}</a></div>`,
  }),
);
writePage(
  "py-member-registration-form",
  simplePage({
    title: "Become a member",
    slug: "py-member-registration-form",
    current: "contact",
    eyebrow: "Welcome to the family",
    extra: formMarkup("membership"),
  }),
);
writePage(
  "new-member-form",
  simplePage({
    title: "Become a member",
    slug: "py-member-registration-form",
    current: "contact",
    eyebrow: "Welcome to the family",
    extra: formMarkup("membership"),
  }),
);
writePage(
  "py-membership-card-form",
  simplePage({
    title: "Membership card",
    slug: "py-membership-card-form",
    current: "home",
    eyebrow: "Premananda Youth",
    extra: formMarkup("card"),
  }),
);
writePage(
  "registration-confirmation-page",
  simplePage({
    title: "Thank you",
    slug: "registration-confirmation-page",
    current: "contact",
  }),
);

for (const post of posts) writePage(post.slug, articlePage(post));

for (const category of categories.filter((item) => item.count > 0)) {
  const categoryPosts = posts.filter((post) => post.categories.includes(category.id));
  const route =
    category.slug === "https-premananda-youth-org-activities"
      ? "category/https-premananda-youth-org-activities"
      : category.slug === "seva"
        ? "category/https-premananda-youth-org-activities/seva"
        : `category/${category.slug}`;
  writePage(
    route,
    listingPage({
      title: category.name,
      intro: `Stories filed under ${category.name}.`,
      filteredPosts: categoryPosts,
      current: category.id === 8 || category.id === 10 ? "activities" : "experiences",
      eyebrow: "Category",
    }),
  );
}

fs.writeFileSync(path.join(output, "CNAME"), "premananda-youth.org\n");
fs.writeFileSync(
  path.join(output, "404.html"),
  layout({
    title: "Page not found",
    content: `<section class="page-hero"><p class="eyebrow">404</p><h1>This page wandered off.</h1><p>Let’s bring you back to the community.</p><a class="button" href="/">Go to the homepage</a></section>`,
  }),
);

console.log(`Built ${posts.length + pages.length + categories.filter((item) => item.count > 0).length + 5} pages in dist/`);
