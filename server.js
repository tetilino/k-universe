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

// ===============================
// 🔹 ARMAZENAMENTO EM MEMÓRIA
// ===============================
let posts = [];

// ===============================
// 🔹 CACHE INTELIGENTE
// ===============================
let groupCache = {};
const CACHE_TIME = 1000 * 60 * 5;

const groups = [
  "ILLIT",
  "BLACKPINK",
  "TWICE",
  "UNIS",
  "hearts2Hearts",
  "KiiiKiii"
];

// ===============================
// 🔥 IMAGENS FIXAS POR GRUPO
// ===============================
const groupImages = {
  ILLIT:
    "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1400&q=80",
  BLACKPINK:
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80",
  TWICE:
    "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1400&q=80",
  UNIS:
    "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1400&q=80",
  hearts2Hearts:
    "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1400&q=80",
  KiiiKiii:
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80"
};

const defaultImage =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80";

// ===============================
// 🔹 GERAR NOTÍCIA COM CACHE
// ===============================
async function generateNews(group) {
  const now = Date.now();

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
Escreva como um portal profissional.
Não use emojis.`
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.9
  });

  const content = completion.choices[0].message.content;

  groupCache[group] = {
    content,
    timestamp: now
  };

  return content;
}

// ===============================
// 🔹 CRIAR POST
// ===============================
async function createPost(group) {
  try {
    const news = await generateNews(group);

    const lines = news.split("\n").filter(l => l.trim() !== "");
    const title = lines[0] || "Sem título";
    const content = lines.slice(1).join("\n") || news;

    const post = {
      id: Date.now(),
      group,
      title,
      content,
      image: groupImages[group] || defaultImage,
      createdAt: new Date(),
      likes: 0,
      views: 0,
      popularity: 0,
      comments: []
    };

    posts.unshift(post);

    if (posts.length > 15) {
      posts.pop();
    }

    console.log("✅ Post criado:", group);

  } catch (err) {
    console.error("❌ Erro ao gerar notícia:", err.message);
  }
}

// ===============================
// 🔹 LISTAR POSTS (FORÇA IMAGEM CORRETA)
// ===============================
app.get("/posts", (req, res) => {
  const sortedPosts = [...posts]
    .sort((a, b) => b.popularity - a.popularity)
    .map(post => ({
      ...post,
      image: groupImages[post.group] || defaultImage
    }));

  res.json(sortedPosts);
});

// ===============================
// 🔹 VIEW
// ===============================
app.post("/view/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  post.views += 1;
  post.popularity = post.likes * 2 + post.views;

  res.json({ success: true });
});

// ===============================
// 🔹 LIKE
// ===============================
app.post("/like/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  post.likes += 1;
  post.popularity = post.likes * 2 + post.views;

  res.json({ success: true });
});

// ===============================
// 🔹 COMMENT
// ===============================
app.post("/comment/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  post.comments.push({
    text: req.body.text,
    date: new Date()
  });

  res.json({ success: true });
});

// ===============================
// 🔹 GERAR MANUAL
// ===============================
app.get("/generate", async (req, res) => {
  const randomGroup =
    groups[Math.floor(Math.random() * groups.length)];

  await createPost(randomGroup);
  res.json({ message: "Post gerado com sucesso!" });
});

// ===============================
// 🔹 POSTS INICIAIS
// ===============================
async function generateInitialPosts() {
  for (let i = 0; i < 4; i++) {
    const randomGroup =
      groups[Math.floor(Math.random() * groups.length)];

    await createPost(randomGroup);
  }
}

// ===============================
// 🔹 PORTA
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("🚀 Servidor rodando na porta", PORT);

  if (posts.length === 0) {
    await generateInitialPosts();
  }
});

// ===============================
// 🔹 GERAÇÃO AUTOMÁTICA
// ===============================
setInterval(() => {
  const randomGroup =
    groups[Math.floor(Math.random() * groups.length)];

  createPost(randomGroup);
}, 60000);