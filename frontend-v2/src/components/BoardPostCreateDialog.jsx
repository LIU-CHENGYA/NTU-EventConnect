import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, Box, Typography, IconButton, Button, TextField,
  Avatar, Popover, RadioGroup, FormControlLabel, Radio, InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import EventIcon from "@mui/icons-material/Event";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CreateIcon from "@mui/icons-material/Create";
import { usersApi, postsApi, groupsApi, uploadsApi } from "../api";
import { tokens } from "../theme";
import { formatDate } from "../utils/format";

const RED = "#FF4D4F";
const NAVY = tokens.color.navy;

function endedAttendedEvents(regs) {
  // Best-effort: a registration is "ended attended" when status=success AND date is past today.
  // Server enforces strict check on submit; this is just to filter the picker UI.
  const today = new Date();
  return regs.filter((r) => {
    if (r.status !== "success") return false;
    if (!r.date) return false;
    const d = new Date(r.date);
    return !Number.isNaN(d.getTime()) && d.getTime() < today.getTime();
  });
}

export default function BoardPostCreateDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState([]);
  const [groups, setGroups] = useState([]);

  const [event, setEvent] = useState(null); // {event_id, event_title, category, date}
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(4);
  const [visibility, setVisibility] = useState("public"); // public|private|group
  const [groupId, setGroupId] = useState(null);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [eventAnchor, setEventAnchor] = useState(null);
  const [groupAnchor, setGroupAnchor] = useState(null);
  const [eventSearch, setEventSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSubmitting(false);
    usersApi.myRegistrations().then((rows) => setRegistrations(endedAttendedEvents(rows))).catch(() => setRegistrations([]));
    groupsApi.listMine().then(setGroups).catch(() => setGroups([]));
  }, [open]);

  // Group registrations by category for the picker
  const eventsByCategory = useMemo(() => {
    const filtered = registrations.filter((r) => {
      const q = eventSearch.trim().toLowerCase();
      if (!q) return true;
      return (r.event_title || "").toLowerCase().includes(q);
    });
    const map = {};
    for (const r of filtered) {
      const cat = r.category || "其他";
      (map[cat] = map[cat] || []).push(r);
    }
    return map;
  }, [registrations, eventSearch]);

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const onPickEvent = (reg) => {
    setEvent({
      event_id: reg.event_id,
      event_title: reg.event_title,
      session_name: reg.session_name,
      date: reg.date,
      category: reg.category || "活動",
      image: reg.event_image,
    });
    setEventAnchor(null);
  };

  const onPickGroup = (g) => {
    setGroupId(g.id);
    setGroupAnchor(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadsApi.upload(file);
      if (res?.url) setImages([...images, res.url]);
    } catch {
      setError("圖片上傳失敗");
    }
  };

  const validate = () => {
    if (!event) return "請選擇活動";
    if (!title.trim()) return "請輸入標題";
    if (!content.trim()) return "請輸入文字敘述";
    if (visibility === "group" && !groupId) return "請選擇群組";
    return null;
  };

  const handleSubmit = async (asDraft = false) => {
    setError("");
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    try {
      await postsApi.create({
        event_id: event.event_id,
        title: title.trim(),
        rating,
        content: content.trim(),
        images,
        visibility: asDraft ? "private" : visibility,
        group_id: visibility === "group" ? groupId : null,
        is_board_post: true,
      });
      onCreated?.();
      onClose?.();
      // reset
      setEvent(null);
      setTitle(""); setContent(""); setImages([]);
      setRating(4); setVisibility("public"); setGroupId(null);
    } catch (e) {
      setError(e?.response?.data?.detail || "發佈失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroupName = groups.find((g) => g.id === groupId)?.name || "";

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
    >
      <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", borderBottom: `1px solid ${tokens.color.border}` }}>
        <CreateIcon sx={{ color: NAVY, mr: 1 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 17, flex: 1 }}>
          {t("board.modal.title")}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={submitting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Event picker */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
          {t("board.modal.selectEvent")} <Box component="span" sx={{ color: RED }}>*</Box>
        </Typography>
        <Box
          onClick={(e) => setEventAnchor(e.currentTarget)}
          sx={{
            display: "flex", alignItems: "center", gap: 1.25,
            px: 1.5, py: 1.25,
            border: `1px solid ${event ? "#C5D0E8" : tokens.color.border}`,
            bgcolor: event ? "#EEF2FB" : tokens.color.bg,
            borderRadius: "10px", cursor: "pointer",
            "&:hover": { borderColor: NAVY },
          }}
        >
          {event ? (
            <>
              <Avatar variant="rounded" sx={{ bgcolor: "#FCE7C8", color: "#9A6700", width: 32, height: 32 }}>🎨</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }} noWrap>
                  {event.event_title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }} noWrap>
                  {[event.category, t("board.modal.ended"), formatDate(event.date)].filter(Boolean).join(" • ")}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>
                {t("board.modal.change")}
              </Typography>
            </>
          ) : (
            <>
              <EventIcon sx={{ color: tokens.color.placeholder }} />
              <Typography sx={{ flex: 1, fontSize: 14, color: tokens.color.placeholder }}>
                {t("board.modal.selectEvent")}
              </Typography>
            </>
          )}
        </Box>
        <Typography sx={{ fontSize: 12, color: RED, mt: 0.5, mb: 2.5 }}>
          🚫 {t("board.modal.endedHint")}
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 240px" }, gap: 2.5 }}>
          {/* Left: rating + title + content */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>{t("board.modal.rating")}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <IconButton key={n} size="small" onClick={() => setRating(n)} sx={{ p: 0.25 }}>
                  {n <= rating
                    ? <StarIcon sx={{ color: "#F5A623", fontSize: 26 }} />
                    : <StarBorderIcon sx={{ color: "#D9DEE7", fontSize: 26 }} />}
                </IconButton>
              ))}
              <Typography sx={{ fontSize: 13, color: tokens.color.textSecondary, ml: 1 }}>
                {rating} / 5
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
              {t("board.modal.titleField")} <Box component="span" sx={{ color: RED }}>*</Box>
            </Typography>
            <TextField
              fullWidth size="small"
              placeholder="例如：第一次參加藝術節，整個被震撼到！"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
            />

            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
              {t("board.modal.content")} <Box component="span" sx={{ color: RED }}>*</Box>
            </Typography>
            <TextField
              fullWidth multiline minRows={6} maxRows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你對這個活動的感想..."
              inputProps={{ maxLength: 2000 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
            />
            <Typography sx={{ fontSize: 11, color: tokens.color.placeholder, textAlign: "right", mt: 0.4 }}>
              字數：{content.length} / 2000
            </Typography>
          </Box>

          {/* Right: selected event preview + image upload */}
          <Box>
            {event && (
              <Box sx={{ p: 1.5, bgcolor: tokens.color.bg, borderRadius: 2, mb: 1.5 }}>
                <Box sx={{
                  display: "inline-block", bgcolor: "#E8EFFF", color: NAVY,
                  fontSize: 11, fontWeight: 700, px: 1, py: "2px", borderRadius: "4px", mb: 0.75,
                }}>
                  {event.category}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{event.event_title}</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary, mt: 0.4 }}>
                  {formatDate(event.date)}
                </Typography>
                {event.session_name && (
                  <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }}>
                    {event.session_name}
                  </Typography>
                )}
              </Box>
            )}

            <Box
              component="label"
              sx={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 0.5,
                border: `1.5px dashed ${tokens.color.border}`, borderRadius: 2,
                py: 3, cursor: "pointer", bgcolor: "#fff",
                "&:hover": { borderColor: NAVY },
              }}
            >
              <AddPhotoAlternateIcon sx={{ color: tokens.color.placeholder, fontSize: 26 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{t("board.modal.addImage")}</Typography>
              <Typography sx={{ fontSize: 11, color: tokens.color.placeholder }}>
                {t("board.modal.imageHint")}
              </Typography>
              <input type="file" accept="image/png,image/jpeg" hidden onChange={handleImageUpload} />
            </Box>
            {images.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                {images.map((url) => (
                  <Box key={url} sx={{
                    width: 56, height: 56, borderRadius: 1, overflow: "hidden",
                    bgcolor: "#F0F2F5",
                  }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {error && (
          <Typography sx={{ color: RED, fontSize: 13, mt: 2 }}>{error}</Typography>
        )}

        <Box
          sx={{
            display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5,
            mt: 3, pt: 2, borderTop: `1px solid ${tokens.color.border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 13, color: tokens.color.textSecondary }}>
              {t("board.modal.visibility")}：
            </Typography>
            <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <FormControlLabel value="public"  control={<Radio size="small" />} label={t("board.modal.visPublic")} />
              <FormControlLabel value="private" control={<Radio size="small" />} label={t("board.modal.visPrivate")} />
              <FormControlLabel value="group"   control={<Radio size="small" />} label={t("board.modal.visGroup")} />
            </RadioGroup>
            {visibility === "group" && (
              <Box
                onClick={(e) => setGroupAnchor(e.currentTarget)}
                sx={{
                  cursor: "pointer", fontSize: 13, color: NAVY,
                  px: 1, py: 0.5, border: `1px solid ${tokens.color.border}`, borderRadius: 1,
                }}
              >
                {selectedGroupName || t("board.modal.selectGroup")}
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            sx={{
              textTransform: "none",
              border: `1px solid ${tokens.color.border}`,
              color: tokens.color.text, borderRadius: "10px", px: 2.5,
            }}
          >
            {t("common.saveDraft")}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            sx={{
              textTransform: "none",
              bgcolor: NAVY, color: "#fff",
              borderRadius: "10px", px: 3,
              "&:hover": { bgcolor: tokens.color.navyDark },
            }}
          >
            {t("common.publish")}
          </Button>
        </Box>
      </DialogContent>

      {/* Event picker popover */}
      <Popover
        open={Boolean(eventAnchor)}
        anchorEl={eventAnchor}
        onClose={() => setEventAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{ sx: { width: 380, maxHeight: 420, borderRadius: 2 } }}
      >
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${tokens.color.border}`, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{t("board.modal.selectEvent")}</Typography>
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, color: RED,
            bgcolor: "#FFE6E6", px: 1, py: 0.4, borderRadius: 1,
          }}>
            🚫 {t("board.modal.endedOnly")}
          </Box>
        </Box>
        <Box sx={{ p: 1.5 }}>
          <TextField
            fullWidth size="small"
            placeholder={t("board.modal.search")}
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: tokens.color.bg } }}
          />
        </Box>
        <Box sx={{ overflowY: "auto", maxHeight: 320 }}>
          {Object.keys(eventsByCategory).length === 0 ? (
            <Typography sx={{ p: 2, fontSize: 13, color: tokens.color.placeholder, textAlign: "center" }}>
              沒有可分享的已結束活動
            </Typography>
          ) : Object.entries(eventsByCategory).map(([cat, regs]) => (
            <Box key={cat}>
              <Typography sx={{
                fontSize: 12, fontWeight: 700, color: tokens.color.textSecondary,
                px: 1.5, py: 0.5, bgcolor: tokens.color.bg,
              }}>
                {cat}
              </Typography>
              {regs.map((r) => {
                const selected = event?.event_id === r.event_id;
                return (
                  <Box
                    key={r.id}
                    onClick={() => onPickEvent(r)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.25,
                      px: 1.5, py: 1, cursor: "pointer",
                      bgcolor: selected ? "#EEF2FB" : "transparent",
                      "&:hover": { bgcolor: "#F5F7FB" },
                    }}
                  >
                    <Avatar variant="rounded" sx={{ bgcolor: "#FCE7C8", color: "#9A6700", width: 36, height: 36 }}>
                      🎨
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>{r.event_title}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                        <Box sx={{
                          fontSize: 10, fontWeight: 700, px: 0.6, py: "1px",
                          bgcolor: "#E8EFFF", color: NAVY, borderRadius: 0.5,
                        }}>
                          {r.category || "活動"}
                        </Box>
                        <Typography sx={{ fontSize: 11, color: tokens.color.textSecondary }}>
                          {r.session_name && `${r.session_name} • `}{formatDate(r.date)}
                        </Typography>
                        <Box sx={{
                          fontSize: 10, fontWeight: 700, px: 0.6, py: "1px",
                          bgcolor: "#FFE6E6", color: RED, borderRadius: 0.5, ml: "auto",
                        }}>
                          {t("board.modal.ended")}
                        </Box>
                      </Box>
                    </Box>
                    {selected && <CheckIcon sx={{ color: NAVY, fontSize: 18 }} />}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Popover>

      {/* Group picker popover */}
      <Popover
        open={Boolean(groupAnchor)}
        anchorEl={groupAnchor}
        onClose={() => setGroupAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{ sx: { width: 320, maxHeight: 380, borderRadius: 2 } }}
      >
        <Box sx={{ p: 1.5 }}>
          <TextField
            fullWidth size="small"
            placeholder={t("board.modal.searchGroup")}
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: tokens.color.bg } }}
          />
        </Box>
        <Box sx={{ overflowY: "auto", maxHeight: 280, pb: 1 }}>
          {filteredGroups.length === 0 ? (
            <Typography sx={{ p: 2, fontSize: 13, color: tokens.color.placeholder, textAlign: "center" }}>
              尚未加入任何群組
            </Typography>
          ) : filteredGroups.map((g) => {
            const selected = groupId === g.id;
            const initial = (g.name || "?").charAt(0);
            return (
              <Box
                key={g.id}
                onClick={() => onPickGroup(g)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.25,
                  px: 1.5, py: 1, cursor: "pointer",
                  bgcolor: selected ? "#EEF2FB" : "transparent",
                  "&:hover": { bgcolor: "#F5F7FB" },
                }}
              >
                <Avatar sx={{ bgcolor: "#3F6BE0", width: 32, height: 32, fontSize: 14 }}>{initial}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{g.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: tokens.color.textSecondary }}>
                    {g.memberCount} 位成員 • {g.postCount} 篇留言
                  </Typography>
                </Box>
                {selected && <CheckIcon sx={{ color: NAVY, fontSize: 18 }} />}
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Dialog>
  );
}
