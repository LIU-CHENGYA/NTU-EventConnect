import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Menu, MenuItem } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon from "@mui/icons-material/Check";
import { tokens } from "../theme";

const OPTIONS = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
];

export default function LocaleSwitcher({ size = "md" }) {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const current = OPTIONS.find((o) => i18n.resolvedLanguage?.startsWith(o.code.split("-")[0])) || OPTIONS[0];

  const pick = (code) => {
    i18n.changeLanguage(code);
    setAnchorEl(null);
  };

  const isSm = size === "sm";

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: isSm ? 1 : 1.25,
          height: isSm ? 32 : 36,
          borderRadius: "9999px",
          bgcolor: tokens?.color?.bg || "#F2F4F8",
          color: tokens?.color?.navy || "#1F3A8A",
          fontSize: isSm ? 13 : 14,
          fontWeight: 600,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { filter: "brightness(0.97)" },
        }}
      >
        <LanguageIcon sx={{ fontSize: isSm ? 16 : 18 }} />
        {current.label}
        <ArrowDropDownIcon sx={{ fontSize: 18, ml: -0.5 }} />
      </Box>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {OPTIONS.map((o) => (
          <MenuItem key={o.code} onClick={() => pick(o.code)} sx={{ minWidth: 160 }}>
            <Box sx={{ flex: 1 }}>{o.label}</Box>
            {current.code === o.code && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
