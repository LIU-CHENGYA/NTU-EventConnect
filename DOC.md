# NTU EventConnect — 技術文件

> 軟體工程課期末專案。本文件供組員 onboarding 與部署參考。
> 對應大綱：[`DOC_INFRA.md`](./DOC_INFRA.md)。

---

## 1. 專案概覽

**NTU EventConnect** 是台大校園活動的整合與社群平台。它把 `my.ntu.edu.tw/actregister` 上分散的講座／課程／工作坊／比賽等資料聚合起來，再加上**評論貼文、評分、收藏、報名紀錄**等社群功能，讓學生用一個介面就能完成「找活動 → 看評論 → 收藏 → 報名 → 寫心得」的完整流程。

### 解決什麼問題

- **活動分散**：校網介面老舊、活動類別散亂、難以搜尋。
- **沒有口碑**：學生報名前無從得知前人評價。
- **缺乏個人化**：無收藏、無報名紀錄、無分類追蹤。

### 主要 user flow

```
未登入訪客
  ├─ 瀏覽首頁活動列表 / 熱門 / 分類 / 搜尋
  ├─ 看活動詳情 + 公開評論
  └─ 看公開貼文詳情

登入使用者（額外）
  ├─ 收藏活動 / 收藏貼文
  ├─ 報名活動場次（success / waitlist / cancelled）
  ├─ 對活動寫評論貼文（含評分 0–5、圖片）
  ├─ 留言、按讚、收藏其他人的貼文
  ├─ 個人頁：我的貼文、收藏、報名紀錄、編輯個資
  └─ 草稿（visibility=private）
```

### 系統架構

```
┌──────────────┐    HTTPS    ┌──────────────┐    SQL    ┌──────────────┐
│  React SPA   │────────────▶│  FastAPI     │──────────▶│  SQLite      │
│  (Vite/MUI)  │   JSON/JWT  │  (Python)    │           │  or Postgres │
└──────┬───────┘             └──────┬───────┘           └──────────────┘
       │                            │
       │ Google ID token            │ httpx
       ▼                            ▼
┌──────────────┐             ┌──────────────┐
│  Google      │             │  Google      │
│  Identity    │             │  tokeninfo   │
│  Services    │             │  endpoint    │
└──────────────┘             └──────────────┘

離線 ETL（一次性）：
  my.ntu.edu.tw → crawl_*.py → fetch_data/csv/events.csv
                                    │
                                    ▼
                       backend/scripts/seed_events.py → DB
```

---

## 2. Tech Stack

### 前端
| 類別 | 套件 | 版本 | 用途 |
|---|---|---|---|
| 框架 | React | 19.2.4 | UI |
| Build | Vite | 8.0.1 | dev server / bundler |
| UI Kit | MUI + Emotion | 7.3.9 / 11.14 | 元件、主題 |
| 路由 | react-router-dom | 7.13.2 | SPA routing |
| HTTP | axios | 1.14.0 | API client |
| 測試 | vitest + @testing-library | 2.1.9 / 16.1 | 單元測試 |
| 其他 | swiper | 12.1.3 | 輪播 |

Google SSO 採用瀏覽器端 **Google Identity Services**（透過 `<script>` 載入，**不**裝 npm 套件）。

### 後端
| 類別 | 套件 | 版本 | 用途 |
|---|---|---|---|
| 框架 | FastAPI | 0.115.0 | Web API |
| Server | uvicorn | 0.32.0 | ASGI |
| ORM | SQLAlchemy | 2.0.36 | DB 抽象層 |
| Schema | Pydantic + pydantic-settings | 2.9.2 / 2.5.2 | I/O 驗證、env |
| Auth | python-jose, passlib[bcrypt], bcrypt | 3.3 / 1.7.4 / 4.0.1 | JWT、密碼 hash |
| HTTP client | httpx | 0.27.2 | Google tokeninfo |
| Multipart | python-multipart | 0.0.12 | 上傳檔案 |
| Email | email-validator | 2.2.0 | EmailStr 驗證 |
| 測試 | pytest | 8.3.3 | 後端測試 |

### 資料庫
- **dev**：SQLite（`backend/dev.db`，`.gitignore` 排除）
- **prod**：可換 Postgres（改 `DATABASE_URL` 即可，無 SQLite-only 語法）

### 第三方
- **Google Identity Services**：SSO（前端取 ID token、後端透過 `oauth2.googleapis.com/tokeninfo` 驗證 + 比對 `aud`）
- **Dicebear**：使用者頭像 fallback（`api.dicebear.com/7.x/adventurer/svg?seed=<id>`）
- **Unsplash**：seed 時為活動類別填預設封面圖

