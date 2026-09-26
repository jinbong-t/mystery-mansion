// 미스터리 맨션 - app.js (완전 재작성, UTF-8)

var state = {
    floor: 1, playerName: '', personalityType: '',
    f2m1Done: false, f2m2Done: false, f2m3Done: false,
    f3m1Done: false, f3m2Done: false, f3m3Done: false,
    f4keyFound: false, f4m1Done: false, f4m2Done: false, f4m3Done: false,
    f5m1Done: false, f5m2Done: false, f5m3Done: false,
    roofBonusA: false, roofBonusB: false, roofBonusC: false,
    houseName: '', houseType: '', housingVector: { A: 0, B: 0, C: 0, D: 0 }
};

var roomBackground = document.getElementById('room-background');
var elevatorUI = document.getElementById('elevator-ui');
var audioCtx = null; // 전역으로 선언하여 엘리베이터 효과 등에서 사용

const DB_URL = "https://script.google.com/macros/s/AKfycbypf5yiMywSxdVrgSyweD7SXbIDGVNklTcYvRIxl_Xh_C3x8P--fPF5ar5ylxbYa43w/exec";

function saveState() { 
    localStorage.setItem('mansionState', JSON.stringify(state));
    // 구글 시트로 데이터 전송
    if(state.playerName && state.classNum) {
        let level = state.floor >= 6 ? (Object.keys(state.housingVector || {}).length > 0 ? 'A' : 'B') : (state.floor > 3 ? 'B' : 'C');
        let payload = {
            id: state.classNum + '_' + state.studentNum + '_' + state.playerName,
            classNum: state.classNum,
            studentNum: state.studentNum,
            name: state.playerName,
            floor: state.floor,
            level: level,
            houseType: state.houseType || '진행중',
            houseName: state.houseName || '',
            reflection: state.reflection || ''
        };
        fetch(DB_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        }).catch(e => console.log('DB 전송 에러', e));
    }
}
function showElement(el) { if (el) { el.classList.remove('hidden'); if (el.classList.contains('floor-content')) el.classList.add('active'); } }
function hideElement(el) { if (el) { el.classList.add('hidden'); if (el.classList.contains('floor-content')) el.classList.remove('active'); } }


function changeFloorUI(floorId) {
    state.floor = floorId;
    document.querySelectorAll('.floor-content').forEach(function(el) { el.classList.remove('active'); });
    var targetId;
    if (floorId === 'roof') targetId = 'floor-roof';
    else if (floorId === 'penthouse') targetId = 'floor-penthouse';
    else targetId = 'floor-' + floorId;
    var target = document.getElementById(targetId);
    if (target) target.classList.add('active');
    var bgImg = target ? target.dataset.bg : null;
    if (bgImg && roomBackground) roomBackground.style.backgroundImage = "url('" + bgImg + "')";
    // if (floorId !== 1) { showElement(inventory); renderInventory(); }
    saveState();
}

function playElevatorEffect() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var now = audioCtx.currentTime;
    
    var beepOsc = audioCtx.createOscillator();
    var beepGain = audioCtx.createGain();
    beepOsc.type = 'sine'; beepOsc.frequency.value = 800;
    beepOsc.connect(beepGain); beepGain.connect(audioCtx.destination);
    beepGain.gain.setValueAtTime(0, now);
    beepGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    beepGain.gain.linearRampToValueAtTime(0, now + 0.15);
    beepOsc.start(now); beepOsc.stop(now + 0.15);

    var rumbleOsc = audioCtx.createOscillator();
    var rumbleGain = audioCtx.createGain();
    rumbleOsc.type = 'triangle'; rumbleOsc.frequency.value = 50;
    rumbleOsc.connect(rumbleGain); rumbleGain.connect(audioCtx.destination);
    rumbleGain.gain.setValueAtTime(0, now + 0.2);
    rumbleGain.gain.linearRampToValueAtTime(0.5, now + 0.5);
    rumbleGain.gain.setValueAtTime(0.5, now + 1.8);
    rumbleGain.gain.linearRampToValueAtTime(0, now + 2.0);
    rumbleOsc.start(now + 0.2); rumbleOsc.stop(now + 2.0);

    if (navigator.vibrate) navigator.vibrate([100, 100, 1500]);
}

function moveToFloor(floorId, label) {
    if (roomBackground) {
        roomBackground.style.transition = 'transform 1.5s ease-in, filter 1.5s ease-in';
        roomBackground.style.transform = 'scale(1.4)';
        roomBackground.style.filter = 'blur(3px) brightness(0.6)';
    }
    


        setTimeout(function() {
        var indicator = elevatorUI ? elevatorUI.querySelector('.floor-indicator') : null;
        if (indicator) indicator.textContent = label || (floorId + 'F');
        showElement(elevatorUI);
        
        if (elevatorUI) {
            elevatorUI.style.transition = 'none';
            elevatorUI.style.transform = 'scale(1)';
            elevatorUI.style.opacity = '1';
            elevatorUI.classList.add('closed');
            elevatorUI.classList.add('elevator-shake');
        }
        playElevatorEffect();
        
        // 1. Change the floor UI and background immediately while doors are closed
        changeFloorUI(floorId);
        if (roomBackground) {
            roomBackground.style.transition = 'none';
            roomBackground.style.transform = 'scale(1)';
            roomBackground.style.filter = 'none';
        }
        
        setTimeout(function() {
            if (elevatorUI) {
                elevatorUI.classList.remove('elevator-shake');
                elevatorUI.classList.remove('closed');
                elevatorUI.style.transition = 'transform 1.2s ease-in, opacity 1.2s ease-in';
                elevatorUI.style.transform = 'scale(1.5)';
                elevatorUI.style.opacity = '0';
            }
            
            setTimeout(function() {
                changeFloorUI(floorId);
                if (roomBackground) {
                    roomBackground.style.transition = 'none';
                    roomBackground.style.transform = 'scale(1)';
                    roomBackground.style.filter = 'none';
                }
                hideElement(elevatorUI);
                if (elevatorUI) {
                    elevatorUI.classList.remove('closed');
                    elevatorUI.style.transition = 'none';
                    elevatorUI.style.transform = 'scale(1)';
                    elevatorUI.style.opacity = '1';
                }
            }, 1200);
        }, 2200);
    }, 1500);
}

function showAlert(msg, color) {
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%);background:' + (color||'#b38b59') + ';color:#000;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:9999;font-size:1rem;box-shadow:0 4px 16px rgba(0,0,0,0.5);';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(function() { div.remove(); }, 2200);
}

function setupDoorlock(floorPrefix, correctCode, onSuccess, onClose) {
    var panel = document.getElementById(floorPrefix + '-doorlock');
    var display = document.getElementById(floorPrefix + '-display');
    var closeBtn = document.getElementById(floorPrefix + '-doorlock-close');
    if (!panel) return;
    // 오디오 관련 헬퍼 함수들 (도어락용)
    function playBeep() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            var osc = audioCtx.createOscillator(); var gain = audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.connect(gain); gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
            osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) { console.error('Audio playback failed', e); }
    }
    
    function playSuccess() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            var now = audioCtx.currentTime;
            var notes = [523.25, 659.25, 783.99, 1046.50]; // 도, 미, 솔, 도
            notes.forEach(function(freq, i) {
                var osc = audioCtx.createOscillator(); var gain = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + i*0.1);
                osc.connect(gain); gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0, now + i*0.1);
                gain.gain.linearRampToValueAtTime(0.1, now + i*0.1 + 0.02);
                gain.gain.linearRampToValueAtTime(0, now + i*0.1 + 0.1);
                osc.start(now + i*0.1); osc.stop(now + i*0.1 + 0.1);
            });
        } catch (e) { console.error('Audio playback failed', e); }
    }
    
    function playError() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            var osc = audioCtx.createOscillator(); var gain = audioCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.connect(gain); gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) { console.error('Audio playback failed', e); }
    }

    var current = '';
    panel.querySelectorAll('.key-btn').forEach(function(btn) {
        btn.onclick = null;
        btn.addEventListener('click', function() {
            var val = btn.textContent;
            playBeep();
            
            if (btn.classList.contains('clr-btn')) {
                current = ''; display.textContent = '----';
            } else if (btn.classList.contains('enter-btn')) {
                if (current === correctCode) {
                    display.textContent = 'OPEN'; display.style.color = '#0f0';
                    playSuccess();
                    setTimeout(function() {
                        hideElement(panel); display.textContent = '----'; display.style.color = '#0ff'; current = '';
                        if (onSuccess) onSuccess();
                    }, 1000);
                } else {
                    display.textContent = 'ERR'; display.style.color = '#f00';
                    playError();
                    setTimeout(function() { display.textContent = '----'; display.style.color = '#0ff'; current = ''; }, 600);
                }
            } else {
                if (current.length < 4) { current += val; display.textContent = current.padEnd(4, '-'); }
            }
        });
    });
    if (closeBtn) closeBtn.onclick = function() {
        hideElement(panel); current = ''; display.textContent = '----'; display.style.color = '#0ff';
        if (onClose) onClose();
    };
}

