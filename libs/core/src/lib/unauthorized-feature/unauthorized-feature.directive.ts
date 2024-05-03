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

  private _unauthorized = false;
  private _badge?: ComponentRef<BadgeComponent>;

  @HostBinding('class.unauthorized') get disableParent() {
    return this.unauthorized;
  }

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openFeatureModal();
  }

  private addBadge() {
    this._badge = this.viewContainerRef.createComponent(BadgeComponent);
    this._badge.instance.icon = 'lock-filled';
    this._badge.instance.kind = 'tertiary';
    this._badge.instance.clickable = true;
    this.renderer.appendChild(this.viewContainerRef.element.nativeElement, this._badge.location.nativeElement);

    this.cdr.markForCheck();
  }

  private openFeatureModal() {
    const feature = this.viewContainerRef.element.nativeElement.textContent.trim() || '';
    this.modalService.openModal(UnauthorizedFeatureModalComponent, new ModalConfig({ data: { feature } }));
  }
}
