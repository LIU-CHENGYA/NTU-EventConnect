"""
translate_all.py — Complete Chinese → English translation pipeline.

Input:  fetch_data/csv/events_processed.csv
Output: fetch_data/csv/events_en.csv

Translation strategy (rule-based first):
  Rule-based (dicts):   activity_type, life_learning_type, registration_type,
                        registration_fee, meal, civil_servant_hours, study_hours,
                        learning_category, credit, city, term, target_audience
  Rule-based (simple):  "無" → "N/A" for text-or-none fields;
                        strip "人" from capacity / remaining_slots
  LLM dedup:            activity_name_activity_session, activity_name_event_page,
                        session_name  (same Chinese → always same English)
  LLM paragraph dedup:  activity_content, session_content
                        (split on \\n, translate unique paragraphs, reassemble in-place)

Fields kept as original (free-text / proper nouns):
  instructor, location, session_time, registration_time,
  organizer_unit, organizer_contact, outside_url (non-"無"), activity_limit
  (non-"無"), other_restrictions (non-"無"), note (non-"無"), attachment
  (non-"無"), all URL fields, boolean tag columns

Checkpoint: fetch_data/csv/translate_checkpoint.json
  Shared cache across all LLM calls. Resume-safe.

Setup:
  Mac/Linux:   OLLAMA_NUM_PARALLEL=3 ollama serve
  Windows PS:  $env:OLLAMA_NUM_PARALLEL=3; ollama serve
  Windows CMD: set OLLAMA_NUM_PARALLEL=3 && ollama serve

Run:
  ollama pull qwen2.5:3b
  uv run python fetch_data/translate_all.py
"""

import json
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
import requests

INPUT_CSV       = "fetch_data/csv/events_processed.csv"
OUTPUT_CSV      = "fetch_data/csv/events_en.csv"
CHECKPOINT_FILE = "fetch_data/csv/translate_checkpoint.json"

OLLAMA_URL  = "http://localhost:11434/api/chat"
MODEL       = "qwen2.5:3b"
MAX_WORKERS = 3

PARA_SEP = r"\n"  # literal two-char sequence stored in CSV by process_data.py


# ── Rule-based translation maps ───────────────────────────────

ACTIVITY_TYPE = {
    "講座 (兩種身分皆適用)":        "Lecture (All)",
    "講座 (適用非公務人員)":        "Lecture (Non-Civil Servant)",
    "課程 (兩種身分皆適用)":        "Course (All)",
    "課程 (適用非公務人員)":        "Course (Non-Civil Servant)",
    "工作坊 (兩種身分皆適用)":      "Workshop (All)",
    "工作坊 (適用非公務人員)":      "Workshop (Non-Civil Servant)",
    "競賽 (兩種身分皆適用)":        "Competition (All)",
    "競賽 (適用非公務人員)":        "Competition (Non-Civil Servant)",
    "徵才 (兩種身分皆適用)":        "Recruitment (All)",
    "徵才 (適用非公務人員)":        "Recruitment (Non-Civil Servant)",
    "研習/研討 (兩種身分皆適用)":   "Seminar (All)",
    "研習/研討 (適用非公務人員)":   "Seminar (Non-Civil Servant)",
    "其他活動 (兩種身分皆適用)":    "Other (All)",
    "其他活動 (適用非公務人員)":    "Other (Non-Civil Servant)",
    "成長團體 (適用非公務人員)":    "Growth Group (Non-Civil Servant)",
}

