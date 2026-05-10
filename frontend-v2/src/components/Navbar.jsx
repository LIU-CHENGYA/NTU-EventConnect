import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AppBar, Toolbar, IconButton, Box, Button,
  Avatar, Menu, MenuItem, InputBase,
  Drawer, List, ListItemButton, ListItemText, Divider,
  useMediaQuery, useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  const isOnBoard = location.pathname.startsWith("/board");

  return (
    <>
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
              fontSize: { xs: 22, md: 32 },
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

          {/* Board + Locale (desktop, left of search) */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                onClick={() => navigate("/board")}
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
                sx={{
                  textTransform: "none",
                  bgcolor: isOnBoard ? "#E6ECFB" : tokens.color.bg,
                  color: tokens.color.navy,
                  fontWeight: 600,
                  borderRadius: "9999px",
                  px: 2,
                  height: 36,
                  "&:hover": { bgcolor: "#E6ECFB" },
                }}
              >
                {t("nav.board")}
              </Button>
              <LocaleSwitcher />
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* ===== Desktop ===== */}
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
                  height: 45,
                  px: 2,
                  width: 280,
                  mr: 2,
                }}
              >
                <InputBase
                  placeholder={t("nav.search")}
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
                <SearchIcon
                  onClick={handleSearchClick}
                  sx={{ color: tokens.color.placeholder, fontSize: 20, cursor: "pointer" }}
                />
              </Box>

              {!user ? (
                <>
                  <Button
                    onClick={() => navigate("/register")}
                    sx={{
                      color: tokens.color.placeholder,
                      fontSize: 22,
                      fontWeight: 500,
                      textTransform: "none",
                      minWidth: 0,
                      mr: 1,
                    }}
                  >
                    {t("nav.register")}
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    sx={{
                      color: tokens.color.placeholder,
                      fontSize: 22,
                      fontWeight: 500,
                      textTransform: "none",
                      minWidth: 0,
                    }}
                  >
                    {t("nav.login")}
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
                      src={user.avatarUrl}
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
                      {t("nav.profile")}
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); navigate("/my-registrations"); }}>
                      {t("nav.myRegistrations")}
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); navigate("/board"); }}>
                      {t("nav.groups")}
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>{t("nav.logout")}</MenuItem>
                  </Menu>
                </>
              )}
            </>
          )}

          {/* ===== Mobile ===== */}
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

        {/* Mobile search bar — slides open below navbar */}
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
              placeholder={t("nav.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              sx={{
                flex: 1,
                fontSize: 16,
                bgcolor: tokens.color.bg,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: "9999px",
                height: 42,
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
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
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

        <Box sx={{ p: 2 }}>
          <LocaleSwitcher size="sm" />
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
              <ListItemButton onClick={() => drawerNav("/board")}>
                <ListItemText primary={t("nav.board")} />
              </ListItemButton>
              <ListItemButton onClick={() => drawerNav("/profile")}>
                <ListItemText primary={t("nav.profile")} />
              </ListItemButton>
              <ListItemButton onClick={() => drawerNav("/my-registrations")}>
                <ListItemText primary={t("nav.myRegistrations")} />
              </ListItemButton>
              <ListItemButton onClick={() => drawerNav("/board")}>
                <ListItemText primary={t("nav.groups")} />
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
                <ListItemText primary={t("nav.logout")} sx={{ color: "error.main" }} />
              </ListItemButton>
            </List>
          </>
        ) : (
          <List>
            <ListItemButton onClick={() => drawerNav("/")}>
              <ListItemText primary="首頁" />
            </ListItemButton>
            <ListItemButton onClick={() => drawerNav("/board")}>
              <ListItemText primary={t("nav.board")} />
            </ListItemButton>
            <ListItemButton onClick={() => drawerNav("/login")}>
              <ListItemText primary={t("nav.login")} />
            </ListItemButton>
            <ListItemButton onClick={() => drawerNav("/register")}>
              <ListItemText primary={t("nav.register")} />
            </ListItemButton>
          </List>
        )}
      </Drawer>
    </>
  );
}
