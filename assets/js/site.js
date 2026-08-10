document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page;
  const footerNavigationGroups = [...document.querySelectorAll(".footer-nav-group")];
  const compactFooterQuery = window.matchMedia("(max-width: 1024px)");

  const syncFooterNavigation = () => {
    footerNavigationGroups.forEach((group) => {
      group.open = !compactFooterQuery.matches;
    });
  };

  footerNavigationGroups.forEach((group) => {
    group.addEventListener("toggle", () => {
      if (!compactFooterQuery.matches || !group.open) return;
      footerNavigationGroups.forEach((otherGroup) => {
        if (otherGroup !== group) otherGroup.open = false;
      });
    });
  });

  syncFooterNavigation();
  compactFooterQuery.addEventListener("change", syncFooterNavigation);

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

  if (!currentPage) return;

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
