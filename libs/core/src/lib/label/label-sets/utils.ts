import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isSameHexColor, LABEL_COLORS } from '@nuclia/sistema';

export const LABEL_MAIN_COLORS = LABEL_COLORS.map((color) => color.mainColor);

export function isLabelMainColor(color: string): boolean {
  return isColorInList(color, LABEL_MAIN_COLORS);
}

export function isColorInList(color: string, colorList: string[]) {
  return colorList.some((colorItem) => isSameHexColor(colorItem, color));
}

export function noDuplicateListItemsValidator(separator: string, error: string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const list = control.value
      .split(separator)
      .map((item) => item.trim())
      .filter((item) => !!item);
    return list.some((item, index) => list.lastIndexOf(item) !== index) ? { duplicate: error } : null;
  };
}
