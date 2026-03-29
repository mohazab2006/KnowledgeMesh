export type UserPublic = {
  id: string;
  email: string;
  display_name: string | null;
};

export type ForgotPasswordResponse = {
  detail: string;
  dev_reset_token: string | null;
};

export type ResetPasswordResponse = {
  detail: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: UserPublic;
};

export type WorkspaceOut = {
  id: string;
  name: string;
  slug: string;
  role: string;
  created_at: string;
};

export type WorkspaceDocumentStatsOut = {
  indexed_count: number;
  processing_count: number;
  /** Rolling count of completed queries in the last 24 hours for this workspace. */
  queries_24h: number | null;
};

export type QueryCitation = {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  document_title: string;
  excerpt: string;
  relevance_distance: number | null;
};

export type QueryResponse = {
  answer: string;
  citations: QueryCitation[];
  chunks_retrieved: number;
};

export type DocumentOut = {
  id: string;
  workspace_id: string;
  created_by_id: string;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