### 資料來源
NTU 活動 CSV → `backend/scripts/seed_events.py` 寫入 DB。CSV 由 `fetch_data/crawl_*.py` 三層爬蟲產生（細節見 `fetch_data/info.md`）。

### 版本鎖定政策
- 所有 npm 套件 `package.json` 用**精確版本**（無 `^` `~`），保留 `package-lock.json`
- 所有 Python 套件 `requirements.txt` 用 `==`
- **禁止使用發布未滿 7 天的版本**（防供應鏈投毒）。新增依賴前以 `npm view <pkg> time` / `pip index versions <pkg>` 確認

---

## 3. 系統功能清單

### 3.1 認證
- Email + 密碼註冊（bcrypt hash）
- Email + 密碼登入
- Google SSO（ID token → 後端用 `tokeninfo` endpoint 驗 `aud` 與 `email_verified`）
- 首次 SSO 登入會回傳 `needs_username=true`，前端引導使用者填名稱（`PATCH /api/users/me`）
- JWT bearer token，預設 7 天到期

### 3.2 活動
- 列表：分類過濾、關鍵字（標題＋內容 LIKE）、排序（id / hot=剩餘名額升冪）
- 分頁（page/size，size 預設 20，上限 100）
- 詳情頁：活動主檔 + 多場次清單（`event_sessions`）
- 分類列表（`/api/events/categories`，含每類數量）

### 3.3 評論貼文
- 建立 / 編輯 / 刪除（只能改自己的）
- 評分 0–5、文字內容、多張圖片
- visibility = `public` | `private`（private 即草稿）
- 詳情頁顯示留言、按讚數、是否已按讚／收藏

### 3.4 互動
- 活動收藏 / 取消收藏
- 貼文收藏 / 取消收藏
- 貼文按讚 / 取消（複合 PK，幂等）
- 留言（不可編輯，只能由作者刪除）

### 3.5 報名
- 對 `event_session` 報名
- **原子扣名額**：`UPDATE event_sessions SET remaining_slots = remaining_slots - 1 WHERE id=? AND remaining_slots > 0`
  - rowcount=1 → status=`success`
  - rowcount=0 → status=`waitlist`
- 取消報名：成功者釋放名額並 FIFO 提拔下一位 waitlist
- `UniqueConstraint(user_id, session_id)` 防重複報名
- 個人報名紀錄 `/api/users/me/registrations`（含 event 標題與場次資訊）

### 3.6 個人頁
- 我的貼文、即將到來的活動、收藏貼文、收藏活動
- 編輯個資（name / bio）
- 統計：`post_count` / `joined_event_count`

### 3.7 上傳
- `/api/uploads`（需登入）
- 副檔名白名單：`.jpg .jpeg .png .gif .webp`
- **Magic byte sniff**：實際讀檔頭比對，副檔名必須與內容一致
- 5 MB 上限
- 檔名 `secrets.token_hex(16)` + sniffed ext，使用者輸入完全不進入路徑（無 path traversal）

### 3.8 Admin / 種子腳本
- `python -m scripts.seed_admin`：建立 / 更新 admin 帳號（`admin@ntu.edu.tw / Admin123!`）
- `python -m scripts.seed_events`：從 CSV 寫入 events + sessions（依 `source_url` upsert，可重複執行）

---

## 4. 需求 → 實現對應表

