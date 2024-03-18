import { ConnectorParameters, Field } from '../models';
import { Observable, of } from 'rxjs';
import { OAuthConnector } from './oauth';

const SITE_NAME = 'SHAREPOINT_SITE_NAME';

export class SharepointImpl extends OAuthConnector {
  constructor(name: string, id: string, path: string) {
    super(name, id, path);
  }

  override getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'site_name',
        label: 'connectors.sharepoint.site.label',
        type: 'text',
        required: true,
      },
    ]);
  }

  override handleParameters(params: ConnectorParameters) {
    localStorage.setItem(SITE_NAME, params['site_name']);
  }

  override getParametersValues(): ConnectorParameters {
    const params = super.getParametersValues();
    return { ...params, site_name: localStorage.getItem(SITE_NAME) };
  }
}
