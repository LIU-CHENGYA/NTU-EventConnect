import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Avatar, Button, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { postsApi, eventsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    postsApi.get(Number(id)).then(async (p) => {
      if (!live) return;
      setPost(p);
      if (p?.eventId) {
        const e = await eventsApi.get(p.eventId).catch(() => null);
        if (live) setEvent(e);
      }
      setLoading(false);
    }).catch(() => {
      if (live) { setPost(null); setLoading(false); }
    });
    return () => { live = false; };
  }, [id]);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}><Typography>載入中...</Typography></Box>;
  }
  if (!post) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography>找不到此貼文</Typography>
      </Box>
    );
  }

  const isOwner = user && user.id === post.userId;
  const userName = post.userName;
  const userAvatar = post.userAvatar;
  const createdAt = (post.createdAt || "").slice(0, 10);

  const cardSx = {
    borderRadius: "20px",
    p: 3,
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.logo, fontStyle: "italic", fontSize: 32, color: tokens.color.navy }}>
            文章詳細
          </Typography>
          {user && (
            <Box sx={{ ml: "auto" }}>
              <Avatar src={user.avatar} sx={{ width: 52, height: 52 }} />
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
          <Paper sx={{ ...cardSx, flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
              {user && (
                <IconButton
                  onClick={async () => {
                    const next = !post.isBookmarked;
                    setPost({ ...post, isBookmarked: next });
                    try {
                      if (next) await postsApi.bookmark(post.id);
                      else await postsApi.unbookmark(post.id);
                    } catch {
                      setPost({ ...post, isBookmarked: !next });
                    }
                  }}
                  sx={{ color: post.isBookmarked ? "#e91e63" : tokens.color.text }}
                >
                  {post.isBookmarked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              )}
              {isOwner && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  sx={{ textTransform: "none", color: tokens.color.navy, fontWeight: 600 }}
                >
                  編輯貼文
                </Button>
              )}
            </Box>

            {/* Author */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
              <Avatar
                src={userAvatar}
                sx={{ width: 44, height: 44, cursor: "pointer" }}
                onClick={() => navigate(`/profile/${post.userId}`)}
              />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.color.text }}>
                  {userName}
                </Typography>
                <Typography sx={{ fontSize: 12, color: tokens.color.placeholder }}>
                  {createdAt}
                </Typography>
              </Box>
            </Box>

            {post.rating > 0 && (
              <Box sx={{ display: "flex", gap: 0.3, mb: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon
                    key={s}
                    sx={{ fontSize: 28, color: s <= post.rating ? tokens.color.star : tokens.color.border }}
                  />
                ))}
              </Box>
            )}

            <Typography sx={{ fontSize: 15, lineHeight: 1.85, color: tokens.color.text, mb: 2, whiteSpace: "pre-wrap" }}>
              {post.content}
            </Typography>

            {post.images?.length > 0 && (
              <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", mt: 1 }}>
                {post.images.map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    sx={{ width: 200, height: 200, borderRadius: "12px", objectFit: "cover" }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* Event info sidebar */}
          {event && (
            <Paper
              sx={{ ...cardSx, width: 280, flexShrink: 0, cursor: "pointer" }}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <Box
                component="img"
                src={event.image}
                sx={{ width: "100%", height: 140, borderRadius: "12px", objectFit: "cover", mb: 1.5 }}
              />
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.color.text, mb: 1 }}>
                {event.title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.7 }}>
                <CalendarTodayIcon sx={{ fontSize: 14, color: tokens.color.textSecondary }} />
                <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }}>
                  {event.date} {event.time}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 14, color: tokens.color.textSecondary }} />
                <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary }}>
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
