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
    const goDown = leftBox.top < rightBox.top;
    const containerBox = this.container.nativeElement.getBoundingClientRect();
    const linkRef = createComponent(LinkComponent, {
      environmentInjector: this.environmentInjector,
    });
    linkRef.instance.left = leftBox.right - containerBox.left;
    linkRef.setInput('height', Math.abs(leftBox.bottom - rightBox.bottom) + 2);
    if (goDown) {
      linkRef.instance.top = leftBox.top - containerBox.top + 8;
      linkRef.setInput('goDown', true);
    } else {
      linkRef.instance.top = rightBox.top - containerBox.top + 8;
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
