const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Octokit } = require("@octokit/rest");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE'; // 🔐 Secret
const GITHUB_REPO = 'shankar-simisimi-api'; // 👈 your repo name
const GITHUB_OWNER = 'SHANKAR-PROJECT';      // 👈 your GitHub username
const FILE_PATH = 'memory.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// 🧠 Local memory cache
let db = {};

// 🔁 Load memory from GitHub on startup
async function loadMemoryFromGitHub() {
  try {
    const response = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: FILE_PATH
    });

    const content = Buffer.from(response.data.content, 'base64').toString();
    db = JSON.parse(content);
    console.log('✅ Memory loaded from GitHub.');
  } catch (err) {
    console.log('❌ GitHub memory not found. Starting fresh.');
    db = {};
  }
}

// 💾 Save memory to GitHub
async function saveMemoryToGitHub() {
  try {
    const getFile = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: FILE_PATH
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: FILE_PATH,
      message: '💾 Updated memory.json',
      content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64'),
      sha: getFile.data.sha
    });

    console.log('📦 Memory saved to GitHub!');
  } catch (err) {
    // If file not found, create it
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: FILE_PATH,
      message: '🆕 Created memory.json',
      content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64')
    });
    console.log('🆕 memory.json created on GitHub!');
  }
}

// 📥 Add Route
app.get('/add', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = req.query.answer;

  if (!ask || !answer) {
    return res.json({ error: 'ask और answer दोनों देना जरूरी है!' });
  }

  db[ask] = answer;
  await saveMemoryToGitHub();
  res.json({ message: 'जवाब जोड़ दिया गया!', ask, answer });
});

// 🤖 SIMI Route
app.get('/simi', (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = db[ask];
  if (!answer) return res.json({ answer: 'माफ कर ना दोस्त, मुझे इसका जवाब नहीं आता 😅' });
  res.json({ answer });
});

app.get('/', (req, res) => {
  res.send('💬 Simisimi API चालू है! GitHub Memory Enabled 🔐');
});

// 🚀 Start
app.listen(PORT, async () => {
  console.log(`🚀 Server चल रहा है: http://localhost:${PORT}`);
  await loadMemoryFromGitHub(); // Load memory on start
});
