import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import EventCard from "../components/EventCard";
import PostCard from "../components/PostCard";
import CancelConfirmDialog from "../components/CancelConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { postsApi, usersApi, bookmarksApi, uploadsApi } from "../api";
import { mapEvent } from "../api";
import api from "../api/client";
import { tokens } from "../theme";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
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

// Deduplication helper
const unique = (arr) => [...new Map(arr.map((x) => [x.id, x])).values()];

// Tab keys for regular users (5 tabs) and admin users (6 tabs). The
// managedEvents tab is admin-only: only whitelisted admins can create events.
const TAB_KEYS_USER = ["myPosts", "myRegistrations", "bookmarkedPosts", "bookmarkedEvents", "drafts"];
const TAB_KEYS_ADMIN = ["myPosts", "myRegistrations", "bookmarkedPosts", "bookmarkedEvents", "drafts", "managedEvents"];
const STATUS_FILTERS = ["all", "success", "waitlist", "cancelled"];

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(null);
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const { drafts, isEventBookmarked, toggleEventBookmark } = useData();
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });

  const [myPosts, setMyPosts] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [profileStats, setProfileStats] = useState({ post_count: 0, joined_event_count: 0, upcoming_event_count: 0, bookmarked_event_count: 0 });
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [managedEvents, setManagedEvents] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setEditForm({ name: user.name || "", bio: user.bio || "", avatarUrl: user.avatarUrl || "" });
    Promise.all([
      postsApi.list({ user_id: user.id, is_board_post: true }).catch(() => []),
      usersApi.myRegistrations().catch(() => []),
      usersApi.get(user.id).catch(() => null),
      bookmarksApi.myEvents().catch(() => []),
      bookmarksApi.myPosts().catch(() => []),
    ]).then(([posts, regs, profile, bEv, bPo]) => {
      setMyPosts(unique(posts));
      setMyRegistrations(unique(regs));
      if (profile) setProfileStats(profile);
      setBookmarkedEvents(bEv);
      setBookmarkedPosts(bPo);
    });

    // Only admins can create events, so only they have managed events to load.
    if (user.isAdmin) {
      api.get("/api/users/me/managed_events")
        .then((r) => setManagedEvents((r.data.items || []).map(mapEvent)))
        .catch(() => {});
    }
  }, [user, ready, navigate, i18n.language]);

  if (!ready) return null;
  if (!user) return null;

  const TAB_KEYS = user.isAdmin ? TAB_KEYS_ADMIN : TAB_KEYS_USER;

  const isUpcoming = (reg) => {
    if (!reg.date) return true; // unknown date → keep visible
    const eod = new Date(reg.date + "T23:59:59");
    return Date.now() <= eod.getTime();
  };

  // For myRegistrations tab: all regs filtered by statusFilter, then split by upcoming/past
  const statusFilteredRegs = statusFilter === "all"
    ? myRegistrations
    : myRegistrations.filter((r) => r.status === statusFilter);
  const upcomingRegs = statusFilteredRegs.filter(isUpcoming);
  const pastRegs = statusFilteredRegs.filter((r) => !isUpcoming(r));

  const reloadRegistrations = () =>
    usersApi.myRegistrations().then((regs) => setMyRegistrations(unique(regs))).catch(() => {});

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

  // All stat counts come from the backend (GET /api/users/{id}) so they are
  // accurate and not capped by the paginated registration/post/bookmark lists.
  const stats = [
    { label: t("profile.stats.posts"), value: profileStats.post_count },
    { label: t("profile.stats.joined"), value: profileStats.joined_event_count },
    { label: t("profile.stats.upcoming"), value: profileStats.upcoming_event_count },
    { label: t("profile.stats.bookmarked"), value: profileStats.bookmarked_event_count },
  ];

  const handleSaveEdit = async () => {
    try {
      const payload = {
        name: editForm.name,
        bio: editForm.bio,
        avatar_url: editForm.avatarUrl && editForm.avatarUrl.startsWith("blob:") ? undefined : editForm.avatarUrl,
      };
      if (selectedFile) {
        const { url } = await uploadsApi.upload(selectedFile);
        payload.avatar_url = url;
      }
      const updated = await usersApi.updateMe(payload);
      setUser(updated);
      setEditOpen(false);
      setSelectedFile(null);
    } catch (e) {
      console.error("更新失敗", e);
    }
  };

  // Helper to render an EventCard row from a registration record
  const renderRegCard = (reg) => {
    const event = {
      id: reg.event_id,
      title: reg.event_title,
      image: reg.event_image,
      date: reg.date,
      location: reg.location,
    };
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
        favorited={isEventBookmarked(reg.event_id)}
        onToggleFavorite={() => toggleEventBookmark(reg.event_id)}
      />
    );
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "291px 1fr" }, gap: 3 }}>
        {/* ── Sidebar ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={sidebarCard}>
            <Typography sx={{ fontFamily: tokens.font.base, fontSize: tokens.fontSize.heading, mb: 2 }}>{t("profile.publicProfile")}</Typography>
            {stats.map((s) => (
              <Box key={s.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.6 }}>
                <Typography sx={{ fontFamily: tokens.font.base, fontSize: tokens.fontSize.subtitle }}>{s.label}</Typography>
                {s.value !== "" && <Typography sx={{ fontSize: tokens.fontSize.subtitle }}>{s.value}</Typography>}
              </Box>
            ))}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7, mt: 1 }}>
              {(user.tags || []).map((tag) => (
                <Box key={tag} sx={{
                  bgcolor: TAG_COLORS[tag] || "rgba(0,0,0,0.1)",
                  px: 1, py: "2px", borderRadius: "20px", fontSize: tokens.fontSize.body,
                }}>{tag}</Box>
              ))}
            </Box>
          </Box>

          {/* ── Calendar ── */}
          <Box sx={sidebarCard}>
            <Typography sx={{ fontFamily: tokens.font.base, fontSize: tokens.fontSize.heading, mb: 1 }}>
              {t("profile.calendarTitle")}
            </Typography>

            <Box sx={{ pb: 0.5 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                  value={calendarDate}
                  onChange={setCalendarDate}
                  yearsPerRow={3}
                  slots={{
                    day: (props) => {
                      // Strip MUI PickersDay-internal props so they are not spread
                      // onto the plain <Box> DOM node (would cause React warnings).
                      /* eslint-disable no-unused-vars */
                      const {
                        day, outsideCurrentMonth,
                        disableHighlightToday, showDaysOutsideCurrentMonth, isAnimating,
                        onDaySelect, today, isFirstVisibleCell, isLastVisibleCell,
                        selected, disabled,
                        ...other
                      } = props;
                      /* eslint-enable no-unused-vars */
                      const nonCancelledRegs = myRegistrations.filter((r) => r.status !== "cancelled");
                      const dayEvents = !outsideCurrentMonth
                        ? nonCancelledRegs.filter((r) => r.date && isSameDay(parseISO(r.date), day))
                        : [];
                      const hasEvent = dayEvents.length > 0;

                      // Tooltip shows: name · time · location · date (spec req 6a)
                      const tooltipContent = hasEvent
                        ? dayEvents.map((r) => [r.event_title, r.time, r.location, r.date].filter(Boolean).join(" · ")).join("\n")
                        : "";

                      const dayBox = (
                        <Box
                          {...other}
                          onClick={(e) => {
                            if (other.onClick) other.onClick(e);
                            if (hasEvent) navigate(`/events/${dayEvents[0].event_id}`);
                          }}
                          sx={{
                            ...other.sx,
                            color: hasEvent ? "red !important" : "inherit",
                            fontWeight: hasEvent ? "900 !important" : "normal",
                            width: '32px !important',
                            height: '32px !important',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '0 !important',
                            cursor: hasEvent ? "pointer" : "default",
                          }}
                        >
                          {day.getDate()}
                        </Box>
                      );

                      return hasEvent ? (
                        <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{tooltipContent}</span>} arrow>
                          {dayBox}
                        </Tooltip>
                      ) : dayBox;
                    }
                  }}
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    "& .MuiPickersLayout-root": {
                      minWidth: "unset",
                      width: "100%",
                    },
                    "& .MuiDateCalendar-root": {
                      width: "100%",
                      margin: 0,
                      padding: 0,
                    },
                    "& .MuiDayCalendar-monthContainer": {
                      width: "100%",
                    },
                    "& .MuiDayCalendar-header": {
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 0,
                    },
                    "& .MuiDayCalendar-weekContainer": {
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 0,
                    },
                    "& .MuiPickersDay-root": {
                      width: '32px !important',
                      height: '32px !important',
                      margin: '0 !important',
                    },
                    "& .MuiDayCalendar-weekDayLabel": {
                      width: '32px !important',
                      height: '32px !important',
                      margin: '0 !important',
                      fontSize: '0.75rem',
                    },
                    "& .MuiPickersCalendarHeader-root": {
                      padding: 0,
                      margin: 0,
                      width: "100%",
                    },
                    "& .MuiYearCalendar-root": {
                      width: "100%",
                      maxWidth: "100%",
                      padding: 0,
                    },
                    "& .MuiPickersYear-root": {
                      flexBasis: "33.33%",
                      maxWidth: "33.33%",
                    },
                    "& .MuiPickersYear-yearButton": {
                      width: "100%",
                      minWidth: "unset",
                      fontSize: "0.8rem",
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
          </Box>
        </Box>

        {/* ── Main content ── */}
        <Box>
          {/* Profile card + tabs */}
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
              <Typography sx={{ fontFamily: tokens.font.base, fontWeight: 700, fontSize: tokens.fontSize.title }}>{user.name}</Typography>
              {user.bio && (
                <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.text, mt: 1, px: 4 }}>
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
                    cursor: "pointer", fontSize: { xs: tokens.fontSize.body, md: tokens.fontSize.subtitle },
                    color: tab === i ? tokens.color.navy : "#000",
                    fontFamily: tokens.font.base, fontWeight: 600, pb: 0.5,
                    borderBottom: tab === i ? `2px solid ${tokens.color.navy}` : "2px solid transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t(`profile.tabs.${tk}`, {
                    myPosts: "我的留言",
                    myRegistrations: "我的報名",
                    bookmarkedPosts: "收藏留言",
                    bookmarkedEvents: "收藏活動",
                    drafts: "留言草稿",
                    managedEvents: "活動管理",
                  }[tk])}
                </Box>
              ))}
            </Box>
            <Box
              onClick={() => setEditOpen(true)}
              sx={{
                position: "absolute", top: 12, right: 12,
                bgcolor: "#39a7ff", color: "white",
                px: 1.5, py: "5px", borderRadius: "20px", fontSize: tokens.fontSize.caption,
                cursor: "pointer", fontFamily: tokens.font.base,
              }}
            >
              {t("profile.editProfile")}
            </Box>
          </Box>

          {/* Tab 0 — 我的留言 (myPosts) */}
          {tab === 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5, alignItems: 'start' }}>
              {myPosts.map((p) => <PostCard key={p.id} post={p} />)}
              {myPosts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noPosts", "尚無留言")}</Typography>
              )}
            </Box>
          )}

          {/* Tab 1 — 我的報名 (myRegistrations) split into upcoming / ended sections */}
          {tab === 1 && (
            <>
              {/* Status filter chips */}
              <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
                {STATUS_FILTERS.map((s) => (
                  <Box
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    sx={{
                      px: 1.5, py: "6px", fontSize: tokens.fontSize.body, borderRadius: "8px",
                      border: "1px solid #cac4d0",
                      bgcolor: statusFilter === s ? "rgba(57,167,255,0.42)" : "#fff",
                      color: "#49454f", cursor: "pointer", fontFamily: tokens.font.base,
                      fontWeight: 500,
                    }}
                  >
                    {t(`event.statusFilter.${s}`)}
                  </Box>
                ))}
              </Box>

              {/* Section 1: 即將到來 */}
              <Typography sx={{ fontFamily: tokens.font.base, fontSize: tokens.fontSize.subtitle, fontWeight: 700, mb: 1.5 }}>
                {t("profile.sections.upcoming", "即將到來")}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5, mb: 3 }}>
                {upcomingRegs.length > 0
                  ? upcomingRegs.map(renderRegCard)
                  : <Typography sx={{ color: "#999", gridColumn: "1/-1", py: 2 }}>{t("profile.empty.noRegistrations")}</Typography>}
              </Box>

              {/* Section 2: 已結束 */}
              <Typography sx={{ fontFamily: tokens.font.base, fontSize: tokens.fontSize.subtitle, fontWeight: 700, mb: 1.5 }}>
                {t("profile.sections.ended", "已結束")}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
                {pastRegs.length > 0
                  ? pastRegs.map(renderRegCard)
                  : <Typography sx={{ color: "#999", gridColumn: "1/-1", py: 2 }}>{t("profile.empty.noRegistrations")}</Typography>}
              </Box>
            </>
          )}

          {/* Tab 2 — 收藏留言 (bookmarkedPosts) */}
          {tab === 2 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5, alignItems: 'start' }}>
              {bookmarkedPosts.map((p) => <PostCard key={p.id} post={p} />)}
              {bookmarkedPosts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noBookmarkedPosts")}</Typography>
              )}
            </Box>
          )}

          {/* Tab 3 — 收藏活動 (bookmarkedEvents) */}
          {tab === 3 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {bookmarkedEvents.map((e) => {
                const sessionId = e._bookmarkedSessionId ?? 0;
                return (
                  <EventCard
                    key={`${e.id}-${sessionId}`}
                    event={e}
                    favorited={isEventBookmarked(e.id, sessionId)}
                    onToggleFavorite={() => toggleEventBookmark(e.id, sessionId)}
                  />
                );
              })}
              {bookmarkedEvents.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noBookmarkedEvents")}</Typography>
              )}
            </Box>
          )}

          {/* Tab 4 — 留言草稿 (drafts) */}
          {tab === 4 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {(drafts || []).map((p) => <PostCard key={p.id} post={p} />)}
              {(!drafts || drafts.length === 0) && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noDrafts", "尚無草稿")}</Typography>
              )}
            </Box>
          )}

          {/* Tab 5 — 活動管理 (managedEvents, admin only) */}
          {tab === 5 && user.isAdmin && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {managedEvents.map((e) => (
                <Box key={e.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <EventCard event={e} sx={{ flex: 1 }} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/events/${e.id}/edit`)}
                      sx={{ flex: 1, textTransform: "none", borderRadius: "8px", fontSize: tokens.fontSize.body }}
                    >
                      {t("admin.edit")}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/events/${e.id}/registrations`)}
                      sx={{ flex: 1, textTransform: "none", borderRadius: "8px", fontSize: tokens.fontSize.body, bgcolor: tokens.color.navy, "&:hover": { bgcolor: tokens.color.navyDark } }}
                    >
                      {t("admin.viewRegistrations")}
                    </Button>
                  </Box>
                </Box>
              ))}
              {managedEvents.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>{t("profile.empty.noManagedEvents", "尚無管理的活動")}</Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Edit Profile Dialog */}
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
