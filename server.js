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
const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

const groups = [
  "ILLIT",
  "BLACKPINK",
  "TWICE",
  "UNIS",
  "hearts2Hearts",
  "KiiiKiii"
];

// ===============================
// 🔹 GERAR NOTÍCIA COM CACHE
// ===============================
async function generateNews(group) {
  const now = Date.now();

  // Se ainda está no cache
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

  // Salva no cache
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

    const lines = news.split("\n").filter(line => line.trim() !== "");
    const title = lines[0] || "Sem título";
    const content = lines.slice(1).join("\n") || news;

    const post = {
      id: Date.now(),
      group,
      title: title.trim(),
      content: content.trim(),
      image: `https://source.unsplash.com/400x250/?kpop,${group}`,
      createdAt: new Date(),
      likes: 0,
      views: 0,
      popularity: 0
    };

    posts.unshift(post);

    // Mantém apenas 10 posts
    if (posts.length > 10) {
      posts.pop();
    }

    console.log("✅ Post criado:", group);

  } catch (err) {
    console.error("❌ Erro ao gerar notícia:", err.message);
  }
}

// ===============================
// 🔹 LISTAR POSTS (SEM INFLAR VIEWS)
// ===============================
app.get("/posts", (req, res) => {
  const sortedPosts = [...posts].sort(
    (a, b) => b.popularity - a.popularity
  );

  res.json(sortedPosts);
});

// ===============================
// 🔹 REGISTRAR VISUALIZAÇÃO
// ===============================
app.post("/view/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);

  if (post) {
    post.views += 1;
    post.popularity = post.likes * 2 + post.views;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Post não encontrado" });
  }
});

// ===============================
// 🔹 CURTIR POST
// ===============================
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

// ===============================
// 🔹 GERAR MANUALMENTE
// ===============================
app.get("/generate", async (req, res) => {
  const randomGroup =
    groups[Math.floor(Math.random() * groups.length)];

  await createPost(randomGroup);

  res.json({ message: "Post gerado com sucesso!" });
});

// ===============================
// 🔹 GERAR POSTS INICIAIS
// ===============================
async function generateInitialPosts() {
  for (let i = 0; i < 3; i++) {
    const randomGroup =
      groups[Math.floor(Math.random() * groups.length)];

    await createPost(randomGroup);
  }
}

// ===============================
// 🔹 PORTA (RENDER READY)
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("🚀 Servidor rodando na porta", PORT);
  await generateInitialPosts();
});

// ===============================
// 🔹 GERAÇÃO AUTOMÁTICA
// ===============================
setInterval(() => {
  const randomGroup =
    groups[Math.floor(Math.random() * groups.length)];

  createPost(randomGroup);
}, 30000);