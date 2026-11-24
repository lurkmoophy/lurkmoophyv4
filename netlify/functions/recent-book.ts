import { getStore } from '@netlify/blobs';
import { STORE_KEY, STORE_NAME, type RecentBook } from '../lib/recent-book';

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

// Serves the book saved by the weekly update-recent-book job. Never calls StoryGraph itself.
export default async () => {
	try {
		const book = (await getStore(STORE_NAME).get(STORE_KEY, { type: 'json' })) as RecentBook | null;

		if (!book) {
			return json({ error: 'No recent book found' }, 404);
		}

		return json(book);
	} catch (error) {
		console.error('Error reading recent book:', error);
		return json({ error: 'Failed to fetch recent book' }, 500);
	}
};
