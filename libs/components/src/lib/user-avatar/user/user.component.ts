import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Account } from '@flaps/auth';
import { UsersService } from '@flaps/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'stf-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent implements OnInit, OnDestroy {
  @Input() id: string | undefined;
  @Input() account: Account | undefined;

  @Input()
  get only_name(): boolean {
    return this._only_name;
  }
  set only_name(value: boolean) {
    this._only_name = coerceBooleanProperty(value);
  }
  protected _only_name: boolean = false;

  @Input()
  get show_name(): boolean {
    return this._show_name;
  }
  set show_name(value: boolean) {
    this._show_name = coerceBooleanProperty(value);
    if (this._show_name) {
      this.alt_name = undefined;
    } else {
      this.alt_name = this.name;
    }
  }
  protected _show_name = true;

  alt_name: string | undefined;
  name: string | undefined;
  avatar: string | undefined;
  avatarText: string | undefined;

  private unsubscribeAll: Subject<void>;

  constructor(private user: UsersService, private cd: ChangeDetectorRef) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit() {
    if (this._show_name) {
      this.alt_name = undefined;
    }
    this.getUser();
    this.cd.markForCheck();
  }

  getUser(): void {
    if (this.account && this.id) {
      this.user
        .getAccountUser(this.account.slug, this.id)
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe(
          (user) => {
            this.name = user.name || 'undefined';
            if (!user.avatar) {
              this.avatarText = this.getInitials(this.name, 2);
            } else {
              this.avatar = user.avatar;
            }
            this.cd.markForCheck();
          },
          (err) => {
            if (err.status === 404) {
              this.name = 'Not found';
              this.avatarText = '--';
              this.cd.markForCheck();
            }
          },
        );
    }
  }

  private getInitials(name: string | undefined, size: number): string {
    const new_name = name ? name.trim() : null;

    if (!new_name) {
      return '';
    }

    const initials = new_name.split(' ');

    if (size && size < initials.length) {
      return this.constructInitials(initials.slice(0, size));
    } else {
      return this.constructInitials(initials);
    }
  }

  private constructInitials(elements: string[]): string {
    if (!elements || !elements.length) {
      return '';
    }

    return elements
      .filter((element) => element && element.length > 0)
      .map((element) => element[0].toUpperCase())
      .join('');
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
