// Note: this subject is in a separate file to avoid circular dependencies between api.ts and effects.ts
import { Subject } from 'rxjs';

export const reset = new Subject<void>();
