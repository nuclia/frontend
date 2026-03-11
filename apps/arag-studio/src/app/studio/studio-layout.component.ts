import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { SDKService } from '@flaps/core';
import { StudioNavComponent } from './studio-nav/studio-nav.component';
import { StudioTopbarComponent } from './studio-topbar/studio-topbar.component';
import { WorkflowCanvasDirective } from './workflow-canvas.directive';

@Component({
  selector: 'app-studio-layout',
  imports: [CommonModule, RouterOutlet, TranslateModule, StudioNavComponent, StudioTopbarComponent, WorkflowCanvasDirective],
  templateUrl: './studio-layout.component.html',
  styleUrl: './studio-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioLayoutComponent implements OnInit, OnDestroy {
  private sdk = inject(SDKService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private unsubscribeAll = new Subject<void>();

  agentTitle = '';
  agentSlug = '';
  accountSlug = '';
  zone = '';
  agentState = '';

  ngOnInit(): void {
    this.sdk.currentArag.pipe(takeUntil(this.unsubscribeAll)).subscribe((agent) => {
      if (agent) {
        this.agentTitle = agent.title || agent.slug;
        this.agentSlug = agent.slug;
        this.agentState = agent.state || '';
        this.cdr.markForCheck();
      }
    });

    this.sdk.currentAccount.pipe(takeUntil(this.unsubscribeAll)).subscribe((account) => {
      this.accountSlug = account?.slug || '';
      this.cdr.markForCheck();
    });

    this.route.paramMap.pipe(takeUntil(this.unsubscribeAll)).subscribe((params) => {
      this.zone = params.get('zone') || '';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  get homeUrl(): string[] {
    return ['/at', this.accountSlug, 'home'];
  }
}
