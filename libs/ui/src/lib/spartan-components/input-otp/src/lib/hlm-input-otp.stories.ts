import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import { HlmInputOtpImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmInputOtp } from './hlm-input-otp';

type OtpInputMode = 'text' | 'tel' | 'numeric' | 'decimal';

interface InputOtpStoryArgs {
  length: number;
  inputMode: OtpInputMode;
  disabled: boolean;
  forceInvalid: boolean;
  completed: (code: string) => void;
}

/** Slot indexes for the given code length. */
const slotsOf = (length: number): number[] => Array.from({ length: Math.max(0, length) }, (_, index) => index);

const meta: Meta<InputOtpStoryArgs> = {
  title: 'Spartan/Input OTP',
  component: HlmInputOtp,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [BrnInputOtp, ...HlmInputOtpImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `A segmented field for entering a one-time password or verification code. Use it in authentication and confirmation flows where a short, fixed-length code is sent to the user.
Import <code>HlmInputOtpImports</code> from <code>@nuclia/ui-spartan/input-otp</code> and also <code>BrnInputOtp</code> from <code>@spartan-ng/brain/input-otp</code>.

Use <code>&lt;brn-input-otp hlmInputOtp&gt;</code> with a <code>length</code> and an <code>inputId</code>, containing <code>hlm-input-otp-group</code> elements that hold one <code>hlm-input-otp-slot [index]</code> per character; <code>hlm-input-otp-separator</code> visually splits groups.
It works with <code>ngModel</code> / reactive forms, or listen to <code>valueChange</code> and <code>completed</code> (emits the full code). Use <code>inputMode</code> to pick the mobile keyboard, <code>inputAutocomplete="one-time-code"</code> to let browsers suggest codes from SMS, and <code>transformPaste</code> to clean pasted text.
Set <code>forceInvalid</code> on each slot to show the invalid style. Associate a visible <code>label</code> through <code>for</code> and the <code>inputId</code>.`,
      },
    },
  },
  args: {
    length: 6,
    inputMode: 'numeric',
    disabled: false,
    forceInvalid: false,
  },
  argTypes: {
    length: {
      description: 'Number of characters of the code. The template renders one slot per character.',
      control: { type: 'number', min: 1, max: 8 },
    },
    inputMode: {
      description: 'Keyboard type suggested on mobile devices.',
      control: 'select',
      options: ['numeric', 'text', 'tel', 'decimal'],
    },
    disabled: {
      description: 'Disables the input.',
      control: 'boolean',
    },
    forceInvalid: {
      description: 'Forces the invalid style on every slot, e.g. after the server rejected the code.',
      control: 'boolean',
    },
    completed: {
      description: 'Output emitting the full code once every slot is filled.',
      action: 'completed',
    },
  },
  render: (args) => ({
    props: { ...args, slots: slotsOf(args.length) },
    template: `
      <div class="grid gap-3">
        <label hlmLabel for="verification-code">Verification code</label>
        <brn-input-otp
          hlmInputOtp
          inputId="verification-code"
          inputAutocomplete="one-time-code"
          [length]="length"
          [inputMode]="inputMode"
          [disabled]="disabled"
          (completed)="completed($event)">
          <hlm-input-otp-group>
            @for (slot of slots; track slot) {
              <hlm-input-otp-slot [index]="slot" [forceInvalid]="forceInvalid" />
            }
          </hlm-input-otp-group>
        </brn-input-otp>
        <p class="text-muted-foreground text-sm">Enter the code sent to your email.</p>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<InputOtpStoryArgs>;

export const Default: Story = {};

export const FourDigits: Story = {
  args: {
    length: 4,
  },
};

export const Alphanumeric: Story = {
  args: {
    length: 8,
    inputMode: 'text',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    forceInvalid: true,
  },
};

export const WithSeparator: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="grid gap-3">
        <label hlmLabel for="verification-code-split">Verification code</label>
        <brn-input-otp
          hlmInputOtp
          inputId="verification-code-split"
          inputAutocomplete="one-time-code"
          inputMode="numeric"
          [length]="6">
          <hlm-input-otp-group>
            <hlm-input-otp-slot [index]="0" />
            <hlm-input-otp-slot [index]="1" />
            <hlm-input-otp-slot [index]="2" />
          </hlm-input-otp-group>
          <hlm-input-otp-separator />
          <hlm-input-otp-group>
            <hlm-input-otp-slot [index]="3" />
            <hlm-input-otp-slot [index]="4" />
            <hlm-input-otp-slot [index]="5" />
          </hlm-input-otp-group>
        </brn-input-otp>
        <p class="text-muted-foreground text-sm">Enter the six-digit code sent to your phone.</p>
      </div>
    `,
  }),
};
