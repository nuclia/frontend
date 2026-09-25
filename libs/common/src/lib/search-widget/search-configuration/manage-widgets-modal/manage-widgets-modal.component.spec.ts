import { TestBed } from '@angular/core/testing';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../../search-widget.service';
import { ManageWidgetsModalComponent } from './manage-widgets-modal.component';

describe('ManageWidgetsModalComponent', () => {
  const savedConfig: Widget.TypedSearchConfiguration = {
    ...NUCLIA_STANDARD_SEARCH_CONFIG,
    id: 'Saved configuration',
  };
  const linkedWidget: Widget.Widget = {
    slug: 'saved-configuration',
    name: 'Saved configuration',
    searchConfigId: savedConfig.id,
    creationDate: '2026-09-18T00:00:00.000Z',
  };

  let searchConfigurations: BehaviorSubject<Widget.AnySearchConfiguration[]>;
  let widgetList: BehaviorSubject<Widget.Widget[]>;
  let close: jest.Mock;
  let component: ManageWidgetsModalComponent;

  beforeEach(() => {
    searchConfigurations = new BehaviorSubject<Widget.AnySearchConfiguration[]>([savedConfig]);
    widgetList = new BehaviorSubject<Widget.Widget[]>([linkedWidget]);
    close = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({
              getConfiguration: () => of({ generative_model: 'default-model' }),
              getLearningSchema: () => of({ generative_model: { options: [] } }),
            }),
          },
        },
        {
          provide: SearchWidgetService,
          useValue: {
            searchConfigurations,
            widgetList,
          },
        },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) =>
              key === 'search.configuration.options.nuclia-standard' ? 'Agentic RAG default' : key,
          },
        },
        { provide: SisModalService, useValue: {} },
        { provide: ModalRef, useValue: { close } },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ManageWidgetsModalComponent());
  });

  it('lists the built-in configuration and every saved configuration, including those without an embed', async () => {
    const undeployedConfig: Widget.TypedSearchConfiguration = {
      ...NUCLIA_STANDARD_SEARCH_CONFIG,
      id: 'Undeployed configuration',
    };
    searchConfigurations.next([savedConfig, undeployedConfig]);

    const items = await firstValueFrom(component.configurationList);

    expect(items.map((item) => item.config.id)).toEqual([
      NUCLIA_STANDARD_SEARCH_CONFIG.id,
      savedConfig.id,
      undeployedConfig.id,
    ]);
    expect(items.map((item) => item.displayName)).toEqual([
      'Agentic RAG default',
      savedConfig.id,
      undeployedConfig.id,
    ]);
    expect(items.find((item) => item.config.id === undeployedConfig.id)?.widget).toBeUndefined();
  });

  it('returns the selected configuration and its exact embed slug', async () => {
    const items = await firstValueFrom(component.configurationList);
    const item = items.find((candidate) => candidate.config.id === savedConfig.id);

    if (!item) {
      throw new Error('Expected the saved configuration to be listed');
    }
    component.selectConfiguration(item);

    expect(close).toHaveBeenCalledWith({
      configId: savedConfig.id,
      widgetSlug: linkedWidget.slug,
    });
  });

  it('lists and selects every embed linked to the same configuration', async () => {
    const secondWidget: Widget.Widget = {
      ...linkedWidget,
      slug: 'saved-configuration-chat',
      widgetConfig: { widgetMode: 'chat' },
    };
    widgetList.next([linkedWidget, secondWidget]);

    const items = await firstValueFrom(component.configurationList);
    const savedConfigurationItems = items.filter((item) => item.config.id === savedConfig.id);

    expect(savedConfigurationItems).toHaveLength(2);
    expect(savedConfigurationItems.map((item) => item.widget?.slug)).toEqual([
      linkedWidget.slug,
      secondWidget.slug,
    ]);

    component.selectConfiguration(savedConfigurationItems[1]);

    expect(close).toHaveBeenLastCalledWith({
      configId: savedConfig.id,
      widgetSlug: secondWidget.slug,
    });
  });
});
