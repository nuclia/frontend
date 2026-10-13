import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/angular';
import { createElement, useEffect, type PropsWithChildren } from 'react';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import type { GlobalsUpdatedPayload, SetGlobalsPayload } from 'storybook/internal/types';

function ThemeDocsContainer({ children, context, ...props }: PropsWithChildren<DocsContainerProps>) {
  useEffect(() => {
    const { channel } = context;
    const updateTheme = ({ globals }: Pick<GlobalsUpdatedPayload, 'globals'>) => {
      document.documentElement.classList.toggle('dark', globals['theme'] === 'dark');
    };
    const lastUpdate = channel.last(GLOBALS_UPDATED)?.[0] as GlobalsUpdatedPayload | undefined;
    const initialGlobals = channel.last(SET_GLOBALS)?.[0] as SetGlobalsPayload | undefined;

    channel.on(GLOBALS_UPDATED, updateTheme);
    updateTheme({ globals: lastUpdate?.userGlobals ?? initialGlobals?.globals ?? { theme: 'light' } });

    return () => channel.off(GLOBALS_UPDATED, updateTheme);
  }, [context.channel]);

  return createElement(DocsContainer, { ...props, context }, children);
}

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
    docs: {
      container: ThemeDocsContainer,
    },
    options: {
      storySort: {
        order: ['Foundations', 'Spartan', '*'],
      },
    },
  },
};

export default preview;
