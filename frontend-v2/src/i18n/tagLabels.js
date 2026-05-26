// Static dictionary for DB-driven Chinese labels that can't live in the
// i18next bundles. Two groups, both translated via this map:
//
//   1) The 7 canonical event_tags (EventTag.tag) — see backend-v2/scripts/
//      seed_events.py EN_TAG_FLAGS. These power the #標籤 chips, the
//      free/meal shortcut tabs, and the per-card tag pills.
//   2) Event.category (= activity_type from events.csv, e.g. 講座/工作坊/
//      競賽/徵才/...) — small badge on the card / detail title pill. This
//      is the *category* field, distinct from the `official_category` /
//      母活動名 (329 proper nouns) which is rendered verbatim with no
//      translation.
//
// Falls back to the original Chinese label if no translation is registered
// (e.g. 母活動名 proper nouns).
//
// Keep keys exactly as they are seeded by the backend.

const EN_MAP = {
  "免費餐點": "Free Meal",
  "遠距參加": "Remote",
  "遠距參與": "Remote Participation",
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
  "參加身分類型": "Participation Type",
};

export function translateTag(name, lang) {
  if (!name) return name;
  if (lang && lang.toLowerCase().startsWith("en")) {
    return EN_MAP[name] || name;
  }
  return name;
}
