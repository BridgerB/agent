import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	firebaseUid: text('firebase_uid').notNull().unique(),
	email: text('email').notNull(),
	displayName: text('display_name'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const integration = pgTable('integration', {
	id: serial('id').primaryKey(),
	userId: serial('user_id')
		.references(() => user.id)
		.notNull(),
	type: text('type').notNull(),
	username: text('username').notNull(),
	password: text('password').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
