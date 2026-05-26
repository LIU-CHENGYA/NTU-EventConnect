import { Dialog, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import { useState } from "react";

export default function ImageLightbox({ images, initialIndex = 0, open, onClose }) {
  const [current, setCurrent] = useState(initialIndex);

  if (!open || !images || images.length === 0) return null;

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none", overflow: "visible" } }}
      BackdropProps={{ sx: { bgcolor: "rgba(0,0,0,0.88)" } }}
    >
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {images.length > 1 && (
          <IconButton
            onClick={prev}
            sx={{
              position: "absolute", left: -56, color: "white",
              bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            <NavigateBeforeIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        <img
          src={images[current]}
          alt=""
          style={{ maxWidth: "85vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }}
        />
        {images.length > 1 && (
          <IconButton
            onClick={next}
            sx={{
              position: "absolute", right: -56, color: "white",
              bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            <NavigateNextIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute", top: -48, right: -48, color: "white",
            bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>
    </Dialog>
  );
}
