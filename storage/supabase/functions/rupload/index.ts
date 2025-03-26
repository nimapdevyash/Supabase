import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  try {
    // Validate content type
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Parse form-data request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucketName = formData.get("bucketName") as string;
    const fileName = formData.get("fileName") as string;

    if (!file || !bucketName || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Convert File to Uint8Array (Deno-compatible)
    const fileBuffer = new Uint8Array(await file.arrayBuffer());

    // Supabase client setup
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true, // Overwrite if file exists
      });

    if (error) {
      console.error("Upload failed:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("Upload successful:", data);
    return new Response(
      JSON.stringify({ message: "Upload complete", url: data.path }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
