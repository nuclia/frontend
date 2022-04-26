import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  AfterViewInit,
  ContentChild,
  Input,
  ChangeDetectorRef,
  Directive,
} from '@angular/core';

export const transitionDuration = 160;


@Directive({
    selector: 'stf-expander-content',
})
export class ExpanderContentDirective {}

@Component({
  selector: 'stf-expander',
  templateUrl: './expander.component.html',
  styleUrls: ['./expander.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpanderComponent implements AfterViewInit {
  @Input() set contentLoaded(value: any) {
    this.updateContentHeight();
  }
  @Input() set expanded(value: boolean) {
    if (this._expanded && !value) {
      this.collapse();
    }
    if (!this._expanded && value) {
      this.expand();
    }
  }

  initialized: boolean = false;
  @ContentChild(ExpanderContentDirective, { read: ElementRef }) expanderContent?: ElementRef;

  _expanded = true;
  contentHidden = false;

  constructor(private elementRef: ElementRef, private cd: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.updateContentHeight();
    setTimeout(() => {
      this.initialized = true;
    }, 0) 
  }

  expand() {
    // We remove "display: none" before expanding the panel so the animation is visible
    this.contentHidden = false;
    this.updateContentHeight();
    setTimeout(() => {
      this._expanded = true;
      this.cd.markForCheck();
    }, 0);
  }

  collapse() {
    // We collapse directly and hide content after the transition delay
    this._expanded = false;
    setTimeout(() => {
      this.contentHidden = true;
      this.cd.markForCheck();
    }, transitionDuration);
  }

  private updateContentHeight() {
    setTimeout(() => {
      this.elementRef.nativeElement.style.setProperty(
        '--expanderContentHeight',
        `${this.expanderContent?.nativeElement.getBoundingClientRect().height}px`,
      );
    });
  }
}
