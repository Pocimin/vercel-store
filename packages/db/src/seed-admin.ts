import { UserRole } from "@prisma/client";
import { hashPassword } from "@nznt/auth";
import { db } from "./index.js";

const email = process.env.ADMIN_EMAIL;
const username = process.env.ADMIN_USERNAME ?? "owner";
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  process.exit(1);
}

const user = await db.user.upsert({
  where: { email: email.toLowerCase() },
  update: {
    role: UserRole.OWNER,
    passwordHash: await hashPassword(password)
  },
  create: {
    email: email.toLowerCase(),
    username,
    role: UserRole.OWNER,
    passwordHash: await hashPassword(password)
  }
});

console.log(`Admin ready: ${user.email}`);
await db.$disconnect();
