// 대시보드 로직 (dashboard.js)
const STORAGE_KEY = 'mansion_students_data';

// 데이터 초기화
let studentsData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = 'all';
let currentSelectedStudentId = null;

// 요소 가져오기
const tbody = document.getElementById('student-table-body');
const classFilter = document.getElementById('classFilter');
const btnRefresh = document.getElementById('btnRefresh');
const btnResetAll = document.getElementById('btnResetAll');
const modal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');
const btnDeleteStudent = document.getElementById('btnDeleteStudent');

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentsData));
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentsData));
}

const DB_URL = "https://script.google.com/macros/s/AKfycbypf5yiMywSxdVrgSyweD7SXbIDGVNklTcYvRIxl_Xh_C3x8P--fPF5ar5ylxbYa43w/exec";

function renderTable() {
    fetch(DB_URL)
        .then(res => res.json())
        .then(data => {
            studentsData = data;
            saveData();
            updateDashboardUI();
        })
        .catch(err => {
            console.error('DB 연동 에러:', err);
            // 에러 시 로컬 데이터라도 표시
            updateDashboardUI();
        });
}

function updateDashboardUI() {
    let filtered = studentsData;
    if(currentFilter !== 'all') {
        filtered = studentsData.filter(s => s.classNum.toString() === currentFilter);
    }
    
    // 통계 업데이트
    document.getElementById('stat-total').textContent = filtered.length + '명';
    let completed = filtered.filter(s => s.floor >= 6).length; // 6,7층 엔딩완료
    let compRate = filtered.length > 0 ? Math.round((completed / filtered.length) * 100) : 0;
    document.getElementById('stat-completion').textContent = compRate + '%';
    
    let levelA = filtered.filter(s => s.level === 'A').length;
    let levelARate = filtered.length > 0 ? Math.round((levelA / filtered.length) * 100) : 0;
    document.getElementById('stat-level-a').textContent = levelARate + '%';
    
    // 정렬 (최신순 상단)
    filtered.sort((a,b) => {
        let timeA = new Date(a.timestamp || 0).getTime();
        let timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
    });
    
    tbody.innerHTML = '';
    
    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">데이터가 없습니다.</td></tr>';
        return;
    }
    
    filtered.forEach(s => {
        let tr = document.createElement('tr');
        
        // 진행도 바
        let floorNum = parseInt(s.floor) || 0;
        let isPenthouse = (s.floor === 'penthouse');
        let progressPercent = isPenthouse ? 85 : Math.min((floorNum / 7) * 100, 100);
        let progressText = isPenthouse ? '마지막 공간 진행 중' : (floorNum >= 6 ? '엔딩 완료' : s.floor + '층 진행 중');
        
        let progressHtml = `
            <div>${progressText}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progressPercent}%"></div></div>
        `;
        
        let levelBadge = `<span class="badge ${s.level}">${s.level} 수준</span>`;
        
        tr.innerHTML = `
            <td>${s.classNum}반</td>
            <td>${s.studentNum}번</td>
            <td><strong>${s.name}</strong></td>
            <td>${progressHtml}</td>
            <td>${levelBadge}</td>
            <td>${s.houseType}</td>
            <td>${s.houseName}</td>
            <td><button class="btn-detail" data-id="${s.id}">상세 보기</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // 상세 보기 이벤트 연결
    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            showDetail(this.getAttribute('data-id'));
        });
    });
}

function showDetail(id) {
    let student = studentsData.find(s => s.id === id);
    if(!student) return;
    
    currentSelectedStudentId = id;
    document.getElementById('modal-title').textContent = `${student.classNum}반 ${student.studentNum}번 ${student.name} 리포트`;
    
    let html = `
        <p><strong>현재 위치:</strong> ${student.floor === 7 || student.floor >= 6 ? '미스터리 맨션 클리어' : (student.floor === 'penthouse' ? '마지막 공간' : student.floor + '층')}</p>
        <p><strong>성취 수준:</strong> <span class="badge ${student.level}">${student.level} 수준</span></p>
        <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
        <p><strong>진단된 주거 유형:</strong> <span style="color:gold;">${student.houseType}</span></p>
        <p><strong>설계한 집 이름:</strong> ${student.houseName}</p>
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-top:15px;">
            <p style="color:gold; margin-bottom:5px;"><strong>💬 활동후 느낀 점 / 알게된 점:</strong></p>
            <p>${student.reflection || '내용 없음'}</p>
        </div>
        <p style="font-size:0.8rem; color:#888; margin-top:15px; text-align:right;">마지막 업데이트: ${student.timestamp}</p>
    `;
    
    document.getElementById('modal-body').innerHTML = html;
    modal.style.display = 'flex';
}

// 이벤트 리스너 설정
classFilter.addEventListener('change', (e) => { currentFilter = e.target.value; renderTable(); });
btnRefresh.addEventListener('click', renderTable);

const btnExportExcel = document.getElementById('btnExportExcel');
if(btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
        if(studentsData.length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
        
        let csvContent = "\uFEFF"; // BOM for Excel UTF-8
        csvContent += "반,번호,이름,진행도(층),성취수준,최종주거유형,설계한집이름,활동후느낀점,마지막업데이트\n";
        
        let filtered = studentsData;
        if(currentFilter !== 'all') filtered = studentsData.filter(s => s.classNum.toString() === currentFilter);
        
        filtered.sort((a,b) => {
            if(a.classNum !== b.classNum) return a.classNum - b.classNum;
            return a.studentNum - b.studentNum;
        });

        filtered.forEach(s => {
            let reflection = s.reflection ? s.reflection.replace(/"/g, '""').replace(/\n/g, ' ') : '';
            let row = `${s.classNum},${s.studentNum},${s.name},${s.floor},${s.level},"${s.houseType}","${s.houseName}","${reflection}","${s.timestamp}"`;
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `미스터리맨션_결과_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

btnResetAll.addEventListener('click', () => {
    if(confirm('⚠️ 경고: 모든 학생의 과정중심평가 기록이 삭제됩니다. 정말 초기화하시겠습니까?')) {
        studentsData = [];
        saveData();
        renderTable();
        alert('전체 초기화 되었습니다.');
    }
});

btnDeleteStudent.addEventListener('click', () => {
    if(!currentSelectedStudentId) return;
    if(confirm('이 학생의 기록을 삭제하시겠습니까?')) {
        studentsData = studentsData.filter(s => s.id !== currentSelectedStudentId);
        saveData();
        renderTable();
        modal.style.display = 'none';
    }
});

closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (e) => { if(e.target === modal) modal.style.display = 'none'; });

// 초기 렌더링
renderTable();
