import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';
import { IRetrievalAgentItem } from '@nuclia/core';
import { BehaviorSubject, combineLatest, map, Subject, switchMap, takeUntil } from 'rxjs';
import { AgentCardComponent } from './agent-card/agent-card.component';
import { SisProgressModule } from '@nuclia/sistema';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agents-home',
  imports: [CommonModule, TranslateModule, PaButtonModule, PaIconModule, PaTextFieldModule, AgentCardComponent, SisProgressModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsHomeComponent implements OnInit, OnDestroy {
  private sdk = inject(SDKService);
  private router = inject(Router);

  private unsubscribeAll = new Subject<void>();
  private searchQuery = new BehaviorSubject<string>('');

  loading = new BehaviorSubject<boolean>(true);
  accountSlug = '';

  private allAgents = new BehaviorSubject<IRetrievalAgentItem[]>([]);

  filteredAgents$ = combineLatest([this.allAgents.asObservable(), this.searchQuery.asObservable()]).pipe(
    map(([agents, query]) => {
      if (!query.trim()) return agents;
      const lower = query.toLowerCase();
      return agents.filter(
        (a) => a.title.toLowerCase().includes(lower) || a.slug.toLowerCase().includes(lower) || (a.zone || '').toLowerCase().includes(lower),
      );
    }),
  );

  ngOnInit(): void {
    this.sdk.currentAccount
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((account) => {
          this.accountSlug = account.slug;
          return this.sdk.nuclia.db.getRetrievalAgents(account.slug, account.id);
        }),
      )
      .subscribe({
        next: (agents) => {
          this.allAgents.next(agents);
          this.loading.next(false);
        },
        error: () => {
          this.loading.next(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onSearchChange(value: string): void {
    this.searchQuery.next(value);
  }
}
