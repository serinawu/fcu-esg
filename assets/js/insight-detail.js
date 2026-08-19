document.addEventListener("DOMContentLoaded", async () => {
  const article = document.getElementById("insightDetail");
  if (!article) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const showError = (title, message) => {
    const state = document.createElement("section");
    state.className = "empty-state";
    state.setAttribute("aria-label", "內容狀態");
    const icon = document.createElement("span");
    icon.className = "empty-state-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "i";
    const heading = document.createElement("h1");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = message;
    const back = document.createElement("a");
    back.className = "site-button";
    back.href = "insights.html";
    back.textContent = "返回趨勢知識";
    state.append(icon, heading, copy, back);
    article.replaceWith(state);
    document.getElementById("insightPager")?.remove();
  };

  let items = [];
  try {
    const response = await fetch("../data/insights.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    items = Array.isArray(payload.items)
      ? payload.items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      : [];
  } catch (error) {
    console.error("Unable to load insight detail:", error);
    showError("資料載入失敗", "請確認目前透過本地 HTTP server 瀏覽，再重新整理頁面。");
    return;
  }

  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    showError("找不到文章", "網址中的文章識別碼無效，請返回趨勢知識列表重新選擇。");
    return;
  }

  const item = items[index];
  document.title = `${item.title}｜趨勢知識`;
  document.querySelector("[data-insight-title]").textContent = item.title;
  document.querySelector("[data-insight-category]").textContent = item.category;
  const time = document.querySelector("[data-insight-date]");
  time.dateTime = item.publishedAt;
  time.textContent = item.publishedAt.replaceAll("-", ".");
  document.querySelector("[data-insight-lead]").textContent = item.summary;
  const cover = document.querySelector("[data-insight-cover]");
  cover.src = item.cover;
  cover.alt = item.coverAlt || "";
  document.querySelector("[data-insight-cover-wrap]").style.setProperty("--bg-url", `url('${item.cover}')`);

  const body = document.querySelector("[data-insight-body]");
  const sections = (item.sections || []).flatMap((section) => {
    const heading = document.createElement("h2");
    heading.textContent = section.heading;
    const paragraphs = (section.paragraphs || []).map((value) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = value;
      return paragraph;
    });
    return [heading, ...paragraphs];
  });
  body.replaceChildren(...sections);

  const tags = document.querySelector("[data-insight-tags]");
  tags.replaceChildren(...(item.tags || []).map((value) => {
    const tag = document.createElement("a");
    tag.className = "insight-tag";
    const search = new URLSearchParams({ q: value });
    tag.href = `insights.html?${search.toString()}`;
    tag.textContent = `#${value}`;
    tag.setAttribute("aria-label", `搜尋標籤：${value}`);
    return tag;
  }));

  const setPager = (selector, target, label) => {
    const link = document.querySelector(selector);
    if (!target) {
      link.hidden = true;
      return;
    }
    link.href = `insight-detail.html?id=${encodeURIComponent(target.id)}`;
    link.querySelector(".insight-pager-title").textContent = target.title;
    link.setAttribute("aria-label", `${label}：${target.title}`);
  };
  setPager("[data-insight-previous]", items[index - 1], "上一篇");
  setPager("[data-insight-next]", items[index + 1], "下一篇");
});
