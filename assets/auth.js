const supabaseUrl = "https://ezoplhikjtfrizcitpxf.supabase.co";
const supabaseAnonKey = "YOUR_ANON_KEY_HERE";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

async function signup() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageBox = document.getElementById("authMessage");

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    if (messageBox) messageBox.textContent = "Email এবং password দিতে হবে।";
    return;
  }

  if (password.length < 6) {
    if (messageBox) messageBox.textContent = "Password কমপক্ষে 6 characters হতে হবে।";
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
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

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    if (messageBox) messageBox.textContent = "Email এবং password দিতে হবে।";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
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
  const { data, error } = await supabaseClient.auth.getSession();

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