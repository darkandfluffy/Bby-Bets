import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const DATA_FILE = "guesses.json";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Helper functions
function loadGuesses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveGuesses(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Handle form submission
app.post("/guess", (req, res) => {
  const { guesser } = req.body;
  let names = req.body.name;

  if (!names) return res.redirect("/");

  if (!Array.isArray(names)) names = [names];

  const guesses = loadGuesses();

  names.forEach(n => {
    if (typeof n === "string") {
      const trimmed = n.trim();
      if (trimmed) {
        guesses.push({ guesser, name: trimmed, time: new Date().toISOString() });
      }
    }
  });

  saveGuesses(guesses);
  res.redirect("/");
});

// Stats route: show guesser, number of guesses, and their guessed names
app.get("/stats", (req, res) => {
  const guesses = loadGuesses();
  const guesserMap = {};

  // Group guesses by guesser
  guesses.forEach(g => {
    if (typeof g.guesser !== "string" || typeof g.name !== "string") return;
    const guesser = g.guesser.trim();
    const name = g.name.trim();
    if (!guesser || !name) return;

    if (!guesserMap[guesser]) guesserMap[guesser] = [];
    guesserMap[guesser].push(name);
  });

  // Render HTML
  let html = "<h2>Guess Stats</h2><ul>";
  for (const [guesser, names] of Object.entries(guesserMap)) {
    html += `<li>${guesser} : count: ${names.length} -- {${names.join(", ")}}</li>`;
  }
  html += "</ul><a href='/'>Back to form</a>";

  res.send(html);
});

app.listen(3000, () => console.log("Running at http://localhost:3000"));
