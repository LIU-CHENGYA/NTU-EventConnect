import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Box,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";

function App() {
  const events = [
    { id: 1, title: "校園音樂節", date: "2026-04-05", img: "https://shinphotos.com/wp-content/uploads/20180406210606_11.png" },
    { id: 2, title: "就業博覽會", date: "2026-04-10", img: "https://xinying-culture.tainan.gov.tw/upload/activity/202211221502439382.jpg" },
    { id: 3, title: "台大運動", date: "2026-04-15", img: "https://scontent.ftpe14-1.fna.fbcdn.net/v/t1.6435-9/121634968_1612318625594870_9120754580309404565_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=102&ccb=1-7&_nc_sid=13d280&_nc_ohc=XHyz6kqRTzMQ7kNvwE6PjyF&_nc_oc=Adrc8l3AGTacd6oHkHotpMGySS85nU_90j7mhMwuDD5U66sP7Jl8AXTVhS3xFtmhqFU&_nc_zt=23&_nc_ht=scontent.ftpe14-1.fna&_nc_gid=Scb_-DpW8dtk_mxxAWA-MQ&_nc_ss=7a32e&oh=00_AfyzaHvwj3n92QmN3ZsI2zus848-SRp8v9uujiJz3v_l_A&oe=69EF294D" },
    { id: 4, title: "電影之夜", date: "2026-04-18", img: "" },
    { id: 5, title: "藝術展覽", date: "2026-04-22", img: "" },
    { id: 6, title: "徵才活動", date: "2026-04-18", img: "" },
    { id: 7, title: "英文寫作", date: "2026-04-22", img: "" },
  ];

  const hotEvents = [
    { id: 101, title: "NTU Festival", date: "2026-04-20", img: "https://mse.ntust.edu.tw/var/file/19/1019/img/2514/624397673.png" },
    { id: 102, title: "AI 黑客松", date: "2026-04-25", img: "https://www.mlepb.gov.tw/api/news/36/20220726142816340.jpg" },
    { id: 103, title: "校園馬拉松", date: "2026-04-28", img: "https://b-signupactivity.ntub.edu.tw/UploadImages/201932510567625.jpg" },
    { id: 104, title: "校園馬拉松", date: "2026-04-8", img: "" },
    { id: 105, title: "徵才博覽會", date: "2026-01-28", img: "" },
    { id: 106, title: "杜鵑花節", date: "2026-02-28", img: "" },
  ];

  const renderCarousel = (data, highlight = false) => (
    <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={10}                // 卡片間距
      slidesPerView={3}                 // 一開始就顯示三張卡片
      centeredSlides={false}            // 不要置中第一張，直接顯示三張
      navigation
      pagination={{ clickable: true }}
      style={{ paddingLeft: "60px", paddingRight: "60px" }} // 左右留白，避免壓到箭頭
    >
      {data.map((event) => (
        <SwiperSlide key={event.id}>
          <Card
            sx={{
              width: 280,
              height: 340,
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.03)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              },
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image={event.img}
              alt={event.title}
              sx={{ objectFit: "cover" }}
            />
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {event.title}
              </Typography>
              <Typography color="text.secondary">{event.date}</Typography>
            </CardContent>
          </Card>
        </SwiperSlide>
      ))}
    </Swiper>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 上方搜尋欄位 */}
      <AppBar position="static" sx={{ bgcolor: "#1e1e2f", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* 左邊標題：漸層文字 */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(90deg,#ff6f61,#ffcc00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NTU EventConnect
          </Typography>

          {/* 右邊搜尋框 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="搜尋活動..."
              sx={{
                bgcolor: "white",
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "none" }, // 移除邊框
                },
              }}
            />
            <IconButton sx={{ bgcolor: "#ff6f61", color: "white", "&:hover": { bgcolor: "#e85c50" } }}>
              <SearchIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {/* 活動列表輪播 */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          活動列表
        </Typography>
        {renderCarousel(events)}
      </Box>

      {/* 熱門活動輪播 */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          熱門活動
        </Typography>
        {renderCarousel(hotEvents, true)}
      </Box>
    </Box>
  );
}

export default App;
