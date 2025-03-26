import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as tus from "https://esm.sh/tus-js-client@3.0.1";

Deno.serve(async (req) => {
  try {
    // 1. Validate request
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucketName = formData.get("bucketName") as string;
    const fileName = formData.get("fileName") as string;
    const contentType = formData.get("contentType") as string || file.type;
    const cacheControl = formData.get("cacheControl") as string || "3600";

    if (!file || !bucketName || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { "Content-Type": "application/json" }, status: 400 },
      );
    }

    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type,
    });

    // 5. Configure tus upload
    return new Promise((resolve) => {
      const upload = new tus.Upload(blob, {
        endpoint: `${Deno.env.get("SUPABASE_URL")}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "x-upsert": "true",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName,
          objectName: fileName,
          contentType,
          cacheControl,
        },
        chunkSize: 6 * 1024 * 1024, // Must be 6MB for Supabase
        onError: (error) => {
          console.error("Upload failed:", error);
          resolve(
            new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            ),
          );
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          console.log(`Upload progress: ${percentage}%`);
        },
        onSuccess: () => {
          console.log("Upload complete!");
          const publicUrl = `${
            Deno.env.get("SUPABASE_URL")
          }/storage/v1/object/public/${bucketName}/${fileName}`;
          resolve(
            new Response(
              JSON.stringify({
                message: "Upload complete",
                path: `${bucketName}/${fileName}`,
                publicUrl,
              }),
              { headers: { "Content-Type": "application/json" } },
            ),
          );
        },
      });

      // Check for previous uploads to resume
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      }).catch((error) => {
        console.error("Error finding previous uploads:", error);
        upload.start(); // Start fresh upload if resume check fails
      });
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
