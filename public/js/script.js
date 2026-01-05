const socket = io();

const CURRENT_USER_ID = Number(document.body.dataset.currentUserId) || null;

function openModal(id) {
  document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

window.onclick = function (event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};

let currentPostIdForReaction = null;

async function openReactionPicker(postId) {
  currentPostIdForReaction = postId;
  openModal('reaction-picker-modal');

  const list = document.getElementById('reaction-list');
  list.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch('/api/reactions/types');
    const types = await res.json();

    list.innerHTML = '';
    types.forEach((type) => {
      const div = document.createElement('div');
      div.className = 'reaction-item';
      div.innerHTML = `<img src="${type.image_url}" alt="${type.name}" title="${type.name}">`;
      div.onclick = () => {
        socket.emit('toggle_reaction', { postId: currentPostIdForReaction, typeId: type.id });
        closeModal('reaction-picker-modal');
      };
      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p>Error loading reactions</p>';
  }
}

function toggleReaction(postId, typeId) {
  if (!CURRENT_USER_ID) {
    alert('Please sign in to react');
    return;
  }
  socket.emit('toggle_reaction', { postId, typeId });
}

socket.on('update_reactions', (data) => {
  const { postId, reactions } = data;
  const container = document.getElementById(`reactions-${postId}`);

  if (container) {
    const badges = container.querySelectorAll('.reaction-badge');
    badges.forEach((b) => b.remove());

    const btn = container.querySelector('.btn-add-reaction');

    reactions.forEach((reaction) => {
      const isReactedByMe = reaction.user_ids.includes(CURRENT_USER_ID);

      const div = document.createElement('div');
      div.className = `reaction-badge ${isReactedByMe ? 'reacted' : ''}`;
      div.style.cursor = 'pointer';
      div.onclick = () => toggleReaction(postId, reaction.id);

      div.innerHTML = `
        <img src="${reaction.image_url}" alt="${reaction.name}">
        <span>${reaction.count}</span>
      `;
      container.insertBefore(div, btn);
    });
  }
});

socket.on('new_post', (post) => {
  const timeline = document.getElementById('timeline-container');
  const noPostsMsg = document.getElementById('no-posts-msg');

  if (noPostsMsg) {
    noPostsMsg.remove();
  }

  const existingPost = document.querySelector(`.post-card[data-user-id="${post.user_id}"]`);
  if (existingPost) {
    existingPost.remove();
  }

  const postDate = new Date(post.created_at).toLocaleString();
  const avatarHtml = post.profile_image_url ? `<img src="${post.profile_image_url}" alt="${post.username}" class="post-avatar" />` : `<div class="post-avatar-placeholder">${post.username.charAt(0).toUpperCase()}</div>`;

  const safeContent = escapeHtml(post.content);

  const newCard = document.createElement('div');
  newCard.className = 'post-card';
  newCard.setAttribute('data-user-id', post.user_id);

  newCard.innerHTML = `
    <div class="post-header">
      <div class="post-user-info">
        ${avatarHtml}
        <span class="post-username">${post.username}</span>
      </div>
      <span class="post-date">${postDate}</span>
    </div>
    <div class="post-content">
      <p>${safeContent}</p>
    </div>
    <div class="post-reactions" id="reactions-${post.id}">
      <button class="btn-add-reaction" onclick="openReactionPicker(${post.id})">+</button>
    </div>
  `;

  const title = timeline.querySelector('h2');
  if (title && title.nextSibling) {
    timeline.insertBefore(newCard, title.nextSibling);
  } else {
    timeline.appendChild(newCard);
  }
});

socket.on('post_success', () => {
  closeModal('post-modal');
  document.getElementById('post-form').reset();
});

socket.on('error_message', (msg) => {
  const errorEl = document.getElementById('post-error');
  if (errorEl) errorEl.innerText = msg;
});

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        document.getElementById('signup-error').innerText = result.error;
      }
    } catch (err) {
      console.error(err);
    }
  });
}

const signinForm = document.getElementById('signin-form');
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signinForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        document.getElementById('signin-error').innerText = result.error;
      }
    } catch (err) {
      console.error(err);
    }
  });
}

const signoutBtn = document.getElementById('signout-btn');
if (signoutBtn) {
  signoutBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(profileForm);

    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        document.getElementById('profile-error').innerText = result.error;
      }
    } catch (err) {
      console.error(err);
    }
  });
}

const postForm = document.getElementById('post-form');
if (postForm) {
  postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = document.getElementById('post-content').value;

    socket.emit('create_post', { content: content });
  });
}

const addReactionTypeForm = document.getElementById('add-reaction-type-form');
if (addReactionTypeForm) {
  addReactionTypeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addReactionTypeForm);

    try {
      const res = await fetch('/api/reactions/types', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        closeModal('add-reaction-type-modal');
        addReactionTypeForm.reset();
        alert('Reaction created!');
      } else {
        alert('Failed to create reaction');
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function escapeHtml(text) {
  if (!text) return text;
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
