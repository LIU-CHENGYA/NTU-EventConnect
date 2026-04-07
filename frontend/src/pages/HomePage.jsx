import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EventCard from "../components/EventCard";
import { mockEvents, categories } from "../mock/data";
import { tokens } from "../theme";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("全部");

  const filteredEvents = useMemo(() => {
    let result = mockEvents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "全部") {
      result = result.filter((e) => e.category === selectedCategory);
    }
    return result.slice(0, 4);
  }, [searchQuery, selectedCategory]);

  const hotEvents = useMemo(
    () => [...mockEvents].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4),
    []
  );

  const Section = ({ title, items, showCategories }) => (
    <Box sx={{ mb: 6 }}>
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
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

        {showCategories && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 14, color: tokens.color.text, mr: 1 }}>推薦類別</Typography>
            {categories.filter(c => c !== "全部").slice(0, 4).map(cat => (
              <Box
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 1.2, py: "3px",
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2.5,
            flex: 1,
          }}
        >
          {items.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </Box>
        <IconButton sx={{ color: tokens.color.placeholder }}>
          <ChevronRightIcon sx={{ fontSize: 48 }} />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 5 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 4 }}>
        <Section title="活動列表" items={filteredEvents} showCategories />
        <Section title="熱門活動" items={hotEvents} />
      </Box>
    </Box>
  );
}
