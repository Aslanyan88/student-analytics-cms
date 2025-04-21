import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Clear existing data
  await prisma.submissionFile.deleteMany();
  await prisma.studentAssignment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.classroomStudent.deleteMany();
  await prisma.classroomTeacher.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Hash for password
  const passwordHash = await bcrypt.hash('Arman11$', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create a larger pool of teachers
  const teacherData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com' },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@example.com' },
    { firstName: 'Michael', lastName: 'Davis', email: 'michael.davis@example.com' },
    { firstName: 'Emily', lastName: 'Brown', email: 'emily.brown@example.com' },
    { firstName: 'David', lastName: 'Wilson', email: 'david.wilson@example.com' },
    { firstName: 'Lisa', lastName: 'Martinez', email: 'lisa.martinez@example.com' },
    { firstName: 'Robert', lastName: 'Taylor', email: 'robert.taylor@example.com' },
    { firstName: 'Jennifer', lastName: 'Anderson', email: 'jennifer.anderson@example.com' },
  ];

  // Create teachers
  const teachers = await Promise.all(
    teacherData.map(async (teacher) => {
      return prisma.user.create({
        data: {
          ...teacher,
          password: passwordHash,
          role: UserRole.TEACHER,
        },
      });
    })
  );
  console.log(`Created ${teachers.length} teachers`);

  // Create a larger pool of students
  const studentData = [
    { firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@example.com' },
    { firstName: 'James', lastName: 'Taylor', email: 'james.taylor@example.com' },
    { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown@example.com' },
    { firstName: 'Noah', lastName: 'Miller', email: 'noah.miller@example.com' },
    { firstName: 'Sophia', lastName: 'Anderson', email: 'sophia.anderson@example.com' },
    { firstName: 'Liam', lastName: 'Thomas', email: 'liam.thomas@example.com' },
    { firstName: 'Ava', lastName: 'Garcia', email: 'ava.garcia@example.com' },
    { firstName: 'Ethan', lastName: 'Martinez', email: 'ethan.martinez@example.com' },
    { firstName: 'Isabella', lastName: 'Robinson', email: 'isabella.robinson@example.com' },
    { firstName: 'Mason', lastName: 'Clark', email: 'mason.clark@example.com' },
    { firstName: 'Mia', lastName: 'Rodriguez', email: 'mia.rodriguez@example.com' },
    { firstName: 'William', lastName: 'Lewis', email: 'william.lewis@example.com' },
    { firstName: 'Charlotte', lastName: 'Lee', email: 'charlotte.lee@example.com' },
    { firstName: 'Benjamin', lastName: 'Walker', email: 'benjamin.walker@example.com' },
    { firstName: 'Amelia', lastName: 'Hall', email: 'amelia.hall@example.com' },
  ];

  // Create students
  const students = await Promise.all(
    studentData.map(async (student) => {
      return prisma.user.create({
        data: {
          ...student,
          password: passwordHash,
          role: UserRole.STUDENT,
        },
      });
    })
  );
  console.log(`Created ${students.length} students`);

  // Create classrooms with multiple teachers and more students
  const classroomData = [
    {
      name: 'Mathematics 101',
      description: 'Introduction to basic mathematics concepts',
      creatorId: teachers[0].id,
      teachers: [teachers[0].id, teachers[1].id, teachers[2].id],
      students: students.slice(0, 8),
    },
    {
      name: 'Advanced Algebra',
      description: 'Advanced algebraic equations and concepts',
      creatorId: teachers[3].id,
      teachers: [teachers[3].id, teachers[4].id],
      students: students.slice(4, 12),
    },
    {
      name: 'Computer Science',
      description: 'Introduction to programming and computer concepts',
      creatorId: teachers[5].id,
      teachers: [teachers[5].id, teachers[6].id, teachers[7].id],
      students: students.slice(8),
    },
    {
      name: 'Physics Fundamentals',
      description: 'Basic principles of physics and scientific method',
      creatorId: teachers[2].id,
      teachers: [teachers[2].id, teachers[4].id],
      students: students.slice(2, 10),
    },
    {
      name: 'World Literature',
      description: 'Exploring classic and contemporary literature',
      creatorId: teachers[1].id,
      teachers: [teachers[1].id, teachers[6].id],
      students: students.slice(5, 13),
    }
  ];

  // Create classrooms
  const classrooms = await Promise.all(
    classroomData.map(async (classroom) => {
      const { teachers: teacherIds, students: classroomStudents, ...classroomData } = classroom;
      
      return prisma.classroom.create({
        data: {
          ...classroomData,
          teachers: {
            create: teacherIds.map((teacherId) => ({
              teacherId,
            })),
          },
          students: {
            create: classroomStudents.map((student) => ({
              studentId: student.id,
            })),
          },
        },
        include: {
          teachers: true,
          students: true,
        },
      });
    })
  );
  console.log(`Created ${classrooms.length} classrooms`);

  // Create assignments for each classroom
  const assignments = await Promise.all(
    classrooms.map(async (classroom, index) => {
      return prisma.assignment.create({
        data: {
          title: `Assignment for ${classroom.name}`,
          description: `Comprehensive assignment for ${classroom.name} covering key concepts`,
          dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000), // Staggered due dates
          classroomId: classroom.id,
          creatorId: classroom.teachers[0].teacherId,
        },
      });
    })
  );
  console.log(`Created ${assignments.length} assignments`);

  // Assign assignments to students in each classroom
  for (const classroom of classrooms) {
    const classroomAssignments = assignments.filter(
      (a) => a.classroomId === classroom.id
    );
    
    for (const assignment of classroomAssignments) {
      await Promise.all(
        classroom.students.map(async (student) => {
          return prisma.studentAssignment.create({
            data: {
              assignmentId: assignment.id,
              studentId: student.studentId,
              status: 'PENDING',
            },
          });
        })
      );
    }
  }
  console.log('Assigned assignments to students');

  // Create activity logs
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const allUsers = [...students];
  for (const user of allUsers) {
    // Attendance log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        date: yesterday,
        isPresent: Math.random() > 0.2,
      },
    });
    
    // Performance log
    if (Math.random() > 0.5) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          date: yesterday,
          performanceScore: Math.floor(Math.random() * 41) + 60,
          notes: 'Weekly performance assessment',
        },
      });
    }
  }
  console.log('Created activity logs');

  // Create notifications
  await Promise.all(
    classrooms.flatMap((classroom, classroomIndex) => 
      classroom.students.slice(0, 3).map((student, index) => 
        prisma.notification.create({
          data: {
            title: `Classroom Update - ${classroom.name}`,
            message: `Important notification for ${classroom.name} classroom`,
            senderId: classroom.teachers[0].teacherId,
            receiverId: student.studentId,
          },
        })
      )
    )
  );
  console.log('Created notifications');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });