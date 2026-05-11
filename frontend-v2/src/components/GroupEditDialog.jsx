import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, Box, Typography, TextField, Button, IconButton, Avatar,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { groupsApi } from "../api";
import { tokens } from "../theme";

const AVATAR_BG = ["#3F6BE0", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function colorFor(seed) {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % AVATAR_BG.length;
  return AVATAR_BG[h];
}

const GoogleMark = (
  <Box
    component="span"
    sx={{
      width: 18, height: 18, borderRadius: "50%",
      bgcolor: "#fff", border: "1px solid #ddd",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "#4285F4",
    }}
  >G</Box>
);

export default function GroupEditDialog({ open, onClose, groupId, onSaved }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers] = useState([]);     // existing members for edit mode
  const [pending, setPending] = useState([]);     // pending invitations / staged invites
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!groupId;

  useEffect(() => {
    if (!open) return;
    setError("");
    if (!isEdit) {
      setName("");
      setMembers([]);
      setPending([]);
      return;
    }
    setLoading(true);
    groupsApi
      .get(groupId)
      .then((g) => {
        setName(g.name || "");
        setMembers(g.members || []);
        setPending(g.invitations || []);
      })
      .catch((e) => setError(e?.response?.data?.detail || t("errors.loadGroupFailed")))
      .finally(() => setLoading(false));
  }, [open, groupId, isEdit]);

  const handleAddInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/.+@.+\..+/.test(email)) {
      setError(t("errors.enterValidEmail"));
      return;
    }
    setError("");
    if (!isEdit) {
      // staged for create
      if (!pending.some((p) => p.email === email)) {
        setPending([...pending, { email, status: "staged", id: -Date.now() }]);
      }
      setInviteEmail("");
      return;
    }
    // edit mode: persist immediately
    groupsApi.invite(groupId, email)
      .then(() => groupsApi.get(groupId))
      .then((g) => {
        setMembers(g.members || []);
        setPending(g.invitations || []);
        setInviteEmail("");
      })
      .catch((e) => setError(e?.response?.data?.detail || t("errors.inviteFailed")));
  };

  const handleRemovePending = (entry) => {
    if (!isEdit || entry.status === "staged") {
      setPending(pending.filter((p) => p.id !== entry.id));
      return;
    }
    groupsApi.revokeInvite(groupId, entry.id)
      .then(() => setPending(pending.filter((p) => p.id !== entry.id)))
      .catch((e) => setError(e?.response?.data?.detail || t("errors.revokeInviteFailed")));
  };

  const handleRemoveMember = (member) => {
    if (!isEdit) return;
    groupsApi.removeMember(groupId, member.userId)
      .then(() => setMembers(members.filter((m) => m.userId !== member.userId)))
      .catch((e) => setError(e?.response?.data?.detail || t("errors.removeMemberFailed")));
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError(t("errors.enterGroupName")); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await groupsApi.update(groupId, { name: name.trim() });
      } else {
        await groupsApi.create({
          name: name.trim(),
          invite_emails: pending.filter((p) => p.status === "staged").map((p) => p.email),
        });
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.detail || t("errors.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const allInvites = [
    ...members.map((m) => ({
      key: `m-${m.userId}`, email: m.userEmail || m.userName,
      label: m.userName, isMember: true, raw: m,
    })),
    ...pending.map((p) => ({
      key: `p-${p.id}`, email: p.email, label: null, isMember: false, raw: p,
    })),
  ];

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", borderBottom: `1px solid ${tokens.color.border}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: 17, flex: 1 }}>
          {t("groupDialog.title")}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={loading}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
          {t("groupDialog.name")} <Box component="span" sx={{ color: "#FF4D4F" }}>*</Box>
        </Typography>
        <TextField
          fullWidth size="small"
          placeholder={t("groupDialog.nameValue")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
        />

        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
          {t("groupDialog.invite")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
          <TextField
            fullWidth size="small"
            placeholder={t("groupDialog.invitePlaceholder")}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddInvite(); } }}
            InputProps={{ startAdornment: <InputAdornment position="start">{GoogleMark}</InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: tokens.color.bg } }}
          />
          <Button
            onClick={handleAddInvite}
            sx={{
              bgcolor: "#0F172A", color: "#fff",
              borderRadius: "10px", px: 2.5, textTransform: "none",
              "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            {t("groupDialog.inviteAdd")}
          </Button>
        </Box>
        <Typography sx={{ fontSize: 12, color: tokens.color.placeholder, mb: 2.5 }}>
          {t("groupDialog.inviteHint")}
        </Typography>

        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
          {t("groupDialog.invited", { count: allInvites.length })}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 180, overflowY: "auto" }}>
          {allInvites.map((inv) => {
            const seed = inv.email || inv.label || "?";
            const initial = (inv.label || inv.email || "?").charAt(0).toUpperCase();
            return (
              <Box
                key={inv.key}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.25,
                  px: 1.25, py: 0.75,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: "9999px",
                  bgcolor: tokens.color.bg,
                }}
              >
                <Avatar sx={{ width: 28, height: 28, bgcolor: colorFor(seed), fontSize: 13 }}>{initial}</Avatar>
                <Typography sx={{ flex: 1, fontSize: 13 }} noWrap>
                  {inv.email}
                  {!inv.isMember && (
                    <Box component="span" sx={{ ml: 1, fontSize: 11, color: "#A8071A" }}>
                      ({inv.raw.status === "staged" ? t("errors.stagedNotSent") : inv.raw.status})
                    </Box>
                  )}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => inv.isMember ? handleRemoveMember(inv.raw) : handleRemovePending(inv.raw)}
                  sx={{ bgcolor: "#FFE6E6", "&:hover": { bgcolor: "#FFCCCC" }, width: 24, height: 24 }}
                >
                  <CloseIcon sx={{ fontSize: 14, color: "#FF4D4F" }} />
                </IconButton>
              </Box>
            );
          })}
          {allInvites.length === 0 && (
            <Typography sx={{ fontSize: 13, color: tokens.color.placeholder, textAlign: "center", py: 1 }}>
              {t("groupDialog.noInvitees")}
            </Typography>
          )}
        </Box>

        {error && (
          <Typography sx={{ color: "#FF4D4F", fontSize: 12, mt: 1 }}>{error}</Typography>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, mt: 3 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              textTransform: "none",
              border: `1px solid ${tokens.color.border}`,
              color: tokens.color.text,
              borderRadius: "10px", px: 2.5,
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            sx={{
              textTransform: "none",
              bgcolor: tokens.color.navy, color: "#fff",
              borderRadius: "10px", px: 3,
              "&:hover": { bgcolor: tokens.color.navyDark },
            }}
          >
            {t("common.save")}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
