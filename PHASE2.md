# Phase 2 變更記錄

第二階段在第一階段基礎上新增的功能、檔案、依賴與資料庫變更。所有變更集中於 `frontend-v2/` 與 `backend-v2/` 兩個資料夾，第一階段的 `frontend/` 與 `backend/` 完全保留。

> 線上版本目前仍指向第一階段；要切換至第二階段時，需更新 `.github/workflows/` 中的路徑與部署目標。

---

## 新增功能對應表

| 需求 | 實作位置 | Figma frame | 狀態 |
|---|---|---|---|
| 換頭貼 | 沿用第一階段 `ProfilePage.jsx` | — | ✅ |
| 活動內容換行 | `frontend-v2/src/pages/EventDetailPage.jsx`（`whiteSpace: pre-wrap` + `\n` 還原） | 活動詳細頁面2 Updated | ✅ |
| Google SSO（登入 + 註冊） | `frontend-v2/src/components/GoogleSSOButton.jsx`、`pages/LoginPage.jsx`、`pages/RegisterPage.jsx` | 註冊畫面 + SSO | ✅ |
| 取消活動再確認 | `frontend-v2/src/components/CancelConfirmDialog.jsx`（#FF4D4F + 雙按鈕）；後端時間卡控 `backend-v2/app/api/registrations.py` 搭配 `app/core/time.py` | 個人頁-取消活動確認頁面 | ✅ |
| 二階段篩選（台大官方分類 + #標籤） | 前端 `frontend-v2/src/pages/HomePage.jsx`（頂部 Tab + 下拉 chip）；後端 `?tag=` 過濾與 `EventTag` 表 | 活動首頁(登入後)+篩選條件 三張 | ✅（日期 filter UI 為佔位，未串接後端） |
| 供餐標記 | `frontend-v2/src/components/EventCard.jsx`（黃色 chip + 餐點 icon） | 活動首頁(登入後) | ✅ |
| 留言板（IG 風 + 按鈕、結束活動下拉、時間卡控、熱度排序、公開/私人/僅限群組） | `frontend-v2/src/pages/BoardPage.jsx`、`BoardPostDetailPage.jsx`、`components/BoardPostCreateDialog.jsx`；後端 `backend-v2/app/api/posts.py` 全面擴充 | 留言板首頁 / 留言內頁 / 新增留言 / 新增留言+活動下拉 / 新增留言+群組下拉 | ✅ |
| 群組（建立／編輯／邀請） | `frontend-v2/src/components/GroupEditDialog.jsx`；後端 `backend-v2/app/api/groups.py` + `models/group.py` | 建立 / 編輯群組 | ✅（Gmail 邀請僅以 DB 存儲，未串接寄信服務） |
| 多語系（繁中 / 英文） | `frontend-v2/src/i18n/{index.js, zh-TW.json, en.json}`、`components/LocaleSwitcher.jsx`、`components/Navbar.jsx` | 各頁面右上「繁體中文 ⌄」 | ⚠ 骨架完成；部分頁面內部 label 仍為硬編中文 |
| 年份消失 | `frontend-v2/src/utils/format.js`（`formatDate()` 確保顯示年份） | — | ✅ |
| 使用者角色（一般 / 管理者） | `frontend-v2/src/api/index.js` `mapUser` 加入 `isAdmin` 映射；`Navbar` 依 `isAdmin` 顯示新增活動按鈕 | — | ✅ |
| 留言板入口（與 logo 同列） | `frontend-v2/src/components/Navbar.jsx` | 留言板首頁 navbar | ✅ |
| 活動下原本評論功能取消（仍顯示） | `frontend-v2/src/pages/EventDetailPage.jsx`（原「寫評論」改為「至留言板分享」） | — | ✅ |

---

## 後端新增（`backend-v2/app/`）

### 模型 (`models/`)

| 檔案 | 內容 |
|---|---|
| `group.py`（新） | `Group / GroupMember / GroupInvitation` |
| `event.py`（擴充） | 新增 `EventTag` 表（`event_id, tag` 多對多） |
| `post.py`（擴充） | `Post` 新增欄位 `title`、`group_id`、`is_board_post` |

### Schemas (`schemas/`)

- `group.py`（新）：`GroupCreate / GroupUpdate / GroupOut / GroupDetailOut / GroupMemberOut / GroupInvitationOut / InviteCreate`
- `post.py`（重寫）：`visibility` 加入 `group` 選項；`PostCreate` 加入 `title / group_id / is_board_post` 與驗證器；`PostOut` 加入 `event_title / group_name / like_count / bookmark_count / comment_count`
- `event.py`（擴充）：`EventOut.tags` 欄位 + `TagOut` 類型

### Routers (`api/`)

| 端點 | 變更內容 |
|---|---|
| `POST /api/posts`（重寫） | `is_board_post=True` 時要求使用者對該活動有「成功報名」紀錄且活動已結束 |
| `GET /api/posts`（擴充） | 新增 `group_id / is_board_post / category / tag / keyword / tab=hot|mine|bookmarked|private`；可視性依登入者群組成員身份過濾 |
| `DELETE /api/registrations/{id}` | 活動已結束時回 409，禁止取消 |
| `GET /api/events`（擴充） | 新增 `?tag=` 過濾、關鍵字 case-insensitive 模糊比對 |
| `GET /api/events/tags`（新） | 列出所有標籤與使用次數 |
| `/api/groups/*`（新） | 群組 CRUD、Gmail 邀請、移除成員、撤銷邀請 |

