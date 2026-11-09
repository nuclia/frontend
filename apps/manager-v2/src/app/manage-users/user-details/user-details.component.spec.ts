import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { ManagerStore } from '../../manager.store';
import { UserService } from '../user.service';
import { UserDetailsComponent } from './user-details.component';
import { SDKService } from '@flaps/core';

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(UserService),
        MockProvider(UiToastService),
        MockProvider(SDKService, {
          getOriginForApp: () => '',
        }),
        MockProvider(ManagerStore, {
          canEdit: signal(true),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
