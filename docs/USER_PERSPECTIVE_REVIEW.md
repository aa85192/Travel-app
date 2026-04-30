# Travel-app 雙視角審視與規劃

> **使用情境**：私人使用（本人 + 旅伴 2-4 人），非公開上架。免費額度綽綽有餘。
>
> **審視視角 A：25 歲女學生 IG 重度用戶**
> 小桃，25 歲台灣學生。每天滑 IG / Threads / 小紅書 2 小時以上，Y2K、韓系、可愛潮流。每年 2-3 次與閨蜜出國，主力韓日。對「視覺感」、「儀式感」極度敏感；但因為私用，**不需要病毒擴散與 Discover 策展**，重點轉為「自己看得爽 + 朋友圈內好用」。
>
> **審視視角 B：資深旅遊 App 工程師**
> 看冗餘、死碼、架構整潔度、長期維護成本。私用也要乾淨，因為使用者就是自己，技術債最後還是自己還。

---

## 一、目前優勢 (Already Loved 💗)

- **馬卡龍粉色主題 + 熊熊 BearIcons**：第一眼好感度高
- **收藏夾 (Collections)**：可貼 IG / 小紅書 / Threads 連結並分類
- **預算分帳 + 即時匯率**：閨蜜出國最痛點，已有 KRW↔TWD Visa 匯率
- **6 碼同步代碼**：免註冊就能多人共用一份行程
- **乾淨的 Store 分層**：tripStore / uiStore / settingsStore 職責清楚
- **CSS token 系統**：milk-tea 9 階 + 5 色 accent 都有用到，沒有死 token

---

## 二、雙視角發現 (Findings)

### 視角 A：IG 女學生看到的不足

> 因為「私用」，原規劃中的 Discover / 病毒分享 / 邀請卡儀式感 全部降級。

#### 🔴 P0 — 影響「每天想開」的核心體驗

| 缺口 | 現況 | 為何痛 |
|---|---|---|
| **照片功能極度貧弱** | Trip 只有單張 coverImage，Spot 只有單張 photo URL | 沒辦法當旅行相簿，回國只能再去翻相機膠卷 |
| **無旅行回顧 (Trip Wrapped)** | 行程結束後資料就靜止了 | 私用也想看「我們今年走了 87 公里、吃了 23 碗韓食」這種 |
| **無深色模式** | 只有淺色馬卡龍 | 機上、地鐵、被窩裡滑都刺眼 |
| **無打卡心情標記** | Spot 只能存名字地址，無感受 | 回顧時記不起「這家咖啡廳到底好不好喝」 |
| **Story 截圖醜** | 想分享行程到限動只能直接截圖 | 即使私用，發限動標朋友還是常見場景 |

#### 🟠 P1 — 影響「規劃前」與「玩中」黏著度

| 缺口 | 為何痛 |
|---|---|
| **無 OOTD 穿搭板** | 韓國行前一週都在配衣服 + 比天氣，現在要切到備忘錄 |
| **無採購 / 代買清單** | 「幫我買 Olive Young 的 XX」散在 LINE 對話被洗掉 |
| **無旅行日記 / 手帳** | 沒地方寫心情、貼貼紙、留拍立得感 |
| **天氣 × 穿搭未串接** | weatherService 已有，浪費 |
| **AI 對話 UI 缺席** | geminiSearchService 已接，但只用在搜景點，沒做成「問桃桃」對話 |

#### 🟡 P2 — 不做也沒差的錦上添花

- ~~Discover 策展熱門打卡點~~ → **私用不需要**，自己貼 IG 連結就夠
- ~~病毒式分享卡片 / 閨蜜邀請卡~~ → 降級為「Story 截圖好看」即可，不需要 QR code 邀請流程
- 旅行歌單 (Spotify 連結欄位即可，不做整合)
- 節慶限定主題（自己手動切色盤就好）
- 徽章 / 成就（私用無社交比較壓力，可有可無）
- 觸覺回饋、微互動（有預算再做）
- 多語對照（行前自己查也行）

