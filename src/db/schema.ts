import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  user: text().notNull().primaryKey(),
});

export const todosTable = sqliteTable("todos", {
  id: text().notNull().primaryKey(),
  title: text().notNull(),
  status: text().notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
  user: text().notNull(),
});
