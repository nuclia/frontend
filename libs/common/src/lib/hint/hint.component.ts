import {
  AfterContentInit,
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SDKService } from '@flaps/core';
import { delay, map, take } from 'rxjs';

@Component({
  selector: 'ncom-hint',
  templateUrl: 'hint.component.html',
  styleUrls: ['hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class HintComponent implements AfterContentInit, AfterViewInit, OnChanges {
  @Input() learnMore?: string;
  @Input() label?: string;
  @Input() values?: { [key: string]: string } | null;
  @Input({ transform: booleanAttribute }) noMaxWidth = false;

  @ViewChild('content') content?: ElementRef;
  @ViewChild('container') container?: ElementRef;

  clipboardSupported = !!(navigator.clipboard && navigator.clipboard.writeText);
  hasCodeExample = false;

  containerWidth = '100%';
  copyIcon: 'copy' | 'check' = 'copy';

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit() {
    if (!this.noMaxWidth) {
      setTimeout(() => {
        this.containerWidth = `${this.container?.nativeElement.getBoundingClientRect().width}px`;
      }, 0);
    }
    this.hasCodeExample = !!this.content?.nativeElement.querySelector('pre>code');
  }

  ngAfterContentInit() {
    this.replacePlaceholders();
  }

  ngOnChanges() {
    this.replacePlaceholders();
  }

  copyCode() {
    const code = this.content?.nativeElement.querySelector('pre>code')?.textContent;
    if (code) {
      navigator.clipboard.writeText(code);
      this.copyIcon = 'check';
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copyIcon = 'copy';
        this.cdr.markForCheck();
      }, 2000);
    }
  }

  private replacePlaceholders() {
    this.sdk.currentKb
      .pipe(
        take(1),
        map((kb) => kb.fullpath),
        delay(200),
      )
      .subscribe((path) => {
        if (this.content) {
          let html = this.content.nativeElement.innerHTML
            .replaceAll('$$KB_URL$$', path)
            .replaceAll('$$AUTH_TOKEN$$', this.sdk.nuclia.auth.getToken());
          Object.entries(this.values || {}).forEach(([key, value]) => {
            html = html.replaceAll(`$$${key}$$`, value);
          });
          this.content.nativeElement.innerHTML = html;
        }
      });
  }
}
