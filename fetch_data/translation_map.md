# Chinese → English Translation Map

供 `translate_all.py` 使用，說明各欄位的翻譯方式。

---

## 翻譯策略總覽

| 欄位                               | 方法                | 說明                                                      |
| -------------------------------- | ----------------- | ------------------------------------------------------- |
| `activity_type`                  | Rule-based dict   | 見下方對照表                                                  |
| `life_learning_type`             | Rule-based dict   | 見下方對照表                                                  |
| `registration_type`              | Rule-based dict   | 見下方對照表                                                  |
| `registration_fee`               | Rule-based dict   | 見下方對照表                                                  |
| `meal`                           | Rule-based dict   | 見下方對照表                                                  |
| `civil_servant_hours`            | Rule-based dict   | 見下方對照表                                                  |
| `study_hours`                    | Rule-based dict   | 見下方對照表                                                  |
| `learning_category`              | Rule-based dict   | 見下方對照表                                                  |
| `credit`                         | Rule-based dict   | 見下方對照表                                                  |
| `city`                           | Rule-based dict   | 見下方對照表                                                  |
| `term`                           | Rule-based dict   | 見下方對照表                                                  |
| `target_audience`                | Rule-based token  | 逗號分隔，逐 token 翻譯後重組，見下方對照表                               |
| `outside_url`                    | Rule-based simple | `無` → `N/A`；URL 值保留原文                                   |
| `activity_limit`                 | Rule-based simple | `無` → `N/A`；其他自由文字保留原文                                  |
| `other_restrictions`             | Rule-based simple | `無` → `N/A`；其他自由文字保留原文                                  |
| `attachment`                     | Rule-based simple | `無` → `N/A`；其他保留原文                                      |
| `note`                           | Rule-based simple | `無` → `N/A`；其他保留原文                                      |
| `capacity`                       | Rule-based simple | 去除單位「人」，如 `130 人` → `130`                               |
| `remaining_slots`                | Rule-based simple | 去除單位「人」，如 `36 人` → `36`                                 |
| `activity_name_activity_session` | LLM + 整值去重        | 相同中文 → 相同英文（全欄唯一值統一翻譯）                                  |
| `activity_name_event_page`       | LLM + 整值去重        | 同上                                                      |
| `session_name`                   | LLM + 整值去重        | 同上                                                      |
| `activity_content`               | LLM + 段落去重 (in-place) | 以 `\n` 切段，唯一段落各翻一次，直接覆寫原欄位                              |
| `session_content`                | LLM + 段落去重 (in-place) | 同上，直接覆寫原欄位（不再產生 `session_content_en`）                    |
| `instructor`                     | 不翻譯               | 人名，保留中文                                                 |
| `location`                       | 不翻譯               | 地點，保留中文                                                 |
| `session_time`                   | 不翻譯               | 時間字串，保留原文                                               |
| `registration_time`              | 不翻譯               | 時間字串，保留原文                                               |
| `organizer_unit`                 | 不翻譯               | 單位名稱，保留中文                                               |
| `organizer_contact`              | 不翻譯               | 聯絡資訊，保留中文                                               |
| URL 欄位                           | 不翻譯               | `parent_url`、`event_url`、`outside_url`（非無）              |
| Tag 欄位                           | 不翻譯               | Boolean 值，不需翻譯                                          |

---

## Rule-based 對照表

---

## activity_type

