import { HlmButton } from '@nuclia/ui-spartan/button';
import { toast } from '@spartan-ng/brain/sonner';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmToasterImports } from '../index';

interface ToasterStoryArgs {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  theme: 'light' | 'dark' | 'system';
  richColors: boolean;
  closeButton: boolean;
}

const meta: Meta<ToasterStoryArgs> = {
  title: 'Spartan/Sonner (Toast)',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmToasterImports, HlmButton] })],
  parameters: {
    docs: {
      description: {
        component: `Displays brief toast notifications that give feedback without interrupting the current task. Use it for action results and background updates; critical information should also remain available outside a temporary toast.`,
      },
    },
  },
  args: { position: 'bottom-right', theme: 'light', richColors: false, closeButton: false },
  argTypes: {
    position: {
      control: 'select',
      options: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
    },
    theme: { control: 'inline-radio', options: ['light', 'dark', 'system'] },
    richColors: { control: 'boolean' },
    closeButton: { control: 'boolean' },
  },
  render: ({ position, theme, richColors, closeButton }) => ({
    props: {
      position,
      theme,
      richColors,
      closeButton,
      showToast: () => (richColors ? toast.success('Event has been created.') : toast('Event has been created.')),
    },
    template: `
      <button hlmBtn type="button" variant="outline" (click)="showToast()">Show toast</button>
      <hlm-toaster [position]="position" [theme]="theme" [richColors]="richColors" [closeButton]="closeButton" />
    `,
  }),
};

export default meta;
type Story = StoryObj<ToasterStoryArgs>;
export const Default: Story = {};
export const RichColors: Story = { args: { richColors: true, closeButton: true } };
