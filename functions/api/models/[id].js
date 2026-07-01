import { deleteModel, getModel } from "../../_lib/db.js";
import { handleErrors, json, methodNotAllowed } from "../../_lib/http.js";

export function onRequestGet({ env, params }) {
  return handleErrors(async () => json({ model: await getModel(env.DB, params.id) }));
}

export function onRequestDelete({ env, params }) {
  return handleErrors(async () => {
    await deleteModel(env.DB, params.id);
    return new Response(null, { status: 204 });
  });
}

export function onRequest() { return methodNotAllowed(); }
