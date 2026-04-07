# NTU EventConnect

台大校園活動的整合平台 — 把 `my.ntu.edu.tw/actregister` 上分散的活動資料抓下來，加上貼文、評分、收藏與報名紀錄等社群功能，讓學生用一個介面瀏覽所有校內活動。

> 軟體工程課期末專案

## 架構

```
NTU-EventConnect/
├── frontend/         # Vite + React 19 + MUI 7（demo 主體）
├── backend/          # 之後要做的 API（目前只有爬蟲試驗碼）
└── fetch_data/       # 一次性 ETL：把校網爬下的 csv 轉成前端用的 JSON
    ├── crawl_first/second/third.py   # 三層爬蟲
    ├── csv/                          # 爬蟲產物（活動列表 / 母活動 / 場次）
    └── build_mock.py                 # 把 events.csv 轉成 events.generated.json
```

資料流：

```
my.ntu.edu.tw → crawl_*.py → csv/events.csv → build_mock.py
                                                    ↓
                                  frontend/src/mock/events.generated.json
                                                    ↓
                              import 進 data.js → bundle 進 React build
```

前端目前是純前端 demo，沒有後端 API。所有活動資料在 build time 就 inline 進 JS bundle，所以部署到 Vercel / Netlify 等靜態 host 即可。

## 開發環境

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # 產 dist/
```

需要 Node.js 18+。

### ETL（產真實活動資料）

```bash
# 在專案根目錄
python -m venv venv
source venv/Scripts/activate    # Windows Git Bash
# 或 venv\Scripts\activate     # PowerShell

pip install -r requirements.txt   # bs4, requests
python fetch_data/build_mock.py    # 產 frontend/src/mock/events.generated.json
```

跑完後前端 `npm run dev` 就會吃到新版資料。

## ⚠️ 套件版本鎖定（重要）

為了避免 npm / PyPI 供應鏈投毒攻擊，**所有相依套件都必須鎖版本，禁止使用發布未滿 7 天的版本**。

### Frontend

`package.json` 中的關鍵套件版本：

| 套件 | 鎖定版本 | 備註 |
|---|---|---|
| **axios** | **`1.14.0`** | ⚠️ **必須使用精確版本，不可加 `^`/`~`**。曾發生攻擊者推 patch 版內含惡意 code 的事件，鎖死才安全 |
| react | `^19.2.4` | |
| react-router-dom | `7.13.2` | |
| @mui/material | `^7.3.9` | |
| vite | `^8.0.1` | |

新增任何套件前請：

1. 先 `npm view <package> time` 確認最新版本發布超過 7 天
2. 不夠 7 天請退回上一個穩定版本
3. 在 `package.json` 用**精確版本**寫死（特別是 `axios` 這類碰網路 IO 的）
4. 確保 `package-lock.json` 一定要 commit 進 repo

### Backend / ETL

Python 套件在 `requirements.txt` 用 `==` 鎖版本，不要用 `>=`。

## 部署

前端走 Vercel：

1. Vercel → Add New Project → Import 此 repo
2. **Root Directory** 設成 `NTU-EventConnect/frontend`
3. Framework Preset 自動偵測 Vite，Build `npm run build`、Output `dist`
4. Deploy

每次 push 到 main 自動 redeploy。

## Pixel-perfect 進度

詳見 [`frontend/PIXEL_PERFECT_LOG.md`](frontend/PIXEL_PERFECT_LOG.md)。所有頁面已對齊 Figma 設計稿
（[活動平台 design](https://www.figma.com/design/GgNiPSWQf4i99rKFdsDC3c)）。
