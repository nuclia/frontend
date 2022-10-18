export interface LabelColor {
  mainColor: string;
  textColor: string;
}

export const LABEL_COLORS: LabelColor[] = [
  { mainColor: '#E6E6F9', textColor: '#454ADE' },
  { mainColor: '#DAF3E6', textColor: '#0CAD55' },
  { mainColor: '#FFE8D9', textColor: '#EF670A' },
  { mainColor: '#CCCED6', textColor: '#1E264F' },
];

export function getLabelColor(mainColor: string): LabelColor | undefined {
  return LABEL_COLORS.find((color) => isSameHexColor(color.mainColor, mainColor));
}

export function isSameHexColor(color1: string, color2: string): boolean {
  if (isHexColor(color1) && isHexColor(color2)) {
    const rgb1 = hexToRGB(color1) as RGB;
    const rgb2 = hexToRGB(color2) as RGB;
    return rgb1[0] === rgb2[0] && rgb1[1] === rgb2[1] && rgb1[2] === rgb2[2];
  }
  return false;
}

export function isHexColor(color: string): boolean {
  const regex = /^#([\da-f]{3}){1,2}$/i;
  return regex.test(color);
}

type RGB = [number, number, number];

function hexToRGB(hex: string): RGB | null {
  let r, g, b;

  // 3 digits
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
    return [r, g, b];

    // 6 digits
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
    return [r, g, b];
  } else {
    return null;
  }
}