LIFE_LEARNING_TYPE = {
    "活動總表":   "Activity List",
    "過期活動總表": "Expired Activity List",
    "人文素養/人文素養/心理(191)":             "Liberal Arts/Humanities/Psychology(191)",
    "人文素養/人文素養/社區概念(188)":          "Liberal Arts/Humanities/Community(188)",
    "人文素養/人文素養/社會(173)":             "Liberal Arts/Humanities/Society(173)",
    "人文素養/人文素養/宗教(190)":             "Liberal Arts/Humanities/Religion(190)",
    "人文素養/人文素養/哲學(172)":             "Liberal Arts/Humanities/Philosophy(172)",
    "人文素養/人文素養/音樂(175)":             "Liberal Arts/Humanities/Music(175)",
    "人文素養/人文素養/美術(174)":             "Liberal Arts/Humanities/Fine Arts(174)",
    "人文素養/人文素養/運動(179)":             "Liberal Arts/Humanities/Sports(179)",
    "人文素養/人文素養/休閒旅遊(181)":          "Liberal Arts/Humanities/Leisure & Travel(181)",
    "人文素養/人文素養/生態環保(184)":          "Liberal Arts/Humanities/Ecology & Environment(184)",
    "人文素養/語文/英文(202)":                "Liberal Arts/Language/English(202)",
    "人文素養/歷史/文學(169)":                "Liberal Arts/History/Literature(169)",
    "人文素養/歷史/文化資產(194)":             "Liberal Arts/History/Cultural Heritage(194)",
    "人文素養/家庭/親子(276)":                "Liberal Arts/Family/Parent-Child(276)",
    "人文素養/手工技藝/陶藝(201)":             "Liberal Arts/Crafts/Ceramics(201)",
    "人文素養/養生保健/養身(199)":             "Liberal Arts/Health/Wellness(199)",
    "人文素養/養生保健/婦幼衛生(195)":          "Liberal Arts/Health/Women & Children Health(195)",
    "人文素養/養生保健/兒童保健(196)":          "Liberal Arts/Health/Child Health(196)",
    "管理/綜合管理/知識管理(120)":             "Management/General/Knowledge Management(120)",
    "管理/人力資源/管理訓練(102)":             "Management/Human Resources/Management Training(102)",
    "政策法規/綜合發展/綜合發展(10)":           "Policy/Comprehensive Development(10)",
    "政策法規/性別主流化/工作職場(306)":        "Policy/Gender Mainstreaming/Workplace(306)",
    "政策法規/政策宣導訓練/天然災害講習(278)":  "Policy/Advocacy/Natural Disaster Training(278)",
    "專業行政/一般行政/一般行政(23)":           "Administration/General/General Administration(23)",
    "專業行政/外交事務/外交事務(17)":           "Administration/Foreign Affairs(17)",
    "專業行政/法治教育/一般性(332)":            "Administration/Legal Education/General(332)",
    "專業行政/財務行政/財稅行政(34)":           "Administration/Finance/Tax Administration(34)",
    "專業行政/財務行政/會計(37)":              "Administration/Finance/Accounting(37)",
    "專業行政/社會行政/社會行政(27)":           "Administration/Social Affairs(27)",
    "專業行政/文教新聞行政/文教行政(31)":       "Administration/Cultural Affairs/Cultural Education(31)",
    "專業行政/文教新聞行政/圖書博物管理(33)":   "Administration/Cultural Affairs/Library & Museum(33)",
    "專業技術/理學/物理(77)":                 "Professional/Science/Physics(77)",
    "專業技術/理學/礦冶材料(82)":             "Professional/Science/Mining & Materials(82)",
    "專業技術/工學/機械工程(52)":             "Professional/Engineering/Mechanical Engineering(52)",
    "專業技術/農林技術/農業技術(64)":          "Professional/Agriculture/Agricultural Technology(64)",
    "專業技術/醫學衛生/醫療(83)":             "Professional/Medical/Healthcare(83)",
    "專業技術/醫學衛生/醫事技術(87)":          "Professional/Medical/Medical Technology(87)",
    "專業技術/醫學衛生/醫學工程(88)":          "Professional/Medical/Medical Engineering(88)",
    "專業技術/資訊處理/資訊管理(70)":          "Professional/IT/Information Management(70)",
    "專業技術/資訊處理/資訊工程(72)":          "Professional/IT/Computer Engineering(72)",
    "專業技術/資訊處理/電腦網路(76)":          "Professional/IT/Computer Networks(76)",
    "專業技術/資訊處理/應用程式(74)":          "Professional/IT/Applications(74)",
    "專業技術/綜合/技藝(95)":                "Professional/General/Crafts(95)",
    "專業技術/綜合/消防技術(98)":             "Professional/General/Fire Safety(98)",
}

