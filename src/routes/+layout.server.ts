import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_ROUTES = ['/login', '/api/auth'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isPublicRoute = PUBLIC_ROUTES.some((route) => url.pathname.startsWith(route));

	if (!locals.user && !isPublicRoute) {
		throw redirect(302, '/login');
	}

	return { user: locals.user ?? null };
};
