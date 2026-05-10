# Phase 2 變更記錄

第二階段在第一階段基礎上新增的功能、檔案、依賴與資料庫變更。所有變更集中於 `frontend-v2/` 與 `backend-v2/` 兩個資料夾，第一階段的 `frontend/` 與 `backend/` 完全保留。

> **2026-05-10 起，線上版本已切換至第二階段。** `.github/workflows/deploy.yml` 透過 GitHub Actions Variables `BACKEND_DIR` / `FRONTEND_DIR` 切換 v1 / v2，目前兩者皆設為 `backend-v2` / `frontend-v2`；切版只需到 Repo Settings → Actions Variables 改值即可，不需要動 workflow。
> 部署架構同時從 ECS Fargate 改為 EC2 + docker-compose（單機跑 backend / postgres / caddy），CSV 與 scripts 透過 read-only volume 掛入。

---

## 新增功能對應表

| 需求 | 實作位置 | Figma frame | 狀態 |
|---|---|---|---|
| 換頭貼 | 沿用第一階段 `ProfilePage.jsx` | — | ✅ |
| 活動內容換行 | `frontend-v2/src/pages/EventDetailPage.jsx`（`whiteSpace: pre-wrap` + `\n` 還原） | 活動詳細頁面2 Updated | ✅ |
| Google SSO（登入 + 註冊） | `frontend-v2/src/components/GoogleSSOButton.jsx`、`pages/LoginPage.jsx`、`pages/RegisterPage.jsx` | 註冊畫面 + SSO | ✅ |
| 取消活動再確認 | `frontend-v2/src/components/CancelConfirmDialog.jsx`（#FF4D4F + 雙按鈕）；後端時間卡控 `backend-v2/app/api/registrations.py` 搭配 `app/core/time.py` | 個人頁-取消活動確認頁面 | ✅ |
| 二階段篩選（台大官方分類 + #標籤） | 前端 `HomePage.jsx` / `BoardPage.jsx`（頂部 Tab + 下拉 chip + 母活動橫向捲動 / 標籤 wrap）；後端 `?category=` / `?tag=` / `?date=` 過濾與 `EventTag` 表 | 活動首頁(登入後)+篩選條件 三張 | ✅ 日期 filter 已串接後端（2026-05-11）；地點 field 經討論後移除 |
| 供餐標記 | `frontend-v2/src/components/EventCard.jsx`（黃色 chip + 餐點 icon） | 活動首頁(登入後) | ✅ |
| 留言板（IG 風 + 按鈕、結束活動下拉、時間卡控、熱度排序、公開/私人/僅限群組） | `frontend-v2/src/pages/BoardPage.jsx`、`BoardPostDetailPage.jsx`、`components/BoardPostCreateDialog.jsx`；後端 `backend-v2/app/api/posts.py` 全面擴充 | 留言板首頁 / 留言內頁 / 新增留言 / 新增留言+活動下拉 / 新增留言+群組下拉 | ✅ |
| 群組（建立／編輯／邀請） | `frontend-v2/src/components/GroupEditDialog.jsx`；後端 `backend-v2/app/api/groups.py` + `models/group.py` | 建立 / 編輯群組 | ✅（Gmail 邀請僅以 DB 存儲，未串接寄信服務） |
| 多語系（繁中 / 英文） | `frontend-v2/src/i18n/{index.js, zh-TW.json, en.json, tagLabels.js}`、`components/LocaleSwitcher.jsx`、`components/Navbar.jsx` | 各頁面右上「繁體中文 ⌄」 | ⚠ 骨架完成 + DB-driven tag/category 透過 `tagLabels.js` 翻譯（2026-05-11）；個別頁面內硬編中文字串仍待清理 |
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
| 中 | 群組邀請 Email 寄送服務串接（目前僅資料庫存儲） | `backend-v2/app/api/groups.py` |
| 中 | EventDetailPage / ProfilePage 內部硬編中文字串改用 i18n key（部分 chip / tab label 已透過 `i18n/tagLabels.js` 翻譯） | 各頁面 |
| 低 | CloudFront SPA fallback：`/profile` 直接 reload 出現 AccessDenied，需在 CloudFront Custom Error Response 將 403/404 → `/index.html` 200 | AWS CloudFront 設定 |
| 低 | Codex audit 殘留 LOW 4 件：blob URL resolveUrl miss / isUpcoming malformed date / 空 avatarUrl 送出 / 其他 cleanup（commit `83114f8` / `6b16eae` / `74b4288` 內紀錄） | 散落多處 |

