# 25 歲女性 IG 用戶視角 — App 審視與規劃

> **角色設定 (Persona)**
> 小桃，25 歲，台灣上班族。每天滑 IG / Threads / 小紅書 2 小時以上，喜歡 Y2K、quiet luxury、韓系、可愛潮流。常與 2-4 位閨蜜出國（韓國、日本、東南亞）。出發前會在 IG 收藏 50+ 篇打卡點，回國後會花一週剪 Reels 與整理九宮格。對「視覺感」、「儀式感」、「可分享性」極度敏感。

---

## 一、目前優勢 (Already Loved 💗)

審視後，App 已具備不少戳中此族群的點：

- **馬卡龍粉色主題 + 熊熊圖示**：第一眼好感度高，符合「軟萌」審美。
- **收藏夾 (Collections)**：可以貼 IG / 小紅書 / Threads 連結並分類，貼近「滑到再貼」的工作流。
- **預算分帳**：閨蜜出國最痛點之一，KRW↔TWD 即時匯率體貼。
- **6 碼同步代碼**：分享給朋友載入同一份行程，免註冊很佛心。
- **熊熊 BearIcons + BubbleLoader + ColorWheelPicker**：細節做了，但沒有發揮到極致。

---

## 二、不足之處 (Gaps) — 依嚴重度分類

### 🔴 P0：直接影響「想分享 / 想開啟」動機

| 缺口 | 現況 | 為何痛 |
|---|---|---|
| **無社群分享卡片** | 無法把行程匯出成 IG Story 比例 (9:16) 的漂亮卡片 | 25 歲女生規劃完最想做的就是發一張「我要出發了 ✈️」到限動。目前只能截圖，醜。 |
| **照片功能極度貧弱** | Trip 只有單張 coverImage，Spot 只有單張 photo URL | 無法做相簿、無法當「旅行日記」、回國後完全無法回味 |
| **沒有「旅行回顧 / Recap」** | 結束後沒有 Spotify Wrapped 風格的總結 | 這是最具病毒傳播力的功能，缺它=放棄一半曝光機會 |
| **沒有「打卡點探索」** | 收藏夾要自己貼連結，沒有發現 (Discover) 功能 | IG 女孩會想看「弘大必拍咖啡廳 Top 10」、「韓劇場景地圖」 |
| **無深色模式** | 僅淺色馬卡龍 | 晚上滑、機上滑、地鐵滑都刺眼。2026 了沒 dark mode 是硬傷 |

### 🟠 P1：影響長期黏著度

| 缺口 | 為何痛 |
|---|---|
| **無 OOTD / 穿搭規劃** | 25 歲女生出國前一週都在配衣服，行李箱 outfit by day 是核心需求 |
| **無採購清單 / 必買** | 韓妞必買、藥妝、伴手禮分人代買清單完全沒有 |
| **無旅行日記 / 手帳** | 沒有可以寫心情、貼拍立得、貼貼紙的頁面 |
| **無「主題玩法」標籤** | 缺少 #咖啡廳巡禮 #韓劇場景 #網美打卡 #甜點地圖 等視覺化 tag |
| **天氣與穿搭未串接** | weatherService 已存在但沒有「明天 12°C，建議大衣」 |
| **同步邀請體驗弱** | 6 碼很工程師，缺少「閨蜜旅行邀請卡」的儀式感 |
| **AI 助理沒有對話 UI** | geminiSearchService 已接但沒做成「小桃旅行管家」對話框 |
| **個人化頭像太陽春** | 只有 emoji + 顏色，沒有捏臉 / 動物頭像庫 / 暱稱卡 |

### 🟡 P2：錦上添花

- 無音樂 / 旅行歌單整合（Spotify / Apple Music 連結）
- 無節慶限定主題（櫻花季、聖誕、生日月）
- 無徽章 / 成就（去過 5 國、累積 100 個景點…）
- 無 PWA「加入主畫面」指引與推播（航班倒數、明日行程提醒）
- 無觸覺回饋 (haptic) 與微互動（點愛心彈跳、刪除時的小動畫）
- 預算頁過於表格化，缺少「存錢豬」「達成度進度條」的可愛化視覺
- 僅繁中，缺日 / 韓 / 英對照（去日韓時連景點名都要自己查）

---

## 三、改進規劃 (Roadmap)

> 標記說明：🟢 純客端、零成本　🟡 用既有免費額度即可　🔴 對免費方案有壓力，需取捨

### 🚀 Phase 1 — 「拍照即分享」基底 (2-3 週)

> 目標：讓行程「值得發限動」。本階段全部 🟢 純客端，不增加任何後端負擔。

1. **行程封面 / 景點多照片** 🟢
   - `Trip.coverImage` → `coverImages: string[]`
   - `Spot.photo` → `photos: string[]`，新增「相簿」grid view
   - **儲存策略**：本機 IndexedDB（不進 KV、不進 sync payload）
   - 上傳時客端壓縮 → WebP / 長邊 1280px / Q=0.8 / 目標 ≤300KB
   - sync 時只傳 photo `id`，照片本體留在裝置；雲端載回時若無對應 id 顯示 placeholder（明確標示「裝置端照片」）

