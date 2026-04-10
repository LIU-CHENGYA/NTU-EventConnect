import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, IconButton, useMediaQuery, useTheme } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EventCard from "../components/EventCard";
import { eventsApi } from "../api";
import { useData } from "../context/DataContext";
import { tokens } from "../theme";

const PAGE_SIZE = 4;

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [listPage, setListPage] = useState(1); // 1-based for backend
  const [hotPage, setHotPage] = useState(1);
  const { isEventBookmarked, toggleEventBookmark } = useData();

  const [listData, setListData] = useState({ items: [], total: 0 });
  const [hotData, setHotData] = useState({ items: [], total: 0 });
  const [categoryOptions, setCategoryOptions] = useState(["全部"]);

  // Reset to page 1 whenever filter inputs change
  useEffect(() => { setListPage(1); }, [searchQuery, selectedCategory]);

  // Server-side filtered + paginated list
  useEffect(() => {
    let live = true;
    eventsApi
      .list({
        page: listPage,
        size: PAGE_SIZE,
        ...(selectedCategory !== "全部" && { category: selectedCategory }),
        ...(searchQuery.trim() && { keyword: searchQuery.trim() }),
      })
      .then((d) => { if (live) setListData({ items: d.items, total: d.total }); })
      .catch(() => { if (live) setListData({ items: [], total: 0 }); });
    return () => { live = false; };
  }, [searchQuery, selectedCategory, listPage]);

  // Server-side hot list
  useEffect(() => {
    let live = true;
    eventsApi
      .list({ page: hotPage, size: PAGE_SIZE, sort: "hot" })
      .then((d) => { if (live) setHotData({ items: d.items, total: d.total }); })
      .catch(() => { if (live) setHotData({ items: [], total: 0 }); });
    return () => { live = false; };
  }, [hotPage]);

  // Categories from dedicated endpoint (no full-list fetch needed)
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

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: { xs: 2, md: 5 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 } }}>
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
}) {
  const start = (page - 1) * PAGE_SIZE;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography
            sx={{
              fontFamily: tokens.font.heading,
              fontWeight: 500,
              fontSize: { xs: 20, md: 24 },
              color: tokens.color.text,
            }}
          >
            {title}
          </Typography>
          {total > 0 && (
            <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>
              {start + 1}-{Math.min(start + PAGE_SIZE, total)} / {total}
            </Typography>
          )}
        </Box>

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
            <Typography
              sx={{ fontSize: 14, color: tokens.color.text, mr: 0.5, whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}
            >
              推薦類別
            </Typography>
            {["全部", ...categoryOptions.filter((c) => c !== "全部").slice(0, 4)].map((cat) => (
              <Box
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 1.5,
                  py: 0.8,
                  fontSize: 13,
                  borderRadius: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  minHeight: 36,
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
            <ArrowDropDownIcon sx={{ color: tokens.color.text, flexShrink: 0 }} />
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
            <ChevronLeftIcon sx={{ fontSize: 40 }} />
          </IconButton>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
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
            <ChevronRightIcon sx={{ fontSize: 40 }} />
          </IconButton>
        )}
      </Box>

      {/* Mobile pagination — bottom buttons */}
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
