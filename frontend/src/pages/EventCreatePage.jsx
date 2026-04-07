import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Grid, Paper, MenuItem, Select, FormControl } from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useAuth } from "../context/AuthContext";
import { categories } from "../mock/data";

export default function EventCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", time: "", location: "", sessionName: "", sessionContent: "",
    instructor: "", category: "講座", registrationTime: "", restrictions: "",
    organizer: "", organizerContact: "", capacity: "", meal: "無",
    civilServantHours: "", totalHours: "", learningCategory: "", city: "台北市",
    note: "", attachment: "",
  });

  if (!user) { navigate("/login"); return null; }

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    alert("活動已發布！（Mock）");
    navigate("/");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: 3, py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1a237e" }}>
          發布新的活動
        </Typography>

        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ borderRadius: 3, p: 3 }}>
              <Field label="活動名稱" value={form.title} onChange={handleChange("title")} />
              <Field label="時間" value={form.time} onChange={handleChange("time")} placeholder="2026-04-15 09:00-17:00" />
              <Field label="地點" value={form.location} onChange={handleChange("location")} />
              <Field label="場次名稱" value={form.sessionName} onChange={handleChange("sessionName")} />
              <Field label="場次內容" value={form.sessionContent} onChange={handleChange("sessionContent")} multiline rows={3} />
              <Field label="授課人" value={form.instructor} onChange={handleChange("instructor")} />

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>類別</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select value={form.category} onChange={handleChange("category")}>
                  {categories.filter(c => c !== "全部").map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Field label="報名時間" value={form.registrationTime} onChange={handleChange("registrationTime")} placeholder="2026-04-01 ~ 2026-04-10" />
              <Field label="限制條件" value={form.restrictions} onChange={handleChange("restrictions")} />
              <Field label="承辦單位" value={form.organizer} onChange={handleChange("organizer")} />
              <Field label="承辦人" value={form.organizerContact} onChange={handleChange("organizerContact")} />
            </Paper>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Field label="人數名額" value={form.capacity} onChange={handleChange("capacity")} />

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>用餐</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select value={form.meal} onChange={handleChange("meal")}>
                  <MenuItem value="無">無</MenuItem>
                  <MenuItem value="提供午餐">提供午餐</MenuItem>
                  <MenuItem value="提供茶點">提供茶點</MenuItem>
                  <MenuItem value="提供早餐">提供早餐</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                是否提供公務人員學習時數
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select value={form.civilServantHours} onChange={handleChange("civilServantHours")}>
                  <MenuItem value="">否</MenuItem>
                  <MenuItem value="2小時">2小時</MenuItem>
                  <MenuItem value="4小時">4小時</MenuItem>
                  <MenuItem value="6小時">6小時</MenuItem>
                  <MenuItem value="8小時">8小時</MenuItem>
                </Select>
              </FormControl>

              <Field label="研習總時數" value={form.totalHours} onChange={handleChange("totalHours")} />
              <Field label="學習類別" value={form.learningCategory} onChange={handleChange("learningCategory")} />
              <Field label="活動縣市" value={form.city} onChange={handleChange("city")} />
              <Field label="備註" value={form.note} onChange={handleChange("note")} multiline rows={2} />
              <Field label="附件" value={form.attachment} onChange={handleChange("attachment")} placeholder="上傳附件連結" />
            </Paper>

            {/* Image upload area */}
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Box
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#1a237e", bgcolor: "#f5f5ff" },
                }}
              >
                <AddPhotoAlternateIcon sx={{ fontSize: 40, color: "#999" }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  + 新增圖片
                </Typography>
              </Box>
            </Paper>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              sx={{
                bgcolor: "#1a237e",
                py: 1.3,
                borderRadius: 2,
                textTransform: "none",
                fontSize: 16,
                fontWeight: 600,
                "&:hover": { bgcolor: "#0d1754" },
              }}
            >
              發布
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

function Field({ label, value, onChange, multiline, rows, placeholder }) {
  return (
    <>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>{label}</Typography>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={onChange}
        multiline={multiline}
        rows={rows}
        placeholder={placeholder}
        sx={{ mb: 2 }}
      />
    </>
  );
}
