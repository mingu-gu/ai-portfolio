var loginBtn = document.getElementById('login-btn');
var loginModal = document.getElementById('login-modal');
var loginClose = document.getElementById('login-close');
var loginForm = document.getElementById('login-form');
var loginEmail = document.getElementById('login-email');
var loginPassword = document.getElementById('login-password');
var loginError = document.getElementById('login-error');
var currentUser = null;

function showModal() {
  loginModal.style.display = 'flex';
  loginError.textContent = '';
}

function hideModal() {
  loginModal.style.display = 'none';
  loginError.textContent = '';
  loginForm.reset();
}

function updateUI(user) {
  currentUser = user;
  loginBtn.textContent = user ? '로그아웃' : '로그인';
}

loginBtn.addEventListener('click', function () {
  if (currentUser) {
    supabase.auth.signOut().then(function () {
      updateUI(null);
    });
  } else {
    showModal();
  }
});

loginClose.addEventListener('click', hideModal);

loginModal.addEventListener('click', function (e) {
  if (e.target === loginModal) hideModal();
});

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  loginError.textContent = '';

  var email = loginEmail.value;
  var password = loginPassword.value;

  supabase.auth.signInWithPassword({
    email: email,
    password: password
  }).then(function (result) {
    if (result.error) {
      loginError.textContent = '이메일 또는 비밀번호가 맞지 않습니다.';
      return;
    }
    hideModal();
    updateUI(result.data.user);
  }).catch(function () {
    loginError.textContent = '로그인 중 문제가 발생했습니다.';
  });
});

supabase.auth.getUser().then(function (result) {
  updateUI(result.data.user);
});
