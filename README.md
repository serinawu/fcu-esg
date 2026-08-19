# FCU ESG 靜態展示網站

本 repository 為「機械智造轉型服務據點－訓練資源地圖」的 GitHub Pages 靜態展示版本。

## 目前版本

`v1.1.0`：開放趨勢知識與完整訓練資源主題，供外部展示與內容確認使用。

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

### 趨勢知識

- 文章列表：[`pages/insights.html`](./pages/insights.html)
- 文章詳細頁：[`pages/insight-detail.html`](./pages/insight-detail.html)，使用 `?id=insight-XXX`
- 支援分類、關鍵字搜尋、分頁，以及網格／列表顯示模式

### 訓練資源

- 全部課程：[`pages/training.html`](./pages/training.html)
- 報名中課程：`pages/training.html?status=open`
- 課程詳細頁：[`pages/training-detail.html`](./pages/training-detail.html)，使用 `?id=courses-XXX`
- 支援課程狀態、資源類別、類型、區域、日期及關鍵字篩選

## 尚未開放

- 影片專區
- 聯絡我們
- 隱私權政策

上述頁面目前未對外開放，展示頁中的相關入口已停用。

## 目錄結構

```text
.
├── index.html
├── pages/
│   ├── about.html
│   ├── update.html
│   ├── insights.html
│   ├── insight-detail.html
│   ├── training.html
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
    ├── insights.json
    └── region-statistics.json
```

## 本機預覽

頁面會透過 `fetch` 讀取 JSON 資料，因此不能直接以 `file://` 開啟。請在 repository 根目錄啟動 HTTP server：

```bash
python3 -m http.server 8000
```

再開啟 <http://localhost:8000/>。

部分樣式與示意圖片使用外部 CDN／HTTPS 圖片來源，預覽時需要網路連線。

## GitHub Pages

GitHub Pages 的發佈來源請選擇要公開的分支，目錄選擇 `/ (root)`。
