### Changelog

#### 2026-05-06
- 新增 `events_processed.csv`：修正內容欄位換行格式 \n、新增 7 個 tag 欄位
- 新增 `events_tags.csv`：長格式 tag 對應表（event_url, tag）
- 新增 `process_data.py`：後處理腳本
- 新增 `build_tags_table.py`：tag 對應表產生腳本
- 新增 英文版本 `events_en.csv`

---

### Python 腳本

| 腳本 | 功能 | 輸出 CSV |
| ---- | ---- | -------- |
| `crawl_first.py` | 爬取活動列表頁，取得所有母活動名稱與網址 | `activities.csv` |
| `crawl_second.py` | 爬取每個母活動頁，取得活動資訊與各場次連結 | `activity_session.csv` |
| `crawl_third.py` | 爬取每個場次詳細頁，取得完整場次資料 | `events.csv` |
| `process_data.py` | 修正換行格式（`\n`）、新增 7 個 boolean tag 欄位 | `events_processed.csv` |
| `build_tags_table.py` | 將 boolean tag 欄位展開為長格式 `(event_url, tag)` 對應表 | `events_tags.csv` |
| `translate_all.py` | 完整中英翻譯管線：rule-based 固定值 + LLM 自由文字（段落去重） | `events_en.csv` |

---

### 大概介紹

重要事項：
- 我 events_processed.csv 中也有包含了上層的資料（詳細可以看下面的），所以基本上可以只看這個 csv 就好
- 內文應該是抓 `session_content` 欄位
- 上次提到的大類別是 `activity_name_activity_session` 欄位
- 新增了英文欄位

搜集了 336 個活動，1217 活動場次，時間包含了 2025 2026

總共有三層網頁
- 第一層就是 活動總表的頁面
	- 分為 有分活動場次總表 和 週期活動總表
	- 不知道差別在哪，但週期活動總表有分年份，可以看歷年的
	- 所以我先爬了 活動場次總表 和 週期活動總表的 2026 年 跟 2025 年
- 第二層就是 活動頁面
	- 活動的話可能會包含多個場次，每個場次都還會有自己的頁面連結
	- 所以要再點進去才會看到第三層
- 第三層就是 活動場次
	- 裡面會包含該場次的詳細資料
	- 這裡應該就算是最後的活動

csv file
- events_tags 放的是每筆資料有哪些 tag，這個 events_processed.csv 也有這些資訊，不過是 column + boolean 顯示

### 欄位整理

本檔整理 `term_project/fetch_data/csv` 目前使用中的資料表欄位。

> **快速導覽**：實際開發請優先看 A、B、C 三個主要資料表；D、E、F 為原始爬蟲產出，供參考追溯。

---

#### A) events_processed.csv　★ 主要中文版

**來源**：`process_data.py`（輸入 `events.csv`）
**筆數**：1217 筆（336 個活動、1217 個場次）
**主鍵**：`event_url`

在 `events.csv` 基礎上做兩項後處理：
1. 將 `activity_content`、`session_content`、`note` 的真實換行轉為文字 `\n`，方便前端解析
2. 新增 7 個 boolean tag 欄位

