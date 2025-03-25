// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createClient,
  RealtimeChannel,
} from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function sendMessage(
  channel: RealtimeChannel,
  message: string,
): Promise<any> {
  return await channel.send({
    type: "broadcast",
    event: "message",
    payload: { message },
  });
}

Deno.serve(async (req): Promise<any> => {
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const group_chat_channel = client.channel("broadcast_channel", {
      config: {
        broadcast: {
          self: false,
          ack: false,
        },
      },
    });

    await group_chat_channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        console.error("Failed to subscribe to the channel");
      }
    });

    const { message } = await req.json();

    await sendMessage(group_chat_channel, message);

    return new Response(
      JSON.stringify({
        status: "success",
      }),
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({
        status: "failed",
        error,
      }),
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/broadcaster' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
