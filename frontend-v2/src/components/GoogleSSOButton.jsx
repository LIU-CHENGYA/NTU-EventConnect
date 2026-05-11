import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api";
import { tokens } from "../theme";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleSSOButton({ onError, onSuccess, width = 360 }) {
  const { t } = useTranslation();
  const { googleLogin, setUser } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    let interval;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const result = await googleLogin(response.credential);
          if (!result.success) { onError?.(result.error); return; }
          if (result.needsUsername) setUsernameOpen(true);
          else { onSuccess?.(); navigate("/"); }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline", size: "large", width, text: "continue_with",
      });
    };
    if (window.google?.accounts?.id) init();
    else {
      interval = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(interval); init(); }
      }, 100);
    }
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, [googleLogin, navigate, onError, onSuccess, width]);

  const handleSaveUsername = async () => {
    const name = newUsername.trim();
    if (!name) return;
    try {
      const updated = await usersApi.updateMe({ name });
      setUser(updated);
      setUsernameOpen(false);
      onSuccess?.();
      navigate("/");
    } catch (e) {
      onError?.(e?.response?.data?.detail || t("auth.setUsernameFailed"));
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Box
        sx={{
          width: "100%", py: 1.4, border: `1px dashed ${tokens.color.border}`,
          borderRadius: "10px", textAlign: "center", color: tokens.color.placeholder, fontSize: 12,
        }}
      >
        {t("auth.googleNotConfigured")}
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box ref={btnRef} sx={{ "& > div": { width: "100% !important" } }} />
      </Box>

      <Dialog open={usernameOpen} disableEscapeKeyDown>
        <DialogTitle>{t("auth.setUsernameTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth margin="dense"
            label={t("auth.usernameLabel")}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveUsername(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveUsername} disabled={!newUsername.trim()}>
            {t("auth.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