---

### 視角 B：工程師看到的技術債

詳細審計結果如下表：

| # | 問題 | 嚴重度 | 動作 |
|---|---|---|---|
| B1 | `components/editor/ConfirmDialog.tsx` 與 `components/common/ConfirmDialog.tsx` 重複實作 | 🔴 | 刪除 editor 版，把 `TripInfoEditModal` / `DayEditModal` 改 import common 版（`isDangerous` → `variant="danger"`） |
| B2 | `BubbleLoader.tsx` **零引用** | 🟠 | 直接刪，需要時再寫 |
| B3 | `hooks/useLocalStorage.ts` **零引用**（被 Zustand persist 取代） | 🟠 | 刪除 |
| B4 | `types.ts` 中 `MerchantCategory` type alias **零引用** | 🟠 | 刪除 |
| B5 | `Trip.merchantCategories` / `attractionCategories` 只在 `data.ts` + `Home.tsx` 邊角使用，職責不清 | 🟠 | 評估是否合併進 `CollectionCategory` 主流程，或標記 `@deprecated` |
| B6 | 三個路由服務 `osrmService` / `kakaoDirectionsService` / `uberService` 各自被 `TransitCard.tsx` 直接呼叫 | 🟠 | 抽 `routingFacade.ts`，依 `mode + region` 派發；TransitCard 只看一個介面 |
| B7 | `placeSearchService` 已是 facade（Naver→Nominatim fallback），但 `SpotFormFields` 同時 import naver/gemini/wikipedia，職責散落 | 🟠 | 把 wikipediaPhoto 也納入 placeSearchService 的「自動補圖」流程，SpotFormFields 只看一個 API |
| B8 | `tripStore` 443 行單檔，含 Days / Spots / Transits / Todos / Expenses 五區塊 mutation | 🟢 但要監控 | 暫不拆，但加區塊註解。若 Phase 2 加 Outfit / Shopping 再考慮 slice 模式 |
| B9 | `cloudflare-worker.js` 存在於 repo 根目錄，沒有 deploy script、沒有 wrangler.toml | 🟠 | 加 `wrangler.toml` + 部署說明，避免「誰改了 worker 沒人知道」 |
| B10 | `passwords.ts` 把 hash 寫死在 client bundle | 🟢 私用可接受 | 註解標明「私用，不要 open source」即可 |
| B11 | `index.html` + `metadata.json` 是 AI Studio 殘留 | 🟢 | 確認 metadata.json 是否還有用，沒用就刪 |

> **私用情境補充**：B6 / B7 / B8 在公開 App 是必須重構，私用情境可以等到「下次想加新功能時順手做」，不必為了重構而重構。**B1-B5 是純粹的死碼，建議馬上清掉**（總時間 < 30 分鐘）。

---

## 三、改進規劃 (Roadmap)

> 標記說明：🟢 純客端、零成本　🟡 用既有免費額度即可　🔴 對免費方案有壓力（私用情境基本不會踩到）

### 🧹 Phase 0 — 清技術債 (半天)

> 動手之前先清死碼，避免新功能蓋在舊 bug 上。

- [ ] **B1** 合併 ConfirmDialog（保留 common 版本，刪 editor 版本，更新 2 處 import）
- [ ] **B2** 刪除 `components/common/BubbleLoader.tsx`
- [ ] **B3** 刪除 `hooks/useLocalStorage.ts`
- [ ] **B4** 刪除 `types.ts` 內 `MerchantCategory` type alias
- [ ] **B5** 評估 `merchantCategories` / `attractionCategories` 是否要合併或刪除（看 Home.tsx 實際使用）
- [ ] **B11** 確認 `metadata.json` 是否還有用途，沒用就刪
- [ ] **B9** 補 `wrangler.toml` 與 worker 部署 README 段落

完成後跑 `npm run lint`（即 `tsc --noEmit`）確認沒破壞型別。

