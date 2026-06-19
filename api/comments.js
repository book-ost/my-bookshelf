const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Password");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (req.method === "GET") {
    const { book_id } = req.query;
    if (!book_id) return res.status(400).json({ error: "book_id is required" });
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("book_id", book_id)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "POST") {
    // Public can post comments
    const { book_id, author_name, body } = req.body;
    if (!book_id || !author_name || !body) {
      return res.status(400).json({ error: "book_id, author_name, body are required" });
    }
    const { data, error } = await supabase
      .from("comments")
      .insert({ book_id, author_name, body })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "DELETE") {
    const password = req.headers["x-admin-password"] || "";
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
