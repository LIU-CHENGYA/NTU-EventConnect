import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, IconButton, useMediaQuery, useTheme,
  InputBase, Button, TextField,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EventCard from "../components/EventCard";
import { eventsApi } from "../api";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

const PAGE_SIZE = 4; // keep 4 for list; hot uses 3 per row visually but same logic

// Placeholder hot tags — replace with API data as needed
const HOT_TAGS = [
  "VISION 徵才博覽會",
  "外教中心 電影欣賞",
  "基本救命術BLS訓練",
  "新進人員訓練課程",
  "AI 助攻：論文寫作、學術溝通與思考力再進化",
  "Writing Together, Stronger than Ever！",
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search state
  const [keyword, setKeyword] = useState(searchParams.get("search") || "");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [location, setLocation] = useState("");

  const searchQuery = searchParams.get("search") || "";
  const tab = searchParams.get("tab") || "all";

  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [listPage, setListPage] = useState(1);
  const [hotPage, setHotPage] = useState(1);
  const { isEventBookmarked, toggleEventBookmark } = useData();

  const [listData, setListData] = useState({ items: [], total: 0 });
  const [hotData, setHotData] = useState({ items: [], total: 0 });
  const [categoryOptions, setCategoryOptions] = useState(["全部"]);

  useEffect(() => { setListPage(1); }, [searchQuery, selectedCategory, tab]);

  useEffect(() => {
    let live = true;
    const params = {
      page: listPage,
      size: PAGE_SIZE,
      ...(selectedCategory !== "全部" && { category: selectedCategory }),
      ...(searchQuery.trim() && { keyword: searchQuery.trim() }),
      ...(tab !== "all" && { tab }),
    };
    eventsApi
      .list(params)
      .then((d) => { if (live) setListData({ items: d.items, total: d.total }); })
      .catch(() => { if (live) setListData({ items: [], total: 0 }); });
    return () => { live = false; };
  }, [searchQuery, selectedCategory, listPage, tab]);

  useEffect(() => {
    let live = true;
    eventsApi
      .list({ page: hotPage, size: PAGE_SIZE, sort: "hot" })
      .then((d) => { if (live) setHotData({ items: d.items, total: d.total }); })
      .catch(() => { if (live) setHotData({ items: [], total: 0 }); });
    return () => { live = false; };
  }, [hotPage]);

  useEffect(() => {
    let live = true;
    eventsApi
      .categories()
      .then((rows) => {
        if (!live) return;
        setCategoryOptions(["全部", ...rows.map((r) => r.name)]);
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const totalListPages = useMemo(
    () => Math.max(1, Math.ceil(listData.total / PAGE_SIZE)),
    [listData.total]
  );
  const totalHotPages = useMemo(
    () => Math.max(1, Math.ceil(hotData.total / PAGE_SIZE)),
    [hotData.total]
  );

  const handleSearch = () => {
    const params = Object.fromEntries(searchParams.entries());
    if (keyword.trim()) {
      params.search = keyword.trim();
    } else {
      delete params.search;
    }
    setSearchParams(params);
  };

  const handleTagClick = (tag) => {
    setKeyword(tag);
    const params = Object.fromEntries(searchParams.entries());
    params.search = tag;
    setSearchParams(params);
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 } }}>

        {/* ── Advanced search bar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            bgcolor: "#fff",
            border: `1px solid ${tokens.color.border}`,
            borderRadius: "12px",
            overflow: "hidden",
            mb: 2,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* 關鍵字 */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              px: 2.5,
              py: 1.5,
              borderRight: { md: `1px solid ${tokens.color.border}` },
              borderBottom: { xs: `1px solid ${tokens.color.border}`, md: "none" },
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.color.placeholder, mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              關鍵字
            </Typography>
            <InputBase
              placeholder="搜尋活動名稱／主辦單位"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ fontSize: 14, color: tokens.color.text }}
            />
          </Box>

          {/* 日期範圍 */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              px: 2.5,
              py: 1.5,
              borderRight: { md: `1px solid ${tokens.color.border}` },
              borderBottom: { xs: `1px solid ${tokens.color.border}`, md: "none" },
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.color.placeholder, mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              日期範圍
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InputBase
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                sx={{ fontSize: 13, color: tokens.color.text, flex: 1 }}
              />
              <Typography sx={{ fontSize: 12, color: tokens.color.placeholder }}>–</Typography>
              <InputBase
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                sx={{ fontSize: 13, color: tokens.color.text, flex: 1 }}
              />
            </Box>
          </Box>

          {/* 地點 */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              px: 2.5,
              py: 1.5,
              borderBottom: { xs: `1px solid ${tokens.color.border}`, md: "none" },
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: tokens.color.placeholder, mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              地點
            </Typography>
            <InputBase
              placeholder="任何地點"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              sx={{ fontSize: 14, color: tokens.color.text }}
            />
          </Box>

          {/* Search button */}
          <Box sx={{ display: "flex", alignItems: "center", p: { xs: 1.5, md: 1 } }}>
            <IconButton
              onClick={handleSearch}
              sx={{
                bgcolor: tokens.color.navy,
                color: "#fff",
                width: 44,
                height: 44,
                borderRadius: "10px",
                "&:hover": { bgcolor: "#1a2a5e" },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Box>
        </Box>

        {/* ── Hot tags row ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 4,
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {HOT_TAGS.map((tag) => (
            <Box
              key={tag}
              onClick={() => handleTagClick(tag)}
              sx={{
                px: 1.5,
                py: 0.6,
                fontSize: 12,
                borderRadius: "20px",
                border: `1px solid ${tokens.color.border}`,
                bgcolor: "#fff",
                color: tokens.color.text,
                whiteSpace: "nowrap",
                cursor: "pointer",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                transition: "all 0.15s",
                "&:hover": { borderColor: tokens.color.navy, color: tokens.color.navy },
                "&:active": { opacity: 0.7 },
              }}
            >
              {tag}
            </Box>
          ))}
        </Box>

        {/* ── Sections ── */}
        <Section
          title="活動列表"
          items={listData.items}
          total={listData.total}
          page={listPage}
          totalPages={totalListPages}
          setPage={setListPage}
          showCategories
          categoryOptions={categoryOptions}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isEventBookmarked={isEventBookmarked}
          toggleEventBookmark={toggleEventBookmark}
          showAddButton={user?.isAdmin}
          onAddClick={() => navigate("/events/create")}
          columns={3}
        />

        <Section
          title="熱門活動"
          items={hotData.items}
          total={hotData.total}
          page={hotPage}
          totalPages={totalHotPages}
          setPage={setHotPage}
          isEventBookmarked={isEventBookmarked}
          toggleEventBookmark={toggleEventBookmark}
          columns={3}
        />
      </Box>
    </Box>
  );
}

function Section({
  title,
  items,
  total,
  page,
  totalPages,
  setPage,
  showCategories,
  categoryOptions,
  selectedCategory,
  setSelectedCategory,
  isEventBookmarked,
  toggleEventBookmark,
  showAddButton,
  onAddClick,
  columns = 4,
}) {
  const PAGE_SIZE_LOCAL = 4;
  const start = (page - 1) * PAGE_SIZE_LOCAL;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const gridCols = {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: `repeat(${columns}, 1fr)`,
  };

  return (
    <Box sx={{ mb: { xs: 4, md: 6 } }}>
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          mb: 2,
          gap: 1,
        }}
      >
        {/* Left: title + count + add button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            sx={{
              fontFamily: tokens.font.heading,
              fontWeight: 500,
              fontSize: { xs: 20, md: 22 },
              color: tokens.color.text,
            }}
          >
            {title}
          </Typography>
          {total > 0 && (
            <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>
              {start + 1}-{Math.min(start + PAGE_SIZE_LOCAL, total)} / {total}
            </Typography>
          )}
          {showAddButton && (
            <Button
              startIcon={<AddCircleIcon sx={{ color: "white", fontSize: 18 }} />}
              onClick={onAddClick}
              sx={{
                bgcolor: tokens.color.black,
                color: "#f3f3f5",
                textTransform: "none",
                borderRadius: "20px",
                px: 2,
                height: 32,
                fontSize: 13,
                "&:hover": { bgcolor: "#222" },
              }}
            >
              新增活動
            </Button>
          )}
        </Box>

        {/* Right: category pills */}
        {showCategories && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              overflowX: "auto",
              maxWidth: "100%",
              pb: 0.5,
              WebkitOverflowScrolling: "touch",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {["全部", ...categoryOptions.filter((c) => c !== "全部").slice(0, 4)].map((cat) => (
              <Box
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 1.5,
                  py: 0.6,
                  fontSize: 13,
                  borderRadius: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  minHeight: 34,
                  display: "flex",
                  alignItems: "center",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                  bgcolor: selectedCategory === cat ? tokens.color.navy : "#fff",
                  color: selectedCategory === cat ? "#fff" : tokens.color.text,
                  border: `1px solid ${tokens.color.border}`,
                  transition: "background-color 0.15s",
                  "&:active": { opacity: 0.7 },
                }}
              >
                {cat}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Cards + pagination */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, md: 1 } }}>
        {!isMobile && (
          <IconButton
            disabled={!canPrev}
            onClick={() => setPage(page - 1)}
            sx={{ color: canPrev ? tokens.color.text : tokens.color.border }}
          >
            <ChevronLeftIcon sx={{ fontSize: 36 }} />
          </IconButton>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: gridCols,
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
          <IconButton
            disabled={!canNext}
            onClick={() => setPage(page + 1)}
            sx={{ color: canNext ? tokens.color.text : tokens.color.border }}
          >
            <ChevronRightIcon sx={{ fontSize: 36 }} />
          </IconButton>
        )}
      </Box>

      {/* Mobile pagination */}
      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2 }}>
          <IconButton
            disabled={!canPrev}
            onClick={() => setPage(page - 1)}
            sx={{ color: canPrev ? tokens.color.text : tokens.color.border }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ fontSize: 14, color: tokens.color.text }}>
            {page} / {totalPages}
          </Typography>
          <IconButton
            disabled={!canNext}
            onClick={() => setPage(page + 1)}
            sx={{ color: canNext ? tokens.color.text : tokens.color.border }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

