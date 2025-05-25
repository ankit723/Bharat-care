# Bharat Care API Server

A modular Express.js API server with TypeScript and Prisma for the Bharat Care application.

## Features

- RESTful API endpoints for doctors, patients, hospitals, and reviews
- PostgreSQL database with Prisma ORM
- TypeScript for type safety
- Modular architecture with controllers, routes, and middleware

## Project Structure

```
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── prisma/         # Prisma schema and migrations
├── routes/         # API routes
├── types/          # TypeScript types/interfaces
├── utils/          # Utility functions
├── index.ts        # Main application file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/bharatcare?schema=public"
   DIRECT_URL="postgresql://username:password@localhost:5432/bharatcare?schema=public"
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-secret-key
   ```
4. Generate Prisma client:
   ```
   npx prisma generate
   ```
5. Run migrations:
   ```
   npx prisma migrate dev
   ```

### Development

Run the server in development mode:
```
npm run dev
```

### Production

Build the project:
```
npm run build
```

Start the server:
```
npm start
```

## API Endpoints

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create new hospital
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create new review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review 