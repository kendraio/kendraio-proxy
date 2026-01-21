/**
 * Worker script to proxy requests to Backblaze B2 with CORS 
 * headers and key from environment variables, to sign URLs.
 * Compatible with Cloudflare Workers.
 * See https://developers.cloudflare.com/workers/
 */

const handleFetchError = (error, message, corsHeaders) => {
  console.error(`${message}: ${error.message}`);
  return new Response(`${message}`, { 
    status: 500,
    headers: corsHeaders 
  });
};

const safeFetch = async (url, options, errorMessage, corsHeaders) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`${errorMessage} failed with status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://app.kendra.io',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Return response if no path is specified
    if (url.pathname === "/" || !url.pathname) {
      return new Response("The proxy server is active. This is the root path. Note: To access a file resource, append the filename to the path.", {
        headers: { 
          "content-type": "text/plain",
          ...corsHeaders
        },
      });
    }

    const fileName = url.pathname.split("/").pop();

    // Get configuration from environment variables
    const B2_APPLICATION_KEY_ID = env.B2_APPLICATION_KEY_ID;
    const B2_APPLICATION_KEY = env.B2_APPLICATION_KEY;
    const B2_BUCKET_ID = env.B2_BUCKET_ID;
    const B2_BUCKET_NAME = env.B2_BUCKET_NAME;

    console.log(`Processing request for file: ${fileName}`);
    console.log(`Using bucket: ${B2_BUCKET_NAME} (${B2_BUCKET_ID})`);

    try {
      // Step 1: Authorise with Backblaze B2
      const authResponse = await safeFetch(
        'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
        {
          headers: {
            Authorization: 'Basic ' + btoa(B2_APPLICATION_KEY_ID + ':' + B2_APPLICATION_KEY),
          }
        },
        'B2 authorization',
        corsHeaders
      );
      console.log('B2 authorisation successful');
      
      const authData = await authResponse.json();
      const apiUrl = authData.apiUrl;

      // Step 2: Get Download Authorisation
      const downloadAuthorisation = await safeFetch(
        `${apiUrl}/b2api/v2/b2_get_download_authorization`,
        {
          method: 'POST',
          headers: {
            Authorization: authData.authorizationToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucketId: B2_BUCKET_ID,
            fileNamePrefix: fileName,
            validDurationInSeconds: 360000,
          }),
        },
        'Download authorization',
        corsHeaders
      );
      console.log('Download authorisation successful');

      const signedUrlData = await downloadAuthorisation.json();
      
      const b2DownloadEndpoint = authData.downloadUrl;
      const downloadAuthToken = signedUrlData.authorizationToken;
      const downloadUrl = `${b2DownloadEndpoint}/file/${B2_BUCKET_NAME}/${fileName}?Authorization=${downloadAuthToken}`;

      // Step 3: Fetch the content from signed URL
      console.log(`Fetching content from signed URL for: ${fileName}`);
      const fileResponse = await safeFetch(
        downloadUrl,
        {},
        'File content fetch',
        corsHeaders
      );

      // Return the file content with original headers plus CORS
      const responseHeaders = new Headers(fileResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(fileResponse.body, {
        status: 200,
        headers: responseHeaders
      });

    } catch (error) {
      return handleFetchError(error, error.message || 'Error processing request', corsHeaders);
    }
  }
};
