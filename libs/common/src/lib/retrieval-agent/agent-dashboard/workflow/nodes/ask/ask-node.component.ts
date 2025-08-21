
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { switchMap, take } from 'rxjs';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../../basic-elements';
import { AskAgentUI, BasicAskAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-ask-node',
  imports: [ConfigBlockComponent, NodeBoxComponent, TranslateModule, ConnectableEntryComponent],
  templateUrl: './ask-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private driverList = signal<NucliaDBDriver[]>([]);

  askConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as AskAgentUI | BasicAskAgentUI;
      const items: ConfigBlockItem[] = [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.ask.form.sources'),
          content: config.sources
            .split(',')
            .map((source) => {
              const driver = this.driverList().find((driver) => driver.identifier === source);
              return driver?.name || source;
            })
            .join(', '),
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
