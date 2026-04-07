import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EventCard from "../components/EventCard";
import { mockEvents, categories } from "../mock/data";
import { tokens } from "../theme";

const PAGE_SIZE = 4;

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [listPage, setListPage] = useState(0);
  const [hotPage, setHotPage] = useState(0);

  const filteredEvents = useMemo(() => {
    let result = mockEvents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.content || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "全部") {
      result = result.filter((e) => e.category === selectedCategory);
    }
    return result;
  }, [searchQuery, selectedCategory]);

  const hotEvents = useMemo(
    () =>
      [...mockEvents].sort((a, b) => {
        // 真實資料 reviewCount 都是 0，改用 remainingSlots 少的視為熱門
        const ra = a.reviewCount || 0;
        const rb = b.reviewCount || 0;
        if (rb !== ra) return rb - ra;
        return (a.remainingSlots || 0) - (b.remainingSlots || 0);
      }),
    []
  );

  // 翻頁時 reset listPage 以免越界
  const safeListPage = listPage * PAGE_SIZE >= filteredEvents.length ? 0 : listPage;
  const safeHotPage = hotPage * PAGE_SIZE >= hotEvents.length ? 0 : hotPage;

  const Section = ({ title, items, page, setPage, showCategories }) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const start = page * PAGE_SIZE;
    const visible = items.slice(start, start + PAGE_SIZE);
    const canPrev = page > 0;
    const canNext = page < totalPages - 1;

    return (
      <Box sx={{ mb: 6 }}>
        {/* Header row */}
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
            {items.length > 0 && (
              <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>
                {start + 1}-{Math.min(start + PAGE_SIZE, items.length)} / {items.length}
              </Typography>
            )}
          </Box>

          {showCategories && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 14, color: tokens.color.text, mr: 1 }}>推薦類別</Typography>
              {["全部", ...categories.filter((c) => c !== "全部").slice(0, 4)].map((cat) => (
                <Box
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setListPage(0);
                  }}
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

        {/* Card row */}
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
            {visible.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
            {visible.length === 0 && (
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
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 5 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 4 }}>
        <Section
          title="活動列表"
          items={filteredEvents}
          page={safeListPage}
          setPage={setListPage}
          showCategories
        />
        <Section
          title="熱門活動"
          items={hotEvents}
          page={safeHotPage}
          setPage={setHotPage}
        />
      </Box>
    </Box>
  );
}
