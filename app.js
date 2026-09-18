// 미스터리 맨션 - app.js (완전 재작성, UTF-8)

var state = {
    floor: 1, playerName: '', personalityType: '',
    collectedLetters: [null, null, null, null, null],
    f2m1Done: false, f2m2Done: false, f2m3Done: false,
    f3m1Done: false, f3m2Done: false, f3m3Done: false,
    f4keyFound: false, f4m1Done: false, f4m2Done: false, f4m3Done: false,
    f5m1Done: false, f5m2Done: false, f5m3Done: false,
    roofBonusA: false, roofBonusB: false, roofBonusC: false,
    houseName: '', houseType: '', housingVector: { A: 0, B: 0, C: 0, D: 0 }
};

var roomBackground = document.getElementById('room-background');
var elevatorUI = document.getElementById('elevator-ui');
var inventory = document.getElementById('inventory');
var letterPiecesContainer = document.getElementById('letter-pieces');

function saveState() { localStorage.setItem('mansionState', JSON.stringify(state)); }
function showElement(el) { if (el) { el.classList.remove('hidden'); if (el.classList.contains('floor-content')) el.classList.add('active'); } }
function hideElement(el) { if (el) { el.classList.add('hidden'); if (el.classList.contains('floor-content')) el.classList.remove('active'); } }

function renderInventory() {
    if (!letterPiecesContainer) return;
    letterPiecesContainer.innerHTML = '';
    for (var i = 0; i < 5; i++) {
        var div = document.createElement('div');
        div.className = 'letter';
        if (state.collectedLetters[i]) {
            div.innerText = state.collectedLetters[i];
            div.style.borderStyle = 'solid';
            div.style.color = 'var(--accent)';
        } else { div.innerText = '?'; }
        letterPiecesContainer.appendChild(div);
    }
}

