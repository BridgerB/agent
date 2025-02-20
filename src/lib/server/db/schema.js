// src/lib/server/db/schema.js
import { pgTable, serial, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	age: integer('age')
});
