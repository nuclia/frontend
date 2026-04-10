import { ColoredLabel } from '@flaps/common';
import { ISyncEntity } from '../logic';

export interface SyncOptions {
  extensionMode: 'include' | 'exclude';
  extensions: string[];
  globPatterns: string[];
  from: string;
  to: string;
  labels: ColoredLabel[];
  extractStrategy?: string;
}

export type CloudSyncOptionsPayload = Pick<
  ISyncEntity,
  'extract_strategy' | 'file_filter' | 'labels' | 'modified_time_range'
>;

export function getCloudSyncOptionsPayload(options?: SyncOptions): CloudSyncOptionsPayload {
  if (!options) {
    return {};
  }

  const hasExtensions = options.extensions.length > 0;
  const hasGlobPatterns = options.globPatterns.length > 0;

  return {
    ...(hasExtensions || hasGlobPatterns
      ? {
          file_filter: {
            mode: options.extensionMode,
            extensions: hasExtensions ? options.extensions : undefined,
            glob_patterns: hasGlobPatterns ? options.globPatterns : undefined,
          },
        }
      : {}),
    ...(options.labels.length > 0 ? { labels: options.labels } : {}),
    ...(options.from || options.to
      ? {
          modified_time_range: {
            from: options.from || undefined,
            to: options.to || undefined,
          },
        }
      : {}),
    ...(options.extractStrategy ? { extract_strategy: options.extractStrategy } : {}),
  };
}
