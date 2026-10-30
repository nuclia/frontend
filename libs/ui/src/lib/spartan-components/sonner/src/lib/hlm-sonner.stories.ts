import { toast } from '@spartan-ng/brain/sonner';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmToasterImports } from '../index';
import { HlmToaster } from './hlm-toaster';

interface ToasterStoryArgs {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  theme: 'light' | 'dark' | 'system';
  richColors: boolean;
  closeButton: boolean;
  invert: boolean;
  expand: boolean;
  duration: number;
  visibleToasts: number;
}

const meta: Meta<ToasterStoryArgs> = {
  title: 'Spartan/Sonner (Toast)',
  component: HlmToaster,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmToasterImports, HlmButton] })],
  parameters: {
    docs: {
      description: {
        component: `Displays brief toast notifications that give feedback without interrupting the current task. Use it for action results and background updates; critical information should also remain available outside a temporary toast.
Import <code>HlmToasterImports</code> from <code>@nuclia/ui-spartan/sonner</code> and render a single <code>&lt;hlm-toaster /&gt;</code> once near the root of the app.

Toasts are then triggered from anywhere with the <code>toast</code> function from <code>@spartan-ng/brain/sonner</code>: <code>toast('Saved')</code>, <code>toast.success()</code>, <code>toast.error()</code>, <code>toast.info()</code>, <code>toast.warning()</code>, <code>toast.loading()</code> and <code>toast.promise()</code>. Pass <code>description</code>, <code>action</code> or <code>cancel</code> in the options argument.
The toaster inputs (<code>position</code>, <code>theme</code>, <code>richColors</code>, <code>closeButton</code>, <code>duration</code>, <code>visibleToasts</code>...) apply to every toast. The toaster is an <code>aria-live</code> region, and the hotkey <code>Alt + T</code> moves focus to it.`,
      },
    },
  },
  args: {
    position: 'bottom-right',
    theme: 'light',
    richColors: false,
    closeButton: false,
    invert: false,
    expand: false,
    duration: 4000,
    visibleToasts: 3,
  },
  argTypes: {
    position: {
      description: 'Screen corner or edge where toasts are displayed.',
      control: 'select',
      options: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
    },
    theme: {
      description: 'Colour theme of the toasts.',
      control: 'inline-radio',
      options: ['light', 'dark', 'system'],
    },
    richColors: {
      description: 'Uses stronger background colours for success, error, info and warning toasts.',
      control: 'boolean',
    },
    closeButton: {
      description: 'Shows a close button on every toast.',
      control: 'boolean',
    },
    invert: {
      description: 'Renders dark toasts in light mode and vice versa.',
      control: 'boolean',
    },
    expand: {
      description: 'Keeps the toasts expanded instead of stacking them.',
      control: 'boolean',
    },
    duration: {
      description: 'Time in milliseconds before a toast closes automatically.',
      control: 'number',
    },
    visibleToasts: {
      description: 'Maximum number of toasts visible at the same time.',
      control: 'number',
    },
  },
  render: (args) => ({
    props: {
      ...args,
      showToast: () => toast('Resource uploaded', { description: 'research-brief.pdf is now being processed.' }),
    },
    template: `
      <button hlmBtn type="button" variant="outline" (click)="showToast()">Show toast</button>
      <hlm-toaster
        [position]="position"
        [theme]="theme"
        [richColors]="richColors"
        [closeButton]="closeButton"
        [invert]="invert"
        [expand]="expand"
        [duration]="duration"
        [visibleToasts]="visibleToasts"
      />
    `,
  }),
};

export default meta;

type Story = StoryObj<ToasterStoryArgs>;

export const Default: Story = {};

export const RichColors: Story = {
  args: {
    richColors: true,
    closeButton: true,
  },
  render: (args) => ({
    props: {
      ...args,
      showSuccess: () => toast.success('Knowledge box created'),
      showError: () => toast.error('Upload failed', { description: 'The file exceeds the size limit.' }),
      showInfo: () => toast.info('Processing can take a few minutes'),
      showWarning: () => toast.warning('Your quota is almost reached'),
    },
    template: `
      <div class="flex flex-wrap gap-2">
        <button hlmBtn type="button" variant="outline" (click)="showSuccess()">Success</button>
        <button hlmBtn type="button" variant="outline" (click)="showError()">Error</button>
        <button hlmBtn type="button" variant="outline" (click)="showInfo()">Info</button>
        <button hlmBtn type="button" variant="outline" (click)="showWarning()">Warning</button>
      </div>
      <hlm-toaster
        [position]="position"
        [theme]="theme"
        [richColors]="richColors"
        [closeButton]="closeButton"
        [invert]="invert"
        [expand]="expand"
        [duration]="duration"
        [visibleToasts]="visibleToasts"
      />
    `,
  }),
};

export const WithAction: Story = {
  render: (args) => ({
    props: {
      ...args,
      showToast: () =>
        toast('Resource deleted', {
          description: 'research-brief.pdf was removed from the knowledge box.',
          action: { label: 'Undo', onClick: () => toast.success('Resource restored') },
          cancel: { label: 'Dismiss' },
        }),
    },
    template: `
      <button hlmBtn type="button" variant="outline" (click)="showToast()">Delete resource</button>
      <hlm-toaster
        [position]="position"
        [theme]="theme"
        [richColors]="richColors"
        [closeButton]="closeButton"
        [invert]="invert"
        [expand]="expand"
        [duration]="duration"
        [visibleToasts]="visibleToasts"
      />
    `,
  }),
};

export const TopCenter: Story = {
  args: {
    position: 'top-center',
    closeButton: true,
  },
};