function setupDragDrop(itemsId) {
    var items = document.querySelectorAll('#' + itemsId + ' .draggable-item');
    var dragged = null;
    window.selectedDragItem = null;
    items.forEach(function(item) {
        item.addEventListener('dragstart', function() { dragged = item; item.style.opacity = '0.5'; });
        item.addEventListener('dragend', function() { item.style.opacity = '1'; dragged = null; });
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.draggable-item').forEach(i => i.style.border = '1px solid var(--accent)');
            window.selectedDragItem = item;
            item.style.border = '3px solid #0ff';
        });
    });
    document.querySelectorAll('.drop-zone').forEach(function(zone) {
        zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('hover'); });
        zone.addEventListener('dragleave', function() { zone.classList.remove('hover'); });
        zone.addEventListener('drop', function(e) {
            e.preventDefault(); zone.classList.remove('hover');
            if (dragged) {
                zone.appendChild(dragged);
                dragged.style.border = '1px solid var(--accent)';
            }
        });
        zone.addEventListener('click', function() {
            if (window.selectedDragItem) {
                zone.appendChild(window.selectedDragItem);
                window.selectedDragItem.style.border = '1px solid var(--accent)';
                window.selectedDragItem = null;
            }
        });
    });
}
// ===================== 인트로 & 1층 로비 =====================
function initIntroAndLobby() {
    var phoneVoice = new Audio('엄마 영상통화.mp4');
    phoneVoice.loop = false; phoneVoice.volume = 1.0;

    var realStartBtn = document.getElementById('real-start-btn');
    var startScreen = document.getElementById('start-screen');
    var introVideoScreen = document.getElementById('intro-video-screen');
    var introVideo = document.getElementById('intro-video');
    var secretSkipBtn = document.getElementById('secret-skip-btn');
    var scenePhone = document.getElementById('scene-phone');
    var answerBtn = document.getElementById('answer-btn');
    var inCall = document.getElementById('in-call');
    var incomingCall = document.getElementById('incoming-call');
    var endCallWrapper = document.getElementById('end-call-wrapper');
    var phoneOkBtn = document.getElementById('phone-ok-btn');
    var sceneExterior = document.getElementById('scene-exterior');
    var exteriorText = document.getElementById('exterior-overlay-text');
    var floor1 = document.getElementById('floor-1');
    var agentPortrait = document.getElementById('agent-portrait');
    var lobbyDialogueBox = document.getElementById('lobby-dialogue-box');
    var dialogueText = document.getElementById('dialogue-text');
    var nextDialogueBtn = document.getElementById('next-dialogue-btn');
    var nameInputContainer = document.getElementById('name-input-container');
    var playerNameInput = document.getElementById('player-name');
    var startBtn = document.getElementById('start-btn');
    var personalityTestModal = document.getElementById('personality-test-modal');
    var testBtns = document.querySelectorAll('.test-btn');
    var callTimer = document.querySelector('.call-timer');

    var callTimerInterval, callSeconds = 0;
    function startCallTimer() {
        callTimerInterval = setInterval(function() {
            callSeconds++;
            var m = String(Math.floor(callSeconds/60)).padStart(2,'0');
            var s = String(callSeconds%60).padStart(2,'0');
            if (callTimer) callTimer.textContent = m + ':' + s;
        }, 1000);
    }

    var dialogues = [
        { text: '안녕하세요! 오늘 미스터리 맨션 매물 투어를 예약하신 분 맞으시죠? 저는 담당 공인중개사입니다.', showNext: true },
        { text: '이 맨션은 구조가 아주 특별합니다. 각 층의 매물마다 독특한 인테리어와 잠금장치가 설치되어 있거든요.', showNext: true },
        { text: '가장 마음에 드는 완벽한 집을 찾으시려면 직접 방을 꼼꼼히 둘러보셔야 합니다. 자, 투어를 시작하기 전에 방문자 명록에 서명부터 해주시겠어요?', showNext: false, action: showNameInput }
    ];
    var dialogueIndex = 0;

    function showDialogue(index) {
        var d = dialogues[index];
        if (dialogueText) dialogueText.textContent = d.text;
        if (nextDialogueBtn) {
            nextDialogueBtn.style.display = d.showNext ? 'block' : 'none';
            if (!d.showNext && d.action) setTimeout(d.action, 1000);
        }
    }
    function showNameInput() {
        if (nameInputContainer) { showElement(nameInputContainer); nameInputContainer.classList.remove('hidden'); }
    }
    var ringInterval = null;
    function startRingtone() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); function playBeep() { var osc1 = audioCtx.createOscillator(); var osc2 = audioCtx.createOscillator(); var gain = audioCtx.createGain(); osc1.type = 'sine'; osc2.type = 'sine'; osc1.frequency.value = 440; osc2.frequency.value = 480; osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination); gain.gain.setValueAtTime(0, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 1.0); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.1); osc1.start(audioCtx.currentTime); osc2.start(audioCtx.currentTime); osc1.stop(audioCtx.currentTime + 1.1); osc2.stop(audioCtx.currentTime + 1.1); } playBeep(); ringInterval = setInterval(playBeep, 3000); }
    function stopRingtone() { if (ringInterval) clearInterval(ringInterval); }

    function startPhoneScene() {
        if (introVideoScreen) hideElement(introVideoScreen);
        if (scenePhone) { showElement(scenePhone); scenePhone.classList.remove('hidden'); scenePhone.style.display = 'flex'; }
        startRingtone();
    }

    if (realStartBtn) {
        realStartBtn.addEventListener('click', function() {
            hideElement(startScreen);
            if (introVideoScreen) { showElement(introVideoScreen); introVideoScreen.classList.remove('hidden'); }
            if (introVideo) {
                var playPromise = introVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(function() {
                        // 영상 재생 실패시 (파일 없음 등) 전화 씬으로
                        hideElement(introVideoScreen);
                        startPhoneScene();
                    });
                }
            } else { startPhoneScene(); }
        });
    }
    if (secretSkipBtn) {
        secretSkipBtn.addEventListener('click', function() {
            if (introVideoScreen && !introVideoScreen.classList.contains('hidden')) {
                if (introVideo) introVideo.pause();
                hideElement(introVideoScreen); startPhoneScene();
            }
        });
    }
    if (introVideo) {
        introVideo.addEventListener('ended', function() {
            setTimeout(startPhoneScene, 500);
        });
    }
    if (answerBtn) {
        answerBtn.addEventListener('click', function() {
            stopRingtone();
            hideElement(incomingCall);
            if (inCall) { showElement(inCall); inCall.classList.remove('hidden'); }
            phoneVoice.play().catch(function(){});
            startCallTimer();
            setTimeout(function() {
                if (endCallWrapper) { showElement(endCallWrapper); endCallWrapper.classList.remove('hidden'); }
            }, 6000);
        });
    }
    if (phoneOkBtn) {
        phoneOkBtn.addEventListener('click', function() {
            clearInterval(callTimerInterval);
            phoneVoice.pause(); phoneVoice.currentTime = 0;
            hideElement(scenePhone);
            if (sceneExterior) { showElement(sceneExterior); sceneExterior.classList.remove('hidden'); sceneExterior.style.display = 'flex'; }
            setTimeout(function() { if (exteriorText) exteriorText.classList.add('fade-in'); }, 300);
            setTimeout(function() {
                hideElement(sceneExterior);
                if (floor1) floor1.classList.add('active');
                if (roomBackground) roomBackground.style.backgroundImage = "url('bg_lobby.png')";
                setTimeout(function() {
                    if (agentPortrait) { showElement(agentPortrait); agentPortrait.classList.add('pop-up'); }
                    setTimeout(function() { showElement(lobbyDialogueBox); showDialogue(0); }, 600);
                }, 2500);
            }, 3500);
        });
    }
    if (nextDialogueBtn) {
        nextDialogueBtn.addEventListener('click', function() {
            dialogueIndex++;
            if (dialogueIndex < dialogues.length) showDialogue(dialogueIndex);
        });
    }
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            var name = playerNameInput ? playerNameInput.value.trim() : '';
            if (!name) { showAlert('이름을 입력해주세요!', '#ff6b6b'); return; }
            state.playerName = name; saveState();
            hideElement(nameInputContainer); showElement(personalityTestModal);
        });
    }
    testBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            state.personalityType = btn.dataset.type; saveState();
            hideElement(personalityTestModal);
            if (agentPortrait) hideElement(agentPortrait);
            if (lobbyDialogueBox) hideElement(lobbyDialogueBox);
            showAlert('성향: ' + state.personalityType, '#b38b59');
            setTimeout(function() { moveToFloor(2, '2F'); }, 1200);
        });
    });
}

