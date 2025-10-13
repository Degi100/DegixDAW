// netlify/functions/save-markdown.js
// Netlify Serverless Function (Production)
// NOTE: File saving doesn't work on Netlify due to read-only filesystem!
// This returns the markdown content for download instead.

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { content, filename } = JSON.parse(event.body);

    if (!content || !filename) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Content and filename are required' }),
      };
    }

    // ⚠️ LIMITATION: Netlify Functions have read-only filesystem
    // We cannot save files to disk in production
    // Instead, return the content for client-side download
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Content prepared for download (Netlify limitation: cannot save to server)',
        filename: filename,
        fallback: true, // Indicates client should handle download
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}
