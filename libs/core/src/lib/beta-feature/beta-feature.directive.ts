import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  HostBinding,
  inject,
  Input,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { BadgeComponent } from '@nuclia/sistema';

@Directive({
  selector: '[stfBetaFeature]',
  standalone: true,
})
export class BetaFeatureDirective implements AfterViewInit {
  private viewContainerRef = inject(ViewContainerRef);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);

  @Input({ transform: booleanAttribute }) set stfBetaFeature(value: boolean) {
    this._beta = value;
  }
  get beta() {
    return this._beta;
  }

  private _beta = false;
  private _badge?: ComponentRef<BadgeComponent>;

  @HostBinding('class.beta') get disableParent() {
    return this.beta;
  }

  ngAfterViewInit() {
    if (this.beta) {
      this.addBadge();
    }
  }

  private addBadge() {
    this._badge = this.viewContainerRef.createComponent(BadgeComponent);
    this._badge.instance.kind = 'tertiary';
    this._badge.location.nativeElement.appendChild(document.createTextNode('BETA'));
    this.renderer.appendChild(this.viewContainerRef.element.nativeElement, this._badge.location.nativeElement);

    this.cdr.markForCheck();
  }
}
