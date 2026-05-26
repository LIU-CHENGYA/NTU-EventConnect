import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, TextField, Button, IconButton, Chip, Paper,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { eventsApi, uploadsApi } from "../api";
import { tokens } from "../theme";

const emptySession = () => ({
  id: null, session_name: "", date: "", time_range: "", location: "", capacity: 0,
});

export default function EventCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();           // present => edit mode
  const isEdit = Boolean(id);
  const { user, ready } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [sessions, setSessions] = useState([emptySession()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Tag suggestions for the chip picker.
  useEffect(() => {
    eventsApi.tags().then((rows) => setTagOptions(rows.map((r) => r.name))).catch(() => {});
  }, []);

  // Edit mode: hydrate the form from the existing event.
  useEffect(() => {
    if (!isEdit) return;
    let live = true;
    eventsApi.get(Number(id)).then((e) => {
      if (!live || !e) return;
      setTitle(e.title || "");
      setContent(e.content || "");
      setCategory(e.category || "");
      setOrganizer(e.organizer || "");
      setImageUrl(e.image || "");
      setTags(e.tags || []);
      setSessions(
        (e.sessions || []).length
          ? e.sessions.map((s) => ({
              id: s.id,
              session_name: s.session_name || "",
              date: s.date || "",
              time_range: s.time_range || "",
              location: s.location || "",
              capacity: s.capacity ?? 0,
            }))
          : [emptySession()]
      );
      setLoading(false);
    }).catch(() => { if (live) { setError(t("admin.loadFailed")); setLoading(false); } });
    return () => { live = false; };
  }, [id, isEdit, t]);

  if (!ready) return null;
  if (!user) { navigate("/login"); return null; }
  if (!user.isAdmin) {
    return (
      <Box sx={{ p: 6, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography sx={{ fontSize: tokens.fontSize.subtitle, color: tokens.color.textSecondary }}>{t("admin.adminOnly")}</Typography>
      </Box>
    );
  }
  if (loading) return <Box sx={{ p: 6, textAlign: "center" }}>{t("common.loading")}</Box>;

  const toggleTag = (tag) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]);

  const updateSession = (idx, key, value) =>
    setSessions((prev) => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));

  const addSession = () => setSessions((prev) => [...prev, emptySession()]);
  const removeSession = (idx) => setSessions((prev) => prev.filter((_, i) => i !== idx));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadsApi.upload(file);
      if (res?.url) setImageUrl(res.url);
    } catch { /* ignore upload error; admin can paste a URL */ }
  };

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) { setError(t("admin.titleRequired")); return; }
    setSubmitting(true);
    // Backend ignores empty session rows poorly, so drop fully-empty ones.
    const cleanSessions = sessions
      .filter((s) => s.session_name.trim() || s.date.trim() || s.location.trim() || s.capacity)
      .map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        session_name: s.session_name.trim() || null,
        date: s.date.trim() || null,
        time_range: s.time_range.trim() || null,
        location: s.location.trim() || null,
        capacity: Number(s.capacity) || 0,
      }));
    const payload = {
      title: title.trim(),
      content: content.trim() || null,
      category: category.trim() || null,
      organizer: organizer.trim() || null,
      image_url: imageUrl || null,
      tags,
      sessions: cleanSessions,
    };
    try {
      if (isEdit) {
        await eventsApi.update(Number(id), payload);
        navigate(`/events/${id}`);
      } else {
        const created = await eventsApi.create(payload);
        navigate(created?.id ? `/events/${created.id}` : "/");
      }
    } catch (e) {
      setError((isEdit ? t("admin.updateFailed") : t("admin.createFailed")) +
        ": " + (e?.response?.data?.detail || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const labelSx = { fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text, mb: 0.5, mt: 2 };
  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#fff" } };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 2, md: 3 } }}>
        <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: tokens.color.navy, mb: 3 }}>
          {isEdit ? t("admin.editEvent") : t("admin.createEvent")}
        </Typography>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: "16px", boxShadow: tokens.shadow.pill }}>
          <Typography sx={labelSx}>{t("admin.eventTitle")} <Box component="span" sx={{ color: tokens.color.heart }}>*</Box></Typography>
          <TextField fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} sx={fieldSx} />

          <Typography sx={labelSx}>{t("admin.eventContent")}</Typography>
          <TextField fullWidth size="small" multiline minRows={4} value={content} onChange={(e) => setContent(e.target.value)} sx={fieldSx} />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography sx={labelSx}>{t("admin.category")}</Typography>
              <TextField fullWidth size="small" value={category} onChange={(e) => setCategory(e.target.value)} sx={fieldSx} />
            </Box>
            <Box>
              <Typography sx={labelSx}>{t("admin.organizer")}</Typography>
              <TextField fullWidth size="small" value={organizer} onChange={(e) => setOrganizer(e.target.value)} sx={fieldSx} />
            </Box>
          </Box>

          <Typography sx={labelSx}>{t("admin.image")}</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small" sx={{ ...fieldSx, flex: 1, minWidth: 220 }}
              placeholder={t("admin.imageUrlPlaceholder")}
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button component="label" variant="outlined" sx={{ textTransform: "none", borderRadius: "10px" }}>
              {t("admin.uploadImage")}
              <input type="file" accept="image/png,image/jpeg" hidden onChange={handleImageUpload} />
            </Button>
          </Box>
          {imageUrl && (
            <Box component="img" src={imageUrl} alt="" sx={{ mt: 1.5, width: 220, height: 120, objectFit: "cover", borderRadius: "10px" }} />
          )}

          <Typography sx={labelSx}>{t("admin.tags")}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {tagOptions.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => toggleTag(tag)}
                color={tags.includes(tag) ? "primary" : "default"}
                variant={tags.includes(tag) ? "filled" : "outlined"}
                size="small"
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>

          {/* Sessions */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 3 }}>
            <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text }}>{t("admin.sessions")}</Typography>
            <Button onClick={addSession} startIcon={<AddCircleIcon />} sx={{ textTransform: "none" }}>
              {t("admin.addSession")}
            </Button>
          </Box>
          {sessions.map((s, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mt: 1.5, borderRadius: "12px" }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                {sessions.length > 1 && (
                  <IconButton size="small" onClick={() => removeSession(idx)} sx={{ color: tokens.color.heart }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                <TextField size="small" label={t("admin.sessionName")} value={s.session_name} onChange={(e) => updateSession(idx, "session_name", e.target.value)} sx={fieldSx} />
                <TextField size="small" label={t("admin.date")} value={s.date} onChange={(e) => updateSession(idx, "date", e.target.value)} sx={fieldSx} />
                <TextField size="small" label={t("admin.timeRange")} value={s.time_range} onChange={(e) => updateSession(idx, "time_range", e.target.value)} sx={fieldSx} />
                <TextField size="small" label={t("admin.location")} value={s.location} onChange={(e) => updateSession(idx, "location", e.target.value)} sx={fieldSx} />
                <TextField size="small" type="number" label={t("admin.capacity")} value={s.capacity} onChange={(e) => updateSession(idx, "capacity", e.target.value)} sx={fieldSx} />
              </Box>
            </Paper>
          ))}

          {error && <Typography sx={{ color: tokens.color.heart, fontSize: tokens.fontSize.caption, mt: 2 }}>{error}</Typography>}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                bgcolor: tokens.color.navy, color: "#fff", textTransform: "none",
                borderRadius: "10px", px: 4, height: 46, fontSize: tokens.fontSize.body, fontWeight: 700,
                "&:hover": { bgcolor: tokens.color.navyDark },
              }}
            >
              {isEdit ? t("admin.saveChanges") : t("admin.publish")}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
