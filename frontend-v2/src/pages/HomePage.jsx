import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, IconButton, InputBase,
  useMediaQuery, useTheme,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
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

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [keyword, setKeyword] = useState(searchQuery);
  const [date, setDate] = useState("");

  const [listPage, setListPage] = useState(1);
  const [listData, setListData] = useState({ items: [], total: 0 });
  const [hotData, setHotData] = useState({ items: [], total: 0 });
  const [hotPage, setHotPage] = useState(1);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const { isEventBookmarked, toggleEventBookmark } = useData();

  // sync external ?search= → keyword
  useEffect(() => { setKeyword(searchQuery); }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setListPage(1);
  }, [activeTab, selectedCategory, selectedTag, keyword, date]);

  // Build query params from current filter state
  const buildQuery = () => {
    const params = { page: listPage, size: PAGE_SIZE };
    const tab = SHORTCUT_TABS.find((t) => t.id === activeTab);
    if (tab?.kind === "shortcut" && tab.query) Object.assign(params, tab.query);
    if (activeTab === "official" && selectedCategory) params.category = selectedCategory;
    if (activeTab === "tags" && selectedTag) params.tag = selectedTag;
    const kw = keyword.trim();
    if (kw) params.keyword = params.keyword ? `${params.keyword} ${kw}` : kw;
    if (date) params.date = date;
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
  }, [activeTab, selectedCategory, selectedTag, keyword, date, listPage, i18n.language]);

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

  const totalListPages = useMemo(
    () => Math.max(1, Math.ceil(listData.total / PAGE_SIZE)),
    [listData.total]
  );
  const totalHotPages = useMemo(
    () => Math.max(1, Math.ceil(hotData.total / PAGE_SIZE)),
    [hotData.total]
  );

  const handleKeywordEnter = (e) => {
    if (e.key === "Enter") {
      setSearchParams(keyword ? { search: keyword } : {});
    }
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
                  if (tab.id !== "tags") setSelectedTag("");
                }}
                sx={{
                  px: 1.6,
                  py: 1,
                  fontSize: 14,
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
          <Typography sx={{ fontSize: 12, color: tokens.color.placeholder, mb: 0.5 }}>
            {activeTab === "official" ? t("filter.officialHint") : t("filter.tagsHint")}
          </Typography>
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
              // 母活動名は 329 種あるため横スクロール、タグは少ないので折返し OK
              flexWrap: activeTab === "tags" ? "wrap" : "nowrap",
              overflowX: activeTab === "official" ? "auto" : "visible",
              "&::-webkit-scrollbar": { height: 6 },
              "&::-webkit-scrollbar-thumb": { bgcolor: tokens.color.border, borderRadius: 3 },
            }}
          >
            <Chip
              active={(activeTab === "official" ? selectedCategory : selectedTag) === ""}
              onClick={() => activeTab === "official" ? setSelectedCategory("") : setSelectedTag("")}
            >
              {activeTab === "official" ? t("filter.anyCategory") : t("filter.anyTag")}
            </Chip>
            {/* 母活動名は固有名詞なので i18n しない。Top 15 で frontend cap (場次数降順は backend)。 */}
            {(activeTab === "official"
              ? categoryOptions.slice(0, 15)
              : tagOptions
            ).map((opt) => {
              const cur = activeTab === "official" ? selectedCategory : selectedTag;
              const setCur = activeTab === "official" ? setSelectedCategory : setSelectedTag;
              const label = activeTab === "tags" ? translateTag(opt, i18n.language) : opt;
              return (
                <Chip key={opt} active={cur === opt} onClick={() => setCur(opt)}>
                  {activeTab === "tags" ? `#${label}` : label}
                </Chip>
              );
            })}
          </Box>
        )}

        {/* === Filter input row: keyword / date / location === */}
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
            flex={2}
          />
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Typography sx={{ fontSize: 12, color: tokens.color.placeholder, mb: 0.4 }}>
              {t("filter.dateRangeLabel")}
            </Typography>
            <Box sx={{
              display: "flex", alignItems: "center", bgcolor: "#fff",
              border: `1px solid ${tokens.color.border}`, borderRadius: 1.5,
              px: 1.4, height: 56, gap: 0.75,
            }}>
              <CalendarTodayIcon sx={{ fontSize: 16, color: tokens.color.placeholder }} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  border: "none", outline: "none", background: "transparent",
                  flex: 1, fontSize: 14, color: tokens.color.text, fontFamily: "inherit",
                }}
              />
            </Box>
          </Box>
          <IconButton
            sx={{
              bgcolor: tokens.color.navy, color: "#fff",
              borderRadius: 1.5, width: 56, height: 56,
              alignSelf: { xs: "flex-end", md: "flex-end" },
              "&:hover": { bgcolor: tokens.color.navyDark },
            }}
            onClick={() => setSearchParams(keyword ? { search: keyword } : {})}
          >
            <SearchIcon />
          </IconButton>
        </Box>

        <Section
          title={t("event.list")}
          items={listData.items}
          total={listData.total}
          page={listPage}
          totalPages={totalListPages}
          setPage={setListPage}
          isEventBookmarked={isEventBookmarked}
          toggleEventBookmark={toggleEventBookmark}
        />
        <Section
          title={t("event.hot")}
          items={hotData.items}
          total={hotData.total}
          page={hotPage}
          totalPages={totalHotPages}
          setPage={setHotPage}
          isEventBookmarked={isEventBookmarked}
          toggleEventBookmark={toggleEventBookmark}
        />
      </Box>
    </Box>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.4, py: 0.6, fontSize: 13, borderRadius: "9999px",
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

