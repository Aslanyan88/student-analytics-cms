import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllData() {
  try {
    // Clear data in an order that respects foreign key constraints
    await prisma.submissionFile.deleteMany()
    await prisma.studentAssignment.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.activityLog.deleteMany()
    await prisma.classroomStudent.deleteMany()
    await prisma.classroomTeacher.deleteMany()
    await prisma.classroom.deleteMany()
    await prisma.user.deleteMany()

    console.log('All data has been cleared from the database')
  } catch (error) {
    console.error('Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllData()