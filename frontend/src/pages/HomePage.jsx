import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
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
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 5 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 4 }}>
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

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography
            sx={{
              fontFamily: tokens.font.heading,
              fontWeight: 500,
              fontSize: 24,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 14, color: tokens.color.text, mr: 1 }}>推薦類別</Typography>
            {["全部", ...categoryOptions.filter((c) => c !== "全部").slice(0, 4)].map((cat) => (
              <Box
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 1.2,
                  py: "3px",
                  fontSize: 12,
                  borderRadius: "10px",
                  cursor: "pointer",
                  bgcolor: selectedCategory === cat ? tokens.color.navy : "#fff",
                  color: selectedCategory === cat ? "#fff" : tokens.color.text,
                  border: `1px solid ${tokens.color.border}`,
                }}
              >
                {cat}
              </Box>
            ))}
            <ArrowDropDownIcon sx={{ color: tokens.color.text }} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          disabled={!canPrev}
          onClick={() => setPage(page - 1)}
          sx={{ color: canPrev ? tokens.color.text : tokens.color.border }}
        >
          <ChevronLeftIcon sx={{ fontSize: 40 }} />
        </IconButton>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2.5,
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
        <IconButton
          disabled={!canNext}
          onClick={() => setPage(page + 1)}
          sx={{ color: canNext ? tokens.color.text : tokens.color.border }}
        >
          <ChevronRightIcon sx={{ fontSize: 40 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
