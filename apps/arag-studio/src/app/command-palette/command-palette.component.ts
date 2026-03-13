import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';
import { debounceTime, startWith, takeUntil } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { IRetrievalAgentItem } from '@nuclia/core';

interface PaletteItem {
  label: string;
  icon: string;
  route: string[];
}

const STATIC_NAV_ITEMS: PaletteItem[] = [
  { label: 'Home', icon: '🏠', route: [] },
  { label: 'Pipeline', icon: '⚙️', route: [] },
  { label: 'Sessions', icon: '💬', route: [] },
  { label: 'Drivers', icon: '🔌', route: [] },
  { label: 'Search', icon: '🔍', route: [] },
  { label: 'Activity', icon: '📊', route: [] },
  { label: 'AI Models', icon: '🤖', route: [] },
  { label: 'Settings', icon: '⚙️', route: [] },
];

@Component({
  selector: 'arag-command-palette',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="isOpen" class="cp-backdrop" (click)="onBackdropClick($event)">
      <div class="cp-modal" role="dialog" aria-modal="true" aria-label="Command palette" (click)="$event.stopPropagation()">
        <div class="cp-search-row">
          <span class="cp-search-icon">🔍</span>
          <input
            #searchInput
            class="cp-input"
            type="text"
            placeholder="Search…"
            [formControl]="searchControl"
            (keydown)="onKeydown($event)"
            autocomplete="off"
            aria-label="Search commands"
          />
          <kbd class="cp-esc-hint" (click)="close()">esc</kbd>
        </div>
        <ul class="cp-list" role="listbox" #listEl>
          <li
            *ngFor="let item of filteredItems; let i = index"
            class="cp-item"
            [class.cp-item--active]="i === activeIndex"
            role="option"
            [attr.aria-selected]="i === activeIndex"
            (click)="navigate(item)"
            (mouseenter)="activeIndex = i"
          >
            <span class="cp-item-icon">{{ item.icon }}</span>
            <span class="cp-item-label">{{ item.label }}</span>
          </li>
          <li *ngIf="filteredItems.length === 0" class="cp-empty">No results found</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .cp-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      z-index: 9999;
    }

    .cp-modal {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
      width: 560px;
      max-width: calc(100vw - 32px);
      overflow: hidden;
    }

    .cp-search-row {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      gap: 10px;
    }

    .cp-search-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .cp-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      background: transparent;
      color: #111827;
    }

    .cp-input::placeholder {
      color: #9ca3af;
    }

    .cp-esc-hint {
      font-size: 11px;
      padding: 2px 6px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      color: #6b7280;
      cursor: pointer;
      font-family: inherit;
      user-select: none;
    }

    .cp-list {
      list-style: none;
      margin: 0;
      padding: 6px;
      max-height: 400px;
      overflow-y: auto;
    }

    .cp-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.1s;
    }

    .cp-item:hover,
    .cp-item--active {
      background: #f3f4f6;
    }

    .cp-item-icon {
      font-size: 16px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .cp-item-label {
      font-size: 14px;
      color: #111827;
    }

    .cp-empty {
      padding: 16px 12px;
      color: #9ca3af;
      font-size: 14px;
      text-align: center;
    }
  `],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('listEl') listEl?: ElementRef<HTMLUListElement>;

  isOpen = false;
  searchControl = new FormControl('', { nonNullable: true });
  filteredItems: PaletteItem[] = [];
  activeIndex = 0;

  private allItems: PaletteItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private sdk: SDKService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([this.sdk.currentAccount, this.sdk.aragList])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([account, agents]) => {
        this.allItems = this.buildItems(account?.slug ?? '', agents);
        this.applyFilter(this.searchControl.value);
        this.cdr.markForCheck();
      });

    this.searchControl.valueChanges
      .pipe(debounceTime(50), startWith(''), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.applyFilter(query);
        this.activeIndex = 0;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.filteredItems.length - 1);
        this.scrollActiveIntoView();
        this.cdr.markForCheck();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        this.scrollActiveIntoView();
        this.cdr.markForCheck();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredItems[this.activeIndex]) {
          this.navigate(this.filteredItems[this.activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cp-backdrop')) {
      this.close();
    }
  }

  navigate(item: PaletteItem): void {
    if (item.route.length > 0) {
      this.router.navigate(item.route);
    }
    this.close();
  }

  close(): void {
    this.isOpen = false;
    this.searchControl.setValue('');
    this.activeIndex = 0;
    this.cdr.markForCheck();
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(): void {
    this.isOpen = true;
    this.cdr.markForCheck();
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  private buildItems(accountSlug: string, agents: IRetrievalAgentItem[]): PaletteItem[] {
    const homeBase = accountSlug ? ['/at', accountSlug] : [];
    const staticItems: PaletteItem[] = [
      { label: 'Home', icon: '🏠', route: homeBase.length ? [...homeBase, 'home'] : [] },
      ...agents.map((agent): PaletteItem => ({
        label: agent.title,
        icon: '🤖',
        route: ['/at', accountSlug, agent.zone, 'arag', agent.slug],
      })),
    ];
    return staticItems;
  }

  private applyFilter(query: string): void {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredItems = [...this.allItems];
      return;
    }
    this.filteredItems = this.allItems.filter((item) =>
      item.label.toLowerCase().includes(q),
    );
  }

  private scrollActiveIntoView(): void {
    if (!this.listEl) return;
    const items = this.listEl.nativeElement.querySelectorAll('.cp-item');
    const active = items[this.activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }
}
