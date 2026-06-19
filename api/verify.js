module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const password = (process.env.ADMIN_PASSWORD || "").trim();
      if (!password || body.p !== password) return res.status(401).json({ error: "Unauthorized" });
      return res.json({ verified: true });
    } catch(e) {
      return res.status(400).json({ error: e.message });
    }
  });
};