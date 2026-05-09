import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Avatar, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PostCard from "../components/PostCard";
import { usersApi, postsApi } from "../api";
import { useAuth } from "../context/AuthContext";
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

export default function OtherProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [publicPosts, setPublicPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.all([
      usersApi.get(Number(userId)).catch(() => null),
      postsApi.list({ user_id: Number(userId), visibility: "public" }).catch(() => []),
    ]).then(([u, posts]) => {
      if (!live) return;
      setProfileUser(u);
      setPublicPosts(posts);
      setLoading(false);
    });
    return () => { live = false; };
  }, [userId]);

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>載入中...</Typography></Box>;
  if (!profileUser) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography>找不到此使用者</Typography>
      </Box>
    );
  }

  const sidebarCard = {
    bgcolor: "#fffefe",
    borderRadius: "20px",
    boxShadow: tokens.shadow.pill,
    p: 3,
  };

  const stats = [
    { label: "貼文", value: profileUser.post_count ?? 0 },
    { label: "已參加的活動", value: profileUser.joined_event_count ?? 0 },
    { label: "關注的標籤", value: "" },
  ];

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.logo, fontStyle: "italic", fontSize: { xs: 24, md: 32 }, color: tokens.color.navy }}>
            個人主頁
          </Typography>
          {user && (
            <Box sx={{ ml: "auto", display: { xs: "none", sm: "block" } }}>
              <Avatar src={user.avatarUrl} sx={{ width: 52, height: 52 }} />
            </Box>
          )}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "291px 1fr" }, gap: 3 }}>
          {/* Sidebar */}
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
                {profileUser.tags?.map((tag) => (
                  <Box key={tag} sx={{
                    bgcolor: TAG_COLORS[tag] || "rgba(0,0,0,0.1)",
                    px: 1, py: "2px", borderRadius: "20px", fontSize: 13,
                  }}>
                    {tag}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Main */}
          <Box>
            {/* Header card */}
            <Box sx={{
              bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill,
              mb: 3, position: "relative", overflow: "hidden",
            }}>
              <Box sx={{
                height: 90,
                background: "linear-gradient(135deg,#1a237e 0%,#3f51b5 50%,#7e57c2 100%)",
              }} />
              <Avatar
                src={profileUser.avatarUrl}
                sx={{
                  width: 76, height: 76,
                  position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)",
                  border: "3px solid white",
                }}
              />
              <Box sx={{ pt: 5, pb: 1, textAlign: "center" }}>
                <Typography sx={{ fontFamily: "'Lemon',sans-serif", fontSize: 20 }}>{profileUser.name}</Typography>
                {profileUser.department && (
                  <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>{profileUser.department}</Typography>
                )}
                {profileUser.bio && (
                  <Typography sx={{ fontSize: 14, color: tokens.color.text, mt: 1, px: 4 }}>
                    {profileUser.bio}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
                <Box sx={{
                  fontFamily: "'Lemon',sans-serif",
                  fontSize: 18, color: tokens.color.navy,
                  borderBottom: `2px solid ${tokens.color.navy}`, pb: 0.5,
                }}>
                  公開貼文
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 2.5 }}>
              {publicPosts.map((p) => <PostCard key={p.id} post={p} />)}
              {publicPosts.length === 0 && (
                <Typography sx={{ textAlign: "center", color: tokens.color.placeholder, gridColumn: "1/-1", py: 4 }}>
                  尚無公開貼文
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
