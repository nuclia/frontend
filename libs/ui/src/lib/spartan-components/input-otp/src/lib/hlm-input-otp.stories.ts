import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import { HlmInputOtpImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmInputOtp } from './hlm-input-otp';

const meta: Meta = {
  title: 'Spartan/Input OTP',
  component: HlmInputOtp,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [BrnInputOtp, ...HlmInputOtpImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `A segmented field for entering a one-time password or verification code. Use it in authentication and confirmation flows where a short, fixed-length code is sent to the user.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="grid gap-3">
        <label hlmLabel for="verification-code">Verification code</label>
        <brn-input-otp hlmInputOtp inputId="verification-code" [length]="6" inputMode="numeric" inputAutocomplete="one-time-code">
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
        <p class="text-muted-foreground text-sm">Enter the six-digit code sent to your email.</p>
      </div>
    `,
  }),
};

export const FourDigits: Story = {
  render: () => ({
    template: `
      <div class="grid gap-3">
        <label hlmLabel for="pin-code">Four-digit PIN</label>
        <brn-input-otp hlmInputOtp inputId="pin-code" [length]="4" inputMode="numeric">
          <hlm-input-otp-group>
            <hlm-input-otp-slot [index]="0" />
            <hlm-input-otp-slot [index]="1" />
            <hlm-input-otp-slot [index]="2" />
            <hlm-input-otp-slot [index]="3" />
          </hlm-input-otp-group>
        </brn-input-otp>
      </div>
    `,
  }),
};
