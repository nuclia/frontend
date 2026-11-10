import { provideIcons } from '@ng-icons/core';
import { matMailRound, matGroupRound, matSendRound } from '@ng-icons/material-icons/round';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '@nuclia/ui-spartan/button';
import { UiStepperImports } from './index';
import { UiStepper } from './stepper.component';

interface StepperStoryArgs {
  linear: boolean;
  orientation: 'horizontal' | 'vertical';
  labelPosition: 'end' | 'bottom';
  headerPosition: 'top' | 'bottom';
  indicatorMode: 'number' | 'state' | 'completion' | 'icon';
  animationsEnabled: boolean;
}

const meta: Meta<StepperStoryArgs> = {
  title: 'PDP-UI/Stepper',
  component: UiStepper,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...UiStepperImports, HlmButton],
      providers: [provideIcons({ matMailRound, matGroupRound, matSendRound })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `A multi-step wizard that guides users through a sequence of steps. This is a Spartan <em>block</em> built on the CDK stepper.
Import <code>UiStepperImports</code> from <code>@nuclia/ui/stepper</code> and compose <code>ui-stepper</code> with <code>ui-step</code> children, each with a <code>label</code> and its content.

Use <code>uiStepperNext</code> and <code>uiStepperPrevious</code> on buttons inside a step to navigate.
Set <code>linear</code> to require each step to be <code>completed</code> before moving on; use <code>editable</code>, <code>optional</code>, and <code>hasError</code> on steps to reflect their state.
<code>indicatorMode</code> can be <code>number</code>, <code>state</code> (check mark on reached steps), <code>completion</code> (check mark only on completed steps that were left), or <code>icon</code> (use the step's <code>icon</code> input with an icon registered through <code>provideIcons</code>).
Always provide <code>stepperAriaLabel</code> for assistive technology.`,
      },
    },
  },
  args: {
    linear: false,
    orientation: 'horizontal',
    labelPosition: 'end',
    headerPosition: 'top',
    indicatorMode: 'state',
    animationsEnabled: true,
  },
  argTypes: {
    linear: {
      description: 'Requires each step to be completed before the user can move to the next one.',
      control: 'boolean',
    },
    orientation: {
      description: 'Layout of the stepper. Vertical expands the content of the selected step below its header.',
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    labelPosition: {
      description: 'Position of the step label relative to its indicator (horizontal orientation).',
      control: 'select',
      options: ['end', 'bottom'],
    },
    headerPosition: {
      description: 'Position of the step headers relative to the content (horizontal orientation).',
      control: 'select',
      options: ['top', 'bottom'],
    },
    indicatorMode: {
      description:
        'What the step indicator shows: its number, a check on every reached step (state), a check only on completed steps (completion), or the step icon.',
      control: 'select',
      options: ['number', 'state', 'completion', 'icon'],
    },
    animationsEnabled: {
      description: 'Enables the step transition animations.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <ui-stepper
                class="block w-full max-w-xl"
                stepperAriaLabel="Example steps"
                [linear]="linear"
                [orientation]="orientation"
                [labelPosition]="labelPosition"
                [headerPosition]="headerPosition"
                [indicatorMode]="indicatorMode"
                [animationsEnabled]="animationsEnabled"
            >
                <ui-step label="Recipients" icon="matGroupRound" [completed]="true">
                    <p class="mb-4 text-sm">Choose who should receive the message.</p>
                    <button hlmBtn type="button" uiStepperNext>Next</button>
                </ui-step>
                <ui-step label="Message" icon="matMailRound" [completed]="true">
                    <p class="mb-4 text-sm">Write the message content.</p>
                    <div class="flex gap-2">
                        <button hlmBtn variant="outline" type="button" uiStepperPrevious>Back</button>
                        <button hlmBtn type="button" uiStepperNext>Next</button>
                    </div>
                </ui-step>
                <ui-step label="Review" icon="matSendRound">
                    <p class="mb-4 text-sm">Review everything before sending.</p>
                    <button hlmBtn variant="outline" type="button" uiStepperPrevious>Back</button>
                </ui-step>
            </ui-stepper>
        `,
  }),
};

export default meta;

type Story = StoryObj<StepperStoryArgs>;

export const Default: Story = {};

export const Linear: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <ui-stepper class="block w-full max-w-xl" stepperAriaLabel="Linear steps" linear>
                <ui-step label="Account" [completed]="accountDone">
                    <p class="mb-4 text-sm">The next step stays locked until this step is completed.</p>
                    <div class="flex gap-2">
                        <button hlmBtn variant="outline" type="button" (click)="accountDone = !accountDone">
                            {{ accountDone ? 'Mark as incomplete' : 'Mark as complete' }}
                        </button>
                        <button hlmBtn type="button" uiStepperNext>Next</button>
                    </div>
                </ui-step>
                <ui-step label="Profile" [completed]="false">
                    <p class="mb-4 text-sm">Fill in your profile.</p>
                    <button hlmBtn variant="outline" type="button" uiStepperPrevious>Back</button>
                </ui-step>
            </ui-stepper>
        `,
    props: { accountDone: false },
  }),
};

export const LabelBottom: Story = {
  args: {
    labelPosition: 'bottom',
  },
};

export const HeaderBottom: Story = {
  args: {
    headerPosition: 'bottom',
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const IconIndicators: Story = {
  args: {
    indicatorMode: 'icon',
  },
};

export const CompletionIndicators: Story = {
  args: {
    indicatorMode: 'completion',
  },
};

export const OptionalAndError: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <ui-stepper class="block w-full max-w-xl" stepperAriaLabel="Steps with states">
                <ui-step label="Details" [completed]="true">
                    <p class="text-sm">Details are complete.</p>
                </ui-step>
                <ui-step label="Extras" [optional]="true">
                    <p class="text-sm">This step can be skipped.</p>
                </ui-step>
                <ui-step label="Payment" [hasError]="true" errorMessage="Card declined">
                    <p class="text-sm">Something went wrong with this step.</p>
                </ui-step>
            </ui-stepper>
        `,
  }),
};
