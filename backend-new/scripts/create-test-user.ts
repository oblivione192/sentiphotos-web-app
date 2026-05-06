import dotenv from 'dotenv';
import { UserLoginController } from '../src/Controllers/Auth/UserLoginController.js';
import { Errors } from '../src/Constants.js';

dotenv.config();

const username = process.env.TEST_USER_USERNAME || 'testuser';
const password = process.env.TEST_USER_PASSWORD || 'Password123!';
const email = process.env.TEST_USER_EMAIL || 'testuser@example.com';

async function main(): Promise<void> {
  try {
    await UserLoginController.registerUser(username, password, email);
    console.log(`Test user created successfully:`);
    console.log(`  username: ${username}`);
    console.log(`  email: ${email}`);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === Errors.USER_ALREADY_EXISTS) {
      console.log(`Test user already exists: ${username}`);
      return;
    }
    console.error('Failed to create test user:', error.message || error);
    process.exit(1);
  }
}

main();
