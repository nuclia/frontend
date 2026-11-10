import { UiStep } from './step/step.component';
import { UiStepContent } from './directives/step-content.directive';
import { UiStepHeader } from './step-header/step-header.component';
import { UiStepLabel } from './directives/step-label.directive';
import { UiStepper } from './stepper.component';
import { UiStepperNext } from './directives/stepper-button-next.directive';
import { UiStepperPrevious } from './directives/stepper-button-previous.directive';

export * from './step/step.component';
export * from './directives/step-content.directive';
export * from './step-header/step-header.component';
export * from './directives/step-label.directive';
export * from './stepper.component';
export * from './directives/stepper-button-next.directive';
export * from './directives/stepper-button-previous.directive';
export * from './stepper.model';
export * from './stepper.token';

export const UiStepperImports = [
  UiStepper,
  UiStep,
  UiStepHeader,
  UiStepperNext,
  UiStepperPrevious,
  UiStepContent,
  UiStepLabel,
] as const;
