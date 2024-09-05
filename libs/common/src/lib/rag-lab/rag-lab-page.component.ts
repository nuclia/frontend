import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { PromptLabComponent } from './prompt-lab';
import { RagLabComponent } from './rag-lab.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RagLabService } from './rag-lab.service';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, PaTabsModule, PromptLabComponent, RagLabComponent],
  templateUrl: './rag-lab-page.component.html',
  styleUrl: './rag-lab-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagLabPageComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private ragLabService = inject(RagLabService);

  private unsubscribeAll = new Subject<void>();

  selectedTab: 'prompt' | 'rag' = 'prompt';

  ngOnInit() {
    this.ragLabService
      .loadKbConfigAndModels()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
