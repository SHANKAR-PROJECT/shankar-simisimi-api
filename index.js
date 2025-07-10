const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

let data = require("./data.json");
app.use(express.json());

const fancyFonts = (text) => {
  const boldMap = {
    a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴',
    h: '𝗵', i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻',
    o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂',
    v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
    A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚',
    H: '𝗛', I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡',
    O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨',
    V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
    ' ': ' ', '.': '.', ',': ',', '?': '?', '!': '!', '-': '-', '_': '_'
  };
  return text.split('').map(c => boldMap[c] || c).join('');
};

const emojis = ['🥰', '😊', '😽', '😍', '😘', '💖', '💙', '💜', '🌟', '✨'];

app.get("/", (req, res) => {
  res.send("✅ rX SimSimi API is running!");
});

app.get("/simsimi", (req, res) => {
  const text = req.query.text?.toLowerCase();
  if (!text) return res.json({ response: "❌ Please provide text" });

  const replies = data[text];
  if (!replies || replies.length === 0) {
    return res.json({ response: "Sorry baby, ata amake teach kora hoy nai 🥺" });
  }

  let randomReply = replies[Math.floor(Math.random() * replies.length)];
  randomReply = fancyFonts(randomReply);

  const countEmoji = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < countEmoji; i++) {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    randomReply += " " + randomEmoji;
  }

  return res.json({ response: randomReply });
});

app.get("/teach", (req, res) => {
  const { ask, ans } = req.query;
  if (!ask || !ans) return res.json({ message: "❌ Provide ask and ans" });

  const question = ask.toLowerCase();
  const answersArray = ans.split(" - ").map(a => a.trim()).filter(Boolean);

  if (!data[question]) data[question] = [];

  answersArray.forEach(a => {
    if (!data[question].includes(a)) data[question].push(a);
  });

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  return res.json({
    message: "✅ Replies added successfully",
    total: data[question].length,
    trigger: question,
    replies: data[question]
  });
});

app.get("/list", (req, res) => {
  const totalQuestions = Object.keys(data).length;
  const totalReplies = Object.values(data).reduce((acc, arr) => acc + arr.length, 0);
  return res.json({
    code: 200,
    totalQuestions,
    totalReplies,
    author: "rX Abdullah"
  });
});

app.get("/delete", (req, res) => {
  const { ask, ans } = req.query;
  const question = ask?.toLowerCase();
  if (!question || !ans) return res.json({ message: "❌ Provide ask and ans" });

  if (!data[question]) return res.json({ message: "❌ Question not found" });

  data[question] = data[question].filter(r => r !== ans);
  if (data[question].length === 0) delete data[question];

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  return res.json({ message: "✅ Reply deleted successfully" });
});

app.get("/edit", (req, res) => {
  const { ask, old, new: newReply } = req.query;
  const question = ask?.toLowerCase();
  if (!question || !old || !newReply) {
    return res.json({ message: "❌ Provide ask, old and new" });
  }

  if (!data[question]) return res.json({ message: "❌ Question not found" });

  const index = data[question].indexOf(old);
  if (index === -1) return res.json({ message: "❌ Old reply not found" });

  data[question][index] = newReply;

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  return res.json({ message: "✅ Reply updated successfully" });
});

app.get("/simsimi-list", (req, res) => {
  const { ask } = req.query;
  const question = ask?.toLowerCase();
  if (!question) return res.json({ message: "❌ Provide a trigger to list replies" });

  if (!data[question]) return res.json({ message: "❌ No replies found for this trigger" });

  return res.json({
    trigger: question,
    total: data[question].length,
    replies: data[question]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
