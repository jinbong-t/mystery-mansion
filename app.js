// 상태 관리
const state = {
    floor: 1,
    playerName: '',
    personalityType: '',
    collectedLetters: [],
    dialogueStep: 0
};

// 대화 데이터
const dialogues = [
    '"어서 오세요. 어머님 대신 오셨군요. 자, 문을 열고 들어가서 집을 좀 봅시다~"',
    '"이 맨션, 매물마다 잠금장치가 걸려 있는데, 번호키도 있고 옛날식 자물쇠도 있어요. 그 집을 제대로 파악해야만 열리거든요."',
    '"제 명함입니다. 둘러보시죠."'
];

// DOM 요소
const dialogueText = document.getElementById('dialogue-text');
const nextDialogueBtn = document.getElementById('next-dialogue-btn');
const nameInputContainer = document.getElementById('name-input-container');
const startBtn = document.getElementById('start-btn');
const playerNameInput = document.getElementById('player-name');
const personalityModal = document.getElementById('personality-test-modal');
const testBtns = document.querySelectorAll('.test-btn');
const inventory = document.getElementById('inventory');
const letterPiecesContainer = document.getElementById('letter-pieces');
const roomBackground = document.getElementById('room-background');
const floor1 = document.getElementById('floor-1');

// 프롤로그: 전화 씬 DOM 요소
const startScreen = document.getElementById('start-screen');
const realStartBtn = document.getElementById('real-start-btn');
const scenePhone = document.getElementById('scene-phone');
const incomingCall = document.getElementById('incoming-call');
const inCall = document.getElementById('in-call');
const answerBtn = document.getElementById('answer-btn');
const phoneOkBtn = document.getElementById('phone-ok-btn');
const endCallWrapper = document.getElementById('end-call-wrapper');
const callTimer = document.querySelector('.call-timer');

// 오디오 및 음성 관련 변수
let audioCtx;
let ringtoneInterval;
let callTimerInterval;
let typeInterval; // 타이핑 인터벌
let callSeconds = 0;
let momVoiceAudio;
let cinematicTimeouts = []; // 시네마틱 연출용 타임아웃 저장 배열
let momVoiceUtterance;

// 초기화
function init() {
    localStorage.clear();
    dialogueText.innerText = dialogues[state.dialogueStep];
}

// 벨소리 생성 함수 (Web Audio API)
function playRingtone() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playTone() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 440; // 북미/한국 표준 링 백 톤 주파수
        osc2.frequency.value = 480;
        
        // 투르르르 울리는 패턴 (2초 울림, 4초 대기)
        const now = audioCtx.currentTime + 0.05;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.setValueAtTime(0.5, now + 2.0);
        gain.gain.linearRampToValueAtTime(0, now + 2.1);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.1);
        osc2.stop(now + 2.1);
    }
    
    playTone();
    ringtoneInterval = setInterval(() => {
        playTone();
    }, 4000); // 4초 주기
}

function stopRingtone() {
    clearInterval(ringtoneInterval);
    if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
        audioCtx = null;
    }
}

let isMuted = false;
const muteBtn = document.createElement('button');
muteBtn.innerHTML = '🔊 소리 끄기';
muteBtn.className = 'action-btn';
muteBtn.style.position = 'absolute';
muteBtn.style.top = '20px';
muteBtn.style.right = '20px';
muteBtn.style.zIndex = '1000';
document.getElementById('game-container').appendChild(muteBtn);

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.innerHTML = '🔇 소리 켜기';
        stopRingtone();
    } else {
        muteBtn.innerHTML = '🔊 소리 끄기';
        if (incomingCall.classList.contains('active-screen')) {
            playRingtone();
        }
    }
});

// 게임 시작 버튼 (오디오 권한 획득)
realStartBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    scenePhone.classList.add('active');
    document.getElementById('skip-btn').classList.remove('hidden');
    
    // 통화 수신 화면 활성화 및 벨소리 재생
    if (!isMuted) {
        playRingtone();
    }
    
    // 시계 업데이트
    const now = new Date();
    document.getElementById('phone-time').innerText = 
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
});

