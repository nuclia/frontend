const LABEL_COLORS = [
  { mainColor: '#E6E6F9', textColor: '#454ADE' },
  { mainColor: '#DAF3E6', textColor: '#0CAD55' },
  { mainColor: '#FFE8D9', textColor: '#EF670A' },
  { mainColor: '#CCCED6', textColor: '#1E264F' },
];

export const LABEL_MAIN_COLORS = LABEL_COLORS.map((color) => color.mainColor);

export function getLabelColors(mainColor: string) {
  return LABEL_COLORS.find((color) => isSameHexColor(color.mainColor, mainColor));
}

export function isLabelMainColor(color: string): boolean {
  return isColorInList(color, LABEL_MAIN_COLORS);
}

export function isColorInList(color: string, colorList: string[]) {
  return colorList.some((colorItem) => isSameHexColor(colorItem, color));
}

export function isHexColor(color: string): boolean {
  const regex = /^#([\da-f]{3}){1,2}$/i;
  return regex.test(color);
}

export function isSameHexColor(color1: string, color2: string): boolean {
  if (isHexColor(color1) && isHexColor(color2)) {
    const rgb1 = hexToRGB(color1)!;
    const rgb2 = hexToRGB(color2)!;
    return rgb1[0] === rgb2[0] && rgb1[1] === rgb2[1] && rgb1[2] === rgb2[2];
  }
  return false;
}

function hexToRGB(hex: string): [number, number, number] | null {
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

// es-linter-disable-next-line
export const cloneDeep = (entity: any, cache = new WeakMap()): any => {
  const referenceTypes = ['Array', 'Object', 'Map', 'Set', 'Date'];
  const entityType = Object.prototype.toString.call(entity);
  if (!new RegExp(referenceTypes.join('|')).test(entityType) || entity instanceof WeakMap || entity instanceof WeakSet)
    return entity;
  if (cache.has(entity)) {
    return cache.get(entity);
  }
  const c = new entity.constructor();

  if (entity instanceof Map) {
    entity.forEach((value, key) => c.set(cloneDeep(key), cloneDeep(value)));
  }
  if (entity instanceof Set) {
    entity.forEach((value) => c.add(cloneDeep(value)));
  }
  if (entity instanceof Date) {
    return new Date(entity);
  }
  cache.set(entity, c);
  return Object.assign(c, ...Object.keys(entity).map((prop) => ({ [prop]: cloneDeep(entity[prop], cache) })));
};
