import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, Button, Avatar, IconButton, Divider } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import { eventsApi, postsApi, usersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import { translateTag } from "../i18n/tagLabels";
import { eventHasFutureSession } from "../utils/sessionTime";
import ImageLightbox from "../components/ImageLightbox";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const REVIEW_PAGE_SIZE = 10;
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myRegs, setMyRegs] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);

  // Fetch the user's registrations so we can show "已報名" on the CTA button.
  useEffect(() => {
    if (!user) { setMyRegs([]); return; }
    usersApi.myRegistrations().then(setMyRegs).catch(() => setMyRegs([]));
  }, [user, id]);

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
  }, [id, i18n.language]);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}><Typography>{t("common.loading")}</Typography></Box>;
  }
  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>{t("event.notFound")}</Typography>
        <Button onClick={() => navigate("/")}>{t("common.backToHome")}</Button>
      </Box>
    );
  }

  const sessionParam = searchParams.get("session");
  const displaySession = (() => {
    const sessions = event.sessions || [];
    if (!sessions.length) return null;
    const sid = sessionParam ? Number(sessionParam) : null;
    return (sid ? sessions.find((s) => s.id === sid) : null) ?? sessions[0];
  })();
  const ds = displaySession || {};
  const displayDate = ds.date || event.date;
  const displayTime = ds.time_range || event.time;
  const displayLocation = ds.location || event.location;
  const displayCapacity = ds.capacity ?? event.capacity;
  const displayRemaining = ds.remaining_slots ?? event.remainingSlots;
  const displayRegStart = ds.registration_start || event.registrationStart;
  const displayRegEnd = ds.registration_end || event.registrationEnd;
  const displayMeal = (ds.meal || "").trim() || event.meal;

  // True if the user already has a non-cancelled registration for this session.
  const isRegistered = myRegs.some((r) => {
    if (displaySession?.id) return r.session_id === displaySession.id && r.status !== "cancelled";
    return r.event_id === Number(id) && r.status !== "cancelled";
  });

  const Card = ({ children, sx }) => (
    <Box sx={{ bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill, ...sx }}>
      {children}
    </Box>
  );

  return (
    <>
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 } }}>
        {/* Breadcrumb header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ border: "1.5px solid #333", width: 44, height: 44 }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: tokens.fontSize.heading }, fontWeight: 700, color: "#000" }}>
            {t("event.details")}
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
              <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.subtitle, mb: 1 }}>{t("event.content")}</Typography>
              <Typography sx={{ fontSize: tokens.fontSize.body, color: "#444", lineHeight: 1.8, mb: 2, whiteSpace: "pre-wrap" }}>
                {(event.content || "").replace(/\\n/g, "\n")}
              </Typography>
              {event.instructor && (
                <>
                  <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.body, mb: 0.5 }}>{t("event.instructor")}</Typography>
                  <Typography sx={{ fontSize: tokens.fontSize.body, color: "#444", mb: 2 }}>{event.instructor}</Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.subtitle }}>{t("event.commentsAndShares", { count: reviews.length })}</Typography>
                {user && (
                  <Button
                    onClick={() => navigate("/board")}
                    sx={{
                      textTransform: "none", color: tokens.color.navy,
                      border: `1px solid ${tokens.color.navy}`,
                      bgcolor: "transparent",
                      borderRadius: "20px", px: 2, fontSize: tokens.fontSize.body,
                      "&:hover": { bgcolor: "#EEF2FB" },
                    }}
                    title={t("event.commentsLegacyTooltip")}
                  >
                    {t("event.shareOnBoard")}
                  </Button>
                )}
              </Box>
              {reviews.map((r, idx) => (
                <Box key={r.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Avatar src={r.userAvatar} sx={{ width: 36, height: 36, cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${r.userId}`)} />
                    <Box>
                      <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600 }}>{r.userName}</Typography>
                      <Box sx={{ display: "flex" }}>
                        {[1,2,3,4,5].map(s => (
                          <StarIcon key={s} sx={{ fontSize: 14, color: s <= r.rating ? tokens.color.star : "#e0e0e0" }} />
                        ))}
                      </Box>
                    </Box>
                    <Typography sx={{ ml: "auto", fontSize: tokens.fontSize.caption, color: "#999" }}>{r.createdAt}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: tokens.fontSize.body, mb: 1 }}>{r.content}</Typography>
                  {r.images?.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {r.images.map((img, i) => (
                        <Box key={i} component="img" src={img}
                          onClick={(e) => { e.stopPropagation(); setLightboxImages(r.images); setLightboxIndex(i); setLightboxOpen(true); }}
                          sx={{ width: 90, height: 90, borderRadius: 2, objectFit: "cover", cursor: "pointer", "&:hover": { opacity: 0.85 } }} />
                      ))}
                    </Box>
                  )}
                  {idx < reviews.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
              {reviews.length === 0 && (
                <Typography sx={{ textAlign: "center", color: "#999", py: 2 }}>{t("event.noReviews")}</Typography>
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
                    {loadingMore ? t("common.loading") : t("event.loadMoreReviews")}
                  </Button>
                </Box>
              )}
            </Card>
          </Box>

          {/* RIGHT column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Title pill */}
            <Card sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 700, color: "#000", flex: 1 }}>
                {event.title}
              </Typography>
              <Box sx={{ bgcolor: "#1e1e1e", color: "#fffefe", px: 1.5, py: 0.5, borderRadius: "20px", fontSize: tokens.fontSize.caption, ml: 1 }}>
                {translateTag(event.category, i18n.language)}
              </Box>
            </Card>

            {/* Info card with details */}
            <Card sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Section icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} title={t("event.dateTime")}
                lines={[displayDate, displayTime]} />
              <Section icon={<PlaceIcon sx={{ fontSize: 18 }} />} title={t("event.location")} lines={[displayLocation]} />
              <Section icon={<PersonIcon sx={{ fontSize: 18 }} />} title={t("event.organizer")}
                lines={[event.organizer, t("event.contact", { name: event.organizerContact })]} />
              <Section icon={<PhoneIcon sx={{ fontSize: 18 }} />} title="" lines={[event.contactPhone]} />

              <Divider sx={{ my: 0.5 }} />
              <Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.registrationPeriod")}：{displayRegStart} ~ {displayRegEnd}</Typography>
              <Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.registrationType")}：{event.registrationType}</Typography>
              <Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.targetAudience")}：{event.targetAudience}</Typography>
              <Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.slots", { remaining: displayRemaining, total: displayCapacity })}</Typography>
              {displayMeal && displayMeal !== "無" && (
                <Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.meal")}：{displayMeal}</Typography>
              )}

              {(() => {
                // CTA gating mirrors backend `session_has_ended` (time-aware):
                // parses raw_session_time / time_range so a same-day session
                // that already ended this morning correctly disables the
                // button instead of staying clickable until midnight.
                const sessions = event.sessions || [];
                const hasFuture = eventHasFutureSession(event);
                const ended = sessions.length > 0 && !hasFuture;
                const regNotStarted = displayRegStart && new Date(displayRegStart + "T00:00:00") > new Date();
                const disabled = ended || isRegistered || regNotStarted;
                return (
                  <Button
                    onClick={() => {
                      if (disabled) return;
                      if (!user) { navigate("/login"); return; }
                      navigate(`/events/${event.id}/register${displaySession?.id ? `?session=${displaySession.id}` : ""}`);
                    }}
                    disabled={disabled}
                    sx={{
                      mt: 1.5,
                      bgcolor: disabled ? "#9aa0a6" : "#1e1e1e",
                      color: "#fffefe",
                      borderRadius: "30px", height: 54, fontSize: tokens.fontSize.title, fontWeight: 700,
                      textTransform: "none",
                      "&:hover": { bgcolor: disabled ? "#9aa0a6" : "#000" },
                      "&.Mui-disabled": { bgcolor: "#9aa0a6", color: "#fffefe" },
                    }}
                  >
                    {ended ? t("event.endedLabel") : regNotStarted ? t("event.regNotStarted") : isRegistered ? t("event.registered") : t("event.registerNow")}
                  </Button>
                );
              })()}
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
    <ImageLightbox
      key={lightboxImages.join(",")}
      images={lightboxImages}
      initialIndex={lightboxIndex}
      open={lightboxOpen}
      onClose={() => setLightboxOpen(false)}
    />
    </>
  );
}

function Section({ icon, title, lines }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
      <Box sx={{ color: "#666", mt: "2px" }}>{icon}</Box>
      <Box>
        {title && <Typography sx={{ fontSize: tokens.fontSize.caption, color: "#999" }}>{title}</Typography>}
        {lines.map((l, i) => <Typography key={i} sx={{ fontSize: tokens.fontSize.body, color: "#222" }}>{l}</Typography>)}
      </Box>
    </Box>
  );
}
