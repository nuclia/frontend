export interface BroadcastEmailRequest {
  user_ids: string[];
  subject: string;
  body_content: string;
  sender_name?: string;
  is_dry_run: boolean;
}

export interface BroadcastEmailFailure {
  user_id: string;
  error: string;
}

export interface BroadcastEmailResponse {
  dry_run: boolean;
  requested_count: number;
  queued_count: number;
  failed_count: number;
  queued_user_ids: string[];
  failed: BroadcastEmailFailure[];
  preview_recipient?: string | null;
}

export interface BroadcastProgress {
  requested: number;
  queued: number;
  failed: BroadcastEmailFailure[];
}

export type RecipientFilter = 'AOWNER' | 'AMEMBER' | 'ALL';
