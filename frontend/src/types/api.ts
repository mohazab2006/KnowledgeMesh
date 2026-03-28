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
