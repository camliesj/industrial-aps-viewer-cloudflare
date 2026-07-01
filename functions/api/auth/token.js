import { ApsClient } from "../../_lib/aps.js";
import { handleErrors, json, methodNotAllowed } from "../../_lib/http.js";

export function onRequestGet({ env }) {
  return handleErrors(async () => json(await new ApsClient(env).getViewerToken()));
}

export function onRequest() { return methodNotAllowed(); }
