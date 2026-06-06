import { getCurrentUser } from "../features/auth/api";

async function testAuth() {
  try {
    const user = await getCurrentUser();
    console.log(user);
  } catch (error) {
    console.log(error);
  }
}

testAuth();