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

## v3 已完成（本輪）

- `src/pages/RegisterPage.jsx` — 597 白卡 20r、`#eff4f8` pill 輸入 + icon、密碼可見切換、navy「建立帳號」、或 divider + SSO outlined、返回登入 link
- `src/pages/ForgotPasswordPage.jsx` — 同 597 卡版型、navy「送出重設連結」、送出後大 `CheckCircle` 成功態
- `src/pages/EventRegisterPage.jsx` — bg `#eff4f8`、arrow + Lemon italic 32「活動報名」+ 52 avatar、四張 20r 卡 + pill 陰影、`#eff4f8` 10r pill 輸入、底部 54h pill「取消 / 確認報名」（黑底 CTA）、成功態大 CheckCircle

## 待處理

- `src/pages/OtherProfilePage.jsx`
- `src/pages/PostCreatePage.jsx`
- `src/pages/PostDetailPage.jsx`
- `src/pages/PostEditPage.jsx`
- `src/pages/RegistrationRecordPage.jsx`

建議下一輪先處理 Post 系列三頁（共用樣式較省 context），再收尾 OtherProfilePage 與 RegistrationRecordPage。
