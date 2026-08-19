document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("videoList");
  if (!list) return;

  const seriesLinks = [...document.querySelectorAll("[data-video-series]")];
  const form = document.getElementById("videoSearchForm");
  const keywordInput = document.getElementById("videoKeyword");
  const title = document.getElementById("videoResultTitle");
  const description = document.getElementById("videoResultDescription");
  const count = document.getElementById("videoResultCount");
  const empty = document.getElementById("videoEmpty");
  const emptyReset = document.getElementById("videoEmptyReset");
  const modalElement = document.getElementById("videoModal");
  const modalTitle = document.getElementById("videoModalTitle");
  const modalMeta = document.getElementById("videoModalMeta");
  const modalSummary = document.getElementById("videoModalSummary");
  const player = document.getElementById("videoPlayer");
  const externalLink = document.getElementById("videoExternalLink");
  const seriesOptions = ["據點講堂", "技術新知", "產業趨勢", "活動紀實"];
  const params = new URLSearchParams(window.location.search);
  const requestedSeries = params.get("series") || "";
  const series = seriesOptions.includes(requestedSeries) ? requestedSeries : "";
  const keyword = (params.get("q") || "").trim();
  const requestedVideo = params.get("video") || "";
  let items = [];
  let modal = null;
  let activeTrigger = null;

  const buildUrl = (overrides = {}) => {
    const next = new URLSearchParams();
    const values = { series, q: keyword, video: "", ...overrides };
    if (values.series) next.set("series", values.series);
    if (values.q) next.set("q", values.q);
    if (values.video) next.set("video", values.video);
    const query = next.toString();
    return `videos.html${query ? `?${query}` : ""}`;
  };

  if (requestedSeries && !series) {
    window.history.replaceState({}, "", buildUrl({ series: "" }));
  }

  keywordInput.value = keyword;
  seriesLinks.forEach((link) => {
    const isActive = link.dataset.videoSeries === series;
    link.parentElement.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    link.href = buildUrl({ series: link.dataset.videoSeries, video: "" });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = buildUrl({ q: keywordInput.value.trim(), video: "" });
  });

  try {
    const response = await fetch("../data/videos.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    items = Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    console.error("Unable to load videos:", error);
    empty.hidden = false;
    empty.querySelector("h2").textContent = "資料載入失敗";
    empty.querySelector("p").textContent = "請確認目前透過本地 HTTP server 瀏覽，再重新整理頁面。";
    return;
  }

  const openVideo = (item, trigger = null, updateHistory = true) => {
    activeTrigger = trigger;
    modalTitle.textContent = item.title;
    modalMeta.textContent = `${item.series}｜${item.publishedAt.replaceAll("-", ".")}｜${item.duration}`;
    modalSummary.textContent = item.summary;
    externalLink.href = item.externalUrl;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(item.videoId)}?autoplay=1&rel=0`;
    iframe.title = item.title;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    player.replaceChildren(iframe);
    if (updateHistory) {
      window.history.pushState({}, "", buildUrl({ video: item.id }));
    }
    modal = modal || new bootstrap.Modal(modalElement);
    modal.show();
  };

  const normalizedKeyword = keyword.toLocaleLowerCase("zh-Hant");
  const filtered = items
    .filter((item) => !series || item.series === series)
    .filter((item) => {
      if (!normalizedKeyword) return true;
      return [
        item.title,
        item.summary,
        item.series,
        ...(item.tags || [])
      ].join(" ").toLocaleLowerCase("zh-Hant").includes(normalizedKeyword);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const seriesLabel = series || "全部影片";
  title.textContent = keyword ? `${seriesLabel}：${keyword}` : seriesLabel;
  description.textContent = keyword
    ? `顯示標題、摘要、系列或標籤包含「${keyword}」的影片。`
    : series
      ? `瀏覽「${series}」系列的主題影片。`
      : "透過主題影片掌握智慧製造、產業趨勢與人才培育成果。";
  count.textContent = `共 ${filtered.length} 部`;

  const cards = filtered.map((item) => {
    const article = document.createElement("article");
    article.className = "site-card video-card";

    const cover = document.createElement("button");
    cover.className = "video-cover";
    cover.type = "button";
    cover.dataset.accent = item.accent || "blue";
    cover.setAttribute("aria-label", `播放：${item.title}`);
    const thumbUrl = `https://img.youtube.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg`;
    const media = document.createElement("span");
    media.className = "video-cover-media";
    const thumb = document.createElement("img");
    thumb.src = thumbUrl;
    thumb.alt = "";
    thumb.loading = "lazy";
    media.append(thumb);
    const seriesBadge = document.createElement("span");
    seriesBadge.className = "video-cover-label";
    seriesBadge.textContent = item.series;
    const play = document.createElement("span");
    play.className = "video-play";
    play.setAttribute("aria-hidden", "true");
    const duration = document.createElement("span");
    duration.className = "video-duration";
    duration.textContent = item.duration;
    cover.append(media, seriesBadge, play, duration);
    cover.addEventListener("click", () => openVideo(item, cover));

    const body = document.createElement("div");
    body.className = "video-card-body";
    const meta = document.createElement("time");
    meta.className = "video-card-meta";
    meta.dateTime = item.publishedAt;
    meta.textContent = item.publishedAt.replaceAll("-", ".");
    const heading = document.createElement("h2");
    heading.className = "video-card-title";
    const titleButton = document.createElement("button");
    titleButton.className = "video-title-button";
    titleButton.type = "button";
    titleButton.textContent = item.title;
    titleButton.addEventListener("click", () => openVideo(item, titleButton));
    heading.append(titleButton);
    const summary = document.createElement("p");
    summary.className = "video-card-summary";
    summary.textContent = item.summary;
    const tags = document.createElement("div");
    tags.className = "video-tags";
    (item.tags || []).slice(0, 2).forEach((value) => {
      const tag = document.createElement("button");
      tag.className = "video-tag";
      tag.type = "button";
      tag.textContent = `#${value}`;
      tag.setAttribute("aria-label", `搜尋標籤：${value}`);
      tag.addEventListener("click", () => {
        window.location.href = buildUrl({ q: value, video: "" });
      });
      tags.append(tag);
    });
    body.append(meta, heading, summary, tags);
    article.append(cover, body);
    return article;
  });
  list.replaceChildren(...cards);

  empty.hidden = filtered.length > 0;
  list.hidden = filtered.length === 0;
  emptyReset.href = "videos.html";

  modalElement.addEventListener("hidden.bs.modal", () => {
    player.replaceChildren();
    if (new URLSearchParams(window.location.search).has("video")) {
      window.history.replaceState({}, "", buildUrl({ video: "" }));
    }
    if (activeTrigger && document.contains(activeTrigger)) activeTrigger.focus();
    activeTrigger = null;
  });

  window.addEventListener("popstate", () => {
    const videoId = new URLSearchParams(window.location.search).get("video");
    const item = items.find((candidate) => candidate.id === videoId);
    if (item) openVideo(item, null, false);
    else if (modal) modal.hide();
  });

  if (requestedVideo) {
    const initialItem = items.find((item) => item.id === requestedVideo);
    if (initialItem) openVideo(initialItem, null, false);
    else window.history.replaceState({}, "", buildUrl({ video: "" }));
  }
});
