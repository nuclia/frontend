import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CypherDriver } from '@nuclia/core';
import { Observable, switchMap, take } from 'rxjs';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { CypherAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-cypher-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './cypher-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CypherNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private cypherDrivers = signal<CypherDriver[]>([]);

  cypherConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as CypherAgentUI;
      const source = this.cypherDrivers().find((driver) => driver.identifier === config.source);
      return [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.cypher.form.source'),
          content: source?.name || config.source,
        },
      ];
    }
    return [];
  });

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers('cypher') as Observable<CypherDriver[]>),
      )
      .subscribe((cypherDrivers) => this.cypherDrivers.set(cypherDrivers));
  }
}
