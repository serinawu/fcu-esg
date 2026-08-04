document.addEventListener("DOMContentLoaded", () => {
  const unavailablePages = new Set([
    "insights.html",
    "insight-detail.html",
    "training.html",
    "videos.html",
    "contact.html",
    "privacy.html"
  ]);

  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const page = url.pathname.split("/").pop();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const isHomepageCourseDetail = currentPage === "index.html" && page === "training-detail.html";
    if (!unavailablePages.has(page) && !isHomepageCourseDetail) return;

    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    link.setAttribute("title", "此頁面尚未開放");
    link.classList.add("is-unavailable");
  });
});
