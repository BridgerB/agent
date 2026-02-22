import type { Handle } from '@sveltejs/kit';
import { verifySessionCookie } from '$lib/server/firebase';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');
	if (!sessionCookie) return resolve(event);

	const decodedToken = await verifySessionCookie(sessionCookie);
	if (!decodedToken) {
		event.cookies.delete('session', { path: '/' });
		return resolve(event);
	}

	event.locals.user = {
		uid: decodedToken.uid,
		email: decodedToken.email ?? '',
		name: decodedToken.name ?? '',
		picture: decodedToken.picture ?? ''
	};

	return resolve(event);
};
