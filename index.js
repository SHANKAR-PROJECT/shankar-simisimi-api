const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ⛔️ File system हटाया गया क्योंकि Render पर write नहीं हो सकता
let db = {};

// 📥 ADD Route - नया जवाब जोड़ने के लिए
app.get('/add', (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = req.query.answer;

  if (!ask || !answer) {
    return res.json({ error: 'ask और answer दोनों देना जरूरी है!' });
  }

  db[ask] = answer;
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

app.get('/', (req, res) => {
  res.send('Simisimi API चालू है 💖 (Note: डेटा रीसेट होगा हर बार)');
});

app.listen(PORT, () => {
  console.log(`🚀 Server चल रहा है: http://localhost:${PORT}`);
});
