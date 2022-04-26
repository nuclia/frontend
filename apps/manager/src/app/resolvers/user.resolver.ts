import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UsersService } from '../services/users.service';

@Injectable()
export class UserResolve implements Resolve<any> {
  constructor(private usersService: UsersService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<User | null> {
    const user = route.paramMap.get('user');
    if (user) {
      return this.usersService.getUser(user);
    } else {
      return of(null);
    }
  }
}
