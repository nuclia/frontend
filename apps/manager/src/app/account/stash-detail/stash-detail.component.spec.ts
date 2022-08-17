import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { UsersService } from '../../services/users.service';

import { StashDetailComponent } from './stash-detail.component';
import { MockModule } from 'ng-mocks';
import { MatIconModule } from '@angular/material/icon';

describe('StashDetailComponent', () => {
  let component: StashDetailComponent;
  let fixture: ComponentFixture<StashDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StashDetailComponent],
      imports: [RouterTestingModule, ReactiveFormsModule, STFInputModule, MockModule(MatIconModule)],
      providers: [
        {
          provide: AccountService,
          useValue: {
            setStashUser: () => of(),
            editStash: () => of(),
            getStash: () => of(),
            delStashUser: () => of(),
            addStashUser: () => of(),
          },
        },
        { provide: UsersService, useValue: { searchAccountUser: () => of() } },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StashDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