| 需求 | 前端實現 | 後端實現 | 資料表 |
|---|---|---|---|
| 註冊登入 | `LoginPage` / `RegisterPage`、`AuthContext` | `POST /api/auth/register \| /login`、bcrypt | `users` |
| Google SSO | `LoginPage` 載入 GIS、取 credential | `POST /api/auth/google` 驗 `aud` | `users` |
| 活動列表 + 分類 + 搜尋 | `HomePage`：state 觸發 `eventsApi.list` | `GET /api/events`（filter + paginate） | `events` + `event_sessions` |
| 熱門活動 | HomePage `sort=hot` | subquery `MIN(remaining_slots) GROUP BY event_id` 再 outer join | 同上 |
| 分類選單 | HomePage `eventsApi.categories()` | `GET /api/events/categories` | 同上 |
| 活動詳情 + 評論 | `EventDetailPage` 並行抓 event + posts | `GET /api/events/{id}` + `GET /api/posts?event_id=...&page=1&size=10` | `events` + `posts` |
| 寫評論 | `PostCreatePage` | `POST /api/posts`（rating, content, images, visibility） | `posts` |
| 編輯／刪除評論 | `PostEditPage` / `PostDetailPage` | `PATCH/DELETE /api/posts/{id}`（owner-only） | `posts` |
| 留言 | `PostDetailPage` | `POST /api/posts/{id}/comments` | `comments` |
| 按讚 / 收藏貼文 | `PostCard` / `PostDetailPage` + `DataContext` | `POST/DELETE /api/posts/{id}/like \| /bookmark` | `post_likes`, `post_bookmarks` |
| 收藏活動 | `EventCard` + `DataContext.toggleEventBookmark` | `POST/DELETE /api/events/{id}/bookmark` | `event_bookmarks` |
| 報名／取消／候補 | `EventRegisterPage` | `POST /api/sessions/{id}/register`, `DELETE /api/registrations/{id}` | `registrations` + `event_sessions` |
| 我的報名紀錄 | `RegistrationRecordPage` / `ProfilePage` tab=1 | `GET /api/users/me/registrations` | 同上 |
| 我的收藏 | `ProfilePage` tab=2/3 | `GET /api/users/me/bookmarks/{events,posts}` | bookmarks |
| 我的草稿 | `ProfilePage` tab=0 | `GET /api/users/me/drafts`（visibility=private） | `posts` |
| 編輯個資 | `ProfilePage` Edit dialog | `PATCH /api/users/me` | `users` |
| 看他人個資 | `OtherProfilePage` | `GET /api/users/{id}` 含 post_count / joined_event_count | `users` + counts |
| 上傳圖片 | `PostCreatePage` `<input type=file>` | `POST /api/uploads`（magic-byte 驗證） | 檔案 → `uploads/` |

---

## 5. 資料模型

### 5.1 ER 圖

```
┌─────────┐       ┌─────────────────┐       ┌──────────────────┐
│  users  │───┐   │     events      │──┐    │  event_sessions  │
└─────────┘   │   └─────────────────┘  │    └──────────────────┘
     │        │           │            └─────────│   ▲
     │        │           │                      │   │
     │        │  ┌────────▼────────┐    ┌────────▼───┴────┐
     │        │  │ event_bookmarks │    │  registrations  │
     │        │  └─────────────────┘    └─────────────────┘
     │        │           ▲                      ▲
     │        │           │                      │
     │        └───────────┘                      │
     │                                           │
     ▼                                           │
┌─────────┐                                      │
│  posts  │──── comments / post_likes /          │
└─────────┘     post_bookmarks                   │
     ▲                                           │
     └───────────── (FK user_id) ────────────────┘
```

### 5.2 表結構摘要

#### `users`
| 欄位 | 型別 | 約束 |
|---|---|---|
| `id` | int | PK |
| `email` | str(255) | unique, index, not null |
| `password_hash` | str(255) | not null（SSO user 為空字串） |
| `name` | str(100) | not null |
| `student_id`, `department`, `avatar_url`, `bio` | nullable |  |
| `is_admin` | bool | default false |
| `created_at` | datetime tz | default utcnow |

#### `events`
| 欄位 | 備註 |
|---|---|
| `id` PK |  |
| `source_url` | unique, index — 用於 idempotent upsert |
| `title`, `content`, `category` (index), `image_url` |  |
| `organizer`, `organizer_contact`, `contact_phone`, `contact_email` |  |
| `registration_type`, `registration_fee`, `target_audience`, `restrictions`, `learning_category` |  |
| `created_at` |  |
| relationship | `sessions: list[EventSession]` cascade delete |

#### `event_sessions`
| 欄位 | 備註 |
|---|---|
| `id` PK |  |
| `event_id` FK → events.id ON DELETE CASCADE, index |  |
| `source_url` unique index |  |
| `session_name`, `session_content`, `instructor`, `location` |  |
| `date` (string YYYY-MM-DD), index |  |
| `time_range`, `raw_session_time` |  |
| `registration_start`, `registration_end` |  |
| `capacity` int, `remaining_slots` int | **報名扣的就是這欄** |
| `meal`, `civil_servant_hours`, `study_hours` |  |

#### `posts`
| 欄位 | 備註 |
|---|---|
| `id` PK |  |
| `user_id` FK → users CASCADE, index |  |
| `event_id` FK → events SET NULL, index, nullable | 純心情貼文可不關聯活動 |
| `rating` 0–5 |  |
| `content` text, `images` JSON list |  |
| `visibility` `public` \| `private` | private = 草稿 |
| `created_at`, `updated_at` (onupdate) |  |

