const express = require('express');
const app = express();
const fs = require('fs');

let database = [];

try {
  database = JSON.parse(fs.readFileSync('data.json', 'utf8'));
} catch (e) {
  database = [];
}

app.get('/', (req, res) => {
  res.send({
    code: 200,
    message: 'rX Simsimi API is Online!',
    use: "/simsimi?text=Hi | /teach | /list | /edit | /delete",
    author: "rX Abdullah"
  });
});

app.get('/simsimi', (req, res) => {
  const text = req.query.text?.toLowerCase();
  if (!text) return res.status(400).send({ response: "❌ No input text!" });

  const matches = database.filter(entry => entry.ask === text);
  if (matches.length === 0) return res.send({ response: "🙄 I don't know this yet!" });

  const random = matches[Math.floor(Math.random() * matches.length)];
  res.send({ response: random.ans });
});

app.get('/teach', (req, res) => {
  const { ask, ans, senderID, senderName } = req.query;
  if (!ask || !ans) return res.send({ message: "❌ Missing ask or ans!" });

  database.push({ ask: ask.toLowerCase(), ans, by: senderName || senderID || "unknown" });
  fs.writeFileSync('data.json', JSON.stringify(database, null, 2));
  res.send({ message: "✅ Reply added!" });
});

app.get('/list', (req, res) => {
  res.send({
    code: 200,
    totalQuestions: [...new Set(database.map(e => e.ask))].length,
    totalReplies: database.length,
    author: "rX Abdullah"
  });
});

app.get('/edit', (req, res) => {
  const { ask, old, new: newAns } = req.query;
  const index = database.findIndex(e => e.ask === ask.toLowerCase() && e.ans === old);
  if (index === -1) return res.send({ message: "❌ Not found!" });

  database[index].ans = newAns;
  fs.writeFileSync('data.json', JSON.stringify(database, null, 2));
  res.send({ message: "✅ Edited successfully!" });
});

app.get('/delete', (req, res) => {
  const { ask, ans } = req.query;
  const before = database.length;
  database = database.filter(e => !(e.ask === ask.toLowerCase() && e.ans === ans));
  fs.writeFileSync('data.json', JSON.stringify(database, null, 2));

  res.send({ message: before === database.length ? "❌ Not found!" : "✅ Deleted!" });
});

module.exports = app;
