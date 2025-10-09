import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { UserService } from '../user.service';
import { UserType } from '@nuclia/core';

@Component({
  templateUrl: 'add-user.component.html',
  standalone: true,
  imports: [PaButtonModule, PaTextFieldModule, ReactiveFormsModule],
})
export class AddUserComponent {
  isSaving = false;
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<UserType>('USER', { nonNullable: true, validators: [Validators.required] }),
  });
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private toaster = inject(SisToastService);

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
