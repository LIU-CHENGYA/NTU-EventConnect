import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, IconButton, InputBase, Avatar, Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import { boardApi, postsApi, groupsApi, eventsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import { formatDate } from "../utils/format";
import { translateTag } from "../i18n/tagLabels";
import BoardPostCreateDialog from "../components/BoardPostCreateDialog";
import GroupEditDialog from "../components/GroupEditDialog";

const NAVY = tokens.color.navy;

const SHORTCUT_TABS = [
  { id: "all",      labelKey: "filter.tabs.all",      query: null },
  { id: "official", labelKey: "filter.tabs.official", query: null }, // secondary chip row → category=
  { id: "tags",     labelKey: "filter.tabs.tags",     query: null }, // secondary chip row → tag=
  { id: "free",     labelKey: "filter.tabs.free",     query: { tag: "免報名費" } },
  { id: "meal",     labelKey: "filter.tabs.meal",     query: { tag: "免費餐點" } },
];

// Visibility chip labels are looked up at render time via t(`board.modal.vis${cap}`)

export default function BoardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // "My Groups" navbar entry points here as /board?view=groups
  const focusGroups = searchParams.get("view") === "groups";

  const [activeTab, setActiveTab] = useState("all");      // top filter row
  const [sidebarTab, setSidebarTab] = useState("all");    // sidebar (all|hot|new|mine|bookmarked|private)
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [hotWeekly, setHotWeekly] = useState([]);
  const [groups, setGroups] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);

  const [keyword, setKeyword] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  // allow multi-select tags: store as array
  const [selectedTag, setSelectedTag] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  // Reset secondary chip when switching the top tab away from official/tags.
  useEffect(() => {
    if (activeTab !== "official") setSelectedCategory("");
    if (activeTab !== "tags") setSelectedTag([]);
  }, [activeTab]);

  const reload = () => {
    // Combine top-row shortcut tab → tag/keyword query with sidebar tab + group/keyword.
    const tabDef = SHORTCUT_TABS.find((tt) => tt.id === activeTab);
    const tabQuery = (tabDef && tabDef.query) || {};
    const params = { ...tabQuery };

    if (activeTab === "official" && selectedCategory) params.category = selectedCategory;
    // when tags are selected, send as comma-separated string (backend expects a single tag query)
    if (activeTab === "tags" && selectedTag && selectedTag.length > 0) params.tag = selectedTag.join(",");

    const kw = keyword.trim();
    if (kw) {
      params.keyword = params.keyword ? `${params.keyword} ${kw}` : kw;
    }

    if (activeGroupId) {
      boardApi.byGroup(activeGroupId, params).then(setPosts).catch(() => setPosts([]));
      return;
    }
    let p;
    switch (sidebarTab) {
      case "hot":         p = boardApi.hot(params); break;
      case "new":         p = boardApi.new(params); break;
      case "mine":        p = boardApi.mine(params); break;
      case "bookmarked":  p = boardApi.bookmarked(params); break;
      case "private":     p = boardApi.privateOnly(params); break;
      default:            p = boardApi.list(params); break;
    }
    p.then(setPosts).catch(() => setPosts([]));
  };

  const clearKeyword = () => setKeyword("");

  useEffect(() => { reload(); /* eslint-disable-next-line */ },
    [sidebarTab, activeGroupId, activeTab, keyword, selectedCategory, selectedTag]);

  useEffect(() => {
    boardApi.hot({ size: 5 }).then(setHotWeekly).catch(() => setHotWeekly([]));
    if (user) groupsApi.listMine().then(setGroups).catch(() => setGroups([]));
    eventsApi.categories().then((rows) => setCategoryOptions(rows.map((r) => r.name))).catch(() => {});
    eventsApi.tags().then((rows) => setTagOptions(rows.map((r) => r.name))).catch(() => {});
  }, [user]);

  // When arriving via "My Groups" (/board?view=groups), focus the user's groups
  // by auto-selecting their first group instead of the default all-posts view.
  // No-op if they have no groups (the Groups sidebar still shows "Create group").
  useEffect(() => {
    if (focusGroups && groups.length > 0 && !activeGroupId) {
      setActiveGroupId(groups[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusGroups, groups]);

  // Keyword filtering happens server-side via boardApi params.
  const filteredPosts = posts;

  const onToggleLike = async (post) => {
    if (!user) { navigate("/login"); return; }
    try {
      const r = post.isLiked
        ? await postsApi.unlike(post.id)
        : await postsApi.like(post.id);
      setPosts(posts.map((p) => p.id === post.id ? {
        ...p, isLiked: r.liked, likeCount: r.like_count,
      } : p));
    } catch { /* ignore */ }
  };

  const onToggleBookmark = async (post) => {
    if (!user) { navigate("/login"); return; }
    try {
      const r = post.isBookmarked
        ? await postsApi.unbookmark(post.id)
        : await postsApi.bookmark(post.id);
      setPosts(posts.map((p) => p.id === post.id ? {
        ...p, isBookmarked: r.bookmarked, bookmarkCount: r.bookmark_count,
      } : p));
    } catch { /* ignore */ }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg }}>
      {/* === Top filter tabs (matches HomePage v2 visually) === */}
      <Box
        sx={{
          bgcolor: "#fff", borderBottom: `1px solid ${tokens.color.border}`,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", gap: 0.5, overflowX: "auto", maxWidth: 1280, mx: "auto" }}>
          {SHORTCUT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Box
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  px: 1.6, py: 1.2, fontSize: tokens.fontSize.body,
                  fontWeight: active ? 700 : 500,
                  color: active ? NAVY : tokens.color.text,
                  borderBottom: active ? `2px solid ${NAVY}` : "2px solid transparent",
                  cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                }}
              >
                {t(tab.labelKey)}
              </Box>
            );
          })}
        </Box>

        {(activeTab === "official" || activeTab === "tags") && (
          <Typography sx={{
            fontSize: tokens.fontSize.caption, color: tokens.color.placeholder,
            maxWidth: 1280, mx: "auto", mt: 1,
          }}>
            {activeTab === "official" ? t("filter.officialHint") : t("filter.tagsHint")}
          </Typography>
        )}
        {(activeTab === "official" || activeTab === "tags") && (
          <Box sx={{
            display: "flex", gap: 0.75,
            maxWidth: 1280, mx: "auto", mt: 0.5, mb: 0.5, p: 1.25,
            bgcolor: "#fff", border: `1px solid ${tokens.color.border}`, borderRadius: 1.5,
            // 母活動名は 329 種あるため横スクロール、タグは折返し OK
            flexWrap: activeTab === "tags" ? "wrap" : "nowrap",
            overflowX: activeTab === "official" ? "auto" : "visible",
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": { bgcolor: tokens.color.border, borderRadius: 3 },
          }}>
            <ChipBtn
              active={(activeTab === "official" ? selectedCategory : (selectedTag.length === 0))}
              onClick={() => activeTab === "official" ? setSelectedCategory("") : setSelectedTag([])}
            >
              {activeTab === "official" ? t("filter.anyCategory") : t("filter.anyTag")}
            </ChipBtn>
            {/* 母活動名は固有名詞なので i18n しない。Top 15 で frontend cap。 */}
            {(activeTab === "official"
              ? categoryOptions.slice(0, 15)
              : tagOptions
            ).map((opt) => {
              const cur = activeTab === "official" ? selectedCategory : selectedTag;
              const setCur = activeTab === "official" ? setSelectedCategory : setSelectedTag;
              const label = activeTab === "tags" ? translateTag(opt, i18n.language) : opt;
              if (activeTab === "official") {
                return (
                  <ChipBtn key={opt} active={cur === opt} onClick={() => setCur(opt)}>
                    {label}
                  </ChipBtn>
                );
              }
              // tags: multi-select (toggle in array)
              const active = Array.isArray(selectedTag) && selectedTag.includes(opt);
              const toggle = () => {
                if (!Array.isArray(selectedTag)) setSelectedTag([opt]);
                else if (selectedTag.includes(opt)) setSelectedTag(selectedTag.filter((x) => x !== opt));
                else setSelectedTag([...selectedTag, opt]);
              };
              return (
                <ChipBtn key={opt} active={active} onClick={toggle}>
                  {`#${label}`}
                </ChipBtn>
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            display: "flex", gap: 1.25, py: 1.5, maxWidth: 1280, mx: "auto",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <FilterField label={t("filter.keywordLabel")} placeholder={t("filter.keyword")}
            value={keyword} onChange={setKeyword} onClear={clearKeyword} clearLabel={t("filter.clear")} flex={3} />
          <IconButton
            onClick={reload}
            sx={{
              bgcolor: NAVY, color: "#fff", borderRadius: 1.5, width: 52, height: 52,
              alignSelf: "flex-end", "&:hover": { bgcolor: tokens.color.navyDark },
            }}
          >
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 3 }, py: 2.5,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "200px 1fr 240px" },
        gap: 2.5,
      }}>
        {/* === Sidebar === */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <SidebarSection title={t("board.category.title")}>
            <SideItem label={t("board.category.all")}     active={!activeGroupId && sidebarTab === "all"}        onClick={() => { setActiveGroupId(null); setSidebarTab("all"); }} />
            <SideItem label={t("board.category.hot")}     active={!activeGroupId && sidebarTab === "hot"}        onClick={() => { setActiveGroupId(null); setSidebarTab("hot"); }} />
            <SideItem label={t("board.category.new")}     active={!activeGroupId && sidebarTab === "new"}        onClick={() => { setActiveGroupId(null); setSidebarTab("new"); }} />
          </SidebarSection>
          {user && (
            <SidebarSection title={t("board.mine.title")}>
              <SideItem label={t("board.mine.myPosts")}    active={!activeGroupId && sidebarTab === "mine"}       onClick={() => { setActiveGroupId(null); setSidebarTab("mine"); }} />
              <SideItem label={t("board.mine.bookmarked")} active={!activeGroupId && sidebarTab === "bookmarked"} onClick={() => { setActiveGroupId(null); setSidebarTab("bookmarked"); }} />
              <SideItem label={t("board.mine.private")}    active={!activeGroupId && sidebarTab === "private"}    onClick={() => { setActiveGroupId(null); setSidebarTab("private"); }} />
            </SidebarSection>
          )}
          {user && (
            <SidebarSection title={t("board.groups.title")}>
              {groups.map((g) => (
                <SideItem
                  key={g.id}
                  label={g.name}
                  count={g.postCount}
                  active={activeGroupId === g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  onEdit={() => { setEditingGroupId(g.id); setGroupEditOpen(true); }}
                />
              ))}
              <Box
                onClick={() => { setEditingGroupId(null); setGroupEditOpen(true); }}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.75,
                  px: 1, py: 0.75, fontSize: tokens.fontSize.body,
                  color: NAVY, fontWeight: 600, cursor: "pointer",
                  borderRadius: 1, "&:hover": { bgcolor: tokens.color.bg },
                }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
                {t("board.groups.create")}
              </Box>
            </SidebarSection>
          )}
        </Box>

        {/* === Posts list === */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, position: "relative", pb: { xs: 12, md: 4 } }}>
          {/* Mobile-only groups strip — desktop has the sidebar; mobile had
              NO surface for groups previously (the only entry point). */}
          {user && (
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 0.5 }}>
              <Typography sx={{
                fontSize: tokens.fontSize.caption, fontWeight: 700, color: tokens.color.placeholder,
                textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5,
              }}>
                {t("board.groups.title")}
              </Typography>
              <Box sx={{
                display: "flex", gap: 0.75, overflowX: "auto", pb: 0.5,
                "&::-webkit-scrollbar": { height: 4 },
                "&::-webkit-scrollbar-thumb": { bgcolor: tokens.color.border, borderRadius: 2 },
              }}>
                <ChipBtn
                  active={!activeGroupId}
                  onClick={() => setActiveGroupId(null)}
                >
                  {t("board.category.all")}
                </ChipBtn>
                {groups.map((g) => (
                  <ChipBtn
                    key={g.id}
                    active={activeGroupId === g.id}
                    onClick={() => setActiveGroupId(g.id)}
                  >
                    {g.name}{typeof g.postCount === "number" ? ` (${g.postCount})` : ""}
                  </ChipBtn>
                ))}
                <ChipBtn
                  active={false}
                  onClick={() => { setEditingGroupId(null); setGroupEditOpen(true); }}
                >
                  + {t("board.groups.create")}
                </ChipBtn>
              </Box>
            </Box>
          )}
          {filteredPosts.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center", color: tokens.color.placeholder, bgcolor: "#fff", borderRadius: 2 }}>
              {t("board.noPosts")}
            </Box>
          ) : filteredPosts.map((p) => (
            <PostListItem
              key={p.id}
              post={p}
              onClick={() => navigate(`/board/posts/${p.id}`)}
              onToggleLike={() => onToggleLike(p)}
              onToggleBookmark={() => onToggleBookmark(p)}
            />
          ))}

          {/* Floating create button */}
          <Button
            onClick={() => user ? setCreateOpen(true) : navigate("/login")}
            startIcon={<AddIcon />}
            sx={{
              position: "fixed", bottom: 32, right: 32,
              bgcolor: NAVY, color: "#fff", borderRadius: "9999px",
              px: 2.5, py: 1.4, fontSize: tokens.fontSize.body, fontWeight: 700,
              textTransform: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              "&:hover": { bgcolor: tokens.color.navyDark },
              zIndex: 1200,
            }}
          >
            {t("board.newPost")}
          </Button>
        </Box>

        {/* === Right rail: weekly hot === */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: NAVY, mb: 1 }}>
            {t("board.weeklyHot")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {hotWeekly.map((p) => (
              <Box
                key={p.id}
                onClick={() => navigate(`/board/posts/${p.id}`)}
                sx={{
                  p: 1.25, bgcolor: "#fff", borderRadius: 1.5, cursor: "pointer",
                  border: `1px solid ${tokens.color.border}`,
                  "&:hover": { borderColor: NAVY },
                }}
              >
                <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, mb: 0.4 }} noWrap>
                  {p.title || p.content?.slice(0, 30)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <FavoriteIcon sx={{ fontSize: 12, color: "#FF4D4F" }} />
                  <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>
                    {p.likeCount}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <BoardPostCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={reload}
      />
      <GroupEditDialog
        open={groupEditOpen}
        groupId={editingGroupId}
        onClose={() => { setGroupEditOpen(false); setEditingGroupId(null); }}
        onSaved={() => groupsApi.listMine().then(setGroups).catch(() => {})}
      />
    </Box>
  );
}

function SidebarSection({ title, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{
        fontSize: tokens.fontSize.caption, fontWeight: 700, color: tokens.color.placeholder,
        textTransform: "uppercase", letterSpacing: 0.5, px: 1, mb: 0.5,
      }}>{title}</Typography>
      <Box sx={{ display: "flex", flexDirection: "column" }}>{children}</Box>
    </Box>
  );
}

