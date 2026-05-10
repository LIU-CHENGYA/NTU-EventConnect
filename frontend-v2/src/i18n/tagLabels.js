// Static dictionary for DB-driven tag and category names that can't live in
// the i18next bundles (they come from seed_events.py / event_tags). Falls back
// to the original Chinese label if no translation is registered.
//
// Keep keys exactly as they are seeded — see fetch_data/build_tags_table.py
// (TAG_LABELS) and seed_events.py (extract_official_category).

const EN_MAP = {
  // tag labels (event_tags)
  "免費餐點": "Free Meal",
  "遠距參加": "Remote",
  "學生": "Students",
  "校外人士": "Public",
  "校友": "Alumni",
  "教師": "Faculty",
  "免報名費": "Free Registration",
  "英文學習": "English Learning",
  "職涯分享": "Career Sharing",
  "工作坊": "Workshop",
  "競賽": "Competition",
  "徵才": "Recruitment",
  "講座": "Lecture",
  "課程": "Course",
  "研習/研討": "Seminar",
  "成長團體": "Growth Group",
  "其他活動": "Other Event",
  "活動": "Event",
  // official_category (life_learning_type 大分類)
  "專業技術": "Professional Skills",
  "人文素養": "Humanities",
  "專業行政": "Administration",
  "管理": "Management",
  "政策法規": "Policy & Regulations",
};

export function translateTag(name, lang) {
  if (!name) return name;
  if (lang && lang.toLowerCase().startsWith("en")) {
    return EN_MAP[name] || name;
  }
  return name;
}
