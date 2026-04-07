import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Grid, Button, Collapse, Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { mockRegistrations, mockEvents } from "../mock/data";
import { useAuth } from "../context/AuthContext";

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
    "報名成功": { bg: "#e8f5e9", color: "#2e7d32" },
    "等待候補": { bg: "#fff3e0", color: "#e65100" },
    "已取消": { bg: "#ffebee", color: "#c62828" },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 3, py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1a237e" }}>
          報名紀錄
        </Typography>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          {["全部", "報名成功", "等待候補", "已取消"].map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => setFilter(s)}
              sx={{
                bgcolor: filter === s ? "#1a237e" : "white",
                color: filter === s ? "white" : "#333",
                fontWeight: 500,
                "&:hover": { bgcolor: filter === s ? "#0d1754" : "#e8eaf6" },
              }}
            />
          ))}
        </Box>

        {/* Records */}
        {filtered.map((reg) => {
          const event = mockEvents.find((e) => e.id === reg.eventId);
          const isExpanded = expandedId === reg.id;

          return (
            <Paper key={reg.id} sx={{ borderRadius: 3, mb: 2, overflow: "hidden" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 2,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#fafafa" },
                }}
                onClick={() => setExpandedId(isExpanded ? null : reg.id)}
              >
                <Box
                  component="img"
                  src={reg.eventImage}
                  sx={{ width: 60, height: 60, borderRadius: 2, objectFit: "cover", mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {reg.eventTitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reg.sessionName} | {reg.date}
                  </Typography>
                </Box>
                <Chip
                  label={reg.status}
                  size="small"
                  sx={{
                    bgcolor: statusColors[reg.status]?.bg,
                    color: statusColors[reg.status]?.color,
                    fontWeight: 600,
                    mr: 1,
                  }}
                />
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={isExpanded}>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">報名時間</Typography>
                      <Typography variant="body2">{reg.registrationTime}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">活動地點</Typography>
                      <Typography variant="body2">{reg.location}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">名額</Typography>
                      <Typography variant="body2">{reg.remainingSlots}/{reg.capacity}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">活動日期</Typography>
                      <Typography variant="body2">{reg.date}</Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/events/${reg.eventId}`)}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      查看活動
                    </Button>
                    {reg.status === "報名成功" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => alert("已取消報名（Mock）")}
                        sx={{ textTransform: "none", borderRadius: 2 }}
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
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            沒有符合條件的報名紀錄
          </Typography>
        )}
      </Box>
    </Box>
  );
}
