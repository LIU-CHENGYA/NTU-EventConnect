import { useTranslation } from "react-i18next";
import {
  Box, Dialog, DialogContent, Button, Avatar, IconButton, Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import { tokens } from "../theme";

const RED = "#FF4D4F";

export default function CancelConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  error = "",
  event,           // { title, sessionName, image, date, location }
  category,        // optional category chip text
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 460,
          width: "calc(100% - 32px)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "#FFF1F0",
          color: RED,
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderBottom: "1px solid #FFD6D6",
        }}
      >
        <WarningAmberIcon sx={{ color: RED }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.subtitle, color: RED, lineHeight: 1.2 }}>
            {t("cancelDialog.title")}
          </Typography>
          <Typography sx={{ fontSize: tokens.fontSize.caption, color: "#A8071A", mt: 0.25 }}>
            {t("cancelDialog.subtitle")}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#A8071A" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {event && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.25,
              border: "1px solid #EEF1F6",
              borderRadius: 1.5,
              mb: 2,
            }}
          >
            {event.image ? (
              <Avatar src={event.image} variant="rounded" sx={{ width: 44, height: 44 }} />
            ) : (
              <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: "#F0F2F5" }}>
                <EventIcon sx={{ color: "#9AA3B2" }} />
              </Avatar>
            )}
            <Box sx={{ minWidth: 0 }}>
              {category && (
                <Typography sx={{ fontSize: tokens.fontSize.caption, color: "#5A6B82", mb: 0.25 }}>
                  {category}
                </Typography>
              )}
              <Typography sx={{ fontWeight: 700, fontSize: tokens.fontSize.body, lineHeight: 1.3 }} noWrap>
                {event.title}
              </Typography>
              <Typography sx={{ fontSize: tokens.fontSize.caption, color: "#5A6B82" }} noWrap>
                {[event.sessionName, event.date, event.location].filter(Boolean).join("・")}
              </Typography>
            </Box>
          </Box>
        )}

        <Box component="ul" sx={{ pl: 2.5, m: 0, color: "#3a3a3a", fontSize: tokens.fontSize.body, lineHeight: 1.7 }}>
          <li>{t("cancelDialog.bullet1")}</li>
          <li>{t("cancelDialog.bullet2")}</li>
        </Box>

        {error && (
          <Box sx={{
            mt: 2, px: 2, py: 1.25, borderRadius: 1.5,
            bgcolor: "#FFF1F0", border: "1px solid #FFD6D6",
            color: "#A8071A", fontSize: tokens.fontSize.body,
          }}>
            {error}
          </Box>
        )}

        <Box sx={{ mt: 3, display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              textTransform: "none",
              border: "1px solid #D9DEE7",
              color: "#3a3a3a",
              px: 2.5,
              py: 1,
              borderRadius: 1.5,
              minWidth: 110,
            }}
          >
            {t("cancelDialog.keep")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            sx={{
              textTransform: "none",
              bgcolor: RED,
              color: "#fff",
              px: 2.5,
              py: 1,
              borderRadius: 1.5,
              minWidth: 140,
              "&:hover": { bgcolor: "#D9363E" },
            }}
          >
            {t("cancelDialog.confirm")}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
