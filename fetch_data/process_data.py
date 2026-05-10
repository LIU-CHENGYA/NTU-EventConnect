import pandas as pd

INPUT_CSV = "fetch_data/csv/events.csv"
OUTPUT_CSV = "fetch_data/csv/events_processed.csv"

CONTENT_FIELDS = ["activity_content", "session_content", "note"]

MEAL_HAS_FOOD = {"提供用餐", "葷食", "素食(植物性餐食)"}


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
