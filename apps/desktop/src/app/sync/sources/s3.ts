import {
  ConnectorSettings,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
  Field,
} from '../models';
import { _Object, S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Observable, of, from, map, switchMap } from 'rxjs';

const MAX_PAGE_SIZE = 1000;

export const S3Connector: SourceConnectorDefinition = {
  id: 's3',
  title: 'AWS S3',
  logo: 'assets/logos/s3.svg',
  description: 'Object storage service developed by Amazon',
  factory: (data?: ConnectorSettings) => of(new S3Impl(data)),
};

class S3Impl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = true;
  resumable = false;
  client?: S3Client;
  bucket?: string;

  constructor(data?: ConnectorSettings) {
    // eslint-disable-next-line no-empty-function
  }

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'region',
        label: 'upload.s3.region',
        type: 'text',
        help: 'upload.s3.region_help',
        required: true,
      },
      {
        id: 'bucket',
        label: 'Bucket',
        type: 'text',
        required: true,
      },
      {
        id: 'access_key_id',
        label: 'Access key id',
        type: 'text',
        required: true,
      },
      {
        id: 'secret_access_key',
        label: 'Secret access key',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    this.bucket = params.bucket;
    this.client = new S3Client({
      region: params.region,
      credentials: {
        accessKeyId: params.access_key_id,
        secretAccessKey: params.secret_access_key,
      },
    });
  }

  goToOAuth() {
    // eslint-disable-next-line no-empty-function
  }

  authenticate(): Observable<boolean> {
    return this.client && this.bucket ? of(true) : of(false);
  }

  getFiles(query?: string, pageSize?: number): Observable<SearchResults> {
    if (query) {
      // S3 API doesn't have any command to filter by keywords.
      // As a workaround we retrieve all the objects and do the filtering ourselves.
      pageSize = MAX_PAGE_SIZE;
    }
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize: number = 50, nextPage?: string | number): Observable<SearchResults> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket || '',
      MaxKeys: pageSize,
      ContinuationToken: nextPage as string,
    });
    return from(this.client!.send(command)).pipe(
      map((results) => ({
        items: (results.Contents || [])
          .filter((item) => this.filterResult(item, query))
          .map((result) => this.mapResult(result)),
        nextPage:
          results.IsTruncated && results.NextContinuationToken
            ? this._getFiles(query, pageSize, results.NextContinuationToken)
            : undefined,
      })),
    );
  }

  private mapResult(result: _Object) {
    const delimiter = '/'; // Only default delimiter is supported at the moment
    const title = (result.Key || '').split(delimiter).pop();
    return {
      originalId: result.Key || '',
      title: title || '',
      uuid: '',
      metadata: {},
      status: FileStatus.PENDING,
    };
  }

  private filterResult(result: _Object, query?: string) {
    if (query && result.Key) {
      const regex = new RegExp(`(${query})`, 'i');
      return regex.test(result.Key);
    }
    return true;
  }

  getLink(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }> {
    const command = new GetObjectCommand({
      Key: resource.originalId,
      Bucket: this.bucket || '',
    });
    return from(getSignedUrl(this.client!, command, { expiresIn: 3600 * 24 * 7 })).pipe(
      map((uri) => ({ uri, extra_headers: {} })),
    );
  }

  download(resource: SyncItem): Observable<Blob> {
    throw 'Error';
  }
}
