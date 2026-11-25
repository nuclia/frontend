// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

export type UiStepperIndicatorMode = 'number' | 'state' | 'completion' | 'icon';
export type UiStepperLabelPosition = 'end' | 'bottom';
export type UiStepperHeaderPosition = 'top' | 'bottom';

export interface UiStepperConfig {
  animationEnabled: boolean;
  animationDuration: number;
  defaultIndicatorMode: UiStepperIndicatorMode;
}
