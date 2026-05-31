import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, IconButton, InputBase, Popover, Button,
  useMediaQuery, useTheme,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { enUS, zhTW } from "date-fns/locale";
import { format as formatFn, parseISO, isSameDay, isWithinInterval } from "date-fns";
import EventCard from "../components/EventCard";
import { eventsApi } from "../api";
import { useData } from "../context/DataContext";
import { tokens } from "../theme";
import { translateTag } from "../i18n/tagLabels";

const PAGE_SIZE = 6;

// Shortcut tabs map directly to a backend filter.
// `kind` is informational; `query` is what we send to /api/events.
const SHORTCUT_TABS = [
  { id: "all",      labelKey: "filter.tabs.all",      kind: "all" },
  { id: "official", labelKey: "filter.tabs.official", kind: "official" },
  { id: "tags",     labelKey: "filter.tabs.tags",     kind: "tags" },
  { id: "free",     labelKey: "filter.tabs.free",     kind: "shortcut", query: { tag: "免報名費" } },
  { id: "meal",     labelKey: "filter.tabs.meal",     kind: "shortcut", query: { tag: "免費餐點" } },
];

// Native <input type="date"> ignores the page lang in Chrome, so the empty
// placeholder stays "年/月/日" even in English. We render a date-fns-localized
// MUI DateCalendar inside a popover instead (also doubles as a range picker).
const isEn = (lng) => lng.startsWith("en");
const parseYmd = (s) => (s ? parseISO(s) : null);
const formatYmd = (d) => (d && !Number.isNaN(d.getTime()) ? formatFn(d, "yyyy-MM-dd") : "");
// enUS defaults to a Sunday-first week; force Monday-first for both languages
// so the calendar layout is consistent regardless of UI language.
const mondayFirst = (loc) => ({ ...loc, options: { ...loc.options, weekStartsOn: 1 } });

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const dfLocale = mondayFirst(isEn(i18n.language) ? enUS : zhTW);
  const dateFormat = isEn(i18n.language) ? "MM/dd/yyyy" : "yyyy/MM/dd";
  // EN narrow weekday is "S M T W T F S" (Sat/Sun both "S"); use 3-letter
  // abbreviation instead. ZH single char (日一二…) is already unambiguous.
  const weekdayFmt = isEn(i18n.language) ? "EEE" : "EEEEE";
  const dayOfWeekFormatter = (date) => formatFn(date, weekdayFmt, { locale: dfLocale });
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const officialCategoryParam = searchParams.get("official_category") || "";
  const [activeTab, setActiveTab] = useState(officialCategoryParam ? "official" : "all");
  const [selectedCategory, setSelectedCategory] = useState(officialCategoryParam);
  const [selectedTags, setSelectedTags] = useState([]);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [keyword, setKeyword] = useState(searchQuery);
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [calAnchor, setCalAnchor] = useState(null);

  // Single calendar popover doubling as a range picker: 1st click sets start,
  // 2nd click sets end (auto-sorted), completing the range closes the popover.
  const handleDayPick = (day) => {
    const ymd = formatYmd(day);
    if (!date || (date && dateEnd)) {
      setDate(ymd);
      setDateEnd("");
    } else if (ymd < date) {
      setDateEnd(date);
      setDate(ymd);
      setCalAnchor(null);
    } else {
      setDateEnd(ymd);
      setCalAnchor(null);
    }
  };
  const displayDate = (s) => (s ? formatFn(parseISO(s), dateFormat) : "");

  const [listPage, setListPage] = useState(1);
  const [listData, setListData] = useState({ items: [], total: 0 });
  const [hotData, setHotData] = useState({ items: [], total: 0 });
  const [hotPage, setHotPage] = useState(1);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagOptions, setTagOptions] = useState([]);

  const { isEventBookmarked, toggleEventBookmark } = useData();

  // Ref for the active official-category chip — used to scroll it into view on navigation.
  const activeCategoryChipRef = useRef(null);
  useEffect(() => {
    if (activeTab !== "official" || !selectedCategory || !categoryOptions.length) return;
    const timer = setTimeout(() => {
      activeCategoryChipRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab, selectedCategory, categoryOptions]);

  const getSessionOverrides = (event) => {
    const sessions = event?.sessions || [];
    if (!sessions.length) return { date: event?.date || "" };

    let matched;
    if (date || dateEnd) {
      const start = date || "0000-00-00";
      const end = dateEnd || "9999-12-31";
      matched = sessions
        .filter((s) => s?.date && s.date >= start && s.date <= end)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
    } else if (upcomingOnly) {
      const today = new Date().toISOString().slice(0, 10);
      matched = sessions
        .filter((s) => s?.date && s.date >= today)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
    }
    matched = matched || sessions[0];
    return { date: matched?.date || event?.date || "", _matchedSessionId: matched?.id ?? null };
  };

  const hasDateRange = !!(date && dateEnd);
  const hasPartialDateRange = !!(date || dateEnd) && !hasDateRange;

  // Derived: is any search/filter active?
  const hasFilter = !!(keyword.trim() || hasDateRange || selectedTags.length > 0 || upcomingOnly || selectedCategory || activeTab !== "all");

  // sync external ?search= → keyword
  useEffect(() => { setKeyword(searchQuery); }, [searchQuery]);

  // sync ?official_category= → tab + category filter
  useEffect(() => {
    if (officialCategoryParam) {
      setActiveTab("official");
      setSelectedCategory(officialCategoryParam);
    }
  }, [officialCategoryParam]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setListPage(1);
  }, [activeTab, selectedCategory, JSON.stringify(selectedTags), upcomingOnly, keyword, date, dateEnd]);

  // Build query params from current filter state
  const buildQuery = () => {
    const params = { page: listPage, size: PAGE_SIZE };
    const tab = SHORTCUT_TABS.find((t) => t.id === activeTab);
    if (tab?.kind === "shortcut" && tab.query) Object.assign(params, tab.query);
    if (activeTab === "official" && selectedCategory) {
      params.category = selectedCategory;
      // Fetch all events in the category at once so we can expand sessions client-side.
      params.size = 100;
      params.page = 1;
    }
    if (activeTab === "tags") {
      if (selectedTags.length === 1) {
        params.tag = selectedTags[0]; // backward compat: use single tag param
      } else if (selectedTags.length > 1) {
        params.tags = selectedTags.join(","); // new multi-tag param (backend supports this)
      }
    }
    const kw = keyword.trim();
    if (kw) params.keyword = params.keyword ? `${params.keyword} ${kw}` : kw;
    if (hasDateRange) {
      params.date = date;
      params.date_to = dateEnd;
    } else if (upcomingOnly && activeTab === "tags") {
      params.date = new Date().toISOString().slice(0, 10);
    }
    return params;
  };

  // Clear list/hot data on language toggle so users don't briefly see ZH
  // titles & content under EN filter chips while the next request is in
  // flight. Filter changes keep prior items visible (felt smoother in v1).
  useEffect(() => {
    setListData({ items: [], total: 0 });
    setHotData({ items: [], total: 0 });
  }, [i18n.language]);

  // List
  useEffect(() => {
    let live = true;
    eventsApi.list(buildQuery())
      .then((d) => { if (live) setListData({ items: d.items, total: d.total }); })
      .catch(() => { if (live) setListData({ items: [], total: 0 }); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCategory, JSON.stringify(selectedTags), upcomingOnly, keyword, date, dateEnd, listPage, i18n.language]);

  // Hot
  useEffect(() => {
    let live = true;
    eventsApi.list({ page: hotPage, size: PAGE_SIZE, sort: "hot" })
      .then((d) => { if (live) setHotData({ items: d.items, total: d.total }); })
      .catch(() => { if (live) setHotData({ items: [], total: 0 }); });
    return () => { live = false; };
  }, [hotPage, i18n.language]);

  // Categories + tags. Categories localizes via lang; tag values are raw ZH
  // (translateTag handles UI display) so don't depend on language.
  useEffect(() => {
    let live = true;
    eventsApi.categories().then((rows) => { if (live) setCategoryOptions(rows.map((r) => r.name)); }).catch(() => {});
    eventsApi.tags().then((rows) => { if (live) setTagOptions(rows.map((r) => r.name)); }).catch(() => {});
    return () => { live = false; };
  }, [i18n.language]);

  // When #即將到來 is active, drop any stale/edge-case events that have no
  // session on or after today. This prevents a brief flash of 已結束 cards
  // while the new request is still loading (old list data remains until it
  // resolves) and guards against any backend/timezone edge cases.
  const filteredListItems = useMemo(() => {
    if (!upcomingOnly) return listData.items;
    const today = new Date().toISOString().slice(0, 10);
    return listData.items.filter((ev) =>
      (ev.sessions || []).some((s) => s?.date && s.date >= today)
    );
  }, [listData.items, upcomingOnly]);

  const totalListPages = useMemo(
    () => Math.max(1, Math.ceil(listData.total / PAGE_SIZE)),
    [listData.total]
  );

  // When a specific official category chip is selected, expand each event's sessions
  // into individual cards so users see one card per session date.
  const expandedListItems = useMemo(() => {
    if (activeTab !== "official" || !selectedCategory) return null;
    return listData.items.flatMap((ev) => {
      const sessions = ev.sessions || [];
      if (!sessions.length) return [ev];
      let toExpand = sessions;
      if (date || dateEnd) {
        const lo = date || "0000-00-00";
        const hi = dateEnd || "9999-12-31";
        const inRange = sessions.filter((s) => s?.date && s.date >= lo && s.date <= hi);
        if (inRange.length) toExpand = inRange;
      }
      return toExpand
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((s) => ({
          ...ev,
          sessions: [],  // clear so getSessionOverrides won't override the values below
          date: s.date || "",
          time: s.time_range || "",
          location: s.location || "",
          capacity: s.capacity ?? 0,
          remainingSlots: s.remaining_slots ?? 0,
          sessionName: s.session_name || "",
          _matchedSessionId: s.id,
          _cardKey: `${ev.id}-${s.id}`,
        }));
    });
  }, [listData.items, activeTab, selectedCategory, date, dateEnd]);

  const totalHotPages = useMemo(
    () => Math.max(1, Math.ceil(hotData.total / PAGE_SIZE)),
    [hotData.total]
  );

  const handleKeywordEnter = (e) => {
    if (e.key === "Enter") {
      setSearchParams(keyword ? { search: keyword } : {});
      setListPage(1);
    }
  };

  const handleSearchClick = () => {
    setSearchParams(keyword ? { search: keyword } : {});
    setListPage(1);
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 } }}>
        {/* === Filter tabs === */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            overflowX: "auto",
            pb: 1,
            mb: 1.5,
            borderBottom: `1px solid ${tokens.color.border}`,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {SHORTCUT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Box
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "official") setSelectedCategory("");
                  if (tab.id !== "tags") { setSelectedTags([]); setUpcomingOnly(false); }
                }}
                sx={{
                  px: 1.6,
                  py: 1,
                  fontSize: tokens.fontSize.body,
                  fontWeight: active ? 700 : 500,
                  color: active ? tokens.color.navy : tokens.color.text,
                  borderBottom: active ? `2px solid ${tokens.color.navy}` : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                {t(tab.labelKey)}
              </Box>
            );
          })}
        </Box>

        {/* === Secondary chip row (官方分類 = 母活動名 / #標籤) === */}
        {(activeTab === "official" || activeTab === "tags") && (
          <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mb: 0.5 }}>
            {activeTab === "official" ? t("filter.officialHint") : t("filter.tagsHint")}
          </Typography>
        )}
        {activeTab === "official" && (
          <Box sx={{ position: "relative", mb: 1 }}>
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder={t("filter.officialHint")}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "6px 32px 6px 10px",
                border: `1px solid ${tokens.color.border}`,
                borderRadius: 8, fontSize: 13,
                background: "#fff", outline: "none",
                color: tokens.color.text,
              }}
            />
            {categorySearch && (
              <span
                onClick={() => setCategorySearch("")}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  cursor: "pointer", color: tokens.color.placeholder, fontSize: 16, lineHeight: 1,
                }}
              >✕</span>
            )}
          </Box>
        )}
        {(activeTab === "official" || activeTab === "tags") && (
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              mb: 1.5,
              p: 1.25,
              bgcolor: "#fff",
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 1.5,
              flexWrap: activeTab === "tags" ? "wrap" : "nowrap",
              overflowX: activeTab === "official" ? "auto" : "visible",
              "&::-webkit-scrollbar": { height: 6 },
              "&::-webkit-scrollbar-thumb": { bgcolor: tokens.color.border, borderRadius: 3 },
            }}
          >
            {activeTab === "official" ? (
              <>
                <Chip
                  active={selectedCategory === ""}
                  onClick={() => setSelectedCategory("")}
                >
                  {t("filter.anyCategory")}
                </Chip>
                {categoryOptions
                  .filter((opt) => !categorySearch.trim() || opt.toLowerCase().includes(categorySearch.trim().toLowerCase()))
                  .slice(0, categorySearch.trim() ? 50 : 15)
                  .map((opt) => (
                  <Chip
                    key={opt}
                    active={selectedCategory === opt}
                    onClick={() => setSelectedCategory(opt)}
                    chipRef={selectedCategory === opt ? activeCategoryChipRef : null}
                  >
                    {opt}
                  </Chip>
                ))}
              </>
            ) : (
              <>
                <Chip
                  active={selectedTags.length === 0 && !upcomingOnly}
                  onClick={() => { setSelectedTags([]); setUpcomingOnly(false); }}
                >
                  {t("filter.anyTag")}
                </Chip>
                <Chip
                  active={upcomingOnly}
                  onClick={() => setUpcomingOnly((v) => !v)}
                >
                  {t("filter.upcoming")}
                </Chip>
                {tagOptions.map((opt) => {
                  const label = translateTag(opt, i18n.language);
                  const isTagActive = selectedTags.includes(opt);
                  return (
                    <Chip
                      key={opt}
                      active={isTagActive}
                      onClick={() => {
                        if (isTagActive) {
                          setSelectedTags(selectedTags.filter((tg) => tg !== opt));
                        } else {
                          setSelectedTags([...selectedTags, opt]);
                        }
                      }}
                    >
                      {`#${label}`}
                    </Chip>
                  );
                })}
              </>
            )}
          </Box>
        )}

        {/* === Filter input row: keyword / date range / location === */}
        <Box
          sx={{
            display: "flex",
            gap: 1.25,
            mb: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <FilterInput
            label={t("filter.keywordLabel")}
            placeholder={t("filter.keyword")}
            value={keyword}
            onChange={setKeyword}
            onEnter={handleKeywordEnter}
            onClear={() => {
              setKeyword("");
              setSearchParams({});
              setListPage(1);
            }}
            clearLabel={t("filter.clear")}
            flex={2}
          />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mb: 0.4 }}>
              {t("filter.dateRangeLabel")}
            </Typography>
            <Box
              onClick={(e) => setCalAnchor(e.currentTarget)}
              sx={{
                display: "flex", gap: 0.5, alignItems: "center", cursor: "pointer",
                bgcolor: "#fff",
                border: `1px solid ${hasPartialDateRange ? "#F59E0B" : tokens.color.border}`,
                borderRadius: 1.5, px: 1, height: 52,
                transition: "border-color 0.2s",
              }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: hasPartialDateRange ? "#F59E0B" : tokens.color.placeholder }} />
              <Box sx={{
                flex: 1, borderRadius: 1, px: 0.5, py: 0.5, fontSize: tokens.fontSize.body,
                color: date ? tokens.color.text : tokens.color.placeholder,
                bgcolor: (hasPartialDateRange && !date) ? "#FFF3CD" : "transparent",
                outline: (hasPartialDateRange && !date) ? "1.5px dashed #F59E0B" : "none",
              }}>
                {date ? displayDate(date) : dateFormat.toUpperCase()}
              </Box>
              <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mx: 0.25 }}>~</Typography>
              <Box sx={{
                flex: 1, borderRadius: 1, px: 0.5, py: 0.5, fontSize: tokens.fontSize.body,
                color: dateEnd ? tokens.color.text : tokens.color.placeholder,
                bgcolor: (hasPartialDateRange && !dateEnd) ? "#FFF3CD" : "transparent",
                outline: (hasPartialDateRange && !dateEnd) ? "1.5px dashed #F59E0B" : "none",
              }}>
                {dateEnd ? displayDate(dateEnd) : dateFormat.toUpperCase()}
              </Box>
            </Box>
            <Popover
              open={Boolean(calAnchor)}
              anchorEl={calAnchor}
              onClose={() => setCalAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dfLocale}>
                <DateCalendar
                  value={parseYmd(date)}
                  onChange={handleDayPick}
                  dayOfWeekFormatter={dayOfWeekFormatter}
                  slots={{
                    day: (dayProps) => {
                      const { day } = dayProps;
                      const start = parseYmd(date);
                      const end = parseYmd(dateEnd);
                      const isEndpoint = (start && isSameDay(day, start)) || (end && isSameDay(day, end));
                      const inRange = start && end && isWithinInterval(day, { start, end });
                      return (
                        <PickersDay
                          {...dayProps}
                          sx={{
                            ...(inRange && !isEndpoint && {
                              bgcolor: "rgba(245,158,11,0.15)", borderRadius: 0,
                            }),
                            ...(isEndpoint && {
                              bgcolor: "#F59E0B !important", color: "#fff",
                            }),
                          }}
                        />
                      );
                    },
                  }}
                />
              </LocalizationProvider>
              <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, pb: 1.5 }}>
                <Button
                  size="small"
                  onClick={() => { setDate(""); setDateEnd(""); }}
                  sx={{ textTransform: "none" }}
                >
                  {t("filter.clear")}
                </Button>
              </Box>
            </Popover>
            <Typography sx={{
              fontSize: tokens.fontSize.caption, mt: 0.5,
              color: hasPartialDateRange ? "#F59E0B" : tokens.color.placeholder,
              fontWeight: hasPartialDateRange ? 600 : 400,
            }}>
              {hasPartialDateRange ? t("filter.dateRangeHintRequired") : t("filter.dateRangeHint")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography sx={{
              fontSize: tokens.fontSize.caption, mb: 0.4,
              visibility: "hidden", display: { xs: "none", md: "block" },
            }}>.</Typography>
            <IconButton
              sx={{
                bgcolor: tokens.color.navy, color: "#fff",
                borderRadius: 1.5, width: 52, height: 52,
                "&:hover": { bgcolor: tokens.color.navyDark },
              }}
              onClick={handleSearchClick}
            >
              <SearchIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Hot events on top — hidden when any filter is active */}
        {!hasFilter && (
          <Section
            title={t("event.hot")}
            items={hotData.items}
            total={hotData.total}
            page={hotPage}
            totalPages={totalHotPages}
            setPage={setHotPage}
            isEventBookmarked={isEventBookmarked}
            toggleEventBookmark={toggleEventBookmark}
            getEventForDisplay={getSessionOverrides}
          />
        )}

        {/* All / filtered events below */}
        <Section
          title={hasFilter ? t("event.searchResults") : t("event.list")}
          items={expandedListItems ?? filteredListItems}
          total={expandedListItems ? expandedListItems.length : listData.total}
          page={expandedListItems ? 1 : listPage}
          totalPages={expandedListItems ? 1 : totalListPages}
          setPage={expandedListItems ? () => {} : setListPage}
          isEventBookmarked={isEventBookmarked}
          toggleEventBookmark={toggleEventBookmark}
          getEventForDisplay={getSessionOverrides}
          expandedMode={!!expandedListItems}
        />
      </Box>
    </Box>
  );
}