#### `comments`
| 欄位 | 備註 |
|---|---|
| `id` PK |  |
| `post_id` FK CASCADE, index |  |
| `user_id` FK CASCADE, index |  |
| `content` text |  |
| `created_at` |  |

#### `post_likes` / `post_bookmarks` / `event_bookmarks`
複合 PK `(user_id, post_id)` 或 `(user_id, event_id)`：

| 欄位 | 備註 |
|---|---|
| `user_id` FK CASCADE, **PK** |  |
| `post_id` / `event_id` FK CASCADE, **PK**, **index** | 複合 PK 只覆蓋 user_id 開頭的查詢；secondary 欄位顯式加 index 才能讓 `WHERE post_id=?`（like_count 計算）走索引 |
| `created_at` |  |

#### `registrations`
| 欄位 | 備註 |
|---|---|
| `id` PK |  |
| `user_id` FK CASCADE, index |  |
| `session_id` FK CASCADE, index |  |
| `status` `success` \| `waitlist` \| `cancelled` |  |
| `registered_at` |  |
| **constraint** | `UniqueConstraint(user_id, session_id, name="uq_user_session")` 防重複報名 |

### 5.3 命名約定

- DB / 後端：`snake_case`
- Pydantic schema 以 `from_attributes=True` 直接從 ORM 物件 validate
- 前端：`camelCase`，由 `frontend/src/api/index.js` 的 `mapEvent` / `mapPost` mapper 轉換

---

## 6. API 規格

> 完整互動式文件啟動 backend 後可看 `http://localhost:8000/docs`（FastAPI 自動產生 Swagger UI）。本節列出主要端點與形態約定。

### 6.1 認證方式

所有需登入的端點透過 `Authorization: Bearer <jwt>` header。JWT payload：

```json
{ "sub": "<user_id>", "exp": <unix_ts> }
```

簽章：HS256，secret 由 `JWT_SECRET` 環境變數提供。預設值 `change-me-in-prod` 在 `ENV != "dev"` 時會 boot 失敗（防止把預設值帶上線）。

### 6.2 錯誤碼

| code | 意義 |
|---|---|
| 400 | 請求 payload 不合法 / 業務規則違反（例：email 已存在、檔案太大） |
| 401 | 未登入或 token 無效 |
| 403 | 權限不足（改別人的貼文／取消別人的報名） |
| 404 | 資源不存在（含 visibility=private 偽 404） |
| 409 | 衝突（已報名同一場次） |
| 422 | Pydantic 驗證失敗（欄位型別錯誤） |
| 500 | 伺服器錯誤（如 Google SSO 未設定 client id） |

### 6.3 主要端點

#### Auth
| Method | Path | 說明 |
|---|---|---|
| POST | `/api/auth/register` | `{email, password, name}` → `{access_token, user}` |
| POST | `/api/auth/login` | `{email, password}` → 同上 |
| POST | `/api/auth/google` | `{credential}` → `{access_token, user, needs_username}` |
| GET | `/api/auth/me` | 🔒 → 當前 user |

#### Events
| Method | Path | 參數 |
|---|---|---|
| GET | `/api/events` | `category`, `keyword`, `sort=id\|hot`, `page`, `size` |
| GET | `/api/events/categories` | — |
| GET | `/api/events/{id}` | — |
| GET | `/api/events/{id}/sessions/{sid}` | — |

回應 `EventListResponse = { items: EventDetailOut[], total, page, size }`。

#### Posts
| Method | Path | 說明 |
|---|---|---|
| GET | `/api/posts` | filter `event_id`, `user_id`, `visibility=public`, paginate |
| POST | `/api/posts` | 🔒 建立 |
| GET | `/api/posts/{id}` | optional auth；private 對非 owner 回 404 |
| PATCH | `/api/posts/{id}` | 🔒 owner |
| DELETE | `/api/posts/{id}` | 🔒 owner |
| POST | `/api/posts/{id}/comments` | 🔒 |
| POST/DELETE | `/api/posts/{id}/like` | 🔒（幂等） |
| POST/DELETE | `/api/posts/{id}/bookmark` | 🔒（幂等） |

#### Comments
| DELETE | `/api/comments/{id}` | 🔒 owner |

