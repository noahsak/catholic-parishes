// src/liturgicalColors.jsx

import whiteLight from "@/assets/icons/church_icon_white_light.png";
import whiteDark from "@/assets/icons/church_icon_white_dark.png";
import redLight from "@/assets/icons/church_icon_red_light.png";
import redDark from "@/assets/icons/church_icon_red_dark.png";
import greenLight from "@/assets/icons/church_icon_green_light.png";
import greenDark from "@/assets/icons/church_icon_green_dark.png";
import purpleLight from "@/assets/icons/church_icon_purple_light.png";
import purpleDark from "@/assets/icons/church_icon_purple_dark.png";
import roseLight from "@/assets/icons/church_icon_rose_light.png";
import roseDark from "@/assets/icons/church_icon_rose_dark.png";
import blueLight from "@/assets/icons/church_icon_blue_light.png";
import blueDark from "@/assets/icons/church_icon_blue_dark.png";

import dioWhiteLight from "@/assets/dicons/dio_icon_white_light.png";
import dioWhiteDark from "@/assets/dicons/dio_icon_white_dark.png";
import dioRedLight from "@/assets/dicons/dio_icon_red_light.png";
import dioRedDark from "@/assets/dicons/dio_icon_red_dark.png";
import dioGreenLight from "@/assets/dicons/dio_icon_green_light.png";
import dioGreenDark from "@/assets/dicons/dio_icon_green_dark.png";
import dioPurpleLight from "@/assets/dicons/dio_icon_purple_light.png";
import dioPurpleDark from "@/assets/dicons/dio_icon_purple_dark.png";
import dioRoseLight from "@/assets/dicons/dio_icon_rose_light.png";
import dioRoseDark from "@/assets/dicons/dio_icon_rose_dark.png";
import dioBlueLight from "@/assets/dicons/dio_icon_blue_light.png";
import dioBlueDark from "@/assets/dicons/dio_icon_blue_dark.png";

export const accentColors = {
  WHITE: "#FFFFFF",
  RED: "#d43737ff",
  GREEN: "#0d5c0dff",
  PURPLE: "#8a218aff",
  ROSE: "#ffc0cbff",
  BLACK: "#000000",
  BLUE: "#6496faff"
};

export const darkAccentColors = {
  WHITE: "#F5F5F5",
  RED: "#ff0606ff",
  GREEN: "#074B07",
  PURPLE: "#45236dff",
  ROSE: "#ff8fa2ff",
  BLACK: "#AAAAAA",
  BLUE: "#4779EF"
};

export const iconPaths = {
  WHITE: { light: whiteLight, dark: whiteDark },
  RED: { light: redLight, dark: redDark },
  GREEN: { light: greenLight, dark: greenDark },
  PURPLE: { light: purpleLight, dark: purpleDark },
  ROSE: { light: roseLight, dark: roseDark },
  BLUE: { light: blueLight, dark: blueDark },
  // Fallback for Black (usually uses Purple or White icons)
  BLACK: { light: whiteLight, dark: whiteDark },
};

export const dioIconPaths = {
  WHITE: { light: dioWhiteLight, dark: dioWhiteDark },
  RED: { light: dioRedLight, dark: dioRedDark },
  GREEN: { light: dioGreenLight, dark: dioGreenDark },
  PURPLE: { light: dioPurpleLight, dark: dioPurpleDark },
  ROSE: { light: dioRoseLight, dark: dioRoseDark },
  BLUE: { light: dioBlueLight, dark: dioBlueDark },
  // Fallback for Black (usually uses Purple or White icons)
  BLACK: { light: dioWhiteLight, dark: dioWhiteDark },
};