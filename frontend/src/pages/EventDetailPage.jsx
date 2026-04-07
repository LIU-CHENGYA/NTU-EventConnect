import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Avatar, Divider, Grid, Paper, IconButton, Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import StarIcon from "@mui/icons-material/Star";
import { mockEvents, mockReviews } from "../mock/data";
import { useAuth } from "../context/AuthContext";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const event = mockEvents.find((e) => e.id === Number(id));
  const reviews = mockReviews.filter((r) => r.eventId === Number(id));

  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>找不到此活動</Typography>
        <Button onClick={() => navigate("/")}>返回首頁</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: 3, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            活動詳情
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left: main content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 3 }}>
              {/* Event image */}
              <Box
                component="img"
                src={event.image}
                alt={event.title}
                sx={{ width: "100%", height: 300, objectFit: "cover" }}
              />

              <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {event.title}
                </Typography>
                {event.sessionName && (
                  <Chip label={event.sessionName} size="small" sx={{ mb: 2 }} />
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#333" }}>
                  活動內容
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
                  {event.content}
                </Typography>

                {event.instructor && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      授課人
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {event.instructor}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>

            {/* Reviews */}
            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  評論與分享 ({reviews.length})
                </Typography>
                {user && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/posts/create?eventId=${event.id}`)}
                    sx={{ textTransform: "none", borderColor: "#1a237e", color: "#1a237e" }}
                  >
                    寫評論
                  </Button>
                )}
              </Box>

              {reviews.map((review) => (
                <Box key={review.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Avatar
                      src={review.userAvatar}
                      sx={{ width: 36, height: 36, cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${review.userId}`)}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {review.userName}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon
                            key={s}
                            sx={{ fontSize: 14, color: s <= review.rating ? "#ffc107" : "#e0e0e0" }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                      {review.createdAt}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {review.content}
                  </Typography>
                  {review.images?.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {review.images.map((img, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={img}
                          sx={{ width: 100, height: 100, borderRadius: 2, objectFit: "cover" }}
                        />
                      ))}
                    </Box>
                  )}
                  {reviews.indexOf(review) < reviews.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}

              {reviews.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  尚無評論
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Right sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ borderRadius: 3, p: 3, mb: 2, position: "sticky", top: 80 }}>
              {/* Bookmark */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <IconButton>
                  <BookmarkBorderIcon />
                </IconButton>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                活動資訊
              </Typography>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: "#666", mt: 0.3 }} />
                <Box>
                  <Typography variant="body2">{event.date}</Typography>
                  <Typography variant="caption" color="text.secondary">{event.time}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                <PlaceIcon sx={{ fontSize: 18, color: "#666", mt: 0.3 }} />
                <Typography variant="body2">{event.location}</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                承辦資訊
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: "#666" }} />
                <Typography variant="body2">{event.organizer}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: "#666" }} />
                <Typography variant="body2">聯絡人：{event.organizerContact}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <PhoneIcon sx={{ fontSize: 18, color: "#666" }} />
                <Typography variant="body2">{event.contactPhone}</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                報名資訊
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                報名時間：{event.registrationStart} ~ {event.registrationEnd}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                報名類型：{event.registrationType}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                參加對象：{event.targetAudience}
              </Typography>
              {event.restrictions && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  限制條件：{event.restrictions}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                名額：{event.remainingSlots}/{event.capacity}
              </Typography>
              {event.meal && event.meal !== "無" && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  用餐：{event.meal}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/events/${event.id}/register`)}
                sx={{
                  mt: 2,
                  bgcolor: "#1a237e",
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#0d1754" },
                }}
              >
                立即報名
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
