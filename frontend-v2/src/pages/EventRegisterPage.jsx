import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Checkbox, FormControlLabel, Avatar, Chip, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";
import { eventsApi, usersApi } from "../api";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function EventRegisterPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, ready, setUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: user?.name || "",
    studentId: user?.student_id || user?.studentId || "",
    department: user?.department || "",
    email: user?.email || "",
    phone: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      studentId: user.student_id || user.studentId || "",
      department: user.department || "",
      email: user.email || "",
      phone: "",
    });
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    eventsApi.get(Number(id))
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id, user, ready, navigate]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const sessionParam = searchParams.get("session");
  const activeSession = (() => {
    const sessions = event?.sessions || [];
    if (!sessions.length) return null;
    const sid = sessionParam ? Number(sessionParam) : null;
    return (sid ? sessions.find((s) => s.id === sid) : null) ?? sessions[0];
  })();

  const handleSubmit = async () => {
    if (!agreed) return;
    const session = activeSession;
    if (!session) { setError(t("registerPage.noSession")); return; }
    const missingStudentId = !user.studentId && !form.studentId.trim();
    const missingDepartment = !user.department && !form.department.trim();
    if (missingStudentId || missingDepartment) {
      setError(missingStudentId && missingDepartment
        ? "請先輸入學號與系所，才能完成第一次報名綁定。"
        : missingStudentId
          ? "請先輸入學號，才能完成第一次報名綁定。"
          : "請先輸入系所，才能完成第一次報名綁定。"
      );
      return;
    }
    const studentIdVal = form.studentId.trim();
    if (studentIdVal && !/^[A-Za-z]\d{8}$/.test(studentIdVal)) {
      setError("學號格式錯誤：第一碼為英文字母，第二至九碼為數字（共9碼），例：B12345678");
      return;
    }
    try {
      await api.post(`/api/sessions/${session.id}/register`);
      const profilePatch = {};
      // If the profile was missing these fields, persist them after the first successful registration.
      if (!user.studentId && form.studentId.trim()) profilePatch.student_id = form.studentId.trim();
      if (!user.department && form.department.trim()) profilePatch.department = form.department.trim();
      if (Object.keys(profilePatch).length > 0) {
        const updated = await usersApi.updateMe(profilePatch);
        setUser(updated);
      }
      setSubmitted(true);
      setTimeout(() => navigate("/my-registrations"), 1200);
    } catch (e) {
      setError(e?.response?.data?.detail || t("registerPage.failed"));
    }
  };

  if (!ready) return null;
  if (!user) return null;
  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>{t("common.loading")}</Typography></Box>;
  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography>{t("event.notFound")}</Typography>
      </Box>
    );
  }

  const cardSx = {
    borderRadius: "20px",
    p: 3,
    mb: 2.5,
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };
  const labelSx = { fontSize: tokens.fontSize.body, fontWeight: 600, mb: 0.7, color: tokens.color.text };
  const fieldSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg },
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 760, mx: "auto", px: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: tokens.fontSize.heading }, fontWeight: 700, color: tokens.color.navy }}>
            {t("registerPage.pageTitle")}
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Avatar src={user.avatarUrl} sx={{ width: 52, height: 52 }} />
          </Box>
        </Box>

        {submitted ? (
          <Paper sx={{ ...cardSx, textAlign: "center", py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: tokens.color.success.fg, mb: 2 }} />
            <Typography sx={{ fontSize: tokens.fontSize.title, fontWeight: 700, color: tokens.color.success.fg, mb: 1 }}>
              {t("registerPage.success")}
            </Typography>
            <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.placeholder }}>
              {t("registerPage.redirecting")}
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Event info */}
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, mb: 2, color: tokens.color.text }}>
                {t("registerPage.registerActivity")}
              </Typography>
              <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                <Box
                  component="img"
                  src={event.image}
                  sx={{ width: 96, height: 96, borderRadius: "12px", objectFit: "cover" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 700, color: tokens.color.text }}>
                    {event.title}
                  </Typography>
                  <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.textSecondary, mb: 0.8 }}>
                    {activeSession?.session_name || event.sessionName}
                  </Typography>
                  <Chip
                    label={activeSession?.date || event.date}
                    size="small"
                    sx={{
                      bgcolor: tokens.color.bg,
                      border: `1px solid ${tokens.color.border}`,
                      fontSize: tokens.fontSize.caption,
                      height: 26,
                      borderRadius: "13px",
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Registration form */}
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, mb: 2, color: tokens.color.text }}>
                {t("registerPage.registrationInfo")}
              </Typography>

              <Typography sx={labelSx}>{t("registerPage.name")}</Typography>
              <TextField fullWidth size="small" value={form.name} onChange={handleChange("name")} sx={fieldSx} />

              <Typography sx={labelSx}>
                {t("registerPage.studentId")} <Box component="span" sx={{ color: tokens.color.placeholder, fontWeight: 500 }}>{t("registerPage.firstTimeRequired")}</Box>
              </Typography>
              <TextField fullWidth size="small" value={form.studentId} onChange={handleChange("studentId")} sx={fieldSx} />

              <Typography sx={labelSx}>
                {t("registerPage.department")} <Box component="span" sx={{ color: tokens.color.placeholder, fontWeight: 500 }}>{t("registerPage.firstTimeRequired")}</Box>
              </Typography>
              <TextField fullWidth size="small" value={form.department} onChange={handleChange("department")} sx={fieldSx} />

              <Typography sx={labelSx}>{t("registerPage.email")}</Typography>
              <TextField fullWidth size="small" value={form.email} onChange={handleChange("email")} sx={fieldSx} disabled />

              <Typography sx={labelSx}>{t("registerPage.phone")}</Typography>
              <TextField
                fullWidth size="small" placeholder={t("registerPage.phonePlaceholder")}
                value={form.phone} onChange={handleChange("phone")}
                sx={{ ...fieldSx, mb: 0 }}
              />
            </Paper>

            {/* Notes */}
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, mb: 1.5, color: tokens.color.text }}>
                {t("registerPage.notice")}
              </Typography>
              <Box component="ul" sx={{ pl: 2.5, m: 0, "& li": { mb: 0.6, color: tokens.color.textSecondary } }}>
                <li><Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.registrationPeriod")}：{activeSession?.registration_start || event.registrationStart} ~ {activeSession?.registration_end || event.registrationEnd}</Typography></li>
                <li><Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.targetAudience")}：{event.targetAudience}</Typography></li>
                {event.restrictions && (
                  <li><Typography sx={{ fontSize: tokens.fontSize.body }}>{t("event.restrictions")}：{event.restrictions}</Typography></li>
                )}
                <li><Typography sx={{ fontSize: tokens.fontSize.body }}>{t("registerPage.byob")}</Typography></li>
              </Box>
            </Paper>

            {/* Agreement and submit */}
            <Paper sx={{ ...cardSx, mb: 0 }}>
              {error && (
                <Typography sx={{ color: "#d32f2f", fontSize: tokens.fontSize.body, mb: 1 }}>{error}</Typography>
              )}
              <FormControlLabel
                control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                label={
                  <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.text }}>
                    {t("registerPage.agreement")}
                  </Typography>
                }
              />
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{
                    flex: 1, textTransform: "none",
                    borderRadius: "27px", height: 54, fontSize: tokens.fontSize.body,
                    borderColor: tokens.color.border, color: tokens.color.text,
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="contained"
                  disabled={!agreed}
                  onClick={handleSubmit}
                  sx={{
                    flex: 1,
                    bgcolor: tokens.color.black,
                    color: "#fff",
                    textTransform: "none",
                    borderRadius: "27px",
                    height: 54,
                    fontSize: tokens.fontSize.body,
                    fontWeight: 600,
                    "&:hover": { bgcolor: tokens.color.navyDark },
                  }}
                >
                  {t("registerPage.confirmRegister")}
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
