// Shared between the weekly update-recent-book job and the recent-book endpoint.
// StoryGraph has no API or RSS, so we read the public "books read" page, which
// is sorted by latest read by default.

const STORYGRAPH_USERNAME = 'lurkmoophy';
const STORYGRAPH_URL = 'https://app.thestorygraph.com';

export const STORE_NAME = 'recent-book';
export const STORE_KEY = 'latest';

export type RecentBook = {
	title: string;
	rating: number | null;
	url: string;
	checkedAt: string;
};

function decodeEntities(text: string): string {
	return text
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
		.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

export function extractFirstBook(html: string): Omit<RecentBook, 'checkedAt'> | null {
	// Each book on the page is a pane with id="book_<uuid>"
	const paneMatches = [...html.matchAll(/id="book_([0-9a-f-]{36})"/g)];
	if (paneMatches.length === 0) return null;

	const bookId = paneMatches[0][1];
	const paneStart = paneMatches[0].index ?? 0;
	const paneEnd = paneMatches[1]?.index ?? html.length;
	const pane = html.slice(paneStart, paneEnd);

	const titleMatch = pane.match(new RegExp(`<a href="/books/${bookId}">([^<]+)</a>`));
	if (!titleMatch) return null;

	// My rating sits in a span right before the link to my review (quarter stars, e.g. 4.25)
	let rating: number | null = null;
	const ratingMatch = pane.match(/<span[^>]*>(\d+(?:\.\d+)?)<\/span>\s*<a[^>]*href="\/reviews\//);
	if (ratingMatch) {
		const parsed = parseFloat(ratingMatch[1]);
		if (!Number.isNaN(parsed) && parsed > 0) {
			rating = parsed;
		}
	}

	return {
		title: decodeEntities(titleMatch[1]).trim(),
		rating,
		url: `${STORYGRAPH_URL}/books/${bookId}`,
	};
}

export async function fetchRecentBook(): Promise<RecentBook> {
	const response = await fetch(`${STORYGRAPH_URL}/books-read/${STORYGRAPH_USERNAME}`, {
		headers: {
			accept: 'text/html,application/xhtml+xml',
			'user-agent': 'Mozilla/5.0 (compatible; lurkmoophy-site-bot/1.0; +https://lurkmoophy.com/)',
		},
	});

	if (!response.ok) {
		throw new Error(`StoryGraph responded with ${response.status}`);
	}

	const book = extractFirstBook(await response.text());
	if (!book) {
		throw new Error('Could not find a book on the StoryGraph page');
	}

	return { ...book, checkedAt: new Date().toISOString() };
}
