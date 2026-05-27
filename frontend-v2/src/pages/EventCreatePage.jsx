import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, TextField, Button, IconButton, Chip, Paper, Divider, CircularProgress,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { eventsApi, uploadsApi, resolveUrl } from "../api";
import { tokens } from "../theme";

const emptySession = () => ({
  id: null,
  session_name: "", session_content: "",
  date: "", time_range: "",
  location: "", instructor: "",
  capacity: 0,
  registration_start: "", registration_end: "",
  meal: "",
});

export default function EventCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user, ready } = useAuth();

  // ── 基本資訊 ──
  const [title, setTitle] = useState("");
  const [officialCategory, setOfficialCategory] = useState("");
  const [category, setCategory] = useState("");
  const [organizer, setOrganizer] = useState("");
  // ── 聯絡資訊 ──
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // ── 報名設定 ──
  const [registrationType, setRegistrationType] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [learningCategory, setLearningCategory] = useState("");
  // ── 說明 ──
  const [content, setContent] = useState("");
  // ── 圖片 ──
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  // ── 標籤 / 場次 ──
  const [tags, setTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [sessions, setSessions] = useState([emptySession()]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    eventsApi.tags().then((rows) => setTagOptions(rows.map((r) => r.name))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let live = true;
    eventsApi.get(Number(id)).then((e) => {
      if (!live || !e) return;
      setTitle(e.title || "");
      setOfficialCategory(e.officialCategory || "");
      setCategory(e.category || "");
      setOrganizer(e.organizer || "");
      setContactPhone(e.contactPhone || "");
      setContactEmail(e.contactEmail || "");
      setRegistrationType(e.registrationType || "");
      setRegistrationFee(e.registrationFee || "");
      setTargetAudience(e.targetAudience || "");
      setLearningCategory(e.learningCategory || "");
      setContent(e.content || "");
      setImageUrl(e.image || "");
      setTags(e.tags || []);
      setSessions(
        (e.sessions || []).length
          ? e.sessions.map((s) => ({
              id: s.id,
              session_name: s.session_name || "",
              session_content: s.session_content || "",
              date: s.date || "",
              time_range: s.time_range || "",
              location: s.location || "",
              instructor: s.instructor || "",
              capacity: s.capacity ?? 0,
              registration_start: s.registration_start || "",
              registration_end: s.registration_end || "",
              meal: s.meal || "",
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
    e.target.value = "";
    setUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      if (res?.url) setImageUrl(res.url);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ? `圖片上傳失敗：${detail}` : "圖片上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) { setError(t("admin.titleRequired")); return; }
    setSubmitting(true);
    const cleanSessions = sessions
      .filter((s) => s.session_name.trim() || s.date.trim() || s.location.trim() || s.capacity)
      .map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        session_name: s.session_name.trim() || null,
        session_content: s.session_content.trim() || null,
        date: s.date.trim() || null,
        time_range: s.time_range.trim() || null,
        location: s.location.trim() || null,
        instructor: s.instructor.trim() || null,
        capacity: Number(s.capacity) || 0,
        registration_start: s.registration_start.trim() || null,
        registration_end: s.registration_end.trim() || null,
        meal: s.meal.trim() || null,
      }));
    const payload = {
      title: title.trim(),
      content: content.trim() || null,
      official_category: officialCategory.trim() || null,
      category: category.trim() || null,
      organizer: organizer.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_email: contactEmail.trim() || null,
      registration_type: registrationType.trim() || null,
      registration_fee: registrationFee.trim() || null,
      target_audience: targetAudience.trim() || null,
      learning_category: learningCategory.trim() || null,
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

  const labelSx = { fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text, mb: 0.5, mt: 0 };
  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#fff" } };
  const grid2 = { display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 };

  const SectionHeader = ({ children }) => (
    <>
      <Divider sx={{ my: 3 }} />
      <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.navy, mb: 2 }}>
        {children}
      </Typography>
    </>
  );

  const Field = ({ label, required, children }) => (
    <Box>
      <Typography sx={labelSx}>
        {label}{required && <Box component="span" sx={{ color: tokens.color.heart, ml: 0.3 }}>*</Box>}
      </Typography>
      {children}
    </Box>
  );

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 3 } }}>
        <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: tokens.color.navy, mb: 3 }}>
          {isEdit ? t("admin.editEvent") : t("admin.createEvent")}
        </Typography>

        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: "16px", boxShadow: tokens.shadow.pill }}>

          {/* ── 基本資訊 ── */}
          <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 700, color: tokens.color.navy }}>
            基本資訊
          </Typography>

          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Field label={t("admin.eventTitle")} required>
              <TextField fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} sx={fieldSx} />
            </Field>

            <Box sx={grid2}>
              <Field label="母活動名稱（官方分類）">
                <TextField fullWidth size="small" placeholder="例：2026年研究倫理課程" value={officialCategory} onChange={(e) => setOfficialCategory(e.target.value)} sx={fieldSx} />
              </Field>
              <Field label={t("admin.category")}>
                <TextField fullWidth size="small" placeholder="例：講座、工作坊" value={category} onChange={(e) => setCategory(e.target.value)} sx={fieldSx} />
              </Field>
            </Box>

            <Field label={t("admin.organizer")}>
              <TextField fullWidth size="small" value={organizer} onChange={(e) => setOrganizer(e.target.value)} sx={fieldSx} />
            </Field>
          </Box>

          {/* ── 聯絡資訊 ── */}
          <SectionHeader>聯絡資訊</SectionHeader>
          <Box sx={grid2}>
            <Field label="聯絡電話">
              <TextField fullWidth size="small" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} sx={fieldSx} />
            </Field>
            <Field label="聯絡信箱">
              <TextField fullWidth size="small" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} sx={fieldSx} />
            </Field>
          </Box>

          {/* ── 報名設定 ── */}
          <SectionHeader>報名設定</SectionHeader>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={grid2}>
              <Field label="報名方式">
                <TextField fullWidth size="small" placeholder="例：線上報名、現場報名" value={registrationType} onChange={(e) => setRegistrationType(e.target.value)} sx={fieldSx} />
              </Field>
              <Field label="費用">
                <TextField fullWidth size="small" placeholder="例：免費、NT$500" value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} sx={fieldSx} />
              </Field>
            </Box>
            <Box sx={grid2}>
              <Field label="適合對象">
                <TextField fullWidth size="small" placeholder="例：全校師生" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} sx={fieldSx} />
              </Field>
              <Field label="學習分類">
                <TextField fullWidth size="small" placeholder="例：人文藝術、科技創新" value={learningCategory} onChange={(e) => setLearningCategory(e.target.value)} sx={fieldSx} />
              </Field>
            </Box>
          </Box>

          {/* ── 活動說明 ── */}
          <SectionHeader>活動說明</SectionHeader>
          <TextField
            fullWidth multiline minRows={5}
            placeholder="詳細說明活動內容、目標、注意事項等..."
            value={content} onChange={(e) => setContent(e.target.value)}
            sx={fieldSx}
          />

          {/* ── 封面圖片 ── */}
          <SectionHeader>封面圖片</SectionHeader>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small" sx={{ ...fieldSx, flex: 1, minWidth: 220 }}
              placeholder="貼上圖片網址，或點右側上傳"
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button
              component="label"
              variant="outlined"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <AddPhotoAlternateIcon />}
              sx={{ textTransform: "none", borderRadius: "10px", whiteSpace: "nowrap" }}
            >
              {uploading ? "上傳中..." : t("admin.uploadImage")}
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={handleImageUpload} />
            </Button>
          </Box>
          {imageUrl && (
            <Box
              component="img"
              src={resolveUrl(imageUrl)}
              alt="封面預覽"
              sx={{ mt: 1.5, width: "100%", maxWidth: 360, height: 180, objectFit: "cover", borderRadius: "10px", display: "block" }}
            />
          )}

          {/* ── 標籤 ── */}
          <SectionHeader>標籤</SectionHeader>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {tagOptions.map((tag) => (
              <Chip
                key={tag} label={tag}
                onClick={() => toggleTag(tag)}
                color={tags.includes(tag) ? "primary" : "default"}
                variant={tags.includes(tag) ? "filled" : "outlined"}
                size="small" sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>

          {/* ── 場次 ── */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 3, mb: 1 }}>
            <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 700, color: tokens.color.navy }}>
              {t("admin.sessions")}
            </Typography>
            <Button onClick={addSession} startIcon={<AddCircleIcon />} sx={{ textTransform: "none" }}>
              {t("admin.addSession")}
            </Button>
          </Box>

          {sessions.map((s, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2.5, mt: 1.5, borderRadius: "12px" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, color: tokens.color.text }}>
                  場次 {idx + 1}
                </Typography>
                {sessions.length > 1 && (
                  <IconButton size="small" onClick={() => removeSession(idx)} sx={{ color: tokens.color.heart }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={grid2}>
                  <TextField size="small" label="場次名稱" value={s.session_name} onChange={(e) => updateSession(idx, "session_name", e.target.value)} sx={fieldSx} />
                  <TextField size="small" label="講師" value={s.instructor} onChange={(e) => updateSession(idx, "instructor", e.target.value)} sx={fieldSx} />
                </Box>
                <Box sx={grid2}>
                  <TextField size="small" label={t("admin.date")} placeholder="YYYY-MM-DD" value={s.date} onChange={(e) => updateSession(idx, "date", e.target.value)} sx={fieldSx} />
                  <TextField size="small" label={t("admin.timeRange")} placeholder="09:00-12:00" value={s.time_range} onChange={(e) => updateSession(idx, "time_range", e.target.value)} sx={fieldSx} />
                </Box>
                <TextField size="small" label={t("admin.location")} value={s.location} onChange={(e) => updateSession(idx, "location", e.target.value)} sx={fieldSx} />
                <Box sx={grid2}>
                  <TextField size="small" label="報名開始日期" placeholder="YYYY-MM-DD" value={s.registration_start} onChange={(e) => updateSession(idx, "registration_start", e.target.value)} sx={fieldSx} />
                  <TextField size="small" label="報名截止日期" placeholder="YYYY-MM-DD" value={s.registration_end} onChange={(e) => updateSession(idx, "registration_end", e.target.value)} sx={fieldSx} />
                </Box>
                <Box sx={grid2}>
                  <TextField size="small" type="number" label={t("admin.capacity")} value={s.capacity} onChange={(e) => updateSession(idx, "capacity", e.target.value)} sx={fieldSx} />
                  <TextField size="small" label="餐點" placeholder="例：提供午餐、不提供" value={s.meal} onChange={(e) => updateSession(idx, "meal", e.target.value)} sx={fieldSx} />
                </Box>
                <TextField
                  size="small" multiline minRows={2}
                  label="場次說明"
                  value={s.session_content} onChange={(e) => updateSession(idx, "session_content", e.target.value)}
                  sx={fieldSx}
                />
              </Box>
            </Paper>
          ))}

          {error && (
            <Typography sx={{ color: tokens.color.heart, fontSize: tokens.fontSize.caption, mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(isEdit ? `/events/${id}` : "/")}
              sx={{ textTransform: "none", borderRadius: "10px", px: 3, height: 46, fontSize: tokens.fontSize.body }}
            >
              {t("common.cancel")}
            </Button>
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
              {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : (isEdit ? t("admin.saveChanges") : t("admin.publish"))}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
