import { map, Observable } from 'rxjs';
import { OAuthConnector } from './oauth';
import { Section } from '../models';

export class SharepointImpl extends OAuthConnector {
  override allowToSelectFolders = true;

  constructor(id: string, path: string) {
    super('sharepoint', id, path);
  }

  override getParametersSections(): Observable<Section[]> {
    const credentialsSection: Section = {
      id: 'credentials',
      title: 'sync.connectors.oauth.credentials.title',
      fields: [
        {
          id: 'tenant_id',
          label: 'sync.connectors.sharepoint.tenant_id.label',
          type: 'text',
          required: true,
        },
        {
          id: 'client_id',
          label: 'sync.connectors.sharepoint.client_id.label',
          type: 'text',
          required: true,
        },
        {
          id: 'pfx_base64',
          label: 'sync.connectors.sharepoint.pfx_base64.label',
          help: 'sync.connectors.sharepoint.pfx_base64.help',
          type: 'file',
          required: true,
          accept: '.pfx',
          handleFile: this.handlePfx,
        },
        {
          id: 'pfx_password',
          label: 'sync.connectors.sharepoint.pfx_password.label',
          help: 'sync.connectors.sharepoint.pfx_password.help',
          type: 'text',
          required: true,
          secret: true,
        },
        {
          id: 'permissions',
          label: 'sync.connectors.sharepoint.permissions.label',
          help: 'sync.connectors.sharepoint.permissions.help',
          type: 'hint',
        },
      ],
    };

    return super.getParametersSections().pipe(map((folderSections) => [credentialsSection, ...folderSections]));
  }

  private handlePfx(file: File): Observable<string> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = () => {
        observer.error();
      };
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result?.split('data:application/x-pkcs12;base64,')[1];
          observer.next(base64);
          observer.complete();
        } else {
          observer.error();
        }
      };
    });
  }
}