---

### 🚀 Phase 1 — 「拍照即回憶」基底 (2-3 週)

> 目標：讓 App 從「規劃工具」進化為「旅行相簿」。全部 🟢 純客端。

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

### 🎀 Phase 2 — 「玩中好用」實戰層 (2-3 週)

> 私用情境刪除了 Discover 策展與邀請卡儀式感，聚焦真正會用到的功能。

5. **OOTD / 穿搭板** 🟢
   - 新頁面 `Outfit.tsx`：每天一格，貼穿搭參考圖、寫單品清單
   - 圖片同照片策略（IndexedDB local-first）
   - 串既有 weatherService → 「明天 12°C，建議大衣 + 圍巾」
   - 行李清單 sub-section：自動聚合每日 outfit 的單品 → 打包 checklist

6. **採購 / 代買清單** 🟢
   - TodoList 擴充 `type: 'task' | 'shopping'`（B5 的 merchantCategories 可在這裡找到歸宿）
   - 購物項可指派「幫誰買 / 預算上限 / 店家」
   - 勾掉時一鍵建立 expense → 與預算頁打通
   - 結算時自動算誰欠誰多少（沿用既有 settlement.ts）

7. **AI 旅行管家對話框** 🟡
   - 浮動 FAB（熊熊頭）→ 開啟 bottom sheet 對話
   - 預設快捷：「弘大咖啡廳」「這天太空幫我排」「雨備方案」「韓妞必買」
   - 用既有 `geminiSearchService`，只缺 streaming UI
   - **私用免費額度保護**（即使只有 2-4 人也順手做）：
     - 客端 debounce 1 秒、答案 ≤200 字
     - localStorage 快取常見 prompt 結果 7 天
     - 不顯示倒數（私用無濫用風險），但記錄當日呼叫次數方便除錯

8. **打卡心情 + 一句話** 🟢
   - `Spot` 加 `mood?: 'love' | 'wow' | 'meh' | 'cry'` + `note: string`
   - 卡片右上小貼紙呈現
   - Trip Wrapped 可統計「最 ❤️ 的景點」、「最 😭 的踩雷」

---

### ✨ Phase 3 — 「回國後還想打開」回憶層 (2 週)

> 私用情境也想看回顧、也想做手帳，這層是「為自己做」。

9. **旅行回顧 (Trip Wrapped)** 🟢
   - 行程結束自動產生：天數、走路公里、料理 emoji、總花費、最 ❤️ 景點、最常一起出現的旅伴 emoji
   - Spotify Wrapped 風格分頁滑動，每頁可獨立匯出 PNG（私用主要是自己留念）
   - 純客端統計，沿用 settlement.ts 模式

10. **手帳日記模式** 🟢
    - 每日一頁貼照片、寫心情、選天氣 / 心情貼紙
    - 6-8 款 SVG 貼紙（拍立得、票根、章戳），打包進 bundle
    - 照片走 IndexedDB

11. **照片地圖** 🟢
    - MapPage 圖層：去過的點 → 照片小圓 pin（縮圖從 IndexedDB 讀）
    - 縮放聚合成「足跡」線
    - Kakao Map 已整合，零新增成本

12. **PWA「加到主畫面」+ 行前提醒** 🟡
    - `manifest.json` + service worker：用 `vite-plugin-pwa`
    - 行前提醒用 **Notification Trigger API**（本地排程，不需後端）
    - iOS Safari fallback：開 App 時顯示倒數 banner

> ⚠️ **私用情境下確定不做的功能**：
> - Discover 熱門打卡點策展（自己貼 IG 連結即可）
> - 閨蜜邀請卡 / QR 流程（6 碼直接 LINE 傳就好）
> - 病毒式分享機制
> - 徽章 / 成就（無社交比較需求）
> - 多語對照（自己查得動）

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

### 5.1 現況後端盤點（私用情境）

