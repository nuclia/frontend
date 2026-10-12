import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/angular';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    options: {
      storySort: {
        order: ['Foundations', 'Spartan', '*'],
      },
    },
  },
};

export default preview;
