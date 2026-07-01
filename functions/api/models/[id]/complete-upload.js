import { ApsClient } from "../../../_lib/aps.js";
import { completeModel, getModel } from "../../../_lib/db.js";
import { handleErrors, json, methodNotAllowed } from "../../../_lib/http.js";

export function onRequestPost({ env, params }) {
  return handleErrors(async () => {
    const model = await getModel(env.DB, params.id);
    const aps = new ApsClient(env);
    const upload = await aps.completeSignedUpload(model.objectName, model.uploadKey);
    const urn = aps.toUrn(upload.objectId);
    await aps.translate(urn);
    return json({ model: await completeModel(env.DB, model.id, { objectId: upload.objectId, urn }) });
  });
}

export function onRequest() { return methodNotAllowed(); }
