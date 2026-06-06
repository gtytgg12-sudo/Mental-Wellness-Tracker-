// Optional seed script — run with `npm run db:seed`
// Creates a demo user with 14 days of realistic data so the dashboard
// looks alive during the hackathon demo.

import { config } from 'dotenv';
config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MOOD_CYCLE = ['GOOD', 'NEUTRAL', 'GREAT', 'LOW', 'GOOD', 'GREAT', 'NEUTRAL'] as const;
const TRIGGERS = ['EXAM_PRESSURE', 'ACADEMIC_WORKLOAD', 'LACK_OF_SLEEP'] as const;
const PROMPTS = [
  'I studied for 6 hours and feel good about progress, but the JEE mocks are draining me.',
  'Tough day. I could not focus and I am behind on Physics revision.',
  'Great session! Finished 3 chapters of Organic Chemistry. Feeling proud.',
  'Family is putting pressure on rank. Need to manage expectations.',
  'Slept only 5 hours. Will catch up tonight. Small win: finished a mock test.',
];

async function main() {
  console.log('Seeding...');
  const email = 'demo@mindfulprep.app';
  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Demo Student',
      passwordHash,
      examType: 'JEE',
      onboardedAt: new Date(),
    },
  });

  // Wipe existing data for a clean demo
  await prisma.moodEntry.deleteMany({ where: { userId: user.id } });
  await prisma.stressLog.deleteMany({ where: { userId: user.id } });
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } });
  await prisma.wellnessMetric.deleteMany({ where: { userId: user.id } });

  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now - i * 24 * 60 * 60 * 1000);
    const mood = MOOD_CYCLE[i % MOOD_CYCLE.length]!;
    const sleep = 5 + Math.random() * 3;
    const study = 3 + Math.random() * 5;
    await prisma.moodEntry.create({
      data: {
        userId: user.id,
        mood,
        sleepHours: Math.round(sleep * 10) / 10,
        studyHours: Math.round(study * 10) / 10,
        recordedAt: day,
        createdAt: day,
      },
    });
    if (Math.random() > 0.4) {
      await prisma.stressLog.create({
        data: {
          userId: user.id,
          trigger: TRIGGERS[i % TRIGGERS.length]!,
          intensity: 3 + Math.floor(Math.random() * 6),
          recordedAt: day,
        },
      });
    }
    if (i % 3 === 0) {
      await prisma.journalEntry.create({
        data: {
          userId: user.id,
          content: PROMPTS[i % PROMPTS.length]!,
          aiReflection: 'You are making real progress. Keep your pace and protect your sleep.',
          sentiment: i % 2 === 0 ? 'mixed' : 'positive',
          keywords: 'study, jee, sleep, progress',
          createdAt: day,
        },
      });
    }
  }

  console.log('Seed complete. Demo user:');
  console.log('  email:    demo@mindfulprep.app');
  console.log('  password: Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