2. **Story Card 匯出器** 🟢
   - `<StoryCardExporter>`：1080×1920 PNG，馬卡龍漸層 + 熊熊 + 景點縮圖九宮格 + 日期戳
   - 用 `modern-screenshot`（比 html2canvas 對 emoji / WebFont 更穩）
   - Web Share API 直接分享 → 完全不經過後端

3. **深色模式** 🟢
   - `settingsStore` 加 `theme: 'light' | 'dark' | 'auto'`
   - 用 CSS variable 切換，避免雙套 class
   - 配色：莫蘭迪深紫 + 玫瑰金強調色（保留可愛感）

4. **打卡心情標籤** 🟢
   - `Spot` 加 `mood?: 'love' | 'wow' | 'meh' | 'cry'` + 一句話 `note`
   - 純前端欄位，自動進 sync payload

---

### 🎀 Phase 2 — 「閨蜜共玩」社交層 (3-4 週)

5. **閨蜜邀請卡** 🟢
   - 純客端產生 PNG（QR code + 同步代碼 + 出發倒數）
   - QR 用 `qrcode` npm 套件離線產生，不打外部 API

6. **OOTD / 穿搭板** 🟢
   - 新頁面 `Outfit.tsx`：每天一格，貼穿搭參考圖、寫單品清單
   - 圖片同照片策略（IndexedDB local-first）
   - 串既有 weatherService → 「明天 12°C，建議大衣」

7. **採購清單 / 代買** 🟢
   - TodoList 擴充 `type: 'task' | 'shopping'`
   - 購物項可指派「幫誰買 / 預算上限 / 店家」
   - 與預算頁打通：勾掉時一鍵建立 expense

8. **AI 旅行管家對話框** 🟡
   - 浮動 FAB（粉色熊熊頭）→ 開啟對話 sheet
   - 預設快捷：「推薦弘大咖啡廳」「這天太空幫我排」「雨備方案」
   - **免費額度保護**：
     - 客端 debounce ≥1 秒、每 session 上限 20 則
     - localStorage 快取常見 prompt 結果 7 天
     - 答案上限 200 字（縮短 token）
     - 顯示「今日剩餘次數 X / 30」避免被濫用
   - 用既有 `geminiSearchService`，只需做 UI

9. **熱門打卡點 Discover** 🟢
   - 新頁面 `Discover.tsx`：策展型主題清單
   - **資料來源**：repo 內靜態 JSON（`src/data/discover/*.json`）
   - 內容由人工策展（韓劇場景、咖啡廳、甜點、網美點…），版本與 app 一起發布
   - 一鍵加入收藏夾，零後端成本

---

### ✨ Phase 3 — 「回國後還想打開」回憶層 (2-3 週)

10. **旅行回顧 (Trip Wrapped)** 🟢
    - 行程結束自動產生：天數、走路公里、料理 emoji、總花費、最愛景點
    - Spotify Wrapped 風格分頁滑動，每頁可獨立匯出 PNG
    - 純客端統計，無任何後端呼叫

11. **手帳日記模式** 🟢
    - 每日一頁貼照片、寫心情、選天氣 / 心情貼紙
    - 6-8 款 SVG 貼紙（拍立得、票根、章戳），打包進 bundle
    - 照片走 IndexedDB

12. **照片地圖** 🟢
    - MapPage 圖層：去過的點 → 照片小圓 pin（縮圖從 IndexedDB 讀）
    - 縮放聚合成「足跡」線
    - Kakao Map 已整合，零新增成本

13. **徽章 & 成就** 🟢
    - 規則寫死於前端（第一次出國、5 國、單日 20km、花費破 5 萬…）
    - 純客端計算

14. **PWA「加到主畫面」+ 行前提醒** 🟡（**降級版**）
    - `manifest.json` + service worker：✅ 免費
    - **不做** Web Push（需要 VAPID 推送伺服器 + 訂閱表，KV 寫入會破表）
    - 改用 **Notification Trigger API**（Chrome / Edge 支援）：在使用者開 App 時，以本地 service worker 排程「行前 1 天 / 出發當天」通知，不需後端訂閱
    - iOS Safari fallback：開 App 時顯示倒數 banner（「再 2 天就要出發囉 ✈️」）

> ⚠️ **被刪減 / 延後的功能**（不適合免費方案）：
> - 真即時協作（WebSocket）→ 留待付費方案
> - 推播訂閱中心 → 改用本地 Notification Trigger
> - 雲端照片相簿 → 改用裝置端 IndexedDB + 「同網域多裝置」備份留待 R2 加掛

---

## 四、設計細節建議

### 視覺語彙統一
- 圓角統一用 `rounded-photo` (14px) 與 `rounded-3xl`
- 大量使用 `shadow-glow`，但加入 `shadow-glow-sage`、`shadow-glow-sky` 變體對應五色系
- 字體 hierarchy：**Nunito** 數字 / 標題、**Noto Sans TC** 內文、**手寫感字體**（如 `Caveat`、`Klee One`）給日記、貼紙、引用

