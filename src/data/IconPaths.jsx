// src/data/iconPaths.js

// Option A: If files are in src/assets (Recommended for Vite optimization)
import greenLight from "@/assets/icons/church_icon_green_light.png";
import greenDark from "@/assets/icons/church_icon_green_dark.png";
import redLight from "@/assets/icons/church_icon_red_light.png";
import redDark from "@/assets/icons/church_icon_red_dark.png";
import whiteLight from "@/assets/icons/church_icon_white_light.png";
import whiteDark from "@/assets/icons/church_icon_white_dark.png";
import purpleLight from "@/assets/icons/church_icon_purple_light.png";
import purpleDark from "@/assets/icons/church_icon_purple_dark.png";
import roseLight from "@/assets/icons/church_icon_rose_light.png";
import roseDark from "@/assets/icons/church_icon_rose_dark.png";

export const iconPaths = {
  GREEN: { light: greenLight, dark: greenDark },
  RED: { light: redLight, dark: redDark },
  WHITE: { light: whiteLight, dark: whiteDark },
  PURPLE: { light: purpleLight, dark: purpleDark },
  ROSE: { light: roseLight, dark: roseDark },
  BLUE: { light: whiteLight, dark: whiteDark }, // Blue often uses White icons
  BLACK: { light: whiteLight, dark: whiteDark },
  DEFAULT: { light: purpleLight, dark: purpleDark },
};

/**
 * Helper to get the correct icon path based on color and theme
 */
export const getIconPath = (colorKey, isDarkMode) => {
  const color = iconPaths[colorKey] || iconPaths.DEFAULT;
  return isDarkMode ? color.dark : color.light;
};