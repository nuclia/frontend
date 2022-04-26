import { Directive, HostBinding, Input } from '@angular/core';

type Color =  'white' | 'gray';
type SelectSize = 'medium' | 'small';

@Directive({
  selector: '[stfFilterInput]'
})
export class FilterInputDirective {

  @HostBinding('class.stf-filter-input') isFilterInput = true;
  @HostBinding('style.height.px') @Input() inputHeight: number = 25;
  @Input() inputColor: Color = 'white';
  @HostBinding('class') get colorClass() { return `stf-filter-input-${this.inputColor}` };

  constructor() { }
}


@Directive({
  selector: '[stfSelect]'
})
export class SelectDirective {

  @HostBinding('class.stf-select') isSelect = true;
  @Input() selectSize: SelectSize = 'medium';
  @Input() selectColor: Color = 'gray';
  @HostBinding('class') get classes() { 
    return `stf-select-size-${this.selectSize} stf-select-color-${this.selectColor}` 
  };
  constructor() { }
}