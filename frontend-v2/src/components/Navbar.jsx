import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AppBar, Toolbar, IconButton, Box, Button,
  Avatar, Menu, MenuItem,
  Drawer, List, ListItemButton, ListItemText, Divider,
  useMediaQuery, useTheme,
  Popover, Badge, Typography, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import LocaleSwitcher from "./LocaleSwitcher";
import { usersApi, postsApi } from "../api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Notification bell state
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [upcomingRegs, setUpcomingRegs] = useState([]);
  const [groupPosts, setGroupPosts] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleBellClick = async (e) => {
    setNotifAnchor(e.currentTarget);
    if (!user) return;
    setNotifLoading(true);
    try {
      const [regs, posts] = await Promise.all([
        usersApi.myRegistrations().catch(() => []),
        // Group-post notifications: recent posts in the user's groups (by others).
        postsApi.list({ visibility: "group", size: 10 }).catch(() => []),
      ]);
      // Filter upcoming registrations in next 7 days
      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = regs.filter((r) => {
        if (!r.date || r.status !== "success") return false;
        const d = new Date(r.date);
        return d >= now && d <= in7days;
      });
      setUpcomingRegs(upcoming);
      setGroupPosts(posts.filter((p) => p.userId !== user.id).slice(0, 5));
    } finally {
      setNotifLoading(false);
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

          {/* Board + Locale + Admin Create Event (desktop, left side) */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                onClick={() => navigate("/board")}
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18, color: isOnBoard ? "#fff" : tokens.color.navy }} />}
                sx={{
                  textTransform: "none",
                  bgcolor: isOnBoard ? tokens.color.navy : tokens.color.bg,
                  color: isOnBoard ? "#fff" : tokens.color.navy,
                  fontWeight: 700,
                  borderRadius: "9999px",
                  px: 2,
                  height: 36,
                  "&:hover": { bgcolor: isOnBoard ? tokens.color.navyDark : "#E6ECFB" },
                }}
              >
                {t("nav.board")}
              </Button>
              <LocaleSwitcher />
              {user?.isAdmin && (
                <Button
                  startIcon={<AddCircleIcon sx={{ color: "white" }} />}
                  onClick={() => navigate("/events/create")}
                  sx={{
                    bgcolor: tokens.color.black,
                    color: "#f3f3f5",
                    textTransform: "none",
                    borderRadius: "20px",
                    px: 2,
                    height: 36,
                    boxShadow: tokens.shadow.pill,
                    fontSize: tokens.fontSize.body,
                    "&:hover": { bgcolor: "#222" },
                  }}
                >
                  {t("nav2.createEvent")}
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* ===== Desktop right area ===== */}
          {!isMobile && (
            <>
              {!user ? (
                <>
                  <Button
                    onClick={() => navigate("/register")}
                    sx={{
                      color: tokens.color.textSecondary,
                      fontSize: tokens.fontSize.body,
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
                      color: tokens.color.textSecondary,
                      fontSize: tokens.fontSize.body,
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
                  {/* Notification bell with popover */}
                  <IconButton onClick={handleBellClick} sx={{ mr: 1 }}>
                    <Badge
                      badgeContent={upcomingRegs.length + groupPosts.length}
                      color="error"
                      max={9}
                    >
                      <NotificationsNoneIcon sx={{ color: "#333", fontSize: 28 }} />
                    </Badge>
                  </IconButton>
                  <Popover
                    open={Boolean(notifAnchor)}
                    anchorEl={notifAnchor}
                    onClose={() => setNotifAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{ sx: { width: 320, maxHeight: 480, borderRadius: 2 } }}
                  >
                    <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.body }}>{t("notifications.title")}</Typography>
                    </Box>
                    {notifLoading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Box sx={{ overflowY: "auto", maxHeight: 400 }}>
                        {upcomingRegs.length > 0 && (
                          <>
                            <Typography
                              sx={{
                                px: 2, py: 1, fontSize: tokens.fontSize.caption, fontWeight: 700,
                                color: "#666", bgcolor: "#f5f5f5",
                              }}
                            >
                              {t("notifications.upcomingEvents")}
                            </Typography>
                            {upcomingRegs.map((r) => (
                              <Box
                                key={r.id}
                                onClick={() => { setNotifAnchor(null); navigate(`/events/${r.event_id}`); }}
                                sx={{
                                  px: 2, py: 1.5, cursor: "pointer",
                                  "&:hover": { bgcolor: "#f9f9f9" },
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600 }} noWrap>
                                  {r.event_title}
                                </Typography>
                                <Typography sx={{ fontSize: tokens.fontSize.caption, color: "#999" }}>
                                  {r.date} · {r.location || t("notifications.location")}
                                </Typography>
                              </Box>
                            ))}
                          </>
                        )}
                        {groupPosts.length > 0 && (
                          <>
                            <Typography
                              sx={{
                                px: 2, py: 1, fontSize: tokens.fontSize.caption, fontWeight: 700,
                                color: "#666", bgcolor: "#f5f5f5",
                              }}
                            >
                              {t("notifications.groupPosts")}
                            </Typography>
                            {groupPosts.map((p) => (
                              <Box
                                key={p.id}
                                onClick={() => {
                                  setNotifAnchor(null);
                                  navigate(p.isBoardPost ? `/board/posts/${p.id}` : `/posts/${p.id}`);
                                }}
                                sx={{
                                  px: 2, py: 1.5, cursor: "pointer",
                                  "&:hover": { bgcolor: "#f9f9f9" },
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 600 }} noWrap>
                                  {p.title || p.content?.slice(0, 30)}
                                </Typography>
                                <Typography sx={{ fontSize: tokens.fontSize.caption, color: "#999" }}>
                                  {(p.createdAt || "").slice(0, 10)}
                                </Typography>
                              </Box>
                            ))}
                          </>
                        )}
                        {upcomingRegs.length === 0 && groupPosts.length === 0 && (
                          <Typography sx={{ p: 3, textAlign: "center", color: "#999", fontSize: tokens.fontSize.body }}>
                            {t("notifications.empty")}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Popover>

                  {/* Avatar + dropdown menu */}
                  <Box
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                  >
                    <Avatar src={user.avatarUrl} sx={{ width: 52, height: 52 }} />
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
                    <MenuItem onClick={() => { setAnchorEl(null); navigate("/board?view=groups"); }}>
                      {t("nav.groups")}
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>{t("nav.logout")}</MenuItem>
                  </Menu>
                </>
              )}
            </>
          )}

          {/* ===== Mobile right icons ===== */}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon sx={{ color: tokens.color.text, fontSize: 26 }} />
            </IconButton>
          )}
        </Toolbar>
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
                <Box sx={{ fontWeight: 600, fontSize: tokens.fontSize.body }}>{user.name || t("nav2.userFallback")}</Box>
                <Box sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>{user.email}</Box>
              </Box>
            </Box>
            <Divider />
            <List>
              <ListItemButton onClick={() => drawerNav("/")}>
                <ListItemText primary={t("nav2.home")} />
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
              <ListItemButton onClick={() => drawerNav("/board?view=groups")}>
                <ListItemText primary={t("nav.groups")} />
              </ListItemButton>
              {user.isAdmin && (
                <ListItemButton onClick={() => drawerNav("/events/create")}>
                  <ListItemText primary={t("nav2.createEvent")} />
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
              <ListItemText primary={t("nav2.home")} />
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
