// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req): Promise<any> => {
  try {
    // Use the Service Role Key (more powerful than anon key)
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Required for admin operations
    );

    // Bucket name (can be dynamic)
    const { bucketName, isPublic }: { bucketName: string; isPublic: boolean } =
      await req.json();

    // Create the bucket
    const { data, error } = await client.storage.createBucket(bucketName, {
      public: isPublic,
    });

    if (error) throw error;

    console.log("Bucket Created:", data);
    return new Response(JSON.stringify({ status: "success", data }), {
      status: 200,
    });
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/createBucket' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
