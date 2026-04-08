import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Collapse, Divider, IconButton, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { usersApi } from "../api";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

const STATUS_FILTERS = ["全部", "報名成功", "等待候補", "已取消"];
const STATUS_TO_ZH = { success: "報名成功", waitlist: "等待候補", cancelled: "已取消" };
const FALLBACK_IMG = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400";

export default function RegistrationRecordPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("全部");
  const [expandedId, setExpandedId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    usersApi.myRegistrations()
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    reload();
  }, [user, ready, navigate]);

  if (!ready) return null;
  if (!user) return null;

  const filtered = filter === "全部"
    ? registrations
    : registrations.filter((r) => STATUS_TO_ZH[r.status] === filter);

  const statusColors = {
    "報名成功": { bg: tokens.color.success.bg, color: tokens.color.success.fg },
    "等待候補": { bg: tokens.color.warning.bg, color: tokens.color.warning.fg },
    "已取消":   { bg: tokens.color.danger.bg,  color: tokens.color.danger.fg  },
  };

  const cardSx = {
    borderRadius: "20px",
    mb: 2,
    overflow: "hidden",
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };

  const handleCancel = async (regId) => {
    try {
      await api.delete(`/api/registrations/${regId}`);
      reload();
    } catch (e) {
      alert("取消失敗: " + (e?.response?.data?.detail || e.message));
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.logo, fontStyle: "italic", fontSize: 32, color: tokens.color.navy }}>
            報名紀錄
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Avatar src={user.avatar_url || user.avatar} sx={{ width: 52, height: 52 }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => (
            <Box
              key={s}
              onClick={() => setFilter(s)}
              sx={{
                px: 1.8, py: "6px", fontSize: 14, borderRadius: "8px",
                border: "1px solid #cac4d0",
                bgcolor: filter === s ? "rgba(57,167,255,0.42)" : "#fff",
                color: tokens.color.text, cursor: "pointer",
                fontFamily: "'Roboto',sans-serif", fontWeight: 500,
              }}
            >
              {s}
            </Box>
          ))}
        </Box>

        {loading && <Typography sx={{ textAlign: "center", py: 4 }}>載入中...</Typography>}

        {!loading && filtered.map((reg) => {
          const isExpanded = expandedId === reg.id;
          const zhStatus = STATUS_TO_ZH[reg.status];
          return (
            <Paper key={reg.id} sx={cardSx}>
              <Box
                sx={{
                  display: "flex", alignItems: "center", p: 2.2,
                  cursor: "pointer", "&:hover": { bgcolor: tokens.color.bg },
                }}
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              >
                <Box
                  component="img"
                  src={FALLBACK_IMG}
                  sx={{ width: 72, height: 72, borderRadius: "12px", objectFit: "cover", mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.color.text }}>
                    {reg.event_title}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary, mt: 0.3 }}>
                    {reg.session_name} · {reg.date}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 1.5, py: "5px", borderRadius: "20px",
                    bgcolor: statusColors[zhStatus]?.bg,
                    color: statusColors[zhStatus]?.color,
                    fontSize: 12, fontWeight: 700, mr: 1,
                  }}
                >
                  {zhStatus}
                </Box>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={isExpanded}>
                <Divider sx={{ borderColor: tokens.color.bg }} />
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {[
                      ["報名時間", (reg.registered_at || "").slice(0, 10)],
                      ["活動地點", reg.location || "—"],
                      ["活動日期", reg.date || "—"],
                      ["場次", reg.session_name || "—"],
                    ].map(([k, v]) => (
                      <Box key={k}>
                        <Typography sx={{ fontSize: 12, color: tokens.color.placeholder }}>{k}</Typography>
                        <Typography sx={{ fontSize: 14, color: tokens.color.text, fontWeight: 500 }}>{v}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/events/${reg.event_id}`)}
                      sx={{
                        textTransform: "none", borderRadius: "22px", height: 44, px: 2.5,
                        borderColor: tokens.color.border, color: tokens.color.text, fontSize: 14,
                      }}
                    >
                      查看活動
                    </Button>
                    {reg.status !== "cancelled" && (
                      <Button
                        variant="contained"
                        onClick={() => handleCancel(reg.id)}
                        sx={{
                          textTransform: "none", borderRadius: "22px", height: 44, px: 2.5,
                          bgcolor: tokens.color.black, color: "#fff", fontSize: 14, fontWeight: 600,
                          "&:hover": { bgcolor: tokens.color.navyDark },
                        }}
                      >
                        取消報名
                      </Button>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          );
        })}

        {!loading && filtered.length === 0 && (
          <Typography sx={{ textAlign: "center", py: 6, color: tokens.color.placeholder }}>
            沒有符合條件的報名紀錄
          </Typography>
        )}
      </Box>
    </Box>
  );
}
