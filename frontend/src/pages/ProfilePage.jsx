import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, Paper, Tabs, Tab, Grid, Chip, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EventCard from "../components/EventCard";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import {
  mockPosts, mockRegistrations, mockDrafts,
  mockBookmarkedEvents, mockBookmarkedPosts, mockEvents,
} from "../mock/data";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("全部");

  if (!user) { navigate("/login"); return null; }

  const myPosts = mockPosts.filter((p) => p.userId === user.id);
  const myRegistrations = mockRegistrations.filter((r) => r.userId === user.id);
  const filteredRegistrations = statusFilter === "全部"
    ? myRegistrations
    : myRegistrations.filter((r) => r.status === statusFilter);

  const tabs = ["我的貼文", "即將到來的活動", "小棧", "收藏貼文", "收藏活動"];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
        <Grid container spacing={3}>
          {/* Left sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ borderRadius: 3, p: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Profile</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">貼文</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.postCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">已參加的活動</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.joinedEventCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">即將到來的活動</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.upcomingEventCount}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>關注的標籤</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {user.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ fontSize: 11 }} />
                ))}
              </Box>
            </Paper>

            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>My Calendar</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                即將到來的活動日曆（開發中）
              </Typography>
            </Paper>
          </Grid>

          {/* Right content */}
          <Grid item xs={12} md={9}>
            {/* Cover + Avatar */}
            <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
              <Box
                sx={{
                  height: 160,
                  background: "linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)",
                  position: "relative",
                }}
              >
                <Avatar
                  src={user.avatar}
                  sx={{
                    width: 80, height: 80,
                    position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)",
                    border: "4px solid white",
                  }}
                />
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setEditOpen(true)}
                  sx={{
                    position: "absolute", top: 12, right: 12,
                    bgcolor: "rgba(255,255,255,0.9)", textTransform: "none",
                    fontSize: 12, borderRadius: 2,
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
              <Box sx={{ textAlign: "center", pt: 5, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.name}</Typography>
              </Box>

              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                centered
                sx={{
                  "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 14 },
                  "& .Mui-selected": { color: "#1a237e" },
                  "& .MuiTabs-indicator": { bgcolor: "#1a237e" },
                }}
              >
                {tabs.map((t) => <Tab key={t} label={t} />)}
              </Tabs>
            </Paper>

            {/* Tab content */}
            {tab === 0 && (
              <Grid container spacing={2}>
                {myPosts.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post.id}>
                    <PostCard post={post} />
                  </Grid>
                ))}
                {myPosts.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                      尚無貼文
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}

            {tab === 1 && (
              <>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  {["全部", "報名成功", "等待候補", "已取消"].map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      onClick={() => setStatusFilter(s)}
                      sx={{
                        bgcolor: statusFilter === s ? "#1a237e" : "white",
                        color: statusFilter === s ? "white" : "#333",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
                <Grid container spacing={2}>
                  {filteredRegistrations.map((reg) => {
                    const event = mockEvents.find((e) => e.id === reg.eventId) || {
                      ...reg, id: reg.eventId, title: reg.eventTitle, image: reg.eventImage,
                    };
                    return (
                      <Grid item xs={12} sm={6} md={4} key={reg.id}>
                        <EventCard event={event} showActions status={reg.status} />
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            )}

            {tab === 2 && (
              <Grid container spacing={2}>
                {mockDrafts.map((draft) => (
                  <Grid item xs={12} sm={6} md={4} key={draft.id}>
                    <Paper
                      sx={{ p: 2, borderRadius: 3, cursor: "pointer" }}
                      onClick={() => navigate(`/posts/create?draftId=${draft.id}`)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {draft.eventTitle || "無關聯活動"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {draft.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {draft.createdAt}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
                {mockDrafts.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                      尚無草稿
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}

            {tab === 3 && (
              <Grid container spacing={2}>
                {mockBookmarkedPosts.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post.id}>
                    <PostCard post={post} />
                  </Grid>
                ))}
              </Grid>
            )}

            {tab === 4 && (
              <Grid container spacing={2}>
                {mockBookmarkedEvents.map((event) => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <EventCard event={event} showActions />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>編輯個人資料</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="顯示名稱" defaultValue={user.name} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="自我介紹" defaultValue={user.bio} multiline rows={3} sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" defaultValue={user.email} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => setEditOpen(false)} sx={{ bgcolor: "#1a237e" }}>
            儲存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
