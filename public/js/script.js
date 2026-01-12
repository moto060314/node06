const App = {
  Config: {
    socket: io(),
    currentUser: Number(document.body.dataset.currentUserId) || null,
    selectors: {
      postForm: 'post-form',
      signupForm: 'signup-form',
      signinForm: 'signin-form',
      profileForm: 'profile-form',
      addReactionTypeForm: 'add-reaction-type-form',
      timeline: 'timeline-container',
      reactionList: 'reaction-list',
    },
  },

  Utils: {
    escapeHtml(text) {
      if (!text) return text;
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    linkify(text) {
      if (!text) return text;
      const escaped = this.escapeHtml(text);
      return escaped.replace(/(https:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    },

    async postFormData(url, formElement, onSuccess = null) {
      const formData = new FormData(formElement);
      try {
        const res = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          if (onSuccess) onSuccess(res);
          else window.location.reload();
        } else {
          const result = await res.json();
          throw new Error(result.error || 'Request failed');
        }
      } catch (err) {
        console.error(err);
        return err.message;
      }
      return null;
    },

    async postJson(url, data) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          const result = await res.json();
          throw new Error(result.error);
        }
      } catch (err) {
        return err.message;
      }
      return null;
    },
  },

  UI: {
    openModal(id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    },

    closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';

      const modalContent = el.querySelector('.modal-content');
      const form = modalContent ? modalContent.querySelector('form') : null;
      if (form) form.reset();
    },

    showError(elementId, message) {
      const el = document.getElementById(elementId);
      if (el) el.innerText = message;
    },

    createPostCardHtml(post) {
      const postDate = new Date(post.created_at).toLocaleString();
      const avatarHtml = post.profile_image_url ? `<img src="${post.profile_image_url}" alt="${post.username}" class="post-avatar" />` : `<div class="post-avatar-placeholder">${post.username.charAt(0).toUpperCase()}</div>`;

      const safeContent = App.Utils.linkify(post.content);
      const imageHtml = post.image_url ? `<div class="post-image-container"><img src="${post.image_url}" alt="Post Image" class="post-image" /></div>` : '';

      return `
        <div class="post-header">
          <div class="post-user-info">
            ${avatarHtml}
            <span class="post-username">${post.username}</span>
          </div>
          <span class="post-date">${postDate}</span>
        </div>
        <div class="post-content">
          <p>${safeContent}</p>
          ${imageHtml}
        </div>
        <div class="post-reactions" id="reactions-${post.id}">
          <button class="btn-add-reaction" onclick="window.Actions.openReactionPicker(${post.id})">+</button>
        </div>
      `;
    },

    prependPostToTimeline(post) {
      const timeline = document.getElementById(App.Config.selectors.timeline);
      const noPostsMsg = document.getElementById('no-posts-msg');
      if (noPostsMsg) noPostsMsg.remove();

      const existingPost = document.querySelector(`.post-card[data-user-id="${post.user_id}"]`);
      if (existingPost) existingPost.remove();

      const newCard = document.createElement('div');
      newCard.className = 'post-card';
      newCard.setAttribute('data-user-id', post.user_id);
      newCard.innerHTML = this.createPostCardHtml(post);

      const title = timeline.querySelector('h2');
      if (title && title.nextSibling) {
        timeline.insertBefore(newCard, title.nextSibling);
      } else {
        timeline.appendChild(newCard);
      }
    },

    updateReactions(postId, reactions) {
      const container = document.getElementById(`reactions-${postId}`);
      if (!container) return;

      const badges = container.querySelectorAll('.reaction-badge');
      badges.forEach((b) => b.remove());

      const btn = container.querySelector('.btn-add-reaction');

      reactions.forEach((reaction) => {
        const isReactedByMe = reaction.user_ids.includes(App.Config.currentUser);
        const div = document.createElement('div');
        div.className = `reaction-badge ${isReactedByMe ? 'reacted' : ''}`;
        div.style.cursor = 'pointer';
        div.dataset.title = reaction.name;
        div.onclick = () => window.Actions.toggleReaction(postId, reaction.id);

        div.innerHTML = `
          <img src="${reaction.image_url}" alt="${reaction.name}">
          <span>${reaction.count}</span>
        `;
        container.insertBefore(div, btn);
      });
    },

    renderReactionPicker(types, postId) {
      const list = document.getElementById(App.Config.selectors.reactionList);
      list.innerHTML = '';

      types.forEach((type) => {
        const div = document.createElement('div');
        div.className = 'reaction-item';
        div.innerHTML = `<img src="${type.image_url}" alt="${type.name}" title="${type.name}">`;
        div.onclick = () => {
          App.Config.socket.emit('toggle_reaction', { postId, typeId: type.id });
          this.closeModal('reaction-picker-modal');
        };
        list.appendChild(div);
      });
    },
  },

  Actions: {
    currentPostIdForReaction: null,

    async openReactionPicker(postId) {
      this.currentPostIdForReaction = postId;
      App.UI.openModal('reaction-picker-modal');

      const list = document.getElementById(App.Config.selectors.reactionList);
      list.innerHTML = '<p>Loading...</p>';

      try {
        const res = await fetch('/api/reactions/types');
        const types = await res.json();
        App.UI.renderReactionPicker(types, postId);
      } catch (err) {
        console.error(err);
        list.innerHTML = '<p>Error loading reactions</p>';
      }
    },

    toggleReaction(postId, typeId) {
      if (!App.Config.currentUser) {
        alert('Please sign in to react');
        return;
      }
      App.Config.socket.emit('toggle_reaction', { postId, typeId });
    },

    async handleSignOut() {
      try {
        const res = await fetch('/api/auth/signout', { method: 'POST' });
        if (res.ok) window.location.reload();
      } catch (err) {
        console.error(err);
      }
    },
  },

  init() {
    const { socket, selectors } = this.Config;

    socket.on('new_post', (post) => App.UI.prependPostToTimeline(post));

    socket.on('update_reactions', (data) => App.UI.updateReactions(data.postId, data.reactions));

    socket.on('error_message', (msg) => App.UI.showError('post-error', msg));

    const postForm = document.getElementById(selectors.postForm);
    if (postForm) {
      const textarea = document.getElementById('post-content');
      if (textarea) {
        textarea.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            postForm.requestSubmit();
          }
        });
      }

      postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = await App.Utils.postFormData('/api/posts/create', postForm, () => {
          App.UI.closeModal('post-modal');
        });
        if (err) App.UI.showError('post-error', err);
      });
    }

    const signupForm = document.getElementById(selectors.signupForm);
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = await App.Utils.postFormData('/api/auth/signup', signupForm);
        if (err) App.UI.showError('signup-error', err);
      });
    }

    const signinForm = document.getElementById(selectors.signinForm);
    if (signinForm) {
      signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signinForm);
        const data = Object.fromEntries(formData.entries());
        const err = await App.Utils.postJson('/api/auth/signin', data);
        if (err) App.UI.showError('signin-error', err);
      });
    }

    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
      signoutBtn.addEventListener('click', App.Actions.handleSignOut);
    }

    const profileForm = document.getElementById(selectors.profileForm);
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = await App.Utils.postFormData('/api/auth/update', profileForm);
        if (err) App.UI.showError('profile-error', err);
      });
    }

    const addReactionTypeForm = document.getElementById(selectors.addReactionTypeForm);
    if (addReactionTypeForm) {
      addReactionTypeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = await App.Utils.postFormData('/api/reactions/types', addReactionTypeForm, () => {
          App.UI.closeModal('add-reaction-type-modal');
          alert('Reaction created!');
        });
        if (err) alert('Failed to create reaction');
      });
    }

    window.onclick = function (event) {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
      }
    };
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.openModal = App.UI.openModal;
window.closeModal = App.UI.closeModal;
window.openReactionPicker = (postId) => App.Actions.openReactionPicker(postId);
window.toggleReaction = (postId, typeId) => App.Actions.toggleReaction(postId, typeId);
window.Actions = App.Actions;
