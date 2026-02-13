import { firstValueFrom } from 'rxjs';
import { Authentication } from './auth';
import { Db, KnowledgeBox, RetrievalAgent } from './db';
import { Events } from './events';
import type { IAuthentication, IDb, INuclia, IRest, NucliaOptions, PromiseMapper } from './models';
import { Rest } from './rest';

export class Nuclia implements INuclia {
  options: NucliaOptions;
  /** Allows you to authenticate using username/password or using an API key. */
  auth: IAuthentication;
  /** Allows you to make authenticated REST requests to the Nuclia backend. */
  rest: IRest;
  /** Allows you to access and query the Nuclia database. */
  db: IDb;
  events = new Events();
  private readKb?: KnowledgeBox;
  private _arag?: RetrievalAgent;

  /** The Nuclia global backend URL. */
  get backend(): string {
    return this.options.backend;
  }

  /** The Nuclia regional backend URL. */
  get regionalBackend(): string {
    return this.options.backend.replace('//accounts.', `//${this.options.zone}.`);
  }

  /**
   * Direct access to the current Knowledge Box instance
   * (it returns a Knowledge Box in read mode, and does not work with account authentication). */
  get knowledgeBox(): KnowledgeBox {
    if (!this.options.knowledgeBox || (!this.options.zone && !this.options.standalone && !this.options.proxy)) {
      throw new Error('zone and knowledge box id must be defined in the Nuclia options');
    }
    if (!this.readKb) {
      this.readKb = new KnowledgeBox(this, '', {
        id: this.options.knowledgeBox,
        zone: this.options.zone || '',
        slug: this.options.kbSlug || '',
        title: '',
      });
    }
    return this.readKb;
  }

  /**
   * Direct access to the current Retrieval Agent instance
   */
  get arag(): RetrievalAgent {
    if (this.options.standalone) {
      throw new Error('Retrieval agent is not available on standalone mode.');
    } else if (!this.options.knowledgeBox || !this.options.zone) {
      throw new Error('zone and knowledge box (ie. retrieval agent) id must be defined in the Nuclia options');
    }
    if (!this._arag) {
      this._arag = new RetrievalAgent(this, '', {
        id: this.options.knowledgeBox,
        zone: this.options.zone || '',
        slug: this.options.kbSlug || '',
        title: '',
      });
    }
    return this._arag;
  }

  /** Similar to `knowledgeBox`, but the returned object exposes `Promises` instead of RxJS `Observables`. */
  get asyncKnowledgeBox(): PromiseMapper<KnowledgeBox> {
    return new Proxy(this.knowledgeBox, {
      get(target, prop) {
        const value = Reflect.get(target, prop);
        if (typeof value === 'function') {
          return (...args: typeof value.arguments) => firstValueFrom(value.bind(target)(...args));
        } else {
          return value;
        }
      },
    }) as unknown as PromiseMapper<KnowledgeBox>;
  }

  /**
   * Depending on your use case, you might want to:
   *
   * - Use the Nuclia SDK to access and manage a Nuclia account. In this case you will need to provide the `backend` and `account` options, and you will use **account authentication**.
   * - Use the Nuclia SDK to use a Nuclia Knowledge Box. In this case you will need to provide the `backend`, `knowledgeBox` and `zone` options. You will also either use **knowledge box authentication**, or **no authentication** if the Knowledge Box is public.
   *
   * Example:

    ```ts
    const nuclia = new Nuclia({
      backend: 'https://rag.progress.cloud/api',
      knowledgeBox: '17815eb2-06a5-40ee-a5aa-b2f9dbc5da70',
      zone: 'europe-1',
    });
    ```
   */
  constructor(options: NucliaOptions) {
    this.options = options;
    this.auth = new Authentication(this);
    this.rest = new Rest(this);
    this.db = new Db(this);
  }
}
