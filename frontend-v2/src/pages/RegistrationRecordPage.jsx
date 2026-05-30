import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Collapse, Divider, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTranslation } from "react-i18next";
import { usersApi } from "../api";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import CancelConfirmDialog from "../components/CancelConfirmDialog";

// Filter values are canonical English keys; display labels come from i18n
// (event.statusFilter.*). Backend `Registration.status` is already English.
const STATUS_FILTERS = ["all", "success", "waitlist", "cancelled"];

export default function RegistrationRecordPage() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null); // registration object pending confirm
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const reload = () => {
    setLoading(true);
    usersApi.myRegistrations()
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    reload();
  }, [user, ready, navigate]);

  if (!ready) return null;
  if (!user) return null;

  const filtered = filter === "all"
    ? registrations
    : registrations.filter((r) => r.status === filter);

  const statusColors = {
    success:   { bg: tokens.color.success.bg, color: tokens.color.success.fg },
    waitlist:  { bg: tokens.color.warning.bg, color: tokens.color.warning.fg },
    cancelled: { bg: tokens.color.danger.bg,  color: tokens.color.danger.fg  },
  };

  const cardSx = {
    borderRadius: "20px",
    mb: 2,
    overflow: "hidden",
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await api.delete(`/api/registrations/${pendingCancel.id}`);
      setPendingCancel(null);
      reload();
    } catch (e) {
      setCancelError(e?.response?.data?.detail || e.message || t("records.cancelFailed"));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: tokens.color.navy }}>
            {t("records.pageTitle")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => (
            <Box
              key={s}
              onClick={() => setFilter(s)}
              sx={{
                px: 1.8, py: "6px", fontSize: tokens.fontSize.body, borderRadius: "8px",
                border: "1px solid #cac4d0",
                bgcolor: filter === s ? "rgba(57,167,255,0.42)" : "#fff",
                color: tokens.color.text, cursor: "pointer",
                fontFamily: "'Roboto',sans-serif", fontWeight: 500,
              }}
            >
              {t(`event.statusFilter.${s}`)}
            </Box>
          ))}
        </Box>

        {loading && <Typography sx={{ textAlign: "center", py: 4 }}>{t("common.loading")}</Typography>}

        {!loading && filtered.map((reg) => {
          const isExpanded = expandedId === reg.id;
          const statusKey = reg.status;
          return (
            <Paper key={reg.id} sx={cardSx}>
              <Box
                sx={{
                  display: "flex", alignItems: "center", p: 2.2,
                  cursor: "pointer", "&:hover": { bgcolor: tokens.color.bg },
                }}
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              >
                <Box
                  component="img"
                  src={reg.event_image || "/default-event.svg"}
                  onError={(e) => { e.currentTarget.src = "/default-event.svg"; }}
                  sx={{ width: 72, height: 72, borderRadius: "12px", objectFit: "cover", mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text }}>
                    {reg.event_title}
                  </Typography>
                  <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary, mt: 0.3 }}>
                    {reg.session_name} · {reg.date}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 1.5, py: "5px", borderRadius: "20px",
                    bgcolor: statusColors[statusKey]?.bg,
                    color: statusColors[statusKey]?.color,
                    fontSize: tokens.fontSize.caption, fontWeight: 700, mr: 1,
                  }}
                >
                  {t(`event.status.${statusKey}`, { defaultValue: statusKey })}
                </Box>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={isExpanded}>
                <Divider sx={{ borderColor: tokens.color.bg }} />
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {[
                      [t("records.registeredAt"), (reg.registered_at || "").slice(0, 10)],
                      [t("records.activityLocation"), reg.location || "—"],
                      [t("records.activityDate"), reg.date || "—"],
                      [t("records.session"), reg.session_name || "—"],
                    ].map(([k, v]) => (
                      <Box key={k}>
                        <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>{k}</Typography>
                        <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.text, fontWeight: 500 }}>{v}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/events/${reg.event_id}`)}
                      sx={{
                        textTransform: "none", borderRadius: "22px", height: 44, px: 2.5,
                        borderColor: tokens.color.border, color: tokens.color.text, fontSize: tokens.fontSize.body,
                      }}
                    >
                      {t("records.viewActivity")}
                    </Button>
                    {reg.status !== "cancelled" && (() => {
                      // Past events: cancellation is rejected by BE (409) so
                      // we hide the button entirely instead of showing a
                      // disabled "已結束" pill that reads as "broken" to users.
                      const isPast = (() => {
                        if (!reg.date) return false;
                        const d = new Date(reg.date);
                        if (Number.isNaN(d.getTime())) return false;
                        const endOfDay = new Date(d);
                        endOfDay.setHours(23, 59, 59, 999);
                        return Date.now() > endOfDay.getTime();
                      })();
                      if (isPast) return null;
                      return (
                        <Button
                          variant="contained"
                          onClick={() => setPendingCancel(reg)}
                          sx={{
                            textTransform: "none", borderRadius: "22px", height: 44, px: 2.5,
                            bgcolor: tokens.color.black,
                            color: "#fff", fontSize: tokens.fontSize.body, fontWeight: 600,
                            "&:hover": { bgcolor: tokens.color.navyDark },
                          }}
                        >
                          {t("records.cancelRegistration")}
                        </Button>
                      );
                    })()}
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          );
        })}

        {!loading && filtered.length === 0 && (
          <Typography sx={{ textAlign: "center", py: 6, color: tokens.color.placeholder }}>
            {t("records.noMatching")}
          </Typography>
        )}
      </Box>

      <CancelConfirmDialog
        open={!!pendingCancel}
        loading={cancelLoading}
        onClose={() => { if (!cancelLoading) { setPendingCancel(null); setCancelError(""); } }}
        onConfirm={handleConfirmCancel}
        event={pendingCancel ? {
          title: pendingCancel.event_title,
          sessionName: pendingCancel.session_name,
          image: pendingCancel.event_image || "/default-event.svg",
          date: pendingCancel.date,
          location: pendingCancel.location,
        } : null}
      />
      {cancelError && (
        <Box
          sx={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            bgcolor: "#FF4D4F", color: "#fff", px: 2.5, py: 1, borderRadius: 2,
            fontSize: tokens.fontSize.body, zIndex: 1500, boxShadow: 4,
          }}
        >
          {cancelError}
        </Box>
      )}
    </Box>
  );
}
