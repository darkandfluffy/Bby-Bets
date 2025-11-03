import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const DATA_FILE = "guesses.json";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function loadGuesses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveGuesses(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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

app.get("/stats", (req, res) => {
  const guesses = loadGuesses();
  const guesserMap = {};

  guesses.forEach(g => {
    if (typeof g.guesser !== "string" || typeof g.name !== "string") return;
    const guesser = g.guesser.trim();
    const name = g.name.trim();
    if (!guesser || !name) return;

    if (!guesserMap[guesser]) guesserMap[guesser] = [];
    guesserMap[guesser].push(name);
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Baby Name Guess Stats</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Quicksand', sans-serif;
          background: linear-gradient(135deg, #ffeef8 0%, #ffe4f3 50%, #ffd9f0 100%);
          min-height: 100vh;
          padding: 20px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        h2 {
          color: #ff69b4;
          text-align: center;
          font-size: 2.5em;
          margin-bottom: 10px;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(255, 105, 180, 0.2);
        }

        .subtitle {
          text-align: center;
          color: #ff99cc;
          margin-bottom: 30px;
          font-size: 1.1em;
        }

        .stats-list {
          list-style: none;
          padding: 0;
        }

        .stats-item {
          background: linear-gradient(135deg, #fff0f8 0%, #ffe4f3 100%);
          padding: 20px;
          margin-bottom: 15px;
          border-radius: 12px;
          border-left: 5px solid #ff69b4;
          box-shadow: 0 3px 10px rgba(255, 105, 180, 0.1);
        }

        .guesser-name {
          color: #ff69b4;
          font-weight: 700;
          font-size: 1.3em;
          margin-bottom: 8px;
        }

        .guess-count {
          color: #ff99cc;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .name-list {
          color: #666;
          font-size: 1.1em;
          line-height: 1.6;
        }

        .name-tag {
          display: inline-block;
          background: white;
          padding: 5px 12px;
          margin: 4px;
          border-radius: 8px;
          border: 2px solid #ffc9e3;
          color: #ff69b4;
          font-weight: 600;
        }

        .back-link {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #ffe4f3;
        }

        .back-link a {
          display: inline-block;
          background: linear-gradient(135deg, #ff69b4 0%, #ff85c1 100%);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1em;
          box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
          transition: all 0.3s ease;
        }

        .back-link a:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 105, 180, 0.4);
        }

        .total-guesses {
          text-align: center;
          margin-bottom: 30px;
          padding: 15px;
          background: #fff0f8;
          border-radius: 12px;
          color: #ff69b4;
          font-size: 1.2em;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>💕 Baby Name Guesses 💕</h2>
        <p class="subtitle">See what everyone is guessing!</p>
        
        <div class="total-guesses">
          Total Guesses: ${guesses.length} from ${Object.keys(guesserMap).length} ${Object.keys(guesserMap).length === 1 ? 'person' : 'people'}
        </div>

        <ul class="stats-list">
  `;

  for (const [guesser, names] of Object.entries(guesserMap)) {
    html += `
      <li class="stats-item">
        <div class="guesser-name">${guesser}</div>
        <div class="guess-count">${names.length} ${names.length === 1 ? 'guess' : 'guesses'}</div>
        <div class="name-list">
          ${names.map(name => `<span class="name-tag">${name}</span>`).join('')}
        </div>
      </li>
    `;
  }

  html += `
        </ul>
        <div class="back-link">
          <a href="/">← Back to Guessing Form</a>
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Running at http://0.0.0.0:${PORT}`));
