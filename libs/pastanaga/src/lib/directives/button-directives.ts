import { Directive, HostBinding } from '@angular/core';


@Directive({
  selector: '[stfButtonSkip]'
})
export class ButtonSkipDirective {

  @HostBinding('class.stf-button-skip') isSelect = true;
  constructor() { }
}