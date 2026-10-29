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
        component: `A vertically stacked set of headings that reveal or hide related sections of content. Use it for FAQs, settings, or detailed information that users can explore without seeing everything at once.`,
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
