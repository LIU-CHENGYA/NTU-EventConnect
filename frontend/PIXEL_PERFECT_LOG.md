# Figma Pixel-Perfect 對齊進度

追蹤各頁面對照 Figma (GgNiPSWQf4i99rKFdsDC3c) 的細部微調狀態。

## v2 已完成

### 基礎
- `src/theme.js` — 設計 token (`#eff4f8` bg、`#041547` navy、Lemon logo、shadows、navHeight 76)
- `src/components/Navbar.jsx` — 白 76px、Lemon italic 32 logo、pill 搜尋框、黑色「新增活動」pill、52 avatar + dropdown
- `src/components/EventCard.jsx` — 252×345、cover + heart 左上 + category 右上、星等、navy「查看詳情」CTA

### 頁面
- `src/pages/HomePage.jsx` — 兩個 section（活動列表 / 熱門活動）、推薦類別 chips、`>>` chevron、4 欄 grid
- `src/pages/LoginPage.jsx` — 597 白卡 20r、Email/密碼欄、忘記密碼、navy「登入」、或 divider、SSO outlined、立即註冊
- `src/pages/EventDetailPage.jsx` — arrow + Lemon「活動詳情」、左大圖 + 內容/評論卡、右標題 pill + 資訊卡 + 黑色「立即報名」54h pill
- `src/pages/ProfilePage.jsx` — 291 sidebar 兩卡、cover banner + 76 avatar + tab strip、Edit Profile `#39a7ff` pill、狀態 chip filter、3 欄 grid
- `src/pages/EventCreatePage.jsx` — 雙欄 label + pill 輸入、是/否 radio、學習類別 select、標籤 chips、新增圖片卡、`#39a7ff`「發布」

## v3 已完成

- `src/pages/RegisterPage.jsx` — 597 白卡 20r、`#eff4f8` pill 輸入 + icon、密碼可見切換、navy「建立帳號」、或 divider + SSO outlined、返回登入 link
- `src/pages/ForgotPasswordPage.jsx` — 同 597 卡版型、navy「送出重設連結」、送出後大 `CheckCircle` 成功態
- `src/pages/EventRegisterPage.jsx` — bg `#eff4f8`、arrow + Lemon italic 32「活動報名」+ 52 avatar、四張 20r 卡 + pill 陰影、`#eff4f8` 10r pill 輸入、底部 54h pill「取消 / 確認報名」（黑底 CTA）、成功態大 CheckCircle

## v4 已完成（本輪）

- `src/pages/PostCreatePage.jsx` — bg `#eff4f8`、arrow + Lemon italic 32「發表文章/寫評論」+ 52 avatar、左 20r 內容卡（pill 陰影）、星等 hover、`#eff4f8` 10r pill 多行輸入、虛線新增圖片區、權限 radio、底部 54h pill「儲存草稿 / 發布」（黑底 CTA）、右側 280 活動卡（cover + 12r 圖、日期/地點 icon）
- `src/pages/PostDetailPage.jsx` — bg `#eff4f8`、arrow + Lemon italic 32「文章詳細」+ 52 avatar、左 20r 內容卡：作者 44 avatar + 名字/時間、星等 28、whiteSpace pre-wrap 內容、200×200 12r 圖片 grid、isOwner 顯示 navy「編輯貼文」、右側 280 可點活動卡
- `src/pages/PostEditPage.jsx` — 同 PostCreate 結構、Lemon italic 32「編輯文章」、預載 rating/content/visibility、現有圖片 110×110 12r 預覽 + 虛線新增圖片區、底部「取消 / 儲存」54h pill（黑底 CTA）

## v5 已完成（本輪）

- `src/pages/OtherProfilePage.jsx` — bg `#eff4f8`、arrow + Lemon italic 32「個人主頁」+ 52 avatar、左側 291 sidebar 卡（Profile 統計 + Lexend 16 label + tag pill 用 ProfilePage 同套 TAG_COLORS）、右側 header 卡（gradient banner 90h + 76 avatar 浮出 + Lemon 名字 + 系所 + 「公開貼文」underline tab）、3 欄 PostCard grid
- `src/pages/RegistrationRecordPage.jsx` — bg `#eff4f8`、arrow + Lemon italic 32「報名紀錄」+ 52 avatar、Profile 同款 8r filter chip（active `rgba(57,167,255,0.42)`）、20r pill-shadow 卡列表（72×72 12r 縮圖、status 用 token success/warning/danger pill）、Collapse 展開 2 欄資訊 + 22r pill「查看活動 / 取消報名」（黑底 CTA）

## 待處理

- （optional）`src/components/PostCard.jsx` — 仍是舊樣式（`#1a237e` tag、`#e8eaf6` bg），建議下一輪比對 Figma 後對齊 EventCard 的 token 系統。其餘所有 page 已完成 v2~v5 對齊。
