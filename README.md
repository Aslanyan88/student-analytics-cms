# Student Analytics & Class Management System

A full-stack web application for managing classes and student analytics, built with Next.js, Express, Prisma, and MySQL.

## Features

- 🔐 **Role-Based Access Control** (Admin, Teacher, Student)
- 📊 **Analytics Dashboard** for each user role
- 📝 **Assignment Management** (create, assign, grade)
- 📅 **Attendance Tracking** with calendar UI
- 👥 **Classroom Management**
- 📱 **Responsive Design** for all devices
- 📧 **Email Notifications** for important events

## Tech Stack

### Frontend
- **Next.js 13** with App Router
- **TypeScript**
- **Shadcn/UI** components
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Chart.js** for analytics visualizations
- **React Beautiful DnD** 

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** for database access
- **MySQL** database
- **JWT** for authentication
- **Nodemailer** for email notifications


### Prerequisites

- Node.js (v18 or later)
- MySQL database
- Yarn (optional, but recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd student-system
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and update the values

4. Set up the database:
   ```bash
   yarn db:generate
   yarn db:push
   ```

5. Start the development servers:
   ```bash
   yarn dev
   ```

### Development Workflow

- Frontend development server runs on `http://localhost:3000`
- Backend API server runs on `http://localhost:3001`

## API Reference

The backend provides the following API endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Classrooms

- `GET /api/classrooms` - Get all classrooms
- `GET /api/classrooms/:id` - Get a specific classroom
- `POST /api/classrooms` - Create a new classroom
- `PUT /api/classrooms/:id` - Update a classroom
- `DELETE /api/classrooms/:id` - Delete a classroom
- `POST /api/classrooms/:id/teachers` - Add a teacher to a classroom
- `POST /api/classrooms/:id/students` - Add a student to a classroom

### Assignments

- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get a specific assignment
- `POST /api/assignments` - Create a new assignment
- `PUT /api/assignments/:id` - Update an assignment
- `DELETE /api/assignments/:id` - Delete an assignment
- `POST /api/assignments/:id/submit` - Submit an assignment (student)
- `PUT /api/assignments/:id/grade` - Grade an assignment (teacher)

### Activity Logs

- `GET /api/activity-logs` - Get all activity logs
- `POST /api/activity-logs` - Create a new activity log
- `GET /api/activity-logs/attendance` - Get attendance records
- `POST /api/activity-logs/attendance` - Log attendance

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id` - Mark notification as read
- `POST /api/notifications` - Create a notification

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (admin only)

## Deployment

The application can be deployed using various methods:

### Traditional Deployment

1. Build the applications:
   ```bash
   yarn build
   ```

2. Start the production servers:
   ```bash
   yarn start
   ```

## Architecture Design

The system follows a microservices-inspired architecture with separate frontend and backend applications that communicate through REST APIs. The database layer is managed through Prisma ORM to provide type safety and migrations.

### Data Flow

1. Client makes a request to the Next.js frontend
2. Frontend communicates with the backend API
3. Backend handles authentication, business logic, and data access
4. Prisma ORM communicates with the MySQL database
5. Data flows back through the same layers to the client

## Testing

Run tests with:

```bash
yarn test
```

The project includes:
- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user flows

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request
4. Wait for review and approval

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

Not full wrriten the README.md
