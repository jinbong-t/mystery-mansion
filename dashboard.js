// 대시보드 로직 (dashboard.js)
const STORAGE_KEY = 'mansion_students_data';

// 데이터 초기화
let studentsData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = 'all';
let currentSort = 'desc'; // 기본값: 최신 활동순
let currentSelectedStudentId = null;

// 차트 인스턴스 저장용 변수
let levelChartInstance = null;
let typeChartInstance = null;

// Chart.js 기본 스타일 (다크모드)
Chart.defaults.color = '#e0e0e0';
Chart.defaults.font.family = "'Noto Serif KR', serif";

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
    
    // 정렬 로직 적용
    if (currentSort === 'desc') {
        filtered.sort((a,b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    } else if (currentSort === 'asc') {
        filtered.sort((a,b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
    } else if (currentSort === 'num') {
        filtered.sort((a,b) => {
            if(a.classNum !== b.classNum) return a.classNum - b.classNum;
            return a.studentNum - b.studentNum;
        });
    }
    
    // 차트 업데이트 호출
    updateCharts(filtered);
    
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
        
        <div style="background:rgba(76, 175, 80, 0.05); padding:15px; border-radius:8px; margin-top:15px; border:1px solid rgba(76, 175, 80, 0.4);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <p style="color:#4caf50; margin:0;"><strong>✨ AI 과세특 초안 (자동 생성)</strong></p>
                <button onclick="copySeTeuk()" style="background:#4caf50; color:white; border:none; padding:5px 12px; border-radius:4px; font-size:0.85rem; font-weight:bold;">📝 복사하기</button>
            </div>
            <textarea id="autoSeTeuk" style="width:100%; height:120px; background:#121212; color:#e0e0e0; border:1px solid #333; padding:10px; border-radius:5px; font-family:inherit; line-height:1.5; resize:vertical;">${generateSeTeuk(student)}</textarea>
            <p style="font-size:0.75rem; color:#888; margin-top:8px;">※ 학생의 진행 데이터와 느낀 점을 바탕으로 자동 조합된 문구입니다. 선생님의 판단에 따라 수정해서 사용하세요!</p>
        </div>

        <p style="font-size:0.8rem; color:#888; margin-top:15px; text-align:right;">마지막 업데이트: ${student.timestamp}</p>
    `;
    
    document.getElementById('modal-body').innerHTML = html;
    modal.style.display = 'flex';
}

// 이벤트 리스너 설정
classFilter.addEventListener('change', (e) => { currentFilter = e.target.value; renderTable(); });
const sortOrder = document.getElementById('sortOrder');
if (sortOrder) sortOrder.addEventListener('change', (e) => { currentSort = e.target.value; updateDashboardUI(); });

const btnToggleCharts = document.getElementById('btnToggleCharts');
const chartsContainer = document.getElementById('chartsContainer');
if (btnToggleCharts && chartsContainer) {
    btnToggleCharts.addEventListener('click', () => {
        if (chartsContainer.style.display === 'none') {
            chartsContainer.style.display = 'grid';
            btnToggleCharts.textContent = '📊 통계 차트 숨기기';
            updateCharts(studentsData); // 혹시 몰라 다시 한 번 렌더링
        } else {
            chartsContainer.style.display = 'none';
            btnToggleCharts.textContent = '📊 통계 차트 보기';
        }
    });
}

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

// --- AI 과세특 자동 생성 로직 ---
// ... (생략, 기존 코드 유지)

function generateSeTeuk(student) {
    if (!student) return "";
    let text = "";
    
    // 느낀점 추출 (트래킹 로그 분리)
    let rawRef = student.reflection || '';
    
    // '[트래킹 로그]' 문자열 앞부분만 진짜 학생의 소감으로 잘라냄
    let realRef = rawRef.split('[트래킹 로그]')[0].trim();
    
    // 따옴표 제거 및 불필요한 공백 제거
    let cleanRef = realRef.replace(/"/g, '').replace(/'/g, '').trim();
    
    // 내용이 비어있거나 '내용 없음'인 경우 hasRef를 false로 처리
    let hasRef = cleanRef.length > 3 && cleanRef !== '내용 없음' && cleanRef !== '내용없음';
    
    // 설계한 집 이름 및 주거 유형 예외 처리 ('미정'이나 '진행중'이면 자연스러운 일반 명사로 대체)
    let houseNameStr = (student.houseName && student.houseName.trim() !== '') ? `'${student.houseName}'` : '자신만의 개성 있는 주거 공간';
    let isTypeValid = student.houseType && student.houseType !== '미정' && student.houseType !== '진행중';
    let typeStr = isTypeValid ? `'${student.houseType}'` : '창의적인';

    // 성취 수준별 완전 차별화된 세특 템플릿 작성
    if (student.level === 'A' || student.floor >= 6 || student.floor === 'penthouse') {
        text += `주거 공간 설계 프로젝트인 '미스터리 맨션' 방탈출 활동에서 뛰어난 공간 지각력과 분석력을 발휘하여 모든 미션을 자기 주도적으로 완수함. `;
        if (isTypeValid) {
            text += `특히 각 주거 유형의 특징을 깊이 있게 이해하고, 이를 바탕으로 자신의 가치관을 반영한 ${typeStr} 주거 유형의 ${houseNameStr}을(를) 독창적으로 설계하여 발표함. `;
        } else {
            text += `자신의 라이프스타일을 반영하여 ${houseNameStr}을(를) 독창적으로 설계하는 등 우수한 문제 해결 능력을 보여줌. `;
        }
        
        if (hasRef) {
            text += `활동을 마치며 "${cleanRef}"라고 깊이 있게 성찰하는 모습을 통해, 주거 환경이 개인의 삶의 질과 행복에 미치는 영향을 종합적으로 통찰하는 성숙한 태도를 보여줌.`;
        } else {
            text += `이러한 과정을 통해 건강하고 쾌적한 주거 생활에 대한 확고한 가치관을 정립함.`;
        }
    } else if (student.level === 'B' || student.floor >= 4) {
        text += `주거 공간 설계 프로젝트인 '미스터리 맨션' 활동에 성실하게 참여하여 주거 공간의 다양한 구성 요소와 배치 원리를 잘 이해함. `;
        if (isTypeValid) {
            text += `주어진 문제 상황을 논리적으로 해결해 나가는 과정을 거쳐, ${typeStr} 유형의 특성을 살린 ${houseNameStr}을(를) 구상해냄. `;
        } else {
            text += `공간의 쓰임새를 고려하여 ${houseNameStr}을(를) 주도적으로 구상해냄. `;
        }
        
        if (hasRef) {
            text += `활동 후 "${cleanRef}"라고 소감을 밝히며, 주거 공간의 역할과 중요성에 대해 긍정적으로 인식하는 계기로 삼음.`;
        } else {
            text += `활동을 통해 미래 자신의 주거 공간에 대한 밑그림을 그려보고, 바람직한 주거 가치관을 형성하려는 노력이 돋보임.`;
        }
    } else {
        text += `주거 공간 설계 프로젝트인 '미스터리 맨션' 활동에서 주거 공간의 기본 개념과 올바른 동선 배치의 중요성을 학습하기 위해 끈기 있게 참여함. `;
        if (isTypeValid) {
            text += `다양한 주거 관련 과제를 수행하며 공간의 쓰임새와 가구 배치에 대한 이해도를 높였으며, ${typeStr} 성향을 바탕으로 ${houseNameStr}을(를) 설계해보는 경험을 함. `;
        } else {
            text += `다양한 주거 관련 과제들을 수행하며 ${houseNameStr}의 도면을 고민해보는 의미 있는 경험을 함. `;
        }
        
        if (hasRef) {
            text += `프로젝트 진행 중 "${cleanRef}"라고 느낀 점을 표현하며, 안전하고 편안한 주거 환경의 필요성을 깨달아가는 발전적인 태도를 보임.`;
        } else {
            text += `이 과정을 통해 주거가 단순히 머무는 곳을 넘어 삶의 질을 높이는 중요한 공간임을 인식하게 됨.`;
        }
    }

    return text;
}

// 전역 함수로 등록 (onclick 속성에서 접근 가능하도록)
window.copySeTeuk = function() {
    const textarea = document.getElementById("autoSeTeuk");
    textarea.select();
    textarea.setSelectionRange(0, 99999); // 모바일 호환성
    
    try {
        document.execCommand("copy");
        alert("📝 과세특 초안이 클립보드에 복사되었습니다!\n\n나이스(NEIS)나 한글 문서에 바로 붙여넣기(Ctrl+V) 하세요.");
    } catch(e) {
        alert("복사 기능이 지원되지 않는 브라우저입니다. 텍스트를 직접 복사해주세요.");
    }
};

// --- 차트 그리기 로직 ---
function updateCharts(data) {
    const levelCounts = { A: 0, B: 0, C: 0 };
    const typeCounts = {};

    data.forEach(s => {
        // 성취 수준 카운트
        if (s.level && levelCounts[s.level] !== undefined) {
            levelCounts[s.level]++;
        }
        
        // 주거 유형 카운트
        let type = s.houseType || '미정';
        if(type === '미정') return; // 미정은 통계에서 제외할 수도 있음 (선택)
        if (typeCounts[type]) {
            typeCounts[type]++;
        } else {
            typeCounts[type] = 1;
        }
    });

    // 성취 수준 차트 갱신
    const ctxLevel = document.getElementById('levelChart').getContext('2d');
    if (levelChartInstance) levelChartInstance.destroy();
    
    levelChartInstance = new Chart(ctxLevel, {
        type: 'doughnut',
        data: {
            labels: ['A 수준', 'B 수준', 'C 수준'],
            datasets: [{
                data: [levelCounts.A, levelCounts.B, levelCounts.C],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)', // A (초록)
                    'rgba(255, 152, 0, 0.7)', // B (주황)
                    'rgba(255, 82, 82, 0.7)'  // C (빨강)
                ],
                borderColor: ['#4caf50', '#ff9800', '#ff5252'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });

    // 주거 유형 차트 갱신
    const ctxType = document.getElementById('typeChart').getContext('2d');
    if (typeChartInstance) typeChartInstance.destroy();

    const typeLabels = Object.keys(typeCounts);
    const typeData = Object.values(typeCounts);
    
    // 색상 팔레트 (골드, 브라운 등 맨션 테마에 어울리는 색)
    const bgColors = [
        'rgba(179, 139, 89, 0.7)', 'rgba(212, 175, 55, 0.7)', 
        'rgba(139, 69, 19, 0.7)', 'rgba(205, 133, 63, 0.7)',
        'rgba(222, 184, 135, 0.7)'
    ];

    typeChartInstance = new Chart(ctxType, {
        type: 'pie',
        data: {
            labels: typeLabels,
            datasets: [{
                data: typeData,
                backgroundColor: bgColors.slice(0, typeLabels.length),
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}
