import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
import { UserService } from '../../manage-users/user.service';
import { ZoneService } from '../zone.service';
import { ZoneDetailsComponent } from './zone-details.component';

describe('ZoneDetailsComponent', () => {
  let component: ZoneDetailsComponent;
  let fixture: ComponentFixture<ZoneDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        MockModule(PaButtonModule),
        MockModule(PaTextFieldModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [ZoneDetailsComponent],
      providers: [MockProvider(ZoneService), MockProvider(UserService), MockProvider(SisToastService)],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
