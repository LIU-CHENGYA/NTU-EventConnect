"""
Seed English translations from fetch_data/csv/events_en.csv into the database.
 
Usage (run from backend-v2 root):
    python seed_en.py
 
Safe to run multiple times (idempotent).
"""
import sys
import os
import pandas as pd
 
# Allow imports from the backend-v2 package
sys.path.insert(0, os.path.dirname(__file__))
 
from app.db.session import SessionLocal
from app.models.event import Event, EventSession
 
 
CSV_PATH = os.path.join("..","fetch_data", "csv", "events_en.csv")
 
 
def clean(val):
    """Return None for NaN/empty, else stripped string."""
    if pd.isna(val) or str(val).strip() == "":
        return None
    return str(val).strip()
 
 
def main():
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} rows from {CSV_PATH}")
 
    db = SessionLocal()
    event_updated = 0
    event_not_found = 0
    session_updated = 0
    session_not_found = 0
 
    try:
        for _, row in df.iterrows():
            parent_url = clean(row.get("parent_url"))
            event_url  = clean(row.get("event_url"))
 
            # ── Update Event (parent) ──────────────────────────────────────
            if parent_url:
                event = db.query(Event).filter(Event.source_url == parent_url).first()
                if event:
                    event.title_en             = clean(row.get("activity_name_activity_session"))
                    event.content_en           = clean(row.get("activity_content"))
                    event.category_en          = clean(row.get("activity_type"))
                    event.official_category_en = clean(row.get("activity_name_activity_session"))
                    event.organizer_en         = clean(row.get("organizer_unit"))
                    event.registration_type_en = clean(row.get("registration_type"))
                    event.registration_fee_en  = clean(row.get("registration_fee"))
                    event.target_audience_en   = clean(row.get("target_audience"))
                    event.learning_category_en = clean(row.get("learning_category"))
                    event_updated += 1
                else:
                    event_not_found += 1
 
            # ── Update EventSession ────────────────────────────────────────
            if event_url:
                session = db.query(EventSession).filter(
                    EventSession.source_url == event_url
                ).first()
                if session:
                    session.session_name_en    = clean(row.get("activity_name_event_page"))
                    session.session_content_en = clean(row.get("session_content"))
                    session.instructor_en      = clean(row.get("instructor"))
                    session.location_en        = clean(row.get("location"))
                    session.meal_en            = clean(row.get("meal"))
                    session_updated += 1
                else:
                    session_not_found += 1
 
        db.commit()
        print(f"\nDone!")
        print(f"  Events   updated: {event_updated}, not found: {event_not_found}")
        print(f"  Sessions updated: {session_updated}, not found: {session_not_found}")
 
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()
 
 
if __name__ == "__main__":
    main()