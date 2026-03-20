import { Observable, of } from 'rxjs';
import { ConnectorParameters, Section, SyncItem } from '../models';

export const S3_IAM_POLICY = {
  Statement: [
    {
      Action: ['s3:ListBucket'],
      Effect: 'Allow',
      Resource: 'arn:aws:s3:::your-s3-bucket-name',
      Sid: 'ListBucket',
    },
    {
      Action: ['s3:GetObject'],
      Effect: 'Allow',
      Resource: 'arn:aws:s3:::your-s3-bucket-name/*',
      Sid: 'GetObjects',
    },
  ],
  Version: '2012-10-17',
};

export class S3Impl {
  hasServerSideAuth = false;
  isExternal = false;
  allowToSelectFolders = true;
  canSyncSecurityGroups = false;
  canSyncLastChanges = false;

  constructor() {}

  getParametersSections(): Observable<Section[]> {
    // TODO: at the moment the connector form is too complex to define here
    return of([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleParameters(params: ConnectorParameters) {
    return;
  }

  getParametersValues(): ConnectorParameters {
    return {};
  }

  getStaticFolders(): SyncItem[] {
    return [];
  }
}