function SideItem({ label, count, active, onClick, onEdit }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", gap: 0.75,
        px: 1, py: 0.75, fontSize: tokens.fontSize.body,
        color: active ? NAVY : tokens.color.text,
        bgcolor: active ? "#EEF2FB" : "transparent",
        fontWeight: active ? 700 : 500,
        cursor: "pointer", borderRadius: 1,
        "&:hover": { bgcolor: tokens.color.bg },
      }}
    >
      <Box sx={{ flex: 1 }}>{label}</Box>
      {typeof count === "number" && (
        <Box sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>{count}</Box>
      )}
      {onEdit && (
        <Box
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          sx={{ display: "flex", alignItems: "center", color: tokens.color.placeholder, "&:hover": { color: NAVY } }}
        >
          <MoreVertIcon sx={{ fontSize: 16 }} />
        </Box>
      )}
    </Box>
  );
}

function ChipBtn({ active, onClick, children }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.4, py: 0.6, fontSize: tokens.fontSize.body, fontWeight: active ? 700 : 500,
        color: active ? "#fff" : tokens.color.text,
        bgcolor: active ? NAVY : "#fff",
        border: `1px solid ${active ? NAVY : tokens.color.border}`,
        borderRadius: "9999px", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
        "&:hover": { borderColor: NAVY },
      }}
    >
      {children}
    </Box>
  );
}

