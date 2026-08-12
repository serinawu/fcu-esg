document.addEventListener("DOMContentLoaded", () => {
  const modalElement = document.getElementById("videoModal");
  const triggers = document.querySelectorAll("[data-home-video]");
  if (!modalElement || !triggers.length) return;

  const modalTitle = document.getElementById("videoModalTitle");
  const modalMeta = document.getElementById("videoModalMeta");
  const modalSummary = document.getElementById("videoModalSummary");
  const player = document.getElementById("videoPlayer");
  const externalLink = document.getElementById("videoExternalLink");
  let modal = null;
  let activeTrigger = null;

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const data = trigger.dataset;
      activeTrigger = trigger;
      modalTitle.textContent = data.videoTitle;
      modalMeta.textContent = `${data.videoSeries}｜${data.videoDate.replaceAll("-", ".")}｜${data.videoDuration}`;
      modalSummary.textContent = data.videoSummary;
      externalLink.href = data.videoExternal;
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(data.videoId)}?autoplay=1&rel=0`;
      iframe.title = data.videoTitle;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      player.replaceChildren(iframe);
      modal = modal || new bootstrap.Modal(modalElement);
      modal.show();
    });
  });

  modalElement.addEventListener("hidden.bs.modal", () => {
    player.replaceChildren();
    if (activeTrigger && document.contains(activeTrigger)) activeTrigger.focus();
    activeTrigger = null;
  });
});
