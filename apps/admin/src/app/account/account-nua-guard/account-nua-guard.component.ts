import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalConfig, PaButtonModule, PaTableModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NuaGuardPolicy } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { filter } from 'rxjs';
import { NuaGuardService } from './nua-guard.service';
import { PolicyDialogComponent } from './policy-dialog/policy-dialog.component';

@Component({
  selector: 'app-account-nua-guard',
  imports: [PaButtonModule, TranslateModule, PaTableModule, PaTogglesModule],
  templateUrl: './account-nua-guard.component.html',
  styleUrl: './account-nua-guard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountNuaGuardComponent implements OnInit {
  private service = inject(NuaGuardService);
  private modalService = inject(SisModalService);
  private destroyRef = inject(DestroyRef);

  policies = this.service.policies;
  limitReached = this.service.limitReached;
  isSaving = signal<{ [id: string]: boolean }>({});

  ngOnInit(): void {
    this.service.loadPolicies();
  }

  createPolicy() {
    this.modalService
      .openModal(PolicyDialogComponent)
      .onClose.pipe(
        filter((created) => !!created),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  editPolicy(policy: NuaGuardPolicy) {
    this.modalService
      .openModal(PolicyDialogComponent, new ModalConfig({ data: policy }))
      .onClose.pipe(
        filter((updated) => !!updated),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  toggleEnabled(policy: NuaGuardPolicy, enabled: boolean) {
    if (enabled && this.service.limitReached()) {
      // Prevent enabling a policy when the limit is reached already
      return;
    }

    if (!this.isSaving()[policy.id]) {
      this.isSaving.set({ [policy.id]: true });
      this.service.editPolicy(policy.id, policy.zone, { enabled }).subscribe({
        next: () => this.isSaving.set({ [policy.id]: false }),
        error: () => this.isSaving.set({ [policy.id]: false }),
      });
    }
  }
  deletePolicy(policy: NuaGuardPolicy) {
    // TODO
  }
}
