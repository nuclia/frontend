import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

@Injectable({ providedIn: 'root' })
export class UiToastService {
  public info(message: string): void {
    toast.info(message);
  }

  public success(message: string): void {
    toast.success(message);
  }

  public warning(message: string): void {
    toast.warning(message);
  }

  public error(message: string): void {
    toast.error(message);
  }
}
