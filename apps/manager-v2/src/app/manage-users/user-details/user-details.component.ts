import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matArrowBackRound, matCheckRound, matContentCopyRound } from '@ng-icons/material-icons/round';
import { UserType } from '@nuclia/core';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAccordionImports } from '@nuclia/ui-spartan/accordion';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmInputGroupImports } from '@nuclia/ui-spartan/input-group';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { filter, map, switchMap } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { User } from '../user.models';
import { UserService } from '../user.service';
import { USER_TYPES } from '../user.utils';
import { SDKService } from '@flaps/core';

@Component({
  templateUrl: './user-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    HlmAccordionImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputGroupImports,
    HlmInputImports,
    HlmSelectImports,
    NgIcon,
    ReactiveFormsModule,
  ],
  providers: [provideIcons({ matArrowBackRound, matCheckRound, matContentCopyRound })],
})
export class UserDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private store = inject(ManagerStore);
  private sdk = inject(SDKService);
  canEdit = this.store.canEdit;
  readonly userTypes = USER_TYPES;
  userEmail = signal('');
  userId = '';
  userForm = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    id: new FormControl('', { nonNullable: true }),
    language: new FormControl('', { nonNullable: true }),
    last_login: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
    providers: new FormControl('', { nonNullable: true }),
    type: new FormControl<UserType>('USER', { nonNullable: true }),
  });
  isEdit = this.router.url.endsWith('edit');
  isSaving = signal(false);

  app = signal<'platform' | 'rag'>('platform');
  passwordPage = computed(() => this.sdk.getOriginForApp('auth') + '/setup/user?app=' + this.app());
  copied = signal(false);

  constructor() {
    if (!this.isEdit) {
      this.userForm.disable();
    }
    this.route.params
      .pipe(
        filter((params) => !!params['userId']),
        map((params) => params['userId'] as string),
        switchMap((userId) => this.userService.getUser(userId)),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (user) => {
          this.userEmail.set(user.email);
          this.userId = user.id;
          this.userForm.patchValue({
            ...user,
            providers: user.providers.join(', '),
            last_login: user.last_login || '',
          });
        },
        error: (error) => {
          const message =
            error.status === 404 ? `This user doesn't exist anymore` : 'An error occurred while loading the user';
          toast.error(message);
        },
      });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  edit() {
    this.router.navigate(['./edit'], { relativeTo: this.route });
  }

  cancel() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  save() {
    this.isSaving.set(true);
    const data = this.userForm.getRawValue();
    const payload: Partial<User> = {
      email: data.email,
      name: data.name,
    };
    if (data.type) {
      payload.type = data.type;
    }
    this.userService.modifyUser(this.userId, payload).subscribe({
      next: (user) => {
        this.isSaving.set(false);
        this.router.navigate([`/users/${user.id}`]);
      },
      error: (error) => {
        this.isSaving.set(false);
        toast.error(JSON.stringify(error));
      },
    });
  }

  onAppChange(value: 'platform' | 'rag' | null | undefined) {
    this.app.set(value ?? 'platform');
  }

  copy() {
    this.copied.set(true);
    navigator.clipboard.writeText(this.passwordPage());
    setTimeout(() => this.copied.set(false), 2000);
  }
}
