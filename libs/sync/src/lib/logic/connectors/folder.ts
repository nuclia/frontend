import { baseLogoPath, ConnectorParameters, Field, IConnector, ConnectorDefinition } from '../models';
import { Observable, of } from 'rxjs';
import { FileStatus, SyncItem } from '../models';

type ElectronFile = File & { relativePath: string };

export const FolderConnector: ConnectorDefinition = {
  id: 'folder',
  title: 'Folder',
  logo: `${baseLogoPath}/folder.svg`,
  description: 'Upload a folder from your device',
  factory: () => of(new FolderImpl()),
};

class FolderImpl implements IConnector {
  hasServerSideAuth = false;
  isExternal = false;
  allowToSelectFolders = false;
  files: ElectronFile[] = [];
  path = '';
  canSyncSecurityGroups = false;

  getStaticFolders(): SyncItem[] {
    return this.path
      ? [
          {
            uuid: '',
            title: this.path,
            originalId: this.path,
            metadata: {},
            status: FileStatus.PENDING,
          },
        ]
      : [];
  }

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'path',
        label: 'Local folder path',
        placeholder: '/Users/alice/Documents or C:\\Users\\Alice\\Documents',
        type: 'text',
        required: true,
      },
    ]);
  }

  // eslint-disable-next-line no-empty-function
  goToOAuth() {}

  cleanAuthData() {
    throw new Error('Method not implemented.');
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

  authenticate(): Observable<boolean> {
    return of(true);
  }
}
