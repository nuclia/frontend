import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { SDKService } from '@flaps/auth';
import { delay, map, take } from 'rxjs';

@Component({
  selector: 'ncom-hint',
  templateUrl: 'hint.component.html',
  styleUrls: ['hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintComponent implements AfterContentInit, OnChanges {
  @Input() label?: string;
  @Input() values?: { [key: string]: string };
  isExpanded = false;
  @ViewChild('content') content?: ElementRef;

  constructor(private sdk: SDKService) {}

  ngAfterContentInit() {
    this.replacePlaceholders();
  }

  ngOnChanges() {
    this.replacePlaceholders();
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
