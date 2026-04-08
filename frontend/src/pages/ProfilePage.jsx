import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import EventCard from "../components/EventCard";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { postsApi, usersApi, bookmarksApi } from "../api";
import { tokens } from "../theme";

const TAG_COLORS = {
  "運動": "rgba(57,167,255,0.42)",
  "便當": "rgba(255,205,57,0.42)",
  "英文": "rgba(255,57,57,0.42)",
  "就業": "rgba(255,57,159,0.42)",
  "講座": "rgba(57,255,167,0.42)",
  "美食": "rgba(255,205,57,0.42)",
  "求職": "rgba(255,57,159,0.42)",
};

const TABS = ["我的貼文", "即將到來的活動", "收藏貼文", "收藏活動"];
const STATUS_FILTERS = ["全部", "報名成功", "等待候補", "已取消"];
const STATUS_TO_ZH = { success: "報名成功", waitlist: "等待候補", cancelled: "已取消" };

export default function ProfilePage() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const { drafts, refreshUserData } = useData();
  const [tab, setTab] = useState(1);
  const [statusFilter, setStatusFilter] = useState("全部");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });

  const [myPosts, setMyPosts] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [profileStats, setProfileStats] = useState({ post_count: 0, joined_event_count: 0 });
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setEditForm({ name: user.name || "", bio: user.bio || "" });
    Promise.all([
      postsApi.list({ user_id: user.id }).catch(() => []),
      usersApi.myRegistrations().catch(() => []),
      usersApi.get(user.id).catch(() => null),
      bookmarksApi.myEvents().catch(() => []),
      bookmarksApi.myPosts().catch(() => []),
    ]).then(([posts, regs, profile, bEv, bPo]) => {
      setMyPosts(posts);
      setMyRegistrations(regs);
      if (profile) setProfileStats(profile);
      setBookmarkedEvents(bEv);
      setBookmarkedPosts(bPo);
    });
  }, [user, ready, navigate]);

  if (!ready) return null;
  if (!user) return null;

  const filteredRegistrations = statusFilter === "全部"
    ? myRegistrations
    : myRegistrations.filter((r) => STATUS_TO_ZH[r.status] === statusFilter);

  const sidebarCard = {
    bgcolor: "#fffefe",
    borderRadius: "20px",
    boxShadow: tokens.shadow.pill,
    p: 3,
  };

  const upcomingCount = myRegistrations.filter((r) => r.status === "success").length;
  const stats = [
    { label: "貼文", value: profileStats.post_count },
    { label: "已參加的活動", value: profileStats.joined_event_count },
    { label: "即將到來的活動", value: upcomingCount },
    { label: "關注的標籤", value: "" },
  ];

  const handleSaveEdit = async () => {
    try {
      const updated = await usersApi.updateMe({ name: editForm.name, bio: editForm.bio });
      setUser(updated);
      setEditOpen(false);
    } catch (e) {
      alert("更新失敗: " + (e?.response?.data?.detail || e.message));
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: 4, display: "grid", gridTemplateColumns: "291px 1fr", gap: 3 }}>
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
            <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 24, mb: 1 }}>My Calendar</Typography>
            <Typography sx={{ fontSize: 13, color: "#999" }}>即將到來的活動日曆（開發中）</Typography>
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
              src={user.avatar_url || user.avatar}
              sx={{
                width: 76, height: 76,
                position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)",
                border: "3px solid white",
              }}
            />
            <Box sx={{ pt: 5, pb: 1, textAlign: "center" }}>
              <Typography sx={{ fontFamily: "'Lemon',sans-serif", fontSize: 20 }}>{user.name}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 4, pb: 1.5 }}>
              {TABS.map((t, i) => (
                <Box
                  key={t}
                  onClick={() => setTab(i)}
                  sx={{
                    cursor: "pointer", fontSize: 18,
                    color: tab === i ? tokens.color.navy : "#000",
                    fontFamily: "'Lemon',sans-serif", pb: 0.5,
                    borderBottom: tab === i ? `2px solid ${tokens.color.navy}` : "2px solid transparent",
                  }}
                >
                  {t}
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
                    {s}
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5 }}>
                {filteredRegistrations.map((reg) => {
                  const event = {
                    id: reg.event_id,
                    title: reg.event_title,
                    image: reg.event_image,
                    date: reg.date,
                    location: reg.location,
                  };
                  return <EventCard key={reg.id} event={event} showActions status={STATUS_TO_ZH[reg.status]} />;
                })}
                {filteredRegistrations.length === 0 && (
                  <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>沒有報名紀錄</Typography>
                )}
              </Box>
            </>
          )}

          {tab === 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5 }}>
              {[...myPosts, ...drafts].map((p) => <PostCard key={p.id} post={p} />)}
              {myPosts.length + drafts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>尚無貼文</Typography>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5 }}>
              {bookmarkedPosts.map((p) => <PostCard key={p.id} post={p} />)}
              {bookmarkedPosts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>尚無收藏貼文</Typography>
              )}
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5 }}>
              {bookmarkedEvents.map((e) => <EventCard key={e.id} event={e} favorited />)}
              {bookmarkedEvents.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", gridColumn: "1/-1", py: 4 }}>尚無收藏活動</Typography>
              )}
            </Box>
          )}

          <Box
            onClick={() => navigate("/posts/create")}
            sx={{
              position: "fixed", bottom: 24, right: 24,
              width: 50, height: 50, borderRadius: "50%",
              bgcolor: tokens.color.navy, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 28, boxShadow: tokens.shadow.pill,
            }}
          >
            +
          </Box>
        </Box>
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>編輯個人資料</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="顯示名稱"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth label="自我介紹"
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            multiline rows={3} sx={{ mb: 2 }}
          />
          <TextField fullWidth label="Email" value={user.email} disabled sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ bgcolor: tokens.color.navy }}>儲存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
