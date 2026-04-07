import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Collapse, Divider, IconButton, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { mockRegistrations, mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

const STATUS_FILTERS = ["全部", "報名成功", "等待候補", "已取消"];

export default function RegistrationRecordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("全部");
  const [expandedId, setExpandedId] = useState(null);

  if (!user) { navigate("/login"); return null; }

  const registrations = mockRegistrations.filter((r) => r.userId === user.id);
  const filtered = filter === "全部"
    ? registrations
    : registrations.filter((r) => r.status === filter);

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

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.logo, fontStyle: "italic", fontSize: 32, color: tokens.color.navy }}>
            報名紀錄
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <Avatar src={user.avatar} sx={{ width: 52, height: 52 }} />
          </Box>
        </Box>

        {/* Filters */}
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

        {filtered.map((reg) => {
          const isExpanded = expandedId === reg.id;
          return (
            <Paper key={reg.id} sx={cardSx}>
              <Box
                sx={{
                  display: "flex", alignItems: "center", p: 2.2,
                  cursor: "pointer",
                  "&:hover": { bgcolor: tokens.color.bg },
                }}
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              >
                <Box
                  component="img"
                  src={reg.eventImage}
                  sx={{ width: 72, height: 72, borderRadius: "12px", objectFit: "cover", mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.color.text }}>
                    {reg.eventTitle}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.color.textSecondary, mt: 0.3 }}>
                    {reg.sessionName} · {reg.date}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 1.5, py: "5px", borderRadius: "20px",
                    bgcolor: statusColors[reg.status]?.bg,
                    color: statusColors[reg.status]?.color,
                    fontSize: 12, fontWeight: 700, mr: 1,
                  }}
                >
                  {reg.status}
                </Box>
                {isExpanded ? <ExpandLessIcon sx={{ color: tokens.color.textSecondary }} /> : <ExpandMoreIcon sx={{ color: tokens.color.textSecondary }} />}
              </Box>

              <Collapse in={isExpanded}>
                <Divider sx={{ borderColor: tokens.color.bg }} />
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {[
                      ["報名時間", reg.registrationTime],
                      ["活動地點", reg.location],
                      ["名額", `${reg.remainingSlots}/${reg.capacity}`],
                      ["活動日期", reg.date],
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
                      onClick={() => navigate(`/events/${reg.eventId}`)}
                      sx={{
                        textTransform: "none", borderRadius: "22px", height: 44, px: 2.5,
                        borderColor: tokens.color.border, color: tokens.color.text, fontSize: 14,
                      }}
                    >
                      查看活動
                    </Button>
                    {reg.status === "報名成功" && (
                      <Button
                        variant="contained"
                        onClick={() => alert("已取消報名（Mock）")}
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

        {filtered.length === 0 && (
          <Typography sx={{ textAlign: "center", py: 6, color: tokens.color.placeholder }}>
            沒有符合條件的報名紀錄
          </Typography>
        )}
      </Box>
    </Box>
  );
}
