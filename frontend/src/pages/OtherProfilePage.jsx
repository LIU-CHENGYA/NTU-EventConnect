import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Avatar, Paper, Grid } from "@mui/material";
import PostCard from "../components/PostCard";
import { mockUsers, mockPosts } from "../mock/data";

export default function OtherProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const profileUser = mockUsers.find((u) => u.id === Number(userId));

  if (!profileUser) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>找不到此使用者</Typography>
      </Box>
    );
  }

  const publicPosts = mockPosts.filter(
    (p) => p.userId === profileUser.id && p.visibility === "public"
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
        <Grid container spacing={3}>
          {/* Left sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Profile</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Avatar src={profileUser.avatar} sx={{ width: 48, height: 48 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{profileUser.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{profileUser.department}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">貼文</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{profileUser.postCount}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">已參加的活動</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{profileUser.joinedEventCount}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 0.5, mt: 1 }}>關注的標籤</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {profileUser.tags?.map((tag) => (
                  <Box
                    key={tag}
                    sx={{
                      px: 1, py: 0.3, bgcolor: "#e8eaf6", borderRadius: 1,
                      fontSize: 11, color: "#1a237e",
                    }}
                  >
                    {tag}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right content */}
          <Grid item xs={12} md={9}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              公開貼文
            </Typography>
            <Grid container spacing={2}>
              {publicPosts.map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <PostCard post={post} />
                </Grid>
              ))}
              {publicPosts.length === 0 && (
                <Grid item xs={12}>
                  <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    尚無公開貼文
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
