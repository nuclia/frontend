import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { switchMap, take } from 'rxjs';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../../basic-elements';
import { AskAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-ask-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule, ConnectableEntryComponent],
  templateUrl: './ask-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private kbList = signal<IKnowledgeBoxItem[]>([]);

  askConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as AskAgentUI;
      const items: ConfigBlockItem[] = [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.ask.form.sources'),
          content: config.sources
            .split(',')
            .map((source) => {
              const kb = this.kbList().find((kb) => kb.id === source);
              return kb?.title || source;
            })
            .join(', '),
        },
      ];
      return items;
    }
    return [];
  });

  ngOnInit(): void {
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account.slug, account.id)),
      )
      .subscribe((kbList) => this.kbList.set(kbList));
  }
}
