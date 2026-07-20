import { inject, Injectable } from '@angular/core';
import { baseLogoPath } from './models';
import { SDKService } from '@flaps/core';
import { switchMap, take } from 'rxjs';
import { AgenticSource } from '@nuclia/core';

export interface SourceDefinition {
  type: string;
  title: string;
  help?: string;
  icon?: string;
  logo?: string;
}

export const sourceDefinitions: { [key: string]: SourceDefinition[] } = {
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
    },
  ],
  mcp: [
    {
      type: 'mcp',
      title: 'MCP Server',
      help: 'sync.add-source-page.help.mcp',
      logo: `${baseLogoPath}/mcp.svg`,
    },
  ],
  external: [
    {
      type: 'perplexity',
      title: 'Perplexity',
      help: 'sync.add-source-page.help.perplexity',
      logo: `${baseLogoPath}/perplexity.svg`,
    },
    {
      type: 'google',
      title: 'Google Gemini',
      help: 'sync.add-source-page.help.google',
      logo: `${baseLogoPath}/gemini.svg`,
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class SourcesService {
  private sdk = inject(SDKService);

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
