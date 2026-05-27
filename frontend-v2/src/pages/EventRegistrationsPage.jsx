import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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
    let live = true;
    Promise.all([
      eventsApi.get(Number(id)).catch(() => null),
      eventsApi.registrations(Number(id)).catch((e) => { throw e; }),
    ]).then(([ev, regs]) => {
      if (!live) return;
      setEvent(ev);
      setRows(regs || []);
      setLoading(false);
    }).catch((e) => {
      if (!live) return;
      // The backend authorizes by ownership: 403 means the viewer is not the
      // event's manager (creator). Anything else is a generic load failure.
      setError(e?.response?.status === 403 ? t("admin.notOwner") : t("admin.loadFailed"));
      setLoading(false);
    });
    return () => { live = false; };
  }, [id, user, ready, navigate, t]);

  if (!ready) return null;
  if (!user) return null;
  if (loading) return <Box sx={{ p: 6, textAlign: "center" }}>{t("common.loading")}</Box>;

  // Build a UTF-8 (BOM) CSV from the same columns shown in the table and
  // trigger a download. CSV opens natively in Excel; BOM keeps Chinese intact.
  const handleExport = () => {
    const headers = [
      t("admin.regName"), t("admin.regStudentId"), t("admin.regEmail"),
      t("admin.regDepartment"), t("admin.regSession"), t("admin.regStatus"), t("admin.regTime"),
    ];
    const escape = (v) => {
      let s = String(v ?? "");
      // Neutralize CSV/formula injection: cells starting with =,+,-,@ (or
      // control chars) are treated as formulas by Excel — prefix with a quote.
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = rows.map((r) => [
      r.user_name || "",
      r.student_id || "",
      r.user_email || "",
      r.department || "",
      r.session_name || "",
      t(`event.statusFilter.${r.status}`, r.status),
      (r.registered_at || "").slice(0, 10),
    ].map(escape).join(","));
    const csv = "﻿" + [headers.map(escape).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = (event?.title || "registrations").replace(/[/\\:*?"<>|]/g, "_");
    a.download = `${safeTitle}_${t("admin.registrationsTitle")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          <Box sx={{ flex: 1 }} />
          {rows.length > 0 && (
            <Button
              onClick={handleExport}
              startIcon={<FileDownloadIcon />}
              variant="contained"
              sx={{
                textTransform: "none", borderRadius: "8px",
                bgcolor: tokens.color.navy, "&:hover": { bgcolor: tokens.color.navyDark },
                fontSize: tokens.fontSize.body,
              }}
            >
              {t("admin.exportExcel")}
            </Button>
          )}
        </Box>

        {error ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: "12px" }}>
            <Typography sx={{ color: tokens.color.heart, fontSize: tokens.fontSize.subtitle }}>{error}</Typography>
          </Paper>
        ) : (
        <>
        {event && (
          <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 700, color: tokens.color.text, mb: 0.5 }}>
            {event.title}
          </Typography>
        )}
        <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary, mb: 2 }}>
          {t("admin.totalRegistrations", { count: rows.length })}
        </Typography>

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
        </>
        )}
      </Box>
    </Box>
  );
}
