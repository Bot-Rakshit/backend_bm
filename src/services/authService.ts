import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export class AuthService {
  public generateToken(user: User): string {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });
  }
}