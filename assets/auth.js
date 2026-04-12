const supabaseUrl = "https://ctwtiwvgmrggposrhjrs.supabase.co";
const supabasePublishableKey = "sb_publishable_Z5WuGTngsDKm-_m9MT3rNA_qImY-gf7";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabasePublishableKey);

function setMessage(message, isError = false) {
  const messageBox = document.getElementById("authMessage");
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.style.color = isError ? "#ff6b6b" : "#58f2b1";
}

async function signup() {
  const email = document.getElementById("email")?.value.trim() || "";
  const password = document.getElementById("password")?.value.trim() || "";

  if (!email || !password) {
    setMessage("Email and password are required.", true);
    return;
  }

  if (password.length < 6) {
    setMessage("Password must be at least 6 characters.", true);
    return;
  }

  const { error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  setMessage("Signup successful. Check your email if confirmation is enabled.");
}

async function login() {
  const email = document.getElementById("email")?.value.trim() || "";
  const password = document.getElementById("password")?.value.trim() || "";

  if (!email || !password) {
    setMessage("Email and password are required.", true);
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage(error.message, true);
    return;
  }

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

  const emailBox = document.getElementById("userEmail");
  if (emailBox) {
    emailBox.textContent = data.session.user.email || "User";
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