import { ElementRef, HostBinding, Input, AfterContentInit, SimpleChanges, ViewChild, Directive } from '@angular/core';

const COLORS = ['primary', 'secondary', 'destructive', 'gray', 'white', 'legacy'];
const SIZES = ['small', 'medium'];
const WEIGHTS = ['regular', 'semibold', 'bold'];
const PADDINGS = ['', 'pd-l', 'pd-xl'];

@Directive()
export class ButtonBase implements AfterContentInit {
  @Input() color: 'primary' | 'secondary' | 'destructive' | 'gray' | 'white' | 'legacy' = 'primary';
  @Input() size: 'small' | 'medium' = 'medium';
  @Input() weight: 'regular' | 'semibold' | 'bold' = 'semibold';
  @Input() padding: 'pd-l' | 'pd-xl' | '' = '';
  @Input() disabled = false;
  @Input() icon = '';
  @Input() type = '';
  @Input() ariaLabel = '';
  @Input() ariaControls = '';
  @Input() ariaExpanded = false;
  @Input() iconOnly = false;

  @ViewChild('text', { static: false }) textElement?: ElementRef;

  buttonStyle: { [id: string]: boolean } = {
    'stf-button': true,
    'stf-button-primary': true,
    'stf-button-medium': true,
    'stf-button-semibold': true,
  };
  isDisabled = false;
  buttonLabel = '';

  colorClass: string | undefined;
  sizeClass: string | undefined;
  weightClass: string | undefined;

  ngAfterContentInit() {
    setTimeout(() => {
      if (!!this.textElement) {
        this.buttonLabel = this.textElement.nativeElement.textContent.trim();
        if (!this.ariaLabel) {
          this.ariaLabel = this.buttonLabel;
        }
      }
    }, 0);
  }

  onChanges(changes: SimpleChanges) {
    if (changes.color && changes.color.currentValue) {
      COLORS.forEach((color) => {
        const colorClass = this.getClassFromInput('color', color, COLORS);
        this.buttonStyle[colorClass] = color === changes.color.currentValue;
      });
    }

    if (changes.size && changes.size.currentValue) {
      SIZES.forEach((size) => {
        const sizeClass = this.getClassFromInput('size', size, SIZES);
        this.buttonStyle[sizeClass] = size === changes.size.currentValue;
      });
    }

    if (changes.weight && changes.weight.currentValue) {
      WEIGHTS.forEach((weight) => {
        const weightClass = this.getClassFromInput('weight', weight, WEIGHTS);
        this.buttonStyle[weightClass] = weight === changes.weight.currentValue;
      });
    }

    if (changes.padding && changes.padding.currentValue) {
      PADDINGS.forEach((padding) => {
        const paddingClass = this.getClassFromInput('padding', padding, PADDINGS);
        this.buttonStyle[paddingClass] = padding === changes.padding.currentValue;
      });
    }

    if (changes.disabled) {
      this.isDisabled = this.isPropertyLikeTrue('disabled');
    }
  }

  getClassFromInput(property: string, value: string, possibleValues: string[]): string {
    if (possibleValues.indexOf(value) === -1) {
      console.error(`Invalid ${property}: ${value}. Possible values: ${possibleValues.join(', ')}.`);
      return '';
    }

    return this.getButtonClass(value);
  }

  getButtonClass(value: string) {
    return `stf-button-${value}`;
  }

  isPropertyLikeTrue(property: string) {
    // @ts-ignore
    return typeof this[property] !== 'undefined' && this[property] !== null && this[property] !== false;
  }

  @HostBinding('style.pointer-events')
  public get disablePointerEvent(): String {
    return this.isDisabled ? 'none' : '';
  }
}
