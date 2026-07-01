import { ApsClient } from "../../../_lib/aps.js";
import { getModel, updateModelStatus } from "../../../_lib/db.js";
import { badRequest, handleErrors, json, methodNotAllowed } from "../../../_lib/http.js";

export function onRequestGet({ env, params }) {
  return handleErrors(async () => {
    const model = await getModel(env.DB, params.id);
    if (!model.urn) return badRequest("Model upload has not been completed");
    const manifest = await new ApsClient(env).getManifest(model.urn);
    const updated = await updateModelStatus(env.DB, model.id, {
      status: manifest.status || "unknown",
      progress: manifest.progress || model.progress || "0%",
      manifest
    });
    return json({ model: updated, manifest });
  });
}

export function onRequest() { return methodNotAllowed(); }
