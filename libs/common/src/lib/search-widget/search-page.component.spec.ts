import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NavigationService, UploadEventService } from '@flaps/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { EMPTY, of } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { SearchWidgetService } from './search-widget.service';

describe('SearchPageComponent', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  let component: SearchPageComponent;
  let generateWidgetSnippet: jest.Mock;
  let stage: HTMLElement;

  beforeEach(async () => {
    generateWidgetSnippet = jest.fn();
    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: NavigationService, useValue: { inArag: () => of(false) } },
        { provide: UploadEventService, useValue: {} },
        { provide: SisModalService, useValue: {} },
        {
          provide: SearchWidgetService,
          useValue: {
            widgetPreview: EMPTY,
            searchTriggered: EMPTY,
            generateWidgetSnippet,
            resetSearchQuery: jest.fn(),
          },
        },
      ],
    })
      .overrideComponent(SearchPageComponent, {
        set: { template: '<div #previewStage></div>', imports: [], styles: [], styleUrls: [] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.searchConfig = NUCLIA_STANDARD_SEARCH_CONFIG;
    const previewStage = component.previewStageElement();
    if (!previewStage) {
      throw new Error('Expected the preview stage to be rendered');
    }
    stage = previewStage.nativeElement;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<Widget.WidgetConfiguration['widgetMode']>(['page', 'chat', 'popup'])(
    'does not regenerate the %s preview when the sidebar is dragged and its width transition finishes',
    (widgetMode) => {
      component.widgetOptions = { widgetMode };
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        callback(0);
        return 0;
      });

      component.startResizePanel(new MouseEvent('mousedown', { clientX: 600 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 500 }));
      document.dispatchEvent(new MouseEvent('mouseup'));
      const transition = new Event('transitionend');
      Object.defineProperty(transition, 'propertyName', { value: 'width' });
      component.onPreviewContainerTransitionEnd(transition as TransitionEvent);

      expect(component.panelWidth()).toBe(580);
      expect(generateWidgetSnippet).not.toHaveBeenCalled();
    },
  );

  it('preserves the existing floating-chat resize behavior without changing its configured size', () => {
    component.widgetOptions = { widgetMode: 'floating-chat', panelWidth: 600, panelHeight: 700 };
    Object.defineProperties(stage, {
      clientWidth: { value: 500, configurable: true },
      clientHeight: { value: 600, configurable: true },
    });
    const transition = new Event('transitionend');
    Object.defineProperty(transition, 'propertyName', { value: 'width' });

    component.onPreviewContainerTransitionEnd(transition as TransitionEvent);

    expect(generateWidgetSnippet).toHaveBeenCalledWith(
      NUCLIA_STANDARD_SEARCH_CONFIG,
      { widgetMode: 'floating-chat', panelWidth: 452, panelHeight: 552 },
      undefined,
      '.preview-stage',
    );
    expect(component.widgetOptions.panelWidth).toBe(600);
    expect(component.widgetOptions.panelHeight).toBe(700);
  });

  it.each<Widget.WidgetConfiguration['widgetMode']>(['page', 'chat'])(
    'uses the %s scroll container when regenerating the widget after configuration changes',
    (widgetMode) => {
      component.widgetOptions = { widgetMode };
      component.updateConfig(NUCLIA_STANDARD_SEARCH_CONFIG);

      expect(generateWidgetSnippet).toHaveBeenCalledWith(
        NUCLIA_STANDARD_SEARCH_CONFIG,
        { widgetMode },
        undefined,
        widgetMode === 'page' ? '.search-preview-container' : '.preview-stage',
      );
    },
  );
});
