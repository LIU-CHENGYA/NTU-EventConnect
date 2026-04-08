import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api";
import { tokens } from "../theme";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
  const { login, googleLogin, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const googleBtnRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("請輸入帳號和密碼"); return; }
    const result = await login(email, password);
    if (result.success) navigate("/");
    else setError(result.error || "帳號或密碼錯誤");
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const result = await googleLogin(response.credential);
          if (!result.success) { setError(result.error); return; }
          if (result.needsUsername) setUsernameOpen(true);
          else navigate("/");
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline", size: "large", width: 360, text: "signin_with",
      });
    };
    if (window.google?.accounts?.id) init();
    else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(t); init(); }
      }, 100);
      return () => { cancelled = true; clearInterval(t); };
    }
    return () => { cancelled = true; };
  }, [googleLogin, navigate]);

  const handleSaveUsername = async () => {
    const name = newUsername.trim();
    if (!name) return;
    try {
      const updated = await usersApi.updateMe({ name });
      setUser(updated);
      setUsernameOpen(false);
      navigate("/");
    } catch (e) {
      setError(e?.response?.data?.detail || "設定使用者名稱失敗");
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

        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} />
          ) : (
            <Typography sx={{ fontSize: 12, color: tokens.color.placeholder }}>
              尚未設定 VITE_GOOGLE_CLIENT_ID，無法使用 Google 登入
            </Typography>
          )}
        </Box>

        <Typography sx={{ fontSize: 14, textAlign: "center", color: tokens.color.text }}>
          還沒有帳號？{" "}
          <Link to="/register" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>立即註冊</Link>
        </Typography>
      </Box>

      <Dialog open={usernameOpen} disableEscapeKeyDown>
        <DialogTitle>請設定使用者名稱</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth margin="dense"
            label="使用者名稱"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveUsername(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveUsername} disabled={!newUsername.trim()}>確認</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
