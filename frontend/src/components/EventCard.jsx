import { useNavigate } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, Box, Chip, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PlaceIcon from "@mui/icons-material/Place";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";

export default function EventCard({ event, showActions = false, status, onRegister, onCancel }) {
  const navigate = useNavigate();

  const statusColors = {
    "報名成功": { bg: "#e8f5e9", color: "#2e7d32" },
    "等待候補": { bg: "#fff3e0", color: "#e65100" },
    "已取消": { bg: "#ffebee", color: "#c62828" },
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Bookmark heart */}
      <IconButton
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          bgcolor: "rgba(255,255,255,0.9)",
          zIndex: 1,
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
        size="small"
        onClick={(e) => e.stopPropagation()}
      >
        <FavoriteIcon sx={{ color: "#e53935", fontSize: 18 }} />
      </IconButton>

      {/* Status badge */}
      {status && (
        <Chip
          label={status}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 1,
            bgcolor: statusColors[status]?.bg || "#e0e0e0",
            color: statusColors[status]?.color || "#333",
            fontWeight: 600,
            fontSize: 12,
          }}
        />
      )}

      <CardMedia
        component="img"
        height="160"
        image={event.image || "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800"}
        alt={event.title}
        sx={{ objectFit: "cover" }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
          {event.title}
        </Typography>

        {event.sessionName && (
          <Typography variant="caption" color="text.secondary">
            {event.sessionName}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          <CalendarTodayIcon sx={{ fontSize: 14, color: "#666" }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            {event.date}
          </Typography>
        </Box>

        {event.location && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            <PlaceIcon sx={{ fontSize: 14, color: "#666" }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, noWrap: true }}>
              {event.location}
            </Typography>
          </Box>
        )}

        {event.capacity && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            <PeopleIcon sx={{ fontSize: 14, color: "#666" }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
              剩餘 {event.remainingSlots}/{event.capacity}
            </Typography>
          </Box>
        )}

        {event.rating && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.5 }}>
            <StarIcon sx={{ fontSize: 16, color: "#ffc107" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
              {event.rating}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action buttons for profile page */}
      {showActions && (
        <Box sx={{ display: "flex", gap: 1, p: 1.5, pt: 0 }}>
          {status === "報名成功" && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel?.(); }}
              style={{
                flex: 1, padding: "6px 0", border: "none", borderRadius: 6,
                backgroundColor: "#ffcdd2", color: "#c62828", fontWeight: 600,
                cursor: "pointer", fontSize: 13,
              }}
            >
              取消
            </button>
          )}
          {status === "等待候補" && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel?.(); }}
              style={{
                flex: 1, padding: "6px 0", border: "none", borderRadius: 6,
                backgroundColor: "#fff3e0", color: "#e65100", fontWeight: 600,
                cursor: "pointer", fontSize: 13,
              }}
            >
              取消
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
            style={{
              flex: 1, padding: "6px 0", border: "none", borderRadius: 6,
              backgroundColor: "#e8eaf6", color: "#1a237e", fontWeight: 600,
              cursor: "pointer", fontSize: 13,
            }}
          >
            查看詳情
          </button>
        </Box>
      )}
    </Card>
  );
}
