import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton, Divider,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("請輸入帳號和密碼");
      return;
    }
    const result = login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setError("帳號或密碼錯誤");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#e8edf2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          bgcolor: "white",
          borderRadius: 4,
          p: 5,
          width: 420,
          maxWidth: "90vw",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center", mb: 1 }}>
          登入帳號
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
          使用您的帳號或 Email 登入系統
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          Email 或帳號
        </Typography>
        <TextField
          fullWidth
          placeholder="請輸入 Email 或帳號"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: "#999" }} />
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          密碼
        </Typography>
        <TextField
          fullWidth
          type={showPassword ? "text" : "password"}
          placeholder="請輸入密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "#999" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ textAlign: "right", mb: 2 }}>
          <Link to="/forgot-password" style={{ color: "#1a237e", fontSize: 13, textDecoration: "none" }}>
            忘記密碼？
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            bgcolor: "#1a1a2e",
            py: 1.3,
            borderRadius: 2,
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            mb: 2,
            "&:hover": { bgcolor: "#0d0d1a" },
          }}
        >
          登入
        </Button>

        <Divider sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">或</Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          sx={{
            borderColor: "#ccc",
            color: "#333",
            textTransform: "none",
            py: 1.2,
            borderRadius: 2,
            mb: 3,
          }}
        >
          ○ 使用 NTU SSO 登入
        </Button>

        <Typography variant="body2" sx={{ textAlign: "center" }}>
          還沒有帳號？{" "}
          <Link to="/register" style={{ color: "#1a237e", fontWeight: 600, textDecoration: "none" }}>
            立即註冊
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
