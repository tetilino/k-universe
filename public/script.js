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

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${post.image}" />
      <div class="card-content">
        <h2>${post.title}</h2>
        <p>${post.content.substring(0, 150)}...</p>
        <div class="meta">
          ${new Date(post.createdAt).toLocaleString()}
        </div>

        <button class="like-btn" onclick="likePost(${post.id})">
          ❤️ ${post.likes}
        </button>

        <div class="comment-section">
          <input class="comment-input" 
            placeholder="Comentar..."
            onkeydown="if(event.key==='Enter') addComment(${post.id}, this.value)"
          />
          ${post.comments.map(c => `<p>💬 ${c.text}</p>`).join("")}
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
  const filtered = allPosts.filter(p => p.group === group);
  renderPosts(filtered);
}

setInterval(loadPosts, 10000);
loadPosts();