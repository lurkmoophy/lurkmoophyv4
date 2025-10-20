// netlify/functions/top-track.ts
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';

// Define types for Last.fm API response
interface LastFmImage {
  size: string;
  '#text': string;
}

interface LastFmArtist {
  name: string;
  url: string;
}

interface LastFmTrack {
  name: string;
  artist: LastFmArtist;
  url: string;
  playcount: string;
  image: LastFmImage[];
}

interface LastFmTopTracks {
  track: LastFmTrack[];
}

interface LastFmResponse {
  toptracks?: LastFmTopTracks;
  error?: number;
  message?: string;
}

interface TrackResponse {
  name: string;
  artist: string;
  url: string;
  playcount: number;
  image: string | null;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    const user = event.queryStringParameters?.user || process.env.LASTFM_USERNAME;

    if (!apiKey || !user) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Missing LASTFM_API_KEY or user parameter',
          required: ['LASTFM_API_KEY', 'user (query param or LASTFM_USERNAME env var)']
        })
      };
    }

    // user.getTopTracks with period=1month, limit=1
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'user.getTopTracks');
    url.searchParams.set('user', user);
    url.searchParams.set('period', '1month'); // 30 days rolling
    url.searchParams.set('limit', '1');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('format', 'json');

    const resp = await fetch(url.toString(), { 
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Netlify-Function/1.0'
      } 
    });

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: `Last.fm API error: ${resp.status} ${resp.statusText}` 
        })
      };
    }

    const data: LastFmResponse = await resp.json();

    // Check for Last.fm API errors
    if (data.error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: `Last.fm API error: ${data.message || 'Unknown error'}`,
          code: data.error
        })
      };
    }

    const item = data?.toptracks?.track?.[0];
    if (!item) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300, s-maxage=300'
        },
        body: JSON.stringify({ track: null })
      };
    }

    // Normalize what you need on the frontend
    const track: TrackResponse = {
      name: item.name,
      artist: item.artist?.name || 'Unknown Artist',
      url: item.url,
      playcount: Number(item.playcount ?? 0),
      image: (item.image || []).find((i: LastFmImage) => i.size === 'extralarge')?.['#text'] ||
             (item.image || []).find((i: LastFmImage) => i.size === 'large')?.['#text'] ||
             (item.image || []).at(-1)?.['#text'] || null,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=0, s-maxage=3600'
      },
      body: JSON.stringify({ track })
    };
  } catch (error) {
    console.error('Top track function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
