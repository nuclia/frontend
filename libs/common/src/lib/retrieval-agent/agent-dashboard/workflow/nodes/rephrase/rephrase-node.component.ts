
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { switchMap, take } from 'rxjs';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { RephraseAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-rephrase-node',
  imports: [NodeBoxComponent, TranslateModule, ConfigBlockComponent],
  templateUrl: './rephrase-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private driverList = signal<NucliaDBDriver[]>([]);

  rephraseConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as RephraseAgentUI;
      const driver = this.driverList().find((driver) => driver.identifier === config.kb);
      const items: ConfigBlockItem[] = [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.rephrase.source'),
          content: driver?.name || config.kb,
        },
      ];
      return items;
    }
    return [];
  });

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers('nucliadb')),
      )
      .subscribe((drivers) => {
        this.driverList.set(drivers as NucliaDBDriver[]);
        this.configUpdated.emit();
      });
  }
}