| 欄位 | 中文說明 | 備註 |
| ---- | -------- | ---- |
| `parent_url` | 母活動頁網址 | `sessionList.aspx?...` |
| `activity_name_activity_session` | 活動名稱（母活動層） | 同一活動的所有場次共用此值 |
| `activity_content` | 活動說明（母活動層） | 自由文字；含 `\n` 換行標記 |
| `activity_type` | 活動類型 | 固定值：講座、課程、工作坊、競賽、徵才、研習/研討、其他活動、成長團體（含適用身分說明） |
| `life_learning_type` | 終身學習分類 | 固定值：格式 `大類/中類/小類(代碼)`，共 46 種 |
| `outside_url` | 外部連結 | 自由文字；無時值為「無」 |
| `activity_limit` | 報名限制說明 | 自由文字；無時值為「無」 |
| `event_url` | 場次網址（主鍵） | `sessionView.aspx?...` |
| `activity_name_event_page` | 活動名稱（場次頁） | 通常與 activity_name_activity_session 相同，但部分場次略有差異 |
| `session_name` | 場次名稱 | 同一活動各場次的標題（如第一場、第二場或主題名） |
| `session_content` | 場次詳細說明 | 自由文字；含 `\n` 換行標記；**前端內文主要欄位** |
| `instructor` | 講師 / 授課者 | 自由文字；人名 |
| `location` | 活動地點 | 自由文字；校內地點或「數位學習」 |
| `session_time` | 場次時間 | 自由文字；例：`115年5月21日(三) 13:00-17:00` |
| `registration_time` | 報名時間 | 自由文字；開放與截止時間區間 |
| `organizer_unit` | 承辦單位 | 自由文字 |
| `organizer_contact` | 承辦人聯絡方式 | 自由文字；含姓名、電話、email |
| `registration_type` | 報名類型 | 固定值：`自由報名` / `限定報名` |
| `target_audience` | 參加對象 | 固定值（逗號組合）：學生、教師、職員、短期、公務、計畫人員、醫院、校友、校外人士、中研院、退休教師、退休職員、不限 |
| `other_restrictions` | 其他限制條件 | 自由文字；無時值為「無」 |
| `registration_fee` | 報名費 | 固定值：`免費` / `300 元` / `1000 元` / `15000 元` |
| `capacity` | 總名額 | 格式：`N 人`，範圍 3～9999 |
| `remaining_slots` | 尚餘名額 | 格式：`N 人`；9xxx 表示幾乎無限額 |
| `meal` | 餐食提供 | 固定值：`提供用餐` / `不提供` / `素食(植物性餐食)` / `葷食` / `自行處理` |
| `civil_servant_hours` | 提供公務人員學習時數 | 固定值：`是` / `否` |
| `study_hours` | 研習總時數 | 固定值：`0 小時` ～ `12 小時` |
| `learning_category` | 學習類別 | 固定值：`實體學習` / `數位學習` / `混成學習` |
| `credit` | 學分 | 固定值：`無` / `學分` / `大學` |
| `term` | 期別（學年度） | 固定值：`114`（2025）/ `115`（2026）；`0`/`1` 意義待確認 |
| `city` | 活動縣市 | 固定值：`10.臺北市` / `數位學習` |
| `attachment` | 附件 | 自由文字；無時值為「無」 |
| `note` | 備註 | 自由文字；含 `\n` 換行標記；無時值為「無」 |
| `tag_food` | 有提供餐點 | Boolean；`meal` 為提供用餐/葷食/素食時為 True |
| `tag_remote` | 可遠距參與 | Boolean；`learning_category == "數位學習"` |
| `tag_audience_student` | 開放學生 | Boolean；`target_audience` 含「學生」 |
| `tag_audience_outsider` | 開放校外人士 | Boolean；`target_audience` 含「校外人士」 |
| `tag_audience_alumni` | 開放校友 | Boolean；`target_audience` 含「校友」 |
| `tag_audience_faculty` | 開放教師 | Boolean；`target_audience` 含「教師」 |
| `tag_free` | 免費報名 | Boolean；`registration_fee == "免費"` |

---

#### B) events_en.csv　★ 主要英文版

**來源**：`translate_all.py`（輸入 `events_processed.csv`）
**筆數**：1217 筆，**39 欄**
**主鍵**：`event_url`

以 `events_processed.csv` 為基底，翻譯策略分三層（詳見 `translation_map.md`）：

| 翻譯層級 | 對象欄位 |
| -------- | -------- |
| Rule-based dict | `activity_type`、`life_learning_type`、`registration_type`、`registration_fee`、`meal`、`civil_servant_hours`、`study_hours`、`learning_category`、`credit`、`city`、`term`、`target_audience` |
| Rule-based simple | `outside_url`、`activity_limit`、`other_restrictions`、`attachment`、`note`（`無` → `N/A`）；`capacity`、`remaining_slots`（去除「人」單位） |
| LLM 整值去重 | `activity_name_activity_session`、`activity_name_event_page`、`session_name`（相同中文 → 相同英文） |
| LLM 段落去重 in-place | `activity_content`、`session_content`（以 `\n` 切段翻譯，直接覆寫原欄位） |

欄位清單（39 欄）：

| 欄位 | 語言 | 說明 |
| ---- | ---- | ---- |
| `parent_url` | 原文 | URL，不翻 |
| `activity_name_activity_session` | **英文** | LLM 整值去重 |
| `activity_content` | **英文** | LLM 段落去重 in-place |
| `activity_type` | **英文** | Rule-based，例：`Lecture (All)` |
| `life_learning_type` | **英文** | Rule-based，例：`Liberal Arts/Humanities/Psychology(191)` |
| `outside_url` | **英文/原文** | `無` → `N/A`；URL 值保留原文 |
| `activity_limit` | **英/中** | `無` → `N/A`；其他自由文字保留中文 |
| `event_url` | 原文 | URL，主鍵，不翻 |
| `activity_name_event_page` | **英文** | LLM 整值去重 |
| `session_name` | **英文** | LLM 整值去重 |
| `session_content` | **英文** | LLM 段落去重 in-place |
| `instructor` | 中文 | 人名，不翻 |
| `location` | 中文 | 地點，不翻 |
| `session_time` | 原文 | 時間字串，不翻 |
| `registration_time` | 原文 | 時間字串，不翻 |
| `organizer_unit` | 中文 | 承辦單位，不翻 |
| `organizer_contact` | 中文/原文 | 聯絡資訊，不翻 |
| `registration_type` | **英文** | Rule-based，例：`Open Registration` |
| `target_audience` | **英文** | Rule-based token 級，例：`Student, Faculty` |
| `other_restrictions` | **英/中** | `無` → `N/A`；其他自由文字保留中文 |
| `registration_fee` | **英文** | Rule-based，例：`Free` / `NT$300` |
| `capacity` | **數字** | 去除「人」，例：`130` |
| `remaining_slots` | **數字** | 去除「人」，例：`36` |
| `meal` | **英文** | Rule-based，例：`Meal Provided` |
| `civil_servant_hours` | **英文** | Rule-based：`Yes` / `No` |
| `study_hours` | **英文** | Rule-based，例：`2 hrs` |
| `learning_category` | **英文** | Rule-based：`In-Person` / `Online` / `Hybrid` |
| `credit` | **英文** | Rule-based：`None` / `Credit` / `University Credit` |
| `term` | **英文** | Rule-based：`AY2025` / `AY2026` |
| `city` | **英文** | Rule-based：`Taipei City` / `Online` |
| `attachment` | **英/中** | `無` → `N/A`；其他保留 |
| `note` | **英/中** | `無` → `N/A`；其他保留 |
| `tag_food` ～ `tag_free` | Boolean | 7 個 tag 欄位，不翻 |

