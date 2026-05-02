# Google Drive 設定（手機完成版）

把照片存在你自己的 Google Drive，旅伴透過你的 Worker 也能讀寫。一次性設定，**全程瀏覽器**，約 8 分鐘。

---

## 你需要的

- 一個 Google 帳號（你要用哪個 Drive 的就用哪個登入）
- 已部署的 Cloudflare Worker：`https://visa-rate.aa85192.workers.dev`
- Cloudflare、Google Cloud Console 都用瀏覽器開

---

## 步驟 1 — Google Cloud Console（5 分鐘）

### 1.1 建專案 + 啟用 Drive API

1. 開 [console.cloud.google.com](https://console.cloud.google.com)
2. 上方專案下拉 → 新增專案 → 隨便取名（如 `Travel-App`）→ 建立
3. 左上 ☰ → **API 和服務** → **程式庫** → 搜尋 `Google Drive API` → 點進去 → **啟用**

### 1.2 設定 OAuth 同意畫面

1. 左上 ☰ → **API 和服務** → **OAuth 同意畫面**
2. 選 **External（外部）** → 建立
3. 必填：
   - **應用程式名稱**：`Travel App`
   - **使用者支援電子郵件**：你的 Gmail
   - **開發人員聯絡資訊**：你的 Gmail
   - 其他全跳
4. **範圍 (Scopes)** → 「新增或移除範圍」→ 拉到最下「**手動新增範圍**」貼：
   ```
   https://www.googleapis.com/auth/drive.file
   ```
   按「新增至資料表」→ 「更新」
5. **測試使用者** → 加你自己的 Gmail
6. 儲存

### 1.3 建 OAuth 用戶端

1. 左上 ☰ → **API 和服務** → **憑證** → 「+ 建立憑證」 → **OAuth 用戶端 ID**
2. 應用程式類型：**網頁應用程式**
3. 名稱：隨便（`Travel App`）
4. **已授權的 JavaScript 來源**：留空
5. **已授權的重新導向 URI** → +新增 URI → 填：
   ```
   https://visa-rate.aa85192.workers.dev/oauth/callback
   ```
6. **建立** → 跳出視窗顯示 **Client ID** 與 **Client Secret**
7. **兩個都先複製到備忘錄**（Secret 不會再顯示完整）

---

## 步驟 2 — Cloudflare Worker 加變數（2 分鐘）

1. 開 [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → 點 `visa-rate`
3. 上方 **Settings** → **Variables and Secrets**
4. 「Add variable」分別加：

   | 名稱 | 值 | Type |
   |---|---|---|
   | `GOOGLE_CLIENT_ID` | 剛才複製的 Client ID | Plain Text |
   | `GOOGLE_CLIENT_SECRET` | 剛才複製的 Client Secret | **Secret**（勾 Encrypt） |

5. **Save and Deploy**

> `GOOGLE_REFRESH_TOKEN` 不用先加，下一步會拿到。

---

## 步驟 3 — 取得 Refresh Token（30 秒）

1. 手機瀏覽器開：
   ```
   https://visa-rate.aa85192.workers.dev/oauth/setup
   ```
2. 點「**用 Google 登入**」
3. 選你的 Google 帳號 → 「進階」→ 「前往 Travel App（不安全）」（Testing 模式會這樣顯示，正常）
4. 勾「查看及管理您透過這個應用程式建立的 Google Drive 檔案」 → 繼續
5. 跳轉到結果頁，會看到一串 **refresh_token** + 「一鍵複製」按鈕
6. 點複製，立刻去 Cloudflare Worker → Variables 加：

   | 名稱 | 值 | Type |
   |---|---|---|
   | `GOOGLE_REFRESH_TOKEN` | 剛複製的 token | **Secret**（勾 Encrypt） |

7. **Save and Deploy**

---

## 步驟 4 — 測試（10 秒）

1. 重新整理 App
2. 編輯任何景點 → 「旅遊相簿」加一張照片
3. 等個 1-2 秒
4. 開 [drive.google.com](https://drive.google.com)，會看到自動建好的 `Travel App` 資料夾，裡面有剛上傳的 webp

---

## 之後

- **空間**：用你 Drive 的 15 GB（共用 Gmail / Photos）
- **旅伴**：完全不用設定，照常用 App，照片透過 Worker 自動存到你 Drive
- **要關掉**：到 [myaccount.google.com/permissions](https://myaccount.google.com/permissions) 撤銷 Travel App 授權，立刻失效

---

## 故障排除

| 症狀 | 原因 | 解法 |
|---|---|---|
| `/oauth/callback` 顯示 redirect_uri_mismatch | OAuth 用戶端的重新導向 URI 沒對上 | 回 Google Cloud → 憑證 → 編輯，確認 URI 是 `https://visa-rate.aa85192.workers.dev/oauth/callback`（不能多斜線、不能 http） |
| 上傳照片回 503 `GOOGLE_REFRESH_TOKEN not set` | 還沒設第三個變數 | 重做步驟 3 |
| 上傳照片回 401 / 403 | refresh token 失效（一年沒用 / 撤銷） | 重新跑步驟 3 拿新的 |
| `/oauth/setup` 卡在 Google 登入頁說「未驗證」 | 你不是測試使用者 | 步驟 1.2 第 5 點把自己加進測試使用者 |
