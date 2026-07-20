import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SDKService } from '@flaps/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { BadgeComponent } from '@nuclia/sistema';
import { AgenticConfig, AgenticSources, SearchConfigs, Widget } from '@nuclia/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaDropdownModule, PaTextFieldModule, PaTogglesModule, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { catchError, forkJoin, of, switchMap, take } from 'rxjs';
import { KbConnectionType } from '../../connections.service';

@Component({
  selector: 'stf-agentic-configuration',
  imports: [
    BadgeComponent,
    ExpandableTextareaComponent,
    InfoCardComponent,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    TranslateModule,
  ],
  templateUrl: './agentic-configuration.component.html',
  styleUrl: './agentic-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgenticConfigurationComponent implements OnInit {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);

  readonly agenticConfigs = input<Array<{ id: string } & AgenticConfig>>([]);
  readonly config = input<Widget.TypedSearchConfiguration | undefined>(undefined);
  readonly excludeSearchConfigNames = input<string[]>([]);

  readonly configChanged = output<Partial<Widget.TypedSearchConfiguration>>();
  readonly heightChanged = output<void>();

  readonly connectionTypeLabels: Record<string, string> = {
    kb: 'Knowledge Box',
    mcp: 'MCP',
    perplexity: 'Perplexity',
    'perplexity-search': 'Perplexity Search',
    'perplexity-answer': 'Perplexity Answer',
    gemini: 'Google Gemini',
    unknown: 'Unknown',
  };

  agenticConfigId = signal<string>('');
  agenticTransport = signal<'http' | 'websocket'>('http');
  agenticSearchConfiguration = signal<string>('');
  useSecurityGroups = signal<boolean>(false);
  securityGroupsText = signal<string>('');
  sources = signal<Array<{ id: string; type: string; description?: string }>>([]);
  private _allAskSearchConfigs = signal<string[]>([]);

  readonly configOptions = computed(() =>
    this.agenticConfigs().map(({ id, title }) => new OptionModel({ id, value: id, label: title || id })),
  );

  readonly askSearchConfigOptions = computed(() => [
    new OptionModel({ id: '', value: '', label: '–' }),
    ...this._allAskSearchConfigs()
      .filter((name) => !this.excludeSearchConfigNames().includes(name))
      .map((name) => new OptionModel({ id: name, value: name, label: name })),
  ]);

  constructor() {
    effect(() => {
      const cfg = this.config();
      if (cfg) {
        this.agenticConfigId.set(cfg.agenticConfigId || '');
        this.agenticTransport.set(cfg.agenticTransport ?? 'http');
        this.agenticSearchConfiguration.set(cfg.agenticSearchConfiguration || '');
        this.useSecurityGroups.set(cfg.searchBox?.useSecurityGroups ?? false);
        this.securityGroupsText.set(cfg.searchBox?.securityGroups ?? '');
        this._loadSources(cfg.agenticConfigId || '');
      }
    });
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getSearchConfigs().pipe(catchError(() => of({} as SearchConfigs)))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((configs) => {
        this._allAskSearchConfigs.set(
          Object.entries(configs)
            .filter(([, cfg]) => cfg.kind === 'ask' && !cfg.config.agentic_config_id)
            .map(([name]) => name),
        );
      });
  }

  updateConfigId(id: string) {
    this.agenticConfigId.set(id);
    this.configChanged.emit({ agenticConfigId: id });
    this._loadSources(id);
  }

  updateTransport(transport: 'http' | 'websocket') {
    this.agenticTransport.set(transport);
    this.configChanged.emit({ agenticTransport: transport });
  }

  updateSearchConfiguration(name: string) {
    this.agenticSearchConfiguration.set(name);
    this.configChanged.emit({ agenticSearchConfiguration: name || undefined });
  }

  updateUseSecurityGroups(val: boolean) {
    this.useSecurityGroups.set(val);
    this.configChanged.emit({
      searchBox: {
        ...(this.config()?.searchBox ?? {}),
        useSecurityGroups: val,
        securityGroups: this.securityGroupsText(),
      } as Widget.SearchBoxConfig,
    });
    this.heightChanged.emit();
  }

  updateSecurityGroupsText(val: string) {
    this.securityGroupsText.set(val);
    this.configChanged.emit({
      searchBox: {
        ...(this.config()?.searchBox ?? {}),
        useSecurityGroups: this.useSecurityGroups(),
        securityGroups: val,
      } as Widget.SearchBoxConfig,
    });
  }

  private _loadSources(configId: string) {
    if (!configId) {
      this.sources.set([]);
      this.heightChanged.emit();
      return;
    }
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          forkJoin([
            kb.getAgenticConfig(configId).pipe(catchError(() => of(null))),
            kb.listAgenticSources().pipe(catchError(() => of({} as AgenticSources))),
          ]),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([agenticConfig, agenticSources]) => {
        const sourceIds: string[] = agenticConfig?.smart_agent?.sources ?? [];
        this.sources.set(
          sourceIds.map((id) => ({
            id,
            type: agenticSources[id]?.type ?? 'unknown',
            description: agenticSources[id]?.description,
          })),
        );
        this.heightChanged.emit();
      });
  }
}
