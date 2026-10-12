import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { translateTestProviders } from '../../../test/translate-test-provider';

setupZonelessTestEnv({ extraProviders: translateTestProviders });