#### Bookmarks
| Method | Path | 說明 |
|---|---|---|
| POST/DELETE | `/api/events/{id}/bookmark` | 🔒 |
| GET | `/api/users/me/bookmarks/events` | 🔒 paginate |
| GET | `/api/users/me/bookmarks/posts` | 🔒 paginate |
| GET | `/api/users/me/drafts` | 🔒 paginate |

#### Registrations
| Method | Path | 說明 |
|---|---|---|
| POST | `/api/sessions/{sid}/register` | 🔒 → 自動分配 success / waitlist |
| DELETE | `/api/registrations/{rid}` | 🔒 owner，自動 FIFO 提拔 waitlist |
| GET | `/api/users/me/registrations` | 🔒 paginate（含 event 標題與場次資訊） |

#### Users
| Method | Path | 說明 |
|---|---|---|
| PATCH | `/api/users/me` | 🔒 改自己 |
| GET | `/api/users/{id}` | 任何人，含 `post_count` / `joined_event_count` |

#### Uploads
| POST | `/api/uploads` | 🔒 multipart `file`，回 `{url, filename, size}` |

### 6.4 範例

```http
POST /api/sessions/42/register
Authorization: Bearer eyJhbGciOi...

201 Created
{
  "id": 7,
  "user_id": 3,
  "session_id": 42,
  "status": "success",
  "registered_at": "2026-04-08T05:00:00+00:00"
}
```

---

## 7. 前端架構

### 7.1 目錄結構

```
frontend/src/
├── api/
│   ├── client.js            # axios instance（baseURL + timeout + token interceptor）
│   └── index.js             # endpoint wrappers + snake→camel mappers
├── components/
│   ├── ErrorBoundary.jsx    # 全域錯誤邊界
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx   # auth gate（等 ready 才導向）
│   ├── EventCard.jsx
│   └── PostCard.jsx
├── context/
│   ├── AuthContext.jsx      # user, login, register, googleLogin, logout, ready
│   └── DataContext.jsx      # bookmark sets, drafts, refreshUserData
├── pages/                   # 路由對應頁
├── theme.js                 # tokens（顏色、字型、shadow）
├── App.jsx                  # routing tree
└── main.jsx                 # ErrorBoundary > Router > Auth > Data > App
```

### 7.2 Routing 樹

```
/                            HomePage
/login                       LoginPage
/register                    RegisterPage
/forgot-password             ForgotPasswordPage
/events/:id                  EventDetailPage
/events/:id/register         EventRegisterPage
/events/create               🔒 EventCreatePage
/profile                     🔒 ProfilePage
/profile/:userId             OtherProfilePage
/posts/create                🔒 PostCreatePage
/posts/:id                   PostDetailPage
/posts/:id/edit              🔒 PostEditPage
/my-registrations            🔒 RegistrationRecordPage
```

`🔒` 代表包在 `<ProtectedRoute>`。`ProtectedRoute` 一定要等 `useAuth().ready === true` 才判斷 user，否則 mount 瞬間 user 還沒從 `/api/auth/me` 回來，會誤把已登入使用者導去 login。

### 7.3 Context 職責分工

#### `AuthContext`
- 儲存 `user`, `ready`
- mount 時讀 `localStorage.token`、call `/api/auth/me` 還原 session
- 提供 `login`, `register`, `googleLogin`, `logout`, `setUser`
- **`setUser` 用法**：profile 編輯後一定要 `setUser(updated)`，不要直接改 `user.name = ...`（React 不會 re-render）

#### `DataContext`
- 儲存 `bookmarkedEventIds: Set<int>` / `bookmarkedPostIds: Set<int>` / `drafts`
- 等 `auth.ready` 才呼 `refreshUserData`，避免閃爍
- `toggleEventBookmark`：先 optimistic update，失敗時 revert（一定 new Set 才能讓 React 重 render）
- 失敗的 refresh 會 `console.error`，但保留舊資料避免 UI 空白

### 7.4 API 層

`client.js`：

```js
const api = axios.create({ baseURL, timeout: 15000 });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
```

`index.js` 提供 typed-ish wrapper（`authApi`, `eventsApi`, `postsApi`, `bookmarksApi`, `usersApi`），所有後端 snake_case 經 `mapEvent` / `mapPost` 轉成前端 camelCase 後才進 component state。**Component 內不直接存後端原始物件**。

### 7.5 Theme

`theme.js` 定義一組設計 tokens（顏色、字型、shadow），元件以 `tokens.color.navy` 等方式引用，避免散落 hex code。

---

## 8. 後端架構

### 8.1 目錄結構

