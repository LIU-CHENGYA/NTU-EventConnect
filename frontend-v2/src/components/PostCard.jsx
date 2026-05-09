import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

export default function PostCard({ post }) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        },
      }}
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      {/* Post image */}
      {post.images?.length > 0 && (
        <Box
          component="img"
          src={post.images[0]}
          alt="post"
          sx={{ width: "100%", height: 160, objectFit: "cover" }}
        />
      )}

      <CardContent sx={{ p: 2 }}>
        {/* Author */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar src={post.userAvatar} sx={{ width: 28, height: 28 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {post.userName}
          </Typography>
        </Box>

        {/* Rating */}
        {post.rating > 0 && (
          <Box sx={{ display: "flex", gap: 0.3, mb: 0.5 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                sx={{
                  fontSize: 16,
                  color: star <= post.rating ? "#ffc107" : "#e0e0e0",
                }}
              />
            ))}
          </Box>
        )}

        {/* Content */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {post.content}
        </Typography>

        {/* Event tag */}
        {post.eventTitle && (
          <Typography
            variant="caption"
            sx={{
              display: "inline-block",
              mt: 1,
              px: 1,
              py: 0.3,
              bgcolor: "#e8eaf6",
              color: "#1a237e",
              borderRadius: 1,
              fontSize: 11,
            }}
          >
            {post.eventTitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
