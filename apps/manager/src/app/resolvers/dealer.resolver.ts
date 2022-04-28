import { Injectable } from '@angular/core';
import { Dealer } from '../models/dealer.model';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { DealerService } from '../services/dealer.service';

@Injectable()
export class DealerResolve implements Resolve<any> {
  constructor(private dealerService: DealerService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Dealer | null> {
    return this.dealerService.getDealer(route.paramMap.get('dealer'));
  }
}
