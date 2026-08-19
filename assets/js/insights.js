document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("insightList");
  if (!list) return;

  const categoryLinks = [...document.querySelectorAll("[data-insight-category]")];
  const form = document.getElementById("insightSearchForm");
  const keywordInput = document.getElementById("insightKeyword");
  const title = document.getElementById("insightResultTitle");
  const description = document.getElementById("insightResultDescription");
  const count = document.getElementById("insightResultCount");
  const pagination = document.getElementById("insightPagination");
  const empty = document.getElementById("insightEmpty");
  const emptyReset = document.getElementById("insightEmptyReset");
  const viewButtons = [...document.querySelectorAll("[data-insight-view]")];
  const categories = ["智慧製造", "AI 應用", "數位轉型", "永續製造", "政策資源"];
  const pageSize = 6;
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get("category") || "";
  const category = categories.includes(requestedCategory) ? requestedCategory : "";
  const keyword = (params.get("q") || "").trim();
  const requestedPage = Number.parseInt(params.get("page"), 10);
  let savedView;
  try {
    savedView = window.localStorage.getItem("fcu-insight-view");
  } catch (error) {
    console.warn("Unable to read insight view preference:", error);
  }
  let currentView = savedView === "list" ? "list" : "grid";

  const applyView = (view) => {
    currentView = view === "list" ? "list" : "grid";
    list.classList.toggle("is-list-view", currentView === "list");
    viewButtons.forEach((button) => {
      const isActive = button.dataset.insightView === currentView;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    try {
      window.localStorage.setItem("fcu-insight-view", currentView);
    } catch (error) {
      console.warn("Unable to save insight view preference:", error);
    }
  };

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => applyView(button.dataset.insightView));
  });
  applyView(currentView);

  const buildUrl = (overrides = {}) => {
    const next = new URLSearchParams();
    const values = {
      category,
      q: keyword,
      page: "",
      ...overrides
    };
    if (values.category) next.set("category", values.category);
    if (values.q) next.set("q", values.q);
    if (values.page && values.page > 1) next.set("page", values.page);
    const query = next.toString();
    return `insights.html${query ? `?${query}` : ""}`;
  };

  if (requestedCategory && !category) {
    window.history.replaceState({}, "", buildUrl({ category: "" }));
  }
  keywordInput.value = keyword;
  categoryLinks.forEach((link) => {
    const isActive = link.dataset.insightCategory === category;
    link.parentElement.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    link.href = buildUrl({ category: link.dataset.insightCategory, page: "" });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = buildUrl({ q: keywordInput.value.trim(), page: "" });
  });

  let items = [];
  try {
    const response = await fetch("../data/insights.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    items = Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    console.error("Unable to load insights:", error);
    empty.hidden = false;
    empty.querySelector("h2").textContent = "資料載入失敗";
    empty.querySelector("p").textContent = "請確認目前透過本地 HTTP server 瀏覽，再重新整理頁面。";
    return;
  }

  const normalizedKeyword = keyword.toLocaleLowerCase("zh-Hant");
  const filtered = items
    .filter((item) => !category || item.category === category)
    .filter((item) => {
      if (!normalizedKeyword) return true;
      return [
        item.title,
        item.summary,
        item.category,
        ...(item.tags || []),
        ...(item.sections || []).flatMap((section) => [section.heading, ...(section.paragraphs || [])])
      ].join(" ").toLocaleLowerCase("zh-Hant").includes(normalizedKeyword);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Number.isInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;
  if ((params.has("page") && requestedPage !== page) || (!Number.isInteger(requestedPage) && params.has("page"))) {
    window.history.replaceState({}, "", buildUrl({ page }));
  }

  const categoryLabel = category || "全部文章";
  title.textContent = keyword ? `${categoryLabel}：${keyword}` : categoryLabel;
  description.textContent = keyword
    ? `顯示標題、摘要、標籤或內文包含「${keyword}」的文章。`
    : category
      ? `瀏覽「${category}」主題的趨勢文章。`
      : "掌握智慧製造、數位轉型與永續發展的產業觀點。";
  count.textContent = `共 ${filtered.length} 篇`;

  const currentItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const cards = currentItems.map((item) => {
    const article = document.createElement("article");
    article.className = "site-card insight-card";

    const coverLink = document.createElement("a");
    coverLink.className = "insight-card-cover site-ratio-16x9 site-cover-blur";
    coverLink.href = `insight-detail.html?id=${encodeURIComponent(item.id)}`;
    coverLink.setAttribute("aria-label", `閱讀：${item.title}`);
    coverLink.style.setProperty("--bg-url", `url('${item.cover}')`);
    const image = document.createElement("img");
    image.src = item.cover;
    image.alt = item.coverAlt || "";
    image.loading = "lazy";
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "insight-card-category";
    categoryBadge.textContent = item.category;
    coverLink.append(image, categoryBadge);

    const body = document.createElement("div");
    body.className = "insight-card-body";
    const meta = document.createElement("div");
    meta.className = "insight-card-meta";
    const time = document.createElement("time");
    time.dateTime = item.publishedAt;
    time.textContent = item.publishedAt.replaceAll("-", ".");
    meta.append(time);
    const heading = document.createElement("h2");
    const headingLink = document.createElement("a");
    headingLink.href = `insight-detail.html?id=${encodeURIComponent(item.id)}`;
    headingLink.textContent = item.title;
    heading.append(headingLink);
    const summary = document.createElement("p");
    summary.className = "insight-card-summary";
    summary.textContent = item.summary;

    const footer = document.createElement("div");
    footer.className = "insight-card-footer";
    const tags = document.createElement("div");
    tags.className = "insight-tags";
    (item.tags || []).slice(0, 2).forEach((value) => {
      const tag = document.createElement("button");
      tag.className = "insight-tag";
      tag.type = "button";
      tag.textContent = `#${value}`;
      tag.setAttribute("aria-label", `搜尋標籤：${value}`);
      tag.addEventListener("click", () => {
        window.location.href = buildUrl({ q: value, page: "" });
      });
      tags.append(tag);
    });
    const more = document.createElement("a");
    more.className = "site-more insight-more";
    more.href = `insight-detail.html?id=${encodeURIComponent(item.id)}`;
    const moreText = document.createElement("span");
    moreText.textContent = "閱讀全文";
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("width", "15");
    arrow.setAttribute("height", "10");
    arrow.setAttribute("viewBox", "0 0 13 10");
    arrow.setAttribute("aria-hidden", "true");
    const arrowLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowLine.setAttribute("d", "M1,5 L11,5");
    const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    arrowHead.setAttribute("points", "8 1 12 5 8 9");
    arrow.append(arrowLine, arrowHead);
    more.append(moreText, arrow);
    footer.append(tags, more);
    body.append(meta, heading, summary, footer);
    article.append(coverLink, body);
    return article;
  });
  list.replaceChildren(...cards);

  empty.hidden = filtered.length > 0;
  list.hidden = filtered.length === 0;
  pagination.hidden = filtered.length === 0;
  emptyReset.href = "insights.html";

  if (filtered.length > 0) {
    const links = [];
    for (let number = 1; number <= totalPages; number += 1) {
      const link = document.createElement("a");
      link.className = "site-page-link";
      link.href = buildUrl({ page: number });
      link.textContent = number;
      link.setAttribute("aria-label", `第 ${number} 頁`);
      if (number === page) {
        link.classList.add("is-current");
        link.setAttribute("aria-current", "page");
      }
      links.push(link);
    }
    pagination.replaceChildren(...links);
  }
});
