import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, TextField, Button, InputAdornment, CircularProgress, Alert } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GoogleIcon from "@mui/icons-material/Google";
import { useTranslation } from "react-i18next";
import { authApi } from "../api";
import { tokens } from "../theme";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSso, setIsSso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setIsSso(false);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err?.response?.data?.detail === "sso_account") {
        setIsSso(true);
      } else {
        setError(t("auth.resetRequestFailed", "發送失敗，請稍後再試"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 76px)",
        bgcolor: tokens.color.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          bgcolor: "#fffefe",
          borderRadius: "20px",
          boxShadow: tokens.shadow.pill,
          width: 597,
          maxWidth: "94vw",
          px: { xs: 3, sm: 8 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Typography sx={{ fontSize: tokens.fontSize.heading, fontWeight: 700, textAlign: "center", mb: 1, color: tokens.color.text }}>
          {t("auth.forgotPasswordTitle")}
        </Typography>
        <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.placeholder, textAlign: "center", mb: 4 }}>
          {t("auth.forgotSubtitle")}
        </Typography>

        {sent ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: tokens.color.success.fg, mb: 1.5 }} />
            <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 600, color: tokens.color.success.fg, mb: 1 }}>
              {t("auth.resetLinkSent")}
            </Typography>
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mb: 3 }}>
              {t("auth.checkInbox")}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, mb: 0.7 }}>Email</Typography>
            <TextField
              fullWidth size="small" placeholder={t("auth.emailPlaceholderShort")}
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
            />

            {isSso && (
              <Alert
                severity="info"
                icon={<GoogleIcon fontSize="inherit" />}
                sx={{ mb: 2, borderRadius: "10px", fontSize: tokens.fontSize.caption }}
              >
                {t("auth.ssoAccountHint", "此帳號是透過 Google 登入註冊的，無法使用 Email 重設密碼。請直接點選「以 Google 登入」。")}
              </Alert>
            )}

            {error && (
              <Typography sx={{ fontSize: tokens.fontSize.caption, color: "error.main", mb: 1.5, textAlign: "center" }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit" fullWidth variant="contained" disabled={loading}
              sx={{
                bgcolor: tokens.color.navy, py: 1.4, borderRadius: "10px",
                textTransform: "none", fontSize: tokens.fontSize.subtitle, fontWeight: 600, mb: 3,
                "&:hover": { bgcolor: tokens.color.navyDark },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : t("auth.sendResetLink")}
            </Button>
          </>
        )}

        <Typography sx={{ fontSize: tokens.fontSize.body, textAlign: "center", color: tokens.color.text }}>
          <Link to="/login" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>
            {t("auth.backToLoginShort")}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
