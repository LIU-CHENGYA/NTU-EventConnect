### 大概介紹

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
- 我根據上面三層生出了三個 csv 檔案，第三個 event.csv 就是最後的活動場次資料。
- 我 event.csv 中也有包含了上層的資料（詳細可以看下面的），所以基本上可以只看這個 csv 就好

### 欄位整理

本檔整理 `term_project/fetch_data/csv` 目前使用中的資料表欄位與中文介紹。

#### 1) activities.csv

來源：`crawl_first.py`（活動列表頁）

| 欄位英文名 | 中文欄位名稱  | 欄位介紹                                      |
| ----- | ------- | ----------------------------------------- |
| page  | 列表頁來源網址 | 該筆活動是從哪一個列表頁抓到（例如活動總表或過期活動總表）。            |
| title | 活動標題    | 活動在列表頁顯示的標題文字。                            |
| url   | 母活動網址   | 活動詳情/場次列表頁網址（通常為 `sessionList.aspx?...`）。 |

---

#### 2) activity_session.csv

來源：`crawl_second.py`（母活動頁 + 場次連結）

- 每筆資料是一個活動場次，所以會看到多個活動名稱重複是正常的
- 假設該活動有三個場次，就會有三筆資料，只有最後的 event_url 會不一樣

| 欄位英文名              | 中文欄位名稱 | 欄位介紹                                |
| ------------------ | ------ | ----------------------------------- |
| parent_url         | 母活動網址  | 母活動頁 URL（`sessionList.aspx?...`）。   |
| activity_name      | 活動名稱   | 母活動名稱。                              |
| activity_content   | 活動內容   | 母活動說明文字（通常很長，可能含換行）。                |
| activity_type      | 活動類型   | 系統中的活動型態（如講座、課程等）。                  |
| life_learning_type | 終身學習類別 | 系統中的終身學習分類。                         |
| outside_url        | 外部連結   | 活動對外參考網址，若無通常為「無」。                  |
| activity_limit     | 活動限制   | 報名限制條件，若無通常為「無」。                    |
| event_url          | 場次網址   | 子場次詳細頁 URL（`sessionView.aspx?...`）。 |

---

#### 3) events.csv

來源：`crawl_third.py`

- 每筆資料是一個活動場次

| 欄位英文名                          | 中文欄位名稱       | 欄位介紹                             |
| ------------------------------ | ------------ | -------------------------------- |
| parent_url                     | 母活動網址        | 來自 `activity_session.csv`。       |
| activity_name_activity_session | 活動名稱（母活動）    | 來自上一層資料表的活動名稱。                   |
| activity_content               | 活動內容         | 來自 `activity_session.csv` 的活動說明。 |
| activity_type                  | 活動類型         | 來自 `activity_session.csv`。       |
| life_learning_type             | 終身學習類別       | 來自 `activity_session.csv`。       |
| outside_url                    | 外部連結         | 來自 `activity_session.csv`。       |
| activity_limit                 | 活動限制         | 來自 `activity_session.csv`。       |
| event_url                      | 場次網址         | 合併主鍵；對應場次詳細頁。                    |
| activity_name_event_page       | 活動名稱（場次頁）    | 場次頁中的活動名稱欄位。                     |
| session_name                   | 場次名稱         | 場次標題（例如第幾場/主題）。                  |
| session_content                | 場次內容         | 場次詳細說明。                          |
| instructor                     | 授課人          | 講師/授課者資訊。                        |
| location                       | 活動地點         | 場次地點。                            |
| session_time                   | 場次時間         | 活動實際舉辦時間區間。                      |
| registration_time              | 報名時間         | 報名開放與截止時間。                       |
| organizer_unit                 | 承辦單位         | 主責承辦單位。                          |
| organizer_contact              | 承辦人          | 聯絡人與聯絡方式。                        |
| registration_type              | 報名類型         | 報名模式（如自由報名）。                     |
| target_audience                | 參加對象         | 可報名對象身分。                         |
| other_restrictions             | 其他限制條件       | 額外報名限制。                          |
| registration_fee               | 報名費          | 收費資訊（如免費）。                       |
| capacity                       | 人數名額         | 總名額。                             |
| remaining_slots                | 尚餘名額         | 剩餘可報名名額。                         |
| meal                           | 用餐           | 是否提供餐食。                          |
| civil_servant_hours            | 是否提供公務人員學習時數 | 是否可登錄公務人員時數。                     |
| study_hours                    | 研習總時數        | 課程可認列時數。                         |
| learning_category              | 學習類別         | 系統定義之學習類型。                       |
| credit                         | 學位學分         | 是否含學分或相關資訊。                      |
| term                           | 期別           | 學期/期別資訊。                         |
| city                           | 活動縣市         | 活動所在縣市。                          |
| attachment                     | 附件           | 附件資訊或連結（若有）。                     |
| note                           | 備註           | 其他備註欄位。                          |

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