```
backend/
├── app/
│   ├── api/                # FastAPI routers，一個 file 一個資源
│   │   ├── auth.py
│   │   ├── events.py
│   │   ├── posts.py
│   │   ├── comments.py
│   │   ├── bookmarks.py
│   │   ├── registrations.py
│   │   ├── users.py
│   │   └── uploads.py
│   ├── core/
│   │   ├── config.py       # Settings (env vars + JWT secret guard)
│   │   ├── deps.py         # get_current_user / get_current_user_optional
│   │   └── security.py     # bcrypt + JWT encode/decode
│   ├── db/
│   │   └── session.py      # engine, SessionLocal, Base, get_db
│   ├── models/             # SQLAlchemy 2.0 typed models
│   ├── schemas/            # Pydantic I/O schemas
│   └── main.py             # app + CORS + create_all + router include
├── scripts/
│   ├── seed_admin.py
│   └── seed_events.py
├── tests/                  # pytest（含 conftest.py 用 in-memory SQLite）
├── uploads/                # 上傳檔案儲存（gitignored）
├── pytest.ini
└── requirements.txt
```

### 8.2 依賴注入

| Dependency | 用途 |
|---|---|
| `get_db` | 每 request 建立一個 SessionLocal，request 結束 close |
| `get_current_user` | 強制登入；token 無效 / 缺失 → 401 |
| `get_current_user_optional` | 公開端點需要區分匿名 vs 登入（如 `GET /api/posts/{id}` 顯示是否已按讚） |

### 8.3 Settings

`app/core/config.py` 從 `.env` + 環境變數讀取：

```python
class Settings(BaseSettings):
    ENV: str = "dev"
    DATABASE_URL: str = "sqlite:///./dev.db"
    JWT_SECRET: str = "change-me-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: str = "http://localhost:5173"
    GOOGLE_CLIENT_ID: str = ""
```

**Boot guard**：`ENV != "dev"` 且 `JWT_SECRET == _DEFAULT_SECRET` 時 raise，避免把 placeholder 帶上線。

### 8.4 並行性與一致性

#### 報名扣名額
SQLite 不支援 `SELECT ... FOR UPDATE`，因此採用**原子 UPDATE + WHERE 守衛**：

```python
claimed = (
    db.query(EventSession)
    .filter(EventSession.id == sid, EventSession.remaining_slots > 0)
    .update({EventSession.remaining_slots: EventSession.remaining_slots - 1},
            synchronize_session=False)
)
status_ = "success" if claimed == 1 else "waitlist"
```

此語法在 SQLite/Postgres/MySQL 皆 portable。配合 `UniqueConstraint(user_id, session_id)` 即可在預設 isolation level 下避免重複報名與超賣。

#### 取消報名 → 候補提拔
取消成功者後，原子 +1 釋放名額，再依 `registered_at` ASC 找第一個 waitlist，再原子 -1 試圖佔位（若 race 導致 0 就維持 waitlist）。

### 8.5 SQL 效能要點

- **selectinload**：所有列表/詳情都用 `selectinload(Event.sessions)` / `selectinload(Post.comments).selectinload(Comment.user)` 避免 N+1
- **熱門排序**：用 subquery `MIN(remaining_slots) GROUP BY event_id` 再 outer join，避免 GROUP BY ↔ SELECT 欄位的可攜性問題
- **複合 PK 索引**：`PostLike(user_id, post_id)` 等只覆蓋 user_id 開頭查詢；對 `WHERE post_id=?`（like_count）顯式加 `index=True` on `post_id`

### 8.6 安全控制

- bcrypt 密碼 hash
- JWT HS256，secret 不得為預設值
- CORS：明確 origin allowlist（不是 `*`），methods/headers 也是顯式列出（`allow_credentials=True` 不可搭配 wildcard）
- 上傳：副檔名白名單 + magic byte sniff + 隨機檔名
- 私人貼文回 404 而非 403（避免存在性洩漏）

---

## 9. 部署須知

### 9.1 環境變數

#### 後端 `backend/.env`
| Var | 範例 | 必填 | 說明 |
|---|---|---|---|
| `ENV` | `dev` / `prod` | 否 | prod 必須改 JWT_SECRET 否則 boot 失敗 |
| `DATABASE_URL` | `sqlite:///./dev.db` / `postgresql+psycopg://user:pw@host/db` | 是 | |
| `JWT_SECRET` | 隨機 64 字元字串 | **prod 必填** | `python -c "import secrets;print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | `HS256` | 否 | |
| `JWT_EXPIRE_MINUTES` | `10080` | 否 | 預設 7 天 |
| `CORS_ORIGINS` | `https://app.example.com,https://staging.example.com` | 是 | 逗號分隔 |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | SSO 必填 | 必須與前端的 client id 完全一致 |

