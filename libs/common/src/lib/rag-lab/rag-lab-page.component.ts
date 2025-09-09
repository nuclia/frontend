import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { PromptLabComponent } from './prompt-lab';
import { RagLabComponent } from './rag-lab.component';
import { RagLabService } from './rag-lab.service';

@Component({
  imports: [TranslateModule, PaTabsModule, PromptLabComponent, RagLabComponent],
  templateUrl: './rag-lab-page.component.html',
  styleUrl: './rag-lab-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagLabPageComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private ragLabService = inject(RagLabService);

  selectedTab: 'prompt' | 'rag' = 'prompt';

  ngOnInit() {
    this.ragLabService.loadKbConfigAndModels().subscribe(() => this.cdr.markForCheck());
  }
}
