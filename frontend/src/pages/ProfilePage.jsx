import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import EventCard from "../components/EventCard";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { postsApi, usersApi, bookmarksApi, uploadsApi } from "../api";
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

const TABS = ["我的貼文", "即將到來的活動", "收藏貼文", "收藏活動"];
const STATUS_FILTERS = ["全部", "報名成功", "等待候補", "已取消"];
const STATUS_TO_ZH = { success: "報名成功", waitlist: "等待候補", cancelled: "已取消" };

export default function ProfilePage() {
  const [registrations, setRegistrations] = useState([]); // 存儲報名活動
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFile, setSelectedFile] = useState(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file); // 先把檔案存在 state 裡

    // 產生本地預覽網址，讓 editForm.avatarUrl 變更，Avatar 就會立刻換圖
    const previewUrl = URL.createObjectURL(file);
    setEditForm({ ...editForm, avatarUrl: previewUrl });
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
      // 確保這裡拿到的 editForm.avatarUrl 是最新上傳成功的網址
      const payload = {
        name: editForm.name,
        bio: editForm.bio,
        avatar_url: editForm.avatarUrl, // 這裡要對接後端欄位
      };

      const updated = await usersApi.updateMe(payload);
      
      // 手動做一次格式轉換，確保前端立刻有感
      const formattedUser = {
        ...updated,
        avatarUrl: updated.avatar_url || updated.avatarUrl
      };

      setUser(formattedUser); 
      setEditOpen(false); 
      console.log("一次存檔成功！");
    } catch (e) {
      console.error("更新失敗", e);
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
          <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 24, mb: 1 }}>
            My Calendar
          </Typography>

          {/* 加上 Provider 解決 UI Crash 報錯 */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={new Date()}
              // 1. 徹底殺掉 Cancel / OK 按鈕
              slotProps={{
                actionBar: { 
                  sx: { display: 'none !important' } 
                },
                toolbar: { hidden: true }
              }}
              // 2. 處理數字變紅邏輯
              slots={{
                day: (props) => {
                  const { day, outsideCurrentMonth, ...other } = props;
                  // 確保名稱與你 state 定義的一致
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
              // 3. 靠左對齊與寬度縮放樣式
              sx={{
                width: '100% !important',
                maxWidth: '100% !important',
                minWidth: 'unset !important',
                // 移除所有外層邊距讓它往左靠
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
                // 強制星期與日期對齊並填滿寬度
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
              更換照片
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
          </Box>
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