// ===================== 2층: 신혼부부 =====================
function initFloor2() {
    var showDoorlockBtn = document.getElementById('show-entrance-doorlock-btn');
    var f2Doorlock = document.getElementById('f2-doorlock');
    var f2InsideScene = document.getElementById('f2-inside-scene');
    var f2EntranceScene = document.getElementById('f2-entrance-scene');
    var startF2Btn = document.getElementById('start-f2-btn');
    var m1 = document.getElementById('f2-minigame-1');
    var m2 = document.getElementById('f2-minigame-2');
    var m3 = document.getElementById('f2-minigame-3');
    var checkM1 = document.getElementById('check-f2-m1');
    var checkM2 = document.getElementById('check-f2-m2');
    var checkM3 = document.getElementById('check-f2-m3');
    var hint = document.getElementById('f2-password-hint');
    var hiddenMagnet = document.getElementById('f2-hidden-magnet');
    var showMemoBtn = document.getElementById('show-memo-btn');
    var closeMemoBtn = document.getElementById('close-memo-btn');
    var memoScene = document.getElementById('f2-memo-scene');
    var crumpledMemo = document.getElementById('crumpled-memo');
    if (!showDoorlockBtn) return;

    // 201호 배경이 완전히 나타난 후 1초 뒤 대화창 표시
    // moveToFloor(2) 호출: 1200ms 후 시작 → 엘리베이터 완전 소멸: +4900ms → 배경 노출 후 1초 대기 = 총 7100ms
    setTimeout(function() {
        var d = document.getElementById('f2-entrance-dialogue');
        if (d) {
            d.style.opacity = '0';
            d.style.transition = 'opacity 0.6s ease';
            d.style.display = 'block';
            setTimeout(function() { d.style.opacity = '1'; }, 50);
        }
    }, 7100);

    // OX 퀴즈 인터랙션
    var oxAnswers = { 1: null, 2: null, 3: null, 4: null };
    window.selectOX = function(q, val) {
        oxAnswers[q] = val;
        var oBtn = document.getElementById('ox-q' + q + '-o');
        var xBtn = document.getElementById('ox-q' + q + '-x');
        if (val === 'O') {
            if (oBtn) { oBtn.style.background = '#5a8a5a'; oBtn.style.color = '#fff'; }
            if (xBtn) { xBtn.style.background = 'transparent'; xBtn.style.color = '#cc4444'; }
        } else {
            if (xBtn) { xBtn.style.background = '#cc4444'; xBtn.style.color = '#fff'; }
            if (oBtn) { oBtn.style.background = 'transparent'; oBtn.style.color = '#5a8a5a'; }
        }
        var disp = document.getElementById('ox-code-display');
        if (disp) {
            var code = '';
            for (var i = 1; i <= 4; i++) {
                if (oxAnswers[i] === 'O') code += '1';
                else if (oxAnswers[i] === 'X') code += '0';
                else code += '_';
                if (i < 4) code += ' ';
            }
            disp.textContent = code;
        }
    };

    if (showMemoBtn) {
        showMemoBtn.addEventListener('click', function() {
            showElement(memoScene);
            setTimeout(function() {
                crumpledMemo.style.transform = 'scale(1) rotate(0deg)';
                crumpledMemo.style.opacity = '1';
            }, 50);
        });
    }

    if (closeMemoBtn) {
        closeMemoBtn.addEventListener('click', function() {
            crumpledMemo.style.transform = 'scale(0.1) rotate(20deg)';
            crumpledMemo.style.opacity = '0';
            setTimeout(function() {
                hideElement(memoScene);
                showMemoBtn.classList.add('hidden');
                showDoorlockBtn.classList.remove('hidden');
                showElement(f2Doorlock); // 도어락 바로 표시
            }, 800);
        });
    }

    showDoorlockBtn.addEventListener('click', function() { showElement(f2Doorlock); });
    setupDoorlock('f2', '1001', function() {
        hideElement(f2EntranceScene);
        if (roomBackground) {
            roomBackground.style.transition = 'none';
            roomBackground.style.transform = 'scale(1) translate(0, 0)';
            roomBackground.style.backgroundImage = "url('201호신혼부부 하우스.png')";
        }
        
        // 1. 전체 모습 1초간 보여주고 대사 등장
        setTimeout(function() {
            if (f2InsideScene) { showElement(f2InsideScene); f2InsideScene.classList.remove('hidden'); }
            var d = document.getElementById('f2-dialogue');
            if (d) d.style.display = 'block';
        }, 1000);
    }, null);

    var showFridgeMemoBtn = document.getElementById('show-fridge-memo-btn');
    if (showFridgeMemoBtn) {
        showFridgeMemoBtn.addEventListener('click', function() {
            var d = document.getElementById('f2-dialogue');
            if (d) d.style.display = 'none';
            
            // 2. 냉장고 쪽으로 줌인
            if (roomBackground) {
                roomBackground.style.transition = 'transform 2s ease-in-out';
                roomBackground.style.transform = 'scale(2.2) translate(15%, 5%)';
            }
            
            // 3. 줌인 완료 후 메모 표시
            setTimeout(function() {
                var memoPopup = document.getElementById('f2-couple-memo-popup');
                var memoImg = document.getElementById('f2-couple-memo-img');
                if (memoPopup) {
                    showElement(memoPopup); memoPopup.classList.remove('hidden');
                    if (memoImg) {
                        setTimeout(function() { memoImg.style.transform = 'scale(1)'; }, 50);
                    }
                }
            }, 2000);
        });
    }

    var closeCoupleMemoBtn = document.getElementById('close-couple-memo-btn');
    if (closeCoupleMemoBtn) {
        closeCoupleMemoBtn.addEventListener('click', function() {
            var memoPopup = document.getElementById('f2-couple-memo-popup');
            if (memoPopup) hideElement(memoPopup);
            
            // 줌아웃 (다시 원래 뷰로 복귀)
            if (roomBackground) {
                roomBackground.style.transition = 'transform 1s ease-in-out';
                roomBackground.style.transform = 'scale(1) translate(0, 0)';
            }
            
            // 4. 메모 닫은 후 새로운 대사창 등장
            setTimeout(function() {
                var d2 = document.getElementById('f2-dialogue-2');
                if (d2) d2.style.display = 'block';
            }, 1000);
        });
    }

    var startF2Btn = document.getElementById('start-f2-btn');
    if (startF2Btn) {
        startF2Btn.onclick = function() {
            var d2 = document.getElementById('f2-dialogue-2');
            if (d2) d2.style.display = 'none';
            var m1 = document.getElementById('f2-minigame-1');
            if (m1) showElement(m1);
            setupDragDrop('room-items');
        };
    }

    if (checkM1) {
        var resetM1 = document.getElementById('reset-f2-m1');
        if (resetM1) {
            resetM1.addEventListener('click', function() {
                var container = document.getElementById('room-items');
                if (!container) return;
                document.querySelectorAll('#f2-minigame-1 .drop-zone .draggable-item').forEach(function(item) {
                    container.appendChild(item);
                });
                document.querySelectorAll('#f2-minigame-1 .drop-zone').forEach(function(zone) {
                    zone.innerHTML = '여기에 드래그';
                });
            });
        }
        checkM1.addEventListener('click', function() {
            var allCorrect = true;
            document.querySelectorAll('#f2-minigame-1 .drop-zone').forEach(function(zone) {
                var requiredTarget = zone.dataset.target;
                zone.querySelectorAll('.draggable-item').forEach(function(item) {
                    if (item.dataset.zone !== requiredTarget) allCorrect = false;
                });
            });
            if (document.querySelectorAll('#room-items .draggable-item').length > 0) allCorrect = false;
            if (allCorrect) {
                state.f2m1Done = true;
                showAlert('정답! 공간 구역 분류 완료! 다음 문제로 넘어갑니다.', '#4cd964');
                setTimeout(function() { 
                    var m1 = document.getElementById('f2-minigame-1');
                    var m2 = document.getElementById('f2-minigame-2');
                    if (m1) hideElement(m1); 
                    if (m2) showElement(m2);
                    setupDragDrop('furniture-items');
                }, 1000);
            } else { showAlert('다시 확인해봐!', '#ff6b6b'); }
        });
    }

    // MCQ 헬퍼 함수
    function setupMCQ(gameId, checkBtnId) {
        var options = document.querySelectorAll('#' + gameId + ' .mcq-btn');
        var checkBtn = document.getElementById(checkBtnId);
        options.forEach(function(btn) {
            btn.addEventListener('click', function() {
                options.forEach(function(b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                if (checkBtn) checkBtn.classList.remove('hidden');
            });
        });
    }
    setupMCQ('f2-minigame-2', 'check-f2-m2');
    setupMCQ('f2-minigame-3', 'check-f2-m3');

    if (checkM2) {
        checkM2.addEventListener('click', function() {
            var selected = document.querySelector('#f2-minigame-2 .mcq-btn.selected');
            if (selected && selected.dataset.correct === 'true') {
                state.f2m2Done = true;
                showAlert('정답! 가사 동선이 훨씬 효율적으로 개선되었어요.', '#4cd964');
                setTimeout(function() { 
                    var m2 = document.getElementById('f2-minigame-2');
                    var m3 = document.getElementById('f2-minigame-3');
                    if (m2) hideElement(m2); 
                    if (m3) showElement(m3);
                }, 1500);
            } else { showAlert('오답입니다. 동선이 겹치거나 너무 길어지면 안 돼요!', '#ff6b6b'); }
        });
    }

    if (checkM3) {
        checkM3.addEventListener('click', function() {
            var selected = document.querySelector('#f2-minigame-3 .mcq-btn.selected');
            if (selected && selected.dataset.correct === 'true') {
                state.f2m3Done = true;
                showAlert('정답! 모든 문제 해결 완료!', '#4cd964');
                
                setTimeout(function() { 
                    var m3 = document.getElementById('f2-minigame-3');
                    if (m3) hideElement(m3); 
                    
                    // 화면 하얗게 번쩍이는 효과
                    var flash = document.createElement('div');
                    flash.style.position = 'absolute';
                    flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%';
                    flash.style.backgroundColor = 'white';
                    flash.style.opacity = '0';
                    flash.style.zIndex = '9999';
                    flash.style.transition = 'opacity 0.5s ease-in-out';
                    document.body.appendChild(flash);
                    
                    setTimeout(function() { flash.style.opacity = '1'; }, 50);
                    
                    setTimeout(function() {
                        var roomBackground = document.getElementById('room-background');
                        if (roomBackground) {
                            roomBackground.style.backgroundImage = "url('201호 신혼부부 공간 정리된 공간.png')";
                        }
                        flash.style.opacity = '0';
                        setTimeout(function() { flash.remove(); }, 500);
                        
                        setTimeout(function() {
                            var d = document.getElementById('f2-dialogue');
                            if (d) {
                                d.style.display = 'block';
                                d.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"어떠신가요? 공간을 잘 분리하니 꽤 살만한 집이 되었죠?"</p><button id="f2-after-magic-btn" class="action-btn">다음</button>';
                                document.getElementById('f2-after-magic-btn').addEventListener('click', function() {
                                    d.innerHTML = '<p class="speaker">나(플레이어)</p><p class="text">"음... 생각보다 괜찮긴 한데, 다른 집도 보고 싶어요."</p><button id="f2-close-magic-btn" class="action-btn">다음</button>';
                                    document.getElementById('f2-close-magic-btn').addEventListener('click', function() {
                                        d.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"알겠습니다. 그럼 다음 집으로 가보시죠!"</p><button id="f2-go-f3-btn" class="action-btn">301호로 이동</button>';
                                        document.getElementById('f2-go-f3-btn').addEventListener('click', function() {
                                            d.style.display = 'none';
                                            moveToFloor(3, '3F');
                                        });
                                    });
                                });
                            }
                        }, 1500);
                    }, 1500);
                }, 1000);
            } else { showAlert('다시 한 번 생각해 보세요. 소음을 피해 편히 쉴 수 있어야 해요!', '#ff6b6b'); }
        });
    }
    if (hiddenMagnet) {
        hiddenMagnet.addEventListener('click', function() { showAlert('냉장고 자석 뒤에서 글자를 확인!', '#b38b59'); });
    }
}

// ===================== 3층: 자취생 (동선) =====================
function initFloor3() {
    var showDoorlockBtn = document.getElementById('show-f3-doorlock-btn');
    var f3Doorlock = document.getElementById('f3-doorlock');
    var f3EntranceScene = document.getElementById('f3-entrance-scene');
    var f3InsideScene = document.getElementById('f3-inside-scene');
    var startF3Btn = document.getElementById('start-f3-btn');
    var m1 = document.getElementById('f3-minigame-1');
    var m2 = document.getElementById('f3-minigame-2');
    var m3 = document.getElementById('f3-minigame-3');
    var hint = document.getElementById('f3-password-hint');
    var f3EntranceDialogue1 = document.getElementById('f3-entrance-dialogue');
    var f3EntranceDialogue2 = document.getElementById('f3-entrance-dialogue-2');
    var f3NextDialogueBtn = document.getElementById('f3-next-dialogue-btn');
    var showF3M0Btn = document.getElementById('show-f3-m0-btn');
    var m0 = document.getElementById('f3-minigame-0');
    if (!showDoorlockBtn) return;

    // 301호 배경이 완전히 나타난 후 1초 뒤 대화창 표시
    // moveToFloor(3) 호출: 1200ms 후 시작 → 엘리베이터 완전 소멸: +4900ms → 배경 노출 후 1초 대기 = 총 7100ms
    setTimeout(function() {
        var d = document.getElementById('f3-entrance-dialogue');
        if (d) {
            d.style.opacity = '0';
            d.style.transition = 'opacity 0.6s ease';
            d.style.display = 'block';
            setTimeout(function() { d.style.opacity = '1'; }, 50);
        }
    }, 7100);

    if (f3NextDialogueBtn) {
        f3NextDialogueBtn.addEventListener('click', function() {
            hideElement(f3EntranceDialogue1);
            if (f3EntranceDialogue2) { showElement(f3EntranceDialogue2); f3EntranceDialogue2.classList.remove('hidden'); }
        });
    }

    if (showF3M0Btn) {
        showF3M0Btn.addEventListener('click', function() {
            hideElement(f3EntranceDialogue2);
            if (m0) { showElement(m0); m0.classList.remove('hidden'); }
        });
    }

    showDoorlockBtn.addEventListener('click', function() { showElement(f3Doorlock); hideElement(m0); });
    setupDoorlock('f3', '3962', function() {
        hideElement(f3EntranceScene);
        if (roomBackground) roomBackground.style.backgroundImage = "url('2. 301호 방 안 (정리 전 - 엉망인 부엌 동선).png')";
        setTimeout(function() {
            if (f3InsideScene) { 
                showElement(f3InsideScene); f3InsideScene.classList.remove('hidden'); 
            }
        }, 1000);
    }, function() {
        setTimeout(function() {
            hideElement(f3Doorlock);
            if (m0) { showElement(m0); m0.classList.remove('hidden'); }
        }, 500);
    });

    if (startF3Btn) {
        startF3Btn.addEventListener('click', function() {
            var d = document.getElementById('f3-dialogue'); if (d) d.style.display = 'none';
            showElement(m1); initF3M1();
        });
    }

    var workbenchOrder = ['냉장고', '준비대', '개수대', '조리대', '가열대', '배선대', '식탁'];
    var f3m1Selected = [];
    function initF3M1() {
        var area = document.getElementById('f3-workbench-area');
        if (!area) return; area.innerHTML = ''; f3m1Selected = [];
        var shuffled = workbenchOrder.slice().sort(function() { return Math.random()-0.5; });
        shuffled.forEach(function(name) {
            var btn = document.createElement('button');
            btn.className = 'action-btn'; btn.style.cssText = 'font-size:0.9rem;padding:8px 14px;margin:4px;'; btn.textContent = name;
            btn.addEventListener('click', function() {
                var idx = f3m1Selected.indexOf(name);
                if (idx !== -1) {
                    // 재클릭 → 선택 취소
                    f3m1Selected.splice(idx, 1);
                    btn.style.opacity = '1'; btn.style.outline = '';
                } else {
                    f3m1Selected.push(name);
                    btn.style.opacity = '0.4'; btn.style.outline = '2px solid #b38b59';
                }
                var disp = document.getElementById('f3-order-display');
                if (disp) {
                    if (f3m1Selected.length === 0) {
                        disp.innerHTML = '<span style="color:#666;font-size:0.85rem;">클릭한 순서가 여기 표시됩니다...</span>';
                    } else {
                        disp.innerHTML = f3m1Selected.map(function(n) {
                            return '<span style="background:#b38b59;color:#000;padding:3px 5px;border-radius:4px;font-size:0.75rem;">' + n + '</span>';
                        }).join('<span style="font-size:0.75rem; color:#aaa; margin:0 2px;">→</span>');
                    }
                }
            });
            area.appendChild(btn);
        });
    }
    var resetF3M1 = document.getElementById('reset-f3-m1');
    if (resetF3M1) resetF3M1.addEventListener('click', function() {
        f3m1Selected = [];
        var disp = document.getElementById('f3-order-display');
        if (disp) disp.innerHTML = '<span style="color:#666;font-size:0.85rem;">클릭한 순서가 여기 표시됩니다...</span>';
        document.querySelectorAll('#f3-workbench-area .action-btn').forEach(function(b) { b.disabled = false; b.style.opacity = '1'; });
    });
    var checkF3M1 = document.getElementById('check-f3-m1');
    if (checkF3M1) checkF3M1.addEventListener('click', function() {
        if (f3m1Selected.length !== 7) { showAlert('7개를 모두 순서대로 클릭하세요!', '#ff9'); return; }
        if (JSON.stringify(f3m1Selected) === JSON.stringify(workbenchOrder)) {
            state.f3m1Done = true; showAlert('정답! 부엌 작업대 순서 완벽!', '#4cd964');
            setTimeout(function() { hideElement(m1); showElement(m2); initF3M2(); }, 1000);
        } else { showAlert('순서가 틀렸어요! 냉장고→준비대→개수대→조리대→가열대→배선대→식탁', '#ff6b6b'); }
    });

    var kitchenQs = [
        { q: '좁은 복도형 공간에 일자로 가구를 배치해야 할 때 적합한 부엌 유형은?', opts: ['일자형', 'ㄱ자형', 'ㄷ자형', '아일랜드형'], ans: '일자형' },
        { q: '두 명이서 요리할 때 서로 맞은편에서 작업할 수 있어 효율적인 부엌 유형은?', opts: ['일자형', 'ㄱ자형', 'ㄷ자형', '아일랜드형'], ans: 'ㄷ자형' },
        { q: '오픈형 거실과 연결되어 손님 접대가 가능한 독립된 조리 공간이 있는 유형은?', opts: ['일자형', 'ㄱ자형', '아일랜드형', 'ㄷ자형'], ans: '아일랜드형' }
    ];
    var f3m2Ans = {};
    function initF3M2() {
        var area = document.getElementById('f3-matching-area'); if (!area) return; area.innerHTML = '';
        kitchenQs.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;border:1px solid #444;';
            var html = '<p style="color:#fff;margin-bottom:8px;font-size:0.95rem;">' + (i+1) + '. ' + q.q + '</p><div class="mcq-options" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
            q.opts.forEach(function(opt) {
                html += '<button class="mcq-btn f3-m2-btn" data-i="' + i + '" data-val="' + opt + '" style="text-align:center;padding:10px;font-size:0.95rem;">' + opt + '</button>';
            });
            html += '</div>';
            div.innerHTML = html;
            area.appendChild(div);
        });

        document.querySelectorAll('.f3-m2-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = btn.dataset.i;
                var val = btn.dataset.val;
                f3m2Ans[idx] = val;
                document.querySelectorAll('.f3-m2-btn[data-i="' + idx + '"]').forEach(function(b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
            });
        });
    }
    var checkF3M2 = document.getElementById('check-f3-m2');
    if (checkF3M2) checkF3M2.addEventListener('click', function() {
        if (Object.keys(f3m2Ans).length < kitchenQs.length) { showAlert('모든 문제에 답해주세요!', '#ff9'); return; }
        var correct = kitchenQs.every(function(q, i) { return f3m2Ans[i] === q.ans; });
        if (correct) { state.f3m2Done = true; showAlert('정답! 부엌 유형 매칭 완료!', '#4cd964'); setTimeout(function() { hideElement(m2); showElement(m3); initF3M3(); }, 1000); }
        else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });

    var oxQs3 = [
        { q: '동선은 짧을수록 편리하고 피로감이 줄어든다.', ans: 'O' },
        { q: '동적 공간과 정적 공간의 동선은 겹칠수록 효율적이다.', ans: 'X' },
        { q: '주방에서의 동선은 냉장고→개수대→조리대 순으로 계획하는 것이 원칙이다.', ans: 'O' }
    ];
    var f3m3Ans = {};
    function initF3M3() {
        var area = document.getElementById('f3-ox-area'); if (!area) return; area.innerHTML = ''; f3m3Ans = {};
        oxQs3.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;">' + (i+1) + '. ' + q.q + '</p><div style="display:flex;gap:10px;"><button class="f3ox action-btn" data-i="' + i + '" data-v="O" style="flex:1;">O</button><button class="f3ox action-btn" data-i="' + i + '" data-v="X" style="flex:1;background:#333;">X</button></div>';
            area.appendChild(div);
        });
        document.querySelectorAll('.f3ox').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = btn.dataset.i; f3m3Ans[idx] = btn.dataset.v;
                document.querySelectorAll('.f3ox[data-i="' + idx + '"]').forEach(function(b) { b.style.background='#333'; b.style.color='#fff'; });
                btn.style.background='#b38b59'; btn.style.color='#000';
            });
        });
    }
    var checkF3M3 = document.getElementById('check-f3-m3');
    if (checkF3M3) checkF3M3.addEventListener('click', function() {
        if (Object.keys(f3m3Ans).length < 3) { showAlert('모든 문제에 답해주세요!', '#ff9'); return; }
        var correct = oxQs3.every(function(q, i) { return f3m3Ans[i] === q.ans; });
        if (correct) {
            state.f3m3Done = true;
            var m3 = document.getElementById('f3-minigame-3');
            if (m3) hideElement(m3);
            showAlert('정답! 모든 문제를 맞췄습니다!', '#4cd964');
            
            // 방이 정리되는 효과
            var flash = document.createElement('div');
            flash.style.position = 'absolute'; flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%';
            flash.style.backgroundColor = 'white'; flash.style.opacity = '0'; flash.style.zIndex = '9999'; flash.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(flash);
            setTimeout(function() { flash.style.opacity = '1'; }, 50);
            
            setTimeout(function() {
                if (roomBackground) roomBackground.style.backgroundImage = "url('3. 301호 방 안 (정리 후 - 완벽한 동선).png')";
                flash.style.opacity = '0'; setTimeout(function() { flash.remove(); }, 500);
                
                setTimeout(function() {
                    var d = document.getElementById('f3-dialogue');
                    if (d) {
                        d.style.display = 'block';
                        d.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"우와, 부엌이 마술처럼 깔끔해졌네요! 이제 동선이 아주 효율적이에요."</p><button id="f3-after-magic-btn" class="action-btn">다음</button>';
                        document.getElementById('f3-after-magic-btn').addEventListener('click', function() {
                            d.innerHTML = '<p class="speaker">나(플레이어)</p><p class="text">"음... 부엌은 좋아졌는데 다른 집도 보고 싶어요."</p><button id="f3-close-magic-btn" class="action-btn">다음</button>';
                            document.getElementById('f3-close-magic-btn').addEventListener('click', function() {
                                d.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"알겠습니다. 그럼 4층으로 올라가 보시죠!"</p><button id="f3-go-f4-btn" class="action-btn">401호로 이동</button>';
                                document.getElementById('f3-go-f4-btn').addEventListener('click', function() {
                                    d.style.display = 'none';
                                    moveToFloor(4, '4F');
                                });
                            });
                        });
                    }
                }, 1500);
            }, 1000);
        } else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });
}

