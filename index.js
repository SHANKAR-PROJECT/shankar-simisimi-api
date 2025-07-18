const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let db = {};

try {
  db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
} catch {
  db = {};
}

// 📥 ADD Route - नया जवाब जोड़ने के लिए
app.get('/add', (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = req.query.answer;

  if (!ask || !answer) {
    return res.json({ error: 'ask और answer दोनों देना जरूरी है!' });
  }

  db[ask] = answer;
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  res.json({ message: 'जवाब जोड़ दिया गया!', ask, answer });
});

// 🤖 SIMI Route - सवाल का जवाब देने के लिए
app.get('/simi', (req, res) => {
  const ask = req.query.ask?.toLowerCase();

  if (!ask) return res.json({ error: 'ask parameter missing है!' });

  const answer = db[ask];
  if (!answer) return res.json({ answer: 'माफ कर ना दोस्त, मुझे इसका जवाब नहीं आता 😅' });

  res.json({ answer });
});

// ✅ Root route (optional)
app.get('/', (req, res) => {
  res.send('Simisimi API चालू है 💖');
});

app.listen(PORT, () => {
  console.log(`🚀 Server चल रहा है: http://localhost:${PORT}`);
});
