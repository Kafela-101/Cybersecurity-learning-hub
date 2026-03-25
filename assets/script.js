const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");
const typingText = document.getElementById("typingText");
const blogContainer = document.getElementById("blogContainer");
const adminPostPreview = document.getElementById("adminPostPreview");
const blogForm = document.getElementById("blogForm");
const loadDemoPostsBtn = document.getElementById("loadDemoPosts");
const clearPostsBtn = document.getElementById("clearPosts");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.classList.add("light-theme");
}
updateThemeButton();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    updateThemeButton();
  });
}

function updateThemeButton() {
  const btns = document.querySelectorAll("#themeToggle");
  btns.forEach((btn) => {
    btn.textContent = document.body.classList.contains("light-theme") ? "☀️" : "🌙";
  });
}

const typingWords = [
  "Learn safely.",
  "Build your portfolio.",
  "Grow your cyber brand.",
  "Create income-friendly projects."
];

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  if (!typingText) return;

  const currentWord = typingWords[wordIndex];
  typingText.textContent = currentWord.substring(0, charIndex);

  if (!isDeleting && charIndex < currentWord.length) {
    charIndex++;
    setTimeout(typeEffect, 80);
  } else if (isDeleting && charIndex > 0) {
    charIndex--;
    setTimeout(typeEffect, 40);
  } else {
    isDeleting = !isDeleting;
    if (!isDeleting) {
      wordIndex = (wordIndex + 1) % typingWords.length;
    }
    setTimeout(typeEffect, 1000);
  }
}
typeEffect();

const defaultPosts = [
  {
    title: "What is Ethical Hacking?",
    tag: "Basics",
    desc: "A beginner-friendly introduction to ethical hacking, safe learning, and professional cyber growth."
  },
  {
    title: "Top Beginner Cyber Skills",
    tag: "Roadmap",
    desc: "Learn the most important beginner skills like networking, Linux, web basics, and security concepts."
  },
  {
    title: "How to Build a Cyber Portfolio",
    tag: "Portfolio",
    desc: "Turn your GitHub and learning projects into a premium-looking cyber portfolio website."
  }
];

function getPosts() {
  const stored = localStorage.getItem("blogPosts");
  return stored ? JSON.parse(stored) : defaultPosts;
}

function savePosts(posts) {
  localStorage.setItem("blogPosts", JSON.stringify(posts));
}

function renderPosts(targetElement) {
  if (!targetElement) return;

  const posts = getPosts();
  targetElement.innerHTML = "";

  posts.forEach((post, index) => {
    const card = document.createElement("article");
    card.className = "info-card reveal show";
    card.innerHTML = `
      <span class="post-tag">${post.tag}</span>
      <h3>${post.title}</h3>
      <p>${post.desc}</p>
    `;
    targetElement.appendChild(card);
  });

  if (posts.length === 0) {
    targetElement.innerHTML = `
      <article class="info-card">
        <h3>No posts available</h3>
        <p>Add a post from the admin panel.</p>
      </article>
    `;
  }
}

renderPosts(blogContainer);
renderPosts(adminPostPreview);

if (blogForm) {
  blogForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("postTitle").value.trim();
    const tag = document.getElementById("postTag").value.trim();
    const desc = document.getElementById("postDesc").value.trim();

    if (!title || !tag || !desc) return;

    const posts = getPosts();
    posts.unshift({ title, tag, desc });
    savePosts(posts);

    blogForm.reset();
    renderPosts(adminPostPreview);
    alert("Post saved successfully.");
  });
}

if (loadDemoPostsBtn) {
  loadDemoPostsBtn.addEventListener("click", () => {
    savePosts(defaultPosts);
    renderPosts(adminPostPreview);
    alert("Demo posts loaded.");
  });
}

if (clearPostsBtn) {
  clearPostsBtn.addEventListener("click", () => {
    localStorage.removeItem("blogPosts");
    renderPosts(adminPostPreview);
    alert("All local posts cleared.");
  });
}

const revealElements = document.querySelectorAll(".reveal");

function revealOnScroll() {
  revealElements.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 80) {
      el.classList.add("show");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();