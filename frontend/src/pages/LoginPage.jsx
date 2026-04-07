import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton, Divider,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) { setError("請輸入帳號和密碼"); return; }
    const result = login(email, password);
    if (result.success) navigate("/");
    else setError("帳號或密碼錯誤");
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
          px: 8,
          py: 6,
        }}
      >
        <Typography sx={{ fontSize: 28, fontWeight: 700, textAlign: "center", mb: 1, color: tokens.color.text }}>
          登入帳號
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.placeholder, textAlign: "center", mb: 4 }}>
          使用您的帳號或 Email 登入系統
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: "center", fontSize: 13 }}>{error}</Typography>
        )}

        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>Email 或帳號</Typography>
        <TextField
          fullWidth size="small" placeholder="請輸入 Email 或帳號"
          value={email} onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
        />

        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>密碼</Typography>
        <TextField
          fullWidth size="small" type={showPassword ? "text" : "password"}
          placeholder="請輸入密碼"
          value={password} onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
          }}
        />

        <Box sx={{ textAlign: "right", mb: 3 }}>
          <Link to="/forgot-password" style={{ color: "#1976d2", fontSize: 13, textDecoration: "none" }}>忘記密碼？</Link>
        </Box>

        <Button
          type="submit" fullWidth variant="contained"
          sx={{
            bgcolor: tokens.color.navy, py: 1.4, borderRadius: "10px",
            textTransform: "none", fontSize: 16, fontWeight: 600, mb: 2.5,
            "&:hover": { bgcolor: tokens.color.navyDark },
          }}
        >
          登入
        </Button>

        <Divider sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, color: tokens.color.placeholder }}>或</Typography>
        </Divider>

        <Button
          fullWidth variant="outlined"
          startIcon={<RadioButtonUncheckedIcon />}
          sx={{
            borderColor: tokens.color.border, color: tokens.color.text,
            textTransform: "none", py: 1.3, borderRadius: "10px", mb: 3, fontSize: 15,
          }}
        >
          使用 NTU SSO 登入
        </Button>

        <Typography sx={{ fontSize: 14, textAlign: "center", color: tokens.color.text }}>
          還沒有帳號？{" "}
          <Link to="/register" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>立即註冊</Link>
        </Typography>
      </Box>
    </Box>
  );
}
