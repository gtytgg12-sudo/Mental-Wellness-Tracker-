import { type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stressLogSchema, rangeSchema } from '@/lib/validation';
import { errorResponse, successResponse, getClientIp } from '@/lib/security';
import { rateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse('Authentication required', 401);

  const ip = getClientIp(req.headers);
  const limit = rateLimit(`stress:get:${session.user.id}:${ip}`);
  if (!limit.success) return rateLimitResponse(limit);

  const { searchParams } = new URL(req.url);
  const parsed = rangeSchema.safeParse({ range: searchParams.get('range') ?? '7d' });
  if (!parsed.success) return errorResponse('Invalid range', 400);

  const days = parsed.data.range === '7d' ? 7 : parsed.data.range === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.stressLog.findMany({
    where: { userId: session.user.id, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'desc' },
  });

  // Aggregated counts per trigger
  const counts = logs.reduce<Record<string, { count: number; totalIntensity: number }>>(
    (acc, log) => {
      acc[log.trigger] = acc[log.trigger] ?? { count: 0, totalIntensity: 0 };
      acc[log.trigger]!.count += 1;
      acc[log.trigger]!.totalIntensity += log.intensity;
      return acc;
    },
    {},
  );

  const stats = Object.entries(counts)
    .map(([trigger, v]) => ({
      trigger,
      count: v.count,
      avgIntensity: Math.round(v.totalIntensity / v.count),
    }))
    .sort((a, b) => b.count - a.count);

  return successResponse({ logs, stats }, 200, rateLimitHeaders(limit));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse('Authentication required', 401);

  const ip = getClientIp(req.headers);
  const limit = rateLimit(`stress:post:${session.user.id}:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limit.success) return rateLimitResponse(limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = stressLogSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten());
  }

  const created = await prisma.$transaction(
    parsed.data.triggers.map((trigger) =>
      prisma.stressLog.create({
        data: {
          userId: session.user.id!,
          trigger,
          intensity: parsed.data.intensity,
        },
      }),
    ),
  );

  return successResponse({ created: created.length }, 201, rateLimitHeaders(limit));
}
