document.addEventListener("DOMContentLoaded", async () => {
  const expectedType = document.body.dataset.detailType;
  if (!expectedType) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const setText = (selector, value) => {
    if (value == null) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };
  const setList = (selector, values = []) => {
    const list = document.querySelector(selector);
    if (!list) return;
    list.replaceChildren(...values.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }));
  };
  const activateExternalAction = (selector, url, label) => {
    const wrapper = document.querySelector(selector);
    if (!wrapper || !url) return;
    const link = document.createElement("a");
    link.className = wrapper.querySelector(".site-button")?.className || "site-button";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    wrapper.replaceWith(link);
  };
  const showError = (title, message) => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const container = document.createElement("div");
    container.className = "site-container";
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
    back.href = expectedType === "courses" ? "training.html" : `update.html?category=${expectedType}`;
    back.textContent = expectedType === "courses" ? "返回訓練資源" : "返回據點動態";
    state.append(icon, heading, copy, back);
    container.append(state);
    main.replaceChildren(container);
  };

  let item;
  try {
    const dataUrl = expectedType === "courses" ? "../data/courses.json" : "../data/updates.json";
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    item = payload.items?.find((entry) => entry.id === id && entry.type === expectedType && entry.detail);
    if (item && expectedType === "courses") {
      item = {
        ...item,
        date: item.publishedAt,
        detail: {
          ...item.detail,
          courseDates: window.FCUCourseStatus.formatDateRange(item.courseStart, item.courseEnd),
          registrationPeriod: `${item.registrationStart.replaceAll("-", ".")}–${item.registrationEnd.replaceAll("-", ".")}`
        }
      };
    }
  } catch (error) {
    console.error("Unable to load update detail:", error);
    showError("資料載入失敗", "請確認目前透過本地 HTTP server 瀏覽，再重新整理頁面。");
    return;
  }

  if (!item) {
    showError("找不到內容", "網址中的資料識別碼無效，或此內容的詳細資料尚未建立。");
    return;
  }

  document.title = `${item.title}｜${expectedType === "courses" ? "訓練資源" : "據點動態"}`;
  setText("[data-detail-title]", item.title);
  setText("[data-detail-lead]", item.detail.lead || item.summary);
  setText("[data-detail-date]", item.date.replaceAll("-", "."));
  document.querySelectorAll("[data-detail-datetime]").forEach((element) => {
    element.dateTime = item.date;
  });

  if (expectedType === "jobs") {
    const fields = {
      companyName: item.detail.companyName,
      location: item.detail.location,
      salary: item.detail.salary,
      deadline: item.detail.deadline,
      employmentType: item.detail.employmentType,
      vacancies: item.detail.vacancies,
      benefits: item.detail.benefits
    };
    Object.entries(fields).forEach(([field, value]) => setText(`[data-detail-field="${field}"]`, value));
    setList('[data-detail-list="description"]', item.detail.description);
    setList('[data-detail-list="requirements"]', item.detail.requirements);
    setText("[data-source-label]", item.source?.label);
    setText("[data-source-name]", item.source?.name);

    activateExternalAction("#jobApplyAction", item.source?.applyUrl, "前往應徵");
    activateExternalAction("#jobSourceAction", item.source?.sourceUrl, "查看原始職缺");
  }

  if (expectedType === "courses") {
    const status = window.FCUCourseStatus.getStatus(item);
    setText("[data-course-status]", window.FCUCourseStatus.definitions[status].label);
    const fields = {
      provider: item.detail.provider,
      deliveryMode: item.detail.deliveryMode,
      courseDates: item.detail.courseDates,
      hours: item.detail.hours,
      location: item.detail.location,
      capacity: item.detail.capacity,
      registrationPeriod: item.detail.registrationPeriod,
      fee: item.detail.fee,
      introduction: item.detail.introduction,
      audience: item.detail.audience
    };
    Object.entries(fields).forEach(([field, value]) => setText(`[data-detail-field="${field}"]`, value));
    setList('[data-detail-list="syllabus"]', item.detail.syllabus);
    setText("[data-source-label]", item.source?.label);
    setText("[data-source-name]", item.source?.name);
    activateExternalAction("#courseApplyAction", item.source?.applyUrl, "前往報名");
    activateExternalAction("#courseSourceAction", item.source?.sourceUrl, "查看課程來源");
  }

  if (expectedType === "gallery") {
    setText('[data-detail-field="location"]', item.detail.location);
    setText('[data-detail-field="eventType"]', item.detail.eventType);
    setText('[data-detail-field="photoCount"]', item.detail.photoCount);
    setText('[data-detail-field="description"]', item.detail.description);
    const gallery = document.querySelector("[data-detail-gallery]");
    if (gallery) {
      const figures = item.detail.photos.map((photo) => {
        const figure = document.createElement("figure");
        figure.className = "gallery-card";
        const image = document.createElement("img");
        image.src = photo.src;
        image.alt = photo.alt;
        const caption = document.createElement("figcaption");
        caption.textContent = photo.caption;
        figure.append(image, caption);
        return figure;
      });
      gallery.replaceChildren(...figures);
    }
  }

  if (expectedType === "news") {
    setText("[data-detail-category]", item.detail.category);
    setText("[data-detail-updated]", item.updatedAt?.replaceAll("-", "."));
    const pinned = document.querySelector("[data-detail-pinned]");
    if (pinned) pinned.hidden = !item.pinned;
    const image = document.querySelector("[data-detail-image]");
    if (image) {
      image.src = item.detail.image;
      image.alt = item.detail.imageAlt;
    }
    const body = document.querySelector("[data-detail-news-body]");
    if (body) {
      const sections = item.detail.sections.flatMap((section) => {
        const heading = document.createElement("h2");
        heading.textContent = section.heading;
        const paragraphs = section.paragraphs.map((value) => {
          const paragraph = document.createElement("p");
          paragraph.textContent = value;
          return paragraph;
        });
        return [heading, ...paragraphs];
      });
      body.replaceChildren(...sections);
    }
  }
});
