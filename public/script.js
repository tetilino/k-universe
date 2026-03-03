let allPosts = [];

async function loadPosts() {
  try {
    const response = await fetch("/posts");
    const posts = await response.json();

    allPosts = posts;
    renderPosts(posts);

  } catch (error) {
    console.error("Erro ao carregar posts:", error);
  }
}

function renderPosts(posts) {
  const container = document.getElementById("feed"); // 🔥 corrigido (era "posts")
  container.innerHTML = "";

  posts.forEach((post, index) => {

    const card = document.createElement("div");

    card.style.background = "rgba(255,255,255,0.1)";
    card.style.padding = "20px";
    card.style.margin = "20px auto";
    card.style.borderRadius = "15px";
    card.style.maxWidth = "600px";
    card.style.color = "white";
    card.style.transition = "0.4s";
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    // 🔥 Medalha para o mais popular
    const medal = index === 0 ? "🔥 Mais Popular" : "";

    card.innerHTML = `
      <h2>${post.title}</h2>
      <small style="color: #ffd700;">${medal}</small>
      <img src="${post.image}" style="width:100%; border-radius:10px; margin:10px 0;">
      <p>${post.content}</p>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <button onclick="likePost(${post.id})" 
          style="background:#ff4d6d; border:none; padding:8px 15px; border-radius:8px; color:white; cursor:pointer;">
          ❤️ ${post.likes}
        </button>

        <span>👁 ${post.views}</span>
      </div>

      <small style="opacity:0.7;">${new Date(post.createdAt).toLocaleString()}</small>
    `;

    container.appendChild(card);

    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 50);
  });
}

// 🔥 Curtir post
async function likePost(id) {
  await fetch(`/like/${id}`, { method: "POST" });
  loadPosts();
}

// 🔥 Filtro por grupo
function filterGroup(group) {
  const filtered = allPosts.filter(post => post.group === group);
  renderPosts(filtered);
}

// 🔥 Atualiza automaticamente
setInterval(loadPosts, 5000);

// 🔥 Primeira carga
loadPosts();