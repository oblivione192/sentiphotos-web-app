# Sentiphotos

Sentiphotos is not just another image storage application. It is a private memory capsule built for the moments that deserve more than a label in a phone gallery.

The app helps users preserve photos as personal reflections: memories they can revisit, relive, and feel again. It is designed around the emotional weight of a picture, not just the file behind it. Your memories stay personal, and they stay secured. Only you should be able to see them, because keeping them private is your right.

Reminisce. Relive. Feel it.

## Technology Stack

Sentiphotos is built with:

- React 19
- TypeScript
- Vite with Rolldown
- React Router
- Zustand
- Axios
- Express 5
- Firebase Admin and Firestore
- AWS S3
- Vitest
- ESLint
- Prettier

## Development Setup

### Prerequisites

Install the following before running the project:

- Node.js 22.x
- npm
- An AWS account with an S3 bucket
- A Firebase project with a service account JSON file

The backend expects Node `>= 22.11 < 23`. This project uses Node `22.12.0` through Volta in the backend configuration.

### Install Dependencies

From the repository root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd backend-new
npm install
```

### Configure Backend Environment

Create a backend environment file at:

```text
backend-new/.env.development
```

Add the required values:

```env
AWS_REGION=
AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
FIRESTORE_SERVICE_ACCOUNT_PATH=
JWT=
```

`FIRESTORE_SERVICE_ACCOUNT_PATH` should point to your Firebase service account JSON file. 

You should get the json file from firebase that stores your credentials. Make sure to not commit it. You can view the documentation here 
https://firebase.google.com/docs/admin/setup  

### Run the App

Start the backend from the repository root:

```bash
npm run start:backend
```

Start the frontend from the repository root in a second terminal:

```bash
npm run start:frontend
```

You can also run each side directly.

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend-new
npm run dev
```

### Build Commands

Build the frontend:

```bash
cd frontend
npm run build
```

Build the backend:

```bash
cd backend-new
npm run build
```

### Lint Commands

Lint the frontend:

```bash
cd frontend
npm run lint
```

Lint the backend:

```bash
cd backend-new
npm run lint
```

### Test Commands

Run backend unit tests:

```bash
cd backend-new
npm test
```

Run backend integration tests:

```bash
cd backend-new
npm run test:integration
```

Run backend coverage:

```bash
cd backend-new
npm run test:coverage
```

Run backend tests from the repository root:

```bash
npm run test:backend
```

Run frontend Vitest tests explicitly:

```bash
cd frontend
npx vitest run tests
```

Run a specific frontend test file:

```bash
cd frontend
npx vitest run tests/unit-test/LoginRegistrationProcedureTest.test.ts
```

Note: the frontend currently has test files, but `frontend/package.json` does not define an `npm test` script.
