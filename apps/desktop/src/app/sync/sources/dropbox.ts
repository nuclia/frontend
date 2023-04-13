import { ISourceConnector, SourceConnectorDefinition, Field, ConnectorParameters } from '../models';
import { Observable, of } from 'rxjs';

export const DropboxConnector: SourceConnectorDefinition = {
  id: 'dropbox',
  title: 'Dropbox',
  logo: 'assets/logos/dropbox.svg',
  description: 'File storage and synchronization service developed by Dropbox',
  helpUrl: 'https://docs.nuclia.dev/docs/batch/nda#dropbox-connector-usage',
  factory: () => of(new DropboxImpl()),
};

const TOKEN = 'DROPBOX_TOKEN';
class DropboxImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = false;

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'token',
        label: 'App token',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(TOKEN, params.token);
  }

  goToOAuth(reset?: boolean) {
    return of(true);
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }
}
