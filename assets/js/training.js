document.addEventListener("DOMContentLoaded", async () => {
  const statusTool = window.FCUCourseStatus;
  const list = document.getElementById("trainingList");
  const statusNav = document.getElementById("trainingStatusNav");
  const pagination = document.getElementById("trainingPagination");
  const emptyState = document.getElementById("trainingEmptyState");
  const title = document.getElementById("trainingResultTitle");
  const description = document.getElementById("trainingResultDescription");
  const count = document.getElementById("trainingResultCount");
  const form = document.getElementById("trainingSearchForm");
  const resourceInput = document.getElementById("trainingResourceCategory");
  const searchByInput = document.getElementById("trainingSearchBy");
  const keywordInput = document.getElementById("trainingKeyword");
  const dateStartInput = document.getElementById("trainingDateStart");
  const dateEndInput = document.getElementById("trainingDateEnd");
  const clear = document.getElementById("trainingSearchClear");
  const filterToggle = document.getElementById("trainingFilterToggle");
  const filterBody = document.getElementById("trainingFilterBody");
  const filterSummary = document.getElementById("trainingFilterSummary");

  let courses = [];
  try {
    const response = await fetch("../data/courses.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    courses = (payload.items || []).filter((course) => course.isPublished);
  } catch (error) {
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "資料載入失敗";
    emptyState.querySelector("p").textContent = "請確認目前透過本地 HTTP server 瀏覽，再重新整理頁面。";
    console.error("Unable to load courses:", error);
    return;
  }

  const definitions = statusTool.definitions;
  const allowedResources = new Set(["site-plan", "site-free", "talent-program"]);
  const allowedModes = new Set(["online", "physical"]);
  const allowedRegions = new Set(["taichung", "changhua", "nantou"]);
  const params = new URLSearchParams(window.location.search);
  const requestedStatus = params.get("status") || "all";
  const status = requestedStatus === "all" || definitions[requestedStatus] ? requestedStatus : "all";
  const requestedResource = params.get("resource");
  const resource = allowedResources.has(requestedResource) ? requestedResource : "";
  const requestedMode = params.get("mode");
  const mode = allowedModes.has(requestedMode) ? requestedMode : "";
  const requestedRegion = params.get("region");
  const region = allowedRegions.has(requestedRegion) ? requestedRegion : "";
  const requestedKeyword = params.get("q");
  const keyword = requestedKeyword?.trim() || "";
  const requestedSearchBy = params.get("searchBy");
  const allowedSearchFields = new Set(["title", "provider", "tag"]);
  const searchBy = keyword && allowedSearchFields.has(requestedSearchBy) ? requestedSearchBy : "title";
  const isIsoDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  let dateStart = isIsoDate(params.get("start")) ? params.get("start") : "";
  let dateEnd = isIsoDate(params.get("end")) ? params.get("end") : "";
  if (dateStart && dateEnd && dateStart > dateEnd) {
    [dateStart, dateEnd] = [dateEnd, dateStart];
  }
  const requestedPage = params.get("page");
  const pageSize = 6;

  const filterState = { resource, mode, region, keyword, searchBy, dateStart, dateEnd };
  const normalize = (value) => String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("zh-Hant")
    .replaceAll("臺", "台");
  const terms = normalize(keyword).split(/\s+/).filter(Boolean);
  const courseStatus = new Map(courses.map((course) => [course.id, statusTool.getStatus(course)]));
  const statusCounts = courses.reduce((totals, course) => {
    const value = courseStatus.get(course.id);
    totals[value] = (totals[value] || 0) + 1;
    return totals;
  }, {});
  const matchesKeyword = (course) => {
    if (terms.length === 0) return true;
    const values = searchBy === "provider"
      ? [course.provider]
      : searchBy === "tag"
        ? course.tags || []
        : [course.title];
    const haystack = normalize(values.filter(Boolean).join(" "));
    return terms.every((term) => haystack.includes(term));
  };
  const matchesDateRange = (course) => {
    if (dateStart && course.courseEnd < dateStart) return false;
    if (dateEnd && course.courseStart > dateEnd) return false;
    return true;
  };
  const matchesAdvancedFilters = (course) => (
    (!resource || course.resourceCategory === resource)
    && (!mode || course.deliveryModeCode === mode)
    && (!region || course.regionCode === region)
    && matchesKeyword(course)
    && matchesDateRange(course)
  );
  const filtered = courses
    .filter((course) => status === "all" || courseStatus.get(course.id) === status)
    .filter(matchesAdvancedFilters)
    .sort((a, b) => a.courseStart.localeCompare(b.courseStart));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const parsedPage = Number.parseInt(requestedPage || "1", 10);
  const currentPage = Number.isFinite(parsedPage) ? Math.min(Math.max(parsedPage, 1), totalPages) : 1;
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const buildUrl = (targetStatus = status, page = 1, overrides = {}) => {
    const state = { ...filterState, ...overrides };
    const query = new URLSearchParams();
    if (targetStatus !== "all") query.set("status", targetStatus);
    if (state.resource) query.set("resource", state.resource);
    if (state.mode) query.set("mode", state.mode);
    if (state.region) query.set("region", state.region);
    if (state.keyword && state.searchBy !== "title") query.set("searchBy", state.searchBy);
    if (state.keyword) query.set("q", state.keyword);
    if (state.dateStart) query.set("start", state.dateStart);
    if (state.dateEnd) query.set("end", state.dateEnd);
    if (page > 1) query.set("page", String(page));
    const suffix = query.toString();
    return suffix ? `training.html?${suffix}` : "training.html";
  };

  const normalizedUrl = buildUrl(status, currentPage);
  const currentRelativeUrl = `training.html${window.location.search}`;
  if (currentRelativeUrl !== normalizedUrl) {
    window.history.replaceState({}, "", normalizedUrl);
  }

  const statusOptions = [
    { value: "all", label: "全部課程", count: courses.length },
    ...Object.entries(definitions)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([value, definition]) => ({ value, label: definition.label, count: statusCounts[value] || 0 }))
      .filter((option) => option.count > 0)
  ];
  statusOptions.forEach((option) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "training-status-link";
    link.href = buildUrl(option.value);
    const label = document.createElement("span");
    label.textContent = option.label;
    const badge = document.createElement("span");
    badge.className = "training-status-count";
    badge.textContent = String(option.count);
    link.append(label, badge);
    if (option.value === status) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    item.append(link);
    statusNav.append(item);
  });

  resourceInput.value = resource;
  searchByInput.value = searchBy;
  keywordInput.value = keyword;
  dateStartInput.value = dateStart;
  dateEndInput.value = dateEnd;
  const selectedMode = form.querySelector(`input[name="mode"][value="${mode}"]`);
  const selectedRegion = form.querySelector(`input[name="region"][value="${region}"]`);
  if (selectedMode) selectedMode.checked = true;
  if (selectedRegion) selectedRegion.checked = true;

  const activeFilterCount = [resource, mode, region, keyword, dateStart || dateEnd].filter(Boolean).length;
  filterSummary.textContent = activeFilterCount
    ? `已套用 ${activeFilterCount} 項搜尋條件`
    : "依類別、類型、區域或日期搜尋";
  filterToggle.classList.toggle("has-filters", activeFilterCount > 0);
  clear.href = buildUrl(status, 1, {
    resource: "",
    mode: "",
    region: "",
    keyword: "",
    searchBy: "title",
    dateStart: "",
    dateEnd: ""
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(form);
    window.location.href = buildUrl(status, 1, {
      resource: String(values.get("resource") || ""),
      mode: String(values.get("mode") || ""),
      region: String(values.get("region") || ""),
      searchBy: String(values.get("searchBy") || "title"),
      keyword: String(values.get("q") || "").trim(),
      dateStart: String(values.get("start") || ""),
      dateEnd: String(values.get("end") || "")
    });
  });
  filterToggle.addEventListener("click", () => {
    const expanded = filterToggle.getAttribute("aria-expanded") === "true";
    filterToggle.setAttribute("aria-expanded", String(!expanded));
    filterBody.classList.toggle("is-open", !expanded);
  });
  if (activeFilterCount > 0) {
    filterToggle.setAttribute("aria-expanded", "true");
    filterBody.classList.add("is-open");
  }

  const statusLabel = status === "all" ? "訓練資源" : definitions[status].label;
  title.textContent = statusLabel;
  description.textContent = activeFilterCount
    ? `已依 ${activeFilterCount} 項條件篩選，課程狀態仍會隨日期自動更新。`
    : "課程狀態會依報名期間與上課日期自動更新。";
  count.textContent = `共 ${filtered.length} 筆`;

  const createMoreLink = (href) => {
    const link = document.createElement("a");
    link.className = "site-more news-more";
    link.href = href;
    const text = document.createElement("span");
    text.textContent = "查看課程";
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("width", "15");
    arrow.setAttribute("height", "10");
    arrow.setAttribute("viewBox", "0 0 13 10");
    arrow.setAttribute("aria-hidden", "true");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", "M1,5 L11,5");
    const head = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    head.setAttribute("points", "8 1 12 5 8 9");
    arrow.append(line, head);
    link.append(text, arrow);
    return link;
  };

  const createFilterTag = (label, href, ariaLabel) => {
    const link = document.createElement("a");
    link.className = "badge badge-secondary training-tag training-tag-link";
    link.href = href;
    link.textContent = label;
    link.setAttribute("aria-label", ariaLabel);
    return link;
  };

  visible.forEach((course) => {
    const item = document.createElement("li");
    const card = document.createElement("article");
    card.className = "site-card training-card";
    const cover = document.createElement("a");
    cover.className = "training-cover";
    cover.href = course.detailUrl;
    const image = document.createElement("img");
    image.src = course.cover.src;
    image.alt = course.cover.alt;
    image.loading = "lazy";
    const category = document.createElement("span");
    category.className = "training-resource-label";
    category.textContent = course.resourceCategoryLabel;
    cover.append(image, category);

    const content = document.createElement("div");
    content.className = "training-card-content";
    const meta = document.createElement("div");
    meta.className = "training-card-meta";
    const statusBadge = document.createElement("span");
    const statusValue = courseStatus.get(course.id);
    statusBadge.className = `training-status-badge training-status-${statusValue}`;
    statusBadge.textContent = definitions[statusValue].label;
    meta.append(statusBadge);

    const heading = document.createElement("h2");
    heading.className = "training-card-title";
    const headingLink = document.createElement("a");
    headingLink.href = course.detailUrl;
    headingLink.textContent = course.title;
    heading.append(headingLink);
    const summary = document.createElement("p");
    summary.className = "training-card-summary";
    summary.textContent = course.summary;
    const tags = document.createElement("div");
    tags.className = "training-card-tags";
    (course.tags || []).forEach((value) => {
      if (value === course.provider) {
        tags.append(createFilterTag(
          value,
          buildUrl(status, 1, { keyword: value, searchBy: "provider" }),
          `依訓練單位篩選：${value}`
        ));
        return;
      }
      if (["實體課程", "線上課程", "遠距課程"].includes(value)) {
        tags.append(createFilterTag(
          value,
          buildUrl(status, 1, { mode: course.deliveryModeCode }),
          `依授課方式篩選：${value}`
        ));
        return;
      }
      tags.append(createFilterTag(
        value,
        buildUrl(status, 1, { keyword: value, searchBy: "tag" }),
        `依標籤篩選：${value}`
      ));
    });
    tags.append(createFilterTag(
      course.region,
      buildUrl(status, 1, { region: course.regionCode }),
      `依課程區域篩選：${course.region}`
    ));
    const dates = document.createElement("span");
    dates.className = "badge badge-secondary training-tag";
    dates.textContent = statusTool.formatDateRange(course.courseStart, course.courseEnd);
    tags.append(dates);
    const footer = document.createElement("div");
    footer.className = "training-card-footer";
    footer.append(tags, createMoreLink(course.detailUrl));
    content.append(meta, heading, summary, footer);
    card.append(cover, content);
    item.append(card);
    list.append(item);
  });

  const hasResults = visible.length > 0;
  list.hidden = !hasResults;
  pagination.hidden = !hasResults;
  emptyState.hidden = hasResults;
  if (!hasResults) {
    emptyState.querySelector("h2").textContent = "找不到符合條件的課程";
    emptyState.querySelector("p").textContent = "請調整課程狀態或搜尋條件後再試一次。";
    const reset = emptyState.querySelector("a");
    reset.href = "training.html";
    reset.textContent = "清除所有條件";
  }

  const makePageLink = (label, page, options = {}) => {
    const link = document.createElement("a");
    link.className = "site-page-link";
    link.href = buildUrl(status, page);
    link.textContent = label;
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