| 服務 | 免費額度 | 私用 (2-4 人) 實際用量估計 | 風險 |
|---|---|---|---|
| Cloudflare Workers | 100k req / day | 匯率代理 + sync ≈ 數十 req / day | 🟢 完全無風險 |
| Cloudflare KV | 1GB / 1k writes / day / 25MB 單值 | 一天最多手動同步幾次 ≈ 數 write | 🟢 完全無風險 |
| Gemini API | 依模型 RPM / RPD | AI 對話私用約幾十次 / 趟旅行 | 🟢 加客端快取後幾乎不踩 |
| 照片儲存 | **無後端** | 一趟旅行 200-500 張 | 🟠 不能塞 KV，需 IndexedDB |

**結論**：私用情境免費額度是富餘的，**不需要把寫入降頻成「手動同步」**。維持自動 sync 即可，反而提升閨蜜共用體驗。

### 5.2 設計鐵則

1. **照片永遠不進 KV**
   - KV 單值 25MB / 總量 1GB / 寫入 1k 一天 — 任何情境都不適合存圖
   - 一律走客端 **IndexedDB**（local-first）+ 壓縮（WebP / Q=0.8 / 長邊 1280）
   - 若未來要跨裝置同步照片，加掛 **Cloudflare R2**（10GB 免費）並在 sync 時上傳，但 Phase 1-3 暫不啟用

2. **sync payload 控制體積**
   - payload 只放結構化資料（行程、景點、todo、花費）
   - 照片只存 `photoId` 參考、不存 base64
   - 估算：100 個景點 + 完整 metadata ≈ 30-80KB，遠低於 25MB 單值上限

3. **寫入頻率**（私用情境放寬）
   - 維持既有 sync 邏輯，加 debounce 3 秒避免亂寫
   - 不需要降頻為手動同步，2-4 人共用一天不會超過 50 次寫入

4. **AI 用量保護**
   - 客端快取 prompt → 答案 7 天（localStorage）
   - 答案壓縮到 ≤200 字省 token
   - 私用無濫用風險，不顯示倒數，但保留 console log 供除錯

5. **靜態資料優先**
   - 貼紙資源、徽章定義 → 打包進 bundle
   - 不為「未來可能動態更新」開 KV / API

6. **推播用本地排程**
   - 用 Notification Trigger API（PWA 本地排程），不做 Web Push 訂閱中心
   - iOS Safari fallback 為開 App 時顯示倒數 banner

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

## 六、優先建議的「下一步」（私用 × 雙視角版）

### 第一週：清債 + Dark Mode（半天 + 半天）

1. **Phase 0 全部清掉**（B1-B5、B11，半天）
2. **Dark Mode**（半天，純 CSS 切換）

立刻有感，也讓接下來的開發站在乾淨的地基上。

### 第二週：照片基底 + Story Card

3. **多照片 + IndexedDB 儲存**（2-3 天）
4. **Story Card 匯出器**（1-2 天）

這兩件是後續 Trip Wrapped、手帳、照片地圖的共用基礎。

### 第三週起：依當下旅行需求挑功能

依照下一趟出國前 1 個月，挑 Phase 2 中最需要的（例如：要去韓國就先做 OOTD + 採購清單）。**私用情境的好處是可以「即時為自己做」，不用為了不存在的使用者過度設計**。

### 工程師角度的長期叮嚀

- B6（routing facade）/ B7（search facade）/ B8（tripStore 切片）**等到下次要動那塊功能時順手做**，不要為重構而重構
- 每加一個新欄位都要進 `types.ts`，避免散落 magic string
- 新功能優先用既有 token 與既有元件（例如 Outfit 的卡片直接複用 SpotCard 的視覺語言）

---

*雙視角審視於 2026-04-30 完成。情境：私人使用（本人 + 旅伴）。下次審視觸發點：當行程數 > 5 趟、或考慮對外公開時，重新評估 Discover / 邀請卡 / 推播訂閱中心等被刪減項目。*
