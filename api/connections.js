const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Password");
  if (req.method === "OPTIONS") return res.status(200).end();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const password = req.headers["x-admin-password"] || "";

  if (req.method === "GET") {
    const { book_id } = req.query;
    if (!book_id) return res.status(400).json({ error: "book_id required" });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    // Get connections in both directions
    const { data, error } = await supabase
      .from("connections")
      .select("id, book_a_id, book_b_id")
      .or("book_a_id.eq." + book_id + ",book_b_id.eq." + book_id);
    if (error) return res.status(500).json({ error: error.message });
    // For each connection, get the other book's info
    var related = [];
    for (var c of (data || [])) {
      var otherId = c.book_a_id == book_id ? c.book_b_id : c.book_a_id;
      var { data: bk } = await supabase.from("books").select("id,title,author,cover_url,color,year").eq("id", otherId).single();
      if (bk) related.push({ conn_id: c.id, book: bk });
    }
    return res.json(related);
  }

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const { book_a_id, book_b_id } = req.body;
    if (!book_a_id || !book_b_id) return res.status(400).json({ error: "Both book ids required" });
    if (book_a_id === book_b_id) return res.status(400).json({ error: "Cannot connect to itself" });
    // Normalize: smaller id first
    var a = Math.min(book_a_id, book_b_id);
    var b = Math.max(book_a_id, book_b_id);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from("connections").insert({ book_a_id: a, book_b_id: b }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("connections").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
