const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Password");
  if (req.method === "OPTIONS") return res.status(200).end();

  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
  const password = req.headers["x-admin-password"] || "";
  const queryPwd = req.url.indexOf("?p=") >= 0 ? req.url.split("?p=")[1].split("&")[0] : "";
  const pwd = queryPwd || password;

  // Login verification (always checked first for GET with ?p=)
  if (req.method === "GET" && queryPwd) {
    if (!adminPassword || pwd !== adminPassword) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ verified: true });
  }

  // All writes require admin password
  if (req.method !== "GET" && (!adminPassword || password !== adminPassword)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === "GET") {
    const { data, error } = await supabase.from("books").select("*").order("year", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "POST") {
    const { title, cover_data, ...rest } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const insertData = { title, ...rest };
    if (cover_data) {
      const matches = cover_data.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const filePath = 'covers/' + Date.now() + '.' + ext;
        const { error: upErr } = await supabase.storage.from('book-covers').upload(filePath, buffer, { contentType: mimeType, upsert: false });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(filePath);
          insertData.cover_url = urlData.publicUrl;
        }
      }
    }
    const { data, error } = await supabase.from("books").insert(insertData).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "PUT") {
    const { id, cover_data, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    if (cover_data) {
      const matches = cover_data.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const filePath = 'covers/' + Date.now() + '.' + ext;
        const { error: upErr } = await supabase.storage.from('book-covers').upload(filePath, buffer, { contentType: mimeType, upsert: false });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(filePath);
          updates.cover_url = urlData.publicUrl;
        }
      }
    }
    const { data, error } = await supabase.from("books").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};