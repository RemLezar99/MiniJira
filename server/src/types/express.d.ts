export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};