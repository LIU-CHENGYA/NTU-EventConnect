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