function FilterField({ label, placeholder, value, onChange, icon, onClear, clearLabel, flex = 1 }) {
  return (
    <Box sx={{ flex }}>
      <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder, mb: 0.4 }}>{label}</Typography>
      <Box sx={{
        display: "flex", alignItems: "center",
        bgcolor: "#fff",
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 1.5, px: 1.4, height: 52, gap: 0.75,
      }}>
        {icon}
        <InputBase
          fullWidth
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{ fontSize: tokens.fontSize.body, flex: 1 }}
        />
        {onClear && value && (
          <IconButton
            onClick={onClear}
            size="small"
            aria-label={clearLabel || "clear"}
            sx={{ color: tokens.color.placeholder }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

function PostListItem({ post, onClick, onToggleLike, onToggleBookmark }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const VIS_LABELS = {
    public: t("board.modal.visPublic"),
    private: t("board.modal.visPrivate"),
    group: t("board.modal.visGroup"),
  };
  const visLabel = VIS_LABELS[post.visibility] || post.visibility;
  const visColor = post.visibility === "public" ? "#0EA371" : post.visibility === "private" ? "#6B7280" : "#7C3AED";
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: "#fff", borderRadius: 2, p: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Avatar src={post.userAvatar} sx={{ width: 36, height: 36 }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700 }}>{post.userName}</Typography>
          <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>
            {formatDate(post.createdAt)}
          </Typography>
        </Box>
        <Box sx={{
          fontSize: tokens.fontSize.caption, fontWeight: 700, px: 1, py: "2px",
          bgcolor: `${visColor}1A`, color: visColor, borderRadius: 0.6,
        }}>{visLabel}</Box>
      </Box>

      {post.eventTitle && (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            if (!post.eventId) return;
            const cat = post.eventOfficialCategory;
            if (cat) {
              navigate(`/?official_category=${encodeURIComponent(cat)}`);
            } else {
              navigate(`/events/${post.eventId}`);
            }
          }}
          sx={{
            display: "inline-flex", alignItems: "center", gap: 0.4,
            fontSize: tokens.fontSize.caption, fontWeight: 700,
            color: NAVY, bgcolor: "#E8EFFF", px: 0.8, py: "2px", borderRadius: 0.5, mb: 0.5,
            cursor: "pointer",
            "&:hover": { bgcolor: "#d0dcf7" },
          }}
        >
          <LocalActivityIcon sx={{ fontSize: 13 }} />
          {post.eventTitle}
        </Box>
      )}

      {post.title && (
        <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.subtitle, mb: 0.5 }}>{post.title}</Typography>
      )}
      <Typography
        sx={{ fontSize: tokens.fontSize.body, color: "#444", lineHeight: 1.6, whiteSpace: "pre-wrap",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}
      >
        {post.content}
      </Typography>

      {Array.isArray(post.images) && post.images.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
          {post.images.slice(0, 3).map((url) => (
            <Box key={url} sx={{
              width: 96, height: 96, borderRadius: 1, overflow: "hidden", bgcolor: "#F0F2F5",
            }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.25 }}>
        <Box
          onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
          sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", color: post.isLiked ? "#FF4D4F" : tokens.color.placeholder }}
        >
          {post.isLiked
            ? <FavoriteIcon sx={{ fontSize: 18 }} />
            : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
          <Typography sx={{ fontSize: tokens.fontSize.caption }}>{post.likeCount}</Typography>
        </Box>
        <Box
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", color: post.isBookmarked ? NAVY : tokens.color.placeholder }}
        >
          {post.isBookmarked
            ? <BookmarkIcon sx={{ fontSize: 18 }} />
            : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
          <Typography sx={{ fontSize: tokens.fontSize.caption }}>{post.bookmarkCount}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
