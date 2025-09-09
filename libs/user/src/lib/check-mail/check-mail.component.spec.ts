import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterModule } from '@angular/router';
import { PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { MockComponent, MockModule } from 'ng-mocks';
import { UserContainerComponent } from '../user-container';
import { CheckMailComponent } from './check-mail.component';

describe('CheckMailComponent', () => {
  let component: CheckMailComponent;
  let fixture: ComponentFixture<CheckMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaIconModule), MockModule(PaTranslateModule), RouterModule.forRoot([])],
      declarations: [CheckMailComponent, MockComponent(UserContainerComponent)],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