function FilterInput({ label, placeholder, value, onChange, onEnter, icon, flex = 1 }) {
  return (
    <Box sx={{ flex }}>
      <Typography sx={{ fontSize: 12, color: tokens.color.placeholder, mb: 0.4 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: "flex", alignItems: "center",
          bgcolor: "#fff",
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 1.5, px: 1.4, height: 44, gap: 0.75,
        }}
      >
        {icon}
        <InputBase
          fullWidth
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onEnter}
          sx={{ fontSize: 14, flex: 1 }}
        />
      </Box>
    </Box>
  );
}

function Section({
  title, items, total, page, totalPages, setPage,
  isEventBookmarked, toggleEventBookmark,
}) {
  const start = (page - 1) * PAGE_SIZE;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ mb: { xs: 4, md: 5 } }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontFamily: tokens.font.heading, fontWeight: 500, fontSize: { xs: 20, md: 24 }, color: tokens.color.text }}>
          {title}
        </Typography>
        {total > 0 && (
          <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>
            {start + 1}-{Math.min(start + PAGE_SIZE, total)} / {total}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, md: 1 } }}>
        {!isMobile && (
          <IconButton disabled={!canPrev} onClick={() => setPage(page - 1)}
            sx={{ color: canPrev ? tokens.color.text : tokens.color.border }}>
            <ChevronLeftIcon sx={{ fontSize: 40 }} />
          </IconButton>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 2.5 },
            flex: 1,
          }}
        >
          {items.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              favorited={isEventBookmarked(ev.id)}
              onToggleFavorite={() => toggleEventBookmark(ev.id)}
            />
          ))}
          {items.length === 0 && (
            <Typography sx={{ gridColumn: "1/-1", textAlign: "center", color: tokens.color.placeholder, py: 4 }}>
              沒有符合條件的活動
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <IconButton disabled={!canNext} onClick={() => setPage(page + 1)}
            sx={{ color: canNext ? tokens.color.text : tokens.color.border }}>
            <ChevronRightIcon sx={{ fontSize: 40 }} />
          </IconButton>
        )}
      </Box>

      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2 }}>
          <IconButton disabled={!canPrev} onClick={() => setPage(page - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ fontSize: 14 }}>{page} / {totalPages}</Typography>
          <IconButton disabled={!canNext} onClick={() => setPage(page + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
