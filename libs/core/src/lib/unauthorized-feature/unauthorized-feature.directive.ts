import {
  booleanAttribute,
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  HostBinding,
  HostListener,
  inject,
  Input,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { BadgeComponent, SisModalService } from '@nuclia/sistema';
import { UnauthorizedFeatureModalComponent } from './unauthorized-feature-modal.component';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';

@Directive({
  selector: '[stfUnauthorizedFeature]',
  standalone: true,
})
export class UnauthorizedFeatureDirective {
  private modalService = inject(SisModalService);
  private viewContainerRef = inject(ViewContainerRef);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);

  @Input({ transform: booleanAttribute }) set stfUnauthorizedFeature(value: boolean) {
    this._unauthorized = value;
    if (value) {
      this.addBadge();
    }
  }
  get unauthorized() {
    return this._unauthorized;
  }
  @Input({ transform: booleanAttribute }) fullProBadge = false;
  @Input() featureName?: string;

  private _unauthorized = false;
  private _badge?: ComponentRef<BadgeComponent>;

  @HostBinding('class.unauthorized') get disableParent() {
    return this.unauthorized;
  }

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    if (this.unauthorized) {
      event.preventDefault();
      event.stopPropagation();
      this.openFeatureModal();
    }
  }

  private addBadge() {
    this._badge = this.viewContainerRef.createComponent(BadgeComponent);
    this._badge.instance.icon = 'lock-filled';
    this._badge.instance.kind = 'tertiary';
    this._badge.instance.clickable = true;
    if (this.fullProBadge) {
      this._badge.location.nativeElement.appendChild(document.createTextNode('pro'));
    }
    this.renderer.appendChild(this.viewContainerRef.element.nativeElement, this._badge.location.nativeElement);

    this.cdr.markForCheck();
  }

  private openFeatureModal() {
    let feature = this.featureName || '';
    if (!this.featureName) {
      feature = this.viewContainerRef.element.nativeElement.textContent.trim() || '';
      if (this.fullProBadge && feature.endsWith('pro')) {
        feature = feature.substring(0, feature.lastIndexOf('pro')).trim();
      }
    }

    this.modalService.openModal(UnauthorizedFeatureModalComponent, new ModalConfig({ data: { feature } }));
  }
}
