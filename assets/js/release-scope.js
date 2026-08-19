document.addEventListener("DOMContentLoaded", () => {
  const unavailablePages = new Set([
    "videos.html",
    "contact.html",
    "privacy.html"
  ]);

  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const page = url.pathname.split("/").pop();
    if (!unavailablePages.has(page)) return;

    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    link.setAttribute("title", "此頁面尚未開放");
    link.classList.add("is-unavailable");
  });
});
