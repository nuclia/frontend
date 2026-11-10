import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Content for a `hlm-step` that will be rendered lazily.
 */
@Directive({
  selector: 'ng-template[uiStepContent]',
})
export class UiStepContent<C> {
  public readonly template = inject<TemplateRef<C>>(TemplateRef);
}
