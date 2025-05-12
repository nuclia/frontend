import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { McpSseDriver, McpStdioDriver } from '@nuclia/core';
import { switchMap, take } from 'rxjs';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { McpAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-mcp-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './mcp-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private mcpList = signal<(McpSseDriver | McpStdioDriver)[]>([]);

  mcpConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as McpAgentUI;
      const items: ConfigBlockItem[] = [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.mcp.form.source'),
          content: [config.source]
            .map((source) => {
              const mcp = this.mcpList().find((mcp) => mcp.id === source);
              return mcp?.name || source;
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
        switchMap((arag) => arag.getDrivers()),
      )
      .subscribe((drivers) =>
        this.mcpList.set(drivers.filter((driver) => driver.provider === 'mcpsse' || driver.provider === 'mcpstdio')),
      );
  }
}