REGISTRATION_TYPE    = {"自由報名": "Open Registration", "限定報名": "Restricted Registration"}
REGISTRATION_FEE     = {"免費": "Free", "300 元": "NT$300", "1000 元": "NT$1,000", "15000 元": "NT$15,000"}
MEAL                 = {"提供用餐": "Meal Provided", "不提供": "No Meal",
                        "素食(植物性餐食)": "Vegetarian Meal", "葷食": "Non-Vegetarian Meal", "自行處理": "Self-Arranged"}
CIVIL_SERVANT_HOURS  = {"是": "Yes", "否": "No"}
STUDY_HOURS          = {"0 小時": "0 hrs", "1 小時": "1 hr", "2 小時": "2 hrs", "3 小時": "3 hrs",
                        "4 小時": "4 hrs", "6 小時": "6 hrs", "8 小時": "8 hrs", "12 小時": "12 hrs"}
LEARNING_CATEGORY    = {"實體學習": "In-Person", "數位學習": "Online", "混成學習": "Hybrid"}
CREDIT               = {"無": "None", "學分": "Credit", "大學": "University Credit"}
CITY                 = {"10.臺北市": "Taipei City", "數位學習": "Online"}
TERM                 = {"114": "AY2025", "115": "AY2026", "0": "Unknown", "1": "Unknown"}

AUDIENCE_TOKEN = {
    "學生": "Student", "教師": "Faculty", "職員": "Staff", "短期": "Short-term Staff",
    "公務": "Civil Servant", "計畫人員": "Project Personnel", "醫院": "Hospital Staff",
    "校友": "Alumni", "校外人士": "Public", "中研院": "Academia Sinica",
    "退休教師": "Retired Faculty", "退休職員": "Retired Staff", "不限": "Open to All",
}

# Fields where only "無" is rule-translated; other free-text left as-is
NONE_FIELDS = ["outside_url", "activity_limit", "other_restrictions", "attachment", "note"]

# LLM target: name fields (whole-value dedup)
NAME_FIELDS = [
    "activity_name_activity_session",
    "activity_name_event_page",
    "session_name",
]


# ── Step 1: Rule-based translations ───────────────────────────

def _map(series, mapping):
    return series.map(lambda v: mapping.get(str(v), v) if pd.notna(v) else v)

def _map_audience(value):
    if pd.isna(value):
        return value
    return ", ".join(AUDIENCE_TOKEN.get(t.strip(), t.strip()) for t in value.split(","))

def apply_rule_translations(df):
    df["activity_type"]       = _map(df["activity_type"],       ACTIVITY_TYPE)
    df["life_learning_type"]  = _map(df["life_learning_type"],  LIFE_LEARNING_TYPE)
    df["registration_type"]   = _map(df["registration_type"],   REGISTRATION_TYPE)
    df["registration_fee"]    = _map(df["registration_fee"],     REGISTRATION_FEE)
    df["meal"]                = _map(df["meal"],                 MEAL)
    df["civil_servant_hours"] = _map(df["civil_servant_hours"],  CIVIL_SERVANT_HOURS)
    df["study_hours"]         = _map(df["study_hours"],          STUDY_HOURS)
    df["learning_category"]   = _map(df["learning_category"],    LEARNING_CATEGORY)
    df["credit"]              = _map(df["credit"],               CREDIT)
    df["city"]                = _map(df["city"],                 CITY)
    df["term"]                = _map(df["term"].astype(str),     TERM)
    df["target_audience"]     = df["target_audience"].apply(_map_audience)
    print(f"  Rule-based fixed fields: done")
    return df


# ── Step 2: Simple fixes ──────────────────────────────────────

def apply_simple_fixes(df):
    for col in NONE_FIELDS:
        if col in df.columns:
            df[col] = df[col].replace("無", "N/A")
    for col in ["capacity", "remaining_slots"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.replace(" 人", "", regex=False)
            df[col] = df[col].replace("nan", "")
    print(f"  Simple fixes (無→N/A, strip 人): done")
    return df


# ── Checkpoint ────────────────────────────────────────────────

_lock = threading.Lock()

def load_checkpoint():
    p = Path(CHECKPOINT_FILE)
    if p.exists():
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        print(f"  Checkpoint loaded: {len(data)} cached entries")
        return data
    return {}

def save_checkpoint(cache):
    with _lock:
        with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)


