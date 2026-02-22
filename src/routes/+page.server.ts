import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
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
	if (!locals.user) throw redirect(302, '/login');

	const userId = await getOrCreateUser(locals.user);

	const [profile] = await db
		.select({ important: user.important })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	return { important: profile?.important ?? '' };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const userId = await getOrCreateUser(locals.user);
		const data = await request.formData();
		const important = data.get('important') as string;

		await db.update(user).set({ important }).where(eq(user.id, userId));

		return { profileSaved: true };
	}
};
