import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SDKService } from '@flaps/core';
import { delay, map, take } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'ncom-hint',
  templateUrl: 'hint.component.html',
  styleUrls: ['hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class HintComponent implements AfterContentInit, AfterViewInit, OnChanges {
  @Input() label?: string;
  @Input() values?: { [key: string]: string } | null;

  @Input()
  set inverted(value: any) {
    this._inverted = coerceBooleanProperty(value);
  }
  get inverted() {
    return this._inverted;
  }
  private _inverted = false;

  isExpanded = false;

  @ViewChild('content') content?: ElementRef;
  @ViewChild('container') container?: ElementRef;

  containerWidth = '100%';

  constructor(private sdk: SDKService) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.containerWidth = `${this.container?.nativeElement.getBoundingClientRect().width}px`;
    }, 0);
  }

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
