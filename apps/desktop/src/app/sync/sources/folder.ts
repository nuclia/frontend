import { SourceConnectorDefinition, Field, ConnectorParameters, ISourceConnector } from '../models';
import { Observable, of } from 'rxjs';

type ElectronFile = File & { relativePath: string };
const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];

export const FolderConnector: SourceConnectorDefinition = {
  id: 'folder',
  title: 'Folder',
  logo: 'assets/logos/folder.svg',
  description: 'Upload a folder from your device',
  factory: () => of(new FolderImpl()),
};

class FolderImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = false;
  resumable = false;
  files: ElectronFile[] = [];
  path = '';

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

  goToOAuth() {
    // eslint-disable-next-line no-empty-function
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
