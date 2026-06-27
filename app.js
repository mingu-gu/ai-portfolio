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

  var addBtn = document.getElementById('add-project-btn');
  if (addBtn) addBtn.style.display = user ? 'block' : 'none';

  var inquiryAdmin = document.getElementById('inquiry-admin');
  if (inquiryAdmin) inquiryAdmin.style.display = user ? 'block' : 'none';

  loadProjects();
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

// ===== 프로젝트 CRUD =====
var projectGrid = document.getElementById('project-grid');
var projectLoading = document.getElementById('project-loading');
var addProjectBtn = document.getElementById('add-project-btn');
var projectModal = document.getElementById('project-modal');
var projectModalClose = document.getElementById('project-modal-close');
var projectModalTitle = document.getElementById('project-modal-title');
var projectForm = document.getElementById('project-form');
var projectIdInput = document.getElementById('project-id');
var projectTitleInput = document.getElementById('project-title-input');
var projectDescInput = document.getElementById('project-desc-input');
var projectTagsInput = document.getElementById('project-tags-input');
var projectVideoInput = document.getElementById('project-video-input');
var projectError = document.getElementById('project-error');

function showProjectModal() {
  projectModal.style.display = 'flex';
  projectError.textContent = '';
}

function hideProjectModal() {
  projectModal.style.display = 'none';
  projectError.textContent = '';
  projectForm.reset();
  projectIdInput.value = '';
}

// 프로젝트 카드 HTML 만들기
function createProjectCard(project, index) {
  var card = document.createElement('div');
  card.className = 'project-card';

  var tagsHtml = '';
  if (project.tags) {
    var tagList = project.tags.split(',');
    for (var i = 0; i < tagList.length; i++) {
      tagsHtml += '<span>' + tagList[i].trim() + '</span>';
    }
  }

  var videoHtml = '';
  if (project.video_url) {
    videoHtml = '<a href="' + project.video_url + '" target="_blank" rel="noopener" class="video-link"><i class="ti ti-player-play" aria-hidden="true"></i> 영상 보기</a>';
  }

  var actionsHtml = '';
  if (currentUser) {
    actionsHtml = '<div class="card-actions">' +
      '<button class="btn-edit" onclick="editProject(\'' + project.id + '\')">수정</button>' +
      '<button class="btn-delete" onclick="deleteProject(\'' + project.id + '\')">삭제</button>' +
      '</div>';
  }

  card.innerHTML =
    '<div class="project-thumb"><span>' + String(index + 1).padStart(2, '0') + '</span></div>' +
    '<div class="project-info">' +
      '<div class="project-tags">' + tagsHtml + '</div>' +
      '<h3>' + project.title + '</h3>' +
      '<p>' + (project.description || '') + '</p>' +
      videoHtml +
      actionsHtml +
    '</div>';

  return card;
}

// DB에서 프로젝트 불러오기
function loadProjects() {
  supabaseClient
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .then(function (result) {
      projectGrid.innerHTML = '';

      if (result.error) {
        projectGrid.innerHTML = '<p class="empty-state">프로젝트를 불러오지 못했습니다.</p>';
        return;
      }

      if (!result.data || result.data.length === 0) {
        projectGrid.innerHTML = '<p class="empty-state">아직 등록된 프로젝트가 없습니다.</p>';
        return;
      }

      for (var i = 0; i < result.data.length; i++) {
        projectGrid.appendChild(createProjectCard(result.data[i], i));
      }
    });
}

// 새 프로젝트 추가 버튼
addProjectBtn.addEventListener('click', function () {
  projectModalTitle.textContent = '새 프로젝트 추가';
  projectIdInput.value = '';
  projectForm.reset();
  showProjectModal();
});

// 프로젝트 수정 버튼
window.editProject = function (id) {
  supabaseClient
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
    .then(function (result) {
      if (result.error || !result.data) return;

      var p = result.data;
      projectModalTitle.textContent = '프로젝트 수정';
      projectIdInput.value = p.id;
      projectTitleInput.value = p.title;
      projectDescInput.value = p.description || '';
      projectTagsInput.value = p.tags || '';
      projectVideoInput.value = p.video_url || '';
      showProjectModal();
    });
};

// 프로젝트 삭제 버튼
window.deleteProject = function (id) {
  if (!confirm('정말 이 프로젝트를 삭제할까요?')) return;

  supabaseClient
    .from('projects')
    .delete()
    .eq('id', id)
    .then(function (result) {
      if (result.error) {
        alert('삭제 중 문제가 발생했습니다.');
        return;
      }
      loadProjects();
    });
};

// 프로젝트 저장 (추가 또는 수정)
projectForm.addEventListener('submit', function (e) {
  e.preventDefault();
  projectError.textContent = '';

  var data = {
    title: projectTitleInput.value,
    description: projectDescInput.value,
    tags: projectTagsInput.value,
    video_url: projectVideoInput.value
  };

  var id = projectIdInput.value;

  if (id) {
    supabaseClient
      .from('projects')
      .update(data)
      .eq('id', id)
      .then(function (result) {
        if (result.error) {
          projectError.textContent = '수정 중 문제가 발생했습니다.';
          return;
        }
        hideProjectModal();
        loadProjects();
      });
  } else {
    supabaseClient
      .from('projects')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .then(function (result) {
        var nextOrder = 1;
        if (result.data && result.data.length > 0) {
          nextOrder = result.data[0].sort_order + 1;
        }
        data.sort_order = nextOrder;

        supabaseClient
          .from('projects')
          .insert(data)
          .then(function (result2) {
            if (result2.error) {
              projectError.textContent = '추가 중 문제가 발생했습니다.';
              return;
            }
            hideProjectModal();
            loadProjects();
          });
      });
  }
});

projectModalClose.addEventListener('click', hideProjectModal);
projectModal.addEventListener('click', function (e) {
  if (e.target === projectModal) hideProjectModal();
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
