import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton, CircularProgress,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";
import { authApi } from "../api";
import { tokens } from "../theme";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError(t("auth.passwordMismatch", "兩次密碼不一致"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("auth.passwordTooShort", "密碼至少需要 6 個字元"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      const msg = err?.response?.data?.detail;
      setError(msg || t("auth.resetFailed", "重設失敗，連結可能已失效，請重新申請"));
    } finally {
      setLoading(false);
    }
  };

  const cardSx = {
    bgcolor: "#fffefe",
    borderRadius: "20px",
    boxShadow: tokens.shadow.pill,
    width: 597,
    maxWidth: "94vw",
    px: { xs: 3, sm: 8 },
    py: { xs: 4, sm: 6 },
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={cardSx}>
          <Typography sx={{ textAlign: "center", color: "error.main", mb: 2 }}>
            {t("auth.invalidResetLink", "無效的重設連結")}
          </Typography>
          <Typography sx={{ textAlign: "center" }}>
            <Link to="/forgot-password" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>
              {t("auth.requestNewLink", "重新申請")}
            </Link>
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
      <Box component="form" onSubmit={handleSubmit} sx={cardSx}>
        <Typography sx={{ fontSize: tokens.fontSize.heading, fontWeight: 700, textAlign: "center", mb: 1, color: tokens.color.text }}>
          {t("auth.resetPasswordTitle", "設定新密碼")}
        </Typography>
        <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.placeholder, textAlign: "center", mb: 4 }}>
          {t("auth.resetPasswordSubtitle", "請輸入您的新密碼")}
        </Typography>

        {done ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: tokens.color.success.fg, mb: 1.5 }} />
            <Typography sx={{ fontSize: tokens.fontSize.subtitle, fontWeight: 600, color: tokens.color.success.fg, mb: 1 }}>
              {t("auth.passwordResetSuccess", "密碼已重設成功！")}
            </Typography>
            <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mb: 3 }}>
              {t("auth.pleaseLogin", "請使用新密碼重新登入")}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{ bgcolor: tokens.color.navy, borderRadius: "10px", textTransform: "none", fontWeight: 600, px: 4, "&:hover": { bgcolor: tokens.color.navyDark } }}
            >
              {t("auth.goLogin", "前往登入")}
            </Button>
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, mb: 0.7 }}>
              {t("auth.newPassword", "新密碼")}
            </Typography>
            <TextField
              fullWidth size="small" type={showPwd ? "text" : "password"}
              placeholder={t("auth.newPasswordPlaceholder", "至少 6 個字元")}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd((v) => !v)} edge="end">
                      {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, mb: 0.7 }}>
              {t("auth.confirmPassword", "確認新密碼")}
            </Typography>
            <TextField
              fullWidth size="small" type={showPwd ? "text" : "password"}
              placeholder={t("auth.confirmPasswordPlaceholder", "再輸入一次新密碼")}
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment>,
              }}
            />

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
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : t("auth.confirmReset", "確認重設密碼")}
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
