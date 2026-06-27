const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const loginClose = document.getElementById('login-close');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

let currentUser = null;

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
  if (user) {
    loginBtn.textContent = '로그아웃';
  } else {
    loginBtn.textContent = '로그인';
  }
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

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  loginError.textContent = '';

  const email = loginEmail.value;
  const password = loginPassword.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      loginError.textContent = '이메일 또는 비밀번호가 맞지 않습니다.';
    } else {
      loginError.textContent = '로그인 중 문제가 발생했습니다.';
    }
    return;
  }

  hideModal();
  updateUI(data.user);
});

supabase.auth.getUser().then(function (result) {
  updateUI(result.data.user);
});
