import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Checkbox, FormControlLabel, Avatar, Chip, Divider, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";

export default function EventRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const event = mockEvents.find((e) => e.id === Number(id));

  const [form, setForm] = useState({
    name: user?.name || "",
    studentId: user?.studentId || "",
    department: user?.department || "",
    email: user?.email || "",
    phone: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    if (!agreed) return;
    setSubmitted(true);
    setTimeout(() => navigate("/my-registrations"), 1500);
  };

  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>找不到此活動</Typography>
      </Box>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 700, mx: "auto", px: 3, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            活動報名
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Avatar src={user.avatar} sx={{ width: 36, height: 36 }} />
          </Box>
        </Box>

        {submitted ? (
          <Paper sx={{ borderRadius: 3, p: 4, textAlign: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#2e7d32", mb: 1 }}>
              報名成功！
            </Typography>
            <Typography color="text.secondary">
              即將跳轉至報名紀錄頁面...
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Event info */}
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                報名活動
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box
                  component="img"
                  src={event.image}
                  sx={{ width: 80, height: 80, borderRadius: 2, objectFit: "cover" }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.sessionName}
                  </Typography>
                  <Chip label={event.date} size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            </Paper>

            {/* Registration form */}
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                報名資料
              </Typography>

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>姓名 *</Typography>
              <TextField fullWidth size="small" value={form.name} onChange={handleChange("name")} sx={{ mb: 2 }} />

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>學號 *</Typography>
              <TextField fullWidth size="small" value={form.studentId} onChange={handleChange("studentId")} sx={{ mb: 2 }} />

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>系所 *</Typography>
              <TextField fullWidth size="small" value={form.department} onChange={handleChange("department")} sx={{ mb: 2 }} />

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>電子郵件 *</Typography>
              <TextField fullWidth size="small" value={form.email} onChange={handleChange("email")} sx={{ mb: 2 }} />

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>聯絡電話 +</Typography>
              <TextField fullWidth size="small" placeholder="0912-345-678" value={form.phone} onChange={handleChange("phone")} sx={{ mb: 2 }} />
            </Paper>

            {/* Notes */}
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                報名注意事項
              </Typography>
              <Box component="ul" sx={{ pl: 2, "& li": { mb: 0.5 } }}>
                <li>
                  <Typography variant="body2">
                    報名時間：{event.registrationStart} ~ {event.registrationEnd}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    參加對象：{event.targetAudience}
                  </Typography>
                </li>
                {event.restrictions && (
                  <li>
                    <Typography variant="body2">
                      限制條件：{event.restrictions}
                    </Typography>
                  </li>
                )}
                <li>
                  <Typography variant="body2">
                    請自備攜帶電腦
                  </Typography>
                </li>
              </Box>
            </Paper>

            {/* Agreement and submit */}
            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                }
                label={
                  <Typography variant="body2">
                    我已閱讀並同意以上注意事項，所填寫的資料均為真實且正確
                  </Typography>
                }
              />

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{ flex: 1, textTransform: "none", borderRadius: 2 }}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  disabled={!agreed}
                  onClick={handleSubmit}
                  sx={{
                    flex: 1,
                    bgcolor: "#1a237e",
                    textTransform: "none",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#0d1754" },
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
