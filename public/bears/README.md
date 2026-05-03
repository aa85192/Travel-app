# 熊熊圖檔

把客製化的熊熊圖（已去背的 PNG）放在這個資料夾，就會自動取代下方導航的內建 SVG。

## 對應檔名

| 頁籤 | 檔名 |
|---|---|
| 首頁 | `首頁.png` |
| 行程 | `行程.png` |
| 待辦 | `LIST.png` |
| 地圖 | `MAP.png` |
| 預算 | `COST.png` |
| 設定 | `SETTING.png` |

不存在的檔案 App 會自動 fallback 到內建 SVG 熊。

## 規格建議

- **格式**：PNG（去背）
- **尺寸**：256×256 上下，正方形最理想
- **檔案大小**：**≤ 100 KB / 張**（用 [tinypng.com](https://tinypng.com) 或 [squoosh.app](https://squoosh.app) 壓）
- **背景**：透明

## ⚠️ 警告

太大的 PNG 會讓 App 讀很久、很耗流量。每張原始檔可能 4-6 MB，務必壓到 100 KB 以下再覆蓋上來。
