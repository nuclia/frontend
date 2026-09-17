import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { PaButtonModule, PaTableModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NuaGuardPolicy } from '@nuclia/core';
import { NuaGuardService } from './nua-guard.service';

@Component({
  selector: 'app-account-nua-guard',
  imports: [PaButtonModule, TranslateModule, PaTableModule, PaTogglesModule],
  templateUrl: './account-nua-guard.component.html',
  styleUrl: './account-nua-guard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountNuaGuardComponent implements OnInit {
  private service = inject(NuaGuardService);

  policies = this.service.policies;
  limitReached = this.service.limitReached;

  ngOnInit(): void {
    this.service.loadPolicies();
  }

  createPolicy() {
    //TODO
  }
  editPolicy(policy: NuaGuardPolicy) {
    // TODO
  }
  deletePolicy(policy: NuaGuardPolicy) {
    // TODO
  }
  toggleEnabled(policy: NuaGuardPolicy, enabled: boolean) {
    // TODO
  }
}
