import { db } from '$lib/server/db';
import { integration, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { encrypt } from '$lib/server/crypto';
import type { Actions, PageServerLoad } from './$types';

const getOrCreateUser = async (firebaseUser: { uid: string; email: string; name: string }) => {
	const [existing] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.firebaseUid, firebaseUser.uid))
		.limit(1);

	if (existing) return existing.id;

	const [created] = await db
		.insert(user)
		.values({
			firebaseUid: firebaseUser.uid,
			email: firebaseUser.email,
			displayName: firebaseUser.name
		})
		.returning({ id: user.id });

	return created.id;
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { integrations: [], about: '' };

	const userId = await getOrCreateUser(locals.user);

	const [profile] = await db
		.select({ about: user.about })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	const integrations = await db
		.select({
			id: integration.id,
			type: integration.type,
			username: integration.username,
			createdAt: integration.createdAt
		})
		.from(integration)
		.where(eq(integration.userId, userId));

	return { integrations, about: profile?.about ?? '' };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Sign in to connect integrations' });

		const userId = await getOrCreateUser(locals.user);
		const data = await request.formData();
		const type = data.get('type') as string;
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!type || !username || !password) {
			return fail(400, { error: 'All fields are required' });
		}

		if (!['slack', 'jira', 'github'].includes(type)) {
			return fail(400, { error: 'Invalid integration type' });
		}

		await db
			.delete(integration)
			.where(and(eq(integration.userId, userId), eq(integration.type, type)));

		await db.insert(integration).values({
			userId,
			type,
			username,
			password: encrypt(password)
		});

		return { success: true, type };
	},

	updateAbout: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Sign in to save' });

		const userId = await getOrCreateUser(locals.user);
		const data = await request.formData();
		const about = data.get('about') as string;

		await db.update(user).set({ about }).where(eq(user.id, userId));

		return { aboutSaved: true };
	},

	remove: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Sign in to manage integrations' });

		const userId = await getOrCreateUser(locals.user);
		const data = await request.formData();
		const id = Number(data.get('id'));

		if (!id) {
			return fail(400, { error: 'Invalid integration ID' });
		}

		await db.delete(integration).where(and(eq(integration.id, id), eq(integration.userId, userId)));

		return { removed: true };
	}
};
