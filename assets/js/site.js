document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page;

  if (currentPage) {
    document.querySelectorAll(`[data-nav="${currentPage}"]`).forEach((link) => {
      link.classList.add("is-active");
    });

    document.querySelectorAll(`[data-nav-parent="${currentPage}"]`).forEach((link) => {
      link.classList.add("is-active");
    });
  }

  const drawerElement = document.getElementById("mobileNavDrawer");
  if (drawerElement && window.bootstrap) {
    drawerElement.querySelectorAll('a[href]:not([href="#"])').forEach((link) => {
      link.addEventListener("click", () => {
        window.bootstrap.Offcanvas.getOrCreateInstance(drawerElement).hide();
      });
    });
  }

  if (window.bootstrap?.Tooltip) {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      window.bootstrap.Tooltip.getOrCreateInstance(element);
    });
  }

  const backToTopButton = document.querySelector(".back-to-top");
  if (!backToTopButton) return;

  const toggleBackToTop = () => {
    backToTopButton.classList.toggle("is-visible", window.scrollY > 480);
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
