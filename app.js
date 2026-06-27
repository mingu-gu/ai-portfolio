// Supabase 연결
var supabaseClient = window.supabase.createClient(
  'https://sfsvsyocsrjwuknmdcbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc3ZzeW9jc3Jqd3Vrbm1kY2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Mzc0MzgsImV4cCI6MjA5ODExMzQzOH0.fm-qjFVQnrXNXlYqNRXbY9RKmHqJYxfroHN-TTnYV70'
);

// 로그인 UI 요소
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

// 로그인 버튼 클릭
loginBtn.addEventListener('click', function () {
  if (currentUser) {
    supabaseClient.auth.signOut().then(function () {
      updateUI(null);
    });
  } else {
    showModal();
  }
});

// 팝업 닫기
loginClose.addEventListener('click', hideModal);
loginModal.addEventListener('click', function (e) {
  if (e.target === loginModal) hideModal();
});

// 로그인 폼 제출
loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  loginError.textContent = '';

  var email = loginEmail.value;
  var password = loginPassword.value;

  supabaseClient.auth.signInWithPassword({
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

// 페이지 로드 시 로그인 상태 확인
supabaseClient.auth.getUser().then(function (result) {
  updateUI(result.data.user);
});
