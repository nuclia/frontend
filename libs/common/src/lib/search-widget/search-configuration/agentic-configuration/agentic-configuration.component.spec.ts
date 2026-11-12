import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureFlagService, FeaturesService, NavigationService, SDKService, ZoneService } from '@flaps/core';
import { Widget } from '@nuclia/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { AgenticConfigurationComponent } from './agentic-configuration.component';

function agenticConfig(
  sources: string[],
  mode: 'reactive' | 'plan_execute' = 'reactive',
  searchConfigId?: string,
): Widget.TypedSearchConfiguration {
  return {
    type: 'config',
    id: 'config',
    searchMode: 'agentic',
    agentic: {
      configId: 'config',
      searchConfigId,
      config: { title: 'config', smart_agent: { mode, sources, history: true } },
    },
  } as Widget.TypedSearchConfiguration;
}

describe('AgenticConfigurationComponent', () => {
  async function setup() {
    const kb = {
      title: 'KB',
      description: '',
      getSearchConfigs: () => of({ 'ask-config': { kind: 'ask', config: {} } }),
      listAgenticSources: () => of({ kb: { type: 'nucliadb' }, mcp: { type: 'mcp', uri: 'https://mcp.test' } }),
      getAgenticConfigsSchema: () => of({}),
    };
    await TestBed.configureTestingModule({
      imports: [AgenticConfigurationComponent],
      providers: [
        provideRouter([]),
        { provide: SDKService, useValue: { currentKb: of(kb) } },
        { provide: NavigationService, useValue: { kbUrl: of('/kb') } },
        { provide: ZoneService, useValue: { getZones: () => of([]) } },
        { provide: FeatureFlagService, useValue: {} },
        { provide: FeaturesService, useValue: { unstable: {}, authorized: {} } },
        { provide: SvgIconRegistryService, useValue: new Proxy({}, { get: () => () => of(undefined) }) },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AgenticConfigurationComponent);
    const emitted: Partial<Widget.TypedSearchConfiguration>[] = [];
    fixture.componentInstance.configChanged.subscribe((value) => emitted.push(value));
    const load = async (config: Widget.TypedSearchConfiguration) => {
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { component: fixture.componentInstance, fixture, emitted, load };
  }

  it('does not report a change when switching to another configuration', async () => {
    const { emitted, load } = await setup();

    await load(agenticConfig(['kb'], 'reactive', 'ask-config'));
    await load(agenticConfig(['mcp'], 'plan_execute'));

    expect(emitted).toEqual([]);
  });

  it('does not report a change when the saved configuration comes back with specific models', async () => {
    const { fixture, emitted, load } = await setup();
    fixture.componentRef.setInput('learningConfigurations', {
      generative_model: { default: 'm1', options: [{ value: 'm1', name: 'M1' }] },
    });
    await load(agenticConfig(['kb']));

    const saved = agenticConfig(['kb']);
    saved.agentic!.config!.smart_agent!.models = { executor: { model_id: 'm1' } };
    saved.agentic!.config!.rephrase = { history: true, model: { model_id: 'm1' } };
    saved.agentic!.config!.summarize = { history: true, model: { model_id: 'm1' } };
    await load(saved);

    expect(emitted).toEqual([]);
  });

  it('reports a change when the user picks another source', async () => {
    const { component, emitted, load } = await setup();
    await load(agenticConfig(['kb']));

    component.updateSourceAt(0, 'mcp');

    expect(emitted.length).toBe(1);
    expect(emitted[0].agentic?.config?.smart_agent?.sources).toEqual(['mcp']);
  });

  it('still reports a change when the user reverts a source to its original value', async () => {
    const { component, emitted, load } = await setup();
    await load(agenticConfig(['kb']));

    component.updateSourceAt(0, 'mcp');
    component.updateSourceAt(0, 'kb');

    expect(emitted.map((value) => value.agentic?.config?.smart_agent?.sources)).toEqual([['mcp'], ['kb']]);
  });
});
