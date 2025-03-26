// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Parse FormData instead of JSON
    const formData = await req.formData();
    const bucketName = formData.get("bucketName") as string;
    const folderPath = formData.get("folderPath") as string;
    const overwrite = formData.get("overwrite") === "true"; // Convert string to boolean
    const file = formData.get("file") as File; // Get file from request

    if (!bucketName || !folderPath || !file) {
      throw new Error(
        "Missing required parameters (bucketName, folderPath, file)",
      );
    }

    // Upload file to Supabase storage
    const { data, error } = await client.storage.from(bucketName).upload(
      `${folderPath}/${file.name}`,
      file,
      { upsert: overwrite },
    );

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ status: "success", data }));
  } catch (error: any) {
    console.log("Upload Error:", error);

    return new Response(
      JSON.stringify({
        status: "failed",
        error: error?.message || error,
      }),
      { status: 500 },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
