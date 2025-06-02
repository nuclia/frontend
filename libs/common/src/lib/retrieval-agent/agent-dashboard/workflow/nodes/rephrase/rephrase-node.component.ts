import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { switchMap, take } from 'rxjs';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { RephraseAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-rephrase-node',
  imports: [CommonModule, NodeBoxComponent, TranslateModule, ConfigBlockComponent],
  templateUrl: './rephrase-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseNodeComponent extends NodeDirective implements OnInit {
  private sdk = inject(SDKService);
  private kbList = signal<IKnowledgeBoxItem[]>([]);

  rephraseConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as RephraseAgentUI;
      const items: ConfigBlockItem[] = [];
      if (config.kb) {
        const kb = this.kbList().find((kb) => kb.id === config.kb);
        items.push({ title: 'Knowledge Box', content: kb?.title || config.kb });
      }
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
