import { Db, KnowledgeBox } from './db';
import { Authentication } from './auth';
import type { INuclia, NucliaOptions, IAuthentication, IRest, IDb, PromiseMapper } from './models';
import { Rest } from './rest';
import { firstValueFrom } from 'rxjs';

export class Nuclia implements INuclia {
  options: NucliaOptions;
  auth: IAuthentication;
  rest: IRest;
  db: IDb;
  private readKb?: KnowledgeBox;

  get backend(): string {
    return this.options.backend;
  }

  get regionalBackend(): string {
    return this.options.backend.replace('//', `//${this.options.zone}.`);
  }

  get knowledgeBox(): KnowledgeBox {
    if (!this.options.knowledgeBox || !this.options.zone) {
      throw new Error('zone and knowledge box id must be defined in the Nuclia options');
    }
    if (!this.readKb) {
      this.readKb = new KnowledgeBox(this, '', {
        id: this.options.knowledgeBox,
        zone: this.options.zone,
      });
    }
    return this.readKb;
  }

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

  constructor(options: NucliaOptions) {
    this.options = options;
    this.auth = new Authentication(this);
    this.rest = new Rest(this);
    this.db = new Db(this);
  }
}
