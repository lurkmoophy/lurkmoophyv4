import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const username = 'lurkmoophy';
  const rssUrl = `https://letterboxd.com/${username}/rss/`;

  try {
    const response = await fetch(rssUrl);
    const rssText = await response.text();

    // Parse the RSS XML to get the most recent item
    const itemMatch = rssText.match(/<item>([\s\S]*?)<\/item>/);
    const item = itemMatch ? itemMatch[1] : null;

    if (!item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No recent film found' }),
      };
    }

    // Extract the film title - try multiple patterns
    let titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    if (!titleMatch) {
      // Try without CDATA
      titleMatch = item.match(/<title>(.*?)<\/title>/);
    }

    const rawTitle = titleMatch ? titleMatch[1] : 'No recent film';

    // Clean up the title (removes your username and "watched/reviewed")
    const filmTitle = rawTitle.replace(/^.*?(watched|reviewed)\s+/, '');

    // Get the link to the film
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const filmLink = linkMatch ? linkMatch[1] : '#';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        title: filmTitle,
        link: filmLink,
      }),
    };
  } catch (error) {
    console.error('Error fetching recent film:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch recent film' }),
    };
  }
};