function collectLetter(index, letter) {
    if (!state.collectedLetters[index]) {
        state.collectedLetters[index] = letter;
        renderInventory(); saveState();
    }
}

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
    if (floorId !== 1) { showElement(inventory); renderInventory(); }
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
    var current = '';
    panel.querySelectorAll('.key-btn').forEach(function(btn) {
        btn.onclick = null;
        btn.addEventListener('click', function() {
            var val = btn.textContent;
            if (btn.classList.contains('clr-btn')) {
                current = ''; display.textContent = '----';
            } else if (btn.classList.contains('enter-btn')) {
                if (current === correctCode) {
                    display.textContent = 'OPEN'; display.style.color = '#0f0';
                    setTimeout(function() {
                        hideElement(panel); display.textContent = '----'; display.style.color = '#0ff'; current = '';
                        if (onSuccess) onSuccess();
                    }, 800);
                } else {
                    display.textContent = 'ERR'; display.style.color = '#f00';
                    setTimeout(function() { display.textContent = '----'; display.style.color = '#0ff'; current = ''; }, 800);
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
    items.forEach(function(item) {
        item.addEventListener('dragstart', function() { dragged = item; item.style.opacity = '0.5'; });
        item.addEventListener('dragend', function() { item.style.opacity = '1'; dragged = null; });
    });
    document.querySelectorAll('.drop-zone').forEach(function(zone) {
        zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('hover'); });
        zone.addEventListener('dragleave', function() { zone.classList.remove('hover'); });
        zone.addEventListener('drop', function(e) {
            e.preventDefault(); zone.classList.remove('hover');
            if (dragged) zone.appendChild(dragged);
        });
    });
}
// ===================== 인트로 & 1층 로비 =====================
function initIntroAndLobby() {
    var phoneVoice = new Audio('새+프로젝트.mp3');
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
    var audioCtx = null; var ringInterval = null;
    function startRingtone() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); function playBeep() { var osc1 = audioCtx.createOscillator(); var osc2 = audioCtx.createOscillator(); var gain = audioCtx.createGain(); osc1.type = 'sine'; osc2.type = 'sine'; osc1.frequency.value = 440; osc2.frequency.value = 480; osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination); gain.gain.setValueAtTime(0, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 1.0); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.1); osc1.start(audioCtx.currentTime); osc2.start(audioCtx.currentTime); osc1.stop(audioCtx.currentTime + 1.1); osc2.stop(audioCtx.currentTime + 1.1); } playBeep(); ringInterval = setInterval(playBeep, 3000); }
    function stopRingtone() { if (ringInterval) clearInterval(ringInterval); }

    function startPhoneScene() {
        if (introVideoScreen) hideElement(introVideoScreen);
        if (scenePhone) { showElement(scenePhone); scenePhone.classList.remove('hidden'); scenePhone.style.display = 'flex'; }
        startRingtone();
    }

    if (realStartBtn) {
        realStartBtn.addEventListener('click', function() {
            // bgm.play() 제거됨 (엄마 목소리 전화씬에서만 재생)
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
            }, 3000);
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
    if (!showDoorlockBtn) return;

    showDoorlockBtn.addEventListener('click', function() { showElement(f2Doorlock); });
    setupDoorlock('f2', '0520', function() {
        hideElement(f2EntranceScene);
        if (f2InsideScene) { showElement(f2InsideScene); f2InsideScene.classList.remove('hidden'); }
    }, null);

    if (startF2Btn) {
        startF2Btn.addEventListener('click', function() {
            var d = document.getElementById('f2-dialogue');
            if (d) d.style.display = 'none';
            showElement(m1); setupDragDrop('room-items');
        });
    }

    var correctMap1 = {
        '수면및학업': '개인생활공간', '가족휴식및접대': '공동생활공간',
        '조리및세탁': '가사작업공간', '배설및목욕': '생리위생공간', '내외부연결': '부수공간'
    };
    if (checkM1) {
        checkM1.addEventListener('click', function() {
            var allCorrect = true;
            document.querySelectorAll('#f2-minigame-1 .drop-zone').forEach(function(zone) {
                zone.querySelectorAll('.draggable-item').forEach(function(item) {
                    if (correctMap1[item.dataset.room] !== zone.dataset.zone) allCorrect = false;
                });
            });
            if (document.querySelectorAll('#room-items .draggable-item').length > 0) allCorrect = false;
            if (allCorrect) {
                state.f2m1Done = true;
                showAlert('정답! 공간 구역 분류 완료!', '#4cd964');
                setTimeout(function() { hideElement(m1); showElement(m2); setupDragDrop('furniture-items'); }, 1000);
            } else { showAlert('다시 확인해봐!', '#ff6b6b'); }
        });
    }

    var correctMap2 = {
        '옷장': '수납용', '책장': '수납용', '서랍장': '수납용',
        '책상': '작업용', '의자': '작업용', '침대': '휴식용', '소파': '휴식용'
    };
    if (checkM2) {
        checkM2.addEventListener('click', function() {
            var wrongCount = 0;
            document.querySelectorAll('#f2-minigame-2 .drop-zone').forEach(function(zone) {
                zone.querySelectorAll('.draggable-item').forEach(function(item) {
                    if (item.dataset.room === '침대겸수납장') return;
                    if (correctMap2[item.dataset.room] !== zone.dataset.zone) wrongCount++;
                });
            });
            document.querySelectorAll('#furniture-items .draggable-item').forEach(function(item) {
                if (item.dataset.room !== '침대겸수납장') wrongCount++;
            });
            if (wrongCount === 0) {
                state.f2m2Done = true;
                showAlert('정답! 가구 분류 완료!', '#4cd964');
                setTimeout(function() { hideElement(m2); showElement(m3); setupDragDrop('space-items'); }, 1000);
            } else { showAlert('분류가 틀렸어요. 다시 확인!', '#ff6b6b'); }
        });
    }

    var correctMap3 = {
        '침실': '정적공간', '서재': '정적공간', '욕실': '정적공간',
        '거실': '동적공간', '부엌': '동적공간', '식사실': '동적공간', '현관': '동적공간'
    };
    if (checkM3) {
        checkM3.addEventListener('click', function() {
            var allCorrect = true;
            document.querySelectorAll('#f2-minigame-3 .drop-zone').forEach(function(zone) {
                zone.querySelectorAll('.draggable-item').forEach(function(item) {
                    if (correctMap3[item.dataset.room] !== zone.dataset.zone) allCorrect = false;
                });
            });
            if (document.querySelectorAll('#space-items .draggable-item').length > 0) allCorrect = false;
            if (allCorrect) {
                state.f2m3Done = true;
                collectLetter(0, '집');
                showElement(hint); if (hint) hint.classList.remove('hidden');
                showAlert('정답! 글자 조각 획득!', '#4cd964');
                showElement(hiddenMagnet);
                if (hint && !hint.querySelector('.esc-btn')) {
                    var eb = document.createElement('button');
                    eb.className = 'action-btn esc-btn'; eb.style.marginTop = '10px'; eb.textContent = '탈출 시도';
                    hint.appendChild(eb);
                    eb.addEventListener('click', function() {
                        showElement(f2Doorlock);
                        setupDoorlock('f2', '0301', function() { moveToFloor(3, '3F'); }, null);
                    });
                }
            } else { showAlert('다시 확인해봐!', '#ff6b6b'); }
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
    if (!showDoorlockBtn) return;

    showDoorlockBtn.addEventListener('click', function() { showElement(f3Doorlock); });
    setupDoorlock('f3', '0301', function() {
        hideElement(f3EntranceScene);
        if (f3InsideScene) { showElement(f3InsideScene); f3InsideScene.classList.remove('hidden'); }
    }, null);

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
                if (!btn.disabled) {
                    btn.disabled = true; btn.style.opacity = '0.4'; f3m1Selected.push(name);
                    var disp = document.getElementById('f3-order-display');
                    if (disp) disp.innerHTML = f3m1Selected.map(function(n) {
                        return '<span style="background:#b38b59;color:#000;padding:4px 8px;border-radius:4px;font-size:0.85rem;">' + n + '</span>';
                    }).join(' → ');
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
    function initF3M2() {
        var area = document.getElementById('f3-matching-area'); if (!area) return; area.innerHTML = '';
        kitchenQs.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;">' + (i+1) + '. ' + q.q + '</p><select id="f3-q' + i + '" style="width:100%;padding:8px;background:#1a1a1a;border:1px solid var(--accent);color:#fff;border-radius:4px;"><option value="">-- 선택 --</option>' +
                q.opts.map(function(o) { return '<option value="' + o + '">' + o + '</option>'; }).join('') + '</select>';
            area.appendChild(div);
        });
    }
    var checkF3M2 = document.getElementById('check-f3-m2');
    if (checkF3M2) checkF3M2.addEventListener('click', function() {
        var correct = kitchenQs.every(function(q, i) { var s = document.getElementById('f3-q' + i); return s && s.value === q.ans; });
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
            state.f3m3Done = true; collectLetter(1, '이'); showElement(hint); if (hint) hint.classList.remove('hidden');
            showAlert('정답! 글자 조각 획득!', '#4cd964');
            if (hint && !hint.querySelector('.esc-btn')) {
                var eb = document.createElement('button'); eb.className = 'action-btn esc-btn'; eb.style.marginTop = '10px'; eb.textContent = '탈출 시도';
                hint.appendChild(eb);
                eb.addEventListener('click', function() { showElement(f3Doorlock); setupDoorlock('f3', '0401', function() { moveToFloor(4, '4F'); }, null); });
            }
        } else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });
}

// ===================== 4층: 복층 원룸 =====================
function initFloor4() {
    var f4EntranceScene = document.getElementById('f4-entrance-scene');
    var f4InsideScene = document.getElementById('f4-inside-scene');
    var f4PadlockScene = document.getElementById('f4-padlock-scene');
    var f4Doorlock = document.getElementById('f4-doorlock');
    var showLockBtn = document.getElementById('show-f4-lock-btn');
    var padlockCloseBtn = document.getElementById('f4-padlock-close');
    var hiddenKey = document.getElementById('f4-hidden-key');
    var startF4Btn = document.getElementById('start-f4-btn');
    var m1 = document.getElementById('f4-minigame-1');
    var m2 = document.getElementById('f4-minigame-2');
    var m3 = document.getElementById('f4-minigame-3');
    var hint = document.getElementById('f4-password-hint');
    if (!showLockBtn) return;

    showLockBtn.addEventListener('click', function() {
        hideElement(f4EntranceScene); showElement(f4PadlockScene); showElement(hiddenKey);
    });
    if (padlockCloseBtn) padlockCloseBtn.addEventListener('click', function() {
        hideElement(f4PadlockScene); showElement(f4EntranceScene); hideElement(hiddenKey);
    });
    if (hiddenKey) hiddenKey.addEventListener('click', function() {
        state.f4keyFound = true; hideElement(hiddenKey); hideElement(f4PadlockScene);
        if (f4InsideScene) { showElement(f4InsideScene); f4InsideScene.classList.remove('hidden'); }
        showAlert('열쇠를 찾았습니다!', '#b38b59');
    });
    if (startF4Btn) startF4Btn.addEventListener('click', function() {
        var d = document.getElementById('f4-dialogue'); if (d) d.style.display = 'none';
        showElement(m1); initF4M1();
    });

    var typeQs = [
        { q: '낮에는 거실, 밤에는 침실로 사용하는 공간은?', opts: ['겸용형', '전환형', '가변형', '분리형'], ans: '전환형' },
        { q: '이동식 파티션으로 필요에 따라 공간을 나누거나 합칠 수 있는 것은?', opts: ['겸용형', '전환형', '가변형', '분리형'], ans: '가변형' },
        { q: '하나의 공간에서 두 기능을 동시에 수행하는 것은? (예: 주방 겸 식당)', opts: ['겸용형', '전환형', '가변형', '분리형'], ans: '겸용형' }
    ];
    function initF4M1() {
        var area = document.getElementById('f4-type-area'); if (!area) return; area.innerHTML = '';
        typeQs.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;">' + (i+1) + '. ' + q.q + '</p><select id="f4-q' + i + '" style="width:100%;padding:8px;background:#1a1a1a;border:1px solid var(--accent);color:#fff;border-radius:4px;"><option value="">-- 선택 --</option>' +
                q.opts.map(function(o) { return '<option value="' + o + '">' + o + '</option>'; }).join('') + '</select>';
            area.appendChild(div);
        });
    }
    var checkF4M1 = document.getElementById('check-f4-m1');
    if (checkF4M1) checkF4M1.addEventListener('click', function() {
        var correct = typeQs.every(function(q, i) { var s = document.getElementById('f4-q' + i); return s && s.value === q.ans; });
        if (correct) { state.f4m1Done = true; showAlert('정답! 공간 유형 파악 완료!', '#4cd964'); setTimeout(function() { hideElement(m1); showElement(m2); initF4M2(); }, 1000); }
        else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });

    var spaceQs = [
        { q: '계단 아래 삼각형 공간 활용법은?', opts: ['수납장 설치', '침대 배치', '조명만 설치', '그냥 둠'], ans: '수납장 설치' },
        { q: '창문 아래 낮은 벽면의 가장 적합한 활용법은?', opts: ['수납장 설치', '창가 독서 공간', '세탁기 배치', '침대 배치'], ans: '창가 독서 공간' },
        { q: '베란다/발코니 자투리 공간을 가장 효율적으로 쓰는 방법은?', opts: ['미니 텃밭이나 화분 공간', '침실로 확장', '그냥 방치', '대형 가구 보관'], ans: '미니 텃밭이나 화분 공간' }
    ];
    function initF4M2() {
        var area = document.getElementById('f4-space-area'); if (!area) return; area.innerHTML = '';
        spaceQs.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;">' + (i+1) + '. ' + q.q + '</p><select id="f4-sq' + i + '" style="width:100%;padding:8px;background:#1a1a1a;border:1px solid var(--accent);color:#fff;border-radius:4px;"><option value="">-- 선택 --</option>' +
                q.opts.map(function(o) { return '<option value="' + o + '">' + o + '</option>'; }).join('') + '</select>';
            area.appendChild(div);
        });
    }
    var checkF4M2 = document.getElementById('check-f4-m2');
    if (checkF4M2) checkF4M2.addEventListener('click', function() {
        var correct = spaceQs.every(function(q, i) { var s = document.getElementById('f4-sq' + i); return s && s.value === q.ans; });
        if (correct) { state.f4m2Done = true; showAlert('정답! 자투리 공간 활용법 완료!', '#4cd964'); setTimeout(function() { hideElement(m2); showElement(m3); initF4M3(); }, 1000); }
        else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });

    var divideQs = [
        { q: '소음 차단이 필요하고 완전한 독립 공간이 필요할 때는?', opts: ['벽 설치', '커튼 사용', '러그로 영역 구분', '가구로 분리'], ans: '벽 설치' },
        { q: '필요할 때만 공간을 분리하고 비용도 저렴하게 하려면?', opts: ['벽 설치', '이동식 파티션', '러그로 영역 구분', '유리 파티션'], ans: '이동식 파티션' },
        { q: '채광을 유지하면서 시각적으로 공간을 분리하려면?', opts: ['벽 설치', '커튼 사용', '유리 파티션', '책장으로 분리'], ans: '유리 파티션' }
    ];
    function initF4M3() {
        var area = document.getElementById('f4-divide-area'); if (!area) return; area.innerHTML = '';
        divideQs.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;">' + (i+1) + '. ' + q.q + '</p><select id="f4-dq' + i + '" style="width:100%;padding:8px;background:#1a1a1a;border:1px solid var(--accent);color:#fff;border-radius:4px;"><option value="">-- 선택 --</option>' +
                divideQs[i].opts.map(function(o) { return '<option value="' + o + '">' + o + '</option>'; }).join('') + '</select>';
            area.appendChild(div);
        });
    }
    var checkF4M3 = document.getElementById('check-f4-m3');
    if (checkF4M3) checkF4M3.addEventListener('click', function() {
        var correct = divideQs.every(function(q, i) { var s = document.getElementById('f4-dq' + i); return s && s.value === q.ans; });
        if (correct) {
            state.f4m3Done = true; collectLetter(2, '꿈'); showElement(hint); if (hint) hint.classList.remove('hidden');
            showAlert('정답! 글자 조각 획득!', '#4cd964');
            if (hint && !hint.querySelector('.esc-btn')) {
                var eb = document.createElement('button'); eb.className = 'action-btn esc-btn'; eb.style.marginTop = '10px'; eb.textContent = '탈출 시도';
                hint.appendChild(eb);
                eb.addEventListener('click', function() { showElement(f4Doorlock); setupDoorlock('f4', '0501', function() { moveToFloor(5, '5F'); }, null); });
            }
        } else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });
}