### 已解決（2026-05-10 ～ 05-11）

由本次密集 bug bash 補完的待辦項目（commit `83114f8` / `6b16eae` / `74b4288`）：

- ✅ 留言板頂部 Tab「台大官方分類 / #標籤分類」之子 chip 行 — 「台大官方分類」現以 **母活動名 (`activity_name_activity_session`)** 為單位（e.g. VISION 微才博覽會），「#標籤分類」 為自訂主題標籤（工作坊、競賽、徵才、講座 等）
- ✅ 每日資料更新 — `backend-v2/app/main.py` lifespan 啟動 APScheduler，每日 02:00 Asia/Taipei 自動跑 `scripts.seed_events`
- ✅ HomePage 日期 filter 串接後端 — `/api/events?date=YYYY-MM-DD` 過濾「於指定日期或之後仍有場次」的活動
- ✅ 圖片 URL：`mapPost.images` / `mapEvent.image` / `myRegistrations.event_image` 自動 prepend baseURL
- ✅ 群組投稿可視性：owner 自動視為 GroupMember，list_posts 同時包含 `owned_groups`
- ✅ 已結束活動拒絕報名（backend 409） + EventDetailPage CTA 自動 disable + 「活動已結束」label
- ✅ 愛心 / 收藏冪等性：endpoint 由 204 改為 200 + `{liked|bookmarked, _count}`，frontend 同步用 server truth；list 端點補回 `is_liked` / `is_bookmarked` 避免初始狀態錯誤
- ✅ ProfilePage：「即將到來」 tab 排除已結束 / 取消按鈕串接確認 dialog / 日曆年份顯示恢復
- ✅ Navbar 加上「我的群組」 menu / drawer 入口
- ✅ ProfilePage 新增「我的留言」 Tab：列出使用者過去留言，每筆可點選跳回原 board post / event detail
- ✅ i18n：DB-driven 標籤 / 分類在 `frontend-v2/src/i18n/tagLabels.js` 提供繁中 → 英文 fallback dict

---

## 第二階段 schema / pipeline 後續更新（2026-05-11）

### Backend
- `Event.official_category`（新欄位，String 100, indexed, nullable）：儲存母活動名 (`activity_name_activity_session`)，作為「台大官方分類」filter 的後端 source。`backend-v2/app/db/migrate.py` 啟動時自動 ADD COLUMN
- `RegistrationDetailOut` 新增 `category` / `official_category` 欄位（給留言板新增 dialog 的活動分組使用）
- `PostOut` 加上 `is_liked` / `is_bookmarked`（per viewer 狀態）；`PostDetailOut` 不再重複定義
- `GET /api/events/categories`：回傳 `COALESCE(official_category, title) + count(EventSession)` 並依場次數降序排
- `GET /api/events`：新增 `?date=YYYY-MM-DD` filter；`?category=` OR-match `official_category` / `title` / 舊 `category`
- `POST/DELETE /api/posts/{id}/like` / `bookmark` / `events/{id}/bookmark`：回傳 200 + JSON body（替代舊 204）

### Pipeline
- `fetch_data/process_data.py` 新增 9 個 boolean tag column：
  - `tag_english`（英文學習）/ `tag_career`（職涯分享）— 關鍵字掃描
  - `tag_workshop` / `tag_competition` / `tag_recruitment` / `tag_lecture` / `tag_course` / `tag_seminar` / `tag_growth_group` — `activity_type` 主部分類
- `fetch_data/build_tags_table.py` 對應更新 `TAG_LABELS`，產出的 `events_tags.csv` 同時包含舊 7 種 + 新 9 種
- `backend-v2/scripts/seed_events.py` 新增 `extract_official_category()` 提取母活動名；`Event.title` 來源從 `activity_name_event_page` 改為 `activity_name_activity_session` 優先；既有 row 啟動時 backfill

### Frontend
- `frontend-v2/src/i18n/tagLabels.js`（新）：DB tag 名稱繁中 → 英文 fallback dict
- `HomePage.jsx` / `BoardPage.jsx` 第二層 chip 行：母活動 chip 為橫向捲動 + Top 15，標籤 chip 為 wrap；雙模均顯示一行 hint 說明差異
- `EventCard.jsx` / `EventDetailPage.jsx`：分類 chip 改用 `event.category`（活動類型）translate 過後顯示
- `Navbar.jsx`：使用者下拉選單新增「我的群組」
