const menuButton = document.querySelector(".menu-button");
const menu = document.querySelector("#main-menu");

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menu?.classList.toggle("open", !open);
});

document.querySelectorAll("[data-email-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const lines = [];
    for (const [key, value] of data.entries()) {
      if (String(value).trim()) {
        const label = key.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
        lines.push(`${label}: ${value}`);
      }
    }
    const subject = form.dataset.subject || "Message from Premananda Youth website";
    window.location.href = `mailto:international@premananda-youth.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n\n"))}`;
  });
});

const search = document.querySelector("[data-card-search]");
const cards = [...document.querySelectorAll("[data-card-list] .post-card")];
const noResults = document.querySelector("[data-no-results]");

search?.addEventListener("input", () => {
  const query = search.value.toLocaleLowerCase().trim();
  let visible = 0;
  cards.forEach((card) => {
    const match = card.textContent.toLocaleLowerCase().includes(query);
    card.hidden = !match;
    if (match) visible += 1;
  });
  if (noResults) noResults.hidden = visible !== 0;
});
