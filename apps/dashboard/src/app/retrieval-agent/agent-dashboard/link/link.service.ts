import { ApplicationRef, createComponent, ElementRef, inject, Injectable } from '@angular/core';
import { LinkComponent } from './link.component';
import { filter, Observable, Subject, take } from 'rxjs';

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
  private _container = new Subject<ElementRef>();
  private applicationRef = inject(ApplicationRef);
  private environmentInjector = this.applicationRef.injector;

  set container(element: ElementRef) {
    this._container.next(element);
  }
  get container(): Observable<ElementRef> {
    return this._container.asObservable();
  }

  drawLink(leftBox: BoundingBox, rightBox: BoundingBox) {
    const goDown = leftBox.top < rightBox.top;
    this.container
      .pipe(
        filter((container) => !!container),
        take(1),
      )
      .subscribe((container) => {
        const containerBox = container.nativeElement.getBoundingClientRect();
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
        container.nativeElement.appendChild(linkRef.location.nativeElement);
        linkRef.changeDetectorRef.detectChanges();
      });
  }
}
