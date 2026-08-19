document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("updateList");
  const emptyState = document.getElementById("updateEmptyState");
  const pagination = document.getElementById("updatePagination");
  const resultTitle = document.getElementById("updateResultTitle");
  const resultCount = document.getElementById("updateResultCount");
  const pageDescription = document.getElementById("updatePageDescription");
  const searchForm = document.getElementById("updateSearchForm");
  const keywordInput = document.getElementById("updateKeyword");
  const searchClear = document.getElementById("updateSearchClear");
  const emptyReset = document.getElementById("updateEmptyReset");
  const regionResults = document.getElementById("regionResults");

  let updates = [];
  let regionStatistics = [];
  try {
    const [updatesResponse, coursesResponse, regionsResponse] = await Promise.all([
      fetch("../data/updates.json"),
      fetch("../data/courses.json"),
      fetch("../data/region-statistics.json")
    ]);
    if (!updatesResponse.ok) throw new Error(`Updates HTTP ${updatesResponse.status}`);
    if (!coursesResponse.ok) throw new Error(`Courses HTTP ${coursesResponse.status}`);
    if (!regionsResponse.ok) throw new Error(`Regions HTTP ${regionsResponse.status}`);
    const [updatesPayload, coursesPayload, regionsPayload] = await Promise.all([
      updatesResponse.json(),
      coursesResponse.json(),
      regionsResponse.json()
    ]);
    const baseUpdates = Array.isArray(updatesPayload.items)
      ? updatesPayload.items.filter((item) => item.type !== "courses")
      : [];
    const openCourses = (coursesPayload.items || [])
      .filter((course) => course.isPublished && window.FCUCourseStatus.getStatus(course) === "open")
      .map((course) => ({
        id: course.id,
        type: "courses",
        publishedAt: course.publishedAt,
        title: course.title,
        summary: course.summary,
        cover: course.cover,
        regionCode: course.regionCode,
        extra: [
          course.provider,
          window.FCUCourseStatus.formatDateRange(course.courseStart, course.courseEnd),
          course.deliveryMode
        ],
        tags: course.tags,
        detailUrl: course.detailUrl,
        detail: course.detail,
        source: course.source
      }));
    updates = [...baseUpdates, ...openCourses];
    regionStatistics = Array.isArray(regionsPayload.regions) ? regionsPayload.regions : [];
  } catch (error) {
    list.closest(".news-panel").hidden = true;
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "資料載入失敗";
    emptyState.querySelector("p").textContent = "請確認目前透過本地 HTTP server 瀏覽，再重新整理頁面。";
    pagination.hidden = true;
    console.error("Unable to load updates:", error);
    return;
  }

  const categories = {
    all: { label: "全部動態", description: "依發布日期顯示所有據點動態。" },
    news: { label: "最新消息", description: "計畫公告、網站消息與產業資訊。" },
    jobs: { label: "廠商職缺", description: "中彰投機械與智慧自動化相關職缺。" },
    gallery: { label: "活動花絮", description: "課程、交流活動與成果紀錄。" },
    courses: { label: "課程招生", description: "近期開放報名的訓練課程。" }
  };
  const labels = { news: "最新消息", jobs: "廠商職缺", gallery: "活動花絮", courses: "課程招生" };
  const params = new URLSearchParams(window.location.search);
  const requestedRegion = params.get("region");
  const regionData = regionStatistics.find((item) => item.code === requestedRegion) || null;
  const region = regionData?.code || null;
  const regionCategories = new Set(["all", "jobs", "courses"]);
  const requestedCategory = params.get("category") || "all";
  const validCategory = Object.hasOwn(categories, requestedCategory) ? requestedCategory : "all";
  const category = region && !regionCategories.has(validCategory) ? "all" : validCategory;
  const requestedKeyword = params.get("q");
  const keyword = requestedKeyword?.trim() || "";
  const pageSize = 6;

  const normalizeSearchText = (value) => String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("zh-Hant")
    .replaceAll("臺", "台");
  const excludedSearchKeys = new Set(["src", "image", "sourceUrl", "applyUrl", "detailUrl"]);
  const collectSearchValues = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(collectSearchValues);
    if (typeof value === "object") {
      return Object.entries(value)
        .filter(([key]) => !excludedSearchKeys.has(key))
        .flatMap(([, nestedValue]) => collectSearchValues(nestedValue));
    }
    return [String(value)];
  };
  const keywordTerms = normalizeSearchText(keyword).split(/\s+/).filter(Boolean);
  const matchesKeyword = (item) => {
    if (keywordTerms.length === 0) return true;
    const haystack = normalizeSearchText(collectSearchValues(item).join(" "));
    return keywordTerms.every((term) => haystack.includes(term));
  };
  const categoryItems = updates
    .filter((item) => !region || (
      regionCategories.has(item.type)
      && item.type !== "all"
      && item.regionCode === region
    ))
    .filter((item) => category === "all" || item.type === category)
    .filter(matchesKeyword)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const totalPages = Math.max(1, Math.ceil(categoryItems.length / pageSize));
  const requestedPage = params.get("page");
  const parsedPage = Number.parseInt(requestedPage || "1", 10);
  const currentPage = Number.isFinite(parsedPage) ? Math.min(Math.max(parsedPage, 1), totalPages) : 1;
  const visibleItems = categoryItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const normalizedParams = new URLSearchParams();
  if (region) normalizedParams.set("region", region);
  if (category === "all") normalizedParams.delete("category");
  else normalizedParams.set("category", category);
  if (keyword) normalizedParams.set("q", keyword);
  else normalizedParams.delete("q");
  if (currentPage > 1) normalizedParams.set("page", String(currentPage));
  else normalizedParams.delete("page");
  const normalizedQuery = normalizedParams.toString();
  const normalizedUrl = normalizedQuery ? `update.html?${normalizedQuery}` : "update.html";
  if (
    requestedRegion !== region
    ||
    requestedCategory !== category
    || requestedKeyword !== (keyword || null)
    || requestedPage !== (currentPage > 1 ? String(currentPage) : null)
  ) {
    window.history.replaceState({}, "", normalizedUrl);
  }

  const categoryUrl = (targetCategory, page = 1, targetKeyword = keyword) => {
    const query = new URLSearchParams();
    const targetSupportsRegion = region && regionCategories.has(targetCategory);
    if (targetSupportsRegion) query.set("region", region);
    if (targetCategory !== "all") query.set("category", targetCategory);
    if (targetKeyword) query.set("q", targetKeyword);
    if (page > 1) query.set("page", String(page));
    const suffix = query.toString();
    return suffix ? `update.html?${suffix}` : "update.html";
  };

  document.querySelectorAll("[data-category-link]").forEach((link) => {
    const active = link.dataset.categoryLink === category;
    link.classList.toggle("is-active", active);
    const listItem = link.closest("li");
    if (listItem) listItem.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    link.href = categoryUrl(link.dataset.categoryLink);
  });
  document.querySelectorAll(".update-category-nav [data-category-link]").forEach((link) => {
    const categoryItem = link.closest("li");
    if (categoryItem) categoryItem.hidden = Boolean(region && !regionCategories.has(link.dataset.categoryLink));
  });
  const allCategoryLabel = document.querySelector("[data-category-label]");
  if (allCategoryLabel) allCategoryLabel.textContent = region ? "全部" : "全部動態";

  if (regionData) {
    regionResults.hidden = false;
    document.getElementById("regionResultsTitle").textContent = regionData.name;
    const period = document.getElementById("regionResultsPeriod");
    period.replaceChildren();
    const periodLabel = document.createTextNode(`${regionData.periodLabel}（統計截止日：`);
    const periodDate = document.createElement("time");
    periodDate.dateTime = regionData.statisticsAsOf;
    periodDate.textContent = regionData.statisticsAsOf.replaceAll("-", ".");
    period.append(periodLabel, periodDate, "）");
    window.FCUCountUp.animate(document.getElementById("regionCoursesCount"), regionData.statistics.courses);
    window.FCUCountUp.animate(document.getElementById("regionParticipantsCount"), regionData.statistics.participants);
    window.FCUCountUp.animate(document.getElementById("regionJobsCount"), regionData.statistics.jobs);
    document.getElementById("regionResultsNote").textContent = regionData.note;

    const breadcrumb = document.querySelector(".site-breadcrumb");
    const currentBreadcrumb = breadcrumb?.querySelector('[aria-current="page"]');
    if (breadcrumb && currentBreadcrumb) {
      currentBreadcrumb.removeAttribute("aria-current");
      const updatesBreadcrumbLink = document.createElement("a");
      updatesBreadcrumbLink.href = "update.html";
      updatesBreadcrumbLink.textContent = "據點動態";
      currentBreadcrumb.replaceChildren(updatesBreadcrumbLink);
      const regionBreadcrumb = document.createElement("li");
      regionBreadcrumb.setAttribute("aria-current", "page");
      regionBreadcrumb.textContent = regionData.name;
      breadcrumb.append(regionBreadcrumb);
    }
  }
  keywordInput.value = keyword;
  searchClear.hidden = !keyword;
  searchClear.href = categoryUrl(category, 1, "");
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = categoryUrl(category, 1, keywordInput.value.trim());
  });
  const categoryLabel = region && category === "all" ? "目前公開內容" : categories[category].label;
  resultTitle.textContent = region ? `${regionData.name}${categoryLabel}` : categories[category].label;
  resultCount.textContent = `共 ${categoryItems.length} 筆`;
  pageDescription.textContent = keyword
    ? `在${region ? `${regionData.name}的` : ""}${categoryLabel}中搜尋「${keyword}」的結果。`
    : region
      ? `顯示${regionData.name}目前平台公開上架的${category === "all" ? "產業職缺與報名中課程" : categoryLabel}。`
      : categories[category].description;

  visibleItems.forEach((item) => {
    const detailUrl = item.detailUrl;
    const row = document.createElement("li");
    row.className = "news-item";
    const cover = document.createElement("a");
    cover.className = `update-item-cover update-item-cover-${item.type}`;
    cover.href = detailUrl;
    const showCoverPlaceholder = () => {
      cover.classList.add("is-placeholder");
      const placeholder = document.createElement("span");
      placeholder.textContent = labels[item.type];
      cover.replaceChildren(placeholder);
      cover.setAttribute("aria-label", `閱讀${item.title}`);
    };
    if (item.cover?.src) {
      const image = document.createElement("img");
      image.src = item.cover.src;
      image.alt = item.cover.alt || "";
      image.loading = "lazy";
      image.addEventListener("error", showCoverPlaceholder, { once: true });
      cover.append(image);
    } else {
      showCoverPlaceholder();
    }

    const meta = document.createElement("div");
    meta.className = "news-item-meta";
    if (item.pinned) {
      const pinned = document.createElement("span");
      pinned.className = "site-badge site-badge-pinned";
      pinned.textContent = "置頂";
      meta.append(pinned);
    }
    const badge = document.createElement("span");
    badge.className = `site-badge site-badge-${item.type}`;
    badge.textContent = labels[item.type];
    const date = document.createElement("time");
    date.className = "news-date";
    date.dateTime = item.publishedAt;
    date.textContent = item.publishedAt.replaceAll("-", ".");
    meta.append(badge, date);

    const content = document.createElement("div");
    content.className = "update-item-content";
    const title = document.createElement("h3");
    title.className = "news-item-title";
    const titleLink = document.createElement("a");
    titleLink.href = detailUrl;
    titleLink.textContent = item.title;
    title.append(titleLink);
    const summary = document.createElement("p");
    summary.className = "news-summary";
    summary.textContent = item.summary;
    const extra = document.createElement("div");
    extra.className = "update-item-extra";
    const searchableTags = new Set(item.tags || []);
    item.extra.forEach((value) => {
      if (searchableTags.has(value)) {
        const tag = document.createElement("button");
        tag.className = "badge badge-secondary update-tag";
        tag.type = "button";
        tag.textContent = value;
        tag.setAttribute("aria-label", `搜尋標籤：${value}`);
        tag.addEventListener("click", () => {
          window.location.href = categoryUrl(category, 1, value);
        });
        extra.append(tag);
      } else {
        const span = document.createElement("span");
        span.className = "badge badge-secondary";
        span.textContent = value;
        extra.append(span);
      }
    });

    const more = document.createElement("a");
    more.className = "site-more news-more";
    more.href = detailUrl;
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
    const footer = document.createElement("div");
    footer.className = "update-item-footer d-flex align-items-center justify-content-between";
    footer.append(extra, more);
    content.append(meta, title, summary, footer);
    row.append(cover, content);
    list.append(row);
  });

  const hasResults = visibleItems.length !== 0;
  emptyState.hidden = hasResults;
  list.closest(".news-panel").hidden = !hasResults;
  pagination.hidden = !hasResults;
  if (!hasResults && keyword) {
    emptyState.querySelector("h2").textContent = "找不到符合條件的動態";
    emptyState.querySelector("p").textContent = `沒有包含「${keyword}」的${categories[category].label}，請調整關鍵字或清除搜尋條件。`;
    emptyReset.hidden = false;
    emptyReset.href = categoryUrl(category, 1, "");
  } else if (!hasResults && region) {
    emptyState.querySelector("h2").textContent = `${regionData.name}目前尚無公開內容`;
    emptyState.querySelector("p").textContent = category === "all"
      ? "目前沒有公開上架的產業職缺或報名中課程，累計成果仍可於上方查看。"
      : `目前沒有公開上架的${categories[category].label}，請切換其他分類或稍後再查看。`;
  }

  const makePageLink = (label, page, options = {}) => {
    const link = document.createElement("a");
    link.className = "site-page-link";
    link.textContent = label;
    link.href = categoryUrl(category, page);
    if (options.current) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
    if (options.disabled) {
      link.classList.add("is-disabled");
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("href");
    }
    return link;
  };
  pagination.append(makePageLink("上一頁", currentPage - 1, { disabled: currentPage === 1 }));
  for (let page = 1; page <= totalPages; page += 1) {
    pagination.append(makePageLink(String(page), page, { current: page === currentPage }));
  }
  pagination.append(makePageLink("下一頁", currentPage + 1, { disabled: currentPage === totalPages }));
});
