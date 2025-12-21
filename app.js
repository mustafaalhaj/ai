// State
let currentCategory = 'All';
let searchQuery = '';
let filteredTools = [...toolsData];
let itemsToShow = 50; // Initial load count

// DOM Elements
const toolsGrid = document.querySelector('.tools-grid');
const searchInput = document.querySelector('.search-input');

// Global error handler for images to prevent infinite loops and improve performance
window.handleImageError = function (img) {
    // Prevent re-triggering
    img.onerror = null;

    // Use a simple data URL placeholder (1x1 transparent pixel)
    // This prevents any network request and DOM manipulation
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%231a1a1a" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="40"%3E🤖%3C/text%3E%3C/svg%3E';
    img.style.objectFit = 'contain';
};
const categoryFilters = document.getElementById('categoryFilters');
const noResults = document.getElementById('noResults');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const surpriseMeBtn = document.getElementById('surpriseMeBtn');
const visitorCountEl = document.getElementById('visitorCount');

// Helper: Get Logo URL from tool URL using Clearbit API
function getLogoUrl(toolUrl) {
    try {
        const urlObj = new URL(toolUrl);
        const hostname = urlObj.hostname;
        return `https://logo.clearbit.com/${hostname}`;
    } catch (e) {
        return 'https://placehold.co/400x300/101010/FFF?text=AI';
    }
}

// Initialize
function init() {
    updateCategoryCounts();
    filterAndRender(); // Initial render
    setupEventListeners();
    initVisitorCounter();
}

// Update Category Counts
function updateCategoryCounts() {
    // Count tools per category
    const counts = {};
    toolsData.forEach(tool => {
        counts[tool.category] = (counts[tool.category] || 0) + 1;
    });

    // Update 'All' button
    const allBtn = categoryFilters.querySelector('[data-category="All"]');
    if (allBtn) allBtn.innerHTML = `All <span class="count-badge">${toolsData.length}</span>`;

    // Update other buttons
    Object.keys(counts).forEach(cat => {
        const btn = categoryFilters.querySelector(`[data-category="${cat}"]`);
        if (btn) {
            btn.innerHTML = `${cat} <span class="count-badge">${counts[cat]}</span>`;
        }
    });
}

// Simulated Visitor Counter
function initVisitorCounter() {
    // Safety check - exit if element doesn't exist
    if (!visitorCountEl) {
        return;
    }

    let count = localStorage.getItem('ladoo_visitor_count');

    if (!count) {
        count = 15432; // Startup fake number
    } else {
        count = parseInt(count);
    }

    // Increment on load
    count += Math.floor(Math.random() * 3) + 1;

    // Save
    localStorage.setItem('ladoo_visitor_count', count);

    // Display with comma
    visitorCountEl.innerText = count.toLocaleString();
}

// Event Listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        itemsToShow = 50;
        filterAndRender();
    });

    // Category filters
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.closest('.filter-btn')) {
            const btn = e.target.closest('.filter-btn');
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentCategory = btn.dataset.category;
            itemsToShow = 50;
            filterAndRender();
        }
    });

    // Load More Button
    loadMoreBtn.addEventListener('click', () => {
        itemsToShow += 50;
        renderTools();
    });

    // Surprise Me Button
    surpriseMeBtn.addEventListener('click', () => {
        const randomTool = toolsData[Math.floor(Math.random() * toolsData.length)];
        window.open(randomTool.url, '_blank');
    });

    // Scroll to Top visibility (Optimized)
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 300) {
                    scrollTopBtn.classList.add('visible');
                } else {
                    scrollTopBtn.classList.remove('visible');
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mouse Trail Effect (Optimized)
    let lastX = 0;
    let lastY = 0;
    let isThrottled = false;

    document.addEventListener('mousemove', (e) => {
        if (!isThrottled) {
            window.requestAnimationFrame(() => {
                createTrailDot(e.clientX, e.clientY);
                isThrottled = false;
            });
            isThrottled = true;
        }
    }, { passive: true });
}

// Mouse Trail Logic
function createTrailDot(x, y) {
    const dot = document.createElement('div');
    dot.classList.add('trail-dot');
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    document.body.appendChild(dot);

    // Remove faster to prevent DOM bloat
    setTimeout(() => {
        dot.remove();
    }, 800);
}

// Share Functions
window.shareOnTwitter = function (name, url) {
    const text = `Check out ${name} on Project Ladoo - The ultimate AI directory!`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
};

window.shareOnWhatsApp = function (name, url) {
    const text = `Check out ${name}: ${url}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
};

// Filter tools logic
function filterAndRender() {
    filteredTools = toolsData.filter(tool => {
        const matchesCategory = currentCategory === 'All' || tool.category === currentCategory;
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery) ||
            tool.description.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    renderTools();
}

// Render tools
function renderTools() {
    if (filteredTools.length === 0) {
        toolsGrid.style.display = 'none';
        noResults.style.display = 'block';
        loadMoreContainer.style.display = 'none';
        return;
    } else {
        toolsGrid.style.display = 'grid';
        noResults.style.display = 'none';
    }

    const toolsToRender = filteredTools.slice(0, itemsToShow);

    toolsGrid.innerHTML = toolsToRender.map((tool, index) => {
        // Use image from data if available, otherwise fallback to Clearbit
        const logoUrl = tool.image || getLogoUrl(tool.url);
        const hotBadge = tool.hot ? '<span class="hot-badge">HOT</span>' : '';

        return `
        <div class="tool-card" style="animation-delay: ${index * 0.05}s">
            ${hotBadge}
            <div class="tool-image-wrapper">
                <img 
                    src="${logoUrl}" 
                    alt="${tool.name}" 
                    class="tool-image"
                    loading="lazy"
                    onerror="handleImageError(this)"
                >
                <span class="tool-category-badge">${tool.category}</span>
            </div>
            <div class="tool-content">
                <h3 class="tool-title">${tool.name}</h3>
                <p class="tool-description">${tool.description}</p>
            </div>
            <div class="tool-footer">
                <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="tool-link">
                    Visit Site
                </a>
                <div class="share-actions">
                    <button class="share-btn twitter" onclick="shareOnTwitter('${tool.name}', '${tool.url}')" title="Share on Twitter" aria-label="Share on Twitter">
                        𝕏
                    </button>
                    <button class="share-btn whatsapp" onclick="shareOnWhatsApp('${tool.name}', '${tool.url}')" title="Share on WhatsApp" aria-label="Share on WhatsApp">
                        📱
                    </button>
                </div>
            </div>
        </div>
    `}).join('');

    if (filteredTools.length > itemsToShow) {
        loadMoreContainer.style.display = 'block';
        const remaining = filteredTools.length - itemsToShow;
        loadMoreBtn.innerText = `Load More (${remaining} left)`;
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', init);
