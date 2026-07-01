export async function listProjects(db) {
  const [p, m] = await Promise.all([
    db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all(),
    db.prepare("SELECT * FROM models ORDER BY created_at DESC").all()
  ]);
  const models = m.results.map(toModel);
  return p.results.map(project => ({
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    models: models.filter(model => model.projectId === project.id)
  }));
}

export async function createProject(db, name) {
  const now = new Date().toISOString();
  const project = { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now };
  await db.prepare("INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .bind(project.id, project.name, project.createdAt, project.updatedAt).run();
  return project;
}

export async function getProject(db, id) {
  const project = await db.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  if (!project) { const error = new Error("Project not found"); error.status = 404; throw error; }
  return project;
}

export async function createPendingModel(db, model) {
  await db.prepare(`INSERT INTO models (id, project_id, name, original_name, object_name, upload_key, status, progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    model.id, model.projectId, model.name, model.originalName, model.objectName, model.uploadKey, model.status, model.progress, model.createdAt, model.updatedAt
  ).run();
  return model;
}

export async function getModel(db, id) {
  const model = await db.prepare("SELECT * FROM models WHERE id = ?").bind(id).first();
  if (!model) { const error = new Error("Model not found"); error.status = 404; throw error; }
  return toModel(model);
}

export async function completeModel(db, id, values) {
  const now = new Date().toISOString();
  await db.prepare("UPDATE models SET object_id = ?, urn = ?, status = ?, progress = ?, updated_at = ? WHERE id = ?")
    .bind(values.objectId, values.urn, "inprogress", "0%", now, id).run();
  return getModel(db, id);
}

export async function updateModelStatus(db, id, values) {
  const now = new Date().toISOString();
  await db.prepare("UPDATE models SET status = ?, progress = ?, manifest = ?, updated_at = ? WHERE id = ?")
    .bind(values.status, values.progress, JSON.stringify(values.manifest || null), now, id).run();
  return getModel(db, id);
}

export async function deleteModel(db, id) {
  await getModel(db, id);
  await db.prepare("DELETE FROM models WHERE id = ?").bind(id).run();
}

export function toModel(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    originalName: row.original_name,
    objectName: row.object_name,
    objectId: row.object_id,
    urn: row.urn,
    uploadKey: row.upload_key,
    status: row.status,
    progress: row.progress,
    manifest: row.manifest ? JSON.parse(row.manifest) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
