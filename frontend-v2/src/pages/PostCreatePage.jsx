import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, Button, TextField, RadioGroup, Radio, FormControlLabel, IconButton, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { useTranslation } from "react-i18next";
import { postsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { tokens } from "../theme";

export default function PostCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { refreshUserData } = useData();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const event = eventId ? { id: Number(eventId) } : null;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");

  if (!ready) return null;
  if (!user) { navigate("/login"); return null; }

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await postsApi.create({
        event_id: event ? event.id : null,
        rating,
        content,
        images: [],
        visibility,
      });
      if (event) navigate(`/events/${event.id}`);
      else navigate("/profile");
    } catch (e) {
      alert(t("post.publishFailed") + ": " + (e?.response?.data?.detail || e.message));
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) return;
    try {
      await postsApi.create({
        event_id: event ? event.id : null,
        rating,
        content,
        images: [],
        visibility,
        is_draft: true,
      });
      await refreshUserData();
      navigate("/profile");
    } catch (e) {
      alert(t("post.saveDraftFailed") + ": " + (e?.response?.data?.detail || e.message));
    }
  };

  const cardSx = {
    borderRadius: "20px",
    p: 3,
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };
  const fieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg },
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: tokens.color.navy }}>
            {event ? t("post.writeReview") : t("post.writeArticle")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5, alignItems: "flex-start" }}>
          {/* Left: content */}
          <Paper sx={{ ...cardSx, flex: 1, width: "100%" }}>
            {event && (
              <Box sx={{ mb: 2, display: "flex", gap: 0.5 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton
                    key={star} size="small"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    {star <= (hoverRating || rating)
                      ? <StarIcon sx={{ color: tokens.color.star, fontSize: 32 }} />
                      : <StarBorderIcon sx={{ color: tokens.color.border, fontSize: 32 }} />}
                  </IconButton>
                ))}
              </Box>
            )}

            <TextField
              fullWidth multiline rows={8}
              placeholder={t("post.contentPlaceholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={fieldSx}
            />
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mt: 0.5 }}>
              {t("post.charCount", { n: content.length })}
            </Typography>

            <Box
              sx={{
                border: `2px dashed ${tokens.color.border}`,
                borderRadius: "12px",
                p: 3, textAlign: "center", cursor: "pointer", mt: 2,
                bgcolor: tokens.color.bg,
                "&:hover": { borderColor: tokens.color.navy },
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 32, color: tokens.color.placeholder }} />
              <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.textSecondary }}>
                {t("post.addImage")}
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, color: tokens.color.text }}>{t("post.visibility")}</Typography>
              {/* Group posts go through BoardPostCreateDialog (which has the
                  group picker). On this page we only offer public/private to
                  avoid posting visibility=group without a group_id, which the
                  backend (correctly) refuses. */}
              <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <FormControlLabel value="public" control={<Radio size="small" />} label={<Typography sx={{ fontSize: tokens.fontSize.body }}>{t("post.visPublic")}</Typography>} />
                <FormControlLabel value="private" control={<Radio size="small" />} label={<Typography sx={{ fontSize: tokens.fontSize.body }}>{t("post.visPrivate")}</Typography>} />
              </RadioGroup>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSaveDraft}
                sx={{
                  flex: 1, textTransform: "none",
                  borderRadius: "27px", height: 54, fontSize: tokens.fontSize.body,
                  borderColor: tokens.color.border, color: tokens.color.text,
                }}
              >
                {t("post.saveDraft")}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!content.trim()}
                sx={{
                  flex: 1,
                  bgcolor: tokens.color.black, color: "#fff",
                  textTransform: "none",
                  borderRadius: "27px", height: 54, fontSize: tokens.fontSize.body, fontWeight: 600,
                  "&:hover": { bgcolor: tokens.color.navyDark },
                }}
              >
                {t("post.publish")}
              </Button>
            </Box>
          </Paper>

          {/* Right: event info */}
          {event && (
            <Paper sx={{ ...cardSx, width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
              <Box
                component="img"
                src={event.image}
                sx={{ width: "100%", height: 140, borderRadius: "12px", objectFit: "cover", mb: 1.5 }}
              />
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text, mb: 1 }}>
                {event.title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.7 }}>
                <CalendarTodayIcon sx={{ fontSize: 14, color: tokens.color.textSecondary }} />
                <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary }}>
                  {event.date} {event.time}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 14, color: tokens.color.textSecondary }} />
                <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary }}>
                  {event.location}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