#### 前端 build 時環境變數
| Var | 範例 | 說明 |
|---|---|---|
| `VITE_API_URL` | `https://api.example.com` | 後端 base URL |
| `VITE_GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | 同後端 |

> ⚠️ Vite 的 env 必須以 `VITE_` 開頭；build 完即被 inline 進 bundle，**不要塞秘密**。

### 9.2 Google OAuth 設定

1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID（type = Web application）
3. Authorized JavaScript origins：填前端網域（dev：`http://localhost:5173`）
4. Authorized redirect URIs：本專案用 GIS popup 流程，可不填
5. 拿到 client id 同時設給前端 `VITE_GOOGLE_CLIENT_ID` 與後端 `GOOGLE_CLIENT_ID`

### 9.3 資料庫

- **dev**：SQLite 開箱即用（`backend/dev.db`，已 gitignored）
- **prod**：強烈建議 Postgres
  - 修改 `DATABASE_URL`
  - 安裝對應 driver：`pip install psycopg[binary]`
  - 先 boot 一次讓 `Base.metadata.create_all` 建表（簡化做法），或日後加 Alembic 做正規 migration

### 9.4 首次部署流程

```bash
# Backend
cd backend
python -m venv venv && source venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env  # 然後改 JWT_SECRET、GOOGLE_CLIENT_ID
python -m scripts.seed_events     # 從 fetch_data/csv/events.csv 載入活動
python -m scripts.seed_admin      # 建 admin@ntu.edu.tw / Admin123!
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
VITE_API_URL=https://api.example.com VITE_GOOGLE_CLIENT_ID=xxx npm run build
# dist/ 丟給靜態 host（Nginx / Vercel / Netlify / Cloudflare Pages）
```

### 9.5 Reverse proxy / HTTPS

正式環境建議：

```
https://app.example.com  ── Nginx ──┬── /            → frontend dist/
                                    ├── /api/        → uvicorn :8000
                                    └── /uploads/    → uvicorn :8000
```

注意：
- 前後端**同 origin**最簡單，可省 CORS 設定
- 若分 origin，務必把前端 origin 列在後端 `CORS_ORIGINS`
- HTTPS 終止在 Nginx，uvicorn 跑 HTTP 即可
- `uploads/` 資料夾建議掛載到 host volume 或物件儲存（S3）以便後端橫向擴展

### 9.6 生產環境提醒

- ✅ `JWT_SECRET` 一定要設強密鑰（boot guard 會擋）
- ✅ 不要在 prod 用 SQLite
- ✅ `CORS_ORIGINS` 不用 `*`
- ✅ 前後端同 domain 或正確設好 CORS
- ⚠️ JWT 仍存在 `localStorage`（XSS 風險），見第 11 節 TODO
- ⚠️ Auth 端點目前無 rate limiting，見第 11 節 TODO

---

## 10. 開發 & 測試

### 10.1 本地啟動

```bash
# 後端（terminal 1）
cd backend
source venv/Scripts/activate
uvicorn app.main:app --reload --port 8000
# Swagger: http://localhost:8000/docs

# 前端（terminal 2）
cd frontend
npm run dev
# http://localhost:5173
```

### 10.2 測試

```bash
# 後端：pytest（70 個 test，跑一次 ~13 秒）
cd backend
python -m pytest -q

# 前端：vitest 單元測試
cd frontend
npm test

# 前端：build 檢查
npm run build
```

後端測試使用 `tests/conftest.py` 中的 in-memory SQLite fixture，每個 test 都是乾淨的 DB。

### 10.3 測試覆蓋層級

| 檔案 | 涵蓋範圍 |
|---|---|
| `test_auth.py` | 註冊、登入、Google SSO mocked tokeninfo、`/me` |
| `test_events.py` | list / detail / 分類 / 搜尋 / hot sort / pagination |
| `test_posts.py` | CRUD / private 偽 404 / like / bookmark / comment |
| `test_registrations.py` | success vs waitlist 分流、cancel + FIFO 提拔、unique constraint |
| `test_users_uploads.py` | `PATCH /users/me`、上傳 magic byte 驗證 |
| `test_seed_events.py` | seed 腳本 idempotency |
| `test_edge_cases.py` | 邊界條件 |
| `frontend/src/test/mappers.test.js` | snake↔camel mapper |

