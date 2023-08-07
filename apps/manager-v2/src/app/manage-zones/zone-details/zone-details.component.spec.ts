import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoneDetailsComponent } from './zone-details.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { ZoneService } from '../zone.service';
import { UserService } from '../../manage-users/user.service';
import { SisToastService } from '@nuclia/sistema';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';

describe('ZoneDetailsComponent', () => {
  let component: ZoneDetailsComponent;
  let fixture: ComponentFixture<ZoneDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
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
