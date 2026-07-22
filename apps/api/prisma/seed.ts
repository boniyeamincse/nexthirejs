import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const candidateRole = await prisma.role.upsert({
    where: { code: 'candidate' },
    update: {},
    create: {
      code: 'candidate',
      name: 'Candidate',
      description: 'Standard candidate and learner account',
      isSystem: true,
    },
  });

  console.log(`Seeded role: ${candidateRole.code} (${candidateRole.id})`);

  const testCandidate = await prisma.user.upsert({
    where: { email: 'candidate@example.com' },
    update: {},
    create: {
      email: 'candidate@example.com',
      passwordHash:
        '$argon2id$v=19$m=65536,p=4,t=3$iY1KhtmOrBMJuGNqRFyPmQ$e07Yj840R2y+CDoXmSTmlmSoDBDDoHQvfNztpbLqu5A',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: {
        create: {
          roleId: candidateRole.id,
        },
      },
    },
  });

  console.log(`Seeded test candidate: ${testCandidate.email}`);

  const bd = await prisma.country.upsert({
    where: { code: 'BD' },
    update: {},
    create: {
      code: 'BD',
      name: 'Bangladesh',
      phoneCode: '+880',
      defaultCurrency: 'BDT',
      defaultTimezone: 'Asia/Dhaka',
      supportedLanguages: ['en', 'bn'],
      sortOrder: 1,
    },
  });

  const pk = await prisma.country.upsert({
    where: { code: 'PK' },
    update: {},
    create: {
      code: 'PK',
      name: 'Pakistan',
      phoneCode: '+92',
      defaultCurrency: 'PKR',
      defaultTimezone: 'Asia/Karachi',
      supportedLanguages: ['en', 'ur'],
      sortOrder: 2,
    },
  });

  const ind = await prisma.country.upsert({
    where: { code: 'IN' },
    update: {},
    create: {
      code: 'IN',
      name: 'India',
      phoneCode: '+91',
      defaultCurrency: 'INR',
      defaultTimezone: 'Asia/Kolkata',
      supportedLanguages: ['en', 'hi'],
      sortOrder: 3,
    },
  });

  console.log(`Seeded countries: ${bd.code}, ${pk.code}, ${ind.code}`);

  const categories = [
    { name: 'Programming', slug: 'programming', sortOrder: 1 },
    { name: 'Web Development', slug: 'web-development', sortOrder: 2 },
    { name: 'Database', slug: 'database', sortOrder: 3 },
    { name: 'DevOps and Cloud', slug: 'devops-and-cloud', sortOrder: 4 },
    { name: 'Cybersecurity', slug: 'cybersecurity', sortOrder: 5 },
    { name: 'Business and Professional Skills', slug: 'business-and-professional-skills', sortOrder: 6 },
  ];

  const categoryRecords: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.assessmentCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryRecords[cat.slug] = record.id;
    console.log(`Seeded assessment category: ${record.slug}`);
  }

  const assessments = [
    {
      categorySlug: 'programming',
      title: 'JavaScript Fundamentals',
      slug: 'javascript-fundamentals',
      shortDescription: 'Test your core JavaScript knowledge including ES6+, closures, and async patterns.',
      type: 'SKILL_CHECK' as const,
      difficulty: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'AVAILABLE' as const,
      estimatedDurationMinutes: 45,
      questionCount: 30,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
    {
      categorySlug: 'web-development',
      title: 'React Fundamentals',
      slug: 'react-fundamentals',
      shortDescription: 'Evaluate your React skills from components and hooks to state management.',
      type: 'SKILL_CHECK' as const,
      difficulty: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'AVAILABLE' as const,
      estimatedDurationMinutes: 60,
      questionCount: 40,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
    {
      categorySlug: 'database',
      title: 'SQL Fundamentals',
      slug: 'sql-fundamentals',
      shortDescription: 'Assess your SQL querying skills including joins, aggregations, and subqueries.',
      type: 'SKILL_CHECK' as const,
      difficulty: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'AVAILABLE' as const,
      estimatedDurationMinutes: 30,
      questionCount: 25,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
    {
      categorySlug: 'devops-and-cloud',
      title: 'Linux Fundamentals',
      slug: 'linux-fundamentals',
      shortDescription: 'Test your Linux command-line and system administration knowledge.',
      type: 'PRACTICE' as const,
      difficulty: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'AVAILABLE' as const,
      estimatedDurationMinutes: 30,
      questionCount: 20,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
    {
      categorySlug: 'cybersecurity',
      title: 'Cybersecurity Fundamentals',
      slug: 'cybersecurity-fundamentals',
      shortDescription: 'Assess your understanding of core cybersecurity concepts and best practices.',
      type: 'PRACTICE' as const,
      difficulty: 'BEGINNER' as const,
      status: 'PUBLISHED' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'COMING_SOON' as const,
      estimatedDurationMinutes: 30,
      questionCount: 0,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
    {
      categorySlug: 'business-and-professional-skills',
      title: 'Workplace Communication Basics',
      slug: 'workplace-communication-basics',
      shortDescription: 'Evaluate your professional communication and collaboration skills.',
      type: 'CERTIFICATION' as const,
      difficulty: 'INTERMEDIATE' as const,
      status: 'PUBLISHED' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'COMING_SOON' as const,
      estimatedDurationMinutes: 45,
      questionCount: 0,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
    {
      categorySlug: 'programming',
      title: 'Advanced TypeScript Patterns',
      slug: 'advanced-typescript-patterns',
      shortDescription: 'An advanced assessment covering TypeScript generics, utility types, and design patterns.',
      type: 'SKILL_CHECK' as const,
      difficulty: 'ADVANCED' as const,
      status: 'DRAFT' as const,
      visibility: 'CANDIDATE_CATALOG' as const,
      availability: 'UNAVAILABLE' as const,
      estimatedDurationMinutes: 60,
      questionCount: 0,
      publishedAt: null,
    },
    {
      categorySlug: 'database',
      title: 'Database Design Mastery',
      slug: 'database-design-mastery',
      shortDescription: 'Advanced assessment on database normalization, indexing, and query optimization.',
      type: 'CERTIFICATION' as const,
      difficulty: 'EXPERT' as const,
      status: 'PUBLISHED' as const,
      visibility: 'INVITE_ONLY' as const,
      availability: 'UNAVAILABLE' as const,
      estimatedDurationMinutes: 90,
      questionCount: 0,
      publishedAt: new Date('2026-07-01T00:00:00Z'),
    },
  ];

  for (const assessment of assessments) {
    const categoryId = categoryRecords[assessment.categorySlug];
    if (!categoryId) continue;

    await prisma.assessment.upsert({
      where: { slug: assessment.slug },
      update: {},
      create: {
        categoryId,
        title: assessment.title,
        slug: assessment.slug,
        shortDescription: assessment.shortDescription,
        type: assessment.type,
        difficulty: assessment.difficulty,
        status: assessment.status,
        visibility: assessment.visibility,
        availability: assessment.availability,
        estimatedDurationMinutes: assessment.estimatedDurationMinutes,
        questionCount: assessment.questionCount,
        publishedAt: assessment.publishedAt,
      },
    });
    console.log(`Seeded assessment: ${assessment.slug}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