// 스킵 버튼 로직
document.getElementById('skip-btn').addEventListener('click', () => {
    // 모든 타이머 및 오디오 종료
    stopRingtone();
    clearInterval(callTimerInterval);
    clearInterval(typeInterval);
    if (momVoiceAudio) {
        momVoiceAudio.pause();
        momVoiceAudio.currentTime = 0;
    }
    cinematicTimeouts.forEach(t => clearTimeout(t));
    
    // UI 초기화 및 바로 1층으로 이동
    document.getElementById('skip-btn').classList.add('hidden');
    muteBtn.style.display = 'none';
    
    scenePhone.classList.remove('active');
    scenePhone.style.display = 'none';
    
    const sceneExterior = document.getElementById('scene-exterior');
    sceneExterior.classList.remove('active');
    sceneExterior.style.display = 'none';
    
    moveToFloor(1);
    
    // 공인중개사 즉시 등장
    const agentPortrait = document.getElementById('agent-portrait');
    agentPortrait.classList.remove('hidden');
    agentPortrait.classList.add('pop-up');
});

// 통화 받기 버튼 로직
answerBtn.addEventListener('click', () => {
    stopRingtone();
    
    incomingCall.classList.remove('active-screen');
    incomingCall.classList.add('hidden');
    inCall.classList.remove('hidden');
    inCall.classList.add('active-screen');
    
    // 타이머 시작
    callTimerInterval = setInterval(() => {
        callSeconds++;
        const m = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const s = String(callSeconds % 60).padStart(2, '0');
        callTimer.innerText = `${m}:${s}`;
    }, 1000);
    
    // 엄마 실제 목소리(MP3 파일) 재생 및 타이핑 효과 적용
    momVoiceAudio = new Audio('새+프로젝트.mp3');
    let audioEnded = false;
    let typingEnded = false;
    
    function checkEnd() {
        // 음소거면 오디오 끝난 것으로 간주
        if ((audioEnded || isMuted) && typingEnded) {
            endCallWrapper.classList.remove('hidden');
        }
    }

    if (!isMuted) {
        momVoiceAudio.play();
        momVoiceAudio.addEventListener('ended', () => {
            audioEnded = true;
            checkEnd();
        });
    }
    
    const dialogueElement = document.querySelector('.phone-dialogue .text');
    const text = "어휴, 미안해서 어쩌니. 엄마가 갑자기 급한 일이 생겨서 집 보러 못 가게 됐어. 공인중개사랑 네가 살 집이니까 대신 잘 좀 보고 와!";
    dialogueElement.textContent = ""; // 초기화
    let charIndex = 0;
    
    typeInterval = setInterval(() => {
        if (charIndex < text.length) {
            dialogueElement.textContent += text.charAt(charIndex);
            charIndex++;
        } else {
            clearInterval(typeInterval);
            typingEnded = true;
            checkEnd();
        }
    }, 70);
});

