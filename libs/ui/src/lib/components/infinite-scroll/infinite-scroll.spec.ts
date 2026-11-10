import { TestBed } from '@angular/core/testing';
import { UiInfiniteScroll } from './infinite-scroll.component';

interface MockObserver {
  options: IntersectionObserverInit | undefined;
  trigger: (isIntersecting: boolean) => void;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

describe('UiInfiniteScroll', () => {
  let observers: MockObserver[];

  beforeEach(() => {
    observers = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
        options: IntersectionObserverInit | undefined;
        trigger: (isIntersecting: boolean) => void;
        constructor(
          callback: (entries: Partial<IntersectionObserverEntry>[]) => void,
          options?: IntersectionObserverInit,
        ) {
          this.options = options;
          this.trigger = (isIntersecting) => callback([{ isIntersecting }]);
          observers.push(this as unknown as MockObserver);
        }
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  async function render(inputs: { rootMargin?: string; disabled?: boolean } = {}) {
    const fixture = TestBed.createComponent(UiInfiniteScroll);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    const reached = vi.fn();
    fixture.componentInstance.reachAnchor.subscribe(reached);
    await fixture.whenStable();
    return { fixture, reached };
  }

  it('should observe the anchor with the default root margin', async () => {
    const { fixture } = await render();
    expect(observers).toHaveLength(1);
    expect(observers[0].options?.rootMargin).toBe('200px');
    expect(observers[0].observe).toHaveBeenCalledWith(fixture.nativeElement);
  });

  it('should emit reachAnchor when the anchor is visible and observe it again', async () => {
    const { fixture, reached } = await render();
    observers[0].trigger(false);
    expect(reached).not.toHaveBeenCalled();

    observers[0].trigger(true);
    expect(reached).toHaveBeenCalledTimes(1);
    await fixture.whenStable();
    expect(observers[0].unobserve).toHaveBeenCalledWith(fixture.nativeElement);
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
  });

  it('should not emit reachAnchor when disabled', async () => {
    const { reached } = await render({ disabled: true });
    observers[0].trigger(true);
    expect(reached).not.toHaveBeenCalled();
  });

  it('should recreate the observer when the root margin changes', async () => {
    const { fixture } = await render({ rootMargin: '100px' });
    expect(observers[0].options?.rootMargin).toBe('100px');

    fixture.componentRef.setInput('rootMargin', '400px');
    await fixture.whenStable();

    expect(observers).toHaveLength(2);
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(observers[1].options?.rootMargin).toBe('400px');
  });
});
