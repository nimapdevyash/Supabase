import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

Deno.serve(async (req) => {
  const body = await req.json().catch(() => null);
  const url = new URL(req.url);
  const method = req.method;

  switch (method) {
    case "POST": {
      if (!body?.task) {
        return new Response(JSON.stringify({ message: "Task is required" }), {
          status: 400,
        });
      }

      const { data, error } = await supabase
        .from("todos")
        .insert([{ task: body.task }])
        .select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(
        JSON.stringify({ message: "Task added successfully", todo: data }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    case "GET": {
      const id = url.pathname.split("/")[2];

      if (id) {
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
          });
        }
        return new Response(
          JSON.stringify({ message: "Todo fetched", todo: data })
        );
      }

      const { data, error } = await supabase.from("todos").select("*");

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(JSON.stringify({ todos: data }));
    }

    case "PUT": {
      if (!body?.id || !body?.task) {
        return new Response(
          JSON.stringify({ message: "ID and Task are required" }),
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("todos")
        .update({ task: body.task })
        .eq("id", body.id)
        .select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(
        JSON.stringify({ message: "Task updated successfully", todo: data })
      );
    }

    case "DELETE": {
      const id = url.pathname.split("/")[2];

      if (!id) {
        return new Response(JSON.stringify({ message: "ID is required" }), {
          status: 400,
        });
      }

      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      return new Response(
        JSON.stringify({ message: "Task deleted successfully" })
      );
    }

    default:
      return new Response(JSON.stringify({ message: "Invalid method" }), {
        status: 405,
      });
  }
});
