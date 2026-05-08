import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AppBar, Toolbar, IconButton, Box, Button,
  Avatar, Menu, MenuItem, InputBase,
  Drawer, List, ListItemButton, ListItemText, Divider,
  useMediaQuery, useTheme, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LanguageIcon from "@mui/icons-material/Language";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";

const NAV_TABS = [
  { label: "全部活動", value: "all" },
  { label: "台大官方分類", value: "official" },
  { label: "#標籤分類", value: "tags" },
  { label: "免費活動", value: "free" },
  { label: "有提供餐點", value: "food" },
  { label: "企業徵才", value: "job" },
  { label: "英文相關", value: "english" },
];

const LANGUAGES = ["繁體中文", "简体中文", "English"];

export default function Navbar({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("繁體中文");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setDrawerOpen(false);
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    setAnchorEl(null);
    setDrawerOpen(false);
    logout();
    navigate("/");
  };

  const drawerNav = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: tokens.color.surface,
          boxShadow: tokens.shadow.nav,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        {/* ── Top row ── */}
        <Toolbar
          sx={{
            height: tokens.navHeight,
            minHeight: `${tokens.navHeight}px !important`,
            px: { xs: 1.5, md: 3 },
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
              fontSize: { xs: 22, md: 28 },
              color: tokens.color.navy,
              textDecoration: "none",
              fontStyle: "italic",
              lineHeight: 1,
              mr: { xs: 1, md: 3 },
              whiteSpace: "nowrap",
            }}
          >
            NTU EventConnect
          </Box>

          {/* ===== Desktop top-row extras ===== */}
          {!isMobile && (
            <>
              {/* 留言板 */}
              <Button
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
                onClick={() => navigate("/board")}
                sx={{
                  color: tokens.color.text,
                  fontSize: 14,
                  textTransform: "none",
                  mr: 1,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: "8px",
                  px: 1.5,
                  height: 34,
                  whiteSpace: "nowrap",
                }}
              >
                留言板
              </Button>

              {/* 語言切換 */}
              <Button
                startIcon={<LanguageIcon sx={{ fontSize: 18 }} />}
                endIcon={<ArrowDropDownIcon />}
                onClick={(e) => setLangAnchorEl(e.currentTarget)}
                sx={{
                  color: tokens.color.text,
                  fontSize: 14,
                  textTransform: "none",
                  mr: 2,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: "8px",
                  px: 1.5,
                  height: 34,
                  whiteSpace: "nowrap",
                }}
              >
                {selectedLang}
              </Button>
              <Menu
                anchorEl={langAnchorEl}
                open={Boolean(langAnchorEl)}
                onClose={() => setLangAnchorEl(null)}
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem
                    key={lang}
                    selected={lang === selectedLang}
                    onClick={() => { setSelectedLang(lang); setLangAnchorEl(null); }}
                  >
                    {lang}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          <Box sx={{ flex: 1 }} />

          {/* ===== Desktop right side ===== */}
          {!isMobile && (
            <>
              {/* Search pill */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: tokens.color.bg,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: "9999px",
                  height: 40,
                  px: 2,
                  width: 240,
                  mr: 2,
                }}
              >
                <InputBase
                  placeholder="搜尋活動..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  sx={{
                    fontSize: 14,
                    flex: 1,
                    color: tokens.color.text,
                    "& input::placeholder": { color: tokens.color.placeholder, opacity: 1 },
                  }}
                />
                <SearchIcon
                  onClick={handleSearchClick}
                  sx={{ color: tokens.color.placeholder, fontSize: 18, cursor: "pointer" }}
                />
              </Box>

              {!user ? (
                <>
                  <Button
                    onClick={() => navigate("/register")}
                    sx={{
                      color: tokens.color.placeholder,
                      fontSize: 16,
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
                      fontSize: 16,
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
                  <IconButton sx={{ mr: 1 }}>
                    <NotificationsNoneIcon sx={{ color: "#333", fontSize: 26 }} />
                  </IconButton>
                  <Box
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                  >
                    <Avatar src={user.avatarUrl} sx={{ width: 40, height: 40 }} />
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
            </>
          )}

          {/* ===== Mobile icons ===== */}
          {isMobile && (
            <>
              <IconButton onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
                <SearchIcon sx={{ color: tokens.color.text, fontSize: 26 }} />
              </IconButton>
              <IconButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon sx={{ color: tokens.color.text, fontSize: 26 }} />
              </IconButton>
            </>
          )}
        </Toolbar>

        {/* ── Mobile search bar ── */}
        {isMobile && mobileSearchOpen && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: tokens.color.surface,
              px: 2,
              py: 1,
              borderTop: `1px solid ${tokens.color.border}`,
            }}
          >
            <InputBase
              autoFocus
              placeholder="搜尋活動..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              sx={{
                flex: 1,
                fontSize: 15,
                bgcolor: tokens.color.bg,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: "9999px",
                height: 40,
                px: 2,
                color: tokens.color.text,
                "& input::placeholder": { color: tokens.color.placeholder, opacity: 1 },
              }}
            />
            <IconButton onClick={handleSearchClick} sx={{ ml: 1 }}>
              <SearchIcon sx={{ color: tokens.color.navy }} />
            </IconButton>
            <IconButton onClick={() => setMobileSearchOpen(false)}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        )}

        {/* ── Second row: category tabs (desktop only) ── */}
        {!isMobile && (
          <Box
            sx={{
              borderTop: `1px solid ${tokens.color.border}`,
              px: 3,
              display: "flex",
              alignItems: "center",
              height: 44,
              gap: 0.5,
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {NAV_TABS.map((tab) => (
              <Button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                sx={{
                  fontSize: 13,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  px: 1.5,
                  py: 0.5,
                  minWidth: 0,
                  height: 30,
                  borderRadius: "6px",
                  color: activeTab === tab.value ? tokens.color.navy : tokens.color.text,
                  fontWeight: activeTab === tab.value ? 700 : 400,
                  bgcolor: activeTab === tab.value ? `${tokens.color.navy}14` : "transparent",
                  "&:hover": { bgcolor: `${tokens.color.navy}0d` },
                }}
              >
                {tab.label}
              </Button>
            ))}
            <Button
              sx={{
                fontSize: 13,
                textTransform: "none",
                color: tokens.color.placeholder,
                minWidth: 0,
                px: 1,
                height: 30,
              }}
              endIcon={<ArrowDropDownIcon />}
            >
              更多
            </Button>
          </Box>
        )}
      </AppBar>

      {/* ── Mobile drawer ── */}
      <Drawer
        anchor="right"
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260 } }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ fontFamily: tokens.font.logo, fontSize: 20, color: tokens.color.navy, fontStyle: "italic" }}>
            EventConnect
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {user ? (
          <>
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar src={user.avatarUrl} sx={{ width: 40, height: 40 }} />
              <Box>
                <Box sx={{ fontWeight: 600, fontSize: 14 }}>{user.name || "使用者"}</Box>
                <Box sx={{ fontSize: 12, color: tokens.color.placeholder }}>{user.email}</Box>
              </Box>
            </Box>
            <Divider />
            <List>
              <ListItemButton onClick={() => drawerNav("/")}>
                <ListItemText primary="首頁" />
              </ListItemButton>
              <ListItemButton onClick={() => drawerNav("/profile")}>
                <ListItemText primary="個人頁面" />
              </ListItemButton>
              <ListItemButton onClick={() => drawerNav("/my-registrations")}>
                <ListItemText primary="報名紀錄" />
              </ListItemButton>
              <ListItemButton onClick={() => drawerNav("/board")}>
                <ListItemText primary="留言板" />
              </ListItemButton>
              {user.isAdmin && (
                <ListItemButton onClick={() => drawerNav("/events/create")}>
                  <ListItemText primary="新增活動" />
                </ListItemButton>
              )}
            </List>
            <Divider />
            <List>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="登出" sx={{ color: "error.main" }} />
              </ListItemButton>
            </List>
          </>
        ) : (
          <List>
            <ListItemButton onClick={() => drawerNav("/")}>
              <ListItemText primary="首頁" />
            </ListItemButton>
            <ListItemButton onClick={() => drawerNav("/board")}>
              <ListItemText primary="留言板" />
            </ListItemButton>
            <ListItemButton onClick={() => drawerNav("/login")}>
              <ListItemText primary="登入" />
            </ListItemButton>
            <ListItemButton onClick={() => drawerNav("/register")}>
              <ListItemText primary="註冊" />
            </ListItemButton>
          </List>
        )}
      </Drawer>
    </>
  );
}

