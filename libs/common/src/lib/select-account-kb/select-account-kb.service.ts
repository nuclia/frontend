import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { SDKService, standaloneSimpleAccount, StaticEnvironmentConfiguration } from '@flaps/core';
import { Account, IKnowledgeBoxItem, KBRoles } from '@nuclia/core';
import { map } from 'rxjs/operators';
import { SisToastService } from '@nuclia/sistema';

@Injectable({
  providedIn: 'root',
})
export class SelectAccountKbService {
  private readonly accountsSubject = new BehaviorSubject<Account[] | null>(null);
  private readonly kbsSubject = new BehaviorSubject<IKnowledgeBoxItem[] | null>(null);

  readonly accounts = this.accountsSubject.asObservable();
  readonly kbs = this.kbsSubject.asObservable();
  readonly standalone = this.environment.standalone;

  constructor(
    private sdk: SDKService,
    private toast: SisToastService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  loadAccounts(): Observable<Account[]> {
    const loadAccountRequest: Observable<Account[]> = this.standalone
      ? of([standaloneSimpleAccount])
      : this.sdk.nuclia.db.getAccounts();
    return loadAccountRequest.pipe(tap((accounts) => this.accountsSubject.next(accounts)));
  }

  loadKbs(accountSlug: string): Observable<IKnowledgeBoxItem[]> {
    const loadKbsRequest: Observable<IKnowledgeBoxItem[]> = this.standalone
      ? this.sdk.nuclia.db.getStandaloneKbs().pipe(
          map((kbs) =>
            kbs.map((kb) => ({
              id: kb.uuid,
              slug: kb.uuid,
              zone: 'local',
              title: kb.slug,
              role_on_kb: 'SOWNER' as KBRoles,
            })),
          ),
          catchError((error) => {
            this.toast.error(
              'We cannot load your knowledge box, please check NucliaDB server is running and try again.',
            );
            return throwError(() => error);
          }),
        )
      : this.sdk.nuclia.db.getKnowledgeBoxes(accountSlug);

    return loadKbsRequest.pipe(
      tap((kbs) => {
        this.kbsSubject.next(kbs);
      }),
    );
  }

  selectAccount(accountSlug: string) {
    return this.sdk.setCurrentAccount(accountSlug);
  }

  removeKb(kbSlug: string) {
    this.kbsSubject.next((this.kbsSubject.value || []).filter((kb) => kb.slug !== kbSlug));
  }
}
