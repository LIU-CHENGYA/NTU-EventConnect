import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { eventsApi } from "../api";
import { tokens } from "../theme";

const STATUS_COLOR = {
  success: "success",
  waitlist: "warning",
  cancelled: "default",
};

export default function EventRegistrationsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [event, setEvent] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    if (!user.isAdmin) { setLoading(false); return; }
    let live = true;
    Promise.all([
      eventsApi.get(Number(id)).catch(() => null),
      eventsApi.registrations(Number(id)).catch((e) => { throw e; }),
    ]).then(([ev, regs]) => {
      if (!live) return;
      setEvent(ev);
      setRows(regs || []);
      setLoading(false);
    }).catch(() => { if (live) { setError(t("admin.loadFailed")); setLoading(false); } });
    return () => { live = false; };
  }, [id, user, ready, navigate, t]);

  if (!ready) return null;
  if (!user) return null;
  if (!user.isAdmin) {
    return (
      <Box sx={{ p: 6, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography sx={{ fontSize: tokens.fontSize.subtitle, color: tokens.color.textSecondary }}>{t("admin.adminOnly")}</Typography>
      </Box>
    );
  }
  if (loading) return <Box sx={{ p: 6, textAlign: "center" }}>{t("common.loading")}</Box>;

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <IconButton onClick={() => navigate("/profile")} sx={{ color: tokens.color.text }} aria-label={t("admin.backToProfile")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: tokens.color.navy }}>
            {t("admin.registrationsTitle")}
          </Typography>
        </Box>

        {event && (
          <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 700, color: tokens.color.text, mb: 0.5 }}>
            {event.title}
          </Typography>
        )}
        <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary, mb: 2 }}>
          {t("admin.totalRegistrations", { count: rows.length })}
        </Typography>

        {error && <Typography sx={{ color: tokens.color.heart, fontSize: tokens.fontSize.caption, mb: 2 }}>{error}</Typography>}

        {rows.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: "12px" }}>
            <Typography sx={{ color: tokens.color.textSecondary }}>{t("admin.noRegistrations")}</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: tokens.shadow.pill }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: tokens.color.bg } }}>
                  <TableCell>{t("admin.regName")}</TableCell>
                  <TableCell>{t("admin.regStudentId")}</TableCell>
                  <TableCell>{t("admin.regEmail")}</TableCell>
                  <TableCell>{t("admin.regDepartment")}</TableCell>
                  <TableCell>{t("admin.regSession")}</TableCell>
                  <TableCell>{t("admin.regStatus")}</TableCell>
                  <TableCell>{t("admin.regTime")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.registration_id}>
                    <TableCell>{r.user_name || "-"}</TableCell>
                    <TableCell>{r.student_id || "-"}</TableCell>
                    <TableCell>{r.user_email || "-"}</TableCell>
                    <TableCell>{r.department || "-"}</TableCell>
                    <TableCell>{r.session_name || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`event.statusFilter.${r.status}`, r.status)}
                        color={STATUS_COLOR[r.status] || "default"}
                      />
                    </TableCell>
                    <TableCell>{(r.registered_at || "").slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
