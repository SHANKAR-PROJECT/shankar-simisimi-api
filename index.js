const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

let data = {};
let settings = { autoTeach: true };

try {
  data = JSON.parse(fs.readFileSync("./data.json", "utf8") || "{}");
} catch { data = {}; }

try {
  settings = JSON.parse(fs.readFileSync("./settings.json", "utf8") || "{}");
} catch { settings = { autoTeach: true }; }

app.use(express.json());

const save = () => {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  fs.writeFileSync("./settings.json", JSON.stringify(settings, null, 2));
};

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
  return text.replace(/[\u{1F600}-\u{1F6FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, "").trim();
};

const emojis = ['🥰','😊','😽','😍','😘','💖','💙','💜','🌟','✨'];

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
      response: fancyFonts("Sorry bby, ei kotha ta amake teach kora hoy ni 🥺. Plz teach me!")
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
  const { ask, ans, senderName } = req.query;
  if (!ask || !ans) return res.json({ message: "❌ Provide ask and ans" });

  const question = removeEmojis(ask.toLowerCase());
  const replies = ans.split("-").map(r => r.trim()).filter(Boolean);

  if (!data[question]) {
    data[question] = [];
  }

  let newCount = 0;
  replies.forEach(reply => {
    if (!data[question].includes(reply)) {
      data[question].push(reply);
      newCount++;
    }
  });

  save();

  const latestReply = replies[replies.length - 1] || replies[0];
  res.json({
    message: `✅ reply added!\nTrigger: ${question}\nTotal teach: ${data[question].length}\nReplies: ${latestReply}\nTeacher: ${senderName || "Unknown"}`
  });
});

app.get("/list", (req, res) => {
  const totalQuestions = Object.keys(data).length;
  const totalReplies = Object.values(data).reduce((sum, r) => sum + r.length, 0);
  res.json({ totalQuestions, totalReplies });
});

app.get("/simsimi-list", (req, res) => {
  const question = removeEmojis(req.query.ask?.toLowerCase());
  if (!question) return res.json({ message: "❌ Provide a trigger" });

  if (!data[question]) return res.json({ message: "❌ No replies found" });

  const list = data[question].map((r, i) => `${i + 1}. ${r}`).join("\n");
  const formatted = `📌 ${fancyFonts("Trigger")}: ${question.toUpperCase()}\n📋 ${fancyFonts("Total")}: ${data[question].length}\n━━━━━━━━━━━━━━\n${list}`;
  res.json({ message: formatted, total: data[question].length, replies: data[question] });
});

app.get("/delete", (req, res) => {
  const { ask, ans } = req.query;
  const question = removeEmojis(ask?.toLowerCase());
  if (!question || !ans) return res.json({ message: "❌ Provide ask and ans" });

  if (!data[question]) return res.json({ message: "❌ Trigger not found" });

  data[question] = data[question].filter(r => r !== ans);
  if (data[question].length === 0) delete data[question];

  save();
  res.json({ message: "✅ Reply deleted" });
});

app.get("/edit", (req, res) => {
  const { ask, old, new: updated } = req.query;
  const question = removeEmojis(ask?.toLowerCase());
  if (!question || !old || !updated) return res.json({ message: "❌ Provide ask, old and new" });

  if (!data[question]) return res.json({ message: "❌ Trigger not found" });

  const index = data[question].indexOf(old);
  if (index === -1) return res.json({ message: "❌ Old reply not found" });

  data[question][index] = updated;
  save();

  res.json({ message: "✅ Reply updated" });
});

app.get("/setting", (req, res) => {
  res.json(settings);
});

app.post("/setting", (req, res) => {
  const { autoTeach } = req.body;
  settings.autoTeach = autoTeach;
  save();
  res.json({ message: `✅ Auto teach is now ${autoTeach ? "ON" : "OFF"}` });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