phoneOkBtn.addEventListener('click', () => {
    // 통화 종료
    clearInterval(callTimerInterval);
    if (momVoiceAudio) {
        momVoiceAudio.pause();
        momVoiceAudio.currentTime = 0;
    }
    
    // 전화 씬 숨기기 (페이드 아웃)
    scenePhone.style.opacity = '0';
    scenePhone.style.transition = 'opacity 1s ease';
    muteBtn.style.display = 'none'; // 전화 씬 끝나면 음소거 버튼 숨김
    document.getElementById('skip-btn').classList.add('hidden'); // 스킵 버튼도 숨김
    
    cinematicTimeouts.push(setTimeout(() => {
        scenePhone.classList.remove('active');
        scenePhone.style.display = 'none';
        
        // 1. 외경 씬 표시
        const sceneExterior = document.getElementById('scene-exterior');
        const exteriorText = document.getElementById('exterior-overlay-text');
        
        sceneExterior.classList.remove('hidden');
        sceneExterior.classList.add('active'); // active 클래스로 display 제어
        sceneExterior.style.display = 'flex';
        sceneExterior.style.alignItems = 'center';
        sceneExterior.style.justifyContent = 'center';
        
        // 2. 텍스트 서서히 등장
        cinematicTimeouts.push(setTimeout(() => {
            exteriorText.classList.add('fade-in');
        }, 500));
        
        // 3. 텍스트 사라지고 카메라 줌 인 (문으로 다가가기)
        cinematicTimeouts.push(setTimeout(() => {
            exteriorText.classList.remove('fade-in');
            
            cinematicTimeouts.push(setTimeout(() => {
                sceneExterior.classList.add('zoom-in');
                
                // 4. 줌 인 끝나면서 로비로 크로스페이드
                cinematicTimeouts.push(setTimeout(() => {
                    sceneExterior.classList.remove('active');
                    sceneExterior.style.display = 'none';
                    moveToFloor(1);
                    
                    // 5. 공인중개사 캐릭터 등장
                    cinematicTimeouts.push(setTimeout(() => {
                        const agentPortrait = document.getElementById('agent-portrait');
                        agentPortrait.classList.remove('hidden');
                        
                        // 브라우저 렌더링 후 애니메이션 클래스 추가
                        requestAnimationFrame(() => {
                            agentPortrait.classList.add('pop-up');
                        });
                    }, 500));
                    
                }, 3500)); // 줌인 소요시간
            }, 1000)); // 텍스트 사라진 후 약간 대기
            
        }, 3000)); // 텍스트 보여주는 시간
        
    }, 1000));
});

// 다음 대화
nextDialogueBtn.addEventListener('click', () => {
    state.dialogueStep++;
    if (state.dialogueStep < dialogues.length) {
        dialogueText.innerText = dialogues[state.dialogueStep];
    } else {
        // 대화 끝, 이름 입력창 표시
        document.querySelector('.dialogue-box').classList.add('hidden');
        nameInputContainer.classList.remove('hidden');
    }
});

// 이름 입력 완료
startBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name.length > 0) {
        state.playerName = name;
        nameInputContainer.classList.add('hidden');
        // 이름 입력 후 성향 진단 모달 표시
        personalityModal.classList.remove('hidden');
    } else {
        alert('이름을 입력해주세요.');
    }
});

// 성향 진단 완료
testBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        state.personalityType = e.target.dataset.type;
        saveState();
        personalityModal.classList.add('hidden');
        
        // 1층 로비 튜토리얼 완료, 인벤토리 활성화 및 다음 층 준비
        inventory.classList.remove('hidden');
        renderInventory();
        
        // 2층으로 이동 (임시)
        alert(`${state.playerName}님, ${state.personalityType} 성향이시군요. 엘리베이터를 타고 2층으로 이동합니다.`);
        moveToFloor(2);
    });
});

// 층간 이동
function moveToFloor(floorNum) {
    state.floor = floorNum;
    
    // 이전 층 비활성화
    document.querySelectorAll('.floor-content').forEach(el => el.classList.remove('active'));
    
    // 새 층 활성화
    const targetFloor = document.getElementById(`floor-${floorNum}`);
    targetFloor.classList.add('active');
    
    // 배경 변경
    const bgImg = targetFloor.dataset.bg;
    if (bgImg) {
        roomBackground.style.backgroundImage = `url('${bgImg}')`;
    }
}

// ==========================================
// 2층 신혼부부 매물 로직
// ==========================================
const startF2Btn = document.getElementById('start-f2-btn');
const f2Minigame1 = document.getElementById('f2-minigame-1');
const checkF2M1Btn = document.getElementById('check-f2-m1');
const f2Minigame2 = document.getElementById('f2-minigame-2');
const checkF2M2Btn = document.getElementById('check-f2-m2');
const f2PasswordHint = document.getElementById('f2-password-hint');
const f2Doorlock = document.getElementById('f2-doorlock');
const f2Display = document.getElementById('f2-display');
const f2HiddenMagnet = document.getElementById('f2-hidden-magnet');
let f2Input = "";

// 2층 둘러보기 시작
startF2Btn.addEventListener('click', () => {
    document.getElementById('f2-dialogue').classList.add('hidden');
    f2Minigame1.classList.remove('hidden');
});

// 드래그 앤 드롭 구현 (미니게임 1)
const draggables = document.querySelectorAll('.draggable-item');
const dropZones = document.querySelectorAll('.drop-zone');

draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', () => {
        draggable.classList.add('dragging');
    });
    draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
    });
});

dropZones.forEach(zone => {
    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('hover');
    });
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('hover');
    });
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('hover');
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            zone.appendChild(draggable);
        }
    });
});

// 미니게임 1 정답 확인
checkF2M1Btn.addEventListener('click', () => {
    // 정답 매핑: 침실-개인, 거실-공동, 부엌-가사, 욕실-생리위생, 현관-부수
    const correctMap = {
        '침실': '개인생활공간',
        '거실': '공동생활공간',
        '부엌': '가사작업공간',
        '욕실': '생리위생공간',
        '현관': '부수공간'
    };
    
    let isCorrect = true;
    draggables.forEach(item => {
        const room = item.dataset.room;
        const parentZone = item.parentElement.dataset.zone;
        if (correctMap[room] !== parentZone) {
            isCorrect = false;
        }
    });
    
    if (isCorrect) {
        alert("구역 분류 완료! 다음 문제로 넘어갑니다.");
        f2Minigame1.classList.add('hidden');
        f2Minigame2.classList.remove('hidden');
    } else {
        alert("잘못 분류된 구역이 있습니다. 다시 시도해보세요.");
    }
});

// 미니게임 2 정답 확인
checkF2M2Btn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.f2-m2-cb');
    // 정답: 옷장, 서랍장
    const correctAnswers = ['옷장', '서랍장'];
    let selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(cb.value);
    });
    
    const isCorrect = selected.length === correctAnswers.length && 
                      selected.every(val => correctAnswers.includes(val));
    
    if (isCorrect) {
        alert("가구 분류 정답!");
        f2PasswordHint.classList.remove('hidden');
        checkF2M2Btn.classList.add('hidden');
        setTimeout(() => {
            f2Minigame2.classList.add('hidden');
            f2Doorlock.classList.remove('hidden');
            f2HiddenMagnet.classList.remove('hidden');
        }, 3000);
    } else {
        alert("수납용 가구만 모두 선택해주세요.");
    }
});

// 2층 도어락 로직
document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.innerText;
        if (key === 'C') {
            f2Input = "";
            f2Display.innerText = "----";
        } else if (key === 'E') {
            if (f2Input === '4286') {
                f2Display.innerText = "OPEN";
                f2Display.style.color = "lime";
                setTimeout(() => {
                    alert("문이 열렸습니다. 3층으로 올라갑니다.");
                    f2Doorlock.classList.add('hidden');
                    f2HiddenMagnet.classList.add('hidden');
                    // TODO: moveToFloor(3)
                    alert("3층 업데이트 준비 중입니다...");
                }, 1000);
            } else {
                f2Display.innerText = "ERR";
                f2Display.style.color = "red";
                setTimeout(() => {
                    f2Input = "";
                    f2Display.innerText = "----";
                }, 1000);
            }
        } else {
            if (f2Input.length < 4) {
                f2Input += key;
                f2Display.innerText = f2Input.padEnd(4, '-');
            }
        }
    });
});

// 2층 숨은 글자 조각
f2HiddenMagnet.addEventListener('click', () => {
    if (!state.collectedLetters[0]) {
        state.collectedLetters[0] = "결"; // 글자 임의 지정 (추후 반전 이름용)
        alert("'결' 이라는 글자 조각을 찾았습니다!");
        renderInventory();
        saveState();
        f2HiddenMagnet.style.opacity = '0.2';
    }
});

// ==========================================

// 인벤토리 렌더링
function renderInventory() {
    letterPiecesContainer.innerHTML = '';
    const totalLetters = 5;
    for(let i=0; i<totalLetters; i++) {
        const div = document.createElement('div');
        div.className = 'letter';
        if(state.collectedLetters[i]) {
            div.innerText = state.collectedLetters[i];
            div.style.borderStyle = 'solid';
        } else {
            div.innerText = '?';
        }
        letterPiecesContainer.appendChild(div);
    }
}

// 상태 저장
function saveState() {
    localStorage.setItem('mansionState', JSON.stringify(state));
}

init();
