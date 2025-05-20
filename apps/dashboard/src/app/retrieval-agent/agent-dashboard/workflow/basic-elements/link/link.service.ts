import { ApplicationRef, ComponentRef, createComponent, ElementRef, inject, Injectable } from '@angular/core';
import { LinkComponent } from './link.component';

interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  private _container?: ElementRef;
  private applicationRef = inject(ApplicationRef);
  private environmentInjector = this.applicationRef.injector;

  set container(element: ElementRef) {
    this._container = element;
  }
  get container(): ElementRef | undefined {
    return this._container;
  }

  drawLink(leftBox: BoundingBox, rightBox: BoundingBox): ComponentRef<LinkComponent> | undefined {
    if (!this.container) {
      return;
    }
    const diff = Math.abs(leftBox.top - rightBox.top);
    const samePosition = Math.abs(diff) <= 8;
    const goDown = leftBox.top < rightBox.top;
    const containerBox = this.container.nativeElement.getBoundingClientRect();
    const linkRef = createComponent(LinkComponent, {
      environmentInjector: this.environmentInjector,
    });
    linkRef.instance.left = leftBox.right - containerBox.left;
    const height = Math.abs(leftBox.bottom - rightBox.bottom) + 2;
    linkRef.setInput('height', height);
    linkRef.setInput('goDown', goDown);
    linkRef.setInput('samePosition', samePosition);
    let center = samePosition ? 0 : 8;
    if (diff < 4) {
      center = -4;
    } else if (diff < 6) {
      center = -1;
    } else if (height < 16) {
      center = Math.max(0, Math.round(height - 10));
    }
    if (goDown) {
      linkRef.instance.top = leftBox.top - containerBox.top + center;
    } else {
      linkRef.instance.top = rightBox.top - containerBox.top + center;
    }

    this.applicationRef.attachView(linkRef.hostView);
    this.container.nativeElement.appendChild(linkRef.location.nativeElement);
    linkRef.changeDetectorRef.detectChanges();
    return linkRef;
  }

  removeLink(linkRef: ComponentRef<LinkComponent>) {
    if (!this.container) {
      return;
    }
    this.container.nativeElement.removeChild(linkRef.location.nativeElement);
    this.applicationRef.detachView(linkRef.hostView);
  }
}