**中文殘留說明**：`instructor`、`location`、`organizer_unit`、`organizer_contact` 為人名、地點、聯絡資訊，不翻譯屬預期。`activity_limit`、`other_restrictions`、`note`、`attachment` 僅「無」值被翻為 `N/A`，其餘自由文字保留中文。

---

#### C) events_tags.csv　★ Tag 關聯表

**來源**：`build_tags_table.py`（輸入 `events_processed.csv`）
**筆數**：2638 筆
**用途**：長格式 tag 對應，每筆為一個 `(event_url, tag)` 組合，適合直接寫入關聯式資料庫的 tag 關聯表

| 欄位 | 說明 |
| ---- | ---- |
| `event_url` | 場次網址（外鍵，對應 events_processed.csv 主鍵） |
| `tag` | tag 文字標籤 |

Tag 對應關係：

| tag 文字 | 來源欄位 | 含義 |
| -------- | -------- | ---- |
| `免費餐點` | `tag_food` | 有提供餐點 |
| `遠距參加` | `tag_remote` | 可線上參與 |
| `學生` | `tag_audience_student` | 開放學生報名 |
| `校外人士` | `tag_audience_outsider` | 開放校外人士 |
| `校友` | `tag_audience_alumni` | 開放校友 |
| `教師` | `tag_audience_faculty` | 開放教師 |
| `免報名費` | `tag_free` | 免費報名 |

---

#### D) activities.csv　（原始爬蟲，參考用）

來源：`crawl_first.py`（活動列表頁）

| 欄位 | 說明 |
| ---- | ---- |
| `page` | 列表頁來源網址（活動總表或過期活動總表） |
| `title` | 活動標題（列表頁顯示文字） |
| `url` | 母活動網址（`sessionList.aspx?...`） |

---

#### E) activity_session.csv　（原始爬蟲，參考用）

來源：`crawl_second.py`（母活動頁 + 場次連結）

- 每筆是一個場次；同一活動有多場次時會有多筆，僅 `event_url` 不同

| 欄位 | 說明 |
| ---- | ---- |
| `parent_url` | 母活動頁 URL |
| `activity_name` | 母活動名稱 |
| `activity_content` | 母活動說明文字 |
| `activity_type` | 活動類型 |
| `life_learning_type` | 終身學習分類 |
| `outside_url` | 外部連結 |
| `activity_limit` | 報名限制 |
| `event_url` | 場次詳細頁 URL（`sessionView.aspx?...`） |

---

#### F) events.csv　（原始爬蟲，參考用）

來源：`crawl_third.py`（場次詳細頁）

欄位與 `events_processed.csv` 相同，但無 tag 欄位、換行未處理。開發請用 `events_processed.csv`。

---

### 筆記
有分活動場次總表 和 週期活動總表 
不知道差別在哪，但週期活動有分年份
活動場次總表：
- https://my.ntu.edu.tw/actregister/actionList.aspx
週期活動總表：
- https://my.ntu.edu.tw/actregister/expiredActionList.aspx
網頁架構都蠻整齊的
- 最外面
	- 活動名稱
	- 活動期間
	- 場次數
	- 一個 母活動 url  
- 母活動
	- 看起來都是用 ul li 包的
	- `<ul>` 活動資訊
		- 活動名稱
		- 活動內容
		- 活動類別
		- 終身學習類別
		- 活動網址
			- 這個是外部連結
		- 活動限制
		- 其他
	- `<ul>` 場次資訊
		- 裡面可能有多個子活動
		- 活動名稱
		- 子活動 url
	- 自己的 url
- 子活動
	- ul 儲存
	- 裡面有很多項目