// ===================== 4층: 복층 원룸 =====================
function initFloor4() {
    var f4EntranceScene = document.getElementById('f4-entrance-scene');
    var f4InsideScene = document.getElementById('f4-inside-scene');
    var f4SketchHintScene = document.getElementById('f4-sketch-hint-scene');
    var f4Doorlock = document.getElementById('f4-doorlock');
    var showSketchBtn = document.getElementById('show-f4-sketch-btn');
    var sketchCloseBtn = document.getElementById('f4-sketch-close-btn');
    var showDoorlockBtn = document.getElementById('show-f4-doorlock-btn');
    var startF4Btn = document.getElementById('start-f4-btn');
    var m1 = document.getElementById('f4-minigame-1');
    var m2 = document.getElementById('f4-minigame-2');
    var m3 = document.getElementById('f4-minigame-3');
    var hint = document.getElementById('f4-password-hint');
    if (!showSketchBtn) return;

    // 401호 배경이 완전히 나타난 후 1초 뒤 대화창 표시
    // moveToFloor(4) 호출: 1200ms 후 시작 → 엘리베이터 완전 소멸: +4900ms → 배경 노출 후 1초 대기 = 총 7100ms
    setTimeout(function() {
        var d = document.getElementById('f4-entrance-dialogue');
        if (d) {
            d.style.opacity = '0';
            d.style.transition = 'opacity 0.6s ease';
            d.style.display = 'block';
            setTimeout(function() { d.style.opacity = '1'; }, 50);
        }
    }, 7100);

    showSketchBtn.addEventListener('click', function() {
        hideElement(f4EntranceScene); showElement(f4SketchHintScene);
    });
    if (sketchCloseBtn) sketchCloseBtn.addEventListener('click', function() {
        hideElement(f4SketchHintScene); showElement(f4EntranceScene);
    });
    if (showDoorlockBtn) showDoorlockBtn.addEventListener('click', function() {
        hideElement(f4SketchHintScene); showElement(f4Doorlock);
    });

    setupDoorlock('f4', 'LOFT', function() {
        hideElement(f4EntranceScene);
        
        // 팝업 생성: LOFT 뜻
        var loftPopup = document.createElement('div');
        loftPopup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);border:2px solid #b38b59;padding:30px;border-radius:12px;z-index:9999;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.8);animation:pop-in 0.5s ease-out;';
        loftPopup.innerHTML = '<h2 style="color:#ffd700;font-size:3rem;margin-bottom:10px;letter-spacing:5px;">LOFT</h2><p style="color:#fff;font-size:1.2rem;">(명사) 복층, 다락방<br><span style="font-size:0.9rem;color:#ccc;">공간을 입체적으로 활용하는 대표적인 주거 형태입니다.</span></p>';
        document.body.appendChild(loftPopup);
        
        setTimeout(function() {
            loftPopup.style.opacity = '0';
            loftPopup.style.transition = 'opacity 0.5s ease';
            setTimeout(function() { loftPopup.remove(); }, 500);
            
            if (roomBackground) roomBackground.style.backgroundImage = "url('401호 정리 안된 내부.png')"; // 정리가 덜 된 초기 내부 이미지
            if (f4InsideScene) { showElement(f4InsideScene); f4InsideScene.classList.remove('hidden'); }
            setTimeout(function() {
                var f4Dial = document.getElementById('f4-dialogue');
                if (f4Dial) f4Dial.style.display = 'block';
            }, 1000);
        }, 2500);
    }, function() {
        setTimeout(function() {
            hideElement(f4Doorlock);
            if (f4SketchHintScene) { showElement(f4SketchHintScene); f4SketchHintScene.classList.remove('hidden'); }
        }, 500);
    });

    if (startF4Btn) startF4Btn.addEventListener('click', function() {
        var d = document.getElementById('f4-dialogue'); if (d) d.style.display = 'none';
        showElement(m1); initF4M1();
    });

    var m1Opts = [
        { text: '1. (가구 최소화) 꼭 필요한 옷을 제외하고 모든 책과 옷을 버린다.', correct: false },
        { text: '2. (평면적 활용) 바닥 전체에 수납상자를 깔고 그 위에서 좁게 생활한다.', correct: false },
        { text: '3. (입체적 활용) 벽면의 높은 곳까지 닿는 키 큰 맞춤 수납장을 짜 넣고 사다리를 이용한다.', correct: true },
        { text: '4. (공간 분리) 방 한가운데에 큰 파티션을 세워 옷방과 서재를 억지로 나눈다.', correct: false }
    ];
    function initF4M1() {
        var area = document.getElementById('f4-m1-options'); if (!area) return; area.innerHTML = '';
        m1Opts.forEach(function(opt) {
            var btn = document.createElement('button'); btn.className = 'mcq-btn f4-m1-btn';
            btn.textContent = opt.text; btn.dataset.correct = opt.correct;
            btn.addEventListener('click', function() {
                document.querySelectorAll('.f4-m1-btn').forEach(function(b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                document.getElementById('check-f4-m1').style.display = 'block';
            });
            area.appendChild(btn);
        });
    }
    var checkF4M1 = document.getElementById('check-f4-m1');
    if (checkF4M1) checkF4M1.addEventListener('click', function() {
        var selected = document.querySelector('.f4-m1-btn.selected');
        if (selected && selected.dataset.correct === 'true') { state.f4m1Done = true; showAlert('정답! 입체적 공간 활용이라는 타당한 대안을 찾았습니다!', '#4cd964'); setTimeout(function() { hideElement(m1); showElement(m2); initF4M2(); }, 1000); }
        else { showAlert('다시 생각해 보세요. 원룸의 특징(높은 천장)을 최대한 활용할 수 있는 합리적인 대안을 골라야 합니다.', '#ff6b6b'); }
    });

    var m2Opts = [
        { text: '1. 크기를 마음대로 조절할 수 있는 \'접이식(확장형) 테이블\'과 포개어 보관할 수 있는 스툴을 구매한다.', correct: true },
        { text: '2. 시각적으로 넓어 보이도록 투명한 유리로 된 초대형 6인용 테이블을 고정으로 둔다.', correct: false },
        { text: '3. 친구들이 푹신하게 앉을 수 있도록 바닥의 절반을 차지하는 대형 L자형 소파를 배치한다.', correct: false },
        { text: '4. 가구를 아예 사지 않고 친구들이 올 때마다 밖에서 모인다.', correct: false }
    ];
    function initF4M2() {
        var area = document.getElementById('f4-m2-options'); if (!area) return; area.innerHTML = '';
        m2Opts.forEach(function(opt) {
            var btn = document.createElement('button'); btn.className = 'mcq-btn f4-m2-btn';
            btn.textContent = opt.text; btn.dataset.correct = opt.correct;
            btn.addEventListener('click', function() {
                document.querySelectorAll('.f4-m2-btn').forEach(function(b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                document.getElementById('check-f4-m2').style.display = 'block';
            });
            area.appendChild(btn);
        });
    }
    var checkF4M2 = document.getElementById('check-f4-m2');
    if (checkF4M2) checkF4M2.addEventListener('click', function() {
        var selected = document.querySelector('.f4-m2-btn.selected');
        if (selected && selected.dataset.correct === 'true') { state.f4m2Done = true; showAlert('정답! 다목적 가구를 활용한 훌륭한 선택입니다!', '#4cd964'); setTimeout(function() { hideElement(m2); showElement(m3); initF4M3(); }, 1000); }
        else { showAlert('다시 생각해 보세요. 평상시의 활동 공간(동선)을 방해하지 않는 것이 중요합니다.', '#ff6b6b'); }
    });

    var m3Opts = [
        { text: '1. 창문에서 들어오는 빛이 눈부시므로, 가장 크고 높은 옷장으로 창문을 완전히 가려 아늑하게 만든다.', correct: false },
        { text: '2. 방 중앙에 가구들을 옹기종기 모아 배치하고, 빈 벽면은 갤러리처럼 그림만 걸어둔다.', correct: false },
        { text: '3. 키가 큰 옷장 등은 시야를 가리지 않게 안쪽으로, 나머지 가구는 벽면을 따라 일렬로 배치하여 방 중앙의 활동 공간을 최대한 확보한다.', correct: true },
        { text: '4. 요리할 때 바로 먹을 수 있도록 침대를 주방 가스레인지 바로 옆에 바짝 붙여서 배치한다.', correct: false }
    ];
    function initF4M3() {
        var area = document.getElementById('f4-m3-options'); if (!area) return; area.innerHTML = '';
        m3Opts.forEach(function(opt) {
            var btn = document.createElement('button'); btn.className = 'mcq-btn f4-m3-btn';
            btn.textContent = opt.text; btn.dataset.correct = opt.correct;
            btn.addEventListener('click', function() {
                document.querySelectorAll('.f4-m3-btn').forEach(function(b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                document.getElementById('check-f4-m3').style.display = 'block';
            });
            area.appendChild(btn);
        });
    }
    var checkF4M3 = document.getElementById('check-f4-m3');
    if (checkF4M3) checkF4M3.addEventListener('click', function() {
        var selected = document.querySelector('.f4-m3-btn.selected');
        if (selected && selected.dataset.correct === 'true') {
            state.f4m3Done = true; 
            var m3 = document.getElementById('f4-minigame-3'); if (m3) hideElement(m3);
            
            // 방이 정리되는 효과
            var flash = document.createElement('div');
            flash.style.position = 'absolute'; flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%';
            flash.style.backgroundColor = 'white'; flash.style.opacity = '0'; flash.style.zIndex = '9999'; flash.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(flash);
            setTimeout(function() { flash.style.opacity = '1'; }, 50);
            
            setTimeout(function() {
                if (roomBackground) roomBackground.style.backgroundImage = "url('401호 복층 집안 내부.png')"; // 마술처럼 정리된 이미지
                flash.style.opacity = '0'; setTimeout(function() { flash.remove(); }, 500);
                
                setTimeout(function() {
                    var d = document.getElementById('f4-dialogue');
                    if (d) {
                        d.style.display = 'block';
                        d.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"우와, 방이 마술처럼 깔끔해졌네요! 복층 원룸의 공간 활용이 완벽해요."</p><button id="f4-after-magic-btn" class="action-btn">다음</button>';
                        document.getElementById('f4-after-magic-btn').addEventListener('click', function() {
                            d.innerHTML = '<p class="speaker">나(플레이어)</p><p class="text">"음... 좁은 원룸을 이렇게 활용하는 건 좋지만 다른 집도 보고 싶어요."</p><button id="f4-close-magic-btn" class="action-btn">다음</button>';
                            document.getElementById('f4-close-magic-btn').addEventListener('click', function() {
                                d.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"알겠습니다. 그럼 마지막 5층으로 올라가 보시죠! 501호 비밀번호는 집주인이 0501이라고 알려줬어요."</p><button id="f4-go-f5-btn" class="action-btn">501호로 이동</button>';
                                document.getElementById('f4-go-f5-btn').addEventListener('click', function() {
                                    d.style.display = 'none';
                                    moveToFloor(5, '5F');
                                });
                            });
                        });
                    }
                }, 1500);
            }, 1000);
        } else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });
}

// ===================== 5층: 모델하우스 =====================
function initFloor5() {
    var f5Doorlock = document.getElementById('f5-doorlock');
    var f5EntranceScene = document.getElementById('f5-entrance-scene');
    var f5InsideScene = document.getElementById('f5-inside-scene');
    var m1 = document.getElementById('f5-minigame-1');
    var m2 = document.getElementById('f5-minigame-2');
    var m3 = document.getElementById('f5-minigame-3');
    var hint = document.getElementById('f5-password-hint');

    // 501호 배경이 완전히 나타난 후 1초 뒤 대화창 표시
    // moveToFloor(5) 호출: 1200ms 후 시작 → 엘리베이터 완전 소멸: +4900ms → 배경 노출 후 1초 대기 = 총 7100ms
    setTimeout(function() {
        var d = document.getElementById('f5-entrance-dialogue');
        if (d) {
            d.style.opacity = '0';
            d.style.transition = 'opacity 0.6s ease';
            d.style.display = 'block';
            setTimeout(function() { d.style.opacity = '1'; }, 50);
        }
    }, 7100);

    var dEnt = document.getElementById('f5-entrance-dialogue');
    var entBtn1 = document.getElementById('f5-ent-btn-1');
    if (entBtn1) {
        entBtn1.addEventListener('click', function() {
            dEnt.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"하하, 보는 눈이 있으시군요! 여긴 저희가 야심 차게 꾸며놓은 최고급 \'모델하우스\'입니다. 완벽한 가구 배치만 보여주는 곳이라 원래 아무도 안 살죠."</p><button id="f5-ent-btn-2" class="action-btn">다음</button>';
            document.getElementById('f5-ent-btn-2').addEventListener('click', function() {
                dEnt.innerHTML = '<p class="speaker">나(플레이어)</p><p class="text">"근데 왜 도어락에... 누군가 방금까지 지문을 남긴 흔적이 있죠?"</p><button id="f5-ent-btn-3" class="action-btn">다음</button>';
                document.getElementById('f5-ent-btn-3').addEventListener('click', function() {
                    dEnt.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"(크게 놀라며) 네?! 잠시만요... 그럴 리가 없는데...! 4층에서 집주인이 적어준 비밀번호(0501)를 눌러보시죠!"</p><button id="show-f5-doorlock-btn" class="action-btn">도어락 누르기</button>';
                    document.getElementById('show-f5-doorlock-btn').addEventListener('click', function() { showElement(f5Doorlock); });
                });
            });
        });
    }

    setupDoorlock('f5', '0501', function() {
        hideElement(f5EntranceScene);
        if (roomBackground) roomBackground.style.backgroundImage = "url('501%ED%98%B8%20%EB%82%B4%EB%B6%80.png')";
        setTimeout(function() {
            if (f5InsideScene) { 
                showElement(f5InsideScene); f5InsideScene.classList.remove('hidden'); 
                var dIn = document.getElementById('f5-dialogue');
                if (dIn) {
                    dIn.style.display = 'block';
                var inBtn1 = document.getElementById('f5-in-btn-1');
                if (inBtn1) {
                    inBtn1.addEventListener('click', function() {
                        dIn.innerHTML = '<p class="speaker">나(플레이어)</p><p class="text">"심지어 가구 배치도 이상해요. 좁은 방에 이렇게 큰 가구들을 욱여넣다니... 도대체 누가 이런 짓을?"</p><button id="f5-in-btn-2" class="action-btn">다음</button>';
                        document.getElementById('f5-in-btn-2').addEventListener('click', function() {
                            dIn.innerHTML = '<p class="speaker">미스터리 공인중개사</p><p class="text">"(떨리는 목소리로) 일단... 가구 배치 원칙 8가지를 떠올려서, 이 기괴한 방의 오류들을 찾아보세요. 서둘러야 할 것 같습니다!"</p><button id="start-f5-btn" class="action-btn">가구 배치 조사하기</button>';
                            document.getElementById('start-f5-btn').addEventListener('click', function() {
                                dIn.style.display = 'none';
                                showElement(m1); initF5M1();
                            });
                        });
                    });
                }
            }
        }
        }, 1000);
    }, null);

    var errorItems = [
        { id: 'e1', text: '창문 앞에 대형 책장을 세워 햇빛을 완전히 막았다.', wrong: true },
        { id: 'e2', text: '침대를 문 바로 앞에 배치해 출입구를 막았다.', wrong: true },
        { id: 'e3', text: '소파를 먼저 배치한 후 작은 커피 테이블을 옆에 놓았다.', wrong: false },
        { id: 'e4', text: '콘센트 위에 소파를 딱 붙여 콘센트를 사용하지 못하게 했다.', wrong: true },
        { id: 'e5', text: '10평 원룸에 6인용 식탁을 배치해 이동 공간이 없다.', wrong: true },
        { id: 'e6', text: '무거운 장식품을 낮은 선반에 배치했다.', wrong: false }
    ];
    function initF5M1() {
        var area = document.getElementById('f5-error-area'); if (!area) return; area.innerHTML = '';
        errorItems.forEach(function(item) {
            var div = document.createElement('div'); div.style.cssText = 'padding:12px;border:1px solid #444;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.03);';
            div.innerHTML = '<label style="cursor:pointer;display:flex;align-items:center;gap:10px;"><input type="checkbox" id="err-' + item.id + '" style="width:18px;height:18px;"><span style="color:#ddd;">' + item.text + '</span></label>';
            area.appendChild(div);
        });
    }
    var checkF5M1 = document.getElementById('check-f5-m1');
    if (checkF5M1) checkF5M1.addEventListener('click', function() {
        var selected = errorItems.filter(function(item) { var cb = document.getElementById('err-' + item.id); return cb && cb.checked; });
        if (selected.length < 2) { showAlert('2개 이상 선택하세요!', '#ff9'); return; }
        if (selected.every(function(item) { return item.wrong; })) {
            state.f5m1Done = true; showAlert('정답! 잘못된 배치 발견!', '#4cd964');
            setTimeout(function() { hideElement(m1); showElement(m2); initF5M2(); }, 1000);
        } else { showAlert('잘못된 선택이 포함되어 있어요!', '#ff6b6b'); }
    });

    var sizeItems = [
        { id: 's1', text: '2인용 소파 (가로 180cm)', tooBig: false },
        { id: 's2', text: '6인용 식탁 (가로 180cm)', tooBig: true },
        { id: 's3', text: 'L형 소파 (가로 300cm)', tooBig: true },
        { id: 's4', text: '싱글 침대 (가로 100cm)', tooBig: false },
        { id: 's5', text: '대형 드레스룸 시스템 (가로 250cm)', tooBig: true },
        { id: 's6', text: '1인용 책상 (가로 100cm)', tooBig: false }
    ];
    function initF5M2() {
        var area = document.getElementById('f5-size-area'); if (!area) return; area.innerHTML = '';
        sizeItems.forEach(function(item) {
            var div = document.createElement('div'); div.style.cssText = 'padding:12px;border:1px solid #444;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.03);';
            div.innerHTML = '<label style="cursor:pointer;display:flex;align-items:center;gap:10px;"><input type="checkbox" id="siz-' + item.id + '" style="width:18px;height:18px;"><span style="color:#ddd;">' + item.text + '</span></label>';
            area.appendChild(div);
        });
    }
    var checkF5M2 = document.getElementById('check-f5-m2');
    if (checkF5M2) checkF5M2.addEventListener('click', function() {
        var selected = sizeItems.filter(function(item) { var cb = document.getElementById('siz-' + item.id); return cb && cb.checked; });
        var correctCount = sizeItems.filter(function(i) { return i.tooBig; }).length;
        if (selected.length === correctCount && selected.every(function(item) { return item.tooBig; })) {
            state.f5m2Done = true; showAlert('정답! 방 크기에 맞지 않는 가구 발견!', '#4cd964');
            setTimeout(function() { hideElement(m2); showElement(m3); initF5M3(); }, 1000);
        } else { showAlert('다시 확인해봐! (너무 큰 것만 선택)', '#ff6b6b'); }
    });

    var furnitureOrder = ['침대', '옷장', '책상', '협탁'];
    var f5m3Selected = [];
    function initF5M3() {
        var area = document.getElementById('f5-order-area'); if (!area) return; area.innerHTML = ''; f5m3Selected = [];
        var scrambledOrder = ['협탁', '옷장', '책상', '침대']; // 정답과 섞인 순서로 고정
        scrambledOrder.forEach(function(name) {
            var btn = document.createElement('button'); btn.className = 'action-btn'; btn.style.cssText = 'font-size:0.9rem;padding:8px 14px;margin:4px;'; btn.textContent = name;
            btn.addEventListener('click', function() {
                if (!btn.disabled) {
                    btn.disabled = true; btn.style.opacity = '0.4'; f5m3Selected.push(name);
                    var disp = document.getElementById('f5-order-result');
                    if (disp) disp.innerHTML = f5m3Selected.map(function(n) { return '<span style="background:#b38b59;color:#000;padding:4px 8px;border-radius:4px;font-size:0.85rem;">' + n + '</span>'; }).join(' → ');
                }
            });
            area.appendChild(btn);
        });
    }
    var resetF5M3 = document.getElementById('reset-f5-m3');
    if (resetF5M3) resetF5M3.addEventListener('click', function() {
        f5m3Selected = [];
        var disp = document.getElementById('f5-order-result');
        if (disp) disp.innerHTML = '<span style="color:#666;font-size:0.85rem;">클릭한 순서가 여기 표시됩니다...</span>';
        document.querySelectorAll('#f5-order-area .action-btn').forEach(function(b) { b.disabled = false; b.style.opacity = '1'; });
    });
    var checkF5M3 = document.getElementById('check-f5-m3');
    if (checkF5M3) checkF5M3.addEventListener('click', function() {
        if (f5m3Selected.length !== 4) { showAlert('4개를 모두 순서대로 클릭하세요!', '#ff9'); return; }
        if (JSON.stringify(f5m3Selected) === JSON.stringify(furnitureOrder)) {
            state.f5m3Done = true; 
            var m3 = document.getElementById('f5-minigame-3'); if (m3) hideElement(m3);
            var m4 = document.getElementById('f5-minigame-4'); if (m4) { showElement(m4); m4.classList.remove('hidden'); }
            initF5M4();
            showAlert('정답! 마지막 문제로 넘어갑니다.', '#4cd964');
        } else { showAlert('순서가 틀렸어요! 큰 가구부터 순서대로!', '#ff6b6b'); }
    });

    function initF5M4() {
        var draggables = document.querySelectorAll('.f5-drag');
        var dropZones = document.querySelectorAll('.f5-drop-zone');
        
        draggables.forEach(function(item) {
            item.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', item.id);
                setTimeout(function() { item.style.visibility = 'hidden'; }, 0);
            });
            item.addEventListener('dragend', function(e) {
                item.style.visibility = 'visible';
            });
        });

        dropZones.forEach(function(zone) {
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                zone.style.background = 'rgba(0,0,0,0.1)';
            });
            zone.addEventListener('dragleave', function(e) {
                zone.style.background = 'transparent';
            });
            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                zone.style.background = 'transparent';
                var id = e.dataTransfer.getData('text/plain');
                var draggable = document.getElementById(id);
                if (draggable && !zone.querySelector('.draggable-item')) {
                    zone.appendChild(draggable);
                    draggable.style.boxShadow = 'none';
                }
            });
        });

        var itemsArea = document.getElementById('f5-furniture-items');
        if (itemsArea) {
            itemsArea.addEventListener('dragover', function(e) { e.preventDefault(); });
            itemsArea.addEventListener('drop', function(e) {
                e.preventDefault();
                var id = e.dataTransfer.getData('text/plain');
                var draggable = document.getElementById(id);
                if (draggable) {
                    itemsArea.appendChild(draggable);
                    draggable.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
                }
            });
        }
    }
    
    var resetF5M4 = document.getElementById('reset-f5-m4');
    if (resetF5M4) resetF5M4.addEventListener('click', function() {
        var itemsArea = document.getElementById('f5-furniture-items');
        document.querySelectorAll('.f5-drag').forEach(function(item) {
            itemsArea.appendChild(item);
            item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
        });
    });

    var checkF5M4 = document.getElementById('check-f5-m4');
    var f5m4FailCount = 0;
    if (checkF5M4) checkF5M4.addEventListener('click', function() {
        var allCorrect = true;
        var placedCount = 0;
        document.querySelectorAll('.f5-drop-zone').forEach(function(zone) {
            var item = zone.querySelector('.f5-drag');
            if (item) {
                placedCount++;
                var target = zone.dataset.target;
                var type = item.dataset.type;
                // 각 가구는 정확한 위치에만 배치되어야 함 (침대는 창문 근처, 옷장은 구석)
                if (type !== target) {
                    allCorrect = false;
                }
            }
        });
        
        if (placedCount < 4) {
            showAlert('모든 가구를 평면도에 배치해주세요!', '#ff9');
            return;
        }

        if (allCorrect) {
            state.f5m4Done = true;
            showAlert('완벽한 가구 배치입니다! 벽 뒤에 숨겨진 비밀 패널이 열립니다.', '#4cd964');
            var f5ClearScene = document.getElementById('f5-password-hint');
            if (f5ClearScene) {
                showElement(f5ClearScene); f5ClearScene.classList.remove('hidden');
                // 벽지 열리는 애니메이션
                setTimeout(function() {
                    var wl = document.querySelector('.wall-door.left');
                    var wr = document.querySelector('.wall-door.right');
                    if(wl) wl.style.transform = 'translateX(-100%)';
                    if(wr) wr.style.transform = 'translateX(100%)';
                }, 500);

                var goRoofBtn = document.getElementById('f5-go-roof-btn');
                if (goRoofBtn && !goRoofBtn.dataset.bound) {
                    goRoofBtn.dataset.bound = "true";
                    goRoofBtn.addEventListener('click', function() { moveToRoofStairs(); });
                
    // 4층 정답 해설 팝업 로직
    var showSolBtn = document.getElementById('show-f4-solution-btn');
    var closeSolBtn = document.getElementById('close-f4-solution-btn');
    var solModal = document.getElementById('f4-solution-modal');
    if(showSolBtn && solModal) {
        showSolBtn.addEventListener('click', function() {
            solModal.style.display = 'block';
        });
    }
    if(closeSolBtn && solModal) {
        closeSolBtn.addEventListener('click', function() {
            solModal.style.display = 'none';
        });
    }

                }
            }
        } else {
            f5m4FailCount++;
            if (f5m4FailCount >= 2) {
                showAlert('틀렸어요! 💡힌트: 창문/콘센트 쪽→책상, 책상 옆→책장, 문/창문을 피한 아늑한 구석→침대, 출입문 앞→옷장!', '#ff9');
            } else {
                showAlert('가구 배치 원칙을 생각해보세요! 채광·동선·콘센트 위치를 고려하세요.', '#ff6b6b');
            }
        }
    });
}


