import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Avatar, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useTranslation } from "react-i18next";
import { postsApi } from "../api";
import { tokens } from "../theme";
import { formatDate } from "../utils/format";

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
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    postsApi.get(Number(id))
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onToggleLike = async () => {
    if (!post) return;
    try {
      const r = post.isLiked
        ? await postsApi.unlike(post.id)
        : await postsApi.like(post.id);
      setPost({ ...post, isLiked: r.liked, likeCount: r.like_count });
    } catch { /* ignore */ }
  };

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
            fontSize: 13, fontWeight: 600,
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
                sx={{ fontSize: 14, fontWeight: 700, cursor: "pointer", "&:hover": { color: NAVY } }}
                onClick={() => navigate(`/profile/${post.userId}`)}
              >
                {post.userName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: tokens.color.placeholder }}>
                {formatDate(post.createdAt)}
              </Typography>
            </Box>
            <Box sx={{
              fontSize: 11, fontWeight: 700, px: 1, py: "3px",
              bgcolor: `${visColor}1A`, color: visColor, borderRadius: 0.6,
            }}>{VIS_LABELS[post.visibility] || post.visibility}</Box>
          </Box>

          {post.eventTitle && (
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              fontSize: 12, fontWeight: 700, color: NAVY,
              bgcolor: "#E8EFFF", px: 1, py: "3px", borderRadius: 0.6, mb: 1.25,
            }}>
              🎟 {post.eventTitle}
            </Box>
          )}

          {post.title && (
            <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 1.5 }}>
              {post.title}
            </Typography>
          )}

          {post.rating > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} sx={{ fontSize: 18, color: i < post.rating ? "#F5A623" : "#D9DEE7" }} />
              ))}
              <Typography sx={{ fontSize: 13, ml: 1, color: tokens.color.textSecondary }}>{post.rating} / 5</Typography>
            </Box>
          )}

          <Typography sx={{ fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#222", mb: 2 }}>
            {post.content}
          </Typography>

          {Array.isArray(post.images) && post.images.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
              {post.images.map((url) => (
                <Box key={url} sx={{
                  height: 200, borderRadius: 1.5, overflow: "hidden", bgcolor: "#F0F2F5",
                }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <IconButton size="small" onClick={onToggleLike} sx={{ color: post.isLiked ? "#FF4D4F" : tokens.color.placeholder }}>
              {post.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography sx={{ fontSize: 13 }}>{post.likeCount}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
