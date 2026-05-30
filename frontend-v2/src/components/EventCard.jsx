import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { translateTag } from "../i18n/tagLabels";
import { Box, Typography, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PlaceIcon from "@mui/icons-material/Place";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import { formatDate } from "../utils/format";

export default function EventCard({
  event,
  showActions = false,
  status,
  onCancel,
  favorited = false,
  onToggleFavorite,
  showBookmark = true,
  sx = {},
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Status is passed in as a canonical English key (success/waitlist/cancelled)
  // by callers; legacy ZH literals are still accepted as keys for safety.
  const statusColors = {
    success:    { bg: "#c8e6c9", color: "#1b5e20" },
    waitlist:   { bg: "#ffe0b2", color: "#bf360c" },
    cancelled:  { bg: "#ffcdd2", color: "#b71c1c" },
    "報名成功": { bg: "#c8e6c9", color: "#1b5e20" },
    "等待候補": { bg: "#ffe0b2", color: "#bf360c" },
    "已取消":   { bg: "#ffcdd2", color: "#b71c1c" },
  };
  const statusLabel = (s) => {
    if (!s) return s;
    const KEY_BY_ZH = { "報名成功": "success", "等待候補": "waitlist", "已取消": "cancelled" };
    const key = KEY_BY_ZH[s] || s;
    const i18nKey = `event.status.${key}`;
    const translated = t(i18nKey);
    return translated === i18nKey ? s : translated;
  };

  const tagsToShow = (event.tags || []).slice(0, 3);
  const isEnded = event.date && new Date(event.date + "T23:59:59") < new Date();

  return (
    <Box
      onClick={() => navigate(`/events/${event.id}${event._matchedSessionId ? `?session=${event._matchedSessionId}` : ""}`)}
      sx={{
        width: "100%",
        maxWidth: "100%",
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
        ...sx,
      }}
    >
      {/* Image */}
      <Box sx={{
        position: "relative", height: 150, flexShrink: 0,
        bgcolor: "#DDE3EE",
        background: "linear-gradient(135deg, #DDE3EE 0%, #C8D0E0 100%)",
      }}>
        <img
          src={event.image || "/default-event.svg"}
          alt={event.title}
          onError={(e) => { e.currentTarget.src = "/default-event.svg"; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Heart top-left */}
        {user && showBookmark && (
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
        )}
        {/* Ended overlay */}
        {isEnded && (
          <Box sx={{
            position: "absolute", inset: 0,
            bgcolor: "rgba(0,0,0,0.38)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1,
          }}>
            <Box sx={{
              bgcolor: "rgba(0,0,0,0.72)", color: "#fff",
              fontSize: tokens.fontSize.caption, fontWeight: 700,
              px: 1.5, py: 0.4, borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.35)",
              letterSpacing: "0.5px",
            }}>
              {t("event.endedBadge")}
            </Box>
          </Box>
        )}
        {/* Top-right: meal badge + category */}
        <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 0.5, zIndex: 2 }}>
          {event.mealProvided && (
            <Box
              sx={{
                bgcolor: "#FFB02E", color: "#5A3A00",
                fontSize: tokens.fontSize.caption, fontWeight: 700, px: 0.85, py: "2px",
                borderRadius: "4px", display: "flex", alignItems: "center", gap: 0.3,
                boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
              }}
              title={t("event.mealProvided")}
            >
              <RestaurantIcon sx={{ fontSize: 12 }} />
              {t("event.mealProvided")}
            </Box>
          )}
          {event.category && (
            <Box
              sx={{
                bgcolor: "rgba(0,0,0,0.65)", color: "white",
                fontSize: tokens.fontSize.caption, px: 1, py: "2px", borderRadius: "4px",
              }}
            >
              {translateTag(event.category, i18n.language)}
            </Box>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.body, color: tokens.color.text, lineHeight: 1.3 }}>
            {event.title}
          </Typography>
          {event.rating > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexShrink: 0 }}>
              <StarIcon sx={{ fontSize: 14, color: tokens.color.star }} />
              <Typography sx={{ fontSize: tokens.fontSize.caption, fontWeight: 600 }}>{event.rating}</Typography>
            </Box>
          )}
        </Box>

        {event.sessionName && (
          <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary, mt: 0.3 }}>
            {event.sessionName}
          </Typography>
        )}

        {tagsToShow.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4, mt: 0.5 }}>
            {tagsToShow.map((tag) => (
              <Box
                key={tag}
                sx={{
                  bgcolor: "#EEF2FB", color: tokens.color.navy,
                  fontSize: tokens.fontSize.caption, fontWeight: 600,
                  px: 0.7, py: "1px", borderRadius: "3px",
                }}
              >
                #{translateTag(tag, i18n.language)}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.7 }}>
          <CalendarTodayIcon sx={{ fontSize: 12, color: tokens.color.textSecondary }} />
          <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary }}>
            {formatDate(event.date)}
          </Typography>
        </Box>
        {event.location && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            <PlaceIcon sx={{ fontSize: 12, color: tokens.color.textSecondary }} />
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.location}
            </Typography>
          </Box>
        )}
        {event.capacity && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
            <PeopleIcon sx={{ fontSize: 12, color: tokens.color.textSecondary }} />
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary }}>
              {t("event.capacityShort", { remaining: event.remainingSlots, total: event.capacity })}
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
                fontSize: tokens.fontSize.caption,
                fontWeight: 600,
                px: 1,
                py: "2px",
                borderRadius: "4px",
              }}
            >
              {statusLabel(status)}
            </Box>
          </Box>
        )}

        <Box sx={{ flex: 1 }} />

        {/* CTA buttons */}
        <Box sx={{ display: "flex", gap: 0.5, mt: 1.2 }}>
          {showActions && onCancel && (status === "報名成功" || status === "等待候補" || status === "success" || status === "waitlist") && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              style={{
                flex: "0 0 auto", padding: "7px 12px", border: "none",
                borderRadius: 4, backgroundColor: "#e0e0e0", color: "#333",
                fontWeight: 600, fontSize: tokens.fontSize.caption, cursor: "pointer",
              }}
            >
              {t("common.cancel")}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}${event._matchedSessionId ? `?session=${event._matchedSessionId}` : ""}`); }}
            style={{
              flex: 1, padding: "7px 0", border: "none", borderRadius: 4,
              backgroundColor: tokens.color.navy, color: "white",
              fontWeight: 600, fontSize: tokens.fontSize.caption, cursor: "pointer",
            }}
          >
            {t("event.viewDetails")}
          </button>
        </Box>
      </Box>
    </Box>
  );
}