// ===================== 5층: 모델하우스 =====================
function initFloor5() {
    var showDoorlockBtn = document.getElementById('show-f5-doorlock-btn');
    var f5Doorlock = document.getElementById('f5-doorlock');
    var f5EntranceScene = document.getElementById('f5-entrance-scene');
    var f5InsideScene = document.getElementById('f5-inside-scene');
    var startF5Btn = document.getElementById('start-f5-btn');
    var m1 = document.getElementById('f5-minigame-1');
    var m2 = document.getElementById('f5-minigame-2');
    var m3 = document.getElementById('f5-minigame-3');
    var hint = document.getElementById('f5-password-hint');
    if (!showDoorlockBtn) return;

    showDoorlockBtn.addEventListener('click', function() { showElement(f5Doorlock); });
    setupDoorlock('f5', '0401', function() {
        hideElement(f5EntranceScene);
        if (f5InsideScene) { showElement(f5InsideScene); f5InsideScene.classList.remove('hidden'); }
    }, null);

    if (startF5Btn) startF5Btn.addEventListener('click', function() {
        var d = document.getElementById('f5-dialogue'); if (d) d.style.display = 'none';
        showElement(m1); initF5M1();
    });

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

    var furnitureOrder = ['침대', '옷장', '책상', '소파', '커피테이블', '소품'];
    var f5m3Selected = [];
    function initF5M3() {
        var area = document.getElementById('f5-order-area'); if (!area) return; area.innerHTML = ''; f5m3Selected = [];
        furnitureOrder.slice().sort(function() { return Math.random()-0.5; }).forEach(function(name) {
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
        if (f5m3Selected.length !== 6) { showAlert('6개를 모두 순서대로 클릭하세요!', '#ff9'); return; }
        if (JSON.stringify(f5m3Selected) === JSON.stringify(furnitureOrder)) {
            state.f5m3Done = true; collectLetter(3, '터'); showElement(hint); if (hint) hint.classList.remove('hidden');
            showAlert('정답! 글자 조각 획득!', '#4cd964');
            if (hint && !hint.querySelector('.esc-btn')) {
                var eb = document.createElement('button'); eb.className = 'action-btn esc-btn'; eb.style.marginTop = '10px'; eb.textContent = '옥상으로 이동';
                hint.appendChild(eb); eb.addEventListener('click', function() { moveToFloor('roof', 'ROOF'); });
            }
        } else { showAlert('순서가 틀렸어요! 큰 가구부터 순서대로!', '#ff6b6b'); }
    });
}

// ===================== 옥상: 정리수납 보너스 =====================
function initRoof() {
    var startRoofBtn = document.getElementById('start-roof-btn');
    var bonusA = document.getElementById('roof-bonus-a');
    var bonusB = document.getElementById('roof-bonus-b');
    var bonusC = document.getElementById('roof-bonus-c');
    var drawerReveal = document.getElementById('roof-drawer-reveal');
    var finalPuzzle = document.getElementById('roof-final-puzzle');
    var openDrawerBtn = document.getElementById('open-drawer-btn');
    var checkPuzzle = document.getElementById('check-roof-puzzle');
    if (!startRoofBtn) return;

    startRoofBtn.addEventListener('click', function() {
        var d = document.getElementById('roof-dialogue'); if (d) d.style.display = 'none';
        showElement(bonusA); initRoofA();
    });

    var books = [
        { name: '이탈리아 파스타 요리책', pages: 180, isCooking: true },
        { name: '미적분학 기초', pages: 450, isCooking: false },
        { name: '집밥 레시피 101', pages: 120, isCooking: true },
        { name: '세계사 교과서', pages: 380, isCooking: false },
        { name: '초간단 베이킹', pages: 95, isCooking: true },
        { name: '소설: 달과 6펜스', pages: 280, isCooking: false },
        { name: '건강 다이어트 식단', pages: 210, isCooking: true },
        { name: '프로그래밍 기초', pages: 520, isCooking: false }
    ];
    var correctBookOrder = ['초간단 베이킹', '집밥 레시피 101', '이탈리아 파스타 요리책'];
    var selectedBooks = [];

    function initRoofA() {
        var shelf = document.getElementById('roof-bookshelf'); if (!shelf) return; shelf.innerHTML = ''; selectedBooks = [];
        books.forEach(function(book) {
            var btn = document.createElement('button'); btn.className = 'action-btn';
            btn.style.cssText = 'font-size:0.8rem;padding:6px 10px;' + (book.isCooking ? '' : 'background:#333;');
            btn.textContent = book.name + ' (' + book.pages + 'p)';
            btn.addEventListener('click', function() {
                if (selectedBooks.length < 3 && !btn.classList.contains('selected')) {
                    btn.classList.add('selected'); btn.style.opacity = '0.4'; selectedBooks.push(book.name);
                    var sel = document.getElementById('roof-book-selected');
                    if (sel) sel.textContent = '선택된 책: ' + selectedBooks.join(' → ');
                }
            });
            shelf.appendChild(btn);
        });
    }
    var resetRoofA = document.getElementById('reset-roof-a');
    if (resetRoofA) resetRoofA.addEventListener('click', function() {
        selectedBooks = [];
        var sel = document.getElementById('roof-book-selected'); if (sel) sel.textContent = '선택된 책: (없음)';
        document.querySelectorAll('#roof-bookshelf .action-btn').forEach(function(b) { b.classList.remove('selected'); b.style.opacity = '1'; });
    });
    var checkRoofA = document.getElementById('check-roof-a');
    if (checkRoofA) checkRoofA.addEventListener('click', function() {
        if (selectedBooks.length !== 3) { showAlert('요리책 중 가장 얇은 3권을 순서대로 클릭하세요!', '#ff9'); return; }
        if (JSON.stringify(selectedBooks) === JSON.stringify(correctBookOrder)) {
            state.roofBonusA = true; showAlert('정답! 책장 정리 완료!', '#4cd964');
            setTimeout(function() { hideElement(bonusA); showElement(bonusB); }, 1000);
        } else { showAlert('틀렸어요! 얇은 순서: 초간단 베이킹→집밥 레시피→이탈리아 파스타', '#ff6b6b'); }
    });

    var checkRoofB = document.getElementById('check-roof-b');
    if (checkRoofB) checkRoofB.addEventListener('click', function() {
        var inputs = document.querySelectorAll('.roof-code-input');
        var entered = Array.from(inputs).map(function(i) { return i.value; }).join('');
        if (entered === '3257') {
            state.roofBonusB = true; showAlert('정답! 암호 해독 완료!', '#4cd964');
            setTimeout(function() { hideElement(bonusB); showElement(bonusC); initRoofC(); }, 1000);
        } else { showAlert('암호가 틀렸어요! (박스→신발→화분→책 뒷자리)', '#ff6b6b'); }
    });

    var oxQsRoof = [
        { q: '정리는 필요 없는 물건을 버리거나 줄이는 행위이다.', ans: 'O' },
        { q: '수납은 물건을 아무 곳에나 집어넣는 것이다.', ans: 'X' },
        { q: '정리 후 수납하는 것이 올바른 순서이다.', ans: 'O' },
        { q: '수납 도구가 많을수록 공간이 더 깔끔해진다.', ans: 'X' }
    ];
    var roofOxAns = {};
    function initRoofC() {
        var area = document.getElementById('roof-ox-area'); if (!area) return; area.innerHTML = ''; roofOxAns = {};
        oxQsRoof.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;">' + (i+1) + '. ' + q.q + '</p><div style="display:flex;gap:10px;"><button class="roofox action-btn" data-i="' + i + '" data-v="O" style="flex:1;">O</button><button class="roofox action-btn" data-i="' + i + '" data-v="X" style="flex:1;background:#333;">X</button></div>';
            area.appendChild(div);
        });
        document.querySelectorAll('.roofox').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = btn.dataset.i; roofOxAns[idx] = btn.dataset.v;
                document.querySelectorAll('.roofox[data-i="' + idx + '"]').forEach(function(b) { b.style.background='#333'; b.style.color='#fff'; });
                btn.style.background='#b38b59'; btn.style.color='#000';
            });
        });
    }
    var checkRoofC = document.getElementById('check-roof-c');
    if (checkRoofC) checkRoofC.addEventListener('click', function() {
        if (Object.keys(roofOxAns).length < 4) { showAlert('모든 문제에 답해주세요!', '#ff9'); return; }
        if (oxQsRoof.every(function(q, i) { return roofOxAns[i] === q.ans; })) {
            state.roofBonusC = true; collectLetter(4, '집'); showAlert('정답! 서랍 위치가 드러납니다!', '#4cd964');
            setTimeout(function() { hideElement(bonusC); showElement(drawerReveal); }, 1000);
        } else { showAlert('틀린 답이 있어요!', '#ff6b6b'); }
    });

    if (openDrawerBtn) openDrawerBtn.addEventListener('click', function() {
        hideElement(drawerReveal); showElement(finalPuzzle);
        var display = document.getElementById('collected-letters-display');
        if (display) {
            display.innerHTML = state.collectedLetters.map(function(l) {
                return '<div style="width:45px;height:45px;border:2px solid ' + (l ? '#b38b59' : '#444') + ';border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:' + (l ? '#b38b59' : '#555') + ';">' + (l || '?') + '</div>';
            }).join('');
        }
    });

    if (checkPuzzle) checkPuzzle.addEventListener('click', function() {
        var inputs = document.querySelectorAll('.letter-input');
        var entered = Array.from(inputs).map(function(i) { return i.value; }).join('');
        if (entered === '집이꿈터집') {
            showAlert('수수께끼가 풀렸습니다!', '#ffd700');
            setTimeout(function() { moveToFloor('penthouse', 'PH'); }, 1500);
        } else { showAlert('틀렸어요! 각 층에서 모은 글자 조각을 확인하세요.', '#ff6b6b'); }
    });
}

