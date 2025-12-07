// Main application logic
let allPosts = [];

// Load posts from posts.json
async function loadPosts() {
    try {
        const response = await fetch('posts.json');
        if (!response.ok) {
            throw new Error('Failed to load posts.json');
        }
        allPosts = await response.json();
        
        // Initialize search with posts
        if (typeof initSearch === 'function') {
            initSearch(allPosts);
        }
        
        // Render initial posts
        renderPosts(allPosts);
        
        // Listen for search results
        document.addEventListener('searchResults', (e) => {
            renderPosts(e.detail);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        const container = document.getElementById('posts-container');
        if (container) {
            container.innerHTML = '<p class="loading">게시글을 불러올 수 없습니다.</p>';
        }
    }
}

// Render posts
function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = '<p class="loading">게시글이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => {
        const tagsHTML = Array.isArray(post.tags) && post.tags.length > 0
            ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
            : '';
        
        const categoryHTML = post.category
            ? `<span>카테고리: ${escapeHtml(post.category)}</span>`
            : '';
        
        return `
            <article class="post-card" onclick="window.location.href='post.html?file=${encodeURIComponent(post.file)}'">
                <h2><a href="post.html?file=${encodeURIComponent(post.file)}">${escapeHtml(post.title)}</a></h2>
                <div class="post-meta">
                    <span>${escapeHtml(post.date)}</span>
                    ${categoryHTML}
                </div>
                ${tagsHTML}
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
            </article>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPosts);
} else {
    loadPosts();
}

