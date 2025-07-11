const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

let data = {};
try {
  const raw = fs.readFileSync("./data.json", "utf8");
  data = JSON.parse(raw || "{}");
} catch {
  data = {};
}

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

const removeEmojis = (text) => {
  return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
};

const emojis = ['🥰', '😊', '😽', '😍', '😘', '💖', '💙', '💜', '🌟', '✨'];

app.get("/", (req, res) => {
  res.send("✅ API is running");
});

app.get("/simsimi", (req, res) => {
  let text = req.query.text?.toLowerCase();
  if (!text) return res.json({ response: "❌ Provide text" });

  text = removeEmojis(text);
  const replies = data[text];

  if (!replies || replies.length === 0) {
    return res.json({
      response: fancyFonts("sorry bby, ata amake teach kora hoy ni, plz teach me <🥺")
    });
  }

  let reply = replies[Math.floor(Math.random() * replies.length)];
  reply = fancyFonts(reply);

  const countEmoji = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < countEmoji; i++) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    reply += " " + emoji;
  }

  res.json({ response: reply });
});

app.get("/teach", (req, res) => {
  const { ask, ans, user } = req.query;
  if (!ask || !ans) return res.json({ message: "❌ Provide ask and ans" });

  const question = removeEmojis(ask.toLowerCase());
  const replies = ans.split(" - ").map(r => r.trim()).filter(Boolean);

  if (!data[question]) data[question] = [];
  replies.forEach(r => {
    if (!data[question].includes(r)) data[question].push(r);
  });

  try {
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  } catch {
    return res.json({ message: "❌ Failed to save data" });
  }

  res.json({
    message: `✅ Total ${replies.length} reply added!`,
    trigger: question,
    total: data[question].length,
    replies: data[question],
    teacher: user || "Unknown"
  });
});

app.get("/list", (req, res) => {
  try {
    const totalQuestions = Object.keys(data).length;
    const totalReplies = Object.values(data).reduce((sum, r) => sum + r.length, 0);
    res.json({
      code: 200,
      totalQuestions,
      totalReplies,
      author: "rX Abdullah"
    });
  } catch {
    res.json({ message: "❌ Error listing data" });
  }
});

app.get("/simsimi-list", (req, res) => {
  const question = removeEmojis(req.query.ask?.toLowerCase());
  if (!question) return res.json({ message: "❌ Provide a trigger" });

  if (!data[question]) return res.json({ message: "❌ No replies found" });

  const list = data[question]
    .map((r, i) => `${i + 1}. ${r}`)
    .join("\n");

  const formatted = `📌 ${fancyFonts("Trigger")}: ${question.toUpperCase()}
📋 ${fancyFonts("Total")}: ${data[question].length}
━━━━━━━━━━━━━━\n${list}`;

  res.json({ message: formatted });
});

app.get("/delete", (req, res) => {
  const { ask, ans } = req.query;
  const question = removeEmojis(ask?.toLowerCase());
  if (!question || !ans) return res.json({ message: "❌ Provide ask and ans" });

  if (!data[question]) return res.json({ message: "❌ Trigger not found" });

  data[question] = data[question].filter(r => r !== ans);
  if (data[question].length === 0) delete data[question];

  try {
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  } catch {}

  res.json({ message: "✅ Reply deleted" });
});

app.get("/edit", (req, res) => {
  const { ask, old, new: updated } = req.query;
  const question = removeEmojis(ask?.toLowerCase());
  if (!question || !old || !updated) {
    return res.json({ message: "❌ Provide ask, old and new" });
  }

  if (!data[question]) return res.json({ message: "❌ Trigger not found" });

  const index = data[question].indexOf(old);
  if (index === -1) return res.json({ message: "❌ Old reply not found" });

  data[question][index] = updated;

  try {
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  } catch {}

  res.json({ message: "✅ Reply updated" });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