### 10.4 種子資料

CSV 來源：`fetch_data/csv/events.csv`（由 `crawl_first/second/third.py` 產出，細節見 `fetch_data/info.md`）。

```bash
cd backend
python -m scripts.seed_events   # idempotent，依 source_url upsert
python -m scripts.seed_admin    # admin@ntu.edu.tw / Admin123!
```

---

## 11. 已知限制 / Roadmap

### 還沒做的功能
- Password reset / forgot password 流程（前端有頁面，後端尚未實作）
- Email 驗證
- Real-time 通知（候補提拔、按讚）
- 上傳改用物件儲存（S3 / R2），目前是 local file
- 完整 admin panel（目前只有 seed 腳本）
- 前端 i18n（目前介面寫死中文）
- Code splitting（目前主 bundle ~1.1 MB）

### 安全性 TODO（暫緩、需後續處理）

#### A. JWT 改用 httpOnly cookie
**現況**：token 存於 `localStorage`，存在 XSS 被竊取的風險。

**遷移範圍**：
- 後端：`/api/auth/login | register | google` 改 `Set-Cookie`（HttpOnly + Secure + SameSite=Lax/Strict）
- 後端：`get_current_user` 改從 cookie 讀 token（保留 Bearer fallback 供 mobile？需設計）
- 前端：`axios.create({ withCredentials: true })`，移除所有 `localStorage` token 操作
- 同時必須引入 CSRF 保護（double-submit token 或 SameSite=Strict）
- CORS 已是顯式 origin，沒問題

**為何暫緩**：是架構性遷移，影響面大，需安排專門 sprint。

#### B. 後端 rate limiting
**現況**：`/api/auth/login`、`/register`、`/google` 沒有任何節流，可能被暴力破解或濫用。

**作法**：引入 `slowapi`（FastAPI 生態最常用，基於 `limits` 庫），對 auth 端點套 per-IP 限制（例：5/minute）。

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
def login(...): ...
```

**為何暫緩**：需新增 dependency，依供應鏈規則必須先確認版本發布 ≥ 7 天。

### 已知技術債
- 主 JS bundle > 500 KB，可用 dynamic import code-split
- DB schema 用 `Base.metadata.create_all` 建表，沒有 migration（換 schema 要手動 drop / 寫遷移腳本）
- `DataContext.refreshUserData` 失敗只 console.error，沒有 toast 通知
- `EventDetailPage` 評論用「載入更多」按鈕而非無限捲動

---

## 12. 附錄

### 12.1 套件版本清單

完整列表見 `backend/requirements.txt` 與 `frontend/package.json`。版本鎖定政策：
- `package.json` 用精確版本（無 `^` `~`）
- `requirements.txt` 用 `==`
- 兩邊 lockfile 均 commit 進 repo
- 新套件須驗證發布 ≥ 7 天

### 12.2 FAQ

**Q：為什麼活動有 `events` 與 `event_sessions` 兩張表？**
A：一個活動可能有多場次（不同時間／地點／講師），報名是針對「場次」而非「活動」。

**Q：為什麼私人貼文回 404 不是 403？**
A：避免洩漏「這個 ID 的貼文存在但你看不到」這個事實。對非 owner 來說，私人貼文等同不存在。

**Q：為什麼 Registration 用 status 而不是「報名 / 候補」兩張表？**
A：取消後仍要保留紀錄供分析；同一筆資料 status 變化單表處理最簡單。

**Q：為什麼 Google SSO 用 GIS（瀏覽器 SDK）而不是 OAuth code flow？**
A：純 SPA 沒有後端 redirect 流程，GIS 讓前端直接拿 ID token 給後端驗證最簡單。

**Q：為什麼前端不裝 google 套件？**
A：Google Identity Services 是官方 `<script>` 載入的瀏覽器全域 API，沒有也不需要 npm 套件。

### 12.3 貢獻指南

#### Branch
- `main` 為主分支
- 功能分支：`feature/<short-desc>`，bug：`fix/<short-desc>`

#### Commit message
- 簡短中英不拘
- **禁止**加 `Co-Authored-By: Claude ...` trailer（規則見 `CLAUDE.md`）
- 一個 commit 一個邏輯改動

#### 套件安全
- 新增任何 npm / Python 套件前必須查發布時間
- 不得使用 < 7 天的版本
- 細節見 `CLAUDE.md` §「套件版本安全規則」

#### Code review
- PR 前先 `npm run build` + `python -m pytest -q`
- DB schema 改動要在 PR 描述標明
