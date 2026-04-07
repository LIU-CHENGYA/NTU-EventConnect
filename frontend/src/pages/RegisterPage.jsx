import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography, TextField, Button, InputAdornment, IconButton } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("請填寫所有必填欄位");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("兩次密碼輸入不一致");
      return;
    }
    if (form.password.length < 8) {
      setError("密碼需至少 8 個字元");
      return;
    }
    const result = register(form.name, form.email, form.password);
    if (result.success) {
      navigate("/");
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
          建立帳號
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
          填寫以下資料以建立您的帳號
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          使用者名稱 *
        </Typography>
        <TextField
          fullWidth
          placeholder="請輸入使用者名稱"
          value={form.name}
          onChange={handleChange("name")}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: "#999" }} />
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          Email *
        </Typography>
        <TextField
          fullWidth
          placeholder="example@ntu.edu.tw"
          value={form.email}
          onChange={handleChange("email")}
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
          密碼 *
        </Typography>
        <TextField
          fullWidth
          type={showPassword ? "text" : "password"}
          placeholder="請輸入密碼"
          value={form.password}
          onChange={handleChange("password")}
          sx={{ mb: 0.5 }}
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
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
          密碼需包含至少 8 個字元、大小寫字母及數字
        </Typography>

        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          確認密碼 *
        </Typography>
        <TextField
          fullWidth
          type={showPassword ? "text" : "password"}
          placeholder="請再次輸入密碼"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "#999" }} />
              </InputAdornment>
            ),
          }}
        />

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
          建立帳號
        </Button>

        <Typography variant="body2" sx={{ textAlign: "center" }}>
          已有帳號？{" "}
          <Link to="/login" style={{ color: "#1a237e", fontWeight: 600, textDecoration: "none" }}>
            返回登入
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
