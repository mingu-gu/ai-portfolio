// Supabase 연결
var supabaseClient = window.supabase.createClient(
  'https://sfsvsyocsrjwuknmdcbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc3ZzeW9jc3Jqd3Vrbm1kY2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Mzc0MzgsImV4cCI6MjA5ODExMzQzOH0.fm-qjFVQnrXNXlYqNRXbY9RKmHqJYxfroHN-TTnYV70'
);

var currentUser = null;

// ===== 로그인 기능 =====
var loginBtn = document.getElementById('login-btn');
var loginModal = document.getElementById('login-modal');
var loginClose = document.getElementById('login-close');
var loginForm = document.getElementById('login-form');
var loginEmail = document.getElementById('login-email');
var loginPassword = document.getElementById('login-password');
var loginError = document.getElementById('login-error');

function showLoginModal() {
  loginModal.style.display = 'flex';
  loginError.textContent = '';
}

function hideLoginModal() {
  loginModal.style.display = 'none';
  loginError.textContent = '';
  loginForm.reset();
}

function updateLoginUI(user) {
  currentUser = user;
  loginBtn.textContent = user ? '로그아웃' : '로그인';

  var inquiryAdmin = document.getElementById('inquiry-admin');
  if (inquiryAdmin) inquiryAdmin.style.display = user ? 'block' : 'none';

  if (user) loadInquiries();
}

loginBtn.addEventListener('click', function () {
  if (currentUser) {
    supabaseClient.auth.signOut().then(function () {
      updateLoginUI(null);
    });
  } else {
    showLoginModal();
  }
});

loginClose.addEventListener('click', hideLoginModal);
loginModal.addEventListener('click', function (e) {
  if (e.target === loginModal) hideLoginModal();
});

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  loginError.textContent = '';

  supabaseClient.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value
  }).then(function (result) {
    if (result.error) {
      loginError.textContent = '이메일 또는 비밀번호가 맞지 않습니다.';
      return;
    }
    hideLoginModal();
    updateLoginUI(result.data.user);
  }).catch(function () {
    loginError.textContent = '로그인 중 문제가 발생했습니다.';
  });
});

// ===== 문의/의뢰 기능 =====
var inquiryForm = document.getElementById('inquiry-form');
var inquiryStatus = document.getElementById('inquiry-status');
var inquiryList = document.getElementById('inquiry-list');

inquiryForm.addEventListener('submit', function (e) {
  e.preventDefault();
  inquiryStatus.textContent = '';
  inquiryStatus.className = 'inquiry-status';

  var data = {
    name: document.getElementById('inq-name').value,
    email: document.getElementById('inq-email').value,
    phone: document.getElementById('inq-phone').value,
    type: document.getElementById('inq-type').value,
    budget: document.getElementById('inq-budget').value,
    message: document.getElementById('inq-message').value
  };

  supabaseClient
    .from('inquiries')
    .insert(data)
    .then(function (result) {
      if (result.error) {
        inquiryStatus.textContent = '문의 전송에 실패했습니다. 다시 시도해주세요.';
        inquiryStatus.className = 'inquiry-status error';
        return;
      }
      inquiryStatus.textContent = '문의가 접수되었습니다. 확인 후 연락드리겠습니다!';
      inquiryStatus.className = 'inquiry-status success';
      inquiryForm.reset();
      if (currentUser) loadInquiries();
    });
});

function loadInquiries() {
  supabaseClient
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .then(function (result) {
      inquiryList.innerHTML = '';

      if (result.error) {
        inquiryList.innerHTML = '<p style="color:#555;">문의 목록을 불러오지 못했습니다.</p>';
        return;
      }

      if (!result.data || result.data.length === 0) {
        inquiryList.innerHTML = '<p style="color:#555;">아직 받은 문의가 없습니다.</p>';
        return;
      }

      for (var i = 0; i < result.data.length; i++) {
        var inq = result.data[i];
        var date = new Date(inq.created_at).toLocaleDateString('ko-KR');

        var card = document.createElement('div');
        card.className = 'inquiry-card';
        card.innerHTML =
          '<div class="inquiry-card-header">' +
            '<div class="inquiry-card-info"><strong>' + inq.name + '</strong><br>' + inq.email + (inq.phone ? ' · ' + inq.phone : '') + '</div>' +
            (inq.type ? '<span class="inquiry-card-type">' + inq.type + '</span>' : '') +
          '</div>' +
          '<div class="inquiry-card-message">' + inq.message + '</div>' +
          '<div class="inquiry-card-footer">' +
            '<span>' + date + (inq.budget ? ' · 예산: ' + inq.budget : '') + '</span>' +
            '<button class="btn-delete" onclick="deleteInquiry(\'' + inq.id + '\')">삭제</button>' +
          '</div>';

        inquiryList.appendChild(card);
      }
    });
}

window.deleteInquiry = function (id) {
  if (!confirm('이 문의를 삭제할까요?')) return;

  supabaseClient
    .from('inquiries')
    .delete()
    .eq('id', id)
    .then(function (result) {
      if (result.error) {
        alert('삭제 중 문제가 발생했습니다.');
        return;
      }
      loadInquiries();
    });
};

// ===== 초기화 =====
supabaseClient.auth.getUser().then(function (result) {
  updateLoginUI(result.data.user);
});