### 動效原則
- 點任何「愛心 / 收藏 / 完成」→ Lottie 小動畫 + haptic
- 換頁用 **shared element transition**（Spot 卡片放大成詳情頁）
- 載入時 BubbleLoader 已可愛，但可隨主題色變色

### Empty State
- 每個空清單放熊熊 + 一句話：「還沒有景點哦～去發現頁挖寶吧 🐻」

### 繁中文案語氣
- 統一改成「閨蜜感」：把「新增」→「加進來」、「刪除」→「先收起來」、「儲存」→「收好了 💗」

---

## 五、免費方案約束 & 技術策略

### 5.1 現況後端盤點

| 服務 | 免費額度 | 目前用量 | 風險 |
|---|---|---|---|
| Cloudflare Workers | 100k req / day | 匯率代理 + sync 兩條路由 | 🟢 充裕 |
| Cloudflare KV | 1GB 儲存 / **1k writes / day** / 100k reads / day / 25MB 單值上限 | 每次儲存行程 = 1 write | 🟠 寫入很緊 |
| Gemini API | 依模型，RPM / RPD 有限 | geminiSearchService 已使用 | 🟠 高頻會撞牆 |
| 照片儲存 | **目前無** | — | 🔴 新功能要避開 KV |

### 5.2 設計鐵則

1. **照片永遠不進 KV**
   - KV 單值 25MB / 總量 1GB / 寫入 1k 一天 — 任何情境都不適合存圖
   - 一律走客端 **IndexedDB**（local-first）+ 壓縮（WebP / Q=0.8 / 長邊 1280）
   - 若未來要跨裝置同步照片，加掛 **Cloudflare R2**（10GB 免費）並在 sync 時上傳，但 Phase 1-3 暫不啟用

2. **sync payload 控制體積**
   - payload 只放結構化資料（行程、景點、todo、花費）
   - 照片只存 `photoId` 參考、不存 base64
   - 估算：100 個景點 + 完整 metadata ≈ 30-80KB，遠低於 25MB 單值上限

3. **寫入頻率節流**
   - 客端 debounce 5 秒 + 顯示「最後同步：3 秒前」
   - 「自動同步」改為「手動同步」按鈕 + 重大變更（行程儲存）才寫
   - 1k writes / day 約 = 30-50 個活躍使用者 / 天，超出再考慮升級

4. **AI 用量保護**
   - 客端快取 prompt → 答案 7 天（localStorage / IndexedDB）
   - 共通 prompt（如「弘大咖啡廳推薦」）在 KV 也快取一份共享給所有人，KV TTL 30 天
   - 每位使用者每日上限 20-30 則對話（顯示倒數）
   - 答案壓縮到 ≤200 字，省 token

5. **靜態資料優先**
   - Discover、徽章定義、貼紙資源 → 全部打包進 repo / bundle
   - 不為了「之後可能要動態更新」而開 KV / API，直到真的需要

6. **推播改用本地排程**
   - 不做 Web Push 訂閱中心（要 VAPID + 訂閱表 + 排程觸發）
   - 改用 **Notification Trigger API**（PWA 本地排程），無後端
   - 不支援的瀏覽器 fallback 為開 App 時顯示倒數 banner

### 5.3 工具與套件選型

- **Story / 卡片匯出**：`modern-screenshot`（emoji / WebFont 比 `html2canvas` 穩）
- **照片壓縮**：`browser-image-compression`（5kb gzipped）
- **IndexedDB 包裝**：`idb-keyval`（極簡，不用 Dexie 那麼重）
- **QR code**：`qrcode` 套件離線產生，不打外部 API
- **PWA**：`vite-plugin-pwa`，一個設定搞定 manifest + service worker
- **Dark mode**：CSS variable 切換，不引入額外套件

### 5.4 監控建議（也是免費）

- Cloudflare Workers 後台已自帶日請求 / KV ops 圖表，每週看一次即可
- 在 Worker 內加 `console.log` + 用 `wrangler tail` 即時觀察
- 客端錯誤暫時不接 Sentry（付費），先用 `try / catch` + IndexedDB 寫入錯誤 log，使用者回報時取出

---

## 六、優先建議的「下一步」（免費方案版）

如果只能做三件事，先做：

1. ✅ **Dark Mode**（純 CSS，零成本，立即有感）
2. ✅ **Story Card 匯出器**（純客端 PNG，流量最大、最戳爆點）
3. ✅ **多照片 + Trip Wrapped**（純 IndexedDB + 客端統計，把 App 從「規劃工具」升級為「回憶相簿」）

這三件**完全不增加任何後端成本**，卻能把體驗質變。等使用者數成長、確認需要更多後端能力時，再評估：
- 加掛 R2（照片跨裝置同步）
- 升級 Workers Paid（10M req / month、$5 起跳）
- 切換 Gemini 付費模型

---

*此規劃僅針對「25 歲女性 IG 用戶」單一 persona，未涵蓋男性、家庭、商務出差等其他客群。實作前建議先抓 5 位真實使用者做 30 分鐘訪談驗證痛點排序。*