| 中文 | English |
| ---- | ------- |
| 講座 (兩種身分皆適用) | Lecture (All) |
| 講座 (適用非公務人員) | Lecture (Non-Civil Servant) |
| 課程 (兩種身分皆適用) | Course (All) |
| 課程 (適用非公務人員) | Course (Non-Civil Servant) |
| 工作坊 (兩種身分皆適用) | Workshop (All) |
| 工作坊 (適用非公務人員) | Workshop (Non-Civil Servant) |
| 競賽 (兩種身分皆適用) | Competition (All) |
| 競賽 (適用非公務人員) | Competition (Non-Civil Servant) |
| 徵才 (兩種身分皆適用) | Recruitment (All) |
| 徵才 (適用非公務人員) | Recruitment (Non-Civil Servant) |
| 研習/研討 (兩種身分皆適用) | Seminar (All) |
| 研習/研討 (適用非公務人員) | Seminar (Non-Civil Servant) |
| 其他活動 (兩種身分皆適用) | Other (All) |
| 其他活動 (適用非公務人員) | Other (Non-Civil Servant) |
| 成長團體 (適用非公務人員) | Growth Group (Non-Civil Servant) |

---

## registration_type

| 中文 | English |
| ---- | ------- |
| 自由報名 | Open Registration |
| 限定報名 | Restricted Registration |

---

## registration_fee

| 中文 | English |
| ---- | ------- |
| 免費 | Free |
| 300 元 | NT$300 |
| 1000 元 | NT$1,000 |
| 15000 元 | NT$15,000 |

---

## meal

| 中文 | English |
| ---- | ------- |
| 提供用餐 | Meal Provided |
| 不提供 | No Meal |
| 素食(植物性餐食) | Vegetarian Meal |
| 葷食 | Non-Vegetarian Meal |
| 自行處理 | Self-Arranged |

---

## civil_servant_hours

| 中文 | English |
| ---- | ------- |
| 是 | Yes |
| 否 | No |

---

## study_hours

| 中文 | English |
| ---- | ------- |
| 0 小時 | 0 hrs |
| 1 小時 | 1 hr |
| 2 小時 | 2 hrs |
| 3 小時 | 3 hrs |
| 4 小時 | 4 hrs |
| 6 小時 | 6 hrs |
| 8 小時 | 8 hrs |
| 12 小時 | 12 hrs |

---

## learning_category

| 中文 | English |
| ---- | ------- |
| 實體學習 | In-Person |
| 數位學習 | Online |
| 混成學習 | Hybrid |

---

## credit

| 中文 | English |
| ---- | ------- |
| 無 | None |
| 學分 | Credit |
| 大學 | University Credit |

---

## city

| 中文 | English |
| ---- | ------- |
| 10.臺北市 | Taipei City |
| 數位學習 | Online |

---

## term

| 中文 | English |
| ---- | ------- |
| 114 | AY2025 |
| 115 | AY2026 |
| 0 | Unknown |
| 1 | Unknown |

---

## target_audience（token 級別，逗號分隔組合）

`target_audience` 欄位為逗號分隔的身分組合，逐一翻譯每個 token。

| 中文 token | English |
| ---------- | ------- |
| 學生 | Student |
| 教師 | Faculty |
| 職員 | Staff |
| 短期 | Short-term Staff |
| 公務 | Civil Servant |
| 計畫人員 | Project Personnel |
| 醫院 | Hospital Staff |
| 校友 | Alumni |
| 校外人士 | Public |
| 中研院 | Academia Sinica |
| 退休教師 | Retired Faculty |
| 退休職員 | Retired Staff |
| 不限 | Open to All |

---

## life_learning_type

格式為 `大類/中類/小類(代碼)`，整欄對應翻譯。

