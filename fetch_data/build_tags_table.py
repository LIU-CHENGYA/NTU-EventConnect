import pandas as pd

INPUT_CSV = "fetch_data/csv/events_processed.csv"
OUTPUT_CSV = "fetch_data/csv/events_tags.csv"

TAG_LABELS = {
    "tag_food":             "免費餐點",
    "tag_remote":           "遠距參加",
    "tag_audience_student": "學生",
    "tag_audience_outsider":"校外人士",
    "tag_audience_alumni":  "校友",
    "tag_audience_faculty": "教師",
    "tag_free":             "免報名費",
    "tag_english":          "英文學習",
    "tag_career":           "職涯分享",
    # Phase 2.1: activity_type 由来のタグ（公式分類 official_category と並列）
    "tag_workshop":         "工作坊",
    "tag_competition":      "競賽",
    "tag_recruitment":      "徵才",
    "tag_lecture":          "講座",
    "tag_course":           "課程",
    "tag_seminar":          "研習/研討",
    "tag_growth_group":     "成長團體",
}


def build_tags_table(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, row in df.iterrows():
        for col, label in TAG_LABELS.items():
            if row.get(col):
                rows.append({"event_url": row["event_url"], "tag": label})
    return pd.DataFrame(rows, columns=["event_url", "tag"])


def main():
    df = pd.read_csv(INPUT_CSV)
    tags_df = build_tags_table(df)
    tags_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"Done. {len(tags_df)} rows written to {OUTPUT_CSV}")
    print("\nTag counts:")
    print(tags_df["tag"].value_counts().to_string())


if __name__ == "__main__":
    main()
