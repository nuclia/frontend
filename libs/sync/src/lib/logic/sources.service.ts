import { inject, Injectable } from '@angular/core';
import { baseLogoPath } from './models';
import { FeaturesService, SDKService } from '@flaps/core';
import { combineLatest, map, Observable, switchMap, take } from 'rxjs';
import { AgenticSource } from '@nuclia/core';

export interface SourceDefinition {
  type: string;
  title: string;
  help?: string;
  icon?: string;
  logo?: string;
  featureFlag?: Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class SourcesService {
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);

  sourceDefinitions: { [key: string]: SourceDefinition[] } = {
    local: [
      {
        type: 'nucliadb',
        title: 'Knowledge Box',
        icon: 'knowledge-box',
      },
      {
        type: 'sync',
        title: 'Synchronization',
        icon: 'connectors',
        featureFlag: this.features.unstable.syncSource,
      },
    ],
    mcp: [
      {
        type: 'mcp',
        title: 'MCP Server',
        help: 'sync.add-source-page.help.mcp',
        logo: `${baseLogoPath}/mcp.svg`,
        featureFlag: this.features.unstable.mcpSource,
      },
    ],
    external: [
      {
        type: 'perplexity',
        title: 'Perplexity',
        help: 'sync.add-source-page.help.perplexity',
        logo: `${baseLogoPath}/perplexity.svg`,
        featureFlag: this.features.unstable.perplexitySource,
      },
      {
        type: 'google',
        title: 'Google Gemini',
        help: 'sync.add-source-page.help.google',
        logo: `${baseLogoPath}/gemini.svg`,
        featureFlag: this.features.unstable.googleSource,
      },
    ],
  };

  availableSources = combineLatest(
    Object.values(this.sourceDefinitions)
      .flat()
      .filter((source) => !!source.featureFlag)
      .map((source) => source.featureFlag!.pipe(map((enabled) => ({ type: source.type, enabled })))),
  ).pipe(
    map((flags) =>
      Object.fromEntries(
        Object.entries(this.sourceDefinitions).map(([group, sources]) => [
          group,
          sources.filter((source) => !source.featureFlag || !!flags.find((flag) => flag.type === source.type)?.enabled),
        ]),
      ),
    ),
  );

  getSources() {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.listAgenticSources()),
    );
  }

  getSource(id: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getAgenticSource(id)),
    );
  }

  createSource(id: string, source: AgenticSource) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.createAgenticSource(id, source)),
    );
  }

  updateSource(id: string, source: AgenticSource) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.updateAgenticSource(id, source)),
    );
  }

  deleteSource(id: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.deleteAgenticSource(id)),
    );
  }
}
