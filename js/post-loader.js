// Post loader and markdown parser
let currentPost = null;

// Configure marked
if (typeof marked !== "undefined") {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
}

// Load post from URL parameter
async function loadPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const filename = urlParams.get("file");

  if (!filename) {
    showError("게시글 파일명이 지정되지 않았습니다.");
    return;
  }

  try {
    const response = await fetch(`pages/${filename}`);
    if (!response.ok) {
      throw new Error("Failed to load post");
    }

    let content = await response.text();

    // UTF-8 BOM 제거 (Windows 호환)
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    // Parse Front Matter
    const frontMatterMatch = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
    );
    let metadata = {};
    let postContent = content;

    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      postContent = frontMatterMatch[2];

      // Parse Front Matter lines
      const lines = frontMatter.split(/\r?\n/);
      lines.forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();

          // Remove quotes
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          // Parse arrays (tags)
          if (key === "tags" && value.startsWith("[") && value.endsWith("]")) {
            try {
              value = JSON.parse(value);
            } catch {
              value = value
                .slice(1, -1)
                .split(",")
                .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""));
            }
          }

          metadata[key] = value;
        }
      });
    }

    currentPost = {
      filename: filename,
      metadata: metadata,
      content: postContent,
    };

    renderPost();
    loadGiscus();
  } catch (error) {
    console.error("Error loading post:", error);
    showError("게시글을 불러올 수 없습니다.");
  }
}

// Render post
function renderPost() {
  const container = document.getElementById("post-container");
  if (!container || !currentPost) return;

  const { metadata, content } = currentPost;

  // Convert markdown to HTML
  const htmlContent =
    typeof marked !== "undefined"
      ? marked.parse(content)
      : `<pre>${escapeHtml(content)}</pre>`;

  // Render tags
  const tagsHTML =
    Array.isArray(metadata.tags) && metadata.tags.length > 0
      ? `<div class="post-tags">${metadata.tags
          .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
          .join("")}</div>`
      : "";

  const categoryHTML = metadata.category
    ? `<span>카테고리: ${escapeHtml(metadata.category)}</span>`
    : "";

  container.innerHTML = `
        <article class="post-content">
            <div class="post-header">
                <h1>${escapeHtml(
                  metadata.title || currentPost.filename.replace(".md", "")
                )}</h1>
                <div class="post-meta">
                    <span>${escapeHtml(
                      metadata.date || new Date().toISOString().split("T")[0]
                    )}</span>
                    ${categoryHTML}
                </div>
                ${tagsHTML}
            </div>
            <div class="post-body">
                ${htmlContent}
            </div>
        </article>
    `;

  // Update page title
  document.title = `${metadata.title || "게시글"} - 블로그`;

  // Highlight code blocks with Prism
  if (typeof Prism !== "undefined") {
    Prism.highlightAll();
  }
}

// Load Giscus
function loadGiscus() {
  const container = document.getElementById("giscus-container");
  if (!container || !currentPost) return;

  // Remove existing script if any
  const existingScript = document.querySelector('script[src*="giscus"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Clear container to remove old Giscus widget
  container.innerHTML = "";

  // Get filename as unique identifier for each post
  const fileName = currentPost.filename.replace(".md", "");
  const postIdentifier = fileName || "default";

  // Create Giscus script
  // IMPORTANT: Use 'specific' mapping with filename as term
  // This ensures each post gets its own discussion thread based on the filename
  // Example: 2025-frontend-trends.md → term="2025-frontend-trends"
  //          example.md → term="example"
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", "imgruit/imgruit.github.io");
  script.setAttribute("data-repo-id", "R_kgDOQj-72g");
  script.setAttribute("data-category", "General");
  script.setAttribute("data-category-id", "DIC_kwDOQj-72s4CzfIV");
  // Use 'specific' mapping with filename as unique term
  // The Discussion title in GitHub must match this term exactly
  script.setAttribute("data-mapping", "specific");
  script.setAttribute("data-term", postIdentifier);
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "1");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", "preferred_color_scheme");
  script.setAttribute("data-lang", "ko");
  script.setAttribute("crossorigin", "anonymous");
  script.async = true;

  container.appendChild(script);
}

// Show error
function showError(message) {
  const container = document.getElementById("post-container");
  if (container) {
    container.innerHTML = `<p class="loading">${escapeHtml(message)}</p>`;
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadPost);
} else {
  loadPost();
}
