import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import EventCard from "../components/EventCard";
import PostCard from "../components/PostCard";
import CancelConfirmDialog from "../components/CancelConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { postsApi, usersApi, bookmarksApi, uploadsApi } from "../api";
import api from "../api/client";
import { tokens } from "../theme";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { Badge } from '@mui/material';
import { parseISO, isSameDay } from 'date-fns';

const TAG_COLORS = {
  "運動": "rgba(57,167,255,0.42)",
  "便當": "rgba(255,205,57,0.42)",
  "英文": "rgba(255,57,57,0.42)",
  "就業": "rgba(255,57,159,0.42)",
  "講座": "rgba(57,255,167,0.42)",
  "美食": "rgba(255,205,57,0.42)",
  "求職": "rgba(255,57,159,0.42)",
};

// i18n-keyed tabs/filters. Render labels via t() at usage site.
const TAB_KEYS = ["myPosts", "upcoming", "bookmarkedPosts", "bookmarkedEvents", "myComments"];
const STATUS_FILTERS = ["all", "success", "waitlist", "cancelled"];

export default function ProfilePage() {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState([]); // 存儲報名活動
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFile, setSelectedFile] = useState(null);
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const { drafts, refreshUserData } = useData();
  const [tab, setTab] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });

  const [myPosts, setMyPosts] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [profileStats, setProfileStats] = useState({ post_count: 0, joined_event_count: 0 });
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // 取得報名資料
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const data = await usersApi.myRegistrations();
        setRegistrations(data);
      } catch (err) {
        console.error("無法取得報名資料", err);
      }
    };
    fetchRegistrations();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setEditForm({ name: user.name || "", bio: user.bio || "", avatarUrl: user.avatarUrl || ""});
    Promise.all([
      postsApi.list({ user_id: user.id }).catch(() => []),
      usersApi.myRegistrations().catch(() => []),
      usersApi.get(user.id).catch(() => null),
      bookmarksApi.myEvents().catch(() => []),
      bookmarksApi.myPosts().catch(() => []),
      usersApi.myComments().catch(() => []),
    ]).then(([posts, regs, profile, bEv, bPo, comments]) => {
      setMyPosts(posts);
      setMyRegistrations(regs);
      if (profile) setProfileStats(profile);
      setBookmarkedEvents(bEv);
      setBookmarkedPosts(bPo);
      setMyComments(comments);
    });
  }, [user, ready, navigate]);

  if (!ready) return null;
  if (!user) return null;

  const isUpcoming = (reg) => {
    if (!reg.date) return true;  // unknown date → keep visible
    const eod = new Date(reg.date + "T23:59:59");
    return Date.now() <= eod.getTime();
  };

  const baseRegs = tab === 1
    ? myRegistrations.filter(isUpcoming)
    : myRegistrations;
  const filteredRegistrations = statusFilter === "all"
    ? baseRegs
    : baseRegs.filter((r) => r.status === statusFilter);

  const reloadRegistrations = () =>
    usersApi.myRegistrations().then(setMyRegistrations).catch(() => {});

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await api.delete(`/api/registrations/${pendingCancel.id}`);
      setPendingCancel(null);
      await reloadRegistrations();
    } catch (e) {
      setCancelError(e?.response?.data?.detail || e.message || t("records.cancelFailed"));
    } finally {
      setCancelLoading(false);
    }
  };

  const sidebarCard = {
    bgcolor: "#fffefe",
    borderRadius: "20px",
    boxShadow: tokens.shadow.pill,
    p: 3,
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file); 

    const previewUrl = URL.createObjectURL(file);
    setEditForm({ ...editForm, avatarUrl: previewUrl });
  };

  // sidebar count uses the same upcoming filter as the tab so they stay consistent.
  const upcomingCount = myRegistrations.filter((r) => r.status === "success" && isUpcoming(r)).length;
  const stats = [
    { label: t("profile.stats.posts"), value: profileStats.post_count },
    { label: t("profile.stats.joined"), value: profileStats.joined_event_count },
    { label: t("profile.stats.upcoming"), value: upcomingCount },
    { label: t("profile.stats.tags"), value: "" },
  ];
  const handleSaveEdit = async () => {
    try {
      const payload = {
        name: editForm.name,
        bio: editForm.bio,
        avatar_url: editForm.avatarUrl.startsWith("blob:") ? undefined : editForm.avatarUrl,
      };

      if (selectedFile) {
        const { url } = await uploadsApi.upload(selectedFile);
        payload.avatar_url = url;
      }

      const updated = await usersApi.updateMe(payload);
      setUser(updated); // updated is already formatted by mapUser in usersApi.updateMe
      setEditOpen(false);
      setSelectedFile(null);
      console.log("一次存檔成功！");
    } catch (e) {
      console.error("更新失敗", e);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "291px 1fr" }, gap: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={sidebarCard}>
            <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 24, mb: 2 }}>Profile</Typography>
            {stats.map((s) => (
              <Box key={s.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.6 }}>
                <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 16 }}>{s.label}</Typography>
                {s.value !== "" && <Typography sx={{ fontSize: 16 }}>{s.value}</Typography>}
              </Box>
            ))}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7, mt: 1 }}>
              {(user.tags || []).map((tag) => (
                <Box key={tag} sx={{
                  bgcolor: TAG_COLORS[tag] || "rgba(0,0,0,0.1)",
                  px: 1, py: "2px", borderRadius: "20px", fontSize: 13,
                }}>{tag}</Box>
              ))}
            </Box>
          </Box>

          <Box sx={sidebarCard}>
          <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 24, mb: 1 }}>
            My Calendar
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={new Date()}
              slotProps={{
                actionBar: {
                  sx: { display: 'none !important' }
                },
                // toolbar: hidden を解除し、年月切替を表示する（year disappearing バグ対策）
                toolbar: { hidden: false },
              }}
              slots={{
                day: (props) => {
                  const { day, outsideCurrentMonth, ...other } = props;
                  const hasEvent = !outsideCurrentMonth && myRegistrations.some(reg => 
                    reg.date && isSameDay(parseISO(reg.date), day)
                  );

                  return (
                    <Box
                      {...other}
                      sx={{
                        ...other.sx,
                        // 有活動變紅粗體，沒活動維持原樣
                        color: hasEvent ? "red !important" : "inherit",
                        fontWeight: hasEvent ? "900 !important" : "normal",
                        width: '32px !important',
                        height: '32px !important',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 !important',
                      }}
                    >
                      {day.getDate()}
                    </Box>
                  );
                }
              }}
              sx={{
                width: '100% !important',
                maxWidth: '100% !important',
                minWidth: 'unset !important',
                '& .MuiPickersLayout-root': { 
                  minWidth: 'unset !important', 
                  width: '100% !important',
                },
                '& .MuiDateCalendar-root': { 
                  width: '100% !important', 
                  minWidth: 'unset !important',
                  margin: '0 !important',
                  padding: '0 !important',
                },
                '& .MuiDayCalendar-monthContainer': { 
                  width: '100% !important' 
                },
                '& .MuiDayCalendar-header': {
                  width: '100% !important',
                  display: 'flex !important',
                  justifyContent: 'space-between !important',
                  padding: '0 !important',
                },
                '& .MuiDayCalendar-weekContainer': {
                  width: '100% !important',
                  display: 'flex !important',
                  justifyContent: 'space-between !important',
                  padding: '0 !important',
                },
                '& .MuiPickersDay-root': {
                  width: '32px !important',
                  height: '32px !important',
                  margin: '0 !important',
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  width: '32px !important',
                  height: '32px !important',
                  margin: '0 !important',
                  fontSize: '0.75rem',
                },
                '& .MuiPickersCalendarHeader-root': {
                  padding: '0 !important',
                  margin: '0 !important',
                  width: '100% !important',
                }
              }}
            />
          </LocalizationProvider>
        </Box>
        </Box>

        <Box>
          <Box sx={{
            bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill,
            mb: 3, position: "relative", overflow: "hidden",
          }}>
            <Box sx={{
              height: 90,
              background: "linear-gradient(135deg,#1a237e 0%,#3f51b5 50%,#7e57c2 100%)",
            }} />
            <Avatar
              src={user.avatarUrl}
              sx={{
                width: 76, height: 76,
                position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)",
                border: "3px solid white",
              }}
            />
            <Box sx={{ pt: 5, pb: 1, textAlign: "center" }}>
              <Typography sx={{ fontFamily: "'Lemon',sans-serif", fontSize: 20 }}>{user.name}</Typography>
              {user.bio && (
                <Typography sx={{ fontSize: 14, color: tokens.color.text, mt: 1, px: 4 }}>
                  {user.bio}
                </Typography>
              )}
            </Box>
            <Box sx={{
              display: "flex", justifyContent: { xs: "flex-start", sm: "center" },
              gap: { xs: 2, md: 4 }, pb: 1.5,
              overflowX: "auto", px: { xs: 1.5, sm: 0 },
              "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
            }}>
              {TAB_KEYS.map((tk, i) => (
                <Box
                  key={tk}
                  onClick={() => setTab(i)}
                  sx={{
                    cursor: "pointer", fontSize: { xs: 14, md: 18 },
                    color: tab === i ? tokens.color.navy : "#000",
                    fontFamily: "'Lemon',sans-serif", pb: 0.5,
                    borderBottom: tab === i ? `2px solid ${tokens.color.navy}` : "2px solid transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t(`profile.tabs.${tk}`)}
                </Box>
              ))}
            </Box>
            <Box
              onClick={() => setEditOpen(true)}
              sx={{
                position: "absolute", top: 12, right: 12,
                bgcolor: "#39a7ff", color: "white",
                px: 1.5, py: "5px", borderRadius: "20px", fontSize: 12,
                cursor: "pointer", fontFamily: "'Lexend',sans-serif",
              }}
            >
              Edit Profile
            </Box>
          </Box>

          {tab === 1 && (
            <>
              <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
                {STATUS_FILTERS.map((s) => (
                  <Box
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    sx={{
                      px: 1.5, py: "6px", fontSize: 14, borderRadius: "8px",
                      border: "1px solid #cac4d0",
                      bgcolor: statusFilter === s ? "rgba(57,167,255,0.42)" : "#fff",
                      color: "#49454f", cursor: "pointer", fontFamily: "'Roboto',sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {t(`event.statusFilter.${s}`)}
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
                {filteredRegistrations.map((reg) => {
                  const event = {
                    id: reg.event_id,
                    title: reg.event_title,
                    image: reg.event_image,
                    date: reg.date,
                    location: reg.location,
                  };
                  // Hide Cancel for past events (BE 409 would reject anyway).
                  // Matches RegistrationRecordPage to keep the two surfaces in sync.
                  const isPast = (() => {
                    if (!reg.date) return false;
                    const d = new Date(reg.date);
                    if (Number.isNaN(d.getTime())) return false;
                    const endOfDay = new Date(d);
                    endOfDay.setHours(23, 59, 59, 999);
                    return Date.now() > endOfDay.getTime();
                  })();
                  const canCancel = reg.status !== "cancelled" && !isPast;
                  return (
                    <EventCard
                      key={reg.id}
                      event={event}
                      showActions
                      status={reg.status}
                      onCancel={canCancel ? () => setPendingCancel(reg) : undefined}
                    />
                  );
                })}
                {filteredRegistrations.length === 0 && (
                  <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noRegistrations")}</Typography>
                )}
              </Box>
            </>
          )}

          {tab === 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {[...myPosts, ...drafts].map((p) => <PostCard key={p.id} post={p} />)}
              {myPosts.length + drafts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noPosts")}</Typography>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {bookmarkedPosts.map((p) => <PostCard key={p.id} post={p} />)}
              {bookmarkedPosts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noBookmarkedPosts")}</Typography>
              )}
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {bookmarkedEvents.map((e) => <EventCard key={e.id} event={e} favorited />)}
              {bookmarkedEvents.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noBookmarkedEvents")}</Typography>
              )}
            </Box>
          )}

          {tab === 4 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {myComments.map((c) => {
                const target = c.postIsBoardPost
                  ? `/board/posts/${c.postId}`
                  : `/posts/${c.postId}`;
                const headline = c.postTitle
                  || c.postEventTitle
                  || (c.postExcerpt ? `${c.postExcerpt}…` : t("profile.originalPost"));
                return (
                  <Box
                    key={c.id}
                    onClick={() => navigate(target)}
                    sx={{
                      bgcolor: "#fffefe", borderRadius: "16px",
                      boxShadow: tokens.shadow.pill, p: 2.5, cursor: "pointer",
                      "&:hover": { transform: "translateY(-1px)", transition: "transform .15s" },
                    }}
                  >
                    <Typography sx={{ fontSize: 14, color: tokens.color.text, mb: 0.8, whiteSpace: "pre-wrap" }}>
                      {c.content}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tokens.color.placeholder }}>
                      {t("profile.commentOn", { title: headline })} · {(c.createdAt || "").slice(0, 10)}
                    </Typography>
                  </Box>
                );
              })}
              {myComments.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", py: 4 }}>{t("profile.empty.noComments")}</Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("profile.editTitle")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1, mb: 3 }}>
            <Avatar
              src={editForm.avatarUrl}
              sx={{ width: 100, height: 100, mb: 1, border: `2px solid ${tokens.color.navy}` }}
            />
            <Button
              variant="outlined"
              size="small"
              component="label"
              sx={{ color: tokens.color.navy, borderColor: tokens.color.navy }}
            >
              {t("profile.changePhoto")}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
          </Box>
          <TextField
            fullWidth label={t("profile.displayName")}
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth label={t("profile.bio")}
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            multiline rows={3} sx={{ mb: 2 }}
          />
          <TextField fullWidth label="Email" value={user.email} disabled sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ bgcolor: tokens.color.navy }}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <CancelConfirmDialog
        open={!!pendingCancel}
        event={pendingCancel ? {
          title: pendingCancel.event_title,
          image: pendingCancel.event_image,
          date: pendingCancel.date,
          location: pendingCancel.location,
          sessionName: pendingCancel.session_name,
        } : undefined}
        loading={cancelLoading}
        error={cancelError}
        onClose={() => { setPendingCancel(null); setCancelError(""); }}
        onConfirm={handleConfirmCancel}
      />
    </Box>
  );
}
