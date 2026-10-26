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
        component: `Import <code>HlmToasterImports</code> from <code>@nuclia/ui-spartan/sonner</code> and place one <code>hlm-toaster</code> near the application root. Import <code>toast</code> from <code>@spartan-ng/brain/sonner</code> and call it from an event handler to display a notification. Configure its placement, theme, and toast behavior with the supported inputs. Keep toast copy concise and do not use transient notifications as the only way to communicate critical information.`,
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
