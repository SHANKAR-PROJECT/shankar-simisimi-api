const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

let data = require("./data.json");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ rX SimSimi API is running!");
});

app.get("/simsimi", (req, res) => {
  const text = req.query.text?.toLowerCase();
  const senderName = req.query.senderName || "User";

  if (!text) return res.json({ response: "❌ Please provide text" });

  const replies = data[text];
  if (!replies || replies.length === 0) {
    return res.json({ response: "আমি এটা শিখি নাই এখনো 🥹 teach command ব্যবহার করো!" });
  }

  const randomReply = replies[Math.floor(Math.random() * replies.length)];
  return res.json({ response: randomReply });
});

app.get("/teach", (req, res) => {
  const { ask, ans, senderID, senderName } = req.query;
  if (!ask || !ans) return res.json({ message: "❌ Provide ask and ans" });

  const question = ask.toLowerCase();

  if (!data[question]) data[question] = [];
  if (!data[question].includes(ans)) data[question].push(ans);

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  return res.json({ message: `Added "${ask}" => "${ans}" by ${senderName || "Unknown"}` });
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

  if (!data[question]) return res.json({ message: "Question not found" });

  data[question] = data[question].filter(r => r !== ans);
  if (data[question].length === 0) delete data[question];

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  return res.json({ message: "✅ Reply deleted" });
});

app.get("/edit", (req, res) => {
  const { ask, old, new: newReply } = req.query;
  const question = ask?.toLowerCase();
  if (!question || !old || !newReply) return res.json({ message: "❌ Provide ask, old and new" });

  if (!data[question]) return res.json({ message: "Question not found" });
  const index = data[question].indexOf(old);
  if (index === -1) return res.json({ message: "Old reply not found" });

  data[question][index] = newReply;

  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
  return res.json({ message: "✅ Reply updated" });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