// ===================== 옥상 이동 연출 (계단 & 철문) =====================
function moveToRoofStairs() {
    var f5m4 = document.getElementById('f5-minigame-4');
    if (f5m4) f5m4.style.display = 'none';
    var f5scene = document.getElementById('f5-inside-scene');
    if (f5scene) f5scene.style.display = 'none';
    if (roomBackground) {
        roomBackground.style.transition = 'transform 1.5s ease-in, filter 1.5s ease-in';
        roomBackground.style.transform = 'scale(1.4)';
        roomBackground.style.filter = 'blur(3px) brightness(0.2)'; // 어두워짐
    }
    
    // 발소리 효과음 (오디오 컨텍스트 활용 또는 간단한 텍스트 팝업)
    var stairsText = document.createElement('div');
    stairsText.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2rem;color:#fff;font-weight:bold;z-index:9999;opacity:0;transition:opacity 0.5s;text-shadow:0 0 10px #000;';
    stairsText.textContent = '헉... 헉... 계단을 오르는 중...';
    document.body.appendChild(stairsText);
    
    setTimeout(function() { stairsText.style.opacity = '1'; }, 1000);
    
    // 쿵쿵 발소리 흉내
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    for (var i = 0; i < 4; i++) {
        setTimeout(function() {
            try {
                var osc = audioCtx.createOscillator(); var gain = audioCtx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(50, audioCtx.currentTime);
                osc.connect(gain); gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.3);
                if (navigator.vibrate) navigator.vibrate(50);
            } catch(e) {}
        }, 1000 + i * 600);
    }
    
    setTimeout(function() {
        stairsText.textContent = '끼기기기긱— (무거운 철문 열리는 소리)';
        try {
            var osc = audioCtx.createOscillator(); var gain = audioCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
            osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 1.5);
        } catch(e) {}
        
        setTimeout(function() {
            stairsText.style.opacity = '0';
            setTimeout(function() { stairsText.remove(); }, 500);
            
            changeFloorUI('roof');
            if (roomBackground) {
                roomBackground.style.transition = 'none';
                roomBackground.style.transform = 'scale(1)';
                roomBackground.style.filter = 'none';
            }
        }, 2000);
    }, 3500);
}

