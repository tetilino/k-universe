const cron = require("node-cron");
require("dotenv").config();
const Groq = require("groq-sdk");
const Post = require("./models/Post");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const groups = [
  "ILLIT",
  "BLACKPINK",
  "TWICE",
  "UNIS",
  "hearts2Hearts",
  "KiiiKiii"
];

// 🔹 Gera notícia REAL com IA
async function generateNews(group) {
  try {
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
      model: "llama-3.3-70b-versatile"
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("Erro na IA:", error.message);
    throw error;
  }
}

// 🔹 Salva no MongoDB
async function createPost(group) {
  try {
    const news = await generateNews(group);

    const lines = news.split("\n");
    const title = lines[0]?.trim() || "Sem título";
    const content = lines.slice(1).join("\n").trim() || news;

    const post = new Post({
      group,
      title,
      content,
      // ✅ imagem dinâmica correta (AGORA no lugar certo)
      image: `https://source.unsplash.com/400x250/?kpop,${group}`
    });

    await post.save();

    console.log("✅ Notícia REAL salva para:", group);

  } catch (error) {
    console.error("❌ Erro ao criar post:", error.message);
  }
}

// 🔹 TESTE MANUAL (pode apagar depois)
createPost("TWICE");

// 🔹 CRON automático (1 vez por hora)
cron.schedule("0 * * * *", async () => {
  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  await createPost(randomGroup);
});