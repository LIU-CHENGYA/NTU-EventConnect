# NTU EventConnect

台大校園活動的整合平台 — 把 [`my.ntu.edu.tw/actregister`](https://my.ntu.edu.tw/actregister) 上分散的活動資料抓下來，加上貼文、評分、收藏、報名紀錄、個人頭貼、行事曆等社群功能，讓學生用一個介面瀏覽所有校內活動。

> 軟體工程課期末專案

**線上網址：** <https://d1p66hfjtmja1e.cloudfront.net/>

---

## 目錄

- [功能](#功能)
- [技術棧](#技術棧)
- [架構](#架構)
- [Quick Start（不耐看版）](#quick-start不耐看版)
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

- **活動瀏覽**：分類、關鍵字搜尋、按收藏熱度排序
- **個人行事曆**：標出有報名的日子
- **收藏 / 報名**：活動 / 貼文都能收藏，報名場次有候補機制
- **貼文系統**：評分 + 圖片 + 留言 + 按讚 + 草稿
- **個人資料**：頭貼上傳、自介、報名紀錄
- **登入**：本地註冊 + Google OAuth
- **RWD**：手機 / 平板 / 桌面自適應排版
- **資料來源**：從台大活動報名網站爬取 336 場真實活動、1217 個場次

---

## 技術棧

| 層 | 技術 |
|---|---|
| **Frontend** | Vite 8 + React 19 + MUI 7 + react-router-dom 7 + axios + @mui/x-date-pickers + date-fns |
| **Backend** | FastAPI 0.115 + SQLAlchemy 2.0 + Pydantic 2 + uvicorn + python-jose（JWT）+ passlib（bcrypt） |
| **資料庫** | SQLite（預設）/ PostgreSQL（透過 `DATABASE_URL` 切換） |
| **ETL** | requests + BeautifulSoup（三層爬蟲） |
| **CI/CD** | GitHub Actions → AWS ECS（後端）/ S3 + CloudFront（前端） |

---

## 架構

```
NTU-EventConnect/
├── frontend/         # Vite + React 19 + MUI 7
├── backend/          # FastAPI + SQLAlchemy
└── fetch_data/       # ETL：三層爬蟲 + csv → mock json
    ├── crawl_first/second/third.py   # 三層爬蟲
    ├── csv/                          # 爬蟲產物（活動列表 / 場次明細）
    └── build_mock.py                 # csv → events.generated.json（前端 mock 用）
```

**資料流：**

```
my.ntu.edu.tw → crawl_*.py → csv/events.csv
                                    │
                    ┌───────────────┤
                    ▼               ▼
          seed_events.py     build_mock.py
                │                   │
                ▼                   ▼
         Database (API)     events.generated.json (前端 mock 備用)
                │
                ▼
      FastAPI /api/* ←→ React frontend
```

後端對外暴露 8 組 router（auth / events / posts / comments / bookmarks / registrations / users / uploads），SQLAlchemy 走 `DATABASE_URL` 自動分派 SQLite 或 Postgres dialect，**程式碼層完全不用改**。

---

## Quick Start（不耐看版）

開兩個 terminal：

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/Scripts/activate         # Windows Git Bash
# .\venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate           # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

```bash
# Terminal 2 - Frontend
cd frontend
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

第一次用 venv 可能會遇到「無法載入指令碼」錯誤。**用系統管理員身分**開 PowerShell，跑一次：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # 預設 http://localhost:5173
npm run build        # 產 dist/
npm run preview      # 預覽 dist/
npm run lint         # ESLint
npm test             # vitest
```

如果你想讓 frontend 連到非預設的後端 URL，在 `frontend/` 建一個 `.env.local`：

```env
VITE_API_URL=http://localhost:8010
```

設完要**重啟 `npm run dev`**（vite 對環境變數的改動不會 HMR）。

### Backend

```bash
cd backend

# 1. 建虛擬環境（只要做一次）
python -m venv venv

# 2. 啟用 venv
source venv/Scripts/activate         # Windows Git Bash
# .\venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate           # macOS/Linux

# 3. 安裝依賴
pip install -r requirements.txt

# 4. （可選）建立 .env 設定環境變數
# 如果不建，會使用預設值（SQLite + 預設 JWT secret）
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./dev.db
JWT_SECRET=change-me-in-prod
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177
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

#### 跑測試

```bash
pytest
```

> pytest 會用同一個 `DATABASE_URL`。如果你連的是共用 Postgres，跑測試會污染資料。先把 `DATABASE_URL` 切回 SQLite 再跑，或設一個獨立 test DB。

### ETL（產真實活動資料）

爬蟲跟 backend 共用一個 venv：

```bash
# 在專案根目錄
source venv/Scripts/activate
python fetch_data/build_mock.py    # 產 frontend/src/mock/events.generated.json（前端 mock 備用）
```

`seed_events.py` 直接讀 `fetch_data/csv/events.csv` 灌進資料庫，不需要先跑 `build_mock.py`。

---

## 資料庫：SQLite ↔ PostgreSQL

**同一份程式碼可以同時跑 SQLite 和 PostgreSQL**，差別只在 `DATABASE_URL` 環境變數。`backend/app/db/session.py` 會根據 URL scheme 自動分派 dialect，**程式碼不用任何 if/else**。

| 模式 | 適用情境 | 設定難度 |
|---|---|---|
| **SQLite**（預設） | 本機開發、單人測試、Demo | 零設定 |
| **PostgreSQL** | 多人共用、部署、Staging/Prod | 需要 DB server + 連線字串 |

### 為什麼兩個都支援

- **SQLite**：一個檔案就是一個資料庫，clone 完直接 `uvicorn` 就能跑。新組員不用裝 DB、不用設連線、不用問密碼。
- **PostgreSQL**：多人可以共用同一份資料、部署到雲端後資料持久（不會被 redeploy 沖掉）、撐得住併發寫入、更貼近生產環境。

### 模式 A：SQLite（預設）

什麼都不用設。`backend/app/core/config.py` 預設 `DATABASE_URL=sqlite:///./dev.db`。

```bash
cd backend
uvicorn app.main:app --reload --port 8010
```

第一次啟動會在 `backend/dev.db` 自動建表。要砍掉重來就刪 `dev.db` 後重啟。

`dev.db` 已被 `.gitignore` 排除，不會 commit。

### 模式 B：PostgreSQL

#### B-1. 安裝 driver

`backend/requirements.txt` 已經包含 `psycopg[binary]==3.3.3`，照常 `pip install -r requirements.txt` 就會裝好。

#### B-2. 準備一個 Postgres 給你連

選一個：

**選項 A：Docker（最快）**
```bash
docker run --name eventconnect-pg -d \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eventconnect \
  -p 5432:5432 \
  postgres:16
```

**選項 B：本機裝 Postgres**
從 <https://www.postgresql.org/download/> 下載安裝，用 `psql` 或 pgAdmin 建一個叫 `eventconnect` 的 database。

**選項 C：用組員/雲端的 Postgres**
跟組員拿連線字串。常見來源：Supabase、Neon、AWS RDS、GCP Cloud SQL、自架 VM。

#### B-3. 設 `.env`

在 `backend/` 建（或編輯）`.env`，把 `DATABASE_URL` 改成 Postgres：

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/eventconnect
```

> scheme **一定要是 `postgresql+psycopg://`**（用 v3 driver）。
> - `postgresql://` 會去抓 psycopg2（沒裝會錯）
> - `postgres://` SQLAlchemy 不認

雲端 Postgres 通常強制 SSL：
```env
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db?sslmode=require
```

#### B-4. 啟動

```bash
uvicorn app.main:app --reload --port 8010
```

第一次啟動會自動 `Base.metadata.create_all` 建表。打開 <http://localhost:8010/api/health> 確認 `{"status":"ok"}`。

### 切回 SQLite

只要把 `.env` 的 `DATABASE_URL` 那行改回 `sqlite:///./dev.db`，重啟 uvicorn 就好。**程式碼一行都不用動**。

注意：SQLite 跟 Postgres 是兩個獨立的 DB，切換之後資料**不會自動搬過去**。

### 把 SQLite 的資料搬到 Postgres（一次性）

最簡單：在 Postgres 那邊重跑種子腳本：
```bash
python -m scripts.seed_events
```

要逐筆搬：用 [`pgloader`](https://pgloader.readthedocs.io/)（推薦）：
```bash
docker run --rm -v $(pwd)/backend:/data dimitri/pgloader \
  pgloader sqlite:///data/dev.db postgresql://user:pass@host:5432/eventconnect
```

### 連線字串保密

- **不要 commit `.env`**（已 gitignore）
- **不要把連線字串貼到 PR / Slack 公開頻道 / GitHub issue**
- 用 1Password / Bitwarden / 私訊傳

### 連線管理（自動處理）

`backend/app/db/session.py` 對 Postgres 啟用 `pool_pre_ping=True`：閒置連線被防火牆/雲端 NAT 砍掉時，SQLAlchemy 在取出 connection 前會先送一個輕量 `SELECT 1` 確認還活著，避免拿到死連線。SQLite 不需要這個（沒有真的 pool），所以條件式啟用。

---

## API 路由總覽

完整 schema 看 <http://localhost:8010/docs>（Swagger UI 直接可以打）。

### Auth

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `POST` | `/api/auth/register` | 註冊（name + email + password） | - |
| `POST` | `/api/auth/login` | 登入（回 JWT） | - |
| `POST` | `/api/auth/google` | Google OAuth 登入 | - |
| `GET` | `/api/auth/me` | 取得目前登入使用者 | Yes |

### Events

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/events` | 活動列表（支援 `category` / `keyword` / `sort=hot` / `page` / `size`） | - |
| `GET` | `/api/events/categories` | 所有分類 + 數量 | - |
| `GET` | `/api/events/{event_id}` | 活動詳情（含所有場次） | - |
| `GET` | `/api/events/{event_id}/sessions/{session_id}` | 場次詳情 | - |

**熱門排序邏輯**：`GET /api/events?sort=hot` 依「該活動被收藏的次數」由多到少排序，沒人收藏的擺最後。

### Posts

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/posts` | 貼文列表（支援 `event_id` / `user_id` / `visibility` / 分頁） | - |
| `POST` | `/api/posts` | 發貼文 | Yes |
| `GET` | `/api/posts/{post_id}` | 貼文詳情（含留言、讚/收藏狀態） | - |
| `PATCH` | `/api/posts/{post_id}` | 編輯貼文（僅作者） | Yes |
| `DELETE` | `/api/posts/{post_id}` | 刪除貼文（僅作者） | Yes |
| `POST` | `/api/posts/{post_id}/comments` | 留言 | Yes |
| `POST` | `/api/posts/{post_id}/like` | 按讚（冪等） | Yes |
| `DELETE` | `/api/posts/{post_id}/like` | 取消讚 | Yes |
| `POST` | `/api/posts/{post_id}/bookmark` | 收藏貼文（冪等） | Yes |
| `DELETE` | `/api/posts/{post_id}/bookmark` | 取消收藏貼文 | Yes |

### Comments

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `DELETE` | `/api/comments/{comment_id}` | 刪留言（僅作者） | Yes |

### Bookmarks & Registrations

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `POST` | `/api/events/{event_id}/bookmark` | 收藏活動（冪等） | Yes |
| `DELETE` | `/api/events/{event_id}/bookmark` | 取消收藏活動 | Yes |
| `POST` | `/api/sessions/{session_id}/register` | 報名場次（額滿進候補） | Yes |
| `DELETE` | `/api/registrations/{reg_id}` | 取消報名（自動遞補候補） | Yes |

### Users

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `GET` | `/api/users/{user_id}` | 使用者公開資料（含貼文數、參加活動數） | - |
| `PATCH` | `/api/users/me` | 更新自己的資料（name / bio / avatar_url / department / student_id） | Yes |
| `GET` | `/api/users/me/drafts` | 我的草稿（visibility=private 的貼文） | Yes |
| `GET` | `/api/users/me/registrations` | 我的報名紀錄 | Yes |
| `GET` | `/api/users/me/bookmarks/events` | 收藏的活動 | Yes |
| `GET` | `/api/users/me/bookmarks/posts` | 收藏的貼文 | Yes |

### Uploads & Health

| Method | Path | 用途 | 需登入 |
|---|---|---|---|
| `POST` | `/api/uploads` | 上傳圖片（jpg/png/gif/webp，最大 5MB） | Yes |
| `GET` | `/api/health` | Health check | - |

---

## 前端頁面路由

| 路徑 | 頁面 | 需登入 | 說明 |
|---|---|---|---|
| `/` | HomePage | - | 活動列表 + 熱門活動，分類篩選、搜尋、分頁 |
| `/login` | LoginPage | - | Email + 密碼登入、Google OAuth |
| `/register` | RegisterPage | - | 註冊帳號 |
| `/forgot-password` | ForgotPasswordPage | - | 忘記密碼 |
| `/events/:id` | EventDetailPage | - | 活動詳情、場次資訊、評論列表 |
| `/events/:id/register` | EventRegisterPage | - | 選擇場次報名 |
| `/events/create` | EventCreatePage | Yes | 新增活動（管理員） |
| `/profile` | ProfilePage | Yes | 個人資料、日曆、我的貼文/報名/收藏 |
| `/profile/:userId` | OtherProfilePage | - | 查看其他使用者的公開資料與貼文 |
| `/posts/create` | PostCreatePage | Yes | 發表貼文或評論（可帶 `?eventId=` 寫活動評論） |
| `/posts/:id` | PostDetailPage | - | 貼文詳情、留言、按讚/收藏 |
| `/posts/:id/edit` | PostEditPage | Yes | 編輯自己的貼文 |
| `/my-registrations` | RegistrationRecordPage | Yes | 報名紀錄列表，可展開查看詳情或取消報名 |

---

## 專案結構

```
NTU-EventConnect/
├── README.md                       # ← 你正在看的
├── CLAUDE.md                       # 給 Claude 的專案規則（commit / 套件版本鎖定）
├── DOC.md                          # 早期設計文件
├── DOC_INFRA.md                    # 基礎設施文件
├── TEST_PLAN.md                    # 測試計畫
├── .github/workflows/deploy.yml    # GitHub Actions：build → AWS
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── postcss.config.js
│   ├── .env.example                # 環境變數範本
│   ├── public/
│   └── src/
│       ├── main.jsx                # entry
│       ├── App.jsx                 # routes（13 條路由）
│       ├── theme.js                # MUI theme tokens（顏色/字型/陰影/圓角）
│       ├── index.css               # Global styles + Google Fonts
│       ├── api/
│       │   ├── client.js           # axios instance（吃 VITE_API_URL，預設 localhost:8010）
│       │   └── index.js            # endpoint wrappers + snake↔camel mapper
│       ├── context/
│       │   ├── AuthContext.jsx     # JWT + 使用者狀態 + Google OAuth
│       │   └── DataContext.jsx     # 收藏 / 草稿 cache + 樂觀更新
│       ├── components/
│       │   ├── Navbar.jsx          # 導覽列（桌面搜尋列 + 手機漢堡選單 Drawer）
│       │   ├── EventCard.jsx       # 活動卡片（圖片/日期/地點/名額/收藏）
│       │   ├── PostCard.jsx        # 貼文卡片（作者/評分/內容預覽）
│       │   ├── ProtectedRoute.jsx  # 登入保護 wrapper
│       │   └── ErrorBoundary.jsx   # React error boundary
│       ├── pages/
│       │   ├── HomePage.jsx              # 活動列表 + 熱門活動
│       │   ├── EventDetailPage.jsx       # 活動詳情 + 評論
│       │   ├── EventCreatePage.jsx       # 新增活動（管理員）
│       │   ├── EventRegisterPage.jsx     # 場次報名
│       │   ├── PostDetailPage.jsx        # 貼文詳情 + 留言
│       │   ├── PostCreatePage.jsx        # 發表貼文/評論
│       │   ├── PostEditPage.jsx          # 編輯貼文
│       │   ├── ProfilePage.jsx           # 個人頁面（日曆 + 頭貼上傳 + 4 個 tab）
│       │   ├── OtherProfilePage.jsx      # 其他使用者主頁
│       │   ├── RegistrationRecordPage.jsx # 報名紀錄
│       │   ├── LoginPage.jsx             # 登入
│       │   ├── RegisterPage.jsx          # 註冊
│       │   └── ForgotPasswordPage.jsx    # 忘記密碼
│       ├── mock/                         # ETL 產出的備用資料
│       │   └── events.generated.json
│       └── test/                         # vitest tests
│           ├── setup.js
│           └── mappers.test.js           # API mapper 單元測試
│
├── backend/
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── dockerfile                  # Docker image（Python 3.11-slim）
│   ├── .env                        # 環境變數（gitignore 排除，但目前誤 commit 了）
│   ├── dev.db                      # SQLite（gitignore）
│   ├── uploads/                    # /api/uploads 存的檔案
│   ├── app/
│   │   ├── main.py                 # FastAPI app + router 註冊 + CORS + static mount
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings（吃 .env）
│   │   │   ├── deps.py             # get_current_user / get_current_user_optional
│   │   │   └── security.py         # bcrypt + JWT (create/decode)
│   │   ├── db/session.py           # SQLAlchemy engine + session（雙 dialect）
│   │   ├── models/                 # SQLAlchemy ORM（8 個 model）
│   │   │   ├── user.py             # User
│   │   │   ├── event.py            # Event + EventSession
│   │   │   ├── post.py             # Post + Comment + PostLike + PostBookmark + EventBookmark
│   │   │   └── registration.py     # Registration
│   │   ├── schemas/                # Pydantic request/response
│   │   │   ├── user.py             # UserRegister / UserLogin / UserOut / TokenResponse / GoogleLoginRequest
│   │   │   ├── event.py            # EventOut / EventSessionOut / EventDetailOut / EventListResponse
│   │   │   ├── post.py             # PostCreate / PostUpdate / PostOut / PostDetailOut / CommentCreate / CommentOut
│   │   │   └── registration.py     # RegistrationOut / RegistrationDetailOut
│   │   └── api/                    # router 們（8 個）
│   │       ├── auth.py             # 註冊 / 登入 / Google OAuth / me
│   │       ├── events.py           # 活動列表 / 分類 / 詳情 / 場次
│   │       ├── posts.py            # CRUD + 留言 + 讚 + 收藏
│   │       ├── comments.py         # 刪留言
│   │       ├── bookmarks.py        # 活動收藏 + 使用者收藏列表 + 草稿
│   │       ├── registrations.py    # 報名 / 取消（含候補遞補）
│   │       ├── users.py            # 使用者資料 CRUD
│   │       └── uploads.py          # 圖片上傳（jpg/png/gif/webp，5MB limit）
│   ├── scripts/
│   │   ├── seed_admin.py           # 建 admin 帳號
│   │   └── seed_events.py          # 從 fetch_data/csv/events.csv 灌活動 + 場次
│   ├── check.py                    # 簡易爬蟲測試腳本
│   ├── scrap.py                    # 活動列表解析腳本
│   └── tests/                      # pytest 測試（7 個檔案）
│       ├── conftest.py             # in-memory SQLite fixture
│       ├── test_auth.py            # 註冊 / 登入 / me
│       ├── test_events.py          # 活動列表 / 篩選 / 分頁 / 詳情
│       ├── test_posts.py           # CRUD + 留言 + 讚 + 收藏 + 草稿
│       ├── test_registrations.py   # 報名 / 候補 / 取消遞補 / 權限
│       ├── test_users_uploads.py   # 使用者資料 + 圖片上傳
│       ├── test_edge_cases.py      # 邊界：cascade delete / 冪等 / token 竄改
│       └── test_seed_events.py     # seed_events 整合測試
│
└── fetch_data/
    ├── info.md                     # 爬蟲說明（336 活動、1217 場次）
    ├── crawl_first.py              # 第一層：活動列表頁
    ├── crawl_second.py             # 第二層：母活動頁
    ├── crawl_third.py              # 第三層：場次詳情頁
    ├── build_mock.py               # csv → events.generated.json
    └── csv/                        # 爬蟲產物
        ├── activities.csv          # 活動列表
        ├── activity_session.csv    # 母活動 + 場次 URL
        └── events.csv              # 完整場次資料（seed_events.py 的資料來源）
```

---

## 常見開發任務

### 加新 API endpoint

1. 在 `backend/app/schemas/` 加 Pydantic schema（request / response）
2. 在 `backend/app/api/<resource>.py` 加 router function
3. 如果是新 resource 要在 `app/main.py` `include_router`
4. 重啟 uvicorn（`--reload` 應該會自動 reload）
5. 在 <http://localhost:8010/docs> 驗證

### 加新 model 欄位

1. 改 `backend/app/models/<resource>.py` 的 SQLAlchemy column
2. 改 `backend/app/schemas/<resource>.py` 對應 schema
3. **dev 環境**：刪 `backend/dev.db` 重啟，`create_all` 會自動建新欄位
4. **共用 Postgres 環境**：手動 `ALTER TABLE`，或乾脆 drop schema 重來
5. （長期）導入 Alembic migration

### 加新前端頁面

1. 在 `frontend/src/pages/` 加 `XxxPage.jsx`
2. 在 `frontend/src/App.jsx` 註冊 route
3. 如果需要登入才看，包 `<ProtectedRoute>`
4. 如果要打 API，從 `frontend/src/api` import 對應的 wrapper

### 重置 SQLite DB

```bash
rm backend/dev.db
# 重啟 uvicorn 會自動 create_all
python -m scripts.seed_events    # 重新灌資料
```

### 砍掉所有舊的 vite 進程（Windows）

```powershell
taskkill /F /IM node.exe
```

### 看 backend log 但只想看自己的請求

```bash
uvicorn app.main:app --reload --port 8010 --log-level info
```

---

## 套件版本鎖定規則

> 為了避免 npm / PyPI 供應鏈投毒攻擊，**所有相依套件都必須鎖版本，禁止使用發布未滿 7 天的版本**。

### Frontend

`package.json` 用**精確版本**（不加 `^` 或 `~`）。當前鎖定的關鍵套件：

| 套件 | 鎖定版本 | 備註 |
|---|---|---|
| react | `19.2.4` | |
| react-dom | `19.2.4` | |
| react-router-dom | `7.13.2` | |
| @mui/material | `7.3.9` | |
| @mui/icons-material | `7.3.9` | |
| @mui/x-date-pickers | `8.27.2` | v9 太新（< 7 天）暫時鎖在 v8 |
| @emotion/react | `11.14.0` | MUI 底層依賴 |
| @emotion/styled | `11.14.1` | MUI 底層依賴 |
| axios | `1.14.0` | |
| date-fns | `4.1.0` | |
| vite | `8.0.1` | |

新增任何套件前：

1. `npm view <package> time` 確認最新版本發布超過 7 天
2. 不夠 7 天請退回上一個穩定版本
3. 在 `package.json` 用**精確版本**寫死
4. 確保 `package-lock.json` 一定要 commit 進 repo

### Backend / ETL

`backend/requirements.txt` 用 `==` 鎖版本，不要用 `>=`。當前鎖定：

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
pytest==8.3.3
httpx==0.27.2
```

新增 Python 套件前 `pip index versions <package>` 確認版本/時間。

---

## 部署

### 雲端基礎設施架構

```

                              Internet
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   CloudFront (CDN)     │
                    │  d1p66hfjtmja1e..      │
                    └────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │   S3 Static Hosting  │        │  Application Load    │
    │   (Frontend Assets)  │        │   Balancer (ALB)     │
    │   React SPA Build    │        │   Port 8000          │
    └──────────────────────┘        └──────────────────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │                         │
                                    ▼                         ▼
                        ┌─────────────────────┐   ┌─────────────────────┐
                        │  ECS Fargate Task   │   │  ECS Fargate Task   │
                        │  (ntu-backend-api)  │   │  (Auto Scaling)     │
                        │  • Python 3.11      │   │  • Replica          │
                        │  • FastAPI/Uvicorn  │   │                     │
                        │  • 1 vCPU, 3GB RAM  │   │                     │
                        └─────────────────────┘   └─────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │   RDS PostgreSQL    │
                        │   ntu-event-db      │
                        │   • Multi-AZ        │
                        │   • Auto Backup     │
                        └─────────────────────┘
```

**部署組件說明：**

| 組件 | 服務 | 配置 | 說明 |
|------|------|------|------|
| **前端** | S3 + CloudFront | - | Vite build 產生的靜態檔案 |
| **後端** | ECS Fargate + ECR | 1 vCPU / 3GB RAM | Docker 容器運行 FastAPI |
| **負載均衡** | ALB | Port 8000 | 分流請求到多個 ECS tasks |
| **資料庫** | RDS PostgreSQL | - | 獨立資料庫實例 |
| **容器倉庫** | ECR | - | 存放 Docker images |
| **日誌** | CloudWatch Logs | `/ecs/ntu-backend-task` | 集中日誌管理 |

### CI/CD 自動化流程

```
Developer Push → GitHub → Actions Workflow → AWS Deployment

開發流程：
1. 開發者 commit & push 到 main branch
2. GitHub Actions 自動觸發
3. 平行執行前後端構建
4. 部署到對應的 AWS 服務
5. 自動更新與健康檢查
```

**觸發條件：** push 到 `main` branch，或手動執行 workflow_dispatch

---

### Frontend（AWS S3 + CloudFront）

**前端網址：** <https://d1p66hfjtmja1e.cloudfront.net>

#### 自動部署流程（GitHub Actions）

```yaml
1. Checkout 程式碼
2. 設定 Node.js 環境
3. 安裝依賴 (npm ci)
4. 設定環境變數 (VITE_API_URL)
5. 構建生產版本 (npm run build)
6. 同步到 S3 (aws s3 sync dist/ --delete)
7. 清除 CloudFront 快取 (create-invalidation)
```

#### 需要的 GitHub Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_URL`（例如 `https://d1p66hfjtmja1e.cloudfront.net`，前端會呼叫 `${VITE_API_URL}/api/...`）
---

### Backend（AWS ECS Fargate + ECR）

**後端 API URL：** `http://ntu-api-alb-1725363642.ap-northeast-1.elb.amazonaws.com`

#### 自動部署流程（GitHub Actions）

```yaml
1. Checkout 程式碼
2. 配置 AWS 認證
3. 登入 ECR
4. 構建 Docker Image (linux/amd64)
   └─ docker build --platform linux/amd64
5. 標記 Image (latest + commit SHA)
6. 推送到 ECR
7. 觸發 ECS Service 強制部署
   └─ aws ecs update-service --force-new-deployment
```

#### ECS 架構資訊

| 項目 | 內容 |
|------|------|
| **ECR Repository** | `896160628127.dkr.ecr.ap-northeast-1.amazonaws.com/ntu-backend` |
| **ECS Cluster** | `gracious-fish-rizeya` |
| **ECS Service** | `ntu-backend-task-service-5vmose4n` |
| **Task Definition** | `ntu-backend-task` (Python 3.11, 1 vCPU, 3GB RAM) |
| **資料庫** | RDS PostgreSQL `ntu-event-db.c386osyooczq.ap-northeast-1.rds.amazonaws.com` |
| **Log Group** | CloudWatch `/ecs/ntu-backend-task` |

#### 需要的 GitHub Secrets

後端部署 Job 會共用上面 Frontend 使用的 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`，
ECR repository / ECS cluster / service 名稱是直接寫在 `.github/workflows/deploy.yml` 裡，如果之後改名再一起調整即可，**不需要額外的 GitHub Secrets**。

#### 手動部署後端

```bash
# 1. 構建 Docker Image（指定 x86_64 平台）
cd backend
docker build --platform linux/amd64 -t ntu-backend:latest .

# 2. 登入 AWS ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  896160628127.dkr.ecr.ap-northeast-1.amazonaws.com

# 3. 標記並推送
docker tag ntu-backend:latest \
  896160628127.dkr.ecr.ap-northeast-1.amazonaws.com/ntu-backend:latest
docker push 896160628127.dkr.ecr.ap-northeast-1.amazonaws.com/ntu-backend:latest

# 4. 觸發 ECS 部署
aws ecs update-service \
  --cluster gracious-fish-rizeya \
  --service ntu-backend-task-service-5vmose4n \
  --force-new-deployment \
  --region ap-northeast-1
```

---

### 環境變數配置

#### Backend (ECS Task Definition)

ECS Task Definition 裡需要設定以下環境變數：

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串（`postgresql+psycopg://...`） |
| `JWT_SECRET` | JWT 簽名密鑰（用 `python -c "import secrets; print(secrets.token_urlsafe(48))"` 產生） |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRE_MINUTES` | `10080`（7 天） |
| `CORS_ORIGINS` | 前端 domain（如 `https://d1p66hfjtmja1e.cloudfront.net`） |

#### Frontend (Build Time)

```env
VITE_API_URL=https://d1p66hfjtmja1e.cloudfront.net
```

前端程式會呼叫 `${VITE_API_URL}/api/...`，CloudFront 再把 `/api/*` 代理到 ALB，
這樣瀏覽器端全程走 HTTPS，不會出現 mixed content 問題。

---

### 監控與日誌

| 監控項目 | 位置 | 說明 |
|---------|------|------|
| **應用日誌** | CloudWatch `/ecs/ntu-backend-task` | FastAPI 運行日誌 |
| **ECS Metrics** | ECS Console | CPU/Memory 使用率 |
| **Health Check** | ALB Target Groups | `/api/health` 端點檢查 |
| **前端訪問** | CloudFront Logs | CDN 訪問記錄 |

**查看日誌：**

```bash
# 查看後端日誌
aws logs tail /ecs/ntu-backend-task --follow --region ap-northeast-1

# 查看 ECS 服務狀態
aws ecs describe-services \
  --cluster gracious-fish-rizeya \
  --services ntu-backend-task-service-5vmose4n \
  --region ap-northeast-1

# 測試健康檢查
curl http://ntu-api-alb-1725363642.ap-northeast-1.elb.amazonaws.com/api/health
# 預期回應: {"status":"ok"}
```

---

**部署後驗證：**

```bash
# 測試後端健康檢查
curl http://ntu-api-alb-1725363642.ap-northeast-1.elb.amazonaws.com/api/health
# 預期: {"status":"ok"}

# 測試前端
curl -I https://d1p66hfjtmja1e.cloudfront.net
# 預期: HTTP 200

# 測試 API 連接
curl http://ntu-api-alb-1725363642.ap-northeast-1.elb.amazonaws.com/api/events
# 預期: JSON 活動列表
```

**生產環境注意事項：**
- 設 `ENV=prod`
- 設強密碼 `JWT_SECRET`：`python -c "import secrets; print(secrets.token_urlsafe(48))"`
- 使用 PostgreSQL（不要用 SQLite）
- `CORS_ORIGINS` 包含正式前端 domain

---

## 疑難排解

### Backend `[WinError 10013] 嘗試存取通訊端被拒絕`

Port 被 Windows 保留住了（Hyper-V / WSL2 會動態保留一堆 port）。

```powershell
# 看哪些 port 被保留
netsh interface ipv4 show excludedportrange protocol=tcp

# 換一個沒被保留的 port
uvicorn app.main:app --reload --port 8010
```

### Backend 啟動但前端「沒資料」

99% 是 **CORS** 問題。Vite 自動跳 port 時（5173 → 5174 → 5175...），瀏覽器會用新 port 當 origin，但後端 `CORS_ORIGINS` 預設只允許特定 port。

排查：
1. 看 frontend terminal 印的 `Local:` 是哪個 port
2. 看 backend log，請求來了嗎？status 是 200 嗎？
3. **最關鍵**：開瀏覽器 F12 → Console，有沒有 `CORS` 紅字

修法：在 `backend/.env` 把 `CORS_ORIGINS` 加上對應的 port，重啟 backend。預設已經包含 `5173-5177`。

> 為什麼 backend log 看起來 200 OK 但前端拿不到？
> CORS 是純粹瀏覽器端的安全機制。伺服器照常處理請求並回應，是瀏覽器收到 response 後**主動把它丟掉**。所以後端 log 看不出來，**一定要看瀏覽器 DevTools**。

### 部署後活動列表異常（太多排 / 篩選沒反應）

CloudFront 預設會**吃掉 query string**。`?size=4&category=講座` 被 CloudFront 移除後，後端用預設 `size=20` 回傳所有資料。

修法：在 CloudFront Distribution → Behaviors → `/api/*` 的 Cache policy 改成 `CachingDisabled`，Origin request policy 改成 `AllViewer`。

### `npm` 不是內部或外部命令（Windows）

Node.js 沒裝好或沒重開 terminal。重開 PowerShell 再試。

### `python` 跳出 Microsoft Store（Windows）

Windows 預設的 alias 在搗亂。**重裝 Python 並務必勾「Add Python to PATH」**，或改用 `py`：
```powershell
py -m venv venv
py -m pip install -r requirements.txt
```

### PowerShell 啟動 venv 跳「無法載入指令碼」

用系統管理員身分跑：
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### `ModuleNotFoundError: No module named 'app'`

你不在 `backend/` 目錄下跑 uvicorn。`cd backend` 後再執行。

### `ModuleNotFoundError: No module named 'psycopg2'`

`DATABASE_URL` 的 scheme 寫成 `postgresql://` 了。改成 `postgresql+psycopg://`（用 v3 driver）。

### `ModuleNotFoundError: No module named 'psycopg'`

driver 沒裝。`pip install -r requirements.txt`。

### `sqlalchemy.exc.NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgresql.psycopg`

SQLAlchemy 太舊。`pip install --upgrade sqlalchemy`，需要 `2.0.36+`。

### Postgres `connection refused`

Postgres 沒在跑、port 不對、防火牆擋了。先用 `psql -h HOST -p PORT -U USER -d DB` 試，能連上 psql 才有可能用 SQLAlchemy 連。

### bcrypt 安裝失敗（Windows）

先升級 pip：
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 想重置 SQLite DB

```bash
rm backend/dev.db
# 重啟 uvicorn 自動建表
```

### 想看 DB 內容

- **SQLite**：[DB Browser for SQLite](https://sqlitebrowser.org/) 開 `backend/dev.db`
- **Postgres**：[DBeaver](https://dbeaver.io/) / [TablePlus](https://tableplus.com/) / pgAdmin 連線

### 路徑出現中文 / 空格亂碼

把專案放在純英文路徑（例：`C:\workspace\` 而不是 `C:\Users\使用者\桌面\`），可以避開很多 Python / Node 的怪 bug。
