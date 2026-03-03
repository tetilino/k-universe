let allPosts = [];

// =============================
// 🔹 CARREGAR POSTS
// =============================
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

// =============================
// 🔹 RENDERIZAR POSTS
// =============================
function renderPosts(posts) {
  const container = document.getElementById("feed");
  container.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("div");

    card.style.background = "rgba(255,255,255,0.1)";
    card.style.padding = "20px";
    card.style.margin = "20px auto";
    card.style.borderRadius = "15px";
    card.style.maxWidth = "600px";
    card.style.color = "white";

    card.innerHTML = `
      <h2>${post.title}</h2>
      <img src="${post.image}" style="width:100%; border-radius:10px; margin:10px 0;">
      <p>${post.content}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <button onclick="likePost(${post.id})" style="padding:6px 12px; border:none; border-radius:8px; cursor:pointer;">
          ❤️ ${post.likes}
        </button>
        <small>${new Date(post.createdAt).toLocaleString()}</small>
      </div>
    `;

    container.appendChild(card);

    // 🔥 Registra visualização
    fetch(`/view/${post.id}`, { method: "POST" });
  });
}

// =============================
// 🔹 CURTIR POST
// =============================
async function likePost(id) {
  await fetch(`/like/${id}`, { method: "POST" });
  loadPosts();
}

// =============================
// 🔹 FILTRO
// =============================
function filterGroup(group) {
  const filtered = allPosts.filter(post => post.group === group);
  renderPosts(filtered);
}

// =============================
// 🔹 AUTO REFRESH
// =============================
setInterval(loadPosts, 10000);

// Primeira carga
loadPosts();