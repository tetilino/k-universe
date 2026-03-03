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
// 🔹 CACHE DE NOTÍCIAS
// ===============================
let groupCache = {};
const CACHE_TIME = 1000 * 60 * 5;

const groups = [
  "illit",
  "blackpink",
  "twice",
  "unis",
  "hearts2hearts",
  "kiiikiii"
];

// ===============================
// 🔹 IMAGENS FIXAS POR GRUPO
// ===============================
// Imagens escolhidas manualmente que representam cada grupo
const groupImages = {
  illit: "/images/illit.jpg",
  blackpink: "/images/blackpink.jpg",
  twice: "/images/twice.jpg",
  unis: "/images/unis.jpg",
  hearts2hearts: "/images/hearts2hearts.jpg",
  kiiikiii: "/images/kiiikiii.jpg"
};
// Imagem padrão se faltar
const defaultImage = "/images/default.jpg";

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
    if (posts.length > 12) posts.pop();

    console.log("✅ Post criado:", group);
  } catch (err) {
    console.error("❌ Erro ao gerar notícia:", err.message);
  }
}

// ===============================
// 🔹 LISTAR POSTS (COM IMAGEM CORRETA)
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
// 🔹 REGISTRAR VIEWS
// ===============================
app.post("/view/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  post.views++;
  post.popularity = post.views + post.likes * 2;
  res.json({ success: true });
});

// ===============================
// 🔹 CURTIR
// ===============================
app.post("/like/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  post.likes++;
  post.popularity = post.views + post.likes * 2;
  res.json({ success: true });
});

// ===============================
// 🔹 COMENTÁRIOS
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
// 🔹 POSTS INICIAIS AO INICIAR
// ===============================
async function generateInitialPosts() {
  for (let i = 0; i < 4; i++) {
    const randomGroup =
      groups[Math.floor(Math.random() * groups.length)];
    await createPost(randomGroup);
  }
}

// ===============================
// 🔹 INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log("🚀 Servidor rodando na porta", PORT);
  if (posts.length === 0) await generateInitialPosts();
});

// ===============================
// 🔹 GERAÇÃO AUTOMÁTICA
// ===============================
setInterval(() => {
  const randomGroup =
    groups[Math.floor(Math.random() * groups.length)];
  createPost(randomGroup);
}, 60000);