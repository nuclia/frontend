import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsersListComponent } from './users-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { UsersService } from '../../services/users.service';
import { of } from 'rxjs';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [UsersListComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        imports: [RouterTestingModule],
        providers: [{ provide: UsersService, useValue: { searchUser: () => of([]) } }],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
