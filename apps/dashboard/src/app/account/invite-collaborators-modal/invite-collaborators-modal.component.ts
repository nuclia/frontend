import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { Router, RouterLink } from '@angular/router';
import { LowerCaseInputDirective, NavigationService, SDKService, UserService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SisToastService } from '@nuclia/sistema';
import { forkJoin, map, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invite-collaborators-modal',
  imports: [
    CommonModule,
    PaModalModule,
    PaTextFieldModule,
    PaButtonModule,
    RouterLink,
    PaTogglesModule,
    TranslateModule,
    ReactiveFormsModule,
    LowerCaseInputDirective,
  ],
  templateUrl: './invite-collaborators-modal.component.html',
  styleUrl: './invite-collaborators-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteCollaboratorsModalComponent {
  selectedRadio: 'kb' | 'sso' | 'invite' = 'kb';
  accountSettingsUrl = '';

  toBeInvited: string[] = [];
  email = new FormControl<string>('', { nonNullable: true, validators: [Validators.email] });
  accountSlug = '';

  constructor(
    public modal: ModalRef<{ accountSlug: string }>,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private toast: SisToastService,
    private sdk: SDKService,
    private translate: TranslateService,
    private router: Router,
    private userService: UserService,
  ) {
    if (this.modal?.config?.data?.accountSlug) {
      this.accountSlug = this.modal.config.data.accountSlug;
      this.accountSettingsUrl = `${this.navigation.getAccountManageUrl(this.accountSlug)}/settings`;
    }
  }

  accountEmail = this.userService.userInfo.pipe(map((info) => info?.preferences.email));

  addUser() {
    this.toBeInvited = this.toBeInvited.concat([this.email.getRawValue()]);
    this.email.patchValue('');
    this.cdr.markForCheck();
  }

  removeUser(email: string) {
    this.toBeInvited = [...this.toBeInvited.filter((user) => user !== email)];
  }

  onDone() {
    if (this.selectedRadio === 'kb') {
      this.sdk.kbList.pipe(take(1)).subscribe((kbs) => {
        this.router.navigateByUrl(this.navigation.getKbUrl(this.accountSlug, kbs[0]?.slug || ''));
        this.modal.close();
      });
    } else if (this.selectedRadio === 'sso') {
      this.modal.close();
    } else {
      forkJoin(
        this.toBeInvited.map((email) =>
          this.sdk.nuclia.db.inviteToAccount(this.accountSlug, { email, role: 'AOWNER' }).pipe(
            map(() => ({ email, success: true })),
            catchError(() => {
              return of({ email, success: false });
            }),
          ),
        ),
      ).subscribe({
        next: (results) => {
          const { errors, successes } = results.reduce(
            (sortedResults, result) => {
              if (result.success) {
                sortedResults.successes.push(result.email);
              } else {
                sortedResults.errors.push(result.email);
              }
              return sortedResults;
            },
            { errors: [], successes: [] } as { errors: string[]; successes: string[] },
          );
          if (successes.length > 0) {
            this.toast.success(
              this.translate.instant('account.invite-collaborators.add-users.toast.success', {
                count: successes.length,
              }),
            );
          }
          if (errors.length > 0) {
            this.toast.error(
              this.translate.instant('account.invite-collaborators.add-users.toast.error', {
                emails: errors.join(', '),
              }),
            );
          }
          this.router.navigateByUrl(`${this.navigation.getAccountManageUrl(this.accountSlug)}/users`);
          this.modal.close();
        },
      });
    }
  }
}
