import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Avatar, IconButton, TextField, Button,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { postsApi, commentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import { formatDate } from "../utils/format";
import ImageLightbox from "../components/ImageLightbox";

const NAVY = tokens.color.navy;

export default function BoardPostDetailPage() {
  const { t } = useTranslation();
  const VIS_LABELS = {
    public: t("board.modal.visPublic"),
    private: t("board.modal.visPrivate"),
    group: t("board.modal.visGroup"),
  };
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
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
    setLoading(true);
    postsApi.get(Number(id))
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onToggleLike = async () => {
    if (!post) return;
    if (!user) { navigate("/login"); return; }
    try {
      const r = post.isLiked
        ? await postsApi.unlike(post.id)
        : await postsApi.like(post.id);
      setPost({ ...post, isLiked: r.liked, likeCount: r.like_count });
    } catch { /* ignore */ }
  };

  // Owner can edit / delete their own board post.
  const handleDeletePost = async () => {
    if (!window.confirm(t("comment.deleteConfirm"))) return;
    try {
      await postsApi.remove(post.id);
      navigate("/board");
    } catch {
      alert(t("comment.deleteFailed"));
    }
  };

  // Comment handlers
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

  const isOwner = user && post && user.id === post.userId;

  if (loading) return <Box sx={{ p: 6, textAlign: "center" }}>{t("common.loading")}</Box>;
  if (!post)   return <Box sx={{ p: 6, textAlign: "center" }}>{t("post.commentNotFound")}</Box>;

  const visColor = post.visibility === "public" ? "#0EA371" : post.visibility === "private" ? "#6B7280" : "#7C3AED";

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", bgcolor: tokens.color.bg, py: 3 }}>
      <Box sx={{ maxWidth: 920, mx: "auto", px: { xs: 2, md: 3 } }}>
        <Box
          onClick={() => navigate("/board")}
          sx={{
            display: "inline-flex", alignItems: "center", gap: 0.5,
            cursor: "pointer", color: NAVY, mb: 1.5,
            fontSize: tokens.fontSize.body, fontWeight: 600,
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
          {t("board.backToBoard")}
        </Box>

        <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
            <Avatar
              src={post.userAvatar}
              sx={{ width: 44, height: 44, cursor: "pointer" }}
              onClick={() => navigate(`/profile/${post.userId}`)}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, cursor: "pointer", "&:hover": { color: NAVY } }}
                onClick={() => navigate(`/profile/${post.userId}`)}
              >
                {post.userName}
              </Typography>
              <Typography sx={{ fontSize: tokens.fontSize.caption, color: tokens.color.placeholder }}>
                {formatDate(post.createdAt)}
              </Typography>
            </Box>
            <Box sx={{
              fontSize: tokens.fontSize.caption, fontWeight: 700, px: 1, py: "3px",
              bgcolor: `${visColor}1A`, color: visColor, borderRadius: 0.6,
            }}>{VIS_LABELS[post.visibility] || post.visibility}</Box>
            {isOwner && (
              <>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  sx={{ color: tokens.color.textSecondary }}
                  aria-label={t("post.editPost")}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDeletePost}
                  sx={{ color: "#e53935" }}
                  aria-label={t("common.delete")}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </>
            )}
          </Box>

          {post.eventTitle && (
            <Box
              onClick={() => post.eventId && navigate(`/events/${post.eventId}`)}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.5,
                fontSize: tokens.fontSize.caption, fontWeight: 700, color: NAVY,
                bgcolor: "#E8EFFF", px: 1, py: "3px", borderRadius: 0.6, mb: 1.25,
                cursor: post.eventId ? "pointer" : "default",
                "&:hover": post.eventId ? { bgcolor: "#d0dcf7" } : {},
              }}
            >
              🎟 {post.eventTitle}
            </Box>
          )}

          {post.title && (
            <Typography sx={{ fontSize: tokens.fontSize.title, fontWeight: 700, mb: 1.5 }}>
              {post.title}
            </Typography>
          )}

          {post.rating > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} sx={{ fontSize: 18, color: i < post.rating ? "#F5A623" : "#D9DEE7" }} />
              ))}
              <Typography sx={{ fontSize: tokens.fontSize.body, ml: 1, color: tokens.color.textSecondary }}>{post.rating} / 5</Typography>
            </Box>
          )}

          <Typography sx={{ fontSize: tokens.fontSize.body, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#222", mb: 2 }}>
            {post.content}
          </Typography>

          {/* Images with lightbox */}
          {Array.isArray(post.images) && post.images.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
              {post.images.map((url, idx) => (
                <Box
                  key={url}
                  sx={{
                    height: 200, borderRadius: 1.5, overflow: "hidden", bgcolor: "#F0F2F5",
                    cursor: "pointer",
                    "&:hover img": { opacity: 0.85 },
                  }}
                  onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.15s" }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Like button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <IconButton size="small" onClick={onToggleLike} sx={{ color: post.isLiked ? "#FF4D4F" : tokens.color.placeholder }}>
              {post.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography sx={{ fontSize: tokens.fontSize.body }}>{post.likeCount}</Typography>
          </Box>

          {/* Comments section */}
          <Box sx={{ mt: 3, borderTop: "1px solid #E5E7EB", pt: 2 }}>
            <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: "#222", mb: 2 }}>
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
                      <Typography sx={{ fontSize: tokens.fontSize.body, fontWeight: 700, color: "#222" }}>
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
                      <Typography sx={{ fontSize: tokens.fontSize.body, color: "#222", whiteSpace: "pre-wrap" }}>
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
                  sx={{ fontSize: tokens.fontSize.body, color: NAVY, fontWeight: 700, cursor: "pointer" }}
                  onClick={() => navigate("/login")}
                >
                  {t("comment.loginToComment")}
                </Typography>
              </Box>
            )}
          </Box>
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
