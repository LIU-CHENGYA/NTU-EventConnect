import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AppBar, Toolbar, IconButton, Box, Button,
  Avatar, Menu, MenuItem, InputBase,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    if (e.key === "Enter") {
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
        bgcolor: tokens.color.surface,
        boxShadow: tokens.shadow.nav,
        height: tokens.navHeight,
        justifyContent: "center",
      }}
    >
      <Toolbar
        sx={{
          height: tokens.navHeight,
          minHeight: `${tokens.navHeight}px !important`,
          px: { xs: 2, md: 3 },
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Box
          component={Link}
          to="/"
          sx={{
            fontFamily: tokens.font.logo,
            fontSize: 32,
            color: tokens.color.navy,
            textDecoration: "none",
            fontStyle: "italic",
            lineHeight: 1,
            mr: 4,
            whiteSpace: "nowrap",
          }}
        >
          NTU EventConnect
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Search pill */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: tokens.color.bg,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: "9999px",
            height: 45,
            px: 2,
            width: 280,
            mr: 2,
          }}
        >
          <InputBase
            placeholder="搜尋活動..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            sx={{
              fontSize: 16,
              flex: 1,
              color: tokens.color.text,
              "& input::placeholder": { color: tokens.color.placeholder, opacity: 1 },
            }}
          />
          <SearchIcon sx={{ color: tokens.color.placeholder, fontSize: 20 }} />
        </Box>

        {!user ? (
          <>
            <Button
              onClick={() => navigate("/register")}
              sx={{
                color: tokens.color.placeholder,
                fontSize: 24,
                fontWeight: 500,
                textTransform: "none",
                minWidth: 0,
                mr: 1,
              }}
            >
              註冊
            </Button>
            <Button
              onClick={() => navigate("/login")}
              sx={{
                color: tokens.color.placeholder,
                fontSize: 24,
                fontWeight: 500,
                textTransform: "none",
                minWidth: 0,
              }}
            >
              登入
            </Button>
          </>
        ) : (
          <>
            {user.isAdmin && (
              <Button
                startIcon={<AddCircleIcon sx={{ color: "white" }} />}
                onClick={() => navigate("/events/create")}
                sx={{
                  bgcolor: tokens.color.black,
                  color: "#f3f3f5",
                  textTransform: "none",
                  borderRadius: "20px",
                  px: 2,
                  height: 37,
                  boxShadow: tokens.shadow.pill,
                  fontSize: 16,
                  mr: 2,
                  "&:hover": { bgcolor: "#222" },
                }}
              >
                新增活動
              </Button>
            )}
            <IconButton sx={{ mr: 1 }}>
              <NotificationsNoneIcon sx={{ color: "#333", fontSize: 28 }} />
            </IconButton>
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              <Avatar
                src={user.avatar}
                sx={{ width: 52, height: 52 }}
              />
              <ArrowDropDownIcon sx={{ color: "#333" }} />
            </Box>
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
      </Toolbar>
    </AppBar>
  );
}
