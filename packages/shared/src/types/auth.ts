import { z } from 'zod';

export type OperatorRole = 'admin' | 'operator';

export interface Operator {
  id: string;
  name: string;
  email: string;
  role: OperatorRole;
  totpEnabled: boolean;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
