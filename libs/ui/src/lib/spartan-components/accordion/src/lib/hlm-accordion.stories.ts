import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAccordionImports } from '../index';
import { HlmAccordion } from './hlm-accordion';

interface AccordionStoryArgs {
  type: 'single' | 'multiple';
  isOpened: boolean;
  disabled: boolean;
}

const meta: Meta<AccordionStoryArgs> = {
  title: 'Spartan/Accordion',
  component: HlmAccordion,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmAccordionImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmAccordionImports</code> from <code>@nuclia/ui-spartan/accordion</code> into your component's imports.
Compose <code>hlm-accordion</code> with <code>hlm-accordion-item</code>, <code>hlm-accordion-trigger</code>, and <code>hlm-accordion-content</code>.

Use <code>type="single"</code> to open one item at a time or <code>type="multiple"</code> to open several items independently.
Set <code>isOpened</code> and <code>disabled</code> on individual items; <code>openedChange</code> emits when an item's expanded state changes.

Triggers support keyboard navigation and expose their expanded state to assistive technology.`,
      },
    },
  },
  args: {
    type: 'single',
    isOpened: false,
    disabled: false,
  },
  argTypes: {
    type: {
      description: 'Whether one or several items can be expanded at a time.',
      control: 'select',
      options: ['single', 'multiple'],
    },
    isOpened: {
      description: 'Expanded state of the first item.',
      control: 'boolean',
    },
    disabled: {
      description: 'Disables the first item without affecting the remaining items.',
      control: 'boolean',
    },
  },
  render: ({ type, isOpened, disabled }) => ({
    props: { type, isOpened, disabled },
    template: `
            <hlm-accordion class="w-full max-w-lg" [type]="type">
                <hlm-accordion-item [isOpened]="isOpened" [disabled]="disabled">
                    <hlm-accordion-trigger>Is it accessible?</hlm-accordion-trigger>
                    <hlm-accordion-content>
                        <p>Yes. Each trigger exposes its expanded state and supports keyboard navigation.</p>
                    </hlm-accordion-content>
                </hlm-accordion-item>

                <hlm-accordion-item>
                    <hlm-accordion-trigger>Can I open several items?</hlm-accordion-trigger>
                    <hlm-accordion-content>
                        <p>Use the multiple type to expand items independently. The single type opens one item at a time.</p>
                    </hlm-accordion-content>
                </hlm-accordion-item>

                <hlm-accordion-item>
                    <hlm-accordion-trigger>Can I customize the content?</hlm-accordion-trigger>
                    <hlm-accordion-content>
                        <p>Content is projected, so panels can contain paragraphs, links, or other components.</p>
                        <p>Apply layout classes to the root and use triggerClass to customize a trigger.</p>
                    </hlm-accordion-content>
                </hlm-accordion-item>
            </hlm-accordion>
        `,
  }),
};

export default meta;

type Story = StoryObj<AccordionStoryArgs>;

export const Default: Story = {};

export const Multiple: Story = {
  args: {
    type: 'multiple',
  },
};

export const InitiallyOpen: Story = {
  args: {
    isOpened: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const CustomTrigger: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <hlm-accordion class="w-full max-w-lg" type="single">
                <hlm-accordion-item>
                    <hlm-accordion-trigger triggerClass="text-base font-semibold">
                        Account settings
                    </hlm-accordion-trigger>
                    <hlm-accordion-content>
                        <p>Manage your profile and notification preferences.</p>
                    </hlm-accordion-content>
                </hlm-accordion-item>
            </hlm-accordion>
        `,
  }),
};
