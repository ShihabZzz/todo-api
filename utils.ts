import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./connection";
import { usersTable, todosTable } from "./src/db/schema";

export const findUser = async (user: string) => {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.user, user))
    .get();
};

export const findByTodoID = async (id: string) => {
  return await db.select().from(todosTable).where(eq(todosTable.id, id)).get();
};

export const hasInvalidkeys = (bodyKeys: string[]) => {
  return bodyKeys.some((key) => {
    return key !== "title" && key !== "status";
  });
};

export const titleValidation = z
  .string({ required_error: "title is required" })
  .min(3, { message: "title must be at least 3 characters" })
  .max(100, { message: "title must not exceed 100 characters" })
  .refine((title) => title.trim() !== "" && isNaN(Number(title)), {
    message: "title must be valid string type",
  });

export const statusValidation = z
  .string()
  .min(3, { message: "status must be at least 3 characters" })
  .max(50, { message: "status must not exceed 50 characters" })
  .refine((status) => status.trim() !== "", {
    message: "status must be valid string type",
  })
  .optional();
