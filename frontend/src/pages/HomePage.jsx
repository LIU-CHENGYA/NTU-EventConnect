import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, InputBase, Chip, Grid } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EventCard from "../components/EventCard";
import { mockEvents, categories } from "../mock/data";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
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
    return result;
  }, [searchQuery, selectedCategory]);

  const hotEvents = useMemo(() => {
    return [...mockEvents].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 3);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setSearchParams(searchQuery ? { search: searchQuery } : {});
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      {/* Search + Category */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, pt: 4 }}>
        {/* Search bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "white",
            borderRadius: 2,
            px: 2,
            py: 1,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            mb: 2,
          }}
        >
          <SearchIcon sx={{ color: "#999", mr: 1 }} />
          <InputBase
            placeholder="搜尋活動名稱、內容..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            sx={{ fontSize: 15 }}
          />
        </Box>

        {/* Categories */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                bgcolor: selectedCategory === cat ? "#1a237e" : "white",
                color: selectedCategory === cat ? "white" : "#333",
                fontWeight: 500,
                "&:hover": { bgcolor: selectedCategory === cat ? "#0d1754" : "#e8eaf6" },
              }}
            />
          ))}
        </Box>

        {/* Event list */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1a237e" }}>
          活動列表
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <EventCard event={event} />
            </Grid>
          ))}
          {filteredEvents.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                找不到符合條件的活動
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Hot events */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1a237e" }}>
          熱門活動
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {hotEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
