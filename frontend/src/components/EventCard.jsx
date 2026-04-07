import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PlaceIcon from "@mui/icons-material/Place";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import { tokens } from "../theme";

export default function EventCard({
  event,
  showActions = false,
  status,
  onCancel,
  favorited = false,
  onToggleFavorite,
}) {
  const navigate = useNavigate();

  const statusColors = {
    "報名成功": { bg: "#c8e6c9", color: "#1b5e20" },
    "等待候補": { bg: "#ffe0b2", color: "#bf360c" },
    "已取消":   { bg: "#ffcdd2", color: "#b71c1c" },
  };

  return (
    <Box
      onClick={() => navigate(`/events/${event.id}`)}
      sx={{
        width: "100%",
        maxWidth: 252,
        bgcolor: "white",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: tokens.shadow.card,
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        transition: "transform .15s",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      {/* Image */}
      <Box sx={{ position: "relative", height: 180 }}>
        <img
          src={event.image || "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800"}
          alt={event.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Heart top-left */}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          sx={{
            position: "absolute", top: 6, left: 6,
            bgcolor: "rgba(255,255,255,0.85)",
            "&:hover": { bgcolor: "white" },
            width: 30, height: 30,
          }}
        >
          {favorited
            ? <FavoriteIcon sx={{ color: tokens.color.heart, fontSize: 18 }} />
            : <FavoriteBorderIcon sx={{ color: tokens.color.heart, fontSize: 18 }} />}
        </IconButton>
        {/* Category chip top-right */}
        {event.category && (
          <Box
            sx={{
              position: "absolute", top: 8, right: 8,
              bgcolor: "rgba(0,0,0,0.6)", color: "white",
              fontSize: 11, px: 1, py: "2px",
              borderRadius: "4px",
            }}
          >
            {event.category}
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: tokens.color.text, lineHeight: 1.3 }}>
            {event.title}
          </Typography>
          {event.rating && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexShrink: 0 }}>
              <StarIcon sx={{ fontSize: 14, color: tokens.color.star }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{event.rating}</Typography>
            </Box>
          )}
        </Box>

        {event.sessionName && (
          <Typography sx={{ fontSize: 11, color: tokens.color.textSecondary, mt: 0.3 }}>
            {event.sessionName}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.7 }}>
          <CalendarTodayIcon sx={{ fontSize: 12, color: tokens.color.textSecondary }} />
          <Typography sx={{ fontSize: 11, color: tokens.color.textSecondary }}>{event.date}</Typography>
        </Box>
        {event.location && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            <PlaceIcon sx={{ fontSize: 12, color: tokens.color.textSecondary }} />
            <Typography sx={{ fontSize: 11, color: tokens.color.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.location}
            </Typography>
          </Box>
        )}
        {event.capacity && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            <PeopleIcon sx={{ fontSize: 12, color: tokens.color.textSecondary }} />
            <Typography sx={{ fontSize: 11, color: tokens.color.textSecondary }}>
              剩餘名額：{event.remainingSlots}/{event.capacity}
            </Typography>
          </Box>
        )}

        {/* Status pill */}
        {status && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                display: "inline-block",
                bgcolor: statusColors[status]?.bg || "#eee",
                color: statusColors[status]?.color || "#333",
                fontSize: 11,
                fontWeight: 600,
                px: 1,
                py: "2px",
                borderRadius: "4px",
              }}
            >
              {status}
            </Box>
          </Box>
        )}

        <Box sx={{ flex: 1 }} />

        {/* CTA buttons */}
        <Box sx={{ display: "flex", gap: 0.5, mt: 1.2 }}>
          {showActions && (status === "報名成功" || status === "等待候補") && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel?.(); }}
              style={{
                flex: "0 0 auto", padding: "7px 12px", border: "none",
                borderRadius: 4, backgroundColor: "#e0e0e0", color: "#333",
                fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}
            >
              取消
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
            style={{
              flex: 1, padding: "7px 0", border: "none", borderRadius: 4,
              backgroundColor: tokens.color.navy, color: "white",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            查看詳情
          </button>
        </Box>
      </Box>
    </Box>
  );
}
