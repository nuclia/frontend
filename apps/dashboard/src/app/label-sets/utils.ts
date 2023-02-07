import { isSameHexColor, LABEL_COLORS } from '@nuclia/sistema';

export const LABEL_MAIN_COLORS = LABEL_COLORS.map((color) => color.mainColor);

export function isLabelMainColor(color: string): boolean {
  return isColorInList(color, LABEL_MAIN_COLORS);
}

export function isColorInList(color: string, colorList: string[]) {
  return colorList.some((colorItem) => isSameHexColor(colorItem, color));
}
