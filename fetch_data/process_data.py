import pandas as pd

INPUT_CSV = "fetch_data/csv/events.csv"
OUTPUT_CSV = "fetch_data/csv/events_processed.csv"

CONTENT_FIELDS = ["activity_content", "session_content", "note"]

MEAL_HAS_FOOD = {"提供用餐", "葷食", "素食(植物性餐食)"}

ENGLISH_KEYWORDS = ("英文", "英語", "English")
CAREER_KEYWORDS = ("職涯", "生涯", "就業", "求職", "工作職場", "career")
KEYWORD_SCAN_FIELDS = (
    "activity_content",
    "activity_name_event_page",
    "activity_name_activity_session",
    "session_content",
    "life_learning_type",
)


def _row_text(row) -> str:
    return " ".join(str(row.get(c) or "") for c in KEYWORD_SCAN_FIELDS)


def fix_newlines(df: pd.DataFrame) -> pd.DataFrame:
    for col in CONTENT_FIELDS:
        if col in df.columns:
            df[col] = df[col].str.replace("\n", r"\n", regex=False)
    return df


def add_tag_columns(df: pd.DataFrame) -> pd.DataFrame:
    # tag_food: meal 有提供餐食
    df["tag_food"] = df["meal"].isin(MEAL_HAS_FOOD)

    # tag_remote: 數位學習（可遠距參與）
    df["tag_remote"] = df["learning_category"] == "數位學習"

    # tag_audience_*: 參加對象
    df["tag_audience_student"] = df["target_audience"].str.contains("學生", na=False)
    df["tag_audience_outsider"] = df["target_audience"].str.contains("校外人士", na=False)
    df["tag_audience_alumni"] = df["target_audience"].str.contains("校友", na=False)
    df["tag_audience_faculty"] = df["target_audience"].str.contains("教師", na=False)

    # tag_free: 免費報名
    df["tag_free"] = df["registration_fee"] == "免費"

    # tag_english / tag_career: keyword scan across content + title + learning type
    text = df.apply(_row_text, axis=1)
    df["tag_english"] = text.apply(lambda t: any(k in t for k in ENGLISH_KEYWORDS))
    df["tag_career"] = text.apply(lambda t: any(k in t for k in CAREER_KEYWORDS))

    # activity_type を tag 化（Phase 2.1）。NTU 「官方分類」は life_learning_type
    # 由来で別管理 (Event.official_category)、こちらは横断 filter 用のタグ。
    activity_main = df["activity_type"].fillna("").str.replace(r"\s*\([^)]*\)\s*$", "", regex=True).str.strip()
    df["tag_workshop"]      = activity_main.str.contains("工作坊", na=False)
    df["tag_competition"]   = activity_main.str.contains("競賽", na=False)
    df["tag_recruitment"]   = activity_main.str.contains("徵才", na=False)
    df["tag_lecture"]       = activity_main.str.contains("講座", na=False)
    df["tag_course"]        = activity_main.str.contains("課程", na=False)
    df["tag_seminar"]       = activity_main.str.contains("研習", na=False)  # 研習/研討
    df["tag_growth_group"]  = activity_main.str.contains("成長團體", na=False)

    return df


def main():
    df = pd.read_csv(INPUT_CSV)

    df = fix_newlines(df)
    df = add_tag_columns(df)

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"Done. {len(df)} rows written to {OUTPUT_CSV}")

    # 簡單統計
    tag_cols = [c for c in df.columns if c.startswith("tag_")]
    print("\nTag counts (True):")
    for col in tag_cols:
        print(f"  {col}: {df[col].sum()}")


if __name__ == "__main__":
    main()
