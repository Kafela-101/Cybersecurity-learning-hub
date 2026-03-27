const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");
const typingText = document.getElementById("typingText");
const blogContainer = document.getElementById("blogContainer");
const adminPostPreview = document.getElementById("adminPostPreview");
const blogForm = document.getElementById("blogForm");
const loadDemoPostsBtn = document.getElementById("loadDemoPosts");
const clearPostsBtn = document.getElementById("clearPosts");
const threatFeed = document.getElementById("threatFeed");

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
  "Build cyber skills.",
  "Grow professionally.",
  "Create a premium portfolio."
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
    setTimeout(typeEffect, 900);
  }
}
typeEffect();

function getPosts() {
  const stored = localStorage.getItem("blogPosts");
  if (stored) return JSON.parse(stored);
  return window.defaultPosts || [];
}

function savePosts(posts) {
  localStorage.setItem("blogPosts", JSON.stringify(posts));
}

function renderPosts(targetElement) {
  if (!targetElement) return;

  const posts = getPosts();
  targetElement.innerHTML = "";

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "info-card reveal show";
    card.innerHTML = `
      <span class="post-tag">${post.tag}</span>
      <h3>${post.title}</h3>
      <p>${post.desc}</p>
    `;
    targetElement.appendChild(card);
  });

  if (!posts.length) {
    targetElement.innerHTML = `
      <article class="info-card">
        <h3>No posts found</h3>
        <p>Add posts from the admin dashboard.</p>
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
    savePosts(window.defaultPosts || []);
    renderPosts(adminPostPreview);
    alert("Demo posts loaded.");
  });
}

if (clearPostsBtn) {
  clearPostsBtn.addEventListener("click", () => {
    localStorage.removeItem("blogPosts");
    renderPosts(adminPostPreview);
    alert("Local posts cleared.");
  });
}

if (threatFeed) {
  const items = window.threatFeedData || [];
  threatFeed.innerHTML = items.map(item => `<div class="feed-item">${item}</div>`).join("");
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

/* Quiz logic */
const questionText = document.getElementById("questionText");
const quizOptions = document.getElementById("quizOptions");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");
const quizResult = document.getElementById("quizResult");

let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
const questions = window.quizQuestions || [];

function renderQuizQuestion() {
  if (!questionText || !quizOptions || !questions.length) return;

  const current = questions[currentQuestionIndex];
  questionText.textContent = current.question;
  quizOptions.innerHTML = "";
  selectedAnswer = null;

  current.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.type = "button";
    btn.textContent = option;
    btn.addEventListener("click", () => {
      selectedAnswer = option;
      document.querySelectorAll(".quiz-option").forEach((item) => item.classList.remove("selected"));
      btn.classList.add("selected");
    });
    quizOptions.appendChild(btn);
  });

  if (quizResult) quizResult.textContent = "";
}

function finishQuiz() {
  if (!questionText || !quizOptions || !quizResult) return;
  questionText.textContent = "Quiz Completed";
  quizOptions.innerHTML = "";
  quizResult.textContent = `Your score: ${score} / ${questions.length}`;
  if (nextQuestionBtn) nextQuestionBtn.style.display = "none";
}

if (nextQuestionBtn && questions.length) {
  renderQuizQuestion();

  nextQuestionBtn.addEventListener("click", () => {
    if (!selectedAnswer) {
      if (quizResult) quizResult.textContent = "Please select an answer first.";
      return;
    }

    if (selectedAnswer === questions[currentQuestionIndex].answer) {
      score++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  });
}