// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req): Promise<any> => {
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const broadcastChannel = client.channel("broadcast_channel");
    const presenceChannel = client.channel("presence_channel");
    const postgresChangesChannel = client.channel(
      "postgres_changes_channel",
    );

    await broadcastChannel.subscribe();
    await presenceChannel.subscribe();

    broadcastChannel.on("broadcast", { event: "*" }, (payload) => {
      console.log("Broadcast ==> ", payload);
    });

    presenceChannel.on(
      "presence",
      { event: "*" },
      (payload: any): undefined => {
        console.log("Presence ==> ", payload);
      },
    );

    postgresChangesChannel.on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "*",
    }, (payload) => {
      console.log("postgres_changes ==> ", payload);
    }).subscribe();
  } catch (error) {
    console.log("error in listner : ", error);
    return new Response(JSON.stringify({
      status: "failed",
      error,
    }));
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/listner' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