function Chip({ active, onClick, children, chipRef }) {
  return (
    <Box
      ref={chipRef}
      onClick={onClick}
      sx={{
        px: 1.4, py: 0.6, fontSize: tokens.fontSize.body, borderRadius: "9999px",
        bgcolor: active ? tokens.color.navy : "#F2F4F8",
        color: active ? "#fff" : tokens.color.text,
        cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
        fontWeight: active ? 700 : 500,
        transition: "background-color 0.15s",
        "&:hover": { filter: "brightness(0.97)" },
      }}
    >
      {children}
    </Box>
  );
}

function FilterInput({ label, placeholder, value, onChange, onEnter, icon, onClear, clearLabel, flex = 1 }) {
  return (
    <Box sx={{ flex }}>
      <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mb: 0.4 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: "flex", alignItems: "center",
          bgcolor: "#fff",
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 1.5, px: 1.4, height: 52, gap: 0.75,
        }}
      >
        {icon}
        <InputBase
          fullWidth
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onEnter}
          sx={{ fontSize: tokens.fontSize.body, flex: 1 }}
        />
        {onClear && value && (
          <IconButton
            onClick={onClear}
            size="small"
            aria-label={clearLabel || "clear"}
            sx={{ color: tokens.color.placeholder }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

function Section({
  title, items, total, page, totalPages, setPage,
  isEventBookmarked, toggleEventBookmark,
  getEventForDisplay, expandedMode = false,
}) {
  const { t } = useTranslation();
  const start = (page - 1) * PAGE_SIZE;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // In expandedMode all items are already pre-processed; show full count, no arrows.
  const displayEnd = expandedMode ? total : Math.min(start + PAGE_SIZE, total);
  const displayStart = expandedMode ? (total > 0 ? 1 : 0) : start + 1;

  return (
    <Box sx={{ mb: { xs: 4, md: 5 } }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontFamily: tokens.font.heading, fontWeight: 500, fontSize: { xs: tokens.fontSize.title, md: tokens.fontSize.heading }, color: tokens.color.text }}>
          {title}
        </Typography>
        {total > 0 && (
          <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.placeholder }}>
            {displayStart}-{displayEnd} / {total}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, md: 1 } }}>
        {!isMobile && (
          <IconButton
            disabled={!canPrev || expandedMode}
            onClick={() => { if (!expandedMode) setPage(page - 1); }}
            sx={{ color: canPrev && !expandedMode ? tokens.color.text : tokens.color.border, visibility: expandedMode ? "hidden" : "visible" }}
          >
            <ChevronLeftIcon sx={{ fontSize: 40 }} />
          </IconButton>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(3, 1fr)" },
            gap: { xs: 1, md: 1.5 },
            flex: 1,
          }}
        >
          {items.map((ev) => {
            const sessionId = expandedMode ? (ev._matchedSessionId || 0) : 0;
            return (
              <EventCard
                key={ev._cardKey || ev.id}
                event={getEventForDisplay ? { ...ev, ...getEventForDisplay(ev) } : ev}
                favorited={isEventBookmarked(ev.id, sessionId)}
                onToggleFavorite={() => toggleEventBookmark(ev.id, sessionId)}
              />
            );
          })}
          {items.length === 0 && (
            <Typography sx={{ gridColumn: "1/-1", textAlign: "center", color: tokens.color.placeholder, py: 4 }}>
              {t("event.emptyList")}
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <IconButton
            disabled={!canNext || expandedMode}
            onClick={() => { if (!expandedMode) setPage(page + 1); }}
            sx={{ color: canNext && !expandedMode ? tokens.color.text : tokens.color.border, visibility: expandedMode ? "hidden" : "visible" }}
          >
            <ChevronRightIcon sx={{ fontSize: 40 }} />
          </IconButton>
        )}
      </Box>

      {isMobile && !expandedMode && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2 }}>
          <IconButton disabled={!canPrev} onClick={() => setPage(page - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ fontSize: tokens.fontSize.body }}>{page} / {totalPages}</Typography>
          <IconButton disabled={!canNext} onClick={() => setPage(page + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
