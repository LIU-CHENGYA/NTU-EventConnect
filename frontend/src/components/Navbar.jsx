import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Button,
  Avatar, Menu, MenuItem, InputBase,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "white",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Typography
          component={Link}
          to="/"
          variant="h5"
          sx={{
            fontWeight: 800,
            fontFamily: "'Georgia', serif",
            color: "#1a237e",
            textDecoration: "none",
            letterSpacing: "-0.5px",
          }}
        >
          NTU EventConnect
        </Typography>

        {/* Right section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Search */}
          {user && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                mr: 1,
              }}
            >
              <InputBase
                placeholder="搜尋活動..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                sx={{ fontSize: 14, width: 180 }}
              />
              <SearchIcon sx={{ color: "#999", fontSize: 20 }} />
            </Box>
          )}

          {!user ? (
            <>
              {/* Not logged in */}
              <IconButton onClick={() => navigate("/?search=")}>
                <SearchIcon />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/register")}
                sx={{
                  borderColor: "#1a237e",
                  color: "#1a237e",
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                註冊
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate("/login")}
                sx={{
                  bgcolor: "#1a237e",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#0d1754" },
                }}
              >
                登入
              </Button>
            </>
          ) : (
            <>
              {/* Logged in */}
              {user.isAdmin && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/events/create")}
                  sx={{
                    borderColor: "#1a237e",
                    color: "#1a237e",
                    textTransform: "none",
                    borderRadius: 2,
                  }}
                >
                  新增活動
                </Button>
              )}
              <IconButton>
                <NotificationsNoneIcon sx={{ color: "#333" }} />
              </IconButton>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar
                  src={user.avatar}
                  sx={{ width: 36, height: 36 }}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
                  個人頁面
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); navigate("/my-registrations"); }}>
                  報名紀錄
                </MenuItem>
                <MenuItem onClick={handleLogout}>登出</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
