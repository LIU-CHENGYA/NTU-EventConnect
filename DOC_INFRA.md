# 技術文件大綱（DOC_INFRA）

> 規劃中的章節結構，確認後再展開內文。

## 1. 專案概覽
- 一句話定位（NTU 活動聚合 + 評論 + 收藏 + 報名平台）
- 目標使用者、解決什麼問題
- 主要 user flow（瀏覽 → 收藏/報名 → 寫評論）
- 系統架構圖（前端 SPA ↔ FastAPI ↔ SQLite/Postgres ↔ Google OAuth）

## 2. Tech Stack
- 前端：React 19 + Vite、MUI 7、react-router-dom 7、axios、Vitest
- 後端：FastAPI 0.115、SQLAlchemy 2.0、Pydantic 2、JWT (python-jose)、bcrypt、httpx
- 資料庫：SQLite (dev) / 可換 Postgres
- 第三方：Google Identity Services（SSO）、Dicebear（avatar）
- 資料來源：NTU 活動 CSV → seed script
- 版本鎖定政策（精確版本、>7 天舊版規則）

## 3. 系統功能清單
按模組列：
- 認證：Email/密碼、Google SSO、首次登入設定使用者名稱、JWT session
- 活動：列表/搜尋/分類過濾/分頁、詳情頁、多場次顯示、剩餘名額
- 評論貼文：建立/編輯/刪除、評分、圖片、公開/私人草稿、詳情頁
- 互動：愛心收藏（活動 / 貼文）、留言、按讚
- 報名：報名/取消、候補轉正、報名紀錄
- 個人頁：我的貼文、即將到來的活動、收藏貼文、收藏活動、編輯個資
- Admin：種子腳本

## 4. 需求 → 實現對應表
| 需求 | 前端實現 | 後端實現 | 資料表 |
依模組分塊。

## 5. 資料模型
- ER 圖
- 各表欄位 + 約束（unique、index、cascade）
- snake_case ↔ camelCase mapping 規則

## 6. API 規格
- 認證方式（Bearer JWT）
- Endpoint 表 + 範例 request/response
- 錯誤碼約定
- 或直接指向 FastAPI `/docs`

## 7. 前端架構
- 目錄結構
- Routing 樹 + ProtectedRoute (`ready` race 修復 why)
- Context 職責分工（Auth / Data）
- API 層 + mappers
- Theme/tokens

## 8. 後端架構
- 目錄結構（api / models / schemas / core / db / scripts）
- 依賴注入（`get_db`、`get_current_user`、`get_current_user_optional`）
- Settings 讀 `.env`

## 9. 部署須知
- 環境變數完整列表 + 範例
  - 後端：`DATABASE_URL`、`JWT_SECRET`、`CORS_ORIGINS`、`GOOGLE_CLIENT_ID`
  - 前端：`VITE_GOOGLE_CLIENT_ID`、`VITE_API_BASE_URL`
- Google OAuth 設定步驟（Cloud Console）
- 資料庫：dev SQLite vs prod Postgres、Alembic 與否
- 首次部署：install → seed events → seed admin → uvicorn
- 前端 build → 靜態檔交付
- CORS / HTTPS / cookie 注意事項
- 生產建議（reverse proxy、JWT secret、不要用 SQLite）

## 10. 開發 & 測試
- 本地啟動指令
- pytest / vitest 跑法
- Test data seed
- 測試覆蓋層級

## 11. 已知限制 / Roadmap
- 還沒做的（password reset、email verify、real-time、檔案上傳到 S3）
- 已知技術債
- **安全性 TODO（暫緩、需後續處理）**
  - **JWT 改用 httpOnly cookie**：目前 token 存於 `localStorage`，存在 XSS 被竊取風險。
    遷移範圍：後端 `/api/auth/login|register|google` 改 `Set-Cookie`（HttpOnly + Secure +
    SameSite）、`get_current_user` 改從 cookie 讀；前端 `axios.create({ withCredentials: true })`、
    移除所有 `localStorage` token 操作；同時需引入 CSRF 保護（double-submit token 或 SameSite=Strict）。
  - **後端 rate limiting**：目前 `/api/auth/login`、`/register`、`/google` 沒有任何節流，
    可被暴力破解或濫用。建議引入 `slowapi`，對 auth 端點套 per-IP 5/minute 之類的限制。
    安裝前依供應鏈規則確認版本發布 ≥7 天。

## 12. 附錄
- 套件版本清單
- FAQ
- 貢獻指南（branch / commit message 規則 → 對應 CLAUDE.md）

---

## 待確認決策
1. 讀者：組員 onboarding（預設）
2. 語言：中文
3. 長度：精簡優先 vs 完整
4. 圖：Mermaid 嵌 Markdown
5. 檔案放哪：單檔 vs `docs/` 多檔
6. API 規格手寫 vs 指向 Swagger
