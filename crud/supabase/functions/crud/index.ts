// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const todos: { id: number; task: string }[] = [];
let id = 0;

Deno.serve(async (req) => {
  const body = await req.json().catch(() => null);

  switch (req.method) {
    case "POST": {
      const task : string = body.task;

      const todo = { id: ++id, task };

      todos.push(todo);


      return new Response(
        JSON.stringify({
          message: "task added successfully",
          todo: todos,
        })
      );
    }
    case "GET": {
      const id = Number(new URL(req.url).pathname.split("/")[2]);

      const todo = todos.find((todo) => todo.id === id);

      return new Response(
        JSON.stringify({
          message: "todo fetched successfully",
          todo : todos
        })
      );
    }

    case "PUT": {
      const id = Number(body.id);
      const task = body.task;

      const todoIndex = todos.findIndex((todo) => todo.id === id);

      todos[todoIndex] = { id, task };

      return new Response(
        JSON.stringify({
          message: "todo updated successfully",
          todo: todos[todoIndex],
        })
      );
    }
    case "DELETE": {
      const id = Number(new URL(req.url).pathname.split("/")[1]);

      const todoIndex = todos.findIndex((todo) => todo.id === id);

      todos.splice(todoIndex, 1);

      return new Response(
        JSON.stringify({
          message: "todo deleted successfully",
        })
      );
    }

    default: {
      return new Response(
        JSON.stringify({
          message: "method is not valid",
        })
      );
    }
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/crud' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
