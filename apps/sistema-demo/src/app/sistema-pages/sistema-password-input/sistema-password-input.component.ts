import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'nsd-sistema-password-input',
  templateUrl: './sistema-password-input.component.html',
  styleUrls: ['./sistema-password-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaPasswordInputComponent {
  disabled = false;
  readonly = false;
  ngModelCode = `// Typescript
password = '';

// Template:
<nsi-password-input [(ngModel)]="passwordControl"
                    [readonly]="readonly"
                    [disabled]="disabled">Password</nsi-password-input>`;

  formControlCode = `// Typescript
passwordControl = new FormControl('');

// Template:
<form>
  <nsi-password-input [formControl]="passwordControl"
                      [readonly]="readonly"
                      [disabled]="disabled">Password</nsi-password-input>
</form>`;

  formGroupCode = `// Typescript
formGroup = new FormGroup({
  password: new FormControl('')
});

// Template:
<form [formGroup]="formGroup">
  <nsi-password-input formControlName="password"
                      [readonly]="readonly"
                      [disabled]="disabled">Password</nsi-password-input>
</form>
`;
}
