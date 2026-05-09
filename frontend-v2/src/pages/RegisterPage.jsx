import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Divider } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import GoogleSSOButton from "../components/GoogleSSOButton";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("請填寫所有必填欄位"); return;
    }
    if (form.password !== form.confirmPassword) { setError("兩次密碼輸入不一致"); return; }
    if (form.password.length < 8) { setError("密碼需至少 8 個字元"); return; }
    const result = await register(form.name, form.email, form.password);
    if (result.success) navigate("/");
    else setError(result.error || "註冊失敗");
  };

  const fieldSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg },
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
        <Typography sx={{ fontSize: 28, fontWeight: 700, textAlign: "center", mb: 1, color: tokens.color.text }}>
          {t("auth.registerTitle")}
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.placeholder, textAlign: "center", mb: 3 }}>
          {t("auth.registerSubtitle")}
        </Typography>

        {/* Google SSO continue (Figma 註冊畫面 + SSO) */}
        <Box sx={{ mb: 2.5 }}>
          <GoogleSSOButton onError={setError} width={420} />
        </Box>

        <Divider sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>
            {t("auth.orEmail")}
          </Typography>
        </Divider>

        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: "center", fontSize: 13 }}>{error}</Typography>
        )}

        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>
          {t("auth.username")} <Box component="span" sx={{ color: "#FF4D4F" }}>*</Box>
        </Typography>
        <TextField
          fullWidth size="small" placeholder={t("auth.usernamePlaceholder")}
          value={form.name} onChange={handleChange("name")}
          sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
        />

        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>
          {t("auth.email")} <Box component="span" sx={{ color: "#FF4D4F" }}>*</Box>
        </Typography>
        <TextField
          fullWidth size="small" placeholder={t("auth.emailPlaceholder")}
          value={form.email} onChange={handleChange("email")}
          sx={fieldSx}
          InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
        />

        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>
          {t("auth.password")} <Box component="span" sx={{ color: "#FF4D4F" }}>*</Box>
        </Typography>
        <TextField
          fullWidth size="small" type={showPassword ? "text" : "password"}
          placeholder={t("auth.passwordPlaceholder")}
          value={form.password} onChange={handleChange("password")}
          sx={{ mb: 0.5, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
          }}
        />
        <Typography sx={{ fontSize: 12, color: tokens.color.placeholder, mb: 2, display: "block" }}>
          {t("auth.passwordHint")}
        </Typography>

        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>
          {t("auth.confirmPassword")} <Box component="span" sx={{ color: "#FF4D4F" }}>*</Box>
        </Typography>
        <TextField
          fullWidth size="small" type={showPassword ? "text" : "password"}
          placeholder={t("auth.confirmPasswordPlaceholder")}
          value={form.confirmPassword} onChange={handleChange("confirmPassword")}
          sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
        />

        <Button
          type="submit" fullWidth variant="contained"
          sx={{
            bgcolor: "#0F172A", color: "#fff",
            py: 1.4, borderRadius: "10px",
            textTransform: "none", fontSize: 16, fontWeight: 600, mb: 2.5,
            "&:hover": { bgcolor: "#1E293B" },
          }}
        >
          {t("auth.createAccount")}
        </Button>

        <Typography sx={{ fontSize: 14, textAlign: "center", color: tokens.color.text }}>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>
            {t("auth.backToLogin")}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
