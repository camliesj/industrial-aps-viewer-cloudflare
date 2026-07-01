import { createProject, listProjects } from "../../_lib/db.js";
import { badRequest, handleErrors, json, methodNotAllowed, readJson } from "../../_lib/http.js";

export function onRequestGet({ env }) {
  return handleErrors(async () => json({ projects: await listProjects(env.DB) }));
}

export function onRequestPost({ request, env }) {
  return handleErrors(async () => {
    const body = await readJson(request);
    const name = String(body.name || "").trim();
    if (!name) return badRequest("Project name is required");
    return json({ project: await createProject(env.DB, name) }, { status: 201 });
  });
}

export function onRequest() { return methodNotAllowed(); }
