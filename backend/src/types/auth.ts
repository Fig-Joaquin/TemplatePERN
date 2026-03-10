/**
 * Shape of the payload signed into every JWT.
 * Both authController (signing) and authMiddleware (verification)
 * must use this interface to guarantee consistency.
 */
export interface JwtPayload {
  userId: number;
  username: string;
  userRole: string;
}
