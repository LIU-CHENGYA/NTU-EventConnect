import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, Button, TextField, RadioGroup, Radio, FormControlLabel, IconButton, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

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
    if (event) navigate(`/events/${event.id}`);
    else navigate("/profile");
  };

  const handleSaveDraft = () => {
    alert("草稿已儲存！（Mock）");
    navigate("/profile");
  };

  const cardSx = {
    borderRadius: "20px",
    p: 3,
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };
  const fieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg },
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
            {event ? "寫評論" : "發表文章"}
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Avatar src={user.avatar} sx={{ width: 52, height: 52 }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
          {/* Left: content */}
          <Paper sx={{ ...cardSx, flex: 1 }}>
            {event && (
              <Box sx={{ mb: 2, display: "flex", gap: 0.5 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton
                    key={star} size="small"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    {star <= (hoverRating || rating)
                      ? <StarIcon sx={{ color: tokens.color.star, fontSize: 32 }} />
                      : <StarBorderIcon sx={{ color: tokens.color.border, fontSize: 32 }} />}
                  </IconButton>
                ))}
              </Box>
            )}

            <TextField
              fullWidth multiline rows={8}
              placeholder="文字敘述..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={fieldSx}
            />
            <Typography sx={{ fontSize: 12, color: tokens.color.placeholder, mt: 0.5 }}>
              字數：{content.length}
            </Typography>

            <Box
              sx={{
                border: `2px dashed ${tokens.color.border}`,
                borderRadius: "12px",
                p: 3, textAlign: "center", cursor: "pointer", mt: 2,
                bgcolor: tokens.color.bg,
                "&:hover": { borderColor: tokens.color.navy },
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 32, color: tokens.color.placeholder }} />
              <Typography sx={{ fontSize: 13, color: tokens.color.textSecondary }}>
                + 新增圖片
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.color.text }}>權限：</Typography>
              <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <FormControlLabel value="public" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>公開</Typography>} />
                <FormControlLabel value="private" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>私人</Typography>} />
                <FormControlLabel value="group" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>僅限群組</Typography>} />
              </RadioGroup>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSaveDraft}
                sx={{
                  flex: 1, textTransform: "none",
                  borderRadius: "27px", height: 54, fontSize: 15,
                  borderColor: tokens.color.border, color: tokens.color.text,
                }}
              >
                儲存草稿
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!content.trim()}
                sx={{
                  flex: 1,
                  bgcolor: tokens.color.black, color: "#fff",
                  textTransform: "none",
                  borderRadius: "27px", height: 54, fontSize: 15, fontWeight: 600,
                  "&:hover": { bgcolor: tokens.color.navyDark },
                }}
              >
                發布
              </Button>
            </Box>
          </Paper>

          {/* Right: event info */}
          {event && (
            <Paper sx={{ ...cardSx, width: 280, flexShrink: 0 }}>
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
