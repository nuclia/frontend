// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

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
