require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// 🔹 Armazenamento em memória
let posts = [];

// 🔹 Cache inteligente
let groupCache = {};
const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

const groups = [
  "ILLIT",
  "BLACKPINK",
  "TWICE",
  "UNIS",
  "hearts2Hearts",
  "KiiiKiii"
];


// 🔹 Gerar notícia com cache
async function generateNews(group) {
  const now = Date.now();

  // 🔥 Se ainda está no cache
  if (
    groupCache[group] &&
    now - groupCache[group].timestamp < CACHE_TIME
  ) {
    console.log("⚡ Usando cache para:", group);
    return groupCache[group].content;
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Crie uma notícia curta e criativa sobre o grupo ${group}.
Separe o título na primeira linha e o conteúdo abaixo.
Escreva como um portal profissional de entretenimento.
Não use emojis.`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.9
  });

  const content = completion.choices[0].message.content;

  // 🔥 Salva no cache
  groupCache[group] = {
    content,
    timestamp: now
  };

  return content;
}


// 🔹 Criar post
async function createPost(group) {
  try {
    const news = await generateNews(group);

    const lines = news.split("\n");
    const title = lines[0]?.trim() || "Sem título";
    const content = lines.slice(1).join("\n").trim() || news;

    const post = {
      id: Date.now(),
      group,
      title,
      content,
      image: `https://source.unsplash.com/400x250/?kpop,${group}`,
      createdAt: new Date(),
      likes: 0,
      views: 0,
      popularity: 0
    };

    posts.unshift(post);

    // 🔥 Mantém só 10 posts
    if (posts.length > 10) {
      posts.pop();
    }

    console.log("✅ Post criado:", group);

  } catch (err) {
    console.error("❌ Erro ao gerar notícia:", err.message);
  }
}


// 🔹 Listar posts com ranking
app.get("/posts", (req, res) => {

  posts.forEach(post => {
    post.views += 1;
    post.popularity = post.likes * 2 + post.views;
  });

  const sortedPosts = [...posts].sort((a, b) => b.popularity - a.popularity);

  res.json(sortedPosts);
});


// 🔹 Curtir post
app.post("/like/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);

  if (post) {
    post.likes += 1;
    post.popularity = post.likes * 2 + post.views;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Post não encontrado" });
  }
});


// 🔹 Gerar manualmente
app.get("/generate", async (req, res) => {
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  await createPost(randomGroup);
  res.json({ message: "Post gerado com sucesso!" });
});


// 🔥 Gera 3 posts iniciais
async function generateInitialPosts() {
  for (let i = 0; i < 3; i++) {
    const randomGroup = groups[Math.floor(Math.random() * groups.length)];
    await createPost(randomGroup);
  }
}


// 🔹 Porta para deploy
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("🚀 Servidor rodando na porta", PORT);
  await generateInitialPosts();
});


// 🔥 Geração automática
setInterval(() => {
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  createPost(randomGroup);
}, 30000);