import db from '../src/services/databaseService';
import prisma from '../src/services/db';

async function main() {
  console.log('Seeding development database...');
  await db.initAllTables();

  const demoUserId = 'demo_student_uncc';
  const demoApiKey = 'demo_canvas_key_uncc_2026';

  await db.pushGeneralUserInfo(
    {
      userID: demoUserId,
      firstName: 'Alex',
      lastName: 'Doe',
    },
    demoApiKey
  );

  await db.pushCourseInformation([
    {
      courseID: '265289',
      courseName: 'Fall 2026 - ITCS-3160 - Database Design',
      courseCode: 'ITCS-3160',
      courseTerm: 'Fall 2026',
    },
    {
      courseID: '265290',
      courseName: 'Fall 2026 - ITCS-3145 - Parallel Computing',
      courseCode: 'ITCS-3145',
      courseTerm: 'Fall 2026',
    },
  ]);

  await db.pushUserCourses(demoUserId, ['265289', '265290']);

  await db.pushAssignments('265289', [
    {
      assignmentID: 'assign_3160_01',
      name: 'Sprint 2: ORM & Database Integration',
      points: 100,
    },
    {
      assignmentID: 'assign_3160_02',
      name: 'Relational Schema Design Lab',
      points: 50,
    },
  ]);

  console.log('Database seeded successfully with demo development data.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
