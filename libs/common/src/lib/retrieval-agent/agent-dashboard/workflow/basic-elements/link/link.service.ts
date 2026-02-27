import { ApplicationRef, ComponentRef, createComponent, ElementRef, inject, Injectable } from '@angular/core';
import { LinkComponent } from './link.component';

interface LinkResources {
  observers: ResizeObserver[];
  frameId?: number;
  timeoutId?: ReturnType<typeof setTimeout>;
  useAnimationFrame: boolean;
  disposeFns: Array<() => void>;
  mutationObserver?: MutationObserver;
}

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  private _container?: ElementRef;
  private applicationRef = inject(ApplicationRef);
  private environmentInjector = this.applicationRef.injector;
  private linkResources = new Map<ComponentRef<LinkComponent>, LinkResources>();

  set container(element: ElementRef) {
    this._container = element;
  }
  get container(): ElementRef | undefined {
    return this._container;
  }

  drawLink(leftElement: HTMLElement, rightElement: HTMLElement): ComponentRef<LinkComponent> | undefined {
    if (!this.container) {
      return;
    }

    const linkRef = createComponent(LinkComponent, {
      environmentInjector: this.environmentInjector,
    });

    const updateLinkPosition = () => {
      if (!this.container) {
        return;
      }

      const leftBox = leftElement.getBoundingClientRect();
      const rightBox = rightElement.getBoundingClientRect();
      const containerEl = this.container.nativeElement as HTMLElement;
      const containerBox = containerEl.getBoundingClientRect();
      const scrollTop = containerEl.scrollTop;
      const scrollLeft = containerEl.scrollLeft;
      const diff = Math.abs(leftBox.top - rightBox.top);
      const samePosition = diff <= 8;
      const goDown = leftBox.top < rightBox.top;
      const height = Math.abs(leftBox.bottom - rightBox.bottom) + 2;
      linkRef.setInput('height', height);
      linkRef.setInput('goDown', goDown);
      linkRef.setInput('samePosition', samePosition);
      linkRef.instance.left = leftBox.right - containerBox.left + scrollLeft;

      let center = samePosition ? 0 : 8;
      if (diff < 4) {
        center = -4;
      } else if (diff < 6) {
        center = -1;
      } else if (height < 16) {
        center = Math.max(0, Math.round(height - 10));
      }

      linkRef.instance.top = goDown
        ? leftBox.top - containerBox.top + center + scrollTop
        : rightBox.top - containerBox.top + center + scrollTop;

      linkRef.changeDetectorRef.detectChanges();
    };

    const resources: LinkResources = {
      observers: [],
      useAnimationFrame: typeof requestAnimationFrame === 'function',
      disposeFns: [],
    };
    this.linkResources.set(linkRef, resources);

    const schedulePositionUpdate = () => {
      if (resources.useAnimationFrame) {
        if (resources.frameId !== undefined) {
          cancelAnimationFrame(resources.frameId);
        }
        resources.frameId = requestAnimationFrame(() => {
          resources.frameId = undefined;
          updateLinkPosition();
        });
      } else {
        if (resources.timeoutId !== undefined) {
          clearTimeout(resources.timeoutId);
        }
        resources.timeoutId = setTimeout(() => {
          resources.timeoutId = undefined;
          updateLinkPosition();
        });
      }
    };

    if (typeof ResizeObserver !== 'undefined') {
      const watch = (element: Element) => {
        const observer = new ResizeObserver(schedulePositionUpdate);
        observer.observe(element);
        resources.observers.push(observer);
      };

      watch(leftElement);
      watch(rightElement);
      const containerElement = this.container.nativeElement as Element;
      if (containerElement) {
        watch(containerElement);
      }
    }

    const addListener = (target: Element | Window, event: string, options?: AddEventListenerOptions) => {
      const handler = () => schedulePositionUpdate();
      target.addEventListener(event, handler, options);
      resources.disposeFns.push(() => target.removeEventListener(event, handler, options));
    };

    const containerElement = this.container.nativeElement as Element & { scrollTop?: number };
    if (containerElement instanceof Element) {
      addListener(containerElement, 'scroll', { passive: true });
    }
    if (typeof window !== 'undefined') {
      addListener(window, 'resize');
      addListener(window, 'scroll', { passive: true });
    }

    if (typeof MutationObserver !== 'undefined' && containerElement instanceof Element) {
      const mutationObserver = new MutationObserver(() => schedulePositionUpdate());
      mutationObserver.observe(containerElement, {
        childList: true,
        subtree: true,
      });
      resources.mutationObserver = mutationObserver;
    }

    this.applicationRef.attachView(linkRef.hostView);
    this.container.nativeElement.appendChild(linkRef.location.nativeElement);

    schedulePositionUpdate();
    updateLinkPosition();

    return linkRef;
  }

  removeLink(linkRef: ComponentRef<LinkComponent>) {
    const resources = this.linkResources.get(linkRef);
    if (resources) {
      resources.observers.forEach((observer) => observer.disconnect());
      resources.disposeFns.forEach((dispose) => dispose());
      resources.mutationObserver?.disconnect();
      if (resources.useAnimationFrame) {
        if (resources.frameId !== undefined) {
          cancelAnimationFrame(resources.frameId);
        }
      } else if (resources.timeoutId !== undefined) {
        clearTimeout(resources.timeoutId);
      }
      this.linkResources.delete(linkRef);
    }

    if (this.container?.nativeElement?.contains(linkRef.location.nativeElement)) {
      this.container.nativeElement.removeChild(linkRef.location.nativeElement);
    }
    this.applicationRef.detachView(linkRef.hostView);
  }
}
