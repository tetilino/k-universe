let allPosts = [];
let currentFilter = "Trending";

async function loadPosts() {
  try {
    const response = await fetch("/posts");
    const posts = await response.json();

    allPosts = posts;
    applyFilter();
  } catch (err) {
    console.error("Erro ao carregar posts:", err);
  }
}

function applyFilter() {
  let filtered = allPosts;

  if (currentFilter !== "Trending") {
    filtered = allPosts.filter(
      post => post.group === currentFilter
    );
  }

  renderPosts(filtered);
}

function renderPosts(posts) {
  const grid = document.querySelector(".grid");
  grid.innerHTML = "";

  if (!posts.length) {
    grid.innerHTML = "<p style='text-align:center'>Nenhuma notícia encontrada.</p>";
    return;
  }

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="image-wrapper">
        <img 
          src="${post.image}" 
          alt="${post.group}"
          onerror="this.onerror=null;this.src='/images/default.jpg';"
        >
        <span class="badge">${post.group}</span>
      </div>

      <div class="card-content">
        <h2>${post.title}</h2>

        <p>${post.content.substring(0, 200)}...</p>

        <div class="meta">
          🕒 ${new Date(post.createdAt).toLocaleString()}
          • 👁 ${post.views}
        </div>

        <div class="actions">
          <button class="like-btn" onclick="likePost(${post.id})">
            ❤️ ${post.likes}
          </button>
        </div>

        <div class="comment-box">
          <input 
            type="text"
            placeholder="Escreva um comentário..."
            onkeydown="if(event.key==='Enter') addComment(${post.id}, this)"
          >
        </div>

        <div class="comments">
          ${post.comments
            .map(c => `
              <div class="comment">
                ${c.text}
              </div>
            `)
            .join("")}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

async function likePost(id) {
  await fetch(`/like/${id}`, { method: "POST" });
  loadPosts();
}

async function addComment(id, input) {
  if (!input.value.trim()) return;

  await fetch(`/comment/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input.value })
  });

  input.value = "";
  loadPosts();
}

function setFilter(group) {
  currentFilter = group;
  applyFilter();
}

loadPosts();
setInterval(loadPosts, 10000);