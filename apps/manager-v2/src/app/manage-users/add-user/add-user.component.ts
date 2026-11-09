import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserType } from '@nuclia/core';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { UserService } from '../user.service';
import { USER_TYPES } from '../user.utils';

@Component({
  templateUrl: 'add-user.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [HlmButtonImports, HlmFieldImports, HlmInputImports, HlmSelectImports, ReactiveFormsModule],
})
export class AddUserComponent {
  readonly userTypes = USER_TYPES;
  isSaving = false;
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<UserType>('USER', { nonNullable: true, validators: [Validators.required] }),
  });
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private toaster = inject(UiToastService);

  save() {
    this.isSaving = true;
    this.cdr.detectChanges();
    this.userService.createUser(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.router.navigate([`/users/${user.id}`]);
      },
      error: (error) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.toaster.error(JSON.stringify(error));
      },
    });
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
