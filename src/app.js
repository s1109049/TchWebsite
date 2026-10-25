let appData;
        let isDirty = false;
        let currentTabName = 'lesson';
        let currentHwViewMode = 'single';
        let soundEnabled = true;
        const pristineHTML = document.documentElement.cloneNode(true);
        const storagePrefix = 'tch-original-repair-v1:';
        const classDefinitions = [{"key": "中國歷史:S1D", "className": "S1D", "subject": "中國歷史"}, {"key": "CL:S1D", "className": "S1D", "subject": "CL"}, {"key": "CL:S2A", "className": "S2A", "subject": "CL"}, {"key": "CL:S2B", "className": "S2B", "subject": "CL"}, {"key": "CL:S2C", "className": "S2C", "subject": "CL"}, {"key": "CL:S3B", "className": "S3B", "subject": "CL"}, {"key": "CL:S3C", "className": "S3C", "subject": "CL"}, {"key": "CL:S3D", "className": "S3D", "subject": "CL"}, {"key": "公經社:S3A", "className": "S3A", "subject": "公經社"}, {"key": "公經社:S3B", "className": "S3B", "subject": "公經社"}, {"key": "公社:S4B", "className": "S4B", "subject": "公社"}];
        let classBook=null,currentClassKey=null;
        let originalFileHandle = null, fileHandleReady = Promise.resolve(), fileWriteBusy = false;
        let lessonEditorReady = false, pickerMode = 'slot', wheelFinish = null;
        let localSaveFailed = false, localRecoveryWarning = false, templateDocument = false, storageRootKey = '';


        const i18n = {
            zh: {
                appTitle: "課堂管理系統",
                langToggle: "English",
                tabLesson: "課堂內容",
                tabPicker: "互動點名",
                tabTimer: "課堂計時器",
                tabHw: "家課交收",
                tabAdmin: "後台管理",
                unsavedWarning: "⚠️ 注意：課堂紀錄已變更！下課前請點擊「後台管理 ➔ 下載最新 HTML 檔」以帶走最新資料！",
                pickerTag: "🎰 課堂幸運輪盤",
                pickerTitle: "隨機點名回答問題",
                pickerRemaining: "防重複機制：剩餘",
                pickerUnit: "人未被抽中",
                pickStudentBtn: "🎲 幸運抽點",
                resetPickerBtn: "🔄 重置名單",
                viewPrevLessonBtn: "⏮️ 查看上一課",
                editLessonBtn: "✏️ 編輯內容",
                objTitle: "🎯 課堂學習目標",
                flowTitle: "⏳ 課堂流程安排",
                annTitle: "📢 課後作業 / 公告",
                matTitle: "🎒 課堂準備器材 / 教具",
                timerTitle: "⏱️ 課堂活動計時器",
                lblTimerTask: "📝 當前課堂任務 / 工作說明：",
                txtPresetLabel: "快捷時間：",
                txtUnitMin: "分",
                txtUnitSec: "秒",
                btnTimerStart: "▶️ 開始計時",
                btnTimerPause: "⏸️ 暫停",
                btnTimerReset: "🔄 重置",
                selectHwLabel: "選擇習作：",
                statTotal: "總人數",
                statSubmitted: "已繳交",
                statMissing: "未繳交",
                missingBoxTitle: "⚠️ 未交功課學生名單",
                copyMissingBtn: "📋 複製名單",
                noMissingMsg: "🎉 全員已繳交功課！",
                markAllBtn: "全選標示為已交",
                thStudentName: "學生姓名",
                thHwStatus: "繳交狀態",
                viewSingle: "單一習作檢視",
                viewMatrix: "全班功課總覽",
                thCompletionRate: "總繳交率",
                txtToggleRate: "顯示總繳交率",
                adminLoginTitle: "後台管理驗證",
                loginErr: "密碼錯誤！請重新輸入。",
                loginUnlockBtn: "解鎖進入後台",
                saveBannerTitle: "💾 USB 資料儲存中心",
                saveBannerDesc: "點擊下方按鈕即可匯出包含最新資料的網頁檔或數據檔：",
                saveHtmlBtn: "💾 下載最新 HTML 檔 (蓋過 USB 檔)",
                exportJsonBtn: "📄 僅導出 data.json",
                importJsonBtn: "📂 匯入 USB 內的 data.json 檔",
                flowPresetTitle: "💾 課堂流程範本庫",
                savePresetBtn: "儲存目前流程為範本",
                loadPresetLabel: "快速載入已儲存範本：",
                editLessonCardTitle: "✏️ 編輯課堂內容與儲存歷史",
                archiveLessonBtn: "📥 封存當前課堂至歷史紀錄",
                historyListLabel: "📜 歷年課堂紀錄庫 (點擊一鍵載入)：",
                lblEditTitle: "課堂單元主題",
                lblEditDate: "上課日期",
                lblEditObj: "課堂學習目標",
                lblEditFlow: "課堂流程步驟",
                addStepBtn: "➕ 新增流程步驟",
                lblEditAnn: "課後作業 / 公告內容",
                lblEditMat: "準備器材 / 教具內容",
                studentMgmtTitle: "👥 學生名單管理",
                lblBatchImport: "批次匯入學生名單 (一行一個姓名)",
                importStudentsBtn: "匯入並替換名單",
                studentListLabel: "目前學生名單",
                hwMgmtTitle: "📚 習作項目管理",
                addHwBtn: "新增習作",
                statusSubmitted: "已繳交",
                statusMissing: "未繳交",
                statusLate: "遲交",
                statusRedo: "需重作",
                prevLessonHeader: "⏮️ 上一課內容回顧",
                closePrevBtn: "關閉"
            },
            en: {
                appTitle: "Classroom Management System",
                langToggle: "中英雙語 (Bilingual)",
                tabLesson: "Lesson Plan",
                tabPicker: "Picker",
                tabTimer: "Timer",
                tabHw: "Homework",
                tabAdmin: "Admin",
                unsavedWarning: "⚠️ Warning: Classroom data changed! Click 'Admin ➔ Save HTML File' before leaving!",
                pickerTag: "🎰 Lucky Picker",
                pickerTitle: "Random Student Picker",
                pickerRemaining: "Anti-repeat: ",
                pickerUnit: " students left",
                pickStudentBtn: "🎲 Lucky Pick",
                resetPickerBtn: "🔄 Reset List",
                viewPrevLessonBtn: "⏮️ View Previous Lesson",
                editLessonBtn: "✏️ Edit Plan",
                objTitle: "🎯 Learning Objectives",
                flowTitle: "⏳ Lesson Timeline",
                annTitle: "📢 Homework / Notice",
                matTitle: "🎒 Equipment / Materials",
                timerTitle: "⏱️ Activity Timer",
                lblTimerTask: "📝 Current Task / Instructions:",
                txtPresetLabel: "Presets:",
                txtUnitMin: "m",
                txtUnitSec: "s",
                btnTimerStart: "▶️ Start",
                btnTimerPause: "⏸️ Pause",
                btnTimerReset: "🔄 Reset",
                selectHwLabel: "Assignment:",
                statTotal: "Total",
                statSubmitted: "Submitted",
                statMissing: "Missing",
                missingBoxTitle: "⚠️ Missing Homework Student List",
                copyMissingBtn: "📋 Copy List",
                noMissingMsg: "🎉 All students have submitted!",
                markAllBtn: "Mark All Submitted",
                thStudentName: "Student Name",
                thHwStatus: "Status",
                viewSingle: "Single Assignment View",
                viewMatrix: "All Homework Overview",
                thCompletionRate: "Rate",
                txtToggleRate: "Show Completion Rate",
                adminLoginTitle: "Admin Verification",
                loginErr: "Incorrect password! Try again.",
                loginUnlockBtn: "Unlock Admin Panel",
                saveBannerTitle: "💾 USB Storage Center",
                saveBannerDesc: "Click below to export latest web file or data file to your USB:",
                saveHtmlBtn: "💾 Download New HTML (Overwrite USB)",
                exportJsonBtn: "📄 Export data.json Only",
                importJsonBtn: "📂 Import data.json from USB",
                flowPresetTitle: "💾 Lesson Flow Presets",
                savePresetBtn: "Save Current Flow as Preset",
                loadPresetLabel: "Quick Load Saved Preset:",
                editLessonCardTitle: "✏️ Edit Lesson & Archive History",
                archiveLessonBtn: "📥 Archive Current Lesson to History",
                historyListLabel: "📜 Lesson History Archive (Click to load):",
                lblEditTitle: "Lesson Title",
                lblEditDate: "Lesson Date",
                lblEditObj: "Learning Objectives",
                lblEditFlow: "Lesson Steps",
                addStepBtn: "➕ Add Step",
                lblEditAnn: "Homework / Notice",
                lblEditMat: "Materials Needed",
                studentMgmtTitle: "👥 Student List Management",
                lblBatchImport: "Batch Import (One Name Per Line)",
                importStudentsBtn: "Import & Replace",
                studentListLabel: "Current Roster",
                hwMgmtTitle: "📚 Assignment Management",
                addHwBtn: "Add Assignment",
                statusSubmitted: "Submitted",
                statusMissing: "Missing",
                statusLate: "Late",
                statusRedo: "Redo",
                prevLessonHeader: "⏮️ Previous Lesson Overview",
                closePrevBtn: "Close"
            },
            bi: {
                appTitle: "課堂管理系統 Classroom Management System",
                langToggle: "繁體中文",
                tabLesson: "課堂內容 Lesson",
                tabPicker: "互動點名 Picker",
                tabTimer: "課堂計時器 Timer",
                tabHw: "家課交收 Homework",
                tabAdmin: "後台管理 Admin",
                unsavedWarning: "⚠️ 注意：資料已變更！請於「後台管理」下載最新 HTML 檔！ / Data changed! Please save HTML file!",
                pickerTag: "🎰 課堂幸運輪盤 Lucky Picker",
                pickerTitle: "隨機點名回答問題 Random Student Picker",
                pickerRemaining: "防重複機制：剩餘 / Anti-repeat: ",
                pickerUnit: " 人未被抽中 / left",
                pickStudentBtn: "🎲 幸運抽點 Lucky Pick",
                resetPickerBtn: "🔄 重置名單 Reset List",
                viewPrevLessonBtn: "⏮️ 查看上一課 Previous Lesson",
                editLessonBtn: "✏️ 編輯內容 Edit Plan",
                objTitle: "🎯 課堂學習目標 Learning Objectives",
                flowTitle: "⏳ 課堂流程安排 Lesson Timeline",
                annTitle: "📢 課後作業與公告 Homework & Notice",
                matTitle: "🎒 課堂準備器材與教具 Materials Needed",
                timerTitle: "⏱️ 課堂活動計時器 Activity Timer",
                lblTimerTask: "📝 當前課堂任務與說明 Task Instructions:",
                txtPresetLabel: "快捷時間 Presets:",
                txtUnitMin: "分 m",
                txtUnitSec: "秒 s",
                btnTimerStart: "▶️ 開始計時 Start",
                btnTimerPause: "⏸️ 暫停 Pause",
                btnTimerReset: "🔄 重置 Reset",
                selectHwLabel: "選擇習作 Assignment:",
                statTotal: "總人數 Total",
                statSubmitted: "已繳交 Submitted",
                statMissing: "未繳交 Missing",
                missingBoxTitle: "⚠️ 未交功課學生名單 Missing Homework List",
                copyMissingBtn: "📋 複製名單 Copy List",
                noMissingMsg: "🎉 全員已繳交功課！ All students submitted!",
                markAllBtn: "全選標示為已交 Mark All Submitted",
                thStudentName: "學生姓名 Student Name",
                thHwStatus: "繳交狀態 Status",
                viewSingle: "單一習作檢視 Single View",
                viewMatrix: "全班功課總覽 Overview Matrix",
                thCompletionRate: "總繳交率 Completion Rate",
                txtToggleRate: "顯示總繳交率 Show Rate",
                adminLoginTitle: "後台管理驗證 Admin Verification",
                loginErr: "密碼錯誤！ Incorrect password!",
                loginUnlockBtn: "解鎖進入後台 Unlock Admin",
                saveBannerTitle: "💾 USB 資料儲存中心 USB Storage Center",
                saveBannerDesc: "點擊下方按鈕匯出最新檔案 Export latest files to USB:",
                saveHtmlBtn: "💾 下載最新 HTML 檔 Download HTML",
                exportJsonBtn: "📄 僅導出 data.json Export JSON Only",
                importJsonBtn: "📂 匯入 USB 內的 data.json 檔 Import data.json",
                flowPresetTitle: "💾 課堂流程範本庫 Flow Presets",
                savePresetBtn: "儲存目前流程為範本 Save Preset",
                loadPresetLabel: "快速載入已儲存範本 Load Preset:",
                editLessonCardTitle: "✏️ 編輯課堂內容與儲存歷史 Edit Lesson & History",
                archiveLessonBtn: "📥 封存當前課堂至歷史紀錄 Archive Lesson",
                historyListLabel: "📜 歷年課堂紀錄庫 Lesson History Archive:",
                lblEditTitle: "課堂單元主題 Lesson Title",
                lblEditDate: "上課日期 Lesson Date",
                lblEditObj: "課堂學習目標 Objectives",
                lblEditFlow: "課堂流程步驟 Lesson Steps",
                addStepBtn: "➕ 新增流程步驟 Add Step",
                lblEditAnn: "課後作業與公告 Notice Content",
                lblEditMat: "準備器材與教具 Materials Content",
                studentMgmtTitle: "👥 學生名單管理 Student Roster Management",
                lblBatchImport: "批次匯入學生名單 Batch Import (One Per Line)",
                importStudentsBtn: "匯入並替換名單 Import Roster",
                studentListLabel: "目前學生名單 Current Roster",
                hwMgmtTitle: "📚 習作項目管理 Assignment Management",
                addHwBtn: "新增習作 Add Assignment",
                statusSubmitted: "已繳交 Submitted",
                statusMissing: "未繳交 Missing",
                statusLate: "遲交 Late",
                statusRedo: "需重作 Redo",
                prevLessonHeader: "⏮️ 上一課內容回顧 Previous Lesson",
                closePrevBtn: "關閉 Close"
            }
        };

        function updateUnsavedBannerVisibility() {
            const banner = document.getElementById('unsaved-banner');
            if (isDirty && currentTabName === 'admin') {
                banner.style.display = 'block';
            } else {
                banner.style.display = 'none';
            }
        }

        function markDirty() {
            isDirty = true;
            appData._storage.revision++;
            appData._storage.updatedAt = Date.now();
            persistLocalData();
            updateUnsavedBannerVisibility();
        }
        function clearDirty() {
            isDirty = false;
            updateUnsavedBannerVisibility();
        }

        appData = loadInitialData();

        let uncalledStudents = [];
        let isAdminLoggedIn = false;

        function toggleLanguage() {
            if (appData.lang === 'zh') {
                appData.lang = 'en';
            } else if (appData.lang === 'en') {
                appData.lang = 'bi';
            } else {
                appData.lang = 'zh';
            }
            markDirty();
            applyLanguageUI();
            renderLessonTab();
            renderHomeworkTab();
            updateTimerDisplay();
            if (isAdminLoggedIn) renderAdminTab();
        }

        function applyLanguageUI() {
            const cur = i18n[appData.lang] || i18n.zh;
            document.getElementById('txt-app-title').innerText = cur.appTitle;
            document.getElementById('txt-lang-toggle').innerText = cur.langToggle;
            document.getElementById('txt-tab-lesson').innerText = cur.tabLesson;
            document.getElementById('txt-tab-picker').innerText = cur.tabPicker;
            document.getElementById('txt-tab-timer').innerText = cur.tabTimer;
            document.getElementById('txt-tab-hw').innerText = cur.tabHw;
            document.getElementById('txt-tab-admin').innerText = cur.tabAdmin;
            document.getElementById('unsaved-banner').innerText = cur.unsavedWarning;

            document.getElementById('txt-picker-tag').innerText = cur.pickerTag;
            document.getElementById('txt-picker-title').innerText = cur.pickerTitle;
            document.getElementById('txt-picker-remaining').innerText = cur.pickerRemaining;
            document.getElementById('txt-picker-unit').innerText = cur.pickerUnit;
            document.getElementById('btn-pick-student').innerText = cur.pickStudentBtn;
            document.getElementById('btn-reset-picker').innerText = cur.resetPickerBtn;

            document.getElementById('txt-timer-title').innerText = cur.timerTitle;
            document.getElementById('lbl-timer-task').innerText = cur.lblTimerTask;
            document.getElementById('txt-preset-label').innerText = cur.txtPresetLabel;
            document.getElementById('txt-unit-min').innerText = cur.txtUnitMin;
            document.getElementById('txt-unit-sec').innerText = cur.txtUnitSec;
            document.getElementById('btn-timer-start').innerText = cur.btnTimerStart;
            document.getElementById('btn-timer-pause').innerText = cur.btnTimerPause;
            document.getElementById('btn-timer-reset').innerText = cur.btnTimerReset;

            document.getElementById('btn-view-prev-lesson').innerText = cur.viewPrevLessonBtn;
            document.getElementById('btn-edit-lesson').innerText = cur.editLessonBtn;
            document.getElementById('txt-obj-title').innerText = cur.objTitle;
            document.getElementById('txt-flow-title').innerText = cur.flowTitle;
            document.getElementById('txt-ann-title').innerText = cur.annTitle;
            document.getElementById('txt-mat-title').innerText = cur.matTitle;

            document.getElementById('txt-prev-lesson-header').innerText = cur.prevLessonHeader;
            document.getElementById('txt-close-prev').innerText = cur.closePrevBtn;

            document.getElementById('txt-view-single').innerText = cur.viewSingle;
            document.getElementById('txt-view-matrix').innerText = cur.viewMatrix;
            document.getElementById('txt-toggle-rate').innerText = cur.txtToggleRate;

            document.getElementById('txt-select-hw-label').innerText = cur.selectHwLabel;
            document.getElementById('txt-stat-total').innerText = cur.statTotal;
            document.getElementById('txt-stat-submitted').innerText = cur.statSubmitted;
            document.getElementById('txt-stat-missing').innerText = cur.statMissing;
            document.getElementById('txt-missing-box-title').innerText = cur.missingBoxTitle;
            document.getElementById('btn-copy-missing').innerText = cur.copyMissingBtn;
            document.getElementById('btn-mark-all').innerText = cur.markAllBtn;
            document.getElementById('th-student-name').innerText = cur.thStudentName;
            document.getElementById('th-hw-status').innerText = cur.thHwStatus;

            document.getElementById('txt-admin-login-title').innerText = cur.adminLoginTitle;
            document.getElementById('login-error').innerText = cur.loginErr;
            document.getElementById('btn-login-unlock').innerText = cur.loginUnlockBtn;

            document.getElementById('txt-save-banner-title').innerText = cur.saveBannerTitle;
            document.getElementById('txt-save-banner-desc').innerText = cur.saveBannerDesc;
            document.getElementById('btn-save-html').innerText = cur.saveHtmlBtn;
            document.getElementById('btn-export-json').innerText = cur.exportJsonBtn;
            document.getElementById('btn-import-json').innerText = cur.importJsonBtn;

            document.getElementById('txt-flow-preset-title').innerText = cur.flowPresetTitle;
            document.getElementById('btn-save-preset').innerText = cur.savePresetBtn;
            document.getElementById('txt-load-preset-label').innerText = cur.loadPresetLabel;

            document.getElementById('txt-edit-lesson-title').innerText = cur.editLessonCardTitle;
            document.getElementById('btn-archive-lesson').innerText = cur.archiveLessonBtn;
            document.getElementById('txt-history-list-label').innerText = cur.historyListLabel;

            document.getElementById('lbl-edit-title').innerText = cur.lblEditTitle;
            document.getElementById('lbl-edit-date').innerText = cur.lblEditDate;
            document.getElementById('lbl-edit-obj').innerText = cur.lblEditObj;
            document.getElementById('lbl-edit-flow').innerText = cur.lblEditFlow;
            document.getElementById('btn-add-step').innerText = cur.addStepBtn;
            document.getElementById('lbl-edit-ann').innerText = cur.lblEditAnn;
            document.getElementById('lbl-edit-mat').innerText = cur.lblEditMat;

            document.getElementById('txt-student-mgmt-title').innerText = cur.studentMgmtTitle;
            document.getElementById('lbl-batch-import').innerText = cur.lblBatchImport;
            document.getElementById('btn-import-students').innerText = cur.importStudentsBtn;
            document.getElementById('txt-student-list-label').innerText = cur.studentListLabel;

            document.getElementById('txt-hw-mgmt-title').innerText = cur.hwMgmtTitle;
            document.getElementById('btn-add-hw').innerText = cur.addHwBtn;
            applyExtensionLabels();
        }

        function switchTab(tabId) {
            currentTabName = tabId;
            updateUnsavedBannerVisibility();

            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

            const targetPanel = document.getElementById(`tab-${tabId}`);
            if (targetPanel) targetPanel.classList.add('active');

            const targetBtn = document.getElementById(`btn-${tabId}`);
            if (targetBtn) targetBtn.classList.add('active');

            if (tabId === 'lesson') renderLessonTab();
            if (tabId === 'picker') {updatePickerCount();renderPickerMode();}
            if (tabId === 'homework') renderHomeworkTab();
            if (tabId === 'admin') renderAdminTab();
        }

        function switchHwViewMode(mode) {
            currentHwViewMode = mode;
            document.getElementById('btn-hw-view-single').classList.toggle('active', mode === 'single');
            document.getElementById('btn-hw-view-matrix').classList.toggle('active', mode === 'matrix');

            document.getElementById('hw-view-single').style.display = mode === 'single' ? 'block' : 'none';
            document.getElementById('hw-view-matrix').style.display = mode === 'matrix' ? 'block' : 'none';
            document.getElementById('matrix-rate-toggle').style.display = mode === 'matrix' ? 'inline-block' : 'none';

            if (mode === 'single') renderHomeworkTable();
            if (mode === 'matrix') renderHomeworkMatrix();
        }

        // ==================== ⏱️ 課堂計時器邏輯 ====================
        let timerInterval = null;
        let timerTotalSeconds = 300;
        let timerRemainingSeconds = 300;
        let isTimerRunning = false;

        function updateTimerDisplay() {
            const mins = Math.floor(timerRemainingSeconds / 60);
            const secs = timerRemainingSeconds % 60;
            const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            document.getElementById('timer-display').innerText = formatted;

            const percent = timerTotalSeconds > 0 ? Math.max(0, Math.min(100, (timerRemainingSeconds / timerTotalSeconds) * 100)) : 0;
            const barFill = document.getElementById('timer-progress-fill');
            const barText = document.getElementById('timer-progress-text');

            barFill.style.width = `${percent}%`;

            let labelWord = "剩餘";
            if (appData.lang === 'en') labelWord = "Remaining";
            if (appData.lang === 'bi') labelWord = "剩餘 Remaining";

            barText.innerText = `${Math.round(percent)}% ${labelWord}`;

            if (percent > 50) {
                barFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            } else if (percent > 20) {
                barFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
            } else {
                barFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            }
        }

        function setTimerPreset(minutes) {
            pauseTimer();
            document.getElementById('timer-min-input').value = minutes;
            document.getElementById('timer-sec-input').value = 0;
            timerTotalSeconds = minutes * 60;
            timerRemainingSeconds = timerTotalSeconds;
            const display = document.getElementById('timer-display');
            display.className = 'timer-display';
            updateTimerDisplay();
        }

        function setCustomTimer() {
            pauseTimer();
            const mins = parseInt(document.getElementById('timer-min-input').value) || 0;
            const secs = parseInt(document.getElementById('timer-sec-input').value) || 0;
            timerTotalSeconds = mins * 60 + secs;
            timerRemainingSeconds = timerTotalSeconds;
            const display = document.getElementById('timer-display');
            display.className = 'timer-display';
            updateTimerDisplay();
        }

        function startTimer() {
            if (isTimerRunning) return;
            if (timerRemainingSeconds <= 0) return;

            isTimerRunning = true;
            const display = document.getElementById('timer-display');
            display.className = 'timer-display running';

            timerInterval = setInterval(() => {
                timerRemainingSeconds--;
                updateTimerDisplay();

                if (timerRemainingSeconds <= 0) {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    display.className = 'timer-display ended';
                    playTimerAlarmSound();
                }
            }, 1000);
        }

        function pauseTimer() {
            if (timerInterval) clearInterval(timerInterval);
            isTimerRunning = false;
            const display = document.getElementById('timer-display');
            if (timerRemainingSeconds > 0) {
                display.className = 'timer-display';
            }
        }

        function resetTimer() {
            pauseTimer();
            setCustomTimer();
        }

        function playTimerAlarmSound() {
            if (!soundEnabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                [0, 0.3, 0.6].forEach(delay => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.5);
                });
            } catch (e) {}
        }

        // ==================== 🎰 互動點名邏輯 ====================
        function toggleSound() {
            soundEnabled = !soundEnabled;
            document.getElementById('btn-sound-toggle').innerText = soundEnabled ? "🔊 音效: 開" : "🔇 音效: 關";
        }

        function playTickSound() {
            if (!soundEnabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            } catch (e) {}
        }

        function playWinFanfare() {
            if (!soundEnabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.1);
                    osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
                });
            } catch (e) {}
        }

        function triggerConfettiBurst() {
            const card = document.getElementById('picker-display');
            const emojis = ['🎉', '✨', '👑', '🌟', '🏆', '🎈', '⚡'];
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('span');
                particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];
                particle.className = 'confetti-particle';
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 140;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                particle.style.setProperty('--tx', `${x}px`);
                particle.style.setProperty('--ty', `${y}px`);
                card.appendChild(particle);
                setTimeout(() => particle.remove(), 1200);
            }
        }

        function resetPickerHistory(reset=true) {
            if (isPicking) return;
            uncalledStudents=!reset&&Array.isArray(appData._pickerRemaining)?[...appData._pickerRemaining]:[...appData.students];
            if(reset){appData._pickerRemaining=[...uncalledStudents];markDirty();}wheelFinish=null;
            const display=document.getElementById('picker-display');display.className='picker-display-card';
            display.textContent=L('準備抽點','Ready');
            updatePickerCount();renderPickerMode();
        }
        function updatePickerCount() {
            document.getElementById('picker-remaining').textContent=uncalledStudents.length;
            document.getElementById('btn-pick-student').disabled=isPicking||uncalledStudents.length===0;
        }
        let isPicking = false;
        async function pickRandomStudent() {
            if (isPicking) return;
            if (!uncalledStudents.length) {
                document.getElementById('picker-display').textContent=appData.students.length ? L('本輪完成，請重置名單','Round complete. Reset the list.') : L('請先匯入學生名單','Import a student roster first.');
                return;
            }
            const index=secureRandomIndex(uncalledStudents.length),selected=uncalledStudents[index];
            const candidates=[...uncalledStudents];
            isPicking=true;wheelFinish=null;updatePickerCount();setPickerControlsDisabled(true);
            const display=document.getElementById('picker-display');display.className='picker-display-card rolling';
            const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            const angle=Math.PI*10-(index+.5)/candidates.length*Math.PI*2;
            try {
                if (pickerMode==='wheel') await animatePicker(reduced?0:3200,p=>drawStudentWheel(candidates,angle*(1-Math.pow(1-p,3))));
                else if(pickerMode==='claw') await animateClaw(selected,index,candidates,reduced);
                else await animatePicker(reduced?0:2400,()=>{display.textContent=candidates[secureRandomIndex(candidates.length)];});
                uncalledStudents.splice(index,1);
                appData._pickerRemaining=[...uncalledStudents];markDirty();
                display.textContent=selected;display.className='picker-display-card winner-celebrate';
                if (pickerMode==='wheel') wheelFinish={candidates,angle};
                playWinFanfare();triggerConfettiBurst();
            } finally {
                isPicking=false;setPickerControlsDisabled(false);updatePickerCount();
            }
        }
        function renderLessonTab() {
            updatePickerCount();

            const l = appData.lesson || {};
            document.getElementById('display-title').innerText = l.title || '-';
            document.getElementById('display-date').innerText = l.date || '-';
            document.getElementById('display-objectives').innerText = l.objectives || '-';
            document.getElementById('display-announcement').innerText = l.announcement || '無';
            document.getElementById('display-materials').innerText = l.materials || '無';

            const annBlock = document.getElementById('block-announcement');
            const matBlock = document.getElementById('block-materials');
            const container = document.getElementById('display-extra-blocks');

            annBlock.style.display = (l.showAnnouncement !== false) ? 'block' : 'none';
            matBlock.style.display = (l.showMaterials !== false) ? 'block' : 'none';

            if (l.showAnnouncement === false && l.showMaterials === false) {
                container.style.display = 'none';
            } else {
                container.style.display = 'grid';
            }

            const flowContainer = document.getElementById('display-flow-list');
            flowContainer.innerHTML = '';
            (l.flow || []).forEach((step, idx) => {
                flowContainer.innerHTML += `
                    <div class="flow-item">
                        <span class="flow-time">${escapeOriginalHTML(step.time || `Step ${idx+1}`)}</span>
                        <div>
                            <div style="font-weight: bold; color: #0f172a; font-size: 22px;">${escapeOriginalHTML(step.title)}</div>
                            <div style="font-size: 18px; color: #475569; margin-top: 4px;">${escapeOriginalHTML(step.detail)}</div>
                        </div>
                    </div>`;
            });
        }

        function togglePreviousLessonBox() {
            const box = document.getElementById('prev-lesson-card');
            if (box.style.display === 'none') {
                renderPreviousLessonContent();
                box.style.display = 'block';
            } else {
                box.style.display = 'none';
            }
        }

        function renderPreviousLessonContent() {
            const container = document.getElementById('prev-lesson-details');
            const history = appData.historyLessons || [];

            if (history.length === 0) {
                container.innerHTML = `<p style="color:#64748b; font-weight:bold; font-size: 20px;">${appData.lang === 'zh' ? '尚無上一課歷史紀錄。請在後台點擊「封存當前課堂至歷史紀錄」進行備份！' : 'No previous lesson history found. Archive a lesson in Admin panel first!'}</p>`;
                return;
            }

            const prevLesson = history[history.length - 1];
            let flowHTML = '';
            (prevLesson.flow || []).forEach((s, idx) => {
                flowHTML += `<div style="background:white; padding:12px 16px; border-radius:12px; margin-bottom:8px; border:1px solid #e2e8f0;">
                    <strong style="color:#4338ca; font-size: 20px;">${escapeOriginalHTML(s.time || `Step ${idx+1}`)}</strong> - <strong style="font-size: 20px;">${escapeOriginalHTML(s.title)}</strong>: <span style="color:#475569; font-size: 18px;">${escapeOriginalHTML(s.detail)}</span>
                </div>`;
            });

            container.innerHTML = `
                <div style="margin-bottom: 14px;">
                    <span class="date-badge">${escapeOriginalHTML(prevLesson.date || '-')}</span>
                    <h4 style="font-size: 26px; font-weight: bold; color: #0f172a;">${escapeOriginalHTML(prevLesson.title || '-')}</h4>
                </div>
                <div style="background:#fffbeb; padding:16px; border-radius:12px; margin-bottom:16px; border-left:6px solid #f59e0b;">
                    <strong style="color:#b45309; font-size: 20px;">🎯 ${appData.lang === 'zh' ? '學習目標' : 'Objectives'}:</strong>
                    <div style="color:#92400e; white-space:pre-line; font-size:20px;">${escapeOriginalHTML(prevLesson.objectives || '-')}</div>
                </div>
                <div>
                    <strong style="color:#334155; display:block; margin-bottom:8px; font-size:20px;">⏳ ${appData.lang === 'zh' ? '教學流程' : 'Timeline'}:</strong>
                    ${flowHTML || '<p style="color:#94a3b8; font-size: 18px;">無流程內容</p>'}
                </div>
            `;
        }

        function archiveCurrentLesson() {
            syncAllInputsToData();
            if (!appData.historyLessons) appData.historyLessons = [];

            const currentLessonCopy = JSON.parse(JSON.stringify(appData.lesson));
            if (!currentLessonCopy.title && !currentLessonCopy.date) {
                alert(appData.lang === 'zh' ? '當前課堂內容為空白！' : 'Current lesson is empty!');
                return;
            }

            appData.historyLessons.push(currentLessonCopy);
            markDirty();
            renderHistoryLessonsList();
            alert(appData.lang === 'zh' ? `已成功將「${currentLessonCopy.title || '當前課堂'}」封存至歷史紀錄！` : `Archived current lesson to history!`);
        }

        function loadHistoryLesson(index) {
            if (!appData.historyLessons || !appData.historyLessons[index]) return;
            const hLesson = appData.historyLessons[index];
            if (confirm(appData.lang === 'zh' ? `確定載入歷史課堂「${hLesson.title}」並覆蓋當前編輯內容？` : `Load history lesson "${hLesson.title}"?`)) {
                appData.lesson = JSON.parse(JSON.stringify(hLesson));
                markDirty();
                renderAdminTab();
                renderLessonTab();
            }
        }

        function deleteHistoryLesson(index) {
            if (confirm(appData.lang === 'zh' ? '確定刪除此筆歷史課堂紀錄？' : 'Delete this history record?')) {
                appData.historyLessons.splice(index, 1);
                markDirty();
                renderHistoryLessonsList();
            }
        }

        function renderHistoryLessonsList() {
            const container = document.getElementById('history-lessons-list');
            container.innerHTML = '';
            const history = appData.historyLessons || [];

            if (history.length === 0) {
                container.innerHTML = `<span style="font-size:16px; color:#94a3b8;">${appData.lang === 'zh' ? '尚無任何歷史課堂紀錄' : 'No history records'}</span>`;
                return;
            }

            history.forEach((h, idx) => {
                container.innerHTML += `
                    <span style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:8px 16px; border-radius:24px; font-size:17px; font-weight:bold; display:inline-flex; align-items:center; gap:10px;">
                        <span onclick="loadHistoryLesson(${idx})" style="cursor:pointer;" title="點擊載入此歷史課堂">📜 ${escapeOriginalHTML(h.date || '')} ${escapeOriginalHTML(h.title || '無標題')}</span>
                        <button onclick="deleteHistoryLesson(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✕</button>
                    </span>`;
            });
        }

        function renderHomeworkTab() {
            const hwSelect = document.getElementById('hw-select');
            hwSelect.innerHTML = '';
            (appData.homeworks || []).forEach(hw => {
                const opt = document.createElement('option');
                opt.value = hw; opt.innerText = hw;
                hwSelect.appendChild(opt);
            });

            if (currentHwViewMode === 'single') renderHomeworkTable();
            if (currentHwViewMode === 'matrix') renderHomeworkMatrix();
        }

        function renderHomeworkTable() {
            const selectedHw = document.getElementById('hw-select').value;
            const tbody = document.getElementById('hw-table-body');
            const missingBox = document.getElementById('missing-students-list');
            tbody.innerHTML = '';
            missingBox.innerHTML = '';

            if (!selectedHw) return;

            if (!appData.submissions) appData.submissions = {};
            if (!appData.submissions[selectedHw]) appData.submissions[selectedHw] = {};

            const cur = appData.submissions[selectedHw];
            let subCount = 0, missCount = 0;
            const missingNames = [];

            (appData.students || []).forEach((student, index) => {
                const status = cur[student] || 'missing';
                if (status === 'submitted' || status === 'late') subCount++;
                if (status === 'missing' || status === 'redo') {
                    missCount++;
                    missingNames.push(student);
                }

                const curLang = i18n[appData.lang] || i18n.zh;
                let styleClass = 'status-missing', txt = curLang.statusMissing;
                if (status === 'submitted') { styleClass = 'status-submitted'; txt = curLang.statusSubmitted; }
                if (status === 'late') { styleClass = 'status-late'; txt = curLang.statusLate; }
                if (status === 'redo') { styleClass = 'status-redo'; txt = curLang.statusRedo; }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="text-align: center; color: #94a3b8; font-weight: bold; font-size: 20px;">${index + 1}</td>
                    <td style="font-weight: bold; color: #0f172a; font-size: 24px;">${escapeOriginalHTML(student)}</td>
                    <td style="text-align: center;">
                        <button onclick="toggleHWStatus(${escapeOriginalHTML(JSON.stringify(selectedHw))}, ${escapeOriginalHTML(JSON.stringify(student))})" class="status-btn ${styleClass}">
                            ${txt}
                        </button>
                    </td>`;
                tbody.appendChild(row);
            });

            if (missingNames.length > 0) {
                missingNames.forEach(name => {
                    missingBox.innerHTML += `<span class="missing-name-tag">${name}</span>`;
                });
            } else {
                missingBox.innerHTML = `<span class="no-missing-tag">${(i18n[appData.lang] || i18n.zh).noMissingMsg}</span>`;
            }

            document.getElementById('stat-total').innerText = appData.students.length;
            document.getElementById('stat-submitted').innerText = subCount;
            document.getElementById('stat-missing').innerText = missCount;
        }

        function renderHomeworkMatrix() {
            const head = document.getElementById('hw-matrix-head');
            const body = document.getElementById('hw-matrix-body');
            head.innerHTML = '';
            body.innerHTML = '';

            const curLang = i18n[appData.lang] || i18n.zh;
            const homeworks = appData.homeworks || [];
            const students = appData.students || [];
            const showRate = document.getElementById('chk-show-rate').checked;

            if (homeworks.length === 0 || students.length === 0) {
                body.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:30px; font-size:20px;">尚無習作或學生資料！</td></tr>`;
                return;
            }

            let trHead = `<tr><th style="width:60px; text-align:center;">#</th><th style="min-width:160px;">${curLang.thStudentName}</th>`;
            homeworks.forEach(hw => {
                trHead += `<th style="text-align:center; min-width:150px;">${escapeOriginalHTML(hw)}</th>`;
            });

            if (showRate) {
                trHead += `<th style="text-align:center; min-width:120px;">${curLang.thCompletionRate}</th>`;
            }
            trHead += `</tr>`;
            head.innerHTML = trHead;

            students.forEach((student, sIdx) => {
                let submittedCount = 0;
                let trRow = `<tr>
                    <td style="text-align:center; color:#94a3b8; font-weight:bold; font-size:20px;">${sIdx + 1}</td>
                    <td style="font-weight:bold; color:#0f172a; font-size:22px;">${escapeOriginalHTML(student)}</td>`;

                homeworks.forEach(hw => {
                    if (!appData.submissions[hw]) appData.submissions[hw] = {};
                    const status = appData.submissions[hw][student] || 'missing';

                    if (status === 'submitted' || status === 'late') submittedCount++;

                    let styleClass = 'status-missing', txt = curLang.statusMissing;
                    if (status === 'submitted') { styleClass = 'status-submitted'; txt = curLang.statusSubmitted; }
                    if (status === 'late') { styleClass = 'status-late'; txt = curLang.statusLate; }
                    if (status === 'redo') { styleClass = 'status-redo'; txt = curLang.statusRedo; }

                    trRow += `<td style="text-align:center;">
                        <button onclick="toggleHWStatusInMatrix(${escapeOriginalHTML(JSON.stringify(hw))}, ${escapeOriginalHTML(JSON.stringify(student))})" class="status-badge-sm ${styleClass}">
                            ${txt}
                        </button>
                    </td>`;
                });

                if (showRate) {
                    const rate = Math.round((submittedCount / homeworks.length) * 100);
                    let rateColor = '#059669';
                    if (rate < 80) rateColor = '#d97706';
                    if (rate < 50) rateColor = '#dc2626';
                    trRow += `<td style="text-align:center; font-weight:bold; color:${rateColor}; font-size:20px;">${rate}%</td>`;
                }
                trRow += `</tr>`;
                body.appendChild(parseHTML(trRow));
            });

            document.getElementById('stat-total').innerText = students.length;
        }

        function parseHTML(html) {
            const t = document.createElement('template');
            t.innerHTML = html.trim();
            return t.content.firstChild;
        }

        function toggleHWStatusInMatrix(hw, student) {
            toggleHWStatus(hw, student);
            renderHomeworkMatrix();
        }

        function copyMissingList() {
            const selectedHw = document.getElementById('hw-select').value;
            if (!selectedHw) return;
            const cur = appData.submissions[selectedHw] || {};
            const missingNames = appData.students.filter(s => (cur[s] || 'missing') === 'missing' || cur[s] === 'redo');

            if (missingNames.length === 0) {
                alert(appData.lang === 'zh' ? '太棒了，目前沒有未交功課的學生！' : 'Great! No missing students!');
                return;
            }

            const textToCopy = `【${selectedHw}】未交學生名單 (${missingNames.length}人)：\n` + missingNames.join('、');
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert(appData.lang === 'zh' ? '已成功複製未交學生名單！' : 'Copied missing list to clipboard!');
            });
        }

        function toggleHWStatus(hw, student) {
            const next = { 'missing': 'submitted', 'submitted': 'late', 'late': 'redo', 'redo': 'missing' };
            if (!appData.submissions[hw]) appData.submissions[hw] = {};
            appData.submissions[hw][student] = next[appData.submissions[hw][student] || 'missing'];
            markDirty();
            if (currentHwViewMode === 'single') renderHomeworkTable();
        }

        function markAllAsSubmitted() {
            const hw = document.getElementById('hw-select').value; if (!hw) return;
            appData.students.forEach(s => appData.submissions[hw][s] = 'submitted');
            markDirty();
            renderHomeworkTable();
        }

        function handleAdminLogin(e) {
            e.preventDefault();
            if (document.getElementById('admin-password-input').value === '0926') {
                isAdminLoggedIn = true;
                document.getElementById('admin-login-card').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                renderAdminTab();
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        }

        function renderAdminTab() {
            if (!isAdminLoggedIn) return;
            const l = appData.lesson || {};
            document.getElementById('edit-title').value = l.title || '';
            document.getElementById('edit-date').value = l.date || '';
            document.getElementById('edit-objectives').value = l.objectives || '';
            document.getElementById('edit-announcement').value = l.announcement || '';
            document.getElementById('edit-materials').value = l.materials || '';

            document.getElementById('edit-show-ann').checked = (l.showAnnouncement !== false);
            document.getElementById('edit-show-mat').checked = (l.showMaterials !== false);

            renderHistoryLessonsList();
            renderFlowPresetsList();
            renderFlowEditList();
            renderAdminStudentList();
            renderAdminHomeworkList();
            lessonEditorReady = true;
        }

        async function saveLessonChanges() {
            if (!isAdminLoggedIn) return;
            syncAllInputsToData();
            renderLessonTab();
            await saveSelfToHTML();
        }
        function saveCurrentFlowAsPreset() {
            syncAllInputsToData();
            const presetName = document.getElementById('preset-name-input').value.trim();
            if (!presetName) {
                alert(appData.lang === 'zh' ? '請輸入範本名稱！' : 'Please enter preset name!');
                return;
            }

            if (!appData.flowPresets) appData.flowPresets = [];
            appData.flowPresets.push({
                name: presetName,
                flow: JSON.parse(JSON.stringify(appData.lesson.flow || []))
            });

            document.getElementById('preset-name-input').value = '';
            markDirty();
            renderFlowPresetsList();
            alert(appData.lang === 'zh' ? `已成功儲存範本「${presetName}」！` : `Preset "${presetName}" saved!`);
        }

        function loadFlowPreset(index) {
            if (!appData.flowPresets || !appData.flowPresets[index]) return;
            const preset = appData.flowPresets[index];
            if (confirm(appData.lang === 'zh' ? `確定載入範本「${preset.name}」並覆蓋當前流程？` : `Load preset "${preset.name}"?`)) {
                appData.lesson.flow = JSON.parse(JSON.stringify(preset.flow));
                markDirty();
                renderFlowEditList();
                renderLessonTab();
            }
        }

        function deleteFlowPreset(index) {
            if (confirm(appData.lang === 'zh' ? '確定刪除此範本？' : 'Delete this preset?')) {
                appData.flowPresets.splice(index, 1);
                markDirty();
                renderFlowPresetsList();
            }
        }

        function renderFlowPresetsList() {
            const container = document.getElementById('preset-list-container');
            container.innerHTML = '';
            if (!appData.flowPresets || appData.flowPresets.length === 0) {
                container.innerHTML = `<span style="font-size:16px; color:#94a3b8;">${appData.lang === 'zh' ? '尚未儲存任何流程範本' : 'No saved presets'}</span>`;
                return;
            }

            appData.flowPresets.forEach((p, idx) => {
                container.innerHTML += `
                    <span style="background:#e0e7ff; color:#4338ca; padding:8px 16px; border-radius:24px; font-size:17px; font-weight:bold; display:inline-flex; align-items:center; gap:10px;">
                        <span onclick="loadFlowPreset(${idx})" style="cursor:pointer;" title="點擊載入此範本">📌 ${escapeOriginalHTML(p.name)}</span>
                        <button onclick="deleteFlowPreset(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">✕</button>
                    </span>`;
            });
        }

        function syncAllInputsToData() {
            // Inputs update the model on each input event. Never reconstruct flow
            // from a potentially hidden or stale DOM during save/export.
            if (!isAdminLoggedIn || !lessonEditorReady) return;
            syncLessonFields();
        }
        async function saveSelfToHTML() {
            if (!isAdminLoggedIn || fileWriteBusy) return;
            syncAllInputsToData();
            fileWriteBusy = true;
            setSaveButtonsDisabled(true);
            try {
                await fileHandleReady;
                if (!window.showOpenFilePicker) {
                    setFileStatus(L('此瀏覽器不支援更新原檔。請使用「下載副本」，再自行覆蓋舊 HTML。', 'Direct file writing is unavailable. Use Download copy and replace the old HTML manually.'), true);
                    return;
                }
                if (!originalFileHandle) originalFileHandle = await chooseOriginalFile();
                if (!originalFileHandle) return;
                const permission = {mode:'readwrite'};
                if (await originalFileHandle.queryPermission(permission) !== 'granted' &&
                    await originalFileHandle.requestPermission(permission) !== 'granted') {
                    throw new Error('permission');
                }
                const snapshot = captureAllData();
                const writtenRevision = classBook ? classBook.revision : appData._storage.revision;
                const stream = await originalFileHandle.createWritable();
                try { await stream.write(buildHTMLSnapshot(snapshot)); await stream.close(); }
                catch (error) { try { await stream.abort(); } catch {} throw error; }
                await rememberFileHandle(originalFileHandle);
                if ((classBook ? classBook.revision : appData._storage.revision) === writtenRevision) clearDirty();
                setFileStatus(L('已更新原檔：', 'Original file updated: ') + originalFileHandle.name +
                    (isDirty ? L('；寫入期間有新修改，請再按儲存。','; more edits were made during writing. Save again.') : ' ✓'));
            } catch (error) {
                setFileStatus(error.name === 'AbortError' ? L('已取消選檔；沒有覆寫檔案，修改仍保留在本機。','Cancelled. No file was overwritten; local edits are kept.') :
                    L('本次未能更新原檔。請重試授權、重新選檔，或下載副本；修改仍保留在本機。','The original file was not updated. Retry permission, reconnect, or download a copy. Local edits are kept.'), true);
            } finally {
                fileWriteBusy = false;
                setSaveButtonsDisabled(false);
            }
        }
        function exportDataJson() {
            if (!isAdminLoggedIn) return;
            syncAllInputsToData();
            downloadFile(JSON.stringify(captureAllData(), null, 2), 'data.json', 'application/json;charset=utf-8');
            setFileStatus(L('已產生 JSON 下載，請確認已存妥；原 HTML 尚未因此更新。','JSON download requested. Check the download; this does not update the original HTML.'));
        }
        async function importDataJson(event) {
            const file = event.target.files[0];
            event.target.value = '';
            if (!file || !isAdminLoggedIn || fileWriteBusy || isPicking) return;
            try {
                if (file.size > 20*1024*1024) throw new Error('size');
                const importTarget=currentClassKey;
                if(/\.xlsx$/i.test(file.name)){
                    const roster=await readSchoolExcel(file);
                    if(fileWriteBusy||isPicking||!isAdminLoggedIn||currentClassKey!==importTarget)return;
                    importSchoolRosters(roster);return;
                }
                const text = await file.text();
                if(fileWriteBusy||isPicking||!isAdminLoggedIn||currentClassKey!==importTarget)return;
                const parsed = /\.html?$/i.test(file.name) ? new DOMParser().parseFromString(text, 'text/html').getElementById('embedded-data')?.textContent : text;
                const decoded=JSON.parse(parsed);
                if(decoded.rosterImportVersion===1){importSchoolRosters(decoded);return;}
                if(decoded.workspaceVersion===1){importWholeBook(decoded);return;}
                const imported = validateOriginalData(decoded);
                if (!confirm(L('匯入會取代目前資料。確認後會先下載目前資料的 JSON 備份。', 'Import replaces current data. A safety JSON backup will be downloaded first.'))) return;
                downloadFile(JSON.stringify(captureAllData(),null,2),'before-import-data.json','application/json');
                const metadata = {...appData._storage,id:newStorageId()};
                appData = imported;
                appData._storage = metadata;
                lessonEditorReady = false;
                markDirty();
                resetPickerHistory();
                applyLanguageUI();
                renderLessonTab();renderHomeworkTab();renderAdminTab();
                setFileStatus(L('已匯入。按「儲存並更新原檔」把資料寫回目前連接的 HTML。', 'Imported. Use Save & update original to write the data into the connected HTML.'));
            } catch {
                setFileStatus(L('匯入失敗：請檢查 Excel / HTML / JSON 格式、檔案大小及瀏覽器支援。原資料未變更。','Import failed: invalid or oversized HTML / JSON. Current data was not changed.'), true);
            }
        }
        function renderFlowEditList() {
            if (!isAdminLoggedIn) return;
            const container = document.getElementById('edit-flow-container');
            container.replaceChildren();
            appData.lesson.flow.forEach((item, index) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; gap:10px; margin-bottom:10px;';
                [['time','時間','140px'], ['title','步驟標題','240px'], ['detail','詳細說明','']].forEach(([field,label,width]) => {
                    const input = document.createElement('input');
                    input.type='text';input.value=item[field] || '';input.placeholder=label;
                    input.className='flow-'+field+'-input';input.setAttribute('aria-label',label);
                    input.style.margin='0';if(width)input.style.width=width;
                    input.addEventListener('input',()=>{item[field]=input.value;markDirty();renderLessonTab();});
                    row.appendChild(input);
                });
                const remove=document.createElement('button');remove.textContent='🗑️';remove.className='btn btn-secondary';
                remove.style.cssText='padding:6px 14px;color:#dc2626;';remove.setAttribute('aria-label',L('刪除步驟','Delete step'));
                remove.onclick=()=>removeFlowStep(index);row.appendChild(remove);
                for(const [label,action] of [['↑',()=>moveFlowStep(index,-1)],['↓',()=>moveFlowStep(index,1)],['複製',()=>duplicateFlowStep(index)]]){
                    const b=document.createElement('button');b.className='btn btn-secondary';b.textContent=label;b.type='button';b.onclick=action;b.setAttribute('aria-label',label==='複製'?'複製步驟':label==='↑'?'上移步驟':'下移步驟');
                    b.disabled=label==='↑'?index===0:label==='↓'?index===appData.lesson.flow.length-1:false;row.appendChild(b);
                }
                row.classList.add('flow-edit-row');container.appendChild(row);
            });
        }
        function addFlowStep() {
            if (!isAdminLoggedIn) return;
            if(appData.lesson.flow.length>=500){alert('流程最多 500 個步驟。');return;}
            appData.lesson.flow.push({time:'',title:'',detail:''});
            markDirty();renderFlowEditList();renderLessonTab();
            document.querySelectorAll('.flow-title-input')[appData.lesson.flow.length-1]?.focus();
        }
        function removeFlowStep(index) {
            if (!isAdminLoggedIn) return;
            appData.lesson.flow.splice(index,1);
            markDirty();renderFlowEditList();renderLessonTab();
        }
        function batchImportStudents() {
            if (isPicking) return;
            const text = document.getElementById('import-students-text').value;
            const names = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
            if (names.length > 0 && confirm(appData.lang === 'zh' ? `確定匯入 ${names.length} 位學生？` : `Import ${names.length} students?`)) {
                appData.students = names;
                uncalledStudents = [...names];
                appData._pickerRemaining=[...names];
                markDirty();
                renderAdminStudentList();
                updatePickerCount();
            }
        }

        function renderAdminStudentList() {
            const listDiv = document.getElementById('admin-student-list');
            document.getElementById('admin-student-count').innerText = appData.students.length;
            listDiv.innerHTML = '';
            appData.students.forEach((s, i) => {
                listDiv.innerHTML += `<div style="padding:6px 10px; font-weight:bold; font-size:18px; border-bottom:1px solid #e2e8f0;">${i+1}. ${escapeOriginalHTML(s)}</div>`;
            });
        }

        function addNewHomework() {
            const input = document.getElementById('new-hw-name');
            const name = input.value.trim();
            if (name && !appData.homeworks.includes(name)) {
                appData.homeworks.push(name);
                input.value = '';
                markDirty();
                renderAdminHomeworkList();
            }
        }

        function deleteHomework(hwName) {
            const confirmMsg = appData.lang === 'zh'
                ? `確定要刪除習作「${hwName}」嗎？這將同時刪除該習作的所有學生繳交紀錄！`
                : `Are you sure you want to delete assignment "${hwName}"? All submission records for this assignment will also be removed.`;

            if (confirm(confirmMsg)) {
                appData.homeworks = appData.homeworks.filter(hw => hw !== hwName);
                if (appData.submissions && appData.submissions[hwName]) {
                    delete appData.submissions[hwName];
                }
                markDirty();
                renderAdminHomeworkList();
                renderHomeworkTab();
            }
        }

        function renderAdminHomeworkList() {
            const container = document.getElementById('admin-hw-list');
            container.innerHTML = '';
            (appData.homeworks || []).forEach(hw => {
                const safeHw = hw.replace(/'/g, "\\'");
                container.innerHTML += `
                    <span style="background:#e0e7ff; color:#3730a3; padding:8px 18px; border-radius:24px; font-size:18px; font-weight:bold; display:inline-flex; align-items:center; gap:10px;">
                        <span>${escapeOriginalHTML(hw)}</span>
                        <button onclick="deleteHomework(${escapeOriginalHTML(JSON.stringify(hw))})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:18px; padding:0 2px;" title="刪除此習作">✕</button>
                    </span>`;
            });
        }

        window.onload = function() {
            // Never trust UI login state saved in a prior live DOM snapshot.
            isAdminLoggedIn=false;lessonEditorReady=false;
            document.getElementById('admin-panel').style.display='none';
            document.getElementById('admin-login-card').style.display='block';
            document.getElementById('admin-password-input').value='';
            document.getElementById('login-error').style.display='none';
            wireLessonFields();resetPickerHistory(false);
            applyLanguageUI();renderLessonTab();updateTimerDisplay();switchTab('lesson');
            fileHandleReady=restoreFileHandle();
            initializeClassHome();
            if(localRecoveryWarning||localSaveFailed)setFileStatus(L('本機備份無法使用；目前顯示 HTML 內的資料，請先匯出備份。','Local backup unavailable. The HTML data is shown; export a backup.'),true);
        };
