const express = require('express');
const cors = require('cors');
const { Octokit } = require("@octokit/rest");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// 🔐 Secrets & GitHub Info
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
const GITHUB_REPO = 'shankar-simisimi-api';
const GITHUB_OWNER = 'SHANKAR-PROJECT';
const FILE_PATH = 'memory.json';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// 🧠 Memory DB (in RAM)
let db = {};

// 🔁 Load memory from GitHub on server start
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
    console.log('❌ No memory.json found on GitHub, creating a new one...');
    db = {};
    await saveMemoryToGitHub(); // 🔄 Create empty memory.json on GitHub
  }
}

// 💾 Save memory to GitHub
async function saveMemoryToGitHub() {
  try {
    const existingFile = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: FILE_PATH
    });

    const sha = existingFile.data.sha;

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: FILE_PATH,
      message: '💾 Updated memory.json',
      content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64'),
      sha
    });

    console.log('📦 Memory updated to GitHub!');
  } catch (err) {
    // If file does not exist, create it
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

// 📥 /add route to add Q&A
app.get('/add', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = req.query.answer;

  if (!ask || !answer) {
    return res.json({ error: 'ask और answer दोनों देना जरूरी है!' });
  }

  db[ask] = answer;
  await saveMemoryToGitHub();
  res.json({ message: '✅ जवाब जोड़ दिया गया!', ask, answer });
});

// 🤖 /simi route to reply
app.get('/simi', (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const answer = db[ask];

  if (!answer) {
    return res.json({ answer: 'माफ कर ना दोस्त, मुझे इसका जवाब नहीं आता 😅' });
  }

  res.json({ answer });
});

// 🌐 Default route
app.get('/', (req, res) => {
  res.send('💬 Simisimi API चालू है! Memory GitHub से जुड़ी है 🔐');
});

// 🚀 Server Start
app.listen(PORT, async () => {
  console.log(`🚀 Server चल रहा है: http://localhost:${PORT}`);
  await loadMemoryFromGitHub();
});