# ── Ollama API ────────────────────────────────────────────────

def check_ollama():
    try:
        return requests.get("http://localhost:11434", timeout=5).status_code == 200
    except Exception:
        return False

def call_ollama(text):
    resp = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content":
                "Translate the following Chinese text to English. "
                "Output only the English translation, nothing else.\n\n"
                f"{text}"}],
            "stream": False,
            "options": {"temperature": 0.1},
        },
        timeout=180,
    )
    resp.raise_for_status()
    result = resp.json()["message"]["content"].strip()
    return result.replace("\n", PARA_SEP)  # restore literal \n markers

def _translate_one(text, cache):
    key = str(text).strip()
    with _lock:
        if key in cache:
            return key, cache[key]
    result = call_ollama(key)
    with _lock:
        cache[key] = result
    save_checkpoint(cache)
    return key, result

def _run_parallel(todo, cache, label):
    if not todo:
        return
    done = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(_translate_one, text, cache): text for text in todo}
        for future in as_completed(futures):
            key, _ = future.result()
            done += 1
            print(f"  {done}/{len(todo)}  {key[:72]!r}", flush=True)


# ── Step 3: LLM — name fields (whole-value dedup) ────────────

def translate_name_fields(df, cache):
    all_unique = set()
    for col in NAME_FIELDS:
        for v in df[col].dropna().unique():
            v = str(v).strip()
            if v:
                all_unique.add(v)

    with _lock:
        todo = [v for v in all_unique if v not in cache]

    print(f"  {len(all_unique)} unique name values, {len(todo)} to translate")
    _run_parallel(todo, cache, "names")

    for col in NAME_FIELDS:
        df[col] = df[col].apply(
            lambda v: cache.get(str(v).strip(), v) if pd.notna(v) and str(v).strip() else v
        )
        print(f"  → {col} mapped", flush=True)


# ── Step 4: LLM — paragraph-level dedup (in-place) ───────────

def translate_paragraph_field(df, col, cache):
    unique_paras = set()
    for text in df[col].dropna():
        for p in str(text).split(PARA_SEP):
            p = p.strip()
            if p:
                unique_paras.add(p)

    with _lock:
        todo = [p for p in unique_paras if p not in cache]

    print(f"  [{col}] {len(unique_paras)} unique paragraphs, {len(todo)} to translate")
    _run_parallel(todo, cache, col)

    def reconstruct(text):
        if pd.isna(text) or not str(text).strip():
            return text
        parts = [cache.get(p.strip(), p.strip()) for p in str(text).split(PARA_SEP)]
        return PARA_SEP.join(parts)

    df[col] = df[col].apply(reconstruct)
    print(f"  → {col} translated in-place", flush=True)


# ── Main ──────────────────────────────────────────────────────

def main():
    if not check_ollama():
        print("ERROR: Ollama not running.")
        print("  Mac:        OLLAMA_NUM_PARALLEL=3 ollama serve")
        print("  Windows PS: $env:OLLAMA_NUM_PARALLEL=3; ollama serve")
        sys.exit(1)

    print(f"Reading {INPUT_CSV} ...")
    df = pd.read_csv(INPUT_CSV)
    print(f"{len(df)} rows loaded\n")

    print("=== Step 1: Rule-based fixed fields ===")
    df = apply_rule_translations(df)

    print("\n=== Step 2: Simple fixes ===")
    df = apply_simple_fixes(df)

    cache = load_checkpoint()

    print("\n=== Step 3: LLM — name fields ===")
    translate_name_fields(df, cache)

    print("\n=== Step 4: LLM — paragraph fields (in-place) ===")
    translate_paragraph_field(df, "activity_content", cache)
    translate_paragraph_field(df, "session_content", cache)

    save_checkpoint(cache)
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\nDone. {len(df)} rows → {OUTPUT_CSV}")
    print(f"Checkpoint: {len(cache)} entries saved")


if __name__ == "__main__":
    main()
