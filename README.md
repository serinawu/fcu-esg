# FCU ESG 靜態展示網站

本 repository 為「機械智造轉型服務據點－訓練資源地圖」的 GitHub Pages 靜態展示版本。

## 目前版本

`v1.0.0`：第一批確認開放頁面，供外部展示與內容確認使用。

## 已開放頁面

### 首頁

- [`index.html`](./index.html)

### 據點介紹

- [`pages/about.html`](./pages/about.html)
- 計畫緣起與目標：`pages/about.html#goals`
- 服務對象與範圍：`pages/about.html#services`

### 據點動態

- 全部動態：[`pages/update.html`](./pages/update.html)
- 最新消息：`pages/update.html?category=news`
- 廠商職缺：`pages/update.html?category=jobs`
- 活動花絮：`pages/update.html?category=gallery`
- 課程招生：`pages/update.html?category=courses`
- 區域成果：支援 `region=taichung`、`region=changhua`、`region=nantou`
- 關鍵字搜尋及分頁

### 據點動態詳細頁

- 最新消息：[`pages/news-detail.html`](./pages/news-detail.html)，使用 `?id=news-XXX`
- 廠商職缺：[`pages/job-detail.html`](./pages/job-detail.html)，使用 `?id=jobs-XXX`
- 活動花絮：[`pages/gallery-detail.html`](./pages/gallery-detail.html)，使用 `?id=gallery-XXX`
- 課程招生：[`pages/training-detail.html`](./pages/training-detail.html)，使用 `?id=courses-XXX`

`training-detail.html` 目前僅作為「據點動態／課程招生」的詳細頁使用，不代表完整訓練資源頁面已開放。

## 尚未開放

- 趨勢知識
- 完整訓練資源列表
- 首頁課程推薦連結
- 影片專區
- 聯絡我們
- 隱私權政策

上述頁面及其專用檔案目前未納入本 repository；展示頁中的相關入口已停用。

## 目錄結構

```text
.
├── index.html
├── pages/
│   ├── about.html
│   ├── update.html
│   ├── news-detail.html
│   ├── job-detail.html
│   ├── gallery-detail.html
│   └── training-detail.html
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── icons/
└── data/
    ├── updates.json
    ├── courses.json
    └── region-statistics.json
```