| 中文 | English |
| ---- | ------- |
| 活動總表 | Activity List |
| 過期活動總表 | Expired Activity List |
| 人文素養/人文素養/心理(191) | Liberal Arts/Humanities/Psychology(191) |
| 人文素養/人文素養/社區概念(188) | Liberal Arts/Humanities/Community(188) |
| 人文素養/人文素養/社會(173) | Liberal Arts/Humanities/Society(173) |
| 人文素養/人文素養/宗教(190) | Liberal Arts/Humanities/Religion(190) |
| 人文素養/人文素養/哲學(172) | Liberal Arts/Humanities/Philosophy(172) |
| 人文素養/人文素養/音樂(175) | Liberal Arts/Humanities/Music(175) |
| 人文素養/人文素養/美術(174) | Liberal Arts/Humanities/Fine Arts(174) |
| 人文素養/人文素養/運動(179) | Liberal Arts/Humanities/Sports(179) |
| 人文素養/人文素養/休閒旅遊(181) | Liberal Arts/Humanities/Leisure & Travel(181) |
| 人文素養/人文素養/生態環保(184) | Liberal Arts/Humanities/Ecology & Environment(184) |
| 人文素養/語文/英文(202) | Liberal Arts/Language/English(202) |
| 人文素養/歷史/文學(169) | Liberal Arts/History/Literature(169) |
| 人文素養/歷史/文化資產(194) | Liberal Arts/History/Cultural Heritage(194) |
| 人文素養/家庭/親子(276) | Liberal Arts/Family/Parent-Child(276) |
| 人文素養/手工技藝/陶藝(201) | Liberal Arts/Crafts/Ceramics(201) |
| 人文素養/養生保健/養身(199) | Liberal Arts/Health/Wellness(199) |
| 人文素養/養生保健/婦幼衛生(195) | Liberal Arts/Health/Women & Children Health(195) |
| 人文素養/養生保健/兒童保健(196) | Liberal Arts/Health/Child Health(196) |
| 管理/綜合管理/知識管理(120) | Management/General/Knowledge Management(120) |
| 管理/人力資源/管理訓練(102) | Management/Human Resources/Management Training(102) |
| 政策法規/綜合發展/綜合發展(10) | Policy/Comprehensive Development(10) |
| 政策法規/性別主流化/工作職場(306) | Policy/Gender Mainstreaming/Workplace(306) |
| 政策法規/政策宣導訓練/天然災害講習(278) | Policy/Advocacy/Natural Disaster Training(278) |
| 專業行政/一般行政/一般行政(23) | Administration/General/General Administration(23) |
| 專業行政/外交事務/外交事務(17) | Administration/Foreign Affairs(17) |
| 專業行政/法治教育/一般性(332) | Administration/Legal Education/General(332) |
| 專業行政/財務行政/財稅行政(34) | Administration/Finance/Tax Administration(34) |
| 專業行政/財務行政/會計(37) | Administration/Finance/Accounting(37) |
| 專業行政/社會行政/社會行政(27) | Administration/Social Affairs(27) |
| 專業行政/文教新聞行政/文教行政(31) | Administration/Cultural Affairs/Cultural Education(31) |
| 專業行政/文教新聞行政/圖書博物管理(33) | Administration/Cultural Affairs/Library & Museum(33) |
| 專業技術/理學/物理(77) | Professional/Science/Physics(77) |
| 專業技術/理學/礦冶材料(82) | Professional/Science/Mining & Materials(82) |
| 專業技術/工學/機械工程(52) | Professional/Engineering/Mechanical Engineering(52) |
| 專業技術/農林技術/農業技術(64) | Professional/Agriculture/Agricultural Technology(64) |
| 專業技術/醫學衛生/醫療(83) | Professional/Medical/Healthcare(83) |
| 專業技術/醫學衛生/醫事技術(87) | Professional/Medical/Medical Technology(87) |
| 專業技術/醫學衛生/醫學工程(88) | Professional/Medical/Medical Engineering(88) |
| 專業技術/資訊處理/資訊管理(70) | Professional/IT/Information Management(70) |
| 專業技術/資訊處理/資訊工程(72) | Professional/IT/Computer Engineering(72) |
| 專業技術/資訊處理/電腦網路(76) | Professional/IT/Computer Networks(76) |
| 專業技術/資訊處理/應用程式(74) | Professional/IT/Applications(74) |
| 專業技術/綜合/技藝(95) | Professional/General/Crafts(95) |
| 專業技術/綜合/消防技術(98) | Professional/General/Fire Safety(98) |
