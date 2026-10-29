import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAvatarImports } from '../index';
import { HlmAvatar } from './hlm-avatar';

interface AvatarStoryArgs {
  size: 'default' | 'sm' | 'lg';
  src: string;
  alt: string;
  fallback: string;
}

const meta: Meta<AvatarStoryArgs> = {
  title: 'Spartan/Avatar',
  component: HlmAvatar,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmAvatarImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `An image element with a fallback for representing the user.`,
      },
    },
  },
  args: {
    size: 'default',
    src: 'https://github.com/shadcn.png',
    alt: 'User avatar',
    fallback: 'CN',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    src: {
      control: 'text',
    },
    alt: {
      control: 'text',
    },
    fallback: {
      control: 'text',
    },
  },
  render: ({ size, src, alt, fallback }) => ({
    props: { size, src, alt, fallback },
    template: `
            <hlm-avatar [size]="size">
                <img hlmAvatarImage [src]="src" [alt]="alt" />
                <span hlmAvatarFallback>{{ fallback }}</span>
            </hlm-avatar>
        `,
  }),
};

export default meta;

type Story = StoryObj<AvatarStoryArgs>;

export const Default: Story = {};

export const Fallback: Story = {
  render: ({ size, fallback }) => ({
    props: { size, fallback },
    template: `
            <hlm-avatar [size]="size">
                <span hlmAvatarFallback>{{ fallback }}</span>
            </hlm-avatar>
        `,
  }),
};

export const Sizes: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: ({ src, alt, fallback }) => ({
    props: { src, alt, fallback },
    template: `
            <div class="flex items-center gap-4">
                <hlm-avatar size="sm">
                    <img hlmAvatarImage [src]="src" [alt]="alt" />
                    <span hlmAvatarFallback>{{ fallback }}</span>
                </hlm-avatar>

                <hlm-avatar size="default">
                    <img hlmAvatarImage [src]="src" [alt]="alt" />
                    <span hlmAvatarFallback>{{ fallback }}</span>
                </hlm-avatar>

                <hlm-avatar size="lg">
                    <img hlmAvatarImage [src]="src" [alt]="alt" />
                    <span hlmAvatarFallback>{{ fallback }}</span>
                </hlm-avatar>
            </div>
        `,
  }),
};

export const WithStatusBadge: Story = {
  render: ({ size, fallback }) => ({
    props: { size, fallback },
    template: `
      <hlm-avatar [size]="size">
        <span hlmAvatarFallback>{{ fallback }}</span>
        <span hlmAvatarBadge aria-label="Online"></span>
      </hlm-avatar>
    `,
  }),
};

export const Group: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div hlmAvatarGroup role="group" aria-label="Project collaborators">
        <hlm-avatar>
          <span hlmAvatarFallback aria-label="Alex Morgan">AM</span>
          <span hlmAvatarBadge aria-label="Online"></span>
        </hlm-avatar>
        <hlm-avatar>
          <span hlmAvatarFallback aria-label="Riley Chen">RC</span>
        </hlm-avatar>
        <hlm-avatar>
          <span hlmAvatarFallback aria-label="Sam Patel">SP</span>
        </hlm-avatar>
        <span hlmAvatarGroupCount aria-label="2 more collaborators">+2</span>
      </div>
    `,
  }),
};
