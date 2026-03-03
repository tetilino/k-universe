let allPosts = [];

async function loadPosts() {
  const res = await fetch("/posts");
  const posts = await res.json();
  allPosts = posts;
  renderPosts(posts);
}

function renderPosts(posts) {
  const container = document.getElementById("feed");
  container.innerHTML = "";

  posts.forEach((post, index) => {

    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <img 
        src="${post.image}" 
        alt="${post.group}"
        onerror="this.src='https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80'"
      />

      <div class="card-content">
        <h2>${post.title}</h2>
        <p>${post.content.substring(0, 200)}...</p>

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
            onkeydown="if(event.key==='Enter') addComment(${post.id}, this.value)"
          />

          ${post.comments.map(c => 
            `<div class="comment">💬 ${c.text}</div>`
          ).join("")}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

async function likePost(id) {
  await fetch(`/like/${id}`, { method: "POST" });
  loadPosts();
}

async function addComment(id, text) {
  if (!text) return;

  await fetch(`/comment/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  loadPosts();
}

function filterGroup(group) {
  if (group === "ALL") {
    renderPosts(allPosts);
    return;
  }

  const filtered = allPosts.filter(p => p.group === group);
  renderPosts(filtered);
}

setInterval(loadPosts, 10000);
loadPosts();