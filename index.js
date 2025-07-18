const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");

app.use(cors());

const PORT = process.env.PORT || 3000;
const dbPath = "db.json";

// ✅ डेटा लोड करो
let database = {};
if (fs.existsSync(dbPath)) {
  database = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

// 😄 Funny Simsimi जवाब दे
app.get("/simsimi", (req, res) => {
  const text = req.query.text?.toLowerCase();
  if (!text) return res.json({ response: "बोल तो सही बे 😜" });

  const reply = database[text];
  if (reply) {
    res.json({ response: reply });
  } else {
    res.json({ response: "माफ करना यार, मुझे ये जवाब नहीं आता 🤧. सिखा दे प्लीज़!" });
  }
});

// 🧠 कुछ नया सिखाओ
app.get("/add", (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = req.query.answer;

  if (!ask || !answer) {
    return res.json({ error: "भाई पूछने और जवाब दोनों देना पड़ेगा 😒" });
  }

  database[ask] = answer;
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
  res.json({ success: `सीख गया भाई 😎 - '${ask}' का जवाब है: '${answer}'` });
});

// ✍️ पुराना जवाब एडिट करो
app.get("/edit", (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const old = req.query.old;
  const newAnswer = req.query.new;

  if (!ask || !old || !newAnswer) {
    return res.json({ error: "सही से data दो यार - ask, old और new तीनों ज़रूरी हैं 🤨" });
  }

  if (database[ask] && database[ask] === old) {
    database[ask] = newAnswer;
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    res.json({ success: `बदल दिया गुरु 😎 - अब '${ask}' का जवाब है: '${newAnswer}'` });
  } else {
    res.json({ error: "अरे ऐसा कोई पुराना जवाब ही नहीं मिला 😓" });
  }
});

app.listen(PORT, () => {
  console.log(`Server चल रहा है http://localhost:${PORT}`);
});
