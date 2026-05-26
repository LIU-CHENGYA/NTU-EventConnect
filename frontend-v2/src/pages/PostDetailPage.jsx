import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Avatar, Button, IconButton,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import { useTranslation } from "react-i18next";
import { postsApi, eventsApi, commentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import ImageLightbox from "../components/ImageLightbox";

export default function PostDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Comment CRUD state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    postsApi.get(Number(id)).then(async (p) => {
      if (!live) return;
      setPost(p);
      if (p?.eventId) {
        const e = await eventsApi.get(p.eventId).catch(() => null);
        if (live) setEvent(e);
      }
      setLoading(false);
    }).catch(() => {
      if (live) { setPost(null); setLoading(false); }
    });
    return () => { live = false; };
  }, [id]);

  // Like/bookmark — redirect to login if not authenticated
  const handleBookmark = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const r = post.isBookmarked
        ? await postsApi.unbookmark(post.id)
        : await postsApi.bookmark(post.id);
      setPost({ ...post, isBookmarked: r.bookmarked, bookmarkCount: r.bookmark_count });
    } catch { /* ignore */ }
  };

  // Comment submit
  const handleAddComment = async () => {
    if (!user) { navigate("/login"); return; }
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const c = await postsApi.addComment(post.id, newComment.trim());
      setPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), {
          ...c,
          userId: c.user_id ?? user.id,
          userName: c.user_name ?? user.name,
          userAvatar: c.user_avatar ?? user.avatarUrl,
          createdAt: c.created_at ?? new Date().toISOString(),
          content: c.content ?? newComment.trim(),
        }],
        commentCount: (prev.commentCount ?? 0) + 1,
      }));
      setNewComment("");
    } catch {
      alert(t("comment.addFailed"));
    } finally {
      setSubmittingComment(false);
    }
  };

  // Comment edit handlers
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    try {
      await commentsApi.update(commentId, editingContent);
      setPost(prev => ({
        ...prev,
        comments: prev.comments.map(c =>
          c.id === commentId ? { ...c, content: editingContent } : c
        ),
      }));
      setEditingCommentId(null);
    } catch {
      alert(t("comment.editFailed"));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t("comment.deleteConfirm"))) return;
    try {
      await commentsApi.remove(commentId);
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId),
        commentCount: Math.max(0, (prev.commentCount ?? 1) - 1),
      }));
    } catch {
      alert(t("comment.deleteFailed"));
    }
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}><Typography>{t("common.loading")}</Typography></Box>;
  }
  if (!post) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: tokens.color.bg, minHeight: "calc(100vh - 76px)" }}>
        <Typography>{t("post.notFound")}</Typography>
      </Box>
    );
  }

  const isOwner = user && user.id === post.userId;
  const userName = post.userName;
  const userAvatar = post.userAvatar;
  const createdAt = (post.createdAt || "").slice(0, 10);

  const cardSx = {
    borderRadius: "20px",
    p: 3,
    boxShadow: tokens.shadow.pill,
    bgcolor: "#fffefe",
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 4 }}>
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.color.text }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontFamily: tokens.font.heading, fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: tokens.color.navy }}>
            {t("post.detailTitle")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5, alignItems: "flex-start" }}>
          <Paper sx={{ ...cardSx, flex: 1, width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
              {/* Bookmark button — always shown, redirects to /login if unauthenticated */}
              <IconButton
                onClick={handleBookmark}
                sx={{ color: post.isBookmarked ? "#e91e63" : tokens.color.text }}
              >
                {post.isBookmarked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              {isOwner && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  sx={{ textTransform: "none", color: tokens.color.navy, fontWeight: 600 }}
                >
                  {t("post.editPost")}
                </Button>
              )}
            </Box>

            {/* Author */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
              <Avatar
                src={userAvatar}
                sx={{ width: 44, height: 44, cursor: "pointer" }}
                onClick={() => navigate(`/profile/${post.userId}`)}
              />
              <Box>
                <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text }}>
                  {userName}
                </Typography>
                <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>
                  {createdAt}
                </Typography>
              </Box>
            </Box>

            {post.rating > 0 && (
              <Box sx={{ display: "flex", gap: 0.3, mb: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon
                    key={s}
                    sx={{ fontSize: 28, color: s <= post.rating ? tokens.color.star : tokens.color.border }}
                  />
                ))}
              </Box>
            )}

            <Typography sx={{ fontSize: tokens.fontSize.body, lineHeight: 1.85, color: tokens.color.text, mb: 2, whiteSpace: "pre-wrap" }}>
              {post.content}
            </Typography>

            {/* Images with lightbox */}
            {post.images?.length > 0 && (
              <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", mt: 1 }}>
                {post.images.map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    sx={{
                      width: 200, height: 200, borderRadius: "12px", objectFit: "cover",
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                      "&:hover": { opacity: 0.85 },
                    }}
                    onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                  />
                ))}
              </Box>
            )}

            {/* Comments section */}
            <Box sx={{ mt: 3, borderTop: `1px solid ${tokens.color.border}`, pt: 2 }}>
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text, mb: 2 }}>
                {t("comment.section")}
                {post.commentCount > 0 && ` (${post.commentCount})`}
              </Typography>

              {/* Comment list */}
              {(post.comments || []).map((comment) => {
                const isEditing = editingCommentId === comment.id;
                const isCommentOwner = user && comment.userId === user.id;
                return (
                  <Box key={comment.id} sx={{ mb: 2, display: "flex", gap: 1.2, alignItems: "flex-start" }}>
                    <Avatar
                      src={comment.userAvatar}
                      sx={{ width: 32, height: 32, cursor: "pointer", flexShrink: 0 }}
                      onClick={() => navigate(`/profile/${comment.userId}`)}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                        <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text }}>
                          {comment.userName}
                        </Typography>
                        <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>
                          {(comment.createdAt || "").slice(0, 10)}
                        </Typography>
                        {isCommentOwner && !isEditing && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEditComment(comment)}
                              sx={{ ml: "auto", p: 0.3, color: tokens.color.textSecondary }}
                            >
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteComment(comment.id)}
                              sx={{ p: 0.3, color: "#e53935" }}
                            >
                              <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </>
                        )}
                      </Box>
                      {isEditing ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <TextField
                            size="small"
                            multiline
                            minRows={2}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            fullWidth
                          />
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSaveEditComment(comment.id)}
                              sx={{ textTransform: "none", fontSize: tokens.fontSize.caption }}
                            >
                              {t("comment.save")}
                            </Button>
                            <Button
                              size="small"
                              onClick={() => setEditingCommentId(null)}
                              sx={{ textTransform: "none", fontSize: tokens.fontSize.caption }}
                            >
                              {t("common.cancel")}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: tokens.fontSize.body, color: tokens.color.text, whiteSpace: "pre-wrap" }}>
                          {comment.content}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}

              {/* Comment input */}
              {user ? (
                <Box sx={{ display: "flex", gap: 1.2, alignItems: "flex-start", mt: 2 }}>
                  <Avatar src={user.avatarUrl} sx={{ width: 32, height: 32, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <TextField
                      size="small"
                      multiline
                      minRows={2}
                      placeholder={t("comment.placeholder")}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      fullWidth
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAddComment}
                      disabled={submittingComment || !newComment.trim()}
                      sx={{ alignSelf: "flex-end", textTransform: "none" }}
                    >
                      {t("comment.submit")}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 2, bgcolor: tokens.color.bg, borderRadius: 2, textAlign: "center" }}>
                  <Typography
                    sx={{ fontSize: tokens.fontSize.body, color: tokens.color.navy, fontWeight: 700, cursor: "pointer" }}
                    onClick={() => navigate("/login")}
                  >
                    {t("comment.loginToComment")}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Event info sidebar */}
          {event && (
            <Paper
              sx={{ ...cardSx, width: { xs: "100%", md: 280 }, flexShrink: 0, cursor: "pointer" }}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <Box
                component="img"
                src={event.image}
                sx={{ width: "100%", height: 140, borderRadius: "12px", objectFit: "cover", mb: 1.5 }}
              />
              <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: tokens.color.text, mb: 1 }}>
                {event.title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.7 }}>
                <CalendarTodayIcon sx={{ fontSize: 14, color: tokens.color.textSecondary }} />
                <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary }}>
                  {event.date} {event.time}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 14, color: tokens.color.textSecondary }} />
                <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.textSecondary }}>
                  {event.location}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Image lightbox */}
      <ImageLightbox
        images={post?.images || []}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Box>
  );
}
