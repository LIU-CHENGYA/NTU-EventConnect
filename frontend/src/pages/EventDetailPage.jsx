import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Avatar, IconButton, Divider } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import StarIcon from "@mui/icons-material/Star";
import { eventsApi, postsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const REVIEW_PAGE_SIZE = 10;
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapReview = (p) => ({
    id: p.id,
    eventId: p.eventId,
    userId: p.userId,
    userName: p.userName,
    userAvatar: p.userAvatar,
    rating: p.rating,
    content: p.content,
    images: p.images,
    createdAt: (p.createdAt || "").slice(0, 10),
  });

  useEffect(() => {
    let live = true;
    setLoading(true);
    setReviewPage(1);
    Promise.all([
      eventsApi.get(Number(id)).catch(() => null),
      postsApi.list({ event_id: Number(id), page: 1, size: REVIEW_PAGE_SIZE }).catch(() => []),
    ]).then(([e, ps]) => {
      if (!live) return;
      setEvent(e);
      setHasMoreReviews(ps.length === REVIEW_PAGE_SIZE);
      setReviews(ps.map(mapReview));
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}><Typography>載入中...</Typography></Box>;
  }
  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>找不到此活動</Typography>
        <Button onClick={() => navigate("/")}>返回首頁</Button>
      </Box>
    );
  }

  const Card = ({ children, sx }) => (
    <Box sx={{ bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill, ...sx }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: 4 }}>
        {/* Breadcrumb header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ border: "1.5px solid #333", width: 38, height: 38 }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.logo, fontStyle: "italic", fontSize: 28, color: "#000" }}>
            活動詳情
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" }, gap: 3 }}>
          {/* LEFT column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Main image */}
            <Card sx={{ overflow: "hidden", height: 320 }}>
              <img
                src={event.image}
                alt={event.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Card>

            {/* Content card */}
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1 }}>活動內容</Typography>
              <Typography sx={{ fontSize: 14, color: "#444", lineHeight: 1.8, mb: 2 }}>
                {event.content}
              </Typography>
              {event.instructor && (
                <>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.5 }}>授課人</Typography>
                  <Typography sx={{ fontSize: 14, color: "#444", mb: 2 }}>{event.instructor}</Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>評論與分享 ({reviews.length})</Typography>
                {user && (
                  <Button
                    onClick={() => navigate(`/posts/create?eventId=${event.id}`)}
                    sx={{
                      textTransform: "none", color: "#fff", bgcolor: tokens.color.navy,
                      borderRadius: "20px", px: 2, fontSize: 13,
                      "&:hover": { bgcolor: tokens.color.navyDark },
                    }}
                  >
                    寫評論
                  </Button>
                )}
              </Box>
              {reviews.map((r, idx) => (
                <Box key={r.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Avatar src={r.userAvatar} sx={{ width: 36, height: 36, cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${r.userId}`)} />
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{r.userName}</Typography>
                      <Box sx={{ display: "flex" }}>
                        {[1,2,3,4,5].map(s => (
                          <StarIcon key={s} sx={{ fontSize: 14, color: s <= r.rating ? tokens.color.star : "#e0e0e0" }} />
                        ))}
                      </Box>
                    </Box>
                    <Typography sx={{ ml: "auto", fontSize: 12, color: "#999" }}>{r.createdAt}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, mb: 1 }}>{r.content}</Typography>
                  {r.images?.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {r.images.map((img, i) => (
                        <Box key={i} component="img" src={img}
                          sx={{ width: 90, height: 90, borderRadius: 2, objectFit: "cover" }} />
                      ))}
                    </Box>
                  )}
                  {idx < reviews.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
              {reviews.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", py: 2 }}>尚無評論</Typography>
              )}
              {hasMoreReviews && (
                <Box sx={{ textAlign: "center", mt: 1 }}>
                  <Button
                    disabled={loadingMore}
                    onClick={async () => {
                      setLoadingMore(true);
                      const next = reviewPage + 1;
                      try {
                        const ps = await postsApi.list({
                          event_id: Number(id), page: next, size: REVIEW_PAGE_SIZE,
                        });
                        setReviews((prev) => [...prev, ...ps.map(mapReview)]);
                        setHasMoreReviews(ps.length === REVIEW_PAGE_SIZE);
                        setReviewPage(next);
                      } catch {
                        setHasMoreReviews(false);
                      } finally {
                        setLoadingMore(false);
                      }
                    }}
                    sx={{ textTransform: "none", color: tokens.color.navy }}
                  >
                    {loadingMore ? "載入中..." : "載入更多評論"}
                  </Button>
                </Box>
              )}
            </Card>
          </Box>

          {/* RIGHT column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Title pill */}
            <Card sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#000", flex: 1 }}>
                {event.title}
              </Typography>
              <Box sx={{ bgcolor: "#1e1e1e", color: "#fffefe", px: 1.5, py: 0.5, borderRadius: "20px", fontSize: 12, ml: 1 }}>
                {event.category}
              </Box>
            </Card>

            {/* Info card with image + details */}
            <Card sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Box component="img" src={event.image}
                sx={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "10px", mb: 1 }} />

              <Section icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} title="日期時間"
                lines={[event.date, event.time]} />
              <Section icon={<PlaceIcon sx={{ fontSize: 18 }} />} title="地點" lines={[event.location]} />
              <Section icon={<PersonIcon sx={{ fontSize: 18 }} />} title="承辦"
                lines={[event.organizer, `聯絡人：${event.organizerContact}`]} />
              <Section icon={<PhoneIcon sx={{ fontSize: 18 }} />} title="" lines={[event.contactPhone]} />

              <Divider sx={{ my: 0.5 }} />
              <Typography sx={{ fontSize: 13 }}>報名時間：{event.registrationStart} ~ {event.registrationEnd}</Typography>
              <Typography sx={{ fontSize: 13 }}>報名類型：{event.registrationType}</Typography>
              <Typography sx={{ fontSize: 13 }}>參加對象：{event.targetAudience}</Typography>
              <Typography sx={{ fontSize: 13 }}>名額：{event.remainingSlots}/{event.capacity}</Typography>
              {event.meal && event.meal !== "無" && (
                <Typography sx={{ fontSize: 13 }}>用餐：{event.meal}</Typography>
              )}

              <Button
                onClick={() => navigate(`/events/${event.id}/register`)}
                sx={{
                  mt: 1.5, bgcolor: "#1e1e1e", color: "#fffefe",
                  borderRadius: "30px", height: 54, fontSize: 22, fontWeight: 700,
                  textTransform: "none", "&:hover": { bgcolor: "#000" },
                }}
              >
                立即報名
              </Button>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function Section({ icon, title, lines }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
      <Box sx={{ color: "#666", mt: "2px" }}>{icon}</Box>
      <Box>
        {title && <Typography sx={{ fontSize: 12, color: "#999" }}>{title}</Typography>}
        {lines.map((l, i) => <Typography key={i} sx={{ fontSize: 14, color: "#222" }}>{l}</Typography>)}
      </Box>
    </Box>
  );
}
