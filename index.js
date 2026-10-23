
const express = require("express");
const minecraft = require("minecraft-protocol");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

let bot = null;
let botStatus = "disconnected";
let lastError = null;

app.get("/", (req, res) => {
  res.send(`
    <!doctype html>
    <html lang="ar" dir="rtl">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>MineLink</title>
    <body style="font-family:Arial;background:#101827;color:white;padding:35px">
      <h1>MineLink 🎮</h1>
      <p>لوحة تحكم بوت Minecraft</p>
      <p>حالة البوت: <b>${botStatus}</b></p>
      <p>آخر خطأ: ${lastError || "لا يوجد"}</p>
      <p>استخدم /api/status لمتابعة الحالة.</p>
    </body>
    </html>
  `);
});

app.get("/api/status", (req, res) => {
  res.json({ status: botStatus, error: lastError });
});

app.post("/api/connect", (req, res) => {
  if (!ADMIN_TOKEN || req.get("authorization") !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { host, port, username, version } = req.body;

  if (!host || !username || !Number.isInteger(Number(port))) {
    return res.status(400).json({ error: "Invalid server settings" });
  }

  if (bot) {
    bot.end();
    bot = null;
  }

  lastError = null;
  botStatus = "connecting";

  try {
    bot = minecraft.createClient({
      host,
      port: Number(port),
      username,
      version: version || false,
      auth: "offline"
    });

    bot.on("login", () => {
      botStatus = "connected";
    });

    bot.on("end", () => {
      botStatus = "disconnected";
      bot = null;
    });

    bot.on("error", (err) => {
      lastError = err.message;
      botStatus = "error";
    });

    res.json({ status: "connecting" });
  } catch (err) {
    lastError = err.message;
    botStatus = "error";
    res.status(500).json({ error: "Connection failed" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MineLink listening on port ${PORT}`);
});
