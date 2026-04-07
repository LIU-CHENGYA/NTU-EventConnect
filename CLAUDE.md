## 套件版本安全規則（防供應鏈投毒）

安裝或新增任何 npm / Python 套件時，必須遵守以下規則：

### 版本選擇
- **禁止使用發布未滿 7 天的版本**。選擇版本時，優先使用已發布至少一週、且下載量穩定的版本
- 如果最新版本發布不到 7 天，應退回使用上一個穩定版本
- 可透過 `npm view <package> time` 或 `pip index versions <package>` 查詢發布時間

### 版本鎖定
- `package.json` 中使用**精確版本**（如 `"axios": "1.14.0"`），避免使用 `^` 或 `~` 範圍
- Python 專案在 `requirements.txt` 中使用 `==` 鎖定版本
- 確保 lockfile（`package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`）始終存在且被 commit 進 repo

### 可疑套件檢查
- 安裝前檢查套件的 npm/PyPI 頁面，注意：發布時間異常、維護者變更、新增不明依賴
- 如果發現可疑跡象，主動告知使用者並暫停安裝
