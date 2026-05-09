import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Checkbox, FormControlLabel, Avatar, Chip, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { eventsApi } from "../api";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function EventRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
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
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    eventsApi.get(Number(id))
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id, user, ready, navigate]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    if (!agreed) return;
    const session = event?.sessions?.[0];
    if (!session) { setError("此活動沒有可報名的場次"); return; }
    try {
      await api.post(`/api/sessions/${session.id}/register`);
      setSubmitted(true);
      setTimeout(() => navigate("/my-registrations"), 1200);
    } catch (e) {
      setError(e?.response?.data?.detail || "報名失敗");
    }
  };

  if (!ready) return null;
  if (!user) return null;
  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>載入中...</Typography></Box>;
  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography>找不到此活動</Typography>
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
  const labelSx = { fontSize: 14, fontWeight: 600, mb: 0.7, color: tokens.color.text };
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
          <Typography sx={{ fontFamily: tokens.font.logo, fontStyle: "italic", fontSize: 32, color: tokens.color.navy }}>
            活動報名
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Avatar src={user.avatarUrl} sx={{ width: 52, height: 52 }} />
          </Box>
        </Box>

        {submitted ? (
          <Paper sx={{ ...cardSx, textAlign: "center", py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: tokens.color.success.fg, mb: 2 }} />
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: tokens.color.success.fg, mb: 1 }}>
              報名成功！
            </Typography>
            <Typography sx={{ fontSize: 14, color: tokens.color.placeholder }}>
              即將跳轉至報名紀錄頁面...
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Event info */}
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: tokens.color.text }}>
                報名活動
              </Typography>
              <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                <Box
                  component="img"
                  src={event.image}
                  sx={{ width: 96, height: 96, borderRadius: "12px", objectFit: "cover" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: tokens.color.text }}>
                    {event.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: tokens.color.textSecondary, mb: 0.8 }}>
                    {event.sessionName}
                  </Typography>
                  <Chip
                    label={event.date}
                    size="small"
                    sx={{
                      bgcolor: tokens.color.bg,
                      border: `1px solid ${tokens.color.border}`,
                      fontSize: 12,
                      height: 26,
                      borderRadius: "13px",
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Registration form */}
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: tokens.color.text }}>
                報名資料
              </Typography>

              <Typography sx={labelSx}>姓名</Typography>
              <TextField fullWidth size="small" value={form.name} onChange={handleChange("name")} sx={fieldSx} />

              <Typography sx={labelSx}>學號</Typography>
              <TextField fullWidth size="small" value={form.studentId} onChange={handleChange("studentId")} sx={fieldSx} />

              <Typography sx={labelSx}>系所</Typography>
              <TextField fullWidth size="small" value={form.department} onChange={handleChange("department")} sx={fieldSx} />

              <Typography sx={labelSx}>電子郵件</Typography>
              <TextField fullWidth size="small" value={form.email} onChange={handleChange("email")} sx={fieldSx} />

              <Typography sx={labelSx}>聯絡電話</Typography>
              <TextField
                fullWidth size="small" placeholder="0912-345-678"
                value={form.phone} onChange={handleChange("phone")}
                sx={{ ...fieldSx, mb: 0 }}
              />
            </Paper>

            {/* Notes */}
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1.5, color: tokens.color.text }}>
                報名注意事項
              </Typography>
              <Box component="ul" sx={{ pl: 2.5, m: 0, "& li": { mb: 0.6, color: tokens.color.textSecondary } }}>
                <li><Typography sx={{ fontSize: 13 }}>報名時間：{event.registrationStart} ~ {event.registrationEnd}</Typography></li>
                <li><Typography sx={{ fontSize: 13 }}>參加對象：{event.targetAudience}</Typography></li>
                {event.restrictions && (
                  <li><Typography sx={{ fontSize: 13 }}>限制條件：{event.restrictions}</Typography></li>
                )}
                <li><Typography sx={{ fontSize: 13 }}>請自備攜帶電腦</Typography></li>
              </Box>
            </Paper>

            {/* Agreement and submit */}
            <Paper sx={{ ...cardSx, mb: 0 }}>
              {error && (
                <Typography sx={{ color: "#d32f2f", fontSize: 13, mb: 1 }}>{error}</Typography>
              )}
              <FormControlLabel
                control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                label={
                  <Typography sx={{ fontSize: 13, color: tokens.color.text }}>
                    我已閱讀並同意以上注意事項，所填寫的資料均為真實且正確
                  </Typography>
                }
              />
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{
                    flex: 1, textTransform: "none",
                    borderRadius: "27px", height: 54, fontSize: 15,
                    borderColor: tokens.color.border, color: tokens.color.text,
                  }}
                >
                  取消
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
                    fontSize: 15,
                    fontWeight: 600,
                    "&:hover": { bgcolor: tokens.color.navyDark },
                  }}
                >
                  確認報名
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
