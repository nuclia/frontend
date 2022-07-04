import { APIService } from '@flaps/core';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Dealer } from '../models/dealer.model';
import { Observable, of } from 'rxjs';

const STF_DEALER = '/@dealer';

@Injectable({
  providedIn: 'root',
})
export class DealerService {
  constructor(private api: APIService) {}

  getDealer(id: string | null): Observable<Dealer | null> {
    if (id) {
      return this.api.get(STF_DEALER + '/' + id, true, undefined, true).pipe(map((res) => new Dealer(res)));
    } else {
      return of(null);
    }
  }

  getDealers(): Observable<Dealer[]> {
    return this.api.get(STF_DEALER, true, undefined, true).pipe(map((res) => res as Dealer[]));
  }

  create(dealer: Dealer) {
    return this.api.post(STF_DEALER, dealer, true, undefined, undefined, true);
  }

  edit(dealer: Dealer, dealerId: string) {
    return this.api.patch(STF_DEALER + '/' + dealerId, dealer, true, undefined, true);
  }

  addUser(userId: string, userEmail: string, dealerId: string) {
    const data = {
      email: userEmail,
      id: userId,
    };
    return this.api.post(STF_DEALER + '/' + dealerId, data, true, undefined, undefined, true);
  }

  deleteUser(userId: string, dealerId: string) {
    return this.api.delete(STF_DEALER + '/' + dealerId + '/' + userId, true, true);
  }

  deleteDealer(dealerId: string) {
    return this.api.delete(STF_DEALER + '/' + dealerId, true, true);
  }
}
