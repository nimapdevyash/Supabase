// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req): Promise<any> => {
  try {
    // Use Service Role Key to get admin access
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Required for admin operations
    );

    // Step 1: List all files in the bucket
    const { data: buckets, error } = await client.storage.listBuckets();

    if (error) throw error;

    if (buckets.length === 0) {
      return new Response(
        JSON.stringify({
          status: "success",
          message: "there are no buckets as of now",
        }),
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        buckets,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.log("Error:", error);
    return new Response(JSON.stringify({ status: "failed", error }), {
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/listBuckets' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
