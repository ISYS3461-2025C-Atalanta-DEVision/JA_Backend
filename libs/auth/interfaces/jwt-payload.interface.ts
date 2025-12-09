import { Role } from '../enums';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: Role;
  type: 'access' | 'refresh';
  country?: string; // ISO 3166-1 alpha-2 country code
  iat?: number;
  exp?: number;
}
