import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const apiKey = process.env.LASTFM_API_KEY;
  const username = process.env.LASTFM_USERNAME;

  if (!apiKey || !username) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing API credentials' }),
    };
  }

  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${apiKey}&format=json&period=1month&limit=1`
    );

    const data = await response.json();
    
    if (!data.toptracks || !data.toptracks.track || data.toptracks.track.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No tracks found' }),
      };
    }

    const topTrack = data.toptracks.track[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        name: topTrack.name,
        artist: topTrack.artist.name,
        url: topTrack.url,
      }),
    };
  } catch (error) {
    console.error('Error fetching top track:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch top track' }),
    };
  }
};

