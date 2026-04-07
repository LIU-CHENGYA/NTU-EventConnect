import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, TextField, Button, InputAdornment } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";

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
          忘記密碼
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
          輸入您的 Email 地址，我們將寄送密碼重設連結給您
        </Typography>

        {sent ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography color="success.main" sx={{ mb: 2 }}>
              重設連結已寄出！請檢查您的信箱。
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              Email
            </Typography>
            <TextField
              fullWidth
              placeholder="請輸入您的 Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#999" }} />
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
              送出重設連結
            </Button>
          </>
        )}

        <Typography variant="body2" sx={{ textAlign: "center" }}>
          <Link to="/login" style={{ color: "#1a237e", fontWeight: 600, textDecoration: "none" }}>
            返回登入
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
