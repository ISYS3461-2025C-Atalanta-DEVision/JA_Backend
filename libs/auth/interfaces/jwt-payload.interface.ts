import { Role } from '../enums';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: Role;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
