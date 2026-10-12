import type { Preview } from '@storybook/angular';

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ['Foundations', 'Spartan', '*'],
      },
    },
  },
};

export default preview;
