import type { Handler } from '@netlify/functions';

const GOODREADS_RSS_URL = 'https://www.goodreads.com/review/list_rss/37026357';

type RecentBookResponse =
	| {
			title: string;
			rating: number | null;
			url: string;
	  }
	| {
			error: string;
	  };

function extractFirstBookFromRss(xml: string): { title: string; rating: number | null; url: string } | null {
	const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
	if (!itemMatch) return null;

	const item = itemMatch[1];

	// Title (book title)
	let title = 'Unknown book';
	const titleCdataMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
	const titlePlainMatch = !titleCdataMatch ? item.match(/<title>([^<]+)<\/title>/) : null;
	if (titleCdataMatch && titleCdataMatch[1]) {
		title = titleCdataMatch[1].trim();
	} else if (titlePlainMatch && titlePlainMatch[1]) {
		title = titlePlainMatch[1].trim();
	}

	// Rating (user_rating)
	let rating: number | null = null;
	const ratingMatch = item.match(/<user_rating>(\d+)<\/user_rating>/);
	if (ratingMatch && ratingMatch[1]) {
		const parsed = parseInt(ratingMatch[1], 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			rating = parsed;
		}
	}

	// Book URL: build from <book_id>
	let url = '#';
	const bookIdMatch = item.match(/<book_id>(\d+)<\/book_id>/);
	if (bookIdMatch && bookIdMatch[1]) {
		url = `https://www.goodreads.com/book/show/${bookIdMatch[1]}`;
	} else {
		// Fallback: use review link
		const linkMatch = item.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/);
		if (linkMatch && linkMatch[1]) {
			url = linkMatch[1].trim();
		}
	}

	return { title, rating, url };
}

export const handler: Handler<RecentBookResponse> = async () => {
	try {
		const response = await fetch(GOODREADS_RSS_URL, {
			headers: {
				accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
				'user-agent':
					'Mozilla/5.0 (compatible; lurkmoophy-site-bot/1.0; +https://lurkmoophy.com/)',
			},
		});

		if (!response.ok) {
			return {
				statusCode: response.status,
				body: JSON.stringify({ error: 'Failed to fetch Goodreads RSS' }),
			};
		}

		const xml = await response.text();
		const book = extractFirstBookFromRss(xml);

		if (!book) {
			return {
				statusCode: 404,
				body: JSON.stringify({ error: 'No recent book found' }),
			};
		}

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
			body: JSON.stringify(book),
		};
	} catch (error) {
		console.error('Error fetching recent book from Goodreads:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to fetch recent book' }),
		};
	}
};

