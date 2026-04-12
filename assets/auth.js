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
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    setMessage("Email and password are required.", true);
    return;
  }

  if (password.length < 6) {
    setMessage("Password must be at least 6 characters.", true);
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  if (data?.user?.identities?.length === 0) {
    setMessage("This email may already be registered. Try logging in.", true);
    return;
  }

  setMessage("Signup successful. Check your email if confirmation is enabled.");
}

async function login() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    setMessage("Email and password are required.", true);
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(error.message, true);
    return;
  }

  setMessage("Login successful.");
  window.location.href = "dashboard.html";
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

async function protectDashboard() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
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

supabaseClient.auth.onAuthStateChange((_event, session) => {
  const logoutBtn = document.getElementById("logoutBtn");
  const loginNavLink = document.getElementById("loginNavLink");
  const heroLoginBtn = document.getElementById("heroLoginBtn");
  const userStatus = document.getElementById("userStatus");

  if (session) {
    if (loginNavLink) loginNavLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    if (heroLoginBtn) {
      heroLoginBtn.textContent = "Open Dashboard";
      heroLoginBtn.href = "dashboard.html";
    }

    if (userStatus) {
      userStatus.innerHTML = `Status: <span>Logged in as ${session.user.email}</span>`;
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
});