// ===================== 옥상: 주거 지식 총정리 보너스 =====================
function initRoof() {
    var startRoofBtn = document.getElementById('start-roof-btn');
    var dDialogue = document.getElementById('roof-dialogue');
    
    var gameBookshelf = document.getElementById('roof-game-bookshelf');
    var bookContainer = document.getElementById('book-container');
    var rewardD = document.getElementById('roof-reward-d');
    
    var gameFloor = document.getElementById('roof-game-floor');
    var binBtn = document.getElementById('bin-btn');
    var closetBtn = document.getElementById('closet-btn');
    var messyItems = document.querySelectorAll('.mess-item');
    var rewardE = document.getElementById('roof-reward-e');
    var selectedItem = null;
    
    var gameOX = document.getElementById('roof-game-ox');
    var btnO = document.getElementById('ox-btn-o');
    var btnX = document.getElementById('ox-btn-x');
    var rewardSK = document.getElementById('roof-reward-sk');
    
    var blackoutOverlay = document.getElementById('blackout-overlay');
    var deskArea = document.getElementById('desk-clickable-area');
    var safePopup = document.getElementById('roof-safe-popup');
    var checkSafeBtn = document.getElementById('check-roof-safe');
    var safeInput = document.getElementById('roof-safe-input');
    
    var offlineGuide = document.getElementById('roof-offline-guide');
    var goToPenthouseBtn = document.getElementById('go-to-penthouse-btn');

    if (!startRoofBtn) return;

    // 장면이 나타나고 2초 후 진입 대화창 표시
    setTimeout(function() { if (dDialogue) dDialogue.style.display = 'block'; }, 2000);

    // 1단계 시작: 책장 정리
    startRoofBtn.addEventListener('click', function() {
        if (dDialogue) dDialogue.style.display = 'none';
        showElement(gameBookshelf);
        initBookshelfGame();
    });

    // --- 미니게임 1: 책장 테트리스 (드래그 대신 클릭으로 두 개 위치 교환) ---
    var selectedBook = null;
    function initBookshelfGame() {
        if (!bookContainer) return;
        bookContainer.innerHTML = '';
        var heights = [80, 110, 60, 100, 70];
        
        heights.forEach(function(h, i) {
            var b = document.createElement('div');
            b.className = 'game-box-item';
            b.style.cssText = 'width:30px;background:#8b5a2b;border:1px solid #333;height:' + h + 'px;cursor:pointer;transition:transform 0.2s;';
            b.dataset.h = h;
            b.addEventListener('click', function() {
                if(!selectedBook) {
                    selectedBook = b;
                    b.style.transform = 'translateY(-10px)';
                    b.style.boxShadow = '0 0 10px gold';
                } else {
                    if(selectedBook !== b) {
                        // 스왑 (Swap)
                        var tempH = selectedBook.dataset.h;
                        selectedBook.dataset.h = b.dataset.h;
                        selectedBook.style.height = b.dataset.h + 'px';
                        b.dataset.h = tempH;
                        b.style.height = tempH + 'px';
                    }
                    selectedBook.style.transform = 'translateY(0)';
                    selectedBook.style.boxShadow = 'none';
                    selectedBook = null;
                    checkBookshelf();
                }
            });
            bookContainer.appendChild(b);
        });
    }
    
    function checkBookshelf() {
        var current = Array.from(bookContainer.children).map(function(el){ return parseInt(el.dataset.h); });
        var isSorted = current.every(function(val, i){ return val === [160,140,120,100,80][i]; });
        if(isSorted) {
            showAlert('책장이 정리되었습니다!', '#4cd964');
            showElement(rewardD);
            var wInput = document.getElementById('bookshelf-word-input');
            if(wInput) wInput.style.display = 'block';
        }
    }
    
    // 마이하우스 정답 확인 로직
    var checkBookWordBtn = document.getElementById('check-book-word');
    if(checkBookWordBtn) {
        checkBookWordBtn.addEventListener('click', function() {
            var inputEl = document.getElementById('book-word-full');
            var val = inputEl ? inputEl.value.replace(/\s/g, '') : '';
            if(val === '마이하우스') {
                showAlert('정답입니다!', '#4cd964');
                setTimeout(function() { 
                    hideElement(gameBookshelf); 
                    showElement(gameFloor); 
                    setTimeout(showNextItem, 500);
                }, 1000);
            } else {
                showAlert('글자가 틀렸습니다.', '#ff6b6b');
            }
        });
    }

    // --- 미니게임 1: 책장 테트리스 (클릭으로 두 개 위치 교환) ---
    var selectedBook = null;
    function initBookshelfGame() {
        if (!bookContainer) return;
        bookContainer.innerHTML = '';
        bookContainer.style.height = '180px'; // 높이를 늘려줌
        
        var bookData = [
            { h: 120, title: "하중 분산 원리", color: "#6b4a2b" },
            { h: 160, title: "마루 시공 방법", color: "#8b5a2b" },
            { h: 80, title: "스마트홈", color: "#5a3a1b" },
            { h: 140, title: "이중창 단열재", color: "#9b6a3b" },
            { h: 100, title: "우드 인테리어", color: "#7b4a2b" }
        ];
        
        bookData.forEach(function(book) {
            var b = document.createElement('div');
            b.className = 'game-box-item';
            b.style.cssText = 'width:40px;background:' + book.color + ';border:2px solid #333;height:' + book.h + 'px;cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;display:flex;align-items:center;justify-content:center;border-radius:3px;box-shadow:2px 2px 5px rgba(0,0,0,0.5);position:relative;';
            b.dataset.h = book.h;
            
            var t = document.createElement('span');
            t.style.cssText = 'writing-mode: vertical-rl; text-orientation: upright; color:#f0d080; font-size:0.8rem; font-weight:bold; letter-spacing:-2px; text-shadow:1px 1px 1px #000;';
            t.textContent = book.title;
            b.appendChild(t);

            b.addEventListener('click', function() {
                if(!selectedBook) {
                    selectedBook = b;
                    b.style.transform = 'translateY(-10px)';
                    b.style.boxShadow = '0 0 15px gold';
                    b.style.borderColor = 'gold';
                } else {
                    if(selectedBook !== b) {
                        // 실제 DOM 노드 위치 스왑
                        var parent = b.parentNode;
                        var next1 = selectedBook.nextSibling;
                        var next2 = b.nextSibling;
                        
                        if(next1 === b) {
                            parent.insertBefore(b, selectedBook);
                        } else if(next2 === selectedBook) {
                            parent.insertBefore(selectedBook, b);
                        } else {
                            parent.insertBefore(selectedBook, next2);
                            parent.insertBefore(b, next1);
                        }
                    }
                    selectedBook.style.transform = 'translateY(0)';
                    selectedBook.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.5)';
                    selectedBook.style.borderColor = '#333';
                    selectedBook = null;
                    checkBookshelf();
                }
            });
            bookContainer.appendChild(b);
        });
    }

    // --- 미니게임 2: 수납 개념 심화 분류 (컨베이어 벨트) ---
    var classificationItem = document.getElementById('classification-item');
    var dropBoxes = document.querySelectorAll('.drop-box');
    var itemsToClassify = [
        { name: '비어있는 샴푸통', ans: 'trash' },
        { name: '밀봉된 안 쓰는 여분 이불', ans: 'warehouse' },
        { name: '은은한 향이 나는 디퓨저', ans: 'frequent' },
        { name: '책상 위 굴러다니는 영수증', ans: 'trash' },
        { name: '상자에 담긴 철 지난 옷', ans: 'warehouse' }
    ];
    var currentItemIdx = 0;
    var itemPos = 0;
    var conveyorInterval;
    var isDraggingItem = false;
    
    function showNextItem() {
        if(currentItemIdx < itemsToClassify.length) {
            classificationItem.textContent = itemsToClassify[currentItemIdx].name;
            classificationItem.style.display = 'block';
            itemPos = 0;
            classificationItem.style.left = itemPos + 'px';
            
            clearInterval(conveyorInterval);
            conveyorInterval = setInterval(function() {
                if(!isDraggingItem) {
                    itemPos += 1.5; // 컨베이어 속도
                    classificationItem.style.left = itemPos + 'px';
                    var beltWidth = document.getElementById('conveyor-belt').parentElement.offsetWidth;
                    if(itemPos > beltWidth) {
                        // 떨어짐 (실패)
                        clearInterval(conveyorInterval);
                        classificationItem.style.display = 'none';
                        showAlert('물건이 지나가버렸어요! 다시 시작!', '#ff6b6b');
                        setTimeout(showNextItem, 1000);
                    }
                }
            }, 20);
        } else {
            clearInterval(conveyorInterval);
            classificationItem.style.display = 'none';
            showAlert('수납의 고수! 완벽합니다.', '#4cd964');
            var rewardESK = document.getElementById('roof-reward-esk');
            if(rewardESK) showElement(rewardESK);
            
            // 손전등 액션 씬 표시
            
            var slist = document.getElementById('sorted-items-list');
            if(slist) slist.style.display = 'block';
            var sw = document.getElementById('storage-word-input');
            if(sw) sw.style.display = 'block';

        }
    }
    
    classificationItem.addEventListener('dragstart', function(e) {
        isDraggingItem = true;
        classificationItem.style.opacity = '0.5';
        e.dataTransfer.setData('text/plain', 'item'); // Firefox 호환성
    });
    classificationItem.addEventListener('dragend', function() {
        isDraggingItem = false;
        classificationItem.style.opacity = '1';
    });
    
    dropBoxes.forEach(function(box) {
        box.addEventListener('dragover', function(e) { e.preventDefault(); box.style.borderColor = 'gold'; });
        box.addEventListener('dragleave', function(e) { box.style.borderColor = 'rgba(255,255,255,0.5)'; });
        box.addEventListener('drop', function(e) {
            e.preventDefault();
            box.style.borderColor = 'rgba(255,255,255,0.5)';
            if (currentItemIdx >= itemsToClassify.length) return;
            var target = box.dataset.target;
            if (target === itemsToClassify[currentItemIdx].ans) {
                clearInterval(conveyorInterval);
                classificationItem.style.display = 'none';
                currentItemIdx++;
                showAlert('정답!', '#4cd964');
                setTimeout(showNextItem, 500);
            } else {
                showAlert('그 물건의 올바른 수납 방법이 아닙니다! 다시 컨베이어에 올립니다.', '#ff6b6b');
                clearInterval(conveyorInterval);
                classificationItem.style.display = 'none';
                setTimeout(showNextItem, 1000);
            }
        });
    });

    // --- 손전등 버튼 클릭 이벤트 ---
    var findFlashlightBtn = document.getElementById('find-flashlight-btn');
    if (findFlashlightBtn) {
        findFlashlightBtn.addEventListener('click', function() {
            var flashScene = document.getElementById('find-flashlight-scene');
            if (flashScene) hideElement(flashScene);
            triggerBlackout();
        });
    }

    // --- 정전 및 손전등 효과 ---
    
    var checkStorageWordBtn = document.getElementById('check-storage-word');
    if(checkStorageWordBtn) {
        checkStorageWordBtn.addEventListener('click', function() {
            var inputEl = document.getElementById('storage-word-full');
            var val = inputEl ? inputEl.value.replace(/\s/g, '') : '';
            if(val === '비밀은책상') {
                showAlert('정답입니다!', '#4cd964');
                setTimeout(function() { 
                    hideElement(gameFloor);
                    // 손전등 찾기 씬을 표시
                    showElement(document.getElementById('find-flashlight-scene'));
                }, 1000);
            } else {
                showAlert('글자가 틀렸습니다.', '#ff6b6b');
            }
        });
    }

    function triggerBlackout() {
        
        var floorRoof = document.getElementById('floor-roof');
        // 배경 이미지를 가구 문제가 있는 이미지로 변경
        floorRoof.style.backgroundImage = 'url("2. 루프탑 가구개수 맞추기 문제 찐이미지.png")';
        floorRoof.style.backgroundSize = 'cover';
        floorRoof.style.backgroundPosition = 'center';
        
        blackoutOverlay.style.background = ''; // reset style
        showElement(blackoutOverlay);
        
        blackoutOverlay.addEventListener('mousemove', function(e) {
            var rect = blackoutOverlay.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            blackoutOverlay.style.setProperty('--cursor-x', x + 'px');
            blackoutOverlay.style.setProperty('--cursor-y', y + 'px');
        });
        
        blackoutOverlay.addEventListener('touchmove', function(e) {
            if(e.touches.length > 0) {
                var rect = blackoutOverlay.getBoundingClientRect();
                var x = e.touches[0].clientX - rect.left;
                var y = e.touches[0].clientY - rect.top;
                blackoutOverlay.style.setProperty('--cursor-x', x + 'px');
                blackoutOverlay.style.setProperty('--cursor-y', y + 'px');
            }
        });
    }

    deskArea.addEventListener('click', function() {
        blackoutOverlay.style.background = 'none'; // 정전 해제
        hideElement(blackoutOverlay);
        showElement(safePopup);
    });

    // --- 책상 서랍 3자리 자물쇠 (243) ---
    var roofFailCnt = 0;
    checkSafeBtn.addEventListener('click', function() {
        if(safeInput.value === '243') {
            showAlert('찰칵! 서랍이 열렸습니다!', '#4cd964');
            hideElement(safePopup);
            showElement(document.getElementById('roof-offline-guide'));
        } else {
            
            roofFailCnt++;
            if(roofFailCnt >= 3) {
                var hint = document.getElementById('roof-safe-hint');
                if(hint) hint.style.display = 'block';
            }
            showAlert('비밀번호가 틀렸습니다. (3번 틀리면 힌트 제공)', '#ff6b6b');

        }
    });

    goToPenthouseBtn.addEventListener('click', function() {
        hideElement(document.getElementById('roof-offline-guide')); changeFloorUI('penthouse');
    });
}

// ===================== 마지막 공간: 엔딩 =====================
function initPenthouse() {
    var checkCode = document.getElementById('check-penthouse-code');
    var penthouseReveal = document.getElementById('penthouse-reveal');
    var goToHousingTest = document.getElementById('go-to-housing-test');
    var housingTypeTest = document.getElementById('housing-type-test');
    var submitHousingTest = document.getElementById('submit-housing-test');
    var housingResult = document.getElementById('housing-result');
    var goToNaming = document.getElementById('go-to-naming');
    var houseNaming = document.getElementById('house-naming');
    var submitHouseName = document.getElementById('finish-game');
    
    if (!checkCode) return;

    // reveal 1→2 페이지 전환
    var revealNextBtn = document.getElementById('reveal-next-page');
    if (revealNextBtn) revealNextBtn.addEventListener('click', function() {
        var p1 = document.getElementById('reveal-page-1');
        var p2 = document.getElementById('reveal-page-2');
        if (p1) p1.style.display = 'none';
        if (p2) { p2.style.display = 'flex'; }
    });

    checkCode.addEventListener('click', function() {
        var input = document.getElementById('penthouse-code');
        var val = input ? input.value.trim().toUpperCase() : '';
        // 허용할 조별 영단어 암호 목록
        var allowedPasswords = ['HOUSING', 'HABITAT', 'SHELTER', 'COMFORT', 'HARMONY', 'INTERIOR'];
        
        if (allowedPasswords.includes(val)) {
            showElement(penthouseReveal);
            var nameDisplay = document.getElementById('reveal-name-display');
            if (nameDisplay) nameDisplay.textContent = state.playerName + '의 설계도';
            
            // 입력한 영단어에 맞춰 이미지 띄우기 (예: HOUSING.png)
            var blueprintImg = document.getElementById('final-blueprint-img');
            if (blueprintImg) {
                blueprintImg.src = val + '.png'; 
                blueprintImg.style.display = 'block';
            }
        } else { 
            showAlert('틀렸어요! 선생님께 받은 오프라인 도면의 암호를 입력하세요.', '#ff6b6b'); 
        }
    });

    if (goToHousingTest) goToHousingTest.addEventListener('click', function() {
        hideElement(penthouseReveal); showElement(housingTypeTest); initHousingQuestions();
    });

    // 10가지 이상의 상세한 주거 유형 테스트 로직
    
    var currentQIndex = 0;
    var housingQs = [
        { q: '쉬는 날, 당신이 더 선호하는 집에서의 활동은?', opts: ['혼자서 넷플릭스를 보며 조용히 쉰다. (개인 중심)', '친구들을 초대해서 함께 홈파티를 연다. (사회 중심)'], scores: [{A:2}, {C:2}] },
        { q: '집의 크기가 조금 작더라도...', opts: ['도심 한가운데 있어 출퇴근이 편한 곳이 좋다. (효율 중심)', '조금 멀더라도 자연과 가깝고 조용한 곳이 좋다. (환경 중심)'], scores: [{B:2}, {D:2}] },
        { q: '인테리어를 할 때 가장 중요한 것은?', opts: ['보기 예쁘고 유행하는 세련된 디자인 (미적 중심)', '청소하기 편하고 수납이 잘 되는 실용성 (기능 중심)'], scores: [{F:2}, {E:2}] },
        { q: '새로운 가구를 살 때 당신의 결정 방식은?', opts: ['내 직감과 첫눈에 반한 디자인을 고른다.', '리뷰, 가격, 크기를 꼼꼼히 비교해보고 산다.'], scores: [{G:2}, {H:2}] }
    ];
    
    function initHousingQuestions() {
        // 별 생성
        var bg = document.getElementById('galaxy-bg');
        if (bg && bg.children.length === 0) {
            for(let i=0; i<50; i++) {
                let star = document.createElement('div');
                star.className = 'star-point';
                star.style.width = Math.random() * 3 + 'px';
                star.style.height = star.style.width;
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDuration = (Math.random() * 2 + 1) + 's';
                bg.appendChild(star);
            }
            // 별똥별
            setInterval(function(){
                let sstar = document.createElement('div');
                sstar.className = 'shooting-star';
                sstar.style.left = (Math.random() * 100 - 20) + '%';
                sstar.style.top = '-50px';
                bg.appendChild(sstar);
                setTimeout(function(){ if(sstar.parentNode) sstar.remove(); }, 3000);
            }, 4000);
        }
        
        var area = document.getElementById('housing-questions'); 
        if (!area) return; 
        area.innerHTML = '';
        currentQIndex = 0;
        state.housingTestScore = {A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0};
        showNextTarotCard();
    }
    
    function showNextTarotCard() {
        var area = document.getElementById('housing-questions');
        if(currentQIndex >= housingQs.length) {
            hideElement(document.getElementById('housing-questions'));
            hideElement(document.getElementById('housing-intro'));
            var btn = document.getElementById('submit-housing-container');
            if(btn) showElement(btn);
            return;
        }
        
        var qData = housingQs[currentQIndex];
        var card = document.createElement('div');
        card.className = 'tarot-card';
        card.innerHTML = '<p style="color:#aaa;font-size:0.9rem;margin-bottom:10px;">카드 ' + (currentQIndex+1) + ' / ' + housingQs.length + '</p>' +
                         '<h3 style="color:gold;margin-bottom:20px;font-size:1.2rem;line-height:1.5;">' + qData.q + '</h3>';
        
        qData.opts.forEach(function(optText, idx) {
            var btn = document.createElement('button');
            btn.className = 'tarot-btn';
            btn.textContent = optText;
            btn.addEventListener('click', function() {
                // 점수 합산
                var sData = qData.scores[idx];
                for(var k in sData) state.housingTestScore[k] += sData[k];
                
                // 다음 카드로 넘어가는 애니메이션
                card.classList.add('exit');
                setTimeout(function(){
                    card.remove();
                    currentQIndex++;
                    showNextTarotCard();
                }, 500);
            });
            card.appendChild(btn);
        });
        
        area.appendChild(card);
    }
    
    if (submitHousingTest) submitHousingTest.addEventListener('click', function() {
        var v = state.housingTestScore;
        var types = [
            { t: '도심 속 첨단 스마트 오피스텔', img: '🏙️', d: '바쁜 일상 속 편리함과 최첨단 시스템을 사랑하는 당신에게 딱 맞는 곳입니다.' },
            { t: '여유와 낭만의 전원주택', img: '🏡', d: '자연과 호흡하며 마당에서 차 한 잔의 여유를 즐길 수 있는 힐링 하우스입니다.' },
            { t: '나만의 우주, 아늑한 다락방 원룸', img: '⛺', d: '작지만 완벽한 나만의 요새! 방해받지 않고 온전히 나에게 집중할 수 있습니다.' },
            { t: '사람 냄새 나는 따뜻한 셰어하우스', img: '🛋️', d: '함께 요리하고 거실을 공유하며 다채로운 일상을 만드는 삶을 선호합니다.' },
            { t: '야경이 끝내주는 마지막 공간 아파트', img: '🌃', d: '탁 트인 고층 뷰와 넓은 공간에서 화려하고 럭셔리한 휴식을 즐길 수 있습니다.' },
            { t: '빈티지 감성 가득한 협소주택', img: '🪜', d: '버려지는 공간 없이 입체적으로 짜인 좁고 높은 집에서 개성을 표현하세요.' },
            { t: '햇살 가득한 단독주택', img: '☀️', d: '사계절의 변화를 집 안에서 오롯이 느낄 수 있는 평화로운 주거 공간입니다.' },
            { t: '창작의 영감이 샘솟는 로프트(Loft)', img: '🎨', d: '높은 천장과 툭 트인 공간! 일과 휴식이 자유롭게 넘나드는 예술가 스타일입니다.' },
            { t: '고즈넉한 한옥', img: '🏯', d: '마루에 앉아 바람을 느끼고 자연의 재료가 주는 따뜻함을 사랑하는 스타일입니다.' },
            { t: '이동식 트레일러 하우스', img: '🚐', d: '어딘가에 얽매이기보다 언제든 새로운 풍경을 향해 떠날 수 있는 자유로운 영혼입니다.' }
        ];
        
        var score = (v.A * 2) + (v.B * 3) + (v.C * 5) + (v.D * 7) + (v.E * 11) + (v.F * 13) + (v.G * 17) + (v.H * 19);
        var resultIdx = score % 10;
        var selectedType = types[resultIdx];
        
        state.houseType = selectedType.t; saveState();
        
        // 두구두구 사운드 생성 (드럼롤 비스무리하게 노이즈)
        try {
            var ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            var bufSize = ctx.sampleRate * 2.5; // 2.5초
            var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            var data = buf.getChannelData(0);
            for (var i = 0; i < bufSize; i++) { data[i] = Math.random() * 2 - 1; }
            var noise = ctx.createBufferSource(); noise.buffer = buf;
            var filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 150;
            var gain = ctx.createGain(); 
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.0);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
            noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
            noise.start();
        } catch(e) {}
        
        // 로딩 연출
        
        submitHousingTest.style.animation = 'spin 1s linear infinite';
        if(!document.getElementById('spin-css')) {
            var style = document.createElement('style'); style.id = 'spin-css';
            style.innerHTML = '@keyframes spinPulse { 0% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.1) rotate(180deg); } 100% { transform: scale(1) rotate(360deg); } }';
            document.head.appendChild(style);
        }
        
        

        
        var card = document.getElementById('result-card');
        if (card) {
            card.innerHTML = '<div style="font-size:8rem; animation:magicSpin 1s infinite linear; text-align:center; text-shadow:0 0 30px #a67c00;">🔮</div>' + 
                             '<p style="color:gold; font-size:1.5rem; margin-top:30px; animation:blink 1s infinite;">운명의 공간을 확인하는 중...</p>';
            if(!document.getElementById('magic-spin')) {
                var st = document.createElement('style'); st.id='magic-spin';
                st.innerHTML = '@keyframes magicSpin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1); } } @keyframes blink { 0%, 100% { opacity:0.5; } 50% { opacity:1; } }';
                document.head.appendChild(st);
            }
        }
        submitHousingTest.style.display = 'none';
        
        setTimeout(function() {
            var card = document.getElementById('result-card');
            if (card) {
                card.innerHTML = '<div class="tarot-card" style="position:relative; max-width:700px; width:100%; margin:0 auto; animation:none; transform:none;">' +
                '<p style="color:#aaa;font-size:0.9rem;margin-bottom:10px;">🌟 운명이 점지한 당신의 주거 공간 🌟</p>' +
                '<div style="font-size:6rem; margin:20px 0; text-shadow:0 0 20px rgba(255,255,255,0.5);">' + selectedType.img + '</div>' +
                '<h2 style="color:gold;margin-bottom:20px;font-size:1.6rem;line-height:1.4;">' + selectedType.t + '</h2>' +
                '<p style="color:#ddd;font-size:1.1rem;line-height:1.6;margin-bottom:25px;">' + selectedType.d + '</p>' +
                '<div style="background:rgba(255,255,255,0.1); padding:20px; border-radius:10px; margin-top:20px;">' +
                '<p style="color:#f0d080;font-size:1.05rem;font-weight:bold;margin-bottom:10px;">💬 나만의 공간을 찾은 소감</p>' +
                '<textarea placeholder="활동을 통해 알게 된 점, 새롭게 깨달은 점, 그리고 앞으로 나의 공간에서 실천하고 싶은 점을 구체적으로 적어보세요..." style="width:100%;height:100px;background:rgba(0,0,0,0.5);color:white;border:1px solid #a67c00;border-radius:5px;padding:10px;margin-bottom:15px;font-family:inherit;line-height:1.5;"></textarea>' +
                '<p style="color:white;font-size:1.2rem;font-weight:bold;border-top:1px dashed #666;padding-top:15px;margin-top:10px;">✨ <strong>당신을 이 운명의 집으로 초대합니다.</strong> ✨</p></div>' +
                '</div>';
            }
            hideElement(housingTypeTest); showElement(housingResult);
            
            
            
        }, 2500);

    });
    
    if (goToNaming) goToNaming.addEventListener('click', function() { hideElement(housingResult); showElement(houseNaming); });
    if (submitHouseName) submitHouseName.addEventListener('click', function() {
        var input = document.getElementById('house-name-input');
        var name = input ? input.value.trim() : '';
        if (!name) { showAlert('집 이름을 입력해주세요!', '#ff6b6b'); return; }
        
        // 소감 및 집 이름 이유 수집
        var reason = document.getElementById('house-name-reason') ? document.getElementById('house-name-reason').value.trim() : '';
        var reflectionArea = document.querySelector('#result-card textarea');
        var reflection = reflectionArea ? reflectionArea.value.trim() : '';
        
        state.houseName = name; 
        state.reflection = "공간 소감: " + (reflection || '없음') + " | 이름 이유: " + (reason || '없음');
        saveState(); 
        hideElement(houseNaming); 
        showEnding();
    });
}

