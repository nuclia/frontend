import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  inject,
  Input,
  numberAttribute,
  ViewChild,
} from '@angular/core';

import { PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-badge',
  imports: [PaTooltipModule, PaIconModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() icon?: string;
  @Input({ transform: numberAttribute }) count?: number;
  @Input() countLabel?: string;
  @Input({ transform: booleanAttribute }) clickable = false;
  @Input() kind: 'tertiary' | 'neutral' | 'success' = 'neutral';

  @ViewChild('content', { read: ElementRef }) content?: ElementRef;

  @HostBinding('class.overline') get overline() {
    return true;
  }
  @HostBinding('class.with-count') get hasCount() {
    return !!this.countLabel || typeof this.count === 'number';
  }
  @HostBinding('class.with-icon') get hasIcon() {
    return !!this.icon;
  }
  @HostBinding('class.tertiary') get tertiary() {
    return this.kind === 'tertiary';
  }
  @HostBinding('class.success') get success() {
    return this.kind === 'success';
  }
  @HostBinding('class.clickable') get isClickable() {
    return this.clickable;
  }

  hasContent = false;

  get countText(): string {
    if (this.countLabel) {
      return this.countLabel;
    }
    if (typeof this.count !== 'number') {
      return '';
    }
    return this.count > 999 ? '999+' : `${this.count}`;
  }

  ngAfterViewInit() {
    this.hasContent = !!this.content && this.content.nativeElement.textContent.trim().length > 0;
    this.cdr.detectChanges();
  }
}
