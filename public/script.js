let allPosts = [];
let currentFilter = "Trending";

async function loadPosts() {
  const response = await fetch("/posts");
  const posts = await response.json();

  allPosts = posts;

  applyFilter();
}

function applyFilter() {
  let filtered = allPosts;

  if (currentFilter !== "Trending") {
    filtered = allPosts.filter(post => post.group === currentFilter);
  }

  renderPosts(filtered);
}

function renderPosts(posts) {
  const grid = document.querySelector(".grid");
  grid.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${post.image}" alt="${post.group}">
      <div class="card-content">
        <h2>${post.title}</h2>
        <p>${post.content.substring(0, 180)}...</p>
        <div class="meta">
          ${new Date(post.createdAt).toLocaleString()}
        </div>

        <div class="actions">
          <button class="like-btn" onclick="likePost(${post.id})">
            ❤️ ${post.likes}
          </button>
        </div>

        <div class="comment-box">
          <input 
            placeholder="Escreva um comentário..." 
            onkeydown="if(event.key==='Enter') addComment(${post.id}, this)"
          >
        </div>

        <div>
          ${post.comments.map(c => `
            <div class="comment">
              ${c.text}
            </div>
          `).join("")}
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