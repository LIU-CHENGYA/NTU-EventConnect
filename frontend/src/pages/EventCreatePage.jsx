import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, InputBase, Button, MenuItem, Select } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useAuth } from "../context/AuthContext";
import { categories } from "../mock/data";
import { tokens } from "../theme";

const TAG_COLORS = {
  "英文": "rgba(255,57,57,0.42)",
  "運動": "rgba(57,167,255,0.42)",
  "便當": "rgba(0,0,0,0.1)",
  "就業": "rgba(0,0,0,0.11)",
};

const LEFT_FIELDS = [
  "活動名稱", "場次名稱", "場次內容", "授課人", "活動地點", "場次時間",
  "報名時間", "承辦單位", "承辦人", "報名類型", "參加對象", "其他限制條件",
];
const RIGHT_FIELDS = [
  "報名費", "人數名額", "用餐", "是否提供公務人員學習時數",
  "研習總時數", "學習類別", "學位學分", "期別", "活動縣市", "附件", "備註",
];

function PillInput({ value, onChange, placeholder, width = 291 }) {
  return (
    <Box sx={{
      bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill,
      height: 30, width, px: 2, display: "flex", alignItems: "center",
    }}>
      <InputBase
        fullWidth value={value} onChange={onChange} placeholder={placeholder}
        sx={{ fontSize: 14, color: tokens.color.text }}
      />
    </Box>
  );
}

function FieldRow({ label, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", height: 45, gap: 2 }}>
      <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 18, width: 160 }}>{label}</Typography>
      {children}
    </Box>
  );
}

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [form, setForm] = useState({});
  const [tags, setTags] = useState(["運動"]);

  if (!ready) return null;
  if (!user) { navigate("/login"); return null; }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleTag = (t) => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 6 } }}>
        <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: { xs: 24, md: 32 }, mb: 4 }}>
          發布新的活動
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 3, md: 8 }, alignItems: "start" }}>
          {/* LEFT column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {LEFT_FIELDS.map((label) => (
              <FieldRow key={label} label={label}>
                <PillInput value={form[label] || ""} onChange={set(label)} />
              </FieldRow>
            ))}
          </Box>

          {/* RIGHT column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {RIGHT_FIELDS.map((label) => {
              if (label === "用餐" || label === "是否提供公務人員學習時數") {
                return (
                  <FieldRow key={label} label={label}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3, fontSize: 16 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                           onClick={() => setForm({ ...form, [label]: "是" })}>
                        <Box sx={{
                          width: 16, height: 16, borderRadius: "50%",
                          border: "1.5px solid #444",
                          bgcolor: form[label] === "是" ? tokens.color.navy : "transparent",
                        }} />
                        是
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                           onClick={() => setForm({ ...form, [label]: "否" })}>
                        <Box sx={{
                          width: 16, height: 16, borderRadius: "50%",
                          border: "1.5px solid #444",
                          bgcolor: form[label] === "否" ? tokens.color.navy : "transparent",
                        }} />
                        否
                      </Box>
                    </Box>
                  </FieldRow>
                );
              }
              if (label === "學習類別") {
                return (
                  <FieldRow key={label} label={label}>
                    <Select
                      value={form[label] || ""}
                      onChange={set(label)}
                      displayEmpty
                      sx={{
                        bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill,
                        height: 30, width: 291, fontSize: 14,
                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                      }}
                    >
                      <MenuItem value="">請選擇</MenuItem>
                      {categories.filter(c => c !== "全部").map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FieldRow>
                );
              }
              return (
                <FieldRow key={label} label={label}>
                  <PillInput value={form[label] || ""} onChange={set(label)} />
                </FieldRow>
              );
            })}

            {/* Tag chips row */}
            <FieldRow label="標籤">
              <Box sx={{ display: "flex", gap: 0.7 }}>
                {Object.keys(TAG_COLORS).map((t) => (
                  <Box
                    key={t}
                    onClick={() => toggleTag(t)}
                    sx={{
                      px: 1.2, py: "2px", borderRadius: "20px", fontSize: 13,
                      bgcolor: tags.includes(t) ? TAG_COLORS[t] : "rgba(0,0,0,0.05)",
                      cursor: "pointer", fontFamily: "'Lemon',sans-serif",
                    }}
                  >
                    {t}
                  </Box>
                ))}
              </Box>
            </FieldRow>
          </Box>
        </Box>

        {/* Image upload card */}
        <Box sx={{
          mt: 4, bgcolor: "#fffefe", borderRadius: "20px", boxShadow: tokens.shadow.pill,
          width: { xs: "100%", md: "60%" }, maxWidth: 600, ml: { xs: 0, md: "auto" }, p: { xs: 2, md: 4 },
          display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
          cursor: "pointer",
        }}>
          <AddCircleIcon sx={{ fontSize: 46, color: tokens.color.text }} />
          <Typography sx={{ fontFamily: "'Lexend',sans-serif", fontSize: 24 }}>新增圖片</Typography>
        </Box>

        {/* Publish button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            onClick={() => { alert("活動已發布！(Mock)"); navigate("/"); }}
            sx={{
              bgcolor: "#39a7ff", color: "#000",
              borderRadius: "10px", height: 51, width: 110,
              fontFamily: "'Lexend',sans-serif", fontSize: 24,
              textTransform: "none",
              "&:hover": { bgcolor: "#1e88e5", color: "white" },
            }}
          >
            發布
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
