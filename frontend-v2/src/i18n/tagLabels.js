// Static dictionary for DB-driven tag names (event_tags) that can't live in
// the i18next bundles. Falls back to the original Chinese label if no
// translation is registered.
//
// Scope: tags only. 「台大官方分類」 chips show 母活動名 (parent activity name)
// which is a proper noun and is rendered verbatim — translateTag is not
// applied to those.
//
// Keep keys exactly as they are seeded — see fetch_data/build_tags_table.py
// (TAG_LABELS).

const EN_MAP = {
  "免費餐點": "Free Meal",
  "遠距參加": "Remote",
  "學生": "Students",
  "校外人士": "Public",
  "校友": "Alumni",
  "教師": "Faculty",
  "免報名費": "Free Registration",
  "工作坊": "Workshop",
  "競賽": "Competition",
  "徵才": "Recruitment",
  "講座": "Lecture",
  "課程": "Course",
  "研習/研討": "Seminar",
  "成長團體": "Growth Group",
  "其他活動": "Other Event",
  "活動": "Event",
};

export function translateTag(name, lang) {
  if (!name) return name;
  if (lang && lang.toLowerCase().startsWith("en")) {
    return EN_MAP[name] || name;
  }
  return name;
}
