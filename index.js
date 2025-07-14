require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db;

const emojis = ['🥰','😊','😽','😍','😘','💖','💙','💜','🌟','✨'];

const removeEmojis = text =>
  text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDFFF]|[\uFE00-\uFE0F]|[\u200D])/g, '').trim();

const fancyFonts = text => {
  const boldMap = { a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',
    h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',
    o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',
    v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
    A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',
    H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',
    O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',
    V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',' ':' ',
    '.':'.', ',':',', '?':'?', '!':'!', '-':'-', '_':'_'};
  return text.split('').map(c=>boldMap[c]||c).join('');
};

app.use(express.json());

async function connectDB() {
  try {
    await client.connect();
    db = client.db("chatbot");
    // Ensure index on question for faster search & uniqueness
    await db.collection("teach").createIndex({ question: 1 }, { unique: true });
    console.log("✅ MongoDB connected & index created");
  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
  }
}
connectDB();

app.get("/", (req, res) => res.send("✅ API is working"));

app.get("/teach", async (req, res) => {
  try {
    let { ask, ans, senderName } = req.query;
    if (!ask || !ans) return res.json({ message: "❌ Provide ask and ans" });

    ask = removeEmojis(ask.toLowerCase());
    const newReplies = ans.split("-").map(r => r.trim()).filter(Boolean);

    const col = db.collection("teach");
    const found = await col.findOne({ question: ask });

    if (found) {
      // Merge old and new replies, no duplicates
      const merged = Array.from(new Set([...found.replies, ...newReplies]));
      await col.updateOne({ question: ask }, { $set: { replies: merged } });
      return res.json({
        message: `✅ reply updated!\nTrigger: ${ask}\nTotal replies: ${merged.length}\nLast reply: ${newReplies[newReplies.length-1]}\nTeacher: ${senderName || "Unknown"}`
      });
    } else {
      await col.insertOne({ question: ask, replies: newReplies });
      return res.json({
        message: `✅ reply added!\nTrigger: ${ask}\nTotal replies: ${newReplies.length}\nLast reply: ${newReplies[newReplies.length-1]}\nTeacher: ${senderName || "Unknown"}`
      });
    }
  } catch (e) {
    console.error("Error in /teach:", e);
    res.status(500).json({ message: "❌ Server error" });
  }
});

app.get("/delete", async (req, res) => {
  try {
    let { ask, ans } = req.query;
    if (!ask || !ans) return res.json({ message: "❌ Provide ask and ans" });

    ask = removeEmojis(ask.toLowerCase());
    const col = db.collection("teach");
    const found = await col.findOne({ question: ask });
    if (!found) return res.json({ message: "❌ Trigger not found" });

    const filtered = found.replies.filter(r => r !== ans);
    if (filtered.length === found.replies.length)
      return res.json({ message: "❌ Reply not found" });

    if (filtered.length === 0) {
      // Delete whole question if no replies left
      await col.deleteOne({ question: ask });
    } else {
      await col.updateOne({ question: ask }, { $set: { replies: filtered } });
    }
    res.json({ message: "✅ Reply deleted" });
  } catch (e) {
    console.error("Error in /delete:", e);
    res.status(500).json({ message: "❌ Server error" });
  }
});

app.get("/edit", async (req, res) => {
  try {
    let { ask, old, new: updated } = req.query;
    if (!ask || !old || !updated)
      return res.json({ message: "❌ Provide ask, old and new" });

    ask = removeEmojis(ask.toLowerCase());
    const col = db.collection("teach");
    const found = await col.findOne({ question: ask });
    if (!found) return res.json({ message: "❌ Trigger not found" });

    const index = found.replies.indexOf(old);
    if (index === -1) return res.json({ message: "❌ Old reply not found" });

    found.replies[index] = updated;
    await col.updateOne({ question: ask }, { $set: { replies: found.replies } });

    res.json({ message: "✅ Reply updated" });
  } catch (e) {
    console.error("Error in /edit:", e);
    res.status(500).json({ message: "❌ Server error" });
  }
});

app.get("/list", async (req, res) => {
  try {
    const arr = await db.collection("teach").find({}).toArray();
    const totalQuestions = arr.length;
    const totalReplies = arr.reduce((sum, item) => sum + item.replies.length, 0);
    res.json({ totalQuestions, totalReplies });
  } catch (e) {
    console.error("Error in /list:", e);
    res.status(500).json({ message: "❌ Server error" });
  }
});

app.get("/simsimi-list", async (req, res) => {
  try {
    let question = req.query.ask;
    if (!question) return res.json({ message: "❌ Provide a trigger" });

    question = removeEmojis(question.toLowerCase());
    const found = await db.collection("teach").findOne({ question });
    if (!found) return res.json({ message: "❌ No replies found" });

    const list = found.replies
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n");

    const formatted = `📌 ${fancyFonts("Trigger")}: ${question.toUpperCase()}\n📋 ${fancyFonts("Total")}: ${found.replies.length}\n━━━━━━━━━━━━━━\n${list}`;
    res.json({ message: formatted, total: found.replies.length, replies: found.replies });
  } catch (e) {
    console.error("Error in /simsimi-list:", e);
    res.status(500).json({ message: "❌ Server error" });
  }
});

app.get("/simsimi", async (req, res) => {
  try {
    let textRaw = req.query.text;
    if (!textRaw) return res.json({ response: "❌ Provide text" });

    const text = removeEmojis(textRaw.toLowerCase());
    const sender = req.query.sender || "Friend";

    const found = await db.collection("teach").findOne({ question: text });
    if (!found?.replies?.length)
      return res.json({ response: fancyFonts("sorry bby, ata amake teach kora hoy ni, plz teach me <🥺") });

    let reply = found.replies[Math.floor(Math.random() * found.replies.length)];

    if (reply.includes("@mention")) {
      reply = reply.replace(/@mention/gi, `@${sender}`);
    }

    const countEmoji = Math.floor(Math.random() * 2);
    for (let i = 0; i < countEmoji; i++) {
      reply += " " + emojis[Math.floor(Math.random() * emojis.length)];
    }

    res.json({ response: fancyFonts(reply) });
  } catch (e) {
    console.error("Error in /simsimi:", e);
    res.status(500).json({ response: "❌ Server error" });
  }
});

app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));
