const express = require("express");
const fs = require("fs");
const chalk = require("chalk");
const app = express();
const PORT = process.env.PORT || 3000;

const dataPath = __dirname + "/data.json";
const settingsPath = __dirname + "/settings.json";

app.use(express.json());

let data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, "utf8")) : [];
let settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : { autoTeach: true };

const save = () => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
};

const removeEmojis = str => str.replace(/[\u{1F600}-\u{1F6FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, "").trim().toLowerCase();

app.get("/", (req, res) => {
  console.log(chalk.green.bold("✅ API is live"));
  res.send("✅ API is running");
});

app.get("/get", (req, res) => {
  const raw = req.query.ask;
  const ask = removeEmojis(raw || "");
  const found = data.find(x => x.ask === ask);
  console.log(chalk.blue.bold("🔍 GET:"), chalk.white(ask), found ? chalk.green("✅ Found") : chalk.red("❌ Not Found"));
  res.json({
    reply: found ? found.ans : `**Sorry bby, ei kotha ta amake teach kora hoy ni 🥺. Plz teach me!**`
  });
});

app.post("/teach", (req, res) => {
  const rawAsk = req.body.ask || "";
  const rawAns = req.body.ans || "";
  const ask = removeEmojis(rawAsk);
  const ans = rawAns.trim();
  if (!ask || !ans) {
    console.log(chalk.red.bold("⚠️ Teach Failed - Missing ask or ans"));
    return res.status(400).json({ error: "Missing" });
  }

  const exists = data.find(x => x.ask === ask);
  if (exists) {
    console.log(chalk.yellow.bold("⚠️ Already exists:"), chalk.white(ask));
    return res.json({ message: "Already exists" });
  }

  data.push({ ask, ans });
  save();
  console.log(chalk.green.bold("✅ Taught:"), chalk.white(ask), "→", chalk.cyan(ans));
  res.json({ message: "Taught" });
});

app.get("/list", (req, res) => {
  console.log(chalk.magenta.bold(`📄 Total teaches: ${data.length}`));
  res.json({ total: data.length, data });
});

app.put("/edit", (req, res) => {
  const rawAsk = req.body.ask || "";
  const newAns = req.body.newAns?.trim();
  const ask = removeEmojis(rawAsk);
  const found = data.find(x => x.ask === ask);
  if (!found) {
    console.log(chalk.red.bold("❌ Edit Failed - Not found:"), chalk.white(ask));
    return res.status(404).json({ error: "Not found" });
  }

  found.ans = newAns;
  save();
  console.log(chalk.cyan.bold("✏️ Edited:"), chalk.white(ask), "→", chalk.cyan(newAns));
  res.json({ message: "Edited" });
});

app.delete("/delete", (req, res) => {
  const rawAsk = req.body.ask || "";
  const ask = removeEmojis(rawAsk);
  const index = data.findIndex(x => x.ask === ask);
  if (index === -1) {
    console.log(chalk.red.bold("❌ Delete Failed - Not found:"), chalk.white(ask));
    return res.status(404).json({ error: "Not found" });
  }

  const removed = data.splice(index, 1);
  save();
  console.log(chalk.red.bold("🗑️ Deleted:"), chalk.white(removed[0].ask));
  res.json({ message: "Deleted", ask: removed[0].ask });
});

app.get("/setting", (req, res) => {
  console.log(chalk.gray("⚙️  Get setting"), settings);
  res.json(settings);
});

app.post("/setting", (req, res) => {
  const { autoTeach } = req.body;
  settings.autoTeach = autoTeach;
  save();
  console.log(chalk.yellow.bold("🔁 AutoTeach:"), chalk.white(autoTeach ? "ON" : "OFF"));
  res.json({ message: `Auto teach is now ${autoTeach ? "ON" : "OFF"}` });
});

app.listen(PORT, () => {
  console.log(chalk.green.bold(`🚀 API running on port ${PORT}`));
});
