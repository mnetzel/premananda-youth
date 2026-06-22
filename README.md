# Premananda Youth

Static, dependency-free version of [premananda-youth.org](https://premananda-youth.org/), migrated from WordPress.

## Local preview

```bash
npm run build
npm run dev
```

Open <http://127.0.0.1:4173>.

## Content

- WordPress export data is stored in `.migration/`.
- Original media is stored in `public/uploads/`.
- `npm run build` creates the complete static site in `dist/`.
- Membership and newsletter forms prepare an email to `international@premananda-youth.org`; no backend or database is required.

## Deployment

The GitHub Actions workflow publishes `dist/` to GitHub Pages on every push to `main` or `master`. The generated site includes a `CNAME` file for `premananda-youth.org`.

Before switching the domain, enable GitHub Pages in the repository settings with **GitHub Actions** as the source. Then update the domain's DNS records according to GitHub's current custom-domain instructions.
