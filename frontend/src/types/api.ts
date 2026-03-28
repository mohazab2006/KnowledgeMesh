export type UserPublic = {
  id: string;
  email: string;
  display_name: string | null;
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
  /** When null, the API does not track query volume yet. */
  queries_24h: number | null;
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
