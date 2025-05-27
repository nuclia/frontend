import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SqlDriver } from '@nuclia/core';
import { Observable, switchMap, take } from 'rxjs';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { SqlAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-sql-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './sql-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private sqlDrivers = signal<SqlDriver[]>([]);

  sqlConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as SqlAgentUI;
      const source = this.sqlDrivers().find((driver) => driver.identifier === config.source);
      const display: ConfigBlockItem[] = [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.sql.form.source'),
          content: source?.name || config.source,
        },
      ];
      if (config.prompt) {
        display.push({ title: 'Prompt', content: config.prompt });
      }
      return display;
    }
    return [];
  });

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers('sql') as Observable<SqlDriver[]>),
      )
      .subscribe((sqlDrivers) => this.sqlDrivers.set(sqlDrivers));
  }
}
