import { Observable, of } from 'rxjs';
import { OAuthConnector } from './oauth';
import { Section } from '../models';

export class SharepointImpl extends OAuthConnector {
  constructor(id: string, path: string) {
    super('sharepoint', id, path);
  }

  override getParametersSections(): Observable<Section[]> {
    return of([
      {
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
            type: 'textarea',
            required: true,
          },
          {
            id: 'pfx_password',
            label: 'sync.connectors.sharepoint.pfx_password.label',
            help: 'sync.connectors.sharepoint.pfx_password.help',
            type: 'text',
            required: true,
            secret: true,
          },
        ],
      },
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
}
