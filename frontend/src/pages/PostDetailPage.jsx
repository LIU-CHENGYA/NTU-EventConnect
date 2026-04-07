import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Avatar, Button, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { mockPosts, mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const post = mockPosts.find((p) => p.id === Number(id));

  if (!post) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>找不到此貼文</Typography>
      </Box>
    );
  }

  const event = post.eventId ? mockEvents.find((e) => e.id === post.eventId) : null;
  const isOwner = user && user.id === post.userId;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1a237e" }}>
          文章詳細
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Paper sx={{ borderRadius: 3, p: 3, flex: 1 }}>
            {/* Edit button */}
            {isOwner && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  sx={{ textTransform: "none", color: "#1a237e" }}
                >
                  編輯貼文
                </Button>
              </Box>
            )}

            {/* Rating */}
            {post.rating > 0 && (
              <Box sx={{ display: "flex", gap: 0.3, mb: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon
                    key={s}
                    sx={{ fontSize: 28, color: s <= post.rating ? "#ffc107" : "#e0e0e0" }}
                  />
                ))}
              </Box>
            )}

            {/* Content */}
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
              {post.content}
            </Typography>

            {/* Images */}
            {post.images?.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                {post.images.map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    sx={{ width: 200, height: 200, borderRadius: 2, objectFit: "cover" }}
                  />
                ))}
              </Box>
            )}

            {/* Author */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
              <Avatar
                src={post.userAvatar}
                sx={{ width: 32, height: 32, cursor: "pointer" }}
                onClick={() => navigate(`/profile/${post.userId}`)}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {post.userName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                {post.createdAt}
              </Typography>
            </Box>
          </Paper>

          {/* Event info sidebar */}
          {event && (
            <Paper
              sx={{ borderRadius: 3, p: 3, width: 280, flexShrink: 0, cursor: "pointer" }}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                {event.title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 14, color: "#666" }} />
                <Typography variant="body2" color="text.secondary">
                  {event.date} {event.time}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 14, color: "#666" }} />
                <Typography variant="body2" color="text.secondary">
                  {event.location}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