function showEnding() {
    var endingEl = document.getElementById('ending-screen');
    if (!endingEl) { showAlert(state.playerName + '님의 꿈의 집: "' + state.houseName + '" 완성!', '#ffd700'); return; }
    endingEl.classList.remove('hidden'); endingEl.classList.add('active');
    
    // ending-galaxy 생성
    var bg = document.getElementById('ending-galaxy');
    if (bg && bg.children.length === 0) {
        for(let i=0; i<80; i++) {
            let star = document.createElement('div');
            star.className = 'star-point';
            star.style.width = Math.random() * 4 + 'px';
            star.style.height = star.style.width;
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDuration = (Math.random() * 3 + 1) + 's';
            bg.appendChild(star);
        }
    }

    var titleEl = document.getElementById('ending-title');
    var letterEl = document.getElementById('ending-letter');
    var moralEl = document.getElementById('ending-moral');
    var nameEl = document.getElementById('ending-player-name');
    var houseNameEl = document.getElementById('ending-house-name');
    if (letterEl) { var p = letterEl.querySelector('p'); if (p) p.innerHTML = state.playerName + '님에게,<br><br>처음 이 맨션에 발을 들였을 때를 기억하나요?<br>빈 방과 남겨진 흔적들 속에서 당신은 훌륭하게 공간의 의미를 찾아냈습니다.<br><br>결국 가장 좋은 집이란, 비싼 가구나 넓은 평수가 아니라<br>나의 일상과 취향, 그리고 꿈이 다정하게 녹아있는 곳이랍니다.<br>이곳에서 배운 작은 지혜들이 훗날 큰 도움이 되길 바랍니다.<br><br>당신이 그려낼 앞으로의 공간이 무척이나 기대됩니다.'; }
    if (houseNameEl) houseNameEl.innerHTML = '✨ 내 집의 이름: <span style="color:gold;">"' + state.houseName + '"</span> ✨';
    if (nameEl) nameEl.innerHTML = '👑 <strong>' + state.playerName + '</strong>님, 모든 임무를 완수했습니다!';
    if (titleEl) setTimeout(function() { titleEl.style.opacity = '1'; }, 100);
    if (letterEl) setTimeout(function() { letterEl.style.opacity = '1'; }, 1200);
    if (moralEl) setTimeout(function() { moralEl.style.opacity = '1'; }, 2500);
}

// ===================== 초기화 =====================
function init() {
    initIntroAndLobby();
    initFloor2();
    initFloor3();
    initFloor4();
    initFloor5();
    initRoof();
    initPenthouse();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
