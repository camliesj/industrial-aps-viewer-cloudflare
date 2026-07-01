import { ApsClient } from "../../../_lib/aps.js";
import { getModel } from "../../../_lib/db.js";
import { handleErrors, methodNotAllowed } from "../../../_lib/http.js";

export function onRequestGet({ env, params, request }) {
  return handleErrors(async () => {
    const model = await getModel(env.DB, params.id);
    if (!model.urn) {
      const error = new Error("Model upload has not been completed");
      error.status = 400;
      throw error;
    }

    const url = new URL(request.url);
    const image = await new ApsClient(env).getThumbnail(model.urn, url.searchParams.get("size"));
    return new Response(image.body, {
      headers: {
        "Content-Type": image.contentType || "image/png",
        "Cache-Control": "public, max-age=300"
      }
    });
  });
}

export function onRequest() { return methodNotAllowed(); }
