const supabaseUrl = "https://ezoplhikjtfrizcitpxf.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6b3BsaGlranRmcml6Y2l0cHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTg4MDksImV4cCI6MjA5MDE3NDgwOX0.HIuiBxZwpHsSlSo464W7DqC-EUKuYe2rf_yS86HjYhw";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);


// ================= SIGNUP =================
async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("authMessage");

  if (!email || !password) {
    msg.textContent = "Email এবং password দিতে হবে";
    return;
  }

  if (password.length < 6) {
    msg.textContent = "Password কমপক্ষে 6 characters হতে হবে";
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Signup successful! এখন login করো";
}


// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("authMessage");

  if (!email || !password) {
    msg.textContent = "Email এবং password দিতে হবে";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Login successful...";
  window.location.href = "dashboard.html";
}


// ================= LOGOUT =================
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}


// ================= PROTECT DASHBOARD =================
async function protectDashboard() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  const user = data.session.user;

  const emailBox = document.getElementById("userEmail");
  if (emailBox) {
    emailBox.textContent = user.email;
  }
}


// ================= AUTO REDIRECT =================
async function redirectIfLoggedIn() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    window.location.href = "dashboard.html";
  }
}