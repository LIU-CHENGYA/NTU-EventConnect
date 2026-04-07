import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, TextField, Button, InputAdornment } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { tokens } from "../theme";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSent(true);
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
          忘記密碼
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.placeholder, textAlign: "center", mb: 4 }}>
          輸入您的 Email 地址，我們將寄送密碼重設連結給您
        </Typography>

        {sent ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: tokens.color.success.fg, mb: 1.5 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tokens.color.success.fg, mb: 1 }}>
              重設連結已寄出！
            </Typography>
            <Typography sx={{ fontSize: 13, color: tokens.color.placeholder, mb: 3 }}>
              請檢查您的信箱並依照指示重設密碼
            </Typography>
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.7 }}>Email</Typography>
            <TextField
              fullWidth size="small" placeholder="請輸入您的 Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} /></InputAdornment> }}
            />

            <Button
              type="submit" fullWidth variant="contained"
              sx={{
                bgcolor: tokens.color.navy, py: 1.4, borderRadius: "10px",
                textTransform: "none", fontSize: 16, fontWeight: 600, mb: 3,
                "&:hover": { bgcolor: tokens.color.navyDark },
              }}
            >
              送出重設連結
            </Button>
          </>
        )}

        <Typography sx={{ fontSize: 14, textAlign: "center", color: tokens.color.text }}>
          <Link to="/login" style={{ color: "#1976d2", fontWeight: 600, textDecoration: "none" }}>
            返回登入
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