### Core / DB Helpers

- `core/time.py`（新）：`parse_session_end()` / `session_has_ended()`，解析 `EventSession.raw_session_time` 為 Asia/Taipei 時區的 UTC 時間，作為「活動是否已結束」的依據
- `db/migrate.py`（新）：啟動時針對既有 `posts` 自動補欄位（`create_all()` 不會 ALTER 已存在表）
- `app/main.py`：註冊 `groups` router、呼叫 `run_startup_migrations()`

### Seed 流程 (`scripts/seed_events.py`)

- 新增 `seed_tags()`：讀取 `fetch_data/csv/events_tags.csv` 並插入 `event_tags` 表

---

## 前端新增（`frontend-v2/src/`）

### 頁面 (`pages/`)

| 檔案 | 路由 | 用途 |
|---|---|---|
| `BoardPage.jsx`（新） | `/board` | 留言板首頁：左側分類/我的/群組、中央留言列表、右側本週熱門、右下「+ 新增留言」浮動按鈕 |
| `BoardPostDetailPage.jsx`（新） | `/board/posts/:id` | 留言詳細頁，作者連結至個人頁 |
| `HomePage.jsx`（重寫） | `/` | 兩階段篩選 Tab + 下拉 chip + 關鍵字/日期/地點搜尋列 |
| `LoginPage.jsx` / `RegisterPage.jsx`（重寫） | `/login` `/register` | 共用 `GoogleSSOButton`；註冊頁 SSO 在頂部 |
| `EventDetailPage.jsx` / `RegistrationRecordPage.jsx` / `ProfilePage.jsx`（修改） | — | 評論入口改連結至留言板；取消按鈕串接確認 dialog；個人頁移除「+」新增按鈕（依規格不可由個人頁新增留言） |

### 元件 (`components/`)

| 檔案 | 用途 |
|---|---|
| `BoardPostCreateDialog.jsx`（新） | 新增留言 modal（活動下拉、群組下拉、評分、標題、內容、圖片、可視性、儲存草稿/發佈） |
| `CancelConfirmDialog.jsx`（新） | 取消報名確認 dialog（#FF4D4F） |
| `GoogleSSOButton.jsx`（新） | 登入與註冊共用的 Google SSO 按鈕 + 使用者名稱補填 dialog |
| `GroupEditDialog.jsx`（新） | 建立／編輯群組 dialog（含 Gmail 邀請與已邀請列表） |
| `LocaleSwitcher.jsx`（新） | 「繁體中文 ⌄ / English」切換 |
| `Navbar.jsx`（修改） | logo 同列加入「留言板」按鈕與 LocaleSwitcher |
| `EventCard.jsx`（修改） | 餐點 chip、`tags` 顯示、`formatDate()` 確保年份 |

### Utilities

- `i18n/{index.js, zh-TW.json, en.json}`（新）：react-i18next 設定與字串資源
- `utils/format.js`（新）：`formatDate()` 與 `isMealProvided()`
- `api/index.js`（擴充）：新增 `groupsApi / boardApi / eventsApi.tags`；`mapPost / mapUser / mapGroup` 補強欄位

### 新增依賴（`package.json`）

```
"i18next": "23.16.5",
"i18next-browser-languagedetector": "8.0.0",
"react-i18next": "15.1.1"
```

---

## 啟動 / 測試差異（與第一階段比較）

```bash
# 後端：首次啟動會自動補欄位；新增 tag seed 流程
cd backend-v2
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m scripts.seed_events    # 同時載入 events_tags.csv
uvicorn app.main:app --reload --port 8010

# 前端：需先安裝新增的 i18next 套件
cd frontend-v2
npm install
npm run dev
```

> 既有的第一階段 SQLite `dev.db` 可直接沿用；啟動時 `db/migrate.py` 會補上 `posts.title / group_id / is_board_post`。Postgres 同理。如需嚴謹遷移流程建議引入 Alembic。

---

## 已知待辦（移交 yaya / willy）

| 優先 | 項目 | 位置 |
|---|---|---|
| 高 | Waitlist 升至 success 時的使用者通知（目前僅資料庫狀態變更，無前端提示） | `backend-v2/app/api/registrations.py` 候補升級後 |
| 中 | 留言板頂部 Tab「台大官方分類 / #標籤分類」之子 chip 行 | `frontend-v2/src/pages/BoardPage.jsx` |
| 中 | 每日資料更新 cron（晚上抓新活動） | `.github/workflows/` |
| 低 | HomePage 日期區間 filter 串接後端 | `frontend-v2/src/pages/HomePage.jsx` |
| 低 | EventDetailPage / ProfilePage 內部硬編中文字串改用 i18n key | 各頁面 |
| 低 | 群組邀請 Email 寄送服務串接（目前僅資料庫存儲） | `backend-v2/app/api/groups.py` |