// ===================== 펜트하우스: 엔딩 =====================
function initPenthouse() {
    var checkCode = document.getElementById('check-penthouse-code');
    var penthouseReveal = document.getElementById('penthouse-reveal');
    var goToHousingTest = document.getElementById('go-to-housing-test');
    var housingTypeTest = document.getElementById('housing-type-test');
    var submitHousingTest = document.getElementById('submit-housing-test');
    var housingResult = document.getElementById('housing-result');
    var goToNaming = document.getElementById('go-to-naming');
    var houseNaming = document.getElementById('house-naming');
    var submitHouseName = document.getElementById('submit-house-name');
    if (!checkCode) return;

    checkCode.addEventListener('click', function() {
        var input = document.getElementById('penthouse-code');
        var val = input ? input.value.trim().toUpperCase() : '';
        if (val === 'MANSION' || val === '정답') {
            showElement(penthouseReveal);
            var nameDisplay = document.getElementById('reveal-name-display');
            if (nameDisplay) nameDisplay.textContent = state.collectedLetters.join('') || '집이꿈터집';
        } else { showAlert('틀렸어요! 선생님께 암호를 확인하세요.', '#ff6b6b'); }
    });

    if (goToHousingTest) goToHousingTest.addEventListener('click', function() {
        hideElement(penthouseReveal); showElement(housingTypeTest); initHousingQuestions();
    });

    var housingQs = [
        { q: '나는 혼자 있는 시간을 즐기는 편이다.', opts: ['매우 그렇다', '그렇다', '아니다', '매우 아니다'], key: 'A' },
        { q: '집에서 일이나 공부를 자주 한다.', opts: ['매우 그렇다', '그렇다', '아니다', '매우 아니다'], key: 'B' },
        { q: '친구나 가족을 자주 집에 초대한다.', opts: ['매우 그렇다', '그렇다', '아니다', '매우 아니다'], key: 'C' },
        { q: '자연과 가까운 환경을 선호한다.', opts: ['매우 그렇다', '그렇다', '아니다', '매우 아니다'], key: 'D' }
    ];
    function initHousingQuestions() {
        var area = document.getElementById('housing-questions'); if (!area) return; area.innerHTML = '';
        housingQs.forEach(function(q, i) {
            var div = document.createElement('div'); div.style.cssText = 'background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid #444;';
            div.innerHTML = '<p style="color:#fff;margin-bottom:10px;font-weight:bold;">' + (i+1) + '. ' + q.q + '</p><div style="display:flex;flex-direction:column;gap:8px;">' +
                q.opts.map(function(o, oi) { return '<label style="cursor:pointer;padding:8px 12px;border:1px solid #444;border-radius:6px;color:#ccc;"><input type="radio" name="hq' + i + '" value="' + (3-oi) + '" style="margin-right:8px;">' + o + '</label>'; }).join('') + '</div>';
            area.appendChild(div);
        });
    }
    if (submitHousingTest) submitHousingTest.addEventListener('click', function() {
        var allAnswered = true;
        housingQs.forEach(function(q, i) {
            var selected = document.querySelector('input[name="hq' + i + '"]:checked');
            if (!selected) { allAnswered = false; return; }
            state.housingVector[q.key] = (state.housingVector[q.key] || 0) + parseInt(selected.value);
        });
        if (!allAnswered) { showAlert('모든 문제에 답해주세요!', '#ff9'); return; }
        var v = state.housingVector;
        var type = '아파트', desc = '편리한 시설과 안전한 환경을 갖춘 아파트가 잘 맞아요.';
        if (v.A >= 4 && v.B >= 4) { type = '원룸/오피스텔'; desc = '혼자만의 독립적인 공간에서 집중하는 스타일이에요.'; }
        else if (v.C >= 4) { type = '빌라/다가구주택'; desc = '이웃과 소통하면서도 독립적인 공간을 갖춘 빌라가 잘 맞아요.'; }
        else if (v.D >= 4) { type = '전원주택/단독주택'; desc = '자연 속에서 여유롭게 생활하는 단독주택 스타일이에요.'; }
        state.houseType = type; saveState();
        var card = document.getElementById('result-card');
        if (card) card.innerHTML = '<div style="background:linear-gradient(135deg,rgba(179,139,89,0.3),rgba(255,215,0,0.1));border:1px solid gold;border-radius:12px;padding:30px;text-align:center;"><p style="color:#aaa;font-size:0.9rem;margin-bottom:5px;">나에게 맞는 주거 유형</p><h2 style="color:gold;font-size:2rem;margin-bottom:15px;">🏠 ' + type + '</h2><p style="color:#ddd;line-height:1.7;">' + desc + '</p></div>';
        hideElement(housingTypeTest); showElement(housingResult);
    });
    if (goToNaming) goToNaming.addEventListener('click', function() { hideElement(housingResult); showElement(houseNaming); });
    if (submitHouseName) submitHouseName.addEventListener('click', function() {
        var input = document.getElementById('house-name-input');
        var name = input ? input.value.trim() : '';
        if (!name) { showAlert('집 이름을 입력해주세요!', '#ff6b6b'); return; }
        state.houseName = name; saveState(); hideElement(houseNaming); showEnding();
    });
}

