import { Directive, output } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
   * FormDirective contains 2 abstract FormGroup and an abstract method, as well as two outputs.
   *  - form is the root to be used in ConfigurationFormComponent
   *  - configForm is a getter of the group containing the controls defined for the configuration of each node.
   * 
   * This way, in the template of the components extending this directive, we can have:
<app-configuration-form
  [form]="form"
  (cancel)="cancel.emit()"
  (triggerSubmit)="submit()">
  <ng-container [formGroup]="configForm">
    <!-- Here the different fields can use formControlName attribute -->
  </ng-container>
</app-configuration-form>
   * 
   * <app-configuration-form> is managing the form layout and footer with cancel and submit buttons, 
   * while in <ng-container [formGroup]="configForm"> we have the differents fields controlled directly by the components extending the directive.
   * 
   * This directive also allows us to build and manage the forms directly from the WorkflowService.
   */
@Directive({})
export abstract class FormDirective {
  abstract form: FormGroup;
  abstract configForm: FormGroup;
  abstract submit(): void;

  submitForm = output<unknown>();
  cancel = output<void>();
}
