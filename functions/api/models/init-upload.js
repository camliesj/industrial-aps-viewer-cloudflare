import { ApsClient } from "../../_lib/aps.js";
import { createPendingModel, getProject } from "../../_lib/db.js";
import { badRequest, handleErrors, json, methodNotAllowed, readJson } from "../../_lib/http.js";

function sanitizeObjectName(name) { return String(name || "model").replace(/[^a-zA-Z0-9._-]/g, "_"); }

export function onRequestPost({ request, env }) {
  return handleErrors(async () => {
    const body = await readJson(request);
    const projectId = String(body.projectId || "").trim();
    const fileName = String(body.fileName || "").trim();
    if (!projectId) return badRequest("Project ID is required");
    if (!fileName) return badRequest("File name is required");
    await getProject(env.DB, projectId);

    const objectName = `${Date.now()}-${sanitizeObjectName(fileName)}`;
    const signed = await new ApsClient(env).createSignedUpload(objectName);
    const now = new Date().toISOString();
    const model = await createPendingModel(env.DB, {
      id: crypto.randomUUID(),
      projectId,
      name: fileName,
      originalName: fileName,
      objectName,
      uploadKey: signed.uploadKey,
      status: "pending_upload",
      progress: "0%",
      createdAt: now,
      updatedAt: now
    });
    return json({ model, upload: { uploadKey: signed.uploadKey, urls: signed.urls, url: signed.urls?.[0] } });
  });
}

export function onRequest() { return methodNotAllowed(); }