function showEnding() {
    var endingEl = document.getElementById('floor-ending');
    if (!endingEl) { showAlert(state.playerName + '님의 꿈의 집: "' + state.houseName + '" 완성!', '#ffd700'); return; }
    endingEl.classList.remove('hidden'); endingEl.classList.add('active');
    var titleEl = document.getElementById('ending-title');
    var letterEl = document.getElementById('ending-letter');
    var moralEl = document.getElementById('ending-moral');
    var nameEl = document.getElementById('ending-player-name');
    var houseNameEl = document.getElementById('ending-house-name');
    if (letterEl) { var p = letterEl.querySelector('p'); if (p) p.textContent = state.playerName + '에게,\n\n당신이 이 맨션을 둘러보는 동안 내내 지켜봤어요.\n각 층에서 전 주민들의 흔적을 찾고, 문제를 해결하는 모습을...\n\n이 집의 글자들처럼, 좋은 집도 조각들이 모여 완성됩니다.\n구역화, 동선, 입체적 활용, 가구 배치...\n이제 당신만의 주거 공간을 설계할 준비가 되었습니다.\n\n— 설계자로부터'; }
    if (houseNameEl) houseNameEl.textContent = '내 집의 이름: "' + state.houseName + '"';
    if (nameEl) nameEl.textContent = state.playerName + '님, 미스터리 맨션 탈출 성공!';
    if (titleEl) setTimeout(function() { titleEl.style.opacity = '1'; }, 100);
    if (letterEl) setTimeout(function() { letterEl.style.opacity = '1'; }, 1200);
    if (moralEl) setTimeout(function() { moralEl.style.opacity = '1'; }, 2500);
}

// ===================== 초기화 =====================
function init() {
    // 인벤토리는 로비 진입 후에만 표시
    if (inventory) hideElement(inventory);
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
