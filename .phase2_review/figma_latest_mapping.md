# Figma 最新版（緑チェック付き）マッピング

各 PNG の絶対パス: `/Users/kuzehiroshi/Desktop/ソフトウェア開発/figma_extracted/`

| Figma frame | PNG file | 期待される実装 |
|---|---|---|
| 活動首頁 (登入後) + 篩選條件 (除了台大官方份類和#標籤分類其餘都是這個頁面) | `活動首頁 (登入後) + 篩選條件 (除了台大官方份類和#標籤分類其餘都是這個頁面).png` | `frontend/src/pages/HomePage.jsx` の base UI |
| 活動首頁 (登入後) + 篩選條件使用在台大官方分類 | `活動首頁 (登入後) + 篩選條件使用在台大官方分類.png` | HomePage tab=official 時の二次チップ行 |
| 活動首頁 (登入後) + 篩選條件使用在#標籤分類 | `活動首頁 (登入後) + 篩選條件使用在#標籤分類.png` | HomePage tab=tags 時の二次チップ行 |
| 活動詳細頁面2 Updated | `活動詳細頁面2.png` | `frontend/src/pages/EventDetailPage.jsx` |
| 註冊畫面 + SSO | `註冊畫面 + SSO.png` | `frontend/src/pages/RegisterPage.jsx` (Google 按鈕在上) |
| 個人頁-取消活動確認頁面 | `個人頁-取消活動確認頁面.png` | `frontend/src/components/CancelConfirmDialog.jsx` |
| 留言板首頁 | `留言板首頁.png` | `frontend/src/pages/BoardPage.jsx` |
| 留言內頁 | `留言內頁.png` | `frontend/src/pages/BoardPostDetailPage.jsx` |
| 新增留言 | `新增留言.png` | `frontend/src/components/BoardPostCreateDialog.jsx` |
| 新增留言 + 活動下拉式選單 | `新增留言 + 活動下拉式選單.png` | BoardPostCreateDialog の Event Popover |
| 新增留言 + 群組下拉式選單 | `新增留言 + 群組下拉式選單.png` | BoardPostCreateDialog の Group Popover |
| 建立 / 編輯群組 | `建立 / 編輯群組.png` | `frontend/src/components/GroupEditDialog.jsx` |

## 想定 UI 要素 (要件文書 + Figma 観察ベース)

### 活動首頁 v2
- ナビバー: NTU EventConnect ロゴ → 留言板 ボタン → 繁體中文 ⌄ ドロップダウン → 検索 pill → アバター/登入
- メインタブ: 全部活動 / 台大官方分類 / #標籤分類 / 免費活動 / 有提供餐點 / 企業徵才 / 英文相關 / 更多
- 二次チップ行 (台大官方分類 or #標籤分類 タブ時のみ表示)
- フィルタ行: 關鍵字 + 日期範圍 + 地點 + 検索ボタン
- カードグリッド: 活動列表 / 熱門活動

### 取消確認ダイアログ
- 赤背景ヘッダ「⚠ 確定要取消報名嗎？此操作無法復原，請謹慎確認」
- 活動カード（画像+カテゴリ+タイトル+場次+日時+地点）
- bullet: 取消後，您的名額將立即釋出給其他候補者。/ 若活動已接近截止日期，您可能無法重新報名。
- ボタン: [暫不取消] (白系) / [確定取消報名] (#FF4D4F)

### 留言板首頁
- 左サイドバー:
  - 分類: 全部留言 / 熱門 / 最新
  - 我的: 我的留言 / 收藏 / 私人
  - 群組: グループ列 + ＋建立群組
- 中央: 留言カードリスト
  - ヘッダ: avatar + 使用者名 + 投稿日時 + 可視性 chip (公開/私人/僅限群組)
  - 活動チップ (🎟 + 活動名)
  - タイトル太字
  - 本文 3 行省略
  - 画像サムネ (3枚まで)
  - ❤ likeCount / 🔖 bookmarkCount
- 右サイド: 本週熱門留言（タイトルのみ + ❤数）
- フローティングボタン右下: + 新增留言

### 新增留言モーダル
- ヘッダ: ✏️ 新增留言 [×]
- 選擇活動* — クリックで Popover、選択済は EventChip + 更換 link
- 警告: 🚫 只有活動結束後才可以留言分享
- 評分: 5 ★ + n / 5
- 標題*: テキスト入力
- 文字敘述*: textarea + 字數: x / 2000
- 右コラム: 選択中の活動プレビュー + 新增圖片 (PNG/JPG, 最多 4 張)
- フッター: 權限: 公開/私人/僅限群組 ＋ (group時) 群組ピッカー / [儲存草稿] [發佈]

### 活動下拉 Popover
- 検索 + 「🚫 僅顯示已結束的活動」ラベル
- カテゴリごとにグルーピング: 藝文活動類 / 就業博覽會 / 語言學習 …
- 各エントリ: emoji avatar + 活動名 + (カテゴリ chip) + 場次/日付 + 已結束 chip
- 選択中はチェック ✓

### 群組下拉 Popover
- 検索 「搜尋群組...」
- 各エントリ: 色付き avatar (1文字) + 群組名 + "n 位成員 • m 篇新留言"
- 選択中はチェック ✓

### 建立 / 編輯群組
- ヘッダ: 建立／編輯群組 [×]
- 群組名稱*: テキスト入力 (例: 資工系 2022)
- 邀請成員: Google G icon + Gmail input + [新增] ボタン
- 補足: 輸入對方 Gmail，對方收到邀請後可加入群組
- 已邀請成員 (n 人): 各エントリは color avatar + email + [×] (赤系)
- フッター: [取消] [儲存]
