import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { db } from '../db.js';
import { operators } from '@chat-sdk/database';
import { eq } from 'drizzle-orm';
import type { RegisterInput, LoginInput, Operator } from '@chat-sdk/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'default-chat-sdk-jwt-secret';

export class AuthService {
  async register(input: RegisterInput): Promise<Operator> {
    const existing = await db.select().from(operators).where(eq(operators.email, input.email)).limit(1);
    if (existing[0]) {
      throw new Error('Email already registered');
    }

    const passwordHash = await argon2.hash(input.password);
    const [newOperator] = await db.insert(operators).values({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'operator',
      totpEnabled: false,
      isOnline: false,
    }).returning();

    if (!newOperator) {
      throw new Error('Failed to create operator');
    }

    return {
      id: newOperator.id,
      name: newOperator.name,
      email: newOperator.email,
      role: newOperator.role as 'admin' | 'operator',
      totpEnabled: newOperator.totpEnabled,
      isOnline: newOperator.isOnline,
      createdAt: newOperator.createdAt,
      updatedAt: newOperator.updatedAt,
    };
  }

  async login(input: LoginInput): Promise<{ operator: Operator; requires2Fa: boolean; token: string }> {
    const records = await db.select().from(operators).where(eq(operators.email, input.email)).limit(1);
    const operatorRecord = records[0];

    if (!operatorRecord) {
      throw new Error('Invalid email or password');
    }

    const valid = await argon2.verify(operatorRecord.passwordHash, input.password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const operator: Operator = {
      id: operatorRecord.id,
      name: operatorRecord.name,
      email: operatorRecord.email,
      role: operatorRecord.role as 'admin' | 'operator',
      totpEnabled: operatorRecord.totpEnabled,
      isOnline: operatorRecord.isOnline,
      createdAt: operatorRecord.createdAt,
      updatedAt: operatorRecord.updatedAt,
    };

    const token = jwt.sign(
      {
        id: operator.id,
        email: operator.email,
        role: operator.role,
        is2FaVerified: !operator.totpEnabled,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      operator,
      requires2Fa: operatorRecord.totpEnabled,
      token,
    };
  }

  async setup2Fa(operatorId: string): Promise<{ secret: string; qrCode: string }> {
    const records = await db.select().from(operators).where(eq(operators.id, operatorId)).limit(1);
    const operatorRecord = records[0];

    if (!operatorRecord) {
      throw new Error('Operator not found');
    }

    const totpSecret = new OTPAuth.Secret().base32;

    await db.update(operators).set({
      totpSecret,
      updatedAt: new Date(),
    }).where(eq(operators.id, operatorId));

    const totp = new OTPAuth.TOTP({
      issuer: 'ChatSDK',
      label: operatorRecord.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(totpSecret),
    });

    const qrCode = await QRCode.toDataURL(totp.toString());

    return {
      secret: totpSecret,
      qrCode,
    };
  }

  async verify2Fa(operatorId: string, token: string): Promise<{ token: string }> {
    const records = await db.select().from(operators).where(eq(operators.id, operatorId)).limit(1);
    const operatorRecord = records[0];

    if (!operatorRecord || !operatorRecord.totpSecret) {
      throw new Error('2FA not configured for this operator');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'ChatSDK',
      label: operatorRecord.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(operatorRecord.totpSecret),
    });

    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      throw new Error('Invalid code');
    }

    await db.update(operators).set({
      totpEnabled: true,
      updatedAt: new Date(),
    }).where(eq(operators.id, operatorId));

    const jwtToken = jwt.sign(
      {
        id: operatorRecord.id,
        email: operatorRecord.email,
        role: operatorRecord.role,
        is2FaVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token: jwtToken };
  }

  verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }
}
