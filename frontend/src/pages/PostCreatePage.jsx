import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, Button, TextField, RadioGroup, Radio, FormControlLabel, IconButton,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";

export default function PostCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const event = eventId ? mockEvents.find((e) => e.id === Number(eventId)) : null;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");

  if (!user) { navigate("/login"); return null; }

  const handleSubmit = () => {
    if (!content.trim()) return;
    alert("貼文已發布！（Mock）");
    if (event) {
      navigate(`/events/${event.id}`);
    } else {
      navigate("/profile");
    }
  };

  const handleSaveDraft = () => {
    alert("草稿已儲存！（Mock）");
    navigate("/profile");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1a237e" }}>
          {event ? "寫評論" : "發表文章"}
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          {/* Left: content */}
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

            {/* Text content */}
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="文字敘述..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              字數：{content.length}
            </Typography>

            {/* Image upload */}
            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                mt: 2,
                "&:hover": { borderColor: "#1a237e" },
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 32, color: "#999" }} />
              <Typography variant="body2" color="text.secondary">
                + 新增圖片
              </Typography>
            </Box>

            {/* Visibility + actions */}
            <Box sx={{ mt: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>權限：</Typography>
                <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <FormControlLabel value="public" control={<Radio size="small" />} label="公開" />
                  <FormControlLabel value="private" control={<Radio size="small" />} label="私人" />
                  <FormControlLabel value="group" control={<Radio size="small" />} label="僅限群組" />
                </RadioGroup>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSaveDraft}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                儲存草稿
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!content.trim()}
                sx={{
                  bgcolor: "#1a237e",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#0d1754" },
                }}
              >
                發布
              </Button>
            </Box>
          </Paper>

          {/* Right: event info */}
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
