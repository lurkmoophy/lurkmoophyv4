import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { fetchRecentBook, STORE_KEY, STORE_NAME } from '../lib/recent-book';

// Checks StoryGraph once a week and saves the latest book for the recent-book endpoint.
// If StoryGraph is down or blocks the request, the previously saved book stays in place.
export default async () => {
	try {
		const book = await fetchRecentBook();
		await getStore(STORE_NAME).setJSON(STORE_KEY, book);
		console.log(`Saved recent book: ${book.title}`);
	} catch (error) {
		console.error('Error updating recent book from StoryGraph:', error);
	}
};

// Mondays at 9am UTC
export const config: Config = {
	schedule: '0 9 * * 1',
};
