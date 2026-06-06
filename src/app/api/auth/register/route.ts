import { type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { errorResponse, successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`register:${ip}`, { windowMs: 60_000 * 10, max: 5 });
  if (!limit.success) return rateLimitResponse(limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten());
  }

  const { name, email, password, examType } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorResponse('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      examType: examType ?? null,
      onboardedAt: new Date(),
    },
    select: { id: true, email: true, name: true },
  });

  return successResponse(
    { user: { id: user.id, email: user.email, name: user.name } },
    201,
    rateLimitHeaders(limit),
  );
}
