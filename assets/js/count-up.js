window.FCUCountUp = (() => {
  const animate = (element, target, options = {}) => {
    if (!element) return;

    const value = Number(target);
    const duration = options.duration || 950;
    const numberFormat = new Intl.NumberFormat(options.locale || "zh-TW");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!Number.isFinite(value)) {
      element.textContent = "0";
      return;
    }

    if (reducedMotion) {
      element.textContent = numberFormat.format(value);
      return;
    }

    const startTime = performance.now();
    const updateCount = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      element.textContent = numberFormat.format(Math.round(value * easedProgress));
      if (progress < 1) window.requestAnimationFrame(updateCount);
    };

    element.textContent = "0";
    window.requestAnimationFrame(updateCount);
  };

  return { animate };
})();
