import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs';
import { ZoneService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { NuaGuardService } from './nua-guard.service';
import { NuaGuardPolicy } from './nua-guard.models';
import { PolicyDialogComponent, PolicyDialogData } from './policy-dialog/policy-dialog.component';

@Component({
  selector: 'app-account-nua-guard',
  templateUrl: './account-nua-guard.component.html',
  styleUrl: './account-nua-guard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountNuaGuardComponent {
  private nuaGuard = inject(NuaGuardService);
  private zoneService = inject(ZoneService);
  private modalService = inject(SisModalService);
  private destroyRef = inject(DestroyRef);

  policies$ = this.nuaGuard.policies$;
  enabledCount$ = this.nuaGuard.enabledCount$;
  maxEnabledPolicies = NuaGuardService.MAX_ENABLED_POLICIES;

  // Region column is only meaningful once the account spans more than one zone, per the issue.
  // Prototype stands in all platform zones — no account-scoped zone lookup exists in this app yet.

  constructor() {
    this.nuaGuard.updatePolicies();
  }

  createPolicy() {
    this.modalService
      .openModal(PolicyDialogComponent)
      .onClose.pipe(
        filter((created) => !!created),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.nuaGuard.updatePolicies());
  }

  editPolicy(policy: NuaGuardPolicy) {
    const data: PolicyDialogData = { policy };
    this.modalService
      .openModal(PolicyDialogComponent, { dismissable: true, data })
      .onClose.pipe(
        filter((updated) => !!updated),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.nuaGuard.updatePolicies());
  }

  deletePolicy(policy: NuaGuardPolicy) {
    this.modalService
      .openConfirm({
        title: 'account.nua-guard.delete-policy',
        description: 'account.nua-guard.delete-policy-warning',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.nuaGuard.deletePolicy(policy.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  toggleEnabled(policy: NuaGuardPolicy, enabled: boolean) {
    this.nuaGuard
      .editPolicy(policy.id, { ...policy, enabled })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
