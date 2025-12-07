// Search functionality
let searchPosts = [];
let allTags = new Set();

// Initialize search
function initSearch(posts) {
    searchPosts = posts;
    
    // Collect all tags
    allTags.clear();
    posts.forEach(post => {
        if (Array.isArray(post.tags)) {
            post.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    // Render tag filters
    renderTagFilters();
    
    // Setup search input listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// Render tag filters
function renderTagFilters() {
    const tagFilter = document.getElementById('tag-filter');
    if (!tagFilter) return;
    
    tagFilter.innerHTML = '';
    
    const sortedTags = Array.from(allTags).sort();
    sortedTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => toggleTag(tag));
        tagFilter.appendChild(tagElement);
    });
}

// Toggle tag filter
let activeTags = new Set();

function toggleTag(tag) {
    if (activeTags.has(tag)) {
        activeTags.delete(tag);
    } else {
        activeTags.add(tag);
    }
    
    updateTagUI();
    handleSearch();
}

function updateTagUI() {
    const tagElements = document.querySelectorAll('#tag-filter .tag');
    tagElements.forEach(element => {
        const tag = element.textContent;
        if (activeTags.has(tag)) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let filteredPosts = searchPosts;
    
    // Filter by search query
    if (query) {
        filteredPosts = filteredPosts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(query);
            const excerptMatch = post.excerpt.toLowerCase().includes(query);
            const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(query));
            return titleMatch || excerptMatch || tagMatch;
        });
    }
    
    // Filter by active tags
    if (activeTags.size > 0) {
        filteredPosts = filteredPosts.filter(post => {
            return Array.isArray(post.tags) && 
                   post.tags.some(tag => activeTags.has(tag));
        });
    }
    
    // Trigger custom event for app.js to handle rendering
    const event = new CustomEvent('searchResults', { detail: filteredPosts });
    document.dispatchEvent(event);
}

