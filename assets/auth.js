const supabaseUrl = "https://ezoplhikjtfrizcitpxf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6b3BsaGlranRmcml6Y2l0cHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTg4MDksImV4cCI6MjA5MDE3NDgwOX0.HIuiBxZwpHsSlSo464W7DqC-EUKuYe2rf_yS86HjYhw";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

async function signup() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageBox = document.getElementById("authMessage");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    if (messageBox) messageBox.textContent = "Email এবং password দিতে হবে।";
    return;
  }

  if (password.length < 6) {
    if (messageBox) messageBox.textContent = "Password কমপক্ষে 6 characters হতে হবে।";
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    if (messageBox) messageBox.textContent = error.message;
    return;
  }

  if (messageBox) {
    messageBox.textContent = "Signup successful. Email confirmation লাগতে পারে, তারপর login করো।";
  }
}

async function login() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageBox = document.getElementById("authMessage");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    if (messageBox) messageBox.textContent = "Email এবং password দিতে হবে।";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (messageBox) messageBox.textContent = error.message;
    return;
  }

  if (messageBox) messageBox.textContent = "Login successful...";
  window.location.href = "dashboard.html";
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

async function protectDashboard() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  const user = data.session.user;
  const emailBox = document.getElementById("userEmail");

  if (emailBox) {
    emailBox.textContent = user.email || "User";
  }
}

async function redirectIfLoggedIn() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    window.location.href = "dashboard.html";
  }
}

async function updateHomeAuthUI() {
  const loginNavLink = document.getElementById("loginNavLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const heroLoginBtn = document.getElementById("heroLoginBtn");
  const userStatus = document.getElementById("userStatus");

  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    const user = data.session.user;

    if (loginNavLink) loginNavLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    if (heroLoginBtn) {
      heroLoginBtn.textContent = "Open Dashboard";
      heroLoginBtn.href = "dashboard.html";
    }

    if (userStatus) {
      userStatus.innerHTML = `Status: <span>Logged in as ${user.email}</span>`;
    }
  } else {
    if (loginNavLink) loginNavLink.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";

    if (heroLoginBtn) {
      heroLoginBtn.textContent = "Login / Signup";
      heroLoginBtn.href = "login.html";
    }

    if (userStatus) {
      userStatus.innerHTML = `Status: <span>Not logged in</span>`;
    }
  }
}