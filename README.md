# NTU EventConnect

台大校園活動整合平台 — 把 [`my.ntu.edu.tw/actregister`](https://my.ntu.edu.tw/actregister) 上分散的活動資料抓下來，加上留言板、群組、收藏、報名紀錄、個人行事曆、i18n 等社群功能，讓學生用一個介面瀏覽所有校內活動。

> 軟體工程課期末專案

**線上網址：** <https://d1tz6syfib05nx.cloudfront.net/>

> 程式碼分成兩個世代：v1（`frontend/` + `backend/`）與 v2（`frontend-v2/` + `backend-v2/`）。**生產環境目前指向 v2**，本文件以 v2 為主。

---

## 目錄

- [功能](#功能)
- [技術棧](#技術棧)
- [架構](#架構)
- [Quick Start](#quick-start)
- [完整安裝](#完整安裝)
  - [事前準備](#事前準備)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [ETL（產真實活動資料）](#etl產真實活動資料)
- [資料庫：SQLite ↔ PostgreSQL](#資料庫sqlite--postgresql)
- [API 路由總覽](#api-路由總覽)
- [前端頁面路由](#前端頁面路由)
- [專案結構](#專案結構)
- [常見開發任務](#常見開發任務)
- [套件版本鎖定規則](#套件版本鎖定規則)
- [部署](#部署)
- [疑難排解](#疑難排解)

---

## 功能

- **活動瀏覽**：分類篩選、多標籤 AND 篩選（免費/餐點/即將到來…）、關鍵字搜尋、日期區間、熱門排序
- **留言板（Board）**：發文、評分、圖片（最多 4 張）、按讚、收藏、草稿、公開 / 私人 / 群組可見
- **群組系統**：建立群組、邀請成員、群組限定貼文
- **個人行事曆**：標出有報名的日子，點擊跳轉活動詳情
- **收藏 / 報名**：活動與貼文皆可收藏；報名場次有候補自動遞補機制
- **個人資料**：頭貼上傳、自介、我的留言 / 報名 / 收藏 / 草稿 / 活動管理
- **通知中心**：即將到來的活動提醒、我的留言板動態、群組新貼文
- **登入**：本地帳密 + Google OAuth，密碼重設 via 電子郵件
- **i18n**：繁體中文 / English 即時切換
- **RWD**：手機 / 平板 / 桌面自適應排版
- **管理員工具**：建立 / 編輯活動、查看 & 匯出報名名單
- **資料來源**：從台大活動報名網站爬取 336 場真實活動、1217 個場次；每日 02:00 自動 reseed

---

## 技術棧

| 層 | 技術 |
|---|---|
| **Frontend** | Vite 8 + React 19 + MUI 7 + react-router-dom 7 + axios + react-i18next + @mui/x-date-pickers + date-fns |
| **Backend** | FastAPI 0.115 + SQLAlchemy 2.0 + Pydantic 2 + uvicorn + APScheduler 3.10 + python-jose（JWT）+ passlib（bcrypt） |
| **資料庫** | SQLite（預設）/ PostgreSQL（透過 `DATABASE_URL` 切換） |
| **ETL** | requests + BeautifulSoup（三層爬蟲） |
| **CI/CD** | GitHub Actions → S3 + CloudFront（前端）/ EC2 docker-compose（後端） |

---

## 架構

```
NTU-EventConnect/
├── frontend-v2/      # Vite + React 19 + MUI 7  ← 生產用
├── backend-v2/       # FastAPI + SQLAlchemy       ← 生產用
├── frontend/         # v1（保留，未修改）
├── backend/          # v1（保留，未修改）
└── fetch_data/       # ETL：三層爬蟲 + CSV → DB
```

**資料流：**

```
my.ntu.edu.tw → crawl_*.py → fetch_data/csv/events.csv
                                        │
                          ┌─────────────┘
                          ▼
                   seed_events.py  ←─── APScheduler（每日 02:00）
                          │
                          ▼
              PostgreSQL / SQLite（DB）
                          │
                          ▼
              FastAPI /api/* ←→ React frontend
```

後端對外暴露 10 組 router（auth / events / posts / comments / bookmarks / registrations / users / uploads / groups / notifications）。SQLAlchemy 走 `DATABASE_URL` 自動分派 SQLite 或 PostgreSQL dialect，**程式碼層完全不用改**。

---

## Quick Start

開兩個 terminal：

```bash
# Terminal 1 — Backend
cd backend-v2
python -m venv venv
source venv/bin/activate           # macOS/Linux
# source venv/Scripts/activate     # Windows Git Bash
# .\venv\Scripts\Activate.ps1      # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

```bash
# Terminal 2 — Frontend
cd frontend-v2
npm install
npm run dev
```

打開 <http://localhost:5173>，完工。

> 後端跑 `8010` 是因為 Windows 上 8000 經常被 Hyper-V / WSL2 保留住。Linux/Mac 可以用 `--port 8000`。

---

## 完整安裝

### 事前準備

| 工具 | 版本 | 下載 |
|---|---|---|
| Git | latest | <https://git-scm.com/> |
| Node.js | **18+** | <https://nodejs.org/> |
| Python | **3.10+** | <https://www.python.org/downloads/>（Windows 安裝時務必勾「Add Python to PATH」） |

確認三個都裝好：

```bash
git --version
node -v
python --version    # Windows 也可以用 py --version
```

#### Windows 額外設定（PowerShell 啟動 venv 用得到）

```powershell
# 用系統管理員身分開 PowerShell，跑一次：
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Frontend

```bash
cd frontend-v2
npm install
npm run dev          # 預設 http://localhost:5173
npm run build        # 產 dist/
npm run preview      # 預覽 dist/
npm run lint         # ESLint
npm test             # vitest
```

如果你想讓 frontend 連到非預設的後端 URL，在 `frontend-v2/` 建一個 `.env.local`：

```env
VITE_API_URL=http://localhost:8010
VITE_GOOGLE_CLIENT_ID=your-google-client-id   # Google OAuth 用，可選
```

設完要**重啟 `npm run dev`**（vite 對環境變數的改動不會 HMR）。

### Backend

```bash
cd backend-v2

# 1. 建虛擬環境（只要做一次）
python -m venv venv

# 2. 啟用 venv
source venv/bin/activate           # macOS/Linux
# source venv/Scripts/activate     # Windows Git Bash
# .\venv\Scripts\Activate.ps1      # Windows PowerShell

# 3. 安裝依賴
pip install -r requirements.txt

# 4. （可選）建立 .env 設定環境變數
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./dev.db
JWT_SECRET=change-me-in-prod
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177
GOOGLE_CLIENT_ID=your-google-client-id
EOF

# 5. 啟動
uvicorn app.main:app --reload --port 8010
```

#### 確認啟動成功

- Health check：<http://localhost:8010/api/health> → `{"status":"ok"}`
- Swagger UI（可直接測 API）：<http://localhost:8010/docs>
- ReDoc：<http://localhost:8010/redoc>

#### 灌種子資料（可選）

第一次啟動會自動建表但**不會**有資料。要讓 API 有東西回，跑：

```bash
python -m scripts.seed_admin     # 建一個 admin 帳號（admin@ntu.edu.tw / Admin123!）
python -m scripts.seed_events    # 灌活動資料（讀 fetch_data/csv/events.csv）
```

管理員白名單放在 `backend-v2/admin_whitelist.txt`，每行一個 email。

#### 跑測試

```bash
pytest
```

> pytest 使用 in-memory SQLite fixture，不會污染開發 DB。

### ETL（產真實活動資料）

```bash
# 在專案根目錄，使用 backend-v2 的 venv
source backend-v2/venv/bin/activate

# 三層爬蟲（會花一段時間）
python fetch_data/crawl_first.py
python fetch_data/crawl_second.py
python fetch_data/crawl_third.py

# 後處理（標籤表 + 活動分類）
python -m fetch_data.process_data
python -m fetch_data.build_tags_table

# 灌進 DB
cd backend-v2
python -m scripts.seed_events
```

`seed_events.py` 是 idempotent，重複跑不會產生重複資料。

---

## 資料庫：SQLite ↔ PostgreSQL

**同一份程式碼支援兩種 DB**，差別只在 `DATABASE_URL`。

| 模式 | 適用情境 | 設定難度 |
|---|---|---|
| **SQLite**（預設） | 本機開發、單人測試、Demo | 零設定 |
| **PostgreSQL** | 多人共用、部署、Staging/Prod | 需要 DB server + 連線字串 |

### 模式 A：SQLite（預設）

什麼都不用設。`backend-v2/app/core/config.py` 預設 `DATABASE_URL=sqlite:///./dev.db`，第一次啟動自動建表。

```bash
cd backend-v2
uvicorn app.main:app --reload --port 8010
```

`dev.db` 已被 `.gitignore` 排除。

### 模式 B：PostgreSQL

#### B-1. 啟動一個 Postgres

```bash
# Docker（最快）
docker run --name eventconnect-pg -d \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eventconnect \
  -p 5432:5432 \
  postgres:16
```

#### B-2. 設 `.env`

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/eventconnect
```

> scheme **一定要是 `postgresql+psycopg://`**（psycopg v3 driver）。

雲端 Postgres 通常強制 SSL：
```env
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db?sslmode=require
```

#### B-3. 啟動 & 建表

```bash
uvicorn app.main:app --reload --port 8010
# 第一次啟動自動 create_all
```

### 切回 SQLite

把 `.env` 的 `DATABASE_URL` 改回 `sqlite:///./dev.db` 重啟即可。兩個 DB 的資料**不會自動搬移**。

---

## API 路由總覽

完整 schema 看 <http://localhost:8010/docs>（Swagger UI 直接可以打）。

### Auth

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `POST` | `/api/auth/register` | 帳密註冊 | - |
| `POST` | `/api/auth/login` | 帳密登入（回 JWT） | - |
| `POST` | `/api/auth/google` | Google OAuth 登入 | - |
| `GET` | `/api/auth/me` | 取得目前登入使用者 | Yes |
| `POST` | `/api/auth/forgot-password` | 發送密碼重設信 | - |
| `POST` | `/api/auth/reset-password` | 重設密碼（用信中 token） | - |

### Events

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/events` | 活動列表（`category` / `tag` / `tags` / `keyword` / `date` / `date_to` / `sort=hot` / `page` / `size`） | - |
| `GET` | `/api/events/categories` | 所有母活動分類 + 數量 | - |
| `GET` | `/api/events/tags` | 所有標籤 + 數量 | - |
| `GET` | `/api/events/managed` | 我建立的活動（管理員） | Yes |
| `POST` | `/api/events` | 建立活動（管理員） | Yes |
| `PATCH` | `/api/events/{event_id}` | 編輯活動（建立者） | Yes |
| `GET` | `/api/events/{event_id}` | 活動詳情（含所有場次） | - |
| `GET` | `/api/events/{event_id}/sessions/{session_id}` | 場次詳情 | - |
| `GET` | `/api/events/{event_id}/registrations` | 活動的報名名單（建立者） | Yes |

**熱門排序**：`sort=hot` 依「被收藏次數」由多到少排序。  
**即將到來**：送 `date=YYYY-MM-DD` 只回傳有場次 ≥ 該日期的活動。  
**多標籤 AND**：`tags=免費餐點,工作坊`（逗號分隔，必須同時符合所有標籤）。

### Posts（留言板）

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/posts` | 貼文列表（`tab=all/hot/new/mine/bookmarked/private` / `group_id` / `event_id` / `is_board_post` / 分頁） | - |
| `POST` | `/api/posts` | 發貼文 | Yes |
| `GET` | `/api/posts/{post_id}` | 貼文詳情（含留言、讚/收藏狀態） | - |
| `PATCH` | `/api/posts/{post_id}` | 編輯貼文（作者） | Yes |
| `DELETE` | `/api/posts/{post_id}` | 刪除貼文（作者） | Yes |
| `POST` | `/api/posts/{post_id}/comments` | 新增留言 | Yes |
| `POST` | `/api/posts/{post_id}/like` | 按讚（冪等） | Yes |
| `DELETE` | `/api/posts/{post_id}/like` | 取消讚 | Yes |
| `POST` | `/api/posts/{post_id}/bookmark` | 收藏貼文（冪等） | Yes |
| `DELETE` | `/api/posts/{post_id}/bookmark` | 取消收藏貼文 | Yes |

### Comments

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `PATCH` | `/api/comments/{comment_id}` | 編輯留言（作者） | Yes |
| `DELETE` | `/api/comments/{comment_id}` | 刪除留言（作者） | Yes |

### Groups

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/groups` | 我加入的群組列表 | Yes |
| `POST` | `/api/groups` | 建立群組 | Yes |
| `GET` | `/api/groups/{group_id}` | 群組詳情（含成員） | Yes |
| `PATCH` | `/api/groups/{group_id}` | 更新群組名稱（建立者） | Yes |
| `DELETE` | `/api/groups/{group_id}` | 刪除群組（建立者） | Yes |
| `POST` | `/api/groups/{group_id}/invite` | 邀請成員（寄出邀請） | Yes |
| `DELETE` | `/api/groups/{group_id}/members/{user_id}` | 移除成員 | Yes |
| `DELETE` | `/api/groups/{group_id}/invitations/{invite_id}` | 撤銷邀請 | Yes |

### Bookmarks & Registrations

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `POST` | `/api/events/{event_id}/bookmark` | 收藏活動（冪等） | Yes |
| `DELETE` | `/api/events/{event_id}/bookmark` | 取消收藏活動 | Yes |
| `GET` | `/api/users/me/bookmarks/events` | 我收藏的活動 | Yes |
| `GET` | `/api/users/me/bookmarks/posts` | 我收藏的貼文 | Yes |
| `POST` | `/api/sessions/{session_id}/register` | 報名場次（額滿自動進候補） | Yes |
| `DELETE` | `/api/registrations/{reg_id}` | 取消報名（自動遞補候補） | Yes |
| `GET` | `/api/users/me/registrations` | 我的報名紀錄 | Yes |

### Users

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/users/{user_id}` | 使用者公開資料（含留言數、參加活動數） | - |
| `PATCH` | `/api/users/me` | 更新自己的資料（name / bio / avatar_url / department / student_id） | Yes |
| `GET` | `/api/users/me/comments` | 我發過的留言（含所屬貼文標題） | Yes |
| `GET` | `/api/users/me/managed_events` | 我建立的活動（管理員） | Yes |
| `GET` | `/api/users/me/drafts` | 我的草稿 | Yes |

### Uploads & Health

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `POST` | `/api/uploads` | 上傳圖片（jpg/png/gif/webp，最大 5 MB） | Yes |
| `GET` | `/api/health` | Health check | - |

---

## 前端頁面路由

| 路徑 | 頁面 | 需登入 | 說明 |
|---|---|---|---|
| `/` | HomePage | - | 活動列表 + 熱門活動；分類 / 標籤 / 關鍵字 / 日期篩選，#即將到來 chip |
| `/login` | LoginPage | - | Email 登入 + Google OAuth |
| `/register` | RegisterPage | - | 帳密註冊 |
| `/forgot-password` | ForgotPasswordPage | - | 忘記密碼（寄重設信） |
| `/reset-password` | ResetPasswordPage | - | 密碼重設（信中 token） |
| `/events/:id` | EventDetailPage | - | 活動詳情、場次資訊、留言 |
| `/events/:id/register` | EventRegisterPage | - | 選擇場次報名 |
| `/events/create` | EventCreatePage | Yes | 新增活動（管理員） |
| `/events/:id/edit` | EventCreatePage | Yes | 編輯活動（管理員，複用同頁面） |
| `/events/:id/registrations` | EventRegistrationsPage | Yes | 查看 & 匯出活動報名名單（管理員） |
| `/profile` | ProfilePage | Yes | 個人頁面：我的留言 / 報名 / 收藏留言 / 收藏活動 / 草稿 / 活動管理 + 行事曆 |
| `/profile/:userId` | OtherProfilePage | - | 查看其他使用者的公開資料與貼文 |
| `/posts/create` | PostCreatePage | Yes | 發表活動評論（可帶 `?eventId=`） |
| `/posts/:id` | PostDetailPage | - | 貼文詳情、留言、讚/收藏 |
| `/posts/:id/edit` | PostEditPage | Yes | 編輯自己的貼文 |
| `/my-registrations` | RegistrationRecordPage | Yes | 報名紀錄列表，可取消報名 |
| `/board` | BoardPage | - | 留言板：全部 / 熱門 / 最新 / 我的 / 收藏 / 群組；左側邊欄導航 |
| `/board/posts/:id` | BoardPostDetailPage | - | 留言板貼文詳情 |

---

## 專案結構

```
NTU-EventConnect/
├── README.md
├── CLAUDE.md                       # 給 Claude 的專案規則
├── docker-compose.yml              # EC2 生產環境（backend + postgres + caddy）
├── .github/workflows/deploy.yml    # GitHub Actions：build → AWS
│
├── frontend-v2/                    # ← 生產前端
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   └── src/
│       ├── main.jsx                # entry
│       ├── App.jsx                 # 路由（15 條）
│       ├── theme.js                # MUI token（顏色/字型/陰影/圓角）
│       ├── api/
│       │   ├── client.js           # axios instance（吃 VITE_API_URL）
│       │   └── index.js            # endpoint wrappers + snake↔camelCase mapper
│       ├── context/
│       │   ├── AuthContext.jsx     # JWT + 使用者狀態 + Google OAuth
│       │   └── DataContext.jsx     # 收藏 / 草稿 cache + 樂觀更新
│       ├── i18n/
│       │   ├── index.js            # i18next 設定（語言偵測、繁中/英）
│       │   ├── zh-TW.json          # 繁體中文翻譯
│       │   ├── en.json             # 英文翻譯
│       │   └── tagLabels.js        # 標籤 ZH↔EN 對照
│       ├── components/
│       │   ├── Navbar.jsx                # 導覽列 + 語言切換 + 通知
│       │   ├── EventCard.jsx             # 活動卡片（圖片/日期/地點/名額/收藏）
│       │   ├── PostCard.jsx              # 貼文卡片（作者/評分/內容）
│       │   ├── BoardPostCreateDialog.jsx # 留言板發文 modal
│       │   ├── CancelConfirmDialog.jsx   # 取消報名確認對話框
│       │   ├── GroupEditDialog.jsx       # 建立/編輯群組對話框
│       │   ├── GoogleSSOButton.jsx       # Google 登入按鈕
│       │   ├── ImageLightbox.jsx         # 圖片燈箱
│       │   ├── LocaleSwitcher.jsx        # 語言切換按鈕
│       │   ├── ProtectedRoute.jsx        # 登入保護 wrapper
│       │   └── ErrorBoundary.jsx         # React error boundary
│       ├── pages/
│       │   ├── HomePage.jsx              # 活動列表 + 篩選 + 熱門
│       │   ├── EventDetailPage.jsx       # 活動詳情 + 評論
│       │   ├── EventCreatePage.jsx       # 新增/編輯活動（管理員）
│       │   ├── EventRegisterPage.jsx     # 場次報名
│       │   ├── EventRegistrationsPage.jsx # 報名名單（管理員）
│       │   ├── PostDetailPage.jsx        # 貼文詳情 + 留言
│       │   ├── PostCreatePage.jsx        # 發表活動評論
│       │   ├── PostEditPage.jsx          # 編輯貼文
│       │   ├── ProfilePage.jsx           # 個人頁面（行事曆 + 6 個 tab）
│       │   ├── OtherProfilePage.jsx      # 其他使用者主頁
│       │   ├── RegistrationRecordPage.jsx # 報名紀錄
│       │   ├── BoardPage.jsx             # 留言板
│       │   ├── BoardPostDetailPage.jsx   # 留言板貼文詳情
│       │   ├── LoginPage.jsx             # 登入
│       │   ├── RegisterPage.jsx          # 註冊
│       │   ├── ForgotPasswordPage.jsx    # 忘記密碼
│       │   └── ResetPasswordPage.jsx     # 密碼重設
│       └── utils/
│           └── format.js                 # 日期格式化工具
│
├── backend-v2/                     # ← 生產後端
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── dockerfile
│   ├── admin_whitelist.txt         # 管理員 email 白名單（每行一個）
│   ├── app/
│   │   ├── main.py                 # FastAPI app + router 註冊 + CORS + APScheduler
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings（吃 .env）
│   │   │   ├── admin.py            # is_admin_email()（讀 admin_whitelist.txt）
│   │   │   ├── deps.py             # get_current_user / get_current_user_optional
│   │   │   ├── security.py         # bcrypt + JWT（create / decode）
│   │   │   └── time.py             # session_has_ended() 工具
│   │   ├── db/session.py           # SQLAlchemy engine + session（雙 dialect）
│   │   ├── models/
│   │   │   ├── user.py             # User
│   │   │   ├── event.py            # Event + EventSession + EventTag
│   │   │   ├── post.py             # Post + Comment + PostLike + PostBookmark + EventBookmark
│   │   │   ├── registration.py     # Registration
│   │   │   └── group.py            # Group + GroupMember + GroupInvitation
│   │   ├── schemas/
│   │   │   ├── user.py             # UserRegister / UserOut / TokenResponse / GoogleLoginRequest
│   │   │   ├── event.py            # EventOut / EventSessionOut / EventDetailOut / EventListResponse / EventCreateIn / EventUpdateIn
│   │   │   ├── post.py             # PostCreate / PostUpdate / PostOut / CommentCreate / CommentOut
│   │   │   ├── registration.py     # RegistrationOut / RegistrationDetailOut / EventRegistrationOut
│   │   │   └── group.py            # GroupOut / GroupDetailOut / GroupInvitationOut
│   │   └── api/
│   │       ├── auth.py             # 註冊 / 登入 / Google OAuth / me / 密碼重設
│   │       ├── events.py           # 活動 CRUD + 分類 / 標籤列表 + 場次
│   │       ├── posts.py            # 貼文 CRUD + 留言 + 讚 + 收藏
│   │       ├── comments.py         # 編輯 / 刪除留言
│   │       ├── bookmarks.py        # 活動收藏 + 貼文收藏列表 + 草稿
│   │       ├── registrations.py    # 報名 / 取消（含候補自動遞補）
│   │       ├── users.py            # 使用者資料 CRUD + 我的留言 / 活動管理
│   │       ├── groups.py           # 群組 CRUD + 邀請 / 成員管理
│   │       └── uploads.py          # 圖片上傳（jpg/png/gif/webp，5 MB limit）
│   ├── scripts/
│   │   ├── seed_admin.py           # 建 admin 帳號
│   │   └── seed_events.py          # 從 fetch_data/csv/events.csv 灌活動 + 場次（idempotent）
│   └── tests/
│       ├── conftest.py             # in-memory SQLite fixture
│       └── test_*.py               # pytest 測試
│
├── frontend/                       # v1（保留）
├── backend/                        # v1（保留）
│
└── fetch_data/
    ├── info.md                     # 爬蟲說明（336 活動、1217 場次）
    ├── crawl_first.py              # 第一層：活動列表頁
    ├── crawl_second.py             # 第二層：母活動頁
    ├── crawl_third.py              # 第三層：場次詳情頁
    ├── process_data.py             # 後處理：整合欄位
    ├── build_tags_table.py         # 產標籤對照表
    └── csv/                        # 爬蟲產物
        ├── activities.csv
        ├── activity_session.csv
        └── events.csv              # seed_events.py 的資料來源
```

---

## 常見開發任務

### 加新 API endpoint

1. 在 `backend-v2/app/schemas/` 加 Pydantic schema
2. 在 `backend-v2/app/api/<resource>.py` 加 router function
3. 如果是新 resource，在 `app/main.py` `include_router`
4. 重啟 uvicorn（`--reload` 會自動 reload）
5. 在 <http://localhost:8010/docs> 驗證

### 加新 model 欄位

1. 改 `backend-v2/app/models/<resource>.py` 的 SQLAlchemy column
2. 改對應 schema
3. **dev 環境**：刪 `backend-v2/dev.db` 重啟，`create_all` 自動建新欄位
4. **共用 Postgres**：手動 `ALTER TABLE`，或 drop schema 重來

### 加新前端頁面

1. 在 `frontend-v2/src/pages/` 加 `XxxPage.jsx`
2. 在 `frontend-v2/src/App.jsx` 註冊 route
3. 需要登入才看的話，包 `<ProtectedRoute>`
4. 多語系字串加進 `src/i18n/zh-TW.json` 和 `src/i18n/en.json`

### 重置 SQLite DB

```bash
rm backend-v2/dev.db
# 重啟 uvicorn 自動 create_all
cd backend-v2 && python -m scripts.seed_events
```

### 新增管理員帳號

在 `backend-v2/admin_whitelist.txt` 加一行 email，**不需要重啟 backend**（每次呼叫時即時讀檔）。

---

## 套件版本鎖定規則

> 為了避免供應鏈投毒攻擊，**所有依賴都必須鎖版本，禁止使用發布未滿 7 天的版本**。

### Frontend

`package.json` 用**精確版本**（不加 `^` 或 `~`）：

| 套件 | 鎖定版本 |
|---|---|
| react / react-dom | `19.2.4` |
| react-router-dom | `7.13.2` |
| @mui/material | `7.3.9` |
| @mui/icons-material | `7.3.9` |
| @mui/x-date-pickers | `8.27.2` |
| @emotion/react | `11.14.0` |
| @emotion/styled | `11.14.1` |
| axios | `1.14.0` |
| date-fns | `4.1.0` |
| i18next | `23.16.5` |
| react-i18next | `15.1.1` |
| vite | `8.0.1` |

新增套件前：`npm view <package> time` 確認最新版本發布超過 7 天，再用精確版本寫進 `package.json`。

### Backend

`requirements.txt` 用 `==` 鎖版本：

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.36
psycopg[binary]==3.3.3
pydantic==2.9.2
pydantic-settings==2.5.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.12
email-validator==2.2.0
apscheduler==3.10.4
pytest==8.3.3
httpx==0.27.2
```

新增套件前：`pip index versions <package>` 確認版本發布日期。

---

## 部署

### 雲端基礎設施架構

```
                         Internet
                            │
       ┌────────────────────┴────────────────────┐
       │                                         │
       ▼                                         ▼
┌─────────────────────┐               ┌──────────────────────────────┐
│  CloudFront (CDN)   │               │  EC2 Instance                │
│  d1tz6syfib05nx     │               │  54.175.31.32.nip.io         │
│  .cloudfront.net    │               │                              │
│  Origin: S3 (OAC)   │               │  docker-compose.yml          │
│  SPA 404→index.html │               │  ┌────────────────────────┐  │
└──────────┬──────────┘               │  │ caddy:2-alpine         │  │
           │                          │  │  80/443 → backend:8000 │  │
           ▼                          │  │  Let's Encrypt 自動憑證│  │
┌─────────────────────┐               │  └──────────┬─────────────┘  │
│  S3 (private)       │               │             ▼                │
│  Vite build 產物    │               │  ┌────────────────────────┐  │
└─────────────────────┘               │  │ backend-v2 (FastAPI)   │  │
                                      │  │  + APScheduler 02:00   │  │
前端 JS（使用者瀏覽器）               │  └──────────┬─────────────┘  │
│  VITE_API_URL/api/* ────────────────►             ▼                │
│  （直連 EC2，不過 CloudFront）       │  ┌────────────────────────┐  │
│                                     │  │ postgres:16-alpine     │  │
│                                     │  │  pg_data volume        │  │
│                                     │  └────────────────────────┘  │
│                                     └──────────────────────────────┘
```

**設計重點：** CloudFront 只負責前端靜態檔分發，**不 proxy `/api/*`**。前端 build 時把 `VITE_API_URL` 寫死成 EC2 HTTPS domain，瀏覽器直接打 backend，避免 CloudFront cache 吃掉 query string。

### CI/CD（GitHub Actions）

**觸發條件：** push 到 `main` 或手動 `workflow_dispatch`

**前端（S3 + CloudFront）：**
1. `npm ci` → `npm run build`（注入 `VITE_API_URL` / `VITE_GOOGLE_CLIENT_ID`）
2. `aws s3 sync dist/ --delete`
3. CloudFront invalidation

**後端（EC2 SSH）：**
1. `paths-filter` 判斷 backend-v2 / fetch_data 是否變更
2. SSH 到 EC2：`git reset --hard origin/main`
3. `docker compose up -d --build backend`
4. Health check（重試 5 次）

切換 v1 ↔ v2 只需在 GitHub → Settings → Variables 改 `BACKEND_DIR` / `FRONTEND_DIR`。

### 需要的 GitHub Secrets / Variables

| 類型 | 名稱 | 用途 |
|---|---|---|
| Secret | `EC2_HOST` / `EC2_USER` / `EC2_SSH_KEY` | EC2 SSH 連線 |
| Secret | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 + CloudFront |
| Secret | `AWS_S3_BUCKET` / `CLOUDFRONT_DISTRIBUTION_ID` | 前端目標 |
| Secret | `VITE_API_URL` | 前端 build 注入；後端 health check 引用 |
| Secret | `VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID` | Google SSO |
| Variable | `BACKEND_DIR` | `backend-v2`（目前值） |
| Variable | `FRONTEND_DIR` | `frontend-v2`（目前值） |

### EC2 上手動操作

```bash
ssh -i ~/.ssh/ntu-eventconnect.pem <EC2_USER>@<EC2_HOST>
cd ~/NTU-EventConnect

docker compose ps                                          # 確認 services
docker compose logs backend --tail 100                    # 看後端 log
docker compose exec backend python -m scripts.seed_events # 手動 reseed
```

### 每日資料更新

`backend-v2/app/main.py` 啟動 APScheduler，每日 **02:00 Asia/Taipei** 自動執行 `python -m scripts.seed_events`（CSV → DB，idempotent）。

手動立即更新：

```bash
# 在 EC2 上
docker compose exec backend python -m scripts.seed_events
```

### 部署後驗證

```bash
curl ${VITE_API_URL}/api/health         # {"status":"ok"}
curl "${VITE_API_URL}/api/events?size=3" # JSON 活動列表
curl ${VITE_API_URL}/api/events/tags    # 標籤列表
```

### 生產環境注意事項

- 設強密碼 `JWT_SECRET`：`python -c "import secrets; print(secrets.token_urlsafe(48))"`
- 使用 PostgreSQL（不要用 SQLite）
- `CORS_ORIGINS` 包含正式前端 domain

---

## 疑難排解

### Backend `[WinError 10013]` 通訊端被拒絕

Port 被 Windows 保留。換一個沒被保留的 port：

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
uvicorn app.main:app --reload --port 8010
```

### Frontend 打 API 沒資料（CORS 錯誤）

Vite 自動跳 port（5173 → 5174...）時，瀏覽器 origin 改變，後端 CORS 拒絕。  
排查：F12 → Console，找 `CORS` 紅字。  
修法：在 `backend-v2/.env` 把新 port 加進 `CORS_ORIGINS`，重啟 backend。

### `ModuleNotFoundError: No module named 'app'`

沒在 `backend-v2/` 目錄下跑 uvicorn。`cd backend-v2` 後再執行。

### `ModuleNotFoundError: No module named 'psycopg2'`

`DATABASE_URL` 的 scheme 寫成 `postgresql://`，改成 `postgresql+psycopg://`（psycopg v3）。

### `sqlalchemy.exc.NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgresql.psycopg`

SQLAlchemy 版本太舊。`pip install --upgrade sqlalchemy`（需要 2.0.36+）。

### 部署後活動列表異常（篩選沒反應）

CloudFront 預設吃掉 query string。  
修法：CloudFront → Behaviors → `/api/*` → Cache policy 改 `CachingDisabled`，Origin request policy 改 `AllViewer`。

### PowerShell 啟動 venv 跳「無法載入指令碼」

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 重置 SQLite DB

```bash
rm backend-v2/dev.db
# 重啟 uvicorn 自動 create_all，再 seed
cd backend-v2 && python -m scripts.seed_events
```

### 看 DB 內容

- **SQLite**：[DB Browser for SQLite](https://sqlitebrowser.org/) 開 `backend-v2/dev.db`
- **Postgres**：[DBeaver](https://dbeaver.io/) / [TablePlus](https://tableplus.com/) / pgAdmin
