import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18N_EN, PA_LANG, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { DEMO_LA } from '@guillotinaweb/pastanaga-angular/demo';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AppComponent, menu } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the demo shell with the configured logo and menu', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        importProvidersFrom(
          AngularSvgIconModule.forRoot(),
          PaTranslateModule.addTranslations([{ en_US: I18N_EN }, { latin: DEMO_LA }]),
        ),
        { provide: PA_LANG, useValue: 'en_US' },
      ],
    });
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('pa-demo')).not.toBeNull();
    menu.forEach((section) => expect(element.textContent).toContain(section.title));
    expect(fixture.componentInstance.logo).toBe('./assets/logos/logo-pdp.svg');
    expect(fixture.componentInstance.menu).toBe(menu);
  });
});

describe('demo menu', () => {
  const pages = menu.flatMap((section) => section.pages);

  it('should declare a unique view for every page so each one gets its own route', () => {
    const views = pages.map((page) => page.view);
    expect(new Set(views).size).toBe(views.length);
  });

  it('should give every section a title and every page a title and a component', () => {
    expect(menu.length).toBeGreaterThan(0);
    menu.forEach((section) => expect(section.title).toBeTruthy());
    pages.forEach((page) => {
      expect(page.title).toBeTruthy();
      expect(page.type).toBeDefined();
    });
  });
});
