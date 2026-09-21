import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  HostBinding,
  inject,
  input,
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

  icon = input<string>();
  count = input(undefined, { transform: numberAttribute });
  label = input<string>();
  clickable = input(false, { transform: booleanAttribute });
  kind = input<'tertiary' | 'neutral' | 'success'>('neutral');

  @ViewChild('content', { read: ElementRef }) content?: ElementRef;

  displayValue = computed(() => {
    const label = this.label();
    if (label) return label;
    const count = this.count();
    return typeof count === 'number' ? (count > 999 ? '999+' : `${count}`) : '';
  });

  @HostBinding('class.overline') get overline() {
    return true;
  }
  @HostBinding('class.with-count') get hasCount() {
    return !!this.displayValue();
  }
  @HostBinding('class.with-icon') get hasIcon() {
    return !!this.icon();
  }
  @HostBinding('class.tertiary') get tertiary() {
    return this.kind() === 'tertiary';
  }
  @HostBinding('class.success') get success() {
    return this.kind() === 'success';
  }
  @HostBinding('class.clickable') get isClickable() {
    return this.clickable();
  }

  hasContent = false;

  ngAfterViewInit() {
    this.hasContent = !!this.content && this.content.nativeElement.textContent.trim().length > 0;
    this.cdr.detectChanges();
  }
}
