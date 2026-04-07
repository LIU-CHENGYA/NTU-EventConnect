import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, TextField, RadioGroup, Radio, FormControlLabel, IconButton,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { mockPosts, mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const post = mockPosts.find((p) => p.id === Number(id));

  const [rating, setRating] = useState(post?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(post?.content || "");
  const [visibility, setVisibility] = useState(post?.visibility || "public");

  if (!user) { navigate("/login"); return null; }
  if (!post) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>找不到此貼文</Typography>
      </Box>
    );
  }

  const event = post.eventId ? mockEvents.find((e) => e.id === post.eventId) : null;

  const handleSave = () => {
    alert("貼文已更新！（Mock）");
    navigate(`/posts/${post.id}`);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1a237e" }}>
          編輯文章
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Paper sx={{ borderRadius: 3, p: 3, flex: 1 }}>
            {/* Star rating */}
            {event && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <IconButton
                      key={star}
                      size="small"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      {star <= (hoverRating || rating) ? (
                        <StarIcon sx={{ color: "#ffc107", fontSize: 32 }} />
                      ) : (
                        <StarBorderIcon sx={{ color: "#ccc", fontSize: 32 }} />
                      )}
                    </IconButton>
                  ))}
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              字數：{content.length}
            </Typography>

            {/* Existing images */}
            {post.images?.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                {post.images.map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    sx={{ width: 100, height: 100, borderRadius: 2, objectFit: "cover" }}
                  />
                ))}
              </Box>
            )}

            {/* Upload more */}
            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
                cursor: "pointer",
                mt: 2,
                "&:hover": { borderColor: "#1a237e" },
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 24, color: "#999" }} />
              <Typography variant="caption" color="text.secondary">
                + 新增圖片
              </Typography>
            </Box>

            {/* Visibility */}
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>權限：</Typography>
              <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <FormControlLabel value="public" control={<Radio size="small" />} label="公開" />
                <FormControlLabel value="private" control={<Radio size="small" />} label="私人" />
                <FormControlLabel value="group" control={<Radio size="small" />} label="僅限群組" />
              </RadioGroup>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/posts/${post.id}`)}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                取消
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  bgcolor: "#1a237e",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#0d1754" },
                }}
              >
                儲存
              </Button>
            </Box>
          </Paper>

          {/* Event info */}
          {event && (
            <Paper sx={{ borderRadius: 3, p: 3, width: 280, flexShrink: 0 }}>
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
