// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { CdkStepLabel } from '@angular/cdk/stepper';
import { Directive } from '@angular/core';

@Directive({
  selector: '[uiStepLabel]',
})
export class UiStepLabel extends CdkStepLabel {}
