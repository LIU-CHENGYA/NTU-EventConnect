import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, TextField, RadioGroup, Radio, FormControlLabel, IconButton, CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { useTranslation } from "react-i18next";
import { postsApi, eventsApi, uploadsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function PostEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [post, setPost] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    let live = true;
    postsApi.get(Number(id)).then(async (p) => {
      if (!live) return;
      setPost(p);
      setRating(p.rating || 0);
      setContent(p.content || "");
      setVisibility(p.visibility || "public");
      setImages(p.images || []);
      if (p.eventId) {
        const e = await eventsApi.get(p.eventId).catch(() => null);
        if (live) setEvent(e);
      }
      setLoading(false);
    }).catch(() => { if (live) { setPost(null); setLoading(false); } });
    return () => { live = false; };
  }, [id, user, ready, navigate]);

  if (!ready) return null;
  if (!user) return null;
  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>{t("common.loading")}</Typography></Box>;
  if (!post) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography>{t("post.notFound")}</Typography>
      </Box>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      if (res?.url) setImages((prev) => [...prev, res.url]);
    } catch {
      alert(t("post.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Preserve original group_id when keeping a post as a group post.
      // Saving from the editor publishes the post (clears any draft state).
      const payload = { rating, content, visibility, images, is_draft: false };
      if (visibility === "group" && post.groupId) {
        payload.group_id = post.groupId;
      }
      await postsApi.update(post.id, payload);
      navigate(`/posts/${post.id}`);
    } catch (e) {
      alert(t("post.updateFailed") + ": " + (e?.response?.data?.detail || e.message));
    }
  };

  // Only let the user pick "僅限群組" if the post was originally a group
  // post (so we can preserve its group_id). Switching public/private → group
  // would need a group picker, which only BoardPostCreateDialog has today.
  const groupOptionEnabled = !!post.groupId;

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
            {t("post.editTitle")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5, alignItems: "flex-start" }}>
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={fieldSx}
            />
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mt: 0.5 }}>
              {t("post.charCount", { n: content.length })}
            </Typography>

            {images.length > 0 && (
              <Box sx={{ display: "flex", gap: 1.2, mt: 2, flexWrap: "wrap" }}>
                {images.map((img, idx) => (
                  <Box key={idx} sx={{ position: "relative" }}>
                    <Box
                      component="img"
                      src={img}
                      sx={{ width: 110, height: 110, borderRadius: "12px", objectFit: "cover", display: "block" }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      sx={{
                        position: "absolute", top: -8, right: -8,
                        bgcolor: "rgba(0,0,0,0.6)", color: "#fff",
                        width: 22, height: 22,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Box
              component="label"
              sx={{
                border: `2px dashed ${tokens.color.border}`,
                borderRadius: "12px",
                p: 2.5, textAlign: "center", cursor: uploading ? "default" : "pointer", mt: 2,
                bgcolor: tokens.color.bg, display: "block",
                "&:hover": { borderColor: uploading ? tokens.color.border : tokens.color.navy },
              }}
            >
              {uploading
                ? <CircularProgress size={28} />
                : <AddPhotoAlternateIcon sx={{ fontSize: 28, color: tokens.color.placeholder }} />}
              <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.textSecondary, mt: 0.5 }}>
                {uploading ? t("common.uploading", "上傳中...") : t("post.addImage")}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                hidden
                disabled={uploading}
                onChange={handleImageUpload}
              />
            </Box>

            <Box sx={{ mt: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, color: tokens.color.text }}>{t("post.visibility")}</Typography>
              <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <FormControlLabel value="public" control={<Radio size="small" />} label={<Typography sx={{ fontSize: tokens.fontSize.body }}>{t("post.visPublic")}</Typography>} />
                <FormControlLabel value="private" control={<Radio size="small" />} label={<Typography sx={{ fontSize: tokens.fontSize.body }}>{t("post.visPrivate")}</Typography>} />
                <FormControlLabel
                  value="group"
                  control={<Radio size="small" />}
                  disabled={!groupOptionEnabled}
                  label={
                    <Typography sx={{ fontSize: tokens.fontSize.body, color: groupOptionEnabled ? undefined : tokens.color.placeholder }}>
                      {t("post.visGroupRestricted", { suffix: groupOptionEnabled ? "" : t("post.visGroupSuffix") })}
                    </Typography>
                  }
                />
              </RadioGroup>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/posts/${post.id}`)}
                sx={{
                  flex: 1, textTransform: "none",
                  borderRadius: "27px", height: 54, fontSize: tokens.fontSize.body,
                  borderColor: tokens.color.border, color: tokens.color.text,
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  flex: 1,
                  bgcolor: tokens.color.black, color: "#fff",
                  textTransform: "none",
                  borderRadius: "27px", height: 54, fontSize: tokens.fontSize.body, fontWeight: 600,
                  "&:hover": { bgcolor: tokens.color.navyDark },
                }}
              >
                {t("common.save")}
              </Button>
            </Box>
          </Paper>

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
