import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { PasswordInputComponent } from '../../../../../../libs/sistema/src/lib/password-input/password-input.component';
import { PaTogglesModule } from '../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/controls/toggles/toggles.module';

@Component({
    selector: 'nsd-sistema-password-input',
    templateUrl: './sistema-password-input.component.html',
    styleUrls: ['./sistema-password-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PaDemoModule,
        PasswordInputComponent,
        PaTogglesModule,
    ],
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
