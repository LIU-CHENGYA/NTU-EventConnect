import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton, Divider,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import GoogleSSOButton from "../components/GoogleSSOButton";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError(t("auth.enterAccountPwd")); return; }
    const result = await login(email, password);
    if (result.success) navigate("/");
    else setError(result.error || t("auth.wrongCredentials"));
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
          {t("auth.loginTitle")}
        </Typography>
        <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.placeholder, textAlign: "center", mb: 3 }}>
          {t("auth.loginSubtitle")}
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          <GoogleSSOButton onError={setError} width={420} />
        </Box>

        <Divider sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>
            {t("auth.orEmailLogin")}
          </Typography>
        </Divider>

        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: "center", fontSize: tokens.fontSize.caption }}>{error}</Typography>
        )}

        <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, mb: 0.7 }}>
          {t("auth.email")}
        </Typography>
        <TextField
          fullWidth size="small" placeholder={t("auth.emailPlaceholder")}
          value={email} onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
        />

        <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600, mb: 0.7 }}>
          {t("auth.password")}
        </Typography>
        <TextField
          fullWidth size="small" type={showPassword ? "text" : "password"}
          placeholder={t("auth.passwordPlaceholder")}
          value={password} onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
          }}
        />

        <Box sx={{ textAlign: "right", mb: 3 }}>
          <Link to="/forgot-password" style={{ color: "#1976d2", fontSize: 13, textDecoration: "none" }}>
            {t("auth.forgotPassword")}
          </Link>
        </Box>

        <Button
          type="submit" fullWidth variant="contained"
          sx={{
            bgcolor: tokens.color.navy, py: 1.4, borderRadius: "10px",
            textTransform: "none", fontSize: tokens.fontSize.subtitle, fontWeight: 600, mb: 2.5,
            "&:hover": { bgcolor: tokens.color.navyDark },
          }}
        >
          {t("auth.loginTitle")}
        </Button>

        <Typography sx={{ fontSize: tokens.fontSize.body, textAlign: "center", color: tokens.color.text }}>
          {t("auth.noAccount")}{" "}
          <Link to="/register" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>
            {t("auth.goRegister")}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
