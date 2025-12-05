import { ConnectorParameters, IConnector, Section, SyncItem } from '../models';
import { Observable, of } from 'rxjs';

const TOKEN = 'token';
const REFRESH = 'refresh';

export class OAuthConnector implements IConnector {
  name: string;
  id: string;
  path: string;
  hasServerSideAuth = true;
  isExternal = true;
  allowToSelectFolders = false;
  resumable = false;
  canSyncSecurityGroups: boolean;

  constructor(name: string, id: string, path: string) {
    this.canSyncSecurityGroups = name === 'gdrive';
    this.name = name;
    this.id = id;
    this.path = path;
  }

  getParametersSections(): Observable<Section[]> {
    return of([
      {
        id: 'folder',
        title: 'sync.connectors.oauth.folder.title',
        fields: [
          {
            id: 'sync_root_path',
            label: 'sync.connectors.oauth.path.label',
            type: 'text',
            required: true,
          },
        ],
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    if (params['path']) {
      this.path = params['path'];
    }
  }

  getParametersValues(): ConnectorParameters {
    return {
      path: this.path,
    };
  }

  getStaticFolders(): SyncItem[] {
    return [];
  }
}
