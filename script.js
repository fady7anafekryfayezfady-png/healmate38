/* ========== HEAL MATE Professional v3.0 ========== */

/* ===== Helpers ===== */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ===== Elements ===== */
const splash = $('splashLoader');
const intro = $('intro');
const app = $('app');
const startBtn = $('startBtn');
const menuBtn = $('menuBtn');
const sidebar = $('sidebar');
const closeSidebar = $('closeSidebar');
const alarmRing = $('alarmRing');
const music = $('musicTrack');
const alarmOverlay = $('alarmOverlay');

/* ===== Audio Context ===== */
let audioCtx = null;
function beep(freq=880, time=0.08){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type='sine'; o.frequency.value=freq;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time);
  setTimeout(()=> o.stop(), time*1000 + 50);
}

/* ===== Splash ===== */
setTimeout(() => {
  if(splash){ splash.style.display='none'; }
  intro.style.display = 'flex';
}, 3000);

// ════════════════════════════════════════════════════════════════
// 🎮 نظام النقاط والشارات
// ════════════════════════════════════════════════════════════════

let gameData = JSON.parse(localStorage.getItem('gameData') || '{"points":0,"streak":0,"lastDate":"","badges":[],"level":1,"totalMeds":0}');

const levels = [
  {level: 1, name: "مبتدئ", minPoints: 0, emoji: "⚪"},
  {level: 2, name: "ملتزم", minPoints: 100, emoji: "🟢"},
  {level: 3, name: "بطل", minPoints: 300, emoji: "🔵"},
  {level: 4, name: "محارب", minPoints: 600, emoji: "🟣"},
  {level: 5, name: "أسطورة", minPoints: 1000, emoji: "🟡"}
];

const badges = [
  {id: "first_med", name: "البداية", desc: "أول دواء!", emoji: "🎯", points: 10},
  {id: "week_streak", name: "أسبوع ذهبي", desc: "7 أيام متواصلة", emoji: "🏆", points: 50},
  {id: "month_streak", name: "بطل الشهر", desc: "30 يوم", emoji: "👑", points: 200},
  {id: "fast_click", name: "سريع البرق", desc: "أوقفت المنبه بـ5 ثواني", emoji: "⚡", points: 20},
  {id: "perfect_day", name: "يوم مثالي", desc: "كل الأدوية في الوقت", emoji: "💯", points: 30},
  {id: "health_master", name: "سيد الصحة", desc: "100 دواء", emoji: "🥇", points: 100}
];

function saveGameData() {
  localStorage.setItem('gameData', JSON.stringify(gameData));
}

function getCurrentLevel() {
  return levels.filter(l => gameData.points >= l.minPoints).pop();
}

function getNextLevel() {
  const current = getCurrentLevel();
  return levels.find(l => l.level === current.level + 1);
}

function addPoints(points, reason) {
  const oldLevel = gameData.level;
  gameData.points += points;
  
  const newLevel = getCurrentLevel();
  gameData.level = newLevel.level;
  
  saveGameData();
  showPointsToast(points, reason);
  updatePointsDisplay();
  
  if (newLevel.level > oldLevel) {
    setTimeout(() => showLevelUpToast(newLevel), 500);
  }
  
  updateGameBadge();
}

function unlockBadge(badgeId) {
  if (gameData.badges.includes(badgeId)) return;
  
  const badge = badges.find(b => b.id === badgeId);
  if (!badge) return;
  
  gameData.badges.push(badgeId);
  saveGameData();
  
  showBadgeToast(badge);
  addPoints(badge.points, `شارة: ${badge.name}`);
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = gameData.lastDate;
  
  if (lastDate === today) return;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  if (lastDate === yesterdayStr) {
    gameData.streak++;
    addPoints(5, `🔥 ${gameData.streak} يوم متواصل`);
    
    if (gameData.streak === 7) unlockBadge("week_streak");
    if (gameData.streak === 30) unlockBadge("month_streak");
  } else if (lastDate && lastDate !== today) {
    gameData.streak = 1;
  } else {
    gameData.streak = 1;
  }
  
  gameData.lastDate = today;
  saveGameData();
}

function showPointsToast(points, reason) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    font-family: inherit;
    min-width: 200px;
  `;
  
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:24px;">⭐</span>
      <div>
        <div style="font-weight:bold; font-size:18px;">+${points} نقطة</div>
        <div style="font-size:13px; opacity:0.9;">${reason}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(toast);
  beep(880, 0.08);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLevelUpToast(level) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: 30px 40px;
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    z-index: 10001;
    text-align: center;
    animation: levelUp 0.5s ease-out;
    font-family: inherit;
  `;
  
  toast.innerHTML = `
    <div style="font-size:60px; margin-bottom:10px;">${level.emoji}</div>
    <div style="font-size:24px; font-weight:bold; margin-bottom:5px;">مستوى جديد!</div>
    <div style="font-size:32px; font-weight:bold;">${level.name}</div>
    <div style="font-size:14px; opacity:0.9; margin-top:10px;">${gameData.points} نقطة</div>
  `;
  
  document.body.appendChild(toast);
  
  beep(523, 0.1);
  setTimeout(() => beep(659, 0.1), 100);
  setTimeout(() => beep(784, 0.15), 200);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showBadgeToast(badge) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #333;
    padding: 30px 40px;
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(255,215,0,0.5);
    z-index: 10001;
    text-align: center;
    animation: bounceIn 0.5s ease-out;
    font-family: inherit;
  `;
  
  toast.innerHTML = `
    <div style="font-size:60px; margin-bottom:10px;">${badge.emoji}</div>
    <div style="font-size:20px; font-weight:bold; margin-bottom:5px;">شارة جديدة!</div>
    <div style="font-size:28px; font-weight:bold; margin-bottom:5px;">${badge.name}</div>
    <div style="font-size:14px; opacity:0.8;">${badge.desc}</div>
    <div style="font-size:16px; margin-top:10px; font-weight:bold;">+${badge.points} نقطة 🎉</div>
  `;
  
  document.body.appendChild(toast);
  
  beep(880, 0.1);
  setTimeout(() => beep(1047, 0.15), 150);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function updatePointsDisplay() {
  const pointsEl = document.getElementById('pointsDisplay');
  if (pointsEl) {
    pointsEl.textContent = gameData.points;
  }
}

function updateGameBadge() {
  const oldBadge = document.querySelector('.game-badge');
  if (oldBadge) oldBadge.remove();
  
  const level = getCurrentLevel();
  
  const badge = document.createElement('div');
  badge.className = 'game-badge';
  badge.style.cssText = `
    position: fixed;
    top: 70px;
    left: 20px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    padding: 12px 16px;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 999;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: transform 0.2s;
    font-family: inherit;
  `;
  
  badge.innerHTML = `
    <span style="font-size:24px;">${level.emoji}</span>
    <div>
      <div style="font-size:11px; color:#666; font-weight:600;">${level.name}</div>
      <div style="font-size:14px; font-weight:bold; color:#333;">${gameData.points} نقطة</div>
    </div>
    ${gameData.streak > 0 ? `<div style="font-size:20px; margin-left:5px;">🔥${gameData.streak}</div>` : ''}
  `;
  
  badge.onclick = () => showGameStats();
  badge.onmouseenter = () => badge.style.transform = 'scale(1.05)';
  badge.onmouseleave = () => badge.style.transform = 'scale(1)';
  
  document.body.appendChild(badge);
  
  if (document.body.classList.contains('dark')) {
    badge.style.background = 'rgba(30,30,30,0.95)';
    badge.style.color = 'white';
  }
}

function showGameStats() {
  const level = getCurrentLevel();
  const nextLevel = getNextLevel();
  
  let statsHTML = `
    <div style="text-align:center; padding:20px;">
      <div style="font-size:60px; margin-bottom:10px;">${level.emoji}</div>
      <div style="font-size:24px; font-weight:bold; margin-bottom:5px;">${level.name}</div>
      <div style="font-size:32px; font-weight:bold; color:#667eea; margin-bottom:20px;">${gameData.points} نقطة</div>
      
      ${nextLevel ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:14px; color:#666; margin-bottom:5px;">
            ${nextLevel.minPoints - gameData.points} نقطة للمستوى التالي ${nextLevel.emoji}
          </div>
          <div style="background:#eee; height:8px; border-radius:10px; overflow:hidden;">
            <div style="background:linear-gradient(90deg, #667eea, #764ba2); height:100%; width:${((gameData.points - level.minPoints) / (nextLevel.minPoints - level.minPoints) * 100)}%; transition:width 0.3s;"></div>
          </div>
        </div>
      ` : '<div style="color:#FFD700; font-weight:bold; margin-bottom:20px;">🏆 أعلى مستوى!</div>'}
      
      <div style="display:flex; justify-content:center; gap:30px; margin-bottom:20px;">
        <div>
          <div style="font-size:28px;">🔥</div>
          <div style="font-size:20px; font-weight:bold;">${gameData.streak}</div>
          <div style="font-size:12px; color:#666;">يوم</div>
        </div>
        <div>
          <div style="font-size:28px;">💊</div>
          <div style="font-size:20px; font-weight:bold;">${gameData.totalMeds}</div>
          <div style="font-size:12px; color:#666;">دواء</div>
        </div>
        <div>
          <div style="font-size:28px;">🏅</div>
          <div style="font-size:20px; font-weight:bold;">${gameData.badges.length}</div>
          <div style="font-size:12px; color:#666;">شارة</div>
        </div>
      </div>
      
      <div style="text-align:right; margin-top:20px;">
        <div style="font-weight:bold; margin-bottom:10px; font-size:16px;">🏅 الشارات (${gameData.badges.length}/${badges.length})</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:200px; overflow-y:auto;">
          ${badges.map(b => `
            <div style="padding:10px; background:${gameData.badges.includes(b.id) ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#f5f5f5'}; border-radius:10px; text-align:center; ${!gameData.badges.includes(b.id) ? 'opacity:0.4; filter:grayscale(1);' : ''}">
              <div style="font-size:30px;">${b.emoji}</div>
              <div style="font-size:12px; font-weight:bold; margin-top:5px;">${b.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    animation: slideUp 0.3s;
  `;
  
  modal.innerHTML = statsHTML;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    left: 15px;
    background: #f5f5f5;
    border: none;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.onclick = () => overlay.remove();
  
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  
  document.body.appendChild(overlay);
}

const gameStyle = document.createElement('style');
gameStyle.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
  @keyframes levelUp {
    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }
  @keyframes bounceIn {
    0% { transform: translate(-50%, -50%) scale(0); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes fadeOut {
    to { opacity: 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(gameStyle);

// ════════════════════════════════════════════════════════════════
// انتهى نظام النقاط
// ════════════════════════════════════════════════════════════════

/* ===== Start App ===== */
if(startBtn) {
  startBtn.addEventListener('click', async () => {
    document.body.classList.remove('no-scroll');
    
    if(intro) intro.style.display='none';
    if(app) app.classList.remove('hidden');
    
    if(audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    if(alarmRing) {
      try {
        alarmRing.load();
        alarmRing.volume = 0;
        const playPromise = alarmRing.play();
        if (playPromise !== undefined) {
          await playPromise;
          alarmRing.pause();
          alarmRing.currentTime = 0;
          alarmRing.volume = 1.0;
        }
      } catch(err) {
        console.warn('⚠️ فشل فتح القفل:', err);
      }
    }
    
    const musicSwitch = $('musicSwitch');
    if(musicSwitch && musicSwitch.checked && music) {
      try {
        music.load();
        music.volume = 0.15;
        await music.play();
      } catch(err) {}
    }
    
    showPage('page-meds');
    beep(660, 0.06);
  });
}

/* ===== Navigation ===== */
function toggleSidebar(){ 
  sidebar.classList.toggle('active'); 
  document.body.classList.toggle('menu-open'); 
}

menuBtn.addEventListener('click', toggleSidebar);
closeSidebar.addEventListener('click', toggleSidebar);

$$('.sidebar-link').forEach(btn => {
  btn.addEventListener('click', () => { 
    toggleSidebar(); 
    showPage(btn.dataset.page);
    beep(800, 0.05);
  });
});

document.body.addEventListener('click', (e) => {
  if(document.body.classList.contains('menu-open') && 
     !sidebar.contains(e.target) && 
     !menuBtn.contains(e.target)) {
    toggleSidebar();
  }
});

$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-btn').forEach(b=> b.classList.remove('active'));
    btn.classList.add('active');
    showPage(btn.dataset.page);
    beep(900,0.04);
  });
});

function showPage(id){
  $$('.page').forEach(p=> p.classList.remove('active'));
  const el = $(id);
  if(el) el.classList.add('active');
  
  const videoDialog = $('videoDialog');
  if(videoDialog && videoDialog.open){ 
    $('videoIframe').src=''; 
    videoDialog.close(); 
  }
}

$('fab').addEventListener('click', ()=>{ 
  showPage('page-meds'); 
  $('medName').focus(); 
  beep(720,0.05); 
});

$('settingsBtn').addEventListener('click', ()=> showPage('page-settings'));

/* ===== Dark Mode ===== */
$('darkToggle').addEventListener('click', ()=> {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? '1' : '0');
  $('darkModeSwitch').checked = isDark;
});

$('darkModeSwitch').addEventListener('change', (e)=> {
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('darkMode', e.target.checked ? '1' : '0');
});

function autoDark(){
  const pref = localStorage.getItem('darkMode');
  if(pref === '1'){ 
    document.body.classList.add('dark'); 
    $('darkModeSwitch').checked = true; 
    return; 
  }
  if(pref === '0'){ 
    document.body.classList.remove('dark'); 
    $('darkModeSwitch').checked = false; 
    return; 
  }
  const h = new Date().getHours();
  const auto = (h>=19 || h<7);
  document.body.classList.toggle('dark', auto);
  $('darkModeSwitch').checked = auto;
}

/* ===== Music ===== */
const tracks = [
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_6e9e792fc3.mp3",
  "https://cdn.pixabay.com/download/audio/2021/09/06/audio_7302d6ce02.mp3",
  "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
];
let curTrack = 0;

function loadMusicTrack(idx){
  curTrack = idx % tracks.length;
  music.src = tracks[curTrack];
  music.volume = 0.15;
  music.load();
}

loadMusicTrack(0);

$('musicSwitch').addEventListener('change', (e)=> {
  if(e.target.checked) {
    music.play().catch(()=> alert('اضغط في أي مكان بالتطبيق أولاً لتشغيل الموسيقى'));
  } else {
    music.pause();
  }
});

$('changeMusicBtn').addEventListener('click', ()=> {
  loadMusicTrack(curTrack + 1);
  if($('musicSwitch').checked) {
    music.play().catch(()=>{});
  }
  addLog(`تغيير موسيقى: مقطع ${curTrack+1}`);
  beep(1000, 0.06);
});

/* ===== Notifications ===== */
function requestNotif(){ 
  if('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission(); 
  }
}
/* ═══════════════════════════════════════════════════
   🔔 نظام الإشعارات المحسن
   ═══════════════════════════════════════════════════ */

function updateNotificationStatus() {
  const statusDiv = $('notificationStatus');
  const enableBtn = $('enableNotificationsBtn');
  
  if (!statusDiv || !enableBtn) return;
  
  if (!('Notification' in window)) {
    statusDiv.className = 'notification-status denied';
    statusDiv.innerHTML = '❌ متصفحك لا يدعم الإشعارات';
    enableBtn.disabled = true;
    enableBtn.style.opacity = '0.5';
    return;
  }
  
  const permission = Notification.permission;
  
  if (permission === 'granted') {
    statusDiv.className = 'notification-status granted';
    statusDiv.innerHTML = '✅ الإشعارات مفعلة! ستصلك التذكيرات في الوقت المحدد';
    enableBtn.textContent = '✓ الإشعارات مفعلة';
    enableBtn.disabled = true;
    enableBtn.style.opacity = '0.7';
  } else if (permission === 'denied') {
    statusDiv.className = 'notification-status denied';
    statusDiv.innerHTML = `
      ❌ <strong>الإشعارات محظورة</strong><br>
      <div class="notification-instructions" style="margin-top:10px;">
        <strong>لإعادة التفعيل:</strong>
        <ol>
          <li>اضغط على 🔒 (القفل) في شريط العنوان</li>
          <li>ابحث عن "الإشعارات" أو "Notifications"</li>
          <li>غيّر من "محظور" إلى "السماح"</li>
          <li>أعد تحميل الصفحة</li>
        </ol>
      </div>
    `;
    enableBtn.textContent = '⚠️ الإشعارات محظورة';
    enableBtn.disabled = true;
    enableBtn.style.opacity = '0.7';
  } else {
    statusDiv.className = 'notification-status default';
    statusDiv.innerHTML = '⚠️ الإشعارات غير مفعلة. اضغط الزر أدناه للتفعيل';
    enableBtn.textContent = '🔔 تفعيل الإشعارات الآن';
    enableBtn.disabled = false;
    enableBtn.style.opacity = '1';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('❌ عذراً، متصفحك لا يدعم الإشعارات');
    return;
  }
  
  if (Notification.permission === 'granted') {
    // إرسال إشعار تجريبي
    new Notification('🎉 تم التفعيل بنجاح!', {
      body: 'ستصلك الآن تذكيرات الأدوية في الوقت المحدد',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💊</text></svg>',
      vibrate: [200, 100, 200]
    });
    updateNotificationStatus();
    return;
  }
  
  if (Notification.permission === 'denied') {
    alert('⚠️ الإشعارات محظورة.\n\nلإعادة التفعيل:\n1. اضغط على 🔒 في شريط العنوان\n2. ابحث عن "الإشعارات"\n3. غيّر إلى "السماح"\n4. أعد تحميل الصفحة');
    return;
  }
  
  // طلب الإذن
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      // إشعار تجريبي
      new Notification('🎉 ممتاز! الإشعارات مفعلة', {
        body: 'ستصلك تذكيرات الأدوية في الوقت المحدد ⏰',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💊</text></svg>',
        vibrate: [200, 100, 200]
      });
      
      addLog('تفعيل الإشعارات');
      addPoints(5, 'تفعيل الإشعارات');
    } else if (permission === 'denied') {
      alert('❌ تم رفض الإشعارات.\n\nلن تصلك تذكيرات الأدوية.');
    }
    
    updateNotificationStatus();
  });
}

// تحديث الحالة عند تحميل الصفحة
if ($('enableNotificationsBtn')) {
  $('enableNotificationsBtn').addEventListener('click', requestNotificationPermission);
  updateNotificationStatus();
}
/* ===== Alarm System ===== */
let voiceTimeoutId = null;
let currentAlarmMed = null;
let isAlarmRinging = false;

function playVoice(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'ar-SA';
  msg.volume = 1.0;
  msg.rate = 0.88;
  window.speechSynthesis.speak(msg);
}

function continuousVoice(text, delay = 7000) {
  clearTimeout(voiceTimeoutId);
  function speakLoop() {
    if (isAlarmRinging) {
      playVoice(text);
      voiceTimeoutId = setTimeout(speakLoop, delay);
    }
  }
  speakLoop();
}

function startAlarm(medName) {
  if(isAlarmRinging) return;
  
  isAlarmRinging = true;
  currentAlarmMed = medName;
  
  if (music && !music.paused) music.pause();
  
  if(alarmRing) {
    alarmRing.volume = 1.0;
    alarmRing.currentTime = 0;
    
    const playPromise = alarmRing.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ صوت المنبه يعمل!');
        })
        .catch(err => {
          console.error('❌ صوت المنبه فشل:', err);
          setTimeout(() => {
            alarmRing.play().catch(() => {
              for(let i = 0; i < 5; i++) {
                setTimeout(() => beep(880, 0.3), i * 500);
              }
              if ('vibrate' in navigator) {
                navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
              }
              alert('⏰ حان وقت الدواء: ' + medName);
            });
          }, 100);
        });
    }
  }
  
  const textToSay = `تنبيه مهم! حان وقت أخذ دواء ${medName} الآن! يرجى أخذ الدواء فوراً`;
  continuousVoice(textToSay, 7000);
  
  const alarmMedName = $('alarmMedName');
  const alarmTime = $('alarmTime');
  if(alarmMedName) alarmMedName.textContent = `⏰ حان وقت: ${medName}`;
  const now = new Date();
  if(alarmTime) alarmTime.textContent = now.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
  if(alarmOverlay) alarmOverlay.style.display = 'flex';
  
  if('Notification' in window && Notification.permission === 'granted'){
    const notification = new Notification('⏰ HEAL MATE — تذكير دواء', {
      body: `حان وقت أخذ: ${medName}`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💊</text></svg>',
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      tag: 'med-alarm',
      silent: false
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
  
  if ('vibrate' in navigator) {
    const vibratePattern = [300, 100, 300, 100, 300];
    navigator.vibrate(vibratePattern);
    
    const vibrateInterval = setInterval(() => {
      if (isAlarmRinging) {
        navigator.vibrate(vibratePattern);
      } else {
        clearInterval(vibrateInterval);
      }
    }, 5000);
  }
}

function stopAlarm(){ 
  isAlarmRinging = false;
  alarmRing.pause(); 
  alarmRing.currentTime = 0; 
  window.speechSynthesis.cancel(); 
  clearTimeout(voiceTimeoutId); 
  alarmOverlay.style.display = 'none';
  currentAlarmMed = null;
  
  if($('musicSwitch').checked && music.paused) {
    music.play().catch(()=>{});
  }
}

$('stopAlarmBtn').addEventListener('click', () => {
  if(currentAlarmMed) {
    addLog(`إيقاف منبه: ${currentAlarmMed}`);
    addPoints(15, 'أخذت الدواء في وقته');
  }
  stopAlarm();
  beep(1200, 0.08);
});

$('snoozeAlarmBtn').addEventListener('click', () => {
  const medName = currentAlarmMed;
  stopAlarm();
  addLog(`تأجيل: ${medName} لـ 5 دقائق`);
  
  setTimeout(() => {
    startAlarm(medName);
    addLog(`تذكير مؤجل: ${medName}`);
  }, 5 * 60 * 1000);
  
  beep(880, 0.06);
});

/* ===== Medications ===== */
let meds = JSON.parse(localStorage.getItem('meds_v3') || '[]');
const medList = $('medList');

function renderMeds(){
  medList.innerHTML = '';
  if(!meds.length){ 
    medList.innerHTML = '<li class="muted" style="list-style:none;text-align:center;padding:20px">لا توجد أدوية. اضغط "إضافة" لبدء التسجيل</li>'; 
    return; 
  }
  
  meds.forEach((m, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong style="font-size:16px">${m.name}</strong>${m.time ? ` <span style="color:var(--muted)">— ${m.time}</span>` : ''}</div>`;
    
    const actions = document.createElement('div');
    actions.style.display='flex';
    actions.style.gap='8px';
    
    const takenBtn = document.createElement('button');
    takenBtn.textContent='✓';
    takenBtn.className='btn small-btn success';
    takenBtn.style.padding='8px 12px';
    takenBtn.addEventListener('click', ()=>{
      addLog(`أخذ: ${m.name}`);
      stopAlarm();
      playVoice(`تم أخذ دواء ${m.name} بنجاح`);
      beep(1200,0.05);
      li.style.opacity='0.5';
      setTimeout(()=> li.style.opacity='1', 2000);
    });
    
    const delBtn = document.createElement('button');
    delBtn.textContent='✕';
    delBtn.className='btn small-btn danger';
    delBtn.style.padding='8px 12px';
    delBtn.addEventListener('click', ()=> {
      if(confirm(`حذف: ${m.name}؟`)){
        meds.splice(idx,1);
        saveMeds();
        renderMeds();
        addLog(`حذف: ${m.name}`);
        beep(600, 0.05);
      }
    });
    
    actions.appendChild(takenBtn);
    actions.appendChild(delBtn);
    li.appendChild(actions);
    medList.appendChild(li);
  });
}

function saveMeds(){ localStorage.setItem('meds_v3', JSON.stringify(meds)); }

$('addMedBtn').addEventListener('click', ()=>{
  const name = $('medName').value.trim();
  const time = $('medTime').value;
  
  if(!name) return alert('اكتب اسم الدواء');
  
  alarmRing.volume = 1.0;
  alarmRing.play().then(() => {
    setTimeout(() => {
      alarmRing.pause();
      alarmRing.currentTime = 0;
    }, 300);
  }).catch(()=>{});
  
  meds.push({name, time, notified:false});
  saveMeds();
  renderMeds();
  addLog(`إضافة: ${name} — ${time || 'بدون وقت'}`);
  
  gameData.totalMeds++;
  addPoints(10, 'إضافة دواء جديد');
  if(gameData.totalMeds === 1) unlockBadge('first_med');
  if(gameData.totalMeds >= 100) unlockBadge('health_master'); 
  
  $('medName').value='';
  $('medTime').value='';
  $('medName').placeholder = '✅ تمت الإضافة بنجاح';
  setTimeout(()=> $('medName').placeholder='اسم الدواء', 1500);
  beep(1000,0.06);
});

$('clearMedsBtn').addEventListener('click', ()=> {
  if(confirm('مسح كل الأدوية؟')){
    meds=[];
    saveMeds();
    renderMeds();
    addLog('مسح جميع الأدوية');
    beep(600, 0.06);
  }
});

// ════════════════════════════════════════════════════════════════
// 🔔 نظام فحص الأدوية المحسّن (يمنع التكرار)
// ════════════════════════════════════════════════════════════════

// 🛡️ متغير لتتبع المنبهات التي رنّت (حماية إضافية)
let alreadyRang = {};

setInterval(checkMeds, 30*1000);

function checkMeds(){
  // 🚫 لو المنبه شغال دلوقتي، متشغلش حاجة تانية!
  if(isAlarmRinging) {
    console.log('⏸️ المنبه شغال - تم تجاهل الفحص');
    return;
  }
  
  const now = new Date();
  const currentMinute = now.getHours()*60 + now.getMinutes();
  const today = now.toISOString().slice(0,10);
  const currentHourMinute = `${now.getHours()}:${now.getMinutes()}`; // مثال: "14:30"
  
  meds.forEach((m, index)=>{
    if(!m.time) return;
    const [h,min] = m.time.split(':').map(Number);
    if(isNaN(h)) return;
    
    const targetMinute = h*60 + min;
    
    // ✅ شرط 1: الوقت مظبوط (نفس الدقيقة أو الدقيقة اللي قبلها)
    if(Math.abs(currentMinute - targetMinute) <= 1){
      
      // ✅ شرط 2: الدواء مرنش النهارده
      const lastDate = m.lastNotified ? m.lastNotified.slice(0,10) : '';
      if(lastDate === today){
        return; // ✋ رن النهارده خلاص، استنى بكره
      }
      
      // ✅ شرط 3: مرنش في الساعة والدقيقة دي (حماية إضافية)
      const alarmKey = `${m.name}-${currentHourMinute}`;
      if(alreadyRang[alarmKey]){
        return; // ✋ رن في الدقيقة دي خلاص
      }
      
      // 🎯 كل الشروط تمام - شغّل المنبه!
      console.log(`🔔 تشغيل منبه: ${m.name} في ${currentHourMinute}`);
      
      startAlarm(m.name);
      addLog(`تذكير: ${m.name}`);
      
      // 💾 احفظ التاريخ والوقت
      m.lastNotified = now.toISOString();
      saveMeds();
      
      // 🛡️ سجّل في الحماية الإضافية
      alreadyRang[alarmKey] = true;
      
      // 🧹 امسح السجل بعد 3 دقائق (عشان الذاكرة)
      setTimeout(() => {
        delete alreadyRang[alarmKey];
      }, 3 * 60 * 1000);
    }
  });
}

// ════════════════════════════════════════════════════════════════
// 🧹 تنظيف يومي للحماية الإضافية (كل يوم الساعة 12 بالليل)
// ════════════════════════════════════════════════════════════════
setInterval(() => {
  const now = new Date();
  if(now.getHours() === 0 && now.getMinutes() === 0){
    alreadyRang = {};
    console.log('🧹 تم تنظيف سجل المنبهات - يوم جديد!');
  }
}, 60 * 1000); // كل دقيقة نشيك

/* ===== Vitals ===== */
let vitals = JSON.parse(localStorage.getItem('vitals_v3') || '[]');
const vitalsList = $('vitalsLogList');

function renderVitals(){
  const vitalsList = $('vitalsLogList');
  const progressSummary = $('progressSummary');
  
  vitalsList.innerHTML = '';
  
  if(!vitals.length){
    vitalsList.innerHTML = '<li class="muted" style="list-style:none;text-align:center;padding:20px;">لا توجد قراءات مسجلة</li>';
    progressSummary.innerHTML = '<div class="muted" style="text-align:center; padding:20px;">سجل قراءات لمدة يومين على الأقل لرؤية التطور</div>';
    return;
  }
  
  vitals.sort((a,b)=> new Date(b.time) - new Date(a.time));
  
  const latest = vitals[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const oldReading = vitals.find(v => new Date(v.time) <= weekAgo);
  
  if(oldReading && vitals.length >= 2) {
    const weightChange = latest.weight && oldReading.weight 
      ? (latest.weight - oldReading.weight).toFixed(1) 
      : null;
    
    const bpChange = latest.bpSys && oldReading.bpSys
      ? latest.bpSys - oldReading.bpSys
      : null;
    
    const sugarChange = latest.sugar && oldReading.sugar
      ? latest.sugar - oldReading.sugar
      : null;
    
    let statsHTML = '<div class="stat-grid">';
    
    if(latest.weight) {
      const changeClass = !weightChange ? 'neutral' : 
                         parseFloat(weightChange) < 0 ? 'positive' : 'negative';
      const changeIcon = !weightChange ? '➖' : 
                        parseFloat(weightChange) < 0 ? '📉' : '📈';
      
      statsHTML += `
        <div class="stat-box">
          <div class="stat-icon">⚖️</div>
          <div class="stat-label">الوزن الحالي</div>
          <div class="stat-value">${latest.weight} كجم</div>
          ${weightChange ? `
            <div class="stat-change ${changeClass}">
              ${changeIcon} ${weightChange > 0 ? '+' : ''}${weightChange} كجم
            </div>
          ` : '<div class="stat-change neutral">➖ لا تغيير</div>'}
        </div>
      `;
    }
    
    if(latest.bpSys && latest.bpDia) {
      const changeClass = !bpChange ? 'neutral' : 
                         bpChange < 0 ? 'positive' : 'negative';
      const changeIcon = !bpChange ? '➖' : 
                        bpChange < 0 ? '📉' : '📈';
      
      statsHTML += `
        <div class="stat-box">
          <div class="stat-icon">🩸</div>
          <div class="stat-label">ضغط الدم</div>
          <div class="stat-value">${latest.bpSys}/${latest.bpDia}</div>
          ${bpChange ? `
            <div class="stat-change ${changeClass}">
              ${changeIcon} ${bpChange > 0 ? '+' : ''}${bpChange}
            </div>
          ` : '<div class="stat-change neutral">➖ لا تغيير</div>'}
        </div>
      `;
    }
    
    if(latest.sugar) {
      const changeClass = !sugarChange ? 'neutral' : 
                         sugarChange < 0 ? 'positive' : 'negative';
      const changeIcon = !sugarChange ? '➖' : 
                        sugarChange < 0 ? '📉' : '📈';
      
      statsHTML += `
        <div class="stat-box">
          <div class="stat-icon">🍬</div>
          <div class="stat-label">السكر</div>
          <div class="stat-value">${latest.sugar}</div>
          ${sugarChange ? `
            <div class="stat-change ${changeClass}">
              ${changeIcon} ${sugarChange > 0 ? '+' : ''}${sugarChange}
            </div>
          ` : '<div class="stat-change neutral">➖ لا تغيير</div>'}
        </div>
      `;
    }
    
    statsHTML += '</div>';
    
    let motivationMsg = '';
    let msgClass = 'success';
    
    if(weightChange) {
      const change = parseFloat(weightChange);
      if(change < -2) {
        motivationMsg = `🎉 <strong>ممتاز!</strong> خسرت ${Math.abs(change)} كجم في أسبوع! استمر على نفس النظام.`;
        msgClass = 'success';
      } else if(change < 0) {
        motivationMsg = `👍 <strong>تقدم جيد!</strong> خسرت ${Math.abs(change)} كجم. الاستمرارية هي المفتاح!`;
        msgClass = 'success';
      } else if(change === 0) {
        motivationMsg = `💪 <strong>ثبات!</strong> وزنك ثابت. حاول زيادة النشاط البدني قليلاً.`;
        msgClass = 'warning';
      } else if(change < 2) {
        motivationMsg = `⚠️ <strong>انتبه!</strong> زاد وزنك ${change} كجم. راجع نظامك الغذائي.`;
        msgClass = 'warning';
      } else {
        motivationMsg = `🚨 <strong>تحذير!</strong> زيادة ملحوظة (${change} كجم). استشر أخصائي تغذية.`;
        msgClass = 'danger';
      }
    }
    
    if(latest.bpSys) {
      if(latest.bpSys > 140 || latest.bpDia > 90) {
        motivationMsg += `<br>🩸 <strong>ضغط الدم مرتفع!</strong> (${latest.bpSys}/${latest.bpDia}) راجع طبيبك.`;
        msgClass = 'danger';
      } else if(latest.bpSys < 90 || latest.bpDia < 60) {
        motivationMsg += `<br>🩸 ضغط الدم منخفض. اشرب سوائل وراجع طبيبك لو شعرت بدوخة.`;
        msgClass = 'warning';
      }
    }
    
    if(latest.sugar) {
      if(latest.sugar > 140) {
        motivationMsg += `<br>🍬 <strong>السكر عالي!</strong> (${latest.sugar}) قلل النشويات والسكريات.`;
        msgClass = 'danger';
      } else if(latest.sugar < 70) {
        motivationMsg += `<br>🍬 السكر منخفض. تناول شيء حلو فوراً.`;
        msgClass = 'danger';
      }
    }
    
    if(motivationMsg) {
      statsHTML += `<div class="trend-message ${msgClass}">${motivationMsg}</div>`;
    }
    
    progressSummary.innerHTML = statsHTML;
    
  } else if(vitals.length >= 2) {
    progressSummary.innerHTML = `
      <div class="muted" style="text-align:center; padding:20px;">
        ✅ عندك ${vitals.length} قراءة. سجل بانتظام لمدة أسبوع لرؤية التطور الكامل!
      </div>
    `;
  }
  
  vitals.slice(0, 30).forEach((v)=>{
    const date = new Date(v.time).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const time = new Date(v.time).toLocaleTimeString('ar-EG', {
      hour:'2-digit', 
      minute:'2-digit'
    });
    
    let content = `
      <div>
        <strong>${date}</strong> 
        <span style="color:var(--muted); font-size:13px;">${time}</span>
        <br>
    `;
    
    const parts = [];
    if(v.bpSys && v.bpDia) {
      const bpStatus = v.bpSys > 140 || v.bpDia > 90 ? '🔴' : 
                       v.bpSys < 90 || v.bpDia < 60 ? '🟡' : '🟢';
      parts.push(`${bpStatus} ضغط: ${v.bpSys}/${v.bpDia}`);
    }
    if(v.sugar) {
      const sugarStatus = v.sugar > 140 ? '🔴' : v.sugar < 70 ? '🟡' : '🟢';
      parts.push(`${sugarStatus} سكر: ${v.sugar}`);
    }
    if(v.weight) {
      parts.push(`⚖️ وزن: ${v.weight} كجم`);
    }
    
    content += `<span style="font-size:14px;">${parts.join(' • ')}</span>`;
    content += '</div>';
    
    const li = document.createElement('li');
    li.innerHTML = content;
    vitalsList.appendChild(li);
  });
}

function saveVitals(){ localStorage.setItem('vitals_v3', JSON.stringify(vitals)); }

$('saveVitalsBtn').addEventListener('click', ()=>{
  const bpSys = $('bpSys').value;
  const bpDia = $('bpDia').value;
  const sugar = $('sugar').value;
  const weight = $('weight').value;
  
  if(!bpSys && !bpDia && !sugar && !weight) {
    return alert('أدخل قراءة واحدة على الأقل');
  }
  
  const entry = {
    time: new Date().toISOString(),
    bpSys: bpSys ? Number(bpSys) : null,
    bpDia: bpDia ? Number(bpDia) : null,
    sugar: sugar ? Number(sugar) : null,
    weight: weight ? Number(weight) : null
  };
  
  vitals.push(entry);
  saveVitals();
  renderVitals();
  addLog('حفظ قراءة حيوية');
  
  $('bpSys').value='';
  $('bpDia').value='';
  $('sugar').value='';
  $('weight').value='';
  
  beep(1000,0.06);
  alert('✅ تم الحفظ بنجاح');
});

$('exportVitalsBtn').addEventListener('click', ()=>{
  const data = JSON.stringify(vitals, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url;
  a.download=`Vitals_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog('تصدير القياسات');
});

/* ===== Activity Log ===== */
let activity = JSON.parse(localStorage.getItem('activity_v3') || '[]');
const activityLog = $('activityLog');

function addLog(text){ 
  const entry = {text, time: new Date().toISOString()}; 
  activity.unshift(entry); 
  if(activity.length > 500) activity.pop(); 
  localStorage.setItem('activity_v3', JSON.stringify(activity)); 
  renderActivity(); 
}

function renderActivity(){
  activityLog.innerHTML='';
  if(!activity.length){
    activityLog.innerHTML = '<li class="muted" style="list-style:none;text-align:center;padding:20px">لا يوجد نشاط</li>';
    return;
  }
  
  activity.slice(0,100).forEach(a=>{
    const li=document.createElement('li');
    const date = new Date(a.time).toLocaleDateString('ar-EG');
    const time = new Date(a.time).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
    li.innerHTML = `<div><strong>${date}</strong> <span style="color:var(--muted)">${time}</span><br>${a.text}</div>`;
    activityLog.appendChild(li);
  });
}

$('clearHistoryBtn').addEventListener('click', ()=> {
  if(confirm('مسح السجل كاملاً؟')){
    activity=[];
    localStorage.removeItem('activity_v3');
    renderActivity();
    beep(600, 0.05);
  }
});

$('exportHistoryBtn').addEventListener('click', ()=> {
  const blob=new Blob([JSON.stringify(activity, null, 2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`Activity_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog('تصدير السجل');
});

/* ===== CALORIES ===== */
const foodDB = [
// خبز ورغيف
  {n:"رغيف عيش بلدي",k:150,t:["رغيف","عيش بلدي","خبز بلدي","bread"]},
  {n:"رغيف عيش فينو",k:85,t:["فينو","fino","رغيف فينو"]},
  {n:"رغيف عيش شامي",k:165,t:["شامي","خبز شامي","رغيف شامي"]},
  {n:"توست أبيض",k:75,t:["توست","toast","عيش توست"]},
 // ساندوتشات ووجبات
  {n:"رغيف طعمية",k:320,t:["رغيف طعمية","ساندوتش طعمية","سندوتش فلافل"]},
  {n:"رغيف فول",k:290,t:["رغيف فول","ساندوتش فول"]},
  {n:"رغيف جبنة",k:250,t:["رغيف جبنة","ساندوتش جبنة"]},
  // أساسيات مصرية
  {n:"كشري",k:760,t:["كشري","كشري","kushary","kushari"]},
  {n:"مكرونة",k:220,t:["مكرونة","معكرونة","مكرونه","pasta","macaroni"]},
  {n:"أرز",k:130,t:["رز","ارز","ريز","rice"]},
  {n:"فول مدمس",k:170,t:["فول","فول مدمس","فول","beans"]},
  {n:"طعمية",k:170,t:["طعمية","فلافل","طعميه","falafel"]},
  {n:"بيض",k:78,t:["بيضة","بيض","بيضه","egg"]},
  {n:"فراخ مشوية",k:165,t:["فراخ","فرخة","دجاج","chicken"]},
  {n:"لحم بقري",k:250,t:["لحمة","لحم","لحمه","beef","meat"]},
  {n:"سمك",k:130,t:["سمك","سمكة","سمكه","fish"]},
  {n:"خبز بلدي",k:150,t:["عيش","خبز","رغيف","bread"]},
  {n:"خبز فينو",k:85,t:["فينو","fino"]},
  {n:"محشي ورق عنب",k:85,t:["محشي","ورق عنب","dolma"]},
  {n:"ملوخية",k:60,t:["ملوخية","ملوخيه","molokhia"]},
  {n:"كفتة",k:280,t:["كفتة","كفته","kofta"]},
  {n:"شاورما",k:450,t:["شاورما","شورما","shawarma"]},
  {n:"برجر",k:520,t:["برجر","برغر","burger"]},
  {n:"بيتزا",k:285,t:["بيتزا","بتزا","pizza"]},
  {n:"بطاطس محمرة",k:312,t:["بطاطس","محمرة","فرايز","chips","fries"]},
  // بروتينات
  {n:"فول مدمس",k:170,t:["فول","فول مدمس","beans"]},
  {n:"طعمية",k:85,t:["طعمية","فلافل","falafel"]},
  {n:"بيضة مسلوقة",k:78,t:["بيضة","بيض مسلوق","egg"]},
  {n:"بيضة مقلية",k:95,t:["بيض مقلي","بيضة مقلية"]},
  {n:"فراخ مشوية",k:165,t:["فراخ","دجاج","chicken"]},
  {n:"لحمة بقري",k:250,t:["لحمة","لحم","beef"]},
  {n:"كفتة",k:280,t:["كفتة","kofta"]},
  {n:"سمك مشوي",k:130,t:["سمك","fish"]},
  {n:"شاورما فراخ",k:450,t:["شاورما","شورما","shawarma"]},
  // وجبات سريعة
  {n:"برجر",k:520,t:["برجر","برغر","burger"]},
  {n:"بيتزا شريحة",k:285,t:["بيتزا","بتزا","pizza"]},
  {n:"بطاطس محمرة",k:312,t:["بطاطس","محمرة","chips","fries"]},
  
  // فواكه
 {n:"تفاحة",k:95,t:["تفاح","تفاحة","apple"]},
  {n:"موزة",k:105,t:["موز","موزة","banana"]},
  {n:"برتقانة",k:62,t:["برتقان","برتقالة","orange"]},
  {n:"مانجو",k:99,t:["مانجو","مانجا","mango"]},
  {n:"عنب",k:69,t:["عنب","grape"]},
  {n:"فراولة",k:33,t:["فراولة","strawberry"]},
  {n:"بطيخ",k:30,t:["بطيخ","watermelon"]},
  {n:"كمثرى",k:57,t:["كمثرى","إجاص","pear"]},
  {n:"خوخ",k:39,t:["خوخ","peach"]},
  {n:"مشمش",k:17,t:["مشمش","apricot"]},
  {n:"يوسفي",k:47,t:["يوسفي","mandarin"]},
  {n:"جوافة",k:68,t:["جوافة","guava"]},
  {n:"رمان",k:83,t:["رمان","pomegranate"]},
  {n:"كيوي",k:42,t:["كيوي","kiwi"]},
  {n:"بلح",k:20,t:["بلح","تمر","dates"]},
  // خضروات
  {n:"سلطة خضراء",k:35,t:["سلطة","salad"]},
  {n:"طماطم",k:22,t:["طماطم","طماطة","قوطة","tomato"]},
  {n:"خيار",k:16,t:["خيار","cucumber"]},
  {n:"جزر",k:41,t:["جزر","carrot"]},
  {n:"خس",k:14,t:["خس","lettuce"]},
  {n:"فلفل",k:31,t:["فلفل","pepper"]},
  {n:"بطاطس",k:87,t:["بطاطس","potato"]},
  {n:"كوسة",k:17,t:["كوسة","zucchini"]},
  {n:"باذنجان",k:25,t:["باذنجان","بتنجان","eggplant"]},
  {n:"بروكلي",k:34,t:["بروكلي","broccoli"]},
  // مشروبات ساخنة
  {n:"شاي",k:2,t:["شاي","tea"]},
  {n:"شاي بسكر",k:18,t:["شاي بسكر","شاي محلى"]},
  {n:"شاي بحليب",k:35,t:["شاي حليب","شاي باللبن"]},
  {n:"قهوة",k:2,t:["قهوة","coffee"]},
  {n:"قهوة بحليب",k:38,t:["قهوة حليب","كوفي لاتيه"]},
  {n:"نسكافيه",k:55,t:["نسكافيه","nescafe"]},
  {n:"كابتشينو",k:80,t:["كابتشينو","cappuccino"]},
  {n:"كاكاو",k:110,t:["كاكاو","شوكولاتة ساخنة","cocoa"]},
  // مشروبات باردة
  {n:"ماء",k:0,t:["ماء","مية","water"]},
  {n:"كوب عصير برتقان",k:112,t:["عصير برتقان","عصير برتقال","orange juice"]},
  {n:"كوب عصير تفاح",k:114,t:["عصير تفاح","apple juice"]},
  {n:"كوب عصير مانجو",k:128,t:["عصير مانجو","mango juice"]},
  {n:"كوب عصير جوافة",k:94,t:["عصير جوافة"]},
  {n:"كوب عصير قصب",k:180,t:["عصير قصب","قصب"]},
  {n:"كوب عصير ليمون",k:60,t:["عصير ليمون","ليموناضة","lemonade"]},
  {n:"كوكاكولا",k:140,t:["كوكا","كولا","pepsi","cola","بيبسي"]},
  {n:"سفن اب",k:140,t:["سفن اب","seven up","sprite"]},
  {n:"ميراندا",k:145,t:["ميراندا","miranda"]},
  {n:"حليب كامل الدسم",k:150,t:["لبن","حليب","milk"]},
  {n:"حليب منزوع الدسم",k:83,t:["لبن خالي","حليب خالي"]},
  {n:"زبادي",k:59,t:["زبادي","يوغرت","yogurt"]},
   // حلويات
  {n:"كنافة",k:350,t:["كنافة","kunafa"]},
  {n:"بسبوسة",k:320,t:["بسبوسة","basbousa"]},
  {n:"بقلاوة",k:330,t:["بقلاوة","baklava"]},
  {n:"شوكولاتة",k:235,t:["شوكولاتة","chocolate"]},
  {n:"آيس كريم",k:207,t:["ايس كريم","جيلاتي","ice cream"]},
  {n:"كيك",k:257,t:["كيك","كيكة","cake"]},
  {n:"دونات",k:290,t:["دونات","دوناتس","donut"]},
  // وجبات سريعة إضافية
  {n:"دجاج مقرمش",k:480,t:["دجاج كرسبي","crispy chicken"]},
  {n:"تشيكن ناجتس",k:280,t:["ناجتس","nuggets"]},
  {n:"هوت دوج",k:290,t:["هوت دوج","hot dog"]},
  {n:"ساندوتش سمك",k:380,t:["فيش برجر","fish sandwich"]},
  {n:"تاكو",k:210,t:["تاكو","taco"]},
  {n:"بوريتو",k:510,t:["بوريتو","burrito"]},
  {n:"ناتشوز",k:346,t:["ناتشوز","nachos"]},
// عصائر إضافية
  {n:"عصير فراولة",k:90,t:["عصير فراوله","strawberry juice"]},
  {n:"عصير كوكتيل",k:110,t:["كوكتيل","عصير مشكل"]},
  {n:"عصير موز باللبن",k:190,t:["موز بلبن","banana milk"]},
  {n:"عصير أفوكادو",k:234,t:["عصير افوكادو","avocado juice"]},
  {n:"سموزي",k:150,t:["سموزي","smoothie"]},
  {n:"ميلك شيك فانيليا",k:350,t:["ميلك شيك","milkshake"]},
  {n:"ميلك شيك شوكولاتة",k:390,t:["شيك شوكولاته"]},
  {n:"فرابتشينو",k:240,t:["فرابتشينو","frappuccino"]},
  // مشروبات ساخنة إضافية
  {n:"قهوة تركي",k:5,t:["قهوة تركية","turkish coffee"]},
  {n:"شاي أخضر",k:2,t:["شاي اخضر","green tea"]},
  {n:"شاي أحمر",k:2,t:["شاي احمر","black tea"]},
  {n:"ينسون",k:12,t:["ينسون","يانسون","anise"]},
  {n:"كركديه",k:15,t:["كركديه","كركدية","hibiscus"]},
  {n:"قرفة",k:19,t:["قرفة","cinnamon"]},
  {n:"حلبة",k:36,t:["حلبة","حلبه","fenugreek"]},
  {n:"زنجبيل",k:20,t:["زنجبيل","ginger"]},
  // حلويات عالمية إضافية
  {n:"براونيز",k:466,t:["براونيز","brownies"]},
  {n:"كوكيز",k:140,t:["كوكيز","cookies","بسكويت"]},
  {n:"مافن",k:290,t:["مافن","muffin"]},
  {n:"كب كيك",k:305,t:["كب كيك","cupcake"]},
  {n:"تيراميسو",k:240,t:["تيراميسو","tiramisu"]},
  {n:"بان كيك",k:227,t:["بان كيك","pancake"]},
  {n:"وافل",k:291,t:["وافل","waffle"]},
  {n:"كريب",k:112,t:["كريب","crepe"]},
  {n:"فطيرة تفاح",k:237,t:["فطيرة تفاح","apple pie"]},
  // مقبلات إضافية
  {n:"جبنة حلومي مشوية",k:280,t:["حلومي","halloumi"]},
  {n:"بطاطا ودجز",k:240,t:["ودجز","wedges","بطاطا ودجز"]},
  {n:"أصابع موزاريلا",k:280,t:["موزاريلا ستيكس","mozzarella sticks"]},
  {n:"بصل مقلي حلقات",k:310,t:["onion rings","حلقات بصل"]},
  {n:"كول سلو",k:150,t:["كول سلو","coleslaw"]},
   // أكلات آسيوية
  {n:"سوشي",k:140,t:["سوشي","sushi"]},
  {n:"رامن",k:380,t:["رامن","ramen","نودلز"]},
  {n:"تشاو مين",k:400,t:["تشاو مين","chow mein"]},
  {n:"دجاج كونغ باو",k:360,t:["كونج باو","kung pao"]},
  {n:"كاري دجاج",k:340,t:["كاري","curry"]},
  {n:"بيض مقلي",k:95,t:["بيضة مقليه","fried egg"]},
   // مكسرات
  {n:"لوز",k:164,t:["لوز","almond"]},
  {n:"فستق",k:159,t:["فستق","pistachio"]},
  {n:"كاجو",k:157,t:["كاجو","cashew"]},
  {n:"فول سوداني",k:161,t:["فول سوداني","peanut"]},
  {n:"جوز",k:185,t:["جوز","عين جمل","walnut"]},
  {n:"بندق",k:178,t:["بندق","hazelnut"]},
  {n:"سوداني محمص",k:166,t:["سوداني","فستق سوداني"]},
  
  // معجنات وحلويات مصرية
  {n:"فطير مشلتت",k:450,t:["فطير","مشلتت","فطير مشلتت"]},
  {n:"سمبوسك",k:180,t:["سمبوسك","سمبوسة","sambousek"]},
  {n:"غريبة",k:120,t:["غريبة","كعك غريبة"]},
  {n:"بيتي فور",k:95,t:["بيتي فور","petit four"]},
  {n:"لقمة القاضي",k:75,t:["لقمة القاضي","عوامة","لقيمات"]},
  {n:"زلابية",k:280,t:["زلابية","مشبك"]},
  {n:"أم علي",k:380,t:["ام علي","om ali"]},
  {n:"مهلبية",k:150,t:["مهلبية","مهلبيه"]},
  {n:"أرز بلبن",k:160,t:["رز بلبن","ارز باللبن","rice pudding"]},
  {n:"بودينج",k:140,t:["بودينج","بودنج","pudding"]},
  {n:"جيلي",k:80,t:["جيلي","جيلاتين","jelly"]},
  {n:"كريم كراميل",k:200,t:["كريم كراميل","creme caramel"]},
  {n:"تشيز كيك",k:320,t:["تشيز كيك","cheesecake"]},
  
  // أكلات مصرية شعبية
  {n:"فول بالزيت",k:220,t:["فول بزيت","فول مصري"]},
  {n:"فلافل ساندوتش",k:320,t:["فلافل ساندوتش","ساندوتش فلافل"]},
  {n:"كباب",k:310,t:["كباب","لحم مشوي","kebab"]},
  {n:"حواوشي",k:380,t:["حواوشي","hawawshi"]},
  {n:"فتة",k:420,t:["فتة","فته"]},
  {n:"مسقعة",k:180,t:["مسقعة","مساقعة"]},
  {n:"بامية",k:95,t:["بامية","بامياه"]},
  {n:"فاصوليا",k:110,t:["فاصوليا","فاصوليه","لوبيا"]},
  {n:"كوارع",k:290,t:["كوارع","ممبار"]},
  {n:"ممبار",k:340,t:["ممبار","mombar"]},
  {n:"كبدة اسكندراني",k:260,t:["كبدة","كبده","liver"]},
  {n:"شكشوكة",k:190,t:["شكشوكة","شكشوكه","بيض بالطماطم"]},
  
  // أرز ومكرونات
  {n:"أرز أبيض مطبوخ",k:130,t:["رز ابيض","ارز مطبوخ"]},
  {n:"أرز بسمتي",k:120,t:["رز بسمتي","basmati"]},
  {n:"مكرونة بالصلصة",k:280,t:["مكرونة صلصة","باستا"]},
  {n:"مكرونة بالبشاميل",k:350,t:["مكرونة بشاميل","مكرونه فرن"]},
  {n:"لازانيا",k:380,t:["لازانيا","lasagna"]},
  {n:"سباغيتي بولونيز",k:320,t:["سباجيتي","spaghetti"]},
  
  // شوربات
  {n:"شوربة عدس",k:116,t:["شوربة عدس","شوربه عدس","lentil soup"]},
  {n:"شوربة خضار",k:67,t:["شوربة خضار","vegetable soup"]},
  {n:"شوربة فراخ",k:86,t:["شوربة فراخ","chicken soup"]},
  {n:"شوربة لحم",k:125,t:["شوربة لحم","beef soup"]},
  {n:"شوربة طماطم",k:74,t:["شوربة طماطم","tomato soup"]},
  {n:"شوربة مشروم",k:95,t:["شوربة مشروم","mushroom soup"]},
  
  // أكلات خليجية
  {n:"كبسة",k:450,t:["كبسة","كبسه","kabsa"]},
  {n:"مندي",k:480,t:["مندي","mandi"]},
  {n:"مظبي",k:460,t:["مظبي","madhbi"]},
  {n:"مرقوق",k:380,t:["مرقوق","markouk"]},
  {n:"جريش",k:220,t:["جريش","jareesh"]},
  {n:"هريس",k:190,t:["هريس","harees"]},
  {n:"لقيمات",k:75,t:["لقيمات","luqaimat"]},
  {n:"بلاليط",k:340,t:["بلاليط","balaleet"]},
  
  // أكلات شامية
  {n:"كبة",k:280,t:["كبة","kibbeh"]},
  {n:"محاشي",k:220,t:["محاشي","محشي","dolma"]},
  {n:"ورق عنب محشي",k:85,t:["ورق عنب","محشي ورق عنب"]},
  {n:"كبة نية",k:310,t:["كبة نيه","كبه نيه"]},
  {n:"فتوش",k:120,t:["فتوش","فتوشة","fattoush"]},
  {n:"تبولة",k:90,t:["تبولة","تبوله","tabbouleh"]},
  {n:"حمص",k:166,t:["حمص","حمص بطحينة","hummus"]},
  {n:"متبل",k:110,t:["متبل","بابا غنوج","muttabal"]},
  {n:"فلافل",k:85,t:["فلافل سوري","فلافل شامي"]},
  {n:"شاورما لحم",k:480,t:["شاورما لحمة","beef shawarma"]},
  {n:"منسف",k:520,t:["منسف","mansaf"]},
  
  // أكلات تركية ويونانية
  {n:"شيش طاووق",k:310,t:["شيش طاووق","shish tawook"]},
  {n:"دونر كباب",k:450,t:["دونر","doner","دونر كباب"]},
  {n:"سمبوسة",k:180,t:["سمبوسه لحم","سمبوسة جبن"]},
  {n:"يالانجي",k:95,t:["يالانجي","ورق عنب بارد"]},
  // وجبات صحية
  {n:"سلطة يونانية",k:110,t:["سلطة يونانيه","greek salad"]},
  {n:"سلطة سيزر",k:180,t:["سلطة سيزر","caesar salad"]},
  {n:"سلطة تونة",k:190,t:["سلطة تونه","tuna salad"]},
  {n:"كينوا مطبوخة",k:120,t:["كينوا","quinoa"]},
  {n:"أفوكادو توست",k:250,t:["افوكادو توست","avocado toast"]},
  {n:"بيض مسلوق",k:78,t:["بيضة مسلوقه","boiled egg"]},
  {n:"صدر دجاج مشوي",k:165,t:["صدر فراخ","grilled chicken breast"]},
  {n:"سلمون مشوي",k:206,t:["سلمون","salmon"]},
  {n:"تونة معلبة",k:116,t:["تونه","canned tuna"]},
  {n:"جمبري مشوي",k:99,t:["جمبري","قريدس","shrimp"]},
  // ════════ 🍗 فراخ بطرق طبخ مختلفة ════════
  {n:"فراخ بانيه مقلية",k:320,t:["فراخ بانيه","بانيه مقلي","دجاج بانيه مقلي"]},
  {n:"فراخ بانيه إير فراير",k:220,t:["بانيه اير فراير","بانيه صحي","air fryer chicken"]},
  {n:"فراخ بانيه فرن",k:250,t:["بانيه فرن","بانيه مشوي"]},
  {n:"فراخ مشوية بالفرن",k:165,t:["فراخ فرن","دجاج فرن مشوي"]},
  {n:"فراخ مشوية على الفحم",k:185,t:["فراخ فحم","دجاج مشوي فحم","bbq chicken"]},
  {n:"فراخ بالكاري",k:280,t:["فراخ كاري","دجاج كاري","chicken curry"]},
  {n:"فراخ بالزبدة (هندي)",k:350,t:["فراخ زبدة","butter chicken","دجاج بالزبدة"]},
  {n:"فراخ تكا مسالا",k:320,t:["تكا مسالا","tikka masala","دجاج تكا"]},
  {n:"فراخ ستروجانوف",k:290,t:["ستروجانوف","stroganoff","دجاج ستروجانوف"]},
  {n:"فراخ تندوري",k:230,t:["تندوري","tandoori","دجاج تندوري"]},
  {n:"فراخ بروستد",k:380,t:["بروستد","broasted","دجاج بروستد"]},
  {n:"فراخ كنتاكي",k:400,t:["كنتاكي","kfc","دجاج كنتاكي"]},
  {n:"فراخ مقرمشة كورية",k:420,t:["فراخ كورية","korean fried chicken","دجاج كوري"]},
  {n:"فراخ بالبرتقال (صيني)",k:340,t:["فراخ برتقال","orange chicken","دجاج برتقال"]},
  {n:"فراخ حلو حار",k:360,t:["sweet chili chicken","فراخ حلو وحار"]},
  {n:"فراخ بالعسل والخردل",k:310,t:["honey mustard chicken","فراخ عسل"]},
  {n:"فراخ بالباربكيو",k:290,t:["فراخ باربكيو","bbq chicken","دجاج شواء"]},
  {n:"فراخ بالليمون والثوم",k:210,t:["فراخ ليمون","lemon garlic chicken"]},
  {n:"فراخ سويت أند ساور",k:350,t:["sweet and sour chicken","حلو وحامض"]},
  {n:"فراخ تيرياكي",k:280,t:["تيرياكي","teriyaki chicken","دجاج ترياكي"]},
  {n:"فراخ بالفلفل الأسود",k:240,t:["black pepper chicken","فراخ فلفل اسود"]},
  {n:"فراخ كاجو (صيني)",k:380,t:["فراخ كاجو","cashew chicken"]},
  {n:"فراخ كونغ باو (صيني)",k:360,t:["كونغ باو فراخ","kung pao"]},
  {n:"فراخ جنرال تاو",k:385,t:["جنرال تاو","general tso","دجاج جنرال"]},
  {n:"فراخ سيسلر",k:340,t:["سيسلر","sizzler","دجاج سيسلر"]},
  {n:"فراخ بالكريمة والمشروم",k:320,t:["فراخ كريمة","creamy mushroom chicken"]},
  {n:"فراخ بالجبنة (فرن)",k:380,t:["فراخ جبنة","cheesy chicken"]},
  {n:"فراخ محشية أرز",k:420,t:["فراخ محشيه","stuffed chicken"]},
  {n:"فراخ رول مقلي",k:310,t:["فراخ رول","chicken roll","رولات فراخ"]},
  {n:"فراخ رول إير فراير",k:240,t:["رول اير فراير","healthy chicken roll"]},
  {n:"أجنحة فراخ مقرمشة",k:290,t:["اجنحة فراخ","wings","chicken wings"]},
  {n:"أجنحة بافلو",k:320,t:["بافلو وينجز","buffalo wings","اجنحة بافلو"]},
  {n:"بوب كورن تشيكن",k:350,t:["بوب كورن","popcorn chicken"]},
  {n:"تندر فراخ مقلي",k:340,t:["تندر","chicken tenders","strips"]},
  {n:"تندر فراخ إير فراير",k:250,t:["تندر صحي","air fryer tenders"]},
  
  // ════════ 🥩 لحوم بطرق مختلفة ════════
  {n:"لحم بقري مشوي",k:250,t:["لحم مشوي","grilled beef","لحمة مشوية"]},
  {n:"لحم بالفرن",k:280,t:["لحم فرن","roast beef"]},
  {n:"لحم ستيك مشوي",k:271,t:["ستيك","steak","شريحة لحم"]},
  {n:"لحم ريب آي",k:310,t:["ريب اي","ribeye","ريب"]},
  {n:"لحم فيليه",k:227,t:["فيليه","filet mignon","لحم فيليه"]},
  {n:"لحم سرلوين",k:243,t:["سيرلوين","sirloin"]},
  {n:"لحم تي بون",k:294,t:["تي بون","t-bone"]},
  {n:"برجر لحم مشوي",k:295,t:["برجر مشوي","grilled burger","همبرجر صحي"]},
  {n:"برجر لحم مقلي",k:520,t:["برجر مقلي","fried burger"]},
  {n:"لحم بالبصل والفلفل",k:290,t:["لحم بصل","beef and peppers"]},
  {n:"لحم مونجولي",k:380,t:["مونجولي بيف","mongolian beef"]},
  {n:"لحم بروكلي (صيني)",k:310,t:["beef broccoli","لحم بروكلي"]},
  {n:"لحم بالفلفل الأسود",k:320,t:["black pepper beef","لحم فلفل"]},
  {n:"لحم ستروجانوف",k:340,t:["beef stroganoff","ستروجانوف لحم"]},
  {n:"لحم بالكاري",k:360,t:["beef curry","كاري لحم"]},
  {n:"لحم ساتيه",k:280,t:["ساتيه","satay","سيخ لحم"]},
  {n:"لحم تاكو",k:240,t:["beef taco","تاكو لحم"]},
  {n:"كفتة مشوية",k:280,t:["كفتة مشويه","grilled kofta"]},
  {n:"كفتة بالفرن",k:260,t:["كفتة فرن","baked kofta"]},
  {n:"كفتة مقلية",k:340,t:["كفتة مقليه","fried kofta"]},
  {n:"كفتة بالطحينة",k:320,t:["كفتة طحينة","kofta with tahini"]},
  {n:"كبدة مقلية",k:260,t:["كبدة مقليه","fried liver"]},
  {n:"كبدة بالبصل",k:240,t:["كبدة بصل","liver with onions"]},
  
  // ════════ 🐟 أسماك بأنواع وطرق طبخ ════════
  {n:"سمك بلطي مقلي",k:220,t:["بلطي مقلي","fried tilapia","بلطي"]},
  {n:"سمك بلطي مشوي",k:130,t:["بلطي مشوي","grilled tilapia"]},
  {n:"سمك بلطي بالفرن",k:150,t:["بلطي فرن","baked tilapia"]},
  {n:"سمك بوري مشوي",k:180,t:["بوري","بوري مشوي","mullet"]},
  {n:"سمك دنيس مشوي",k:145,t:["دنيس","sea bream","دينيس"]},
  {n:"سمك قاروص مشوي",k:155,t:["قاروص","sea bass","لوت"]},
  {n:"سمك مرجان مشوي",k:135,t:["مرجان","red snapper"]},
  {n:"سمك سلمون مشوي",k:206,t:["سلمون مشوي","grilled salmon"]},
  {n:"سمك سلمون بالفرن",k:240,t:["سلمون فرن","baked salmon"]},
  {n:"سمك سلمون مدخن",k:117,t:["سلمون مدخن","smoked salmon"]},
  {n:"سمك تونة طازجة مشوية",k:130,t:["تونة طازجة","tuna steak"]},
  {n:"سمك فيليه مقلي",k:280,t:["فيليه سمك مقلي","fried fish fillet"]},
  {n:"سمك فيليه إير فراير",k:180,t:["فيليه اير فراير","air fryer fish"]},
  {n:"سمك بالزبدة والليمون",k:220,t:["سمك زبدة","lemon butter fish"]},
  {n:"سمك بالكاري",k:250,t:["fish curry","كاري سمك"]},
  {n:"سمك صيادية",k:320,t:["صيادية","صياديه","sayadieh"]},
  {n:"سمك بالطحينة",k:280,t:["سمك طحينة","fish tahini"]},
  {n:"سمك مشوي بالفرن بالخضار",k:210,t:["سمك خضار فرن"]},
  {n:"سمك ماكريل مشوي",k:190,t:["ماكريل","mackerel"]},
  {n:"سمك هامور مشوي",k:110,t:["هامور","hamour","grouper"]},
  {n:"سمك سبيط مقلي",k:260,t:["سبيط","calamari","كاليماري"]},
  {n:"سمك سبيط مشوي",k:175,t:["سبيط مشوي","grilled squid"]},
  {n:"جمبري مقلي",k:240,t:["جمبري مقلي","fried shrimp"]},
  {n:"جمبري بالثوم والزبدة",k:210,t:["جمبري ثوم","garlic butter shrimp"]},
  {n:"جمبري بالكاري",k:230,t:["shrimp curry","كاري جمبري"]},
  {n:"جمبري كرسبي",k:310,t:["جمبري مقرمش","crispy shrimp"]},
  {n:"كابوريا مسلوقة",k:97,t:["كابوريا","سلطعون","crab"]},
  {n:"استاكوزا مشوية",k:127,t:["استاكوزا","لوبستر","lobster"]},
  {n:"بلح بحر مطبوخ",k:172,t:["بلح البحر","mussels"]},
  {n:"محار",k:69,t:["محار","oysters"]},
  {n:"فيش آند تشيبس",k:480,t:["fish and chips","سمك بطاطس"]},
  {n:"شوربة سي فود",k:140,t:["شوربة سي فود","seafood soup"]},
  {n:"باييلا سي فود",k:380,t:["بايلا","paella","ارز سي فود"]},
  {n:"سوشي سلمون",k:145,t:["سوشي سلمون","salmon sushi"]},
  {n:"سوشي تونة",k:140,t:["سوشي تونة","tuna sushi"]},
  {n:"ساشيمي",k:100,t:["ساشيمي","sashimi","سمك نيء"]},
  
  // ════════ 🍖 لحم ضاني وماعز ════════
  {n:"لحم ضاني مشوي",k:294,t:["لحم ضاني","لحم خروف","lamb"]},
  {n:"ريش ضاني مشوية",k:360,t:["ريش ضاني","lamb chops","ريش خروف"]},
  {n:"لحم ضاني بالفرن",k:320,t:["ضاني فرن","roasted lamb"]},
  {n:"شاورما ضاني",k:350,t:["شاورما لحم ضاني"]},
  {n:"لحم ماعز مطبوخ",k:270,t:["لحم ماعز","goat meat"]},
  {n:"كبسة لحم ضاني",k:480,t:["كبسة ضاني","lamb kabsa"]},
  {n:"مندي لحم ضاني",k:510,t:["مندي ضاني","lamb mandi"]},
  {n:"مرقة لحم ضاني",k:340,t:["مرقة ضاني","lamb stew"]},
  
  // ════════ 🦃 ديك رومي وحمام ════════
  {n:"ديك رومي مشوي",k:189,t:["ديك رومي","تركي","turkey"]},
  {n:"صدر ديك رومي",k:135,t:["صدر تركي","turkey breast"]},
  {n:"برجر ديك رومي",k:200,t:["برجر تركي","turkey burger"]},
  {n:"حمام محشي",k:240,t:["حمام","حمام محشي","stuffed pigeon"]},
  {n:"حمام مشوي",k:210,t:["حمام مشوي","grilled pigeon"]},
  {n:"فري (سمان) محشي",k:180,t:["فري","سمان","quail"]},
  
  // ════════ 🥚 بيض بطرق إبداعية ════════
  {n:"بيض عيون مقلي",k:90,t:["بيض عيون","sunny side up"]},
  {n:"بيض مخفوق",k:140,t:["بيض مخفوق","scrambled eggs"]},
  {n:"أومليت سادة",k:154,t:["اومليت","omelet","عجة"]},
  {n:"أومليت بالجبنة",k:220,t:["اومليت جبنة","cheese omelet"]},
  {n:"أومليت بالخضار",k:180,t:["اومليت خضار","veggie omelet"]},
  {n:"أومليت سبانخ",k:190,t:["اومليت سبانخ","spinach omelet"]},
  {n:"بيض بندكت",k:312,t:["بيض بندكت","eggs benedict"]},
  {n:"فريتاتا",k:210,t:["فريتاتا","frittata"]},
  {n:"بيض بوتشد",k:140,t:["بيض بوتشد","poached eggs"]},
  {n:"بيض بالطماطم (شكشوكة)",k:190,t:["شكشوكه","shakshuka"]},
  {n:"بيض بالسجق",k:280,t:["بيض سجق","eggs and sausage"]},
  {n:"بيض بالبسطرمة",k:240,t:["بيض بسطرمة","eggs and pastrami"]},
  {n:"بيض بالجبنة الفيتا",k:200,t:["بيض فيتا","eggs with feta"]},
  {n:"بيض ديفيلد",k:130,t:["deviled eggs","بيض محشي"]},
  {n:"كيش",k:320,t:["كيش","quiche","فطيرة بيض"]},
  
  // ════════ 🍕 بيتزا بأنواعها ════════
  {n:"بيتزا مارجريتا",k:250,t:["مارجريتا","margherita"]},
  {n:"بيتزا بيبروني",k:298,t:["بيبروني","pepperoni"]},
  {n:"بيتزا دجاج باربكيو",k:310,t:["بيتزا bbq","bbq chicken pizza"]},
  {n:"بيتزا سي فود",k:280,t:["بيتزا سي فود","seafood pizza"]},
  {n:"بيتزا خضار",k:235,t:["بيتزا خضروات","veggie pizza"]},
  {n:"بيتزا لحم",k:315,t:["بيتزا لحمة","meat pizza"]},
  {n:"بيتزا أربع أجبان",k:340,t:["four cheese pizza","بيتزا جبن"]},
  {n:"بيتزا هاواي",k:265,t:["هاواي","hawaiian pizza","اناناس"]},
  {n:"بيتزا كالزوني",k:380,t:["كالزوني","calzone"]},
  
  // ════════ 🌮 أكلات مكسيكية ════════
  {n:"بوريتو دجاج",k:480,t:["بوريتو فراخ","chicken burrito"]},
  {n:"بوريتو لحم",k:540,t:["بوريتو لحمة","beef burrito"]},
  {n:"كيساديلا دجاج",k:380,t:["كيساديلا","quesadilla"]},
  {n:"إنتشيلادا",k:320,t:["انتشيلادا","enchilada"]},
  {n:"فاهيتا دجاج",k:290,t:["فاهيتا فراخ","chicken fajitas"]},
  {n:"فاهيتا لحم",k:330,t:["فاهيتا لحم","beef fajitas"]},
  {n:"جواكامولي",k:160,t:["جواكامولي","guacamole"]},
  {n:"سالسا",k:36,t:["سالسا","salsa"]},
  {n:"تشيميتشانجا",k:520,t:["تشيميتشانجا","chimichanga"]},
  
  // ════════ 🍝 باستا بأنواع مختلفة ════════
  {n:"باستا ألفريدو",k:520,t:["الفريدو","alfredo","فيتوتشيني"]},
  {n:"باستا كاربونارا",k:540,t:["كاربونارا","carbonara"]},
  {n:"باستا أرابياتا",k:350,t:["ارابياتا","arrabiata","حارة"]},
  {n:"باستا بيستو",k:380,t:["بيستو","pesto"]},
  {n:"باستا سي فود",k:420,t:["باستا سي فود","seafood pasta"]},
  {n:"باستا بولونيز",k:320,t:["بولونيز","bolognese"]},
  {n:"باستا بالجبنة",k:450,t:["mac and cheese","ماك اند تشيز"]},
  {n:"باستا بالطماطم",k:280,t:["باستا طماطم","marinara"]},
  {n:"باستا بريمافيرا",k:320,t:["بريمافيرا","primavera","خضار"]},
  {n:"لازانيا باللحم",k:380,t:["لازانيا لحم","meat lasagna"]},
  {n:"لازانيا بالخضار",k:310,t:["لازانيا خضار","veggie lasagna"]},
  {n:"رافيولي",k:340,t:["رافيولي","ravioli"]},
  {n:"تورتيليني",k:360,t:["تورتيليني","tortellini"]},
  
  // ════════ 🥘 أطباق عالمية متنوعة ════════
  {n:"برياني دجاج",k:420,t:["برياني فراخ","chicken biryani"]},
  {n:"برياني لحم",k:480,t:["برياني لحم","beef biryani"]},
  {n:"كوردون بلو",k:440,t:["كوردون بلو","cordon bleu"]},
  {n:"ويلينجتون بيف",k:520,t:["ويلينجتون","beef wellington"]},
  {n:"ريزوتو",k:180,t:["ريزوتو","risotto"]},
  {n:"باييلا دجاج",k:360,t:["بايلا دجاج","chicken paella"]},
  {n:"كسكسي",k:190,t:["كسكسي","كسكس","couscous"]},
  {n:"تاجين مغربي",k:340,t:["تاجين","tagine"]},
  {n:"مسخن",k:420,t:["مسخن","musakhan"]},
  {n:"مجدرة",k:220,t:["مجدرة","mjadra"]},
  {n:"كبة لبنية",k:280,t:["كبة لبنيه","kibbeh labaniyeh"]},
  {n:"فته حمص",k:380,t:["فتة حمص","fatteh"]},
  {n:"مناقيش زعتر",k:280,t:["مناقيش","manakeesh","زعتر"]},
  {n:"لحم بعجين",k:320,t:["لحم بعجين","meat pie"]},
  {n:"صفيحة لحم",k:310,t:["صفيحة","sfiha"]},
  
  // ════════ 🍟 أطباق جانبية متنوعة ════════
  {n:"بطاطس مسلوقة",k:87,t:["بطاطس مسلوقه","boiled potato"]},
  {n:"بطاطس مهروسة",k:113,t:["بطاطس مهروسه","mashed potato","بوريه"]},
  {n:"بطاطس بالفرن",k:93,t:["بطاطس فرن","baked potato"]},
  {n:"بطاطس ودجز فرن",k:180,t:["ودجز فرن","baked wedges"]},
  {n:"حلقات بصل مقرمشة",k:310,t:["onion rings","حلقات بصل"]},
  {n:"فاصوليا خضراء بالزيت",k:90,t:["فاصوليا خضرا","green beans"]},
  {n:"بازلاء بالجزر",k:80,t:["بازلاء جزر","peas and carrots"]},
  {n:"ذرة مسلوقة",k:96,t:["ذرة","corn","ذره"]},
  {n:"أرز بالخلطة",k:210,t:["رز بخلطة","seasoned rice"]},
  {n:"أرز بالزعفران",k:180,t:["رز زعفران","saffron rice"]},
  {n:"أرز بالمكسرات",k:250,t:["رز مكسرات","rice with nuts"]},
  {n:"كينوا بالخضار",k:170,t:["كينوا خضار","quinoa with veggies"]},
  {n:"برغل مطبوخ",k:83,t:["برغل","bulgur"]},
  {n:"حمص بالطحينة",k:166,t:["حمص","hummus"]},
  {n:"متبل باذنجان",k:110,t:["متبل","baba ghanoush"]},
  {n:"لبنة بالثوم",k:95,t:["لبنه ثوم","labneh with garlic"]},
  {n:"زيتون",k:115,t:["زيتون","olives"]},
  {n:"مخلل مشكل",k:11,t:["مخلل","pickles"]},
  {n:"جرجير",k:5,t:["جرجير","arugula","rocket"]},
  {n:"خيار بالزبادي",k:47,t:["خيار زبادي","cucumber yogurt","تزاتزيكي"]},
  
  // ════════ 🍰 حلويات إضافية إبداعية ════════
  {n:"تشورو",k:312,t:["تشورو","churros"]},
  {n:"كريب نوتيلا",k:380,t:["كريب نوتيلا","nutella crepe"]},
  {n:"وافل بالآيس كريم",k:450,t:["وافل ايس كريم","waffle ice cream"]},
  {n:"بان كيك بالعسل",k:280,t:["بان كيك عسل","honey pancakes"]},
  {n:"فرينش توست",k:250,t:["فرينش توست","french toast"]},
  {n:"سينابون",k:880,t:["سينابون","cinnabon"]},
  {n:"دونات جيلي",k:310,t:["دونات جيلي","jelly donut"]},
  {n:"دونات شوكولاتة",k:340,t:["دونات شوكولاته","chocolate donut"]},
  {n:"كروسان سادة",k:231,t:["كروسان","croissant"]},
  {n:"كروسان بالجبنة",k:280,t:["كروسان جبنة","cheese croissant"]},
  {n:"كروسان بالشوكولاتة",k:320,t:["كروسان شوكولاته","chocolate croissant"]},
  {n:"ماكرون",k:90,t:["ماكرون","macarons"]},
  {n:"إكلير",k:262,t:["ايكلير","eclair"]},
  {n:"بروفيترول",k:180,t:["بروفيترول","profiterole"]},
  {n:"ميل فاي",k:340,t:["ميل فاي","mille-feuille"]},
  {n:"تارت فواكه",k:220,t:["تارت","fruit tart"]},
  {n:"موس شوكولاتة",k:310,t:["موس","chocolate mousse"]},
  // ألبان وجبن
  {n:"جبنة بيضاء",k:100,t:["جبنة","جبنه","cheese"]},
  {n:"جبنة شيدر",k:113,t:["شيدر","cheddar"]},
  {n:"جبنة موتزاريلا",k:85,t:["موتزاريلا","mozzarella"]},
  {n:"جبنة قريش",k:98,t:["قريش"]},
  {n:"لبنة",k:79,t:["لبنة","labneh"]},
  // إضافات
  {n:"معلقة سكر",k:16,t:["سكر","sugar"]},
  {n:"معلقة عسل",k:64,t:["عسل","honey"]},
  {n:"معلقة زيت",k:120,t:["زيت","oil"]},
  {n:"معلقة زبدة",k:102,t:["زبدة","سمنة","butter"]},
  {n:"معلقة مربى",k:56,t:["مربى","jam"]},
  {n:"معلقة مايونيز",k:94,t:["مايونيز","mayo"]},
  {n:"معلقة كاتشب",k:15,t:["كاتشب","ketchup"]},
  
  // مكسرات
  {n:"لوز",k:164,t:["لوز","almond"]},
  {n:"فستق",k:159,t:["فستق","pistachio"]},
  {n:"كاجو",k:157,t:["كاجو","cashew"]},
  {n:"فول سوداني",k:161,t:["فول سوداني","peanut"]}
];

// توليد قاعدة بيانات أكبر
const variants = [
  {p:"طبق",m:2.5},{p:"صحن",m:2.5},{p:"طبق كبير",m:3.5},{p:"طبق صغير",m:1.5},
  {p:"كوب",m:1},{p:"كوباية",m:1},{p:"كأس",m:1},
  {p:"معلقة",m:0.15},{p:"معلقتين",m:0.3},{p:"ملعقة",m:0.15},
  {p:"حبة",m:1},{p:"حبتين",m:2},{p:"قطعة",m:1},{p:"قطعتين",m:2},
  {p:"نص",m:0.5},{p:"ربع",m:0.25},{p:"تلت",m:0.33},
  {p:"100 جرام",m:0.8},{p:"200 جرام",m:1.6},{p:"50 جرام",m:0.4}
];
const quantityVariants = [
  {p:"طبق كبير",m:3},{p:"طبق",m:2},{p:"طبق صغير",m:1.3},{p:"صحن",m:2},
  {p:"كوب كبير",m:1.5},{p:"كوب",m:1},{p:"كوباية",m:1},{p:"كأس",m:1},
  {p:"معلقتين",m:2},{p:"معلقة",m:1},{p:"ملعقة",m:1},
  {p:"حبتين",m:2},{p:"حبة",m:1},{p:"قطعتين",m:2},{p:"قطعة",m:1},
  {p:"نص",m:0.5},{p:"نصف",m:0.5},{p:"ربع",m:0.25},{p:"تلت",m:0.33},
  {p:"كبير",m:1.5},{p:"صغير",m:0.7},{p:"وسط",m:1}
];

function normalizeArabic(str){
  if(!str) return '';
  return str.toLowerCase()
    .replace(/أ|إ|آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ✨ دالة جديدة للبحث الذكي بالتشابه
function fuzzyMatch(keyword, query) {
  keyword = normalizeArabic(keyword);
  query = normalizeArabic(query);
  
  if (query.includes(keyword) || keyword.includes(query)) return 100;
  
  let matches = 0;
  const minLen = Math.min(keyword.length, query.length);
  
  for (let i = 0; i < minLen; i++) {
    if (keyword[i] === query[i]) matches++;
  }
  
  const similarity = (matches / Math.max(keyword.length, query.length)) * 100;
  
  if (keyword.startsWith(query.slice(0, 3)) || query.startsWith(keyword.slice(0, 3))) {
    return Math.max(similarity, 70);
  }
  
  return similarity;
}

// 🧠 دالة ذكية لفهم الجمل الطبيعية
function extractSymptoms(query) {
  const q = normalizeArabic(query);
  const symptoms = [];
  
  // 🎯 أنماط الأعراض الشائعة
  const patterns = {
    // الألم
    pain: ["وجع", "الم", "يوجع","وجعني","بيوجع", "يولم", "موجوع", "مولوم", "حارق", "واجع"],
    // الصداع
    headache: ["راس", "راسي", "دماغ", "صداع", "شقيقة", "راس وجعان"],
    // البطن
    stomach: ["بطن", "بطني", "معده", "معدتي", "كرش", "بطني وجعاني"],
    // الظهر
    back: ["ظهر", "ظهري", "ضهر", "ضهري", "فقرات"],
    // الحلق
    throat: ["زور", "زوري", "حلق", "حلقي", "بلعوم"],
    // السعال
    cough: ["كحه", "كحة", "سعال", "سعله", "بكح"],
    // الحمى
    fever: ["حراره", "حرارة", "سخونه", "سخونة", "حمى"],
    // الغثيان
    nausea: ["غثيان", "دوخه", "دوخة", "عايز ارجع", "نفسي ارجع"],
    // الإسهال
    diarrhea: ["اسهال", "إسهال", "بطني سايبه", "مسهل"],
    // الإمساك
    constipation: ["امساك", "إمساك", "ممساك", "مش عارف اخرج"],
    // الحكة
    itch: ["حكه", "حكة", "هرش", "حكاك"],
    // الطفح
    rash: ["طفح", "حبوب", "بقع", "بثور"],
    // التعب
    fatigue: ["تعب", "تعبان", "خمول", "كسلان", "مرهق"],
    // الدوخة
    dizzy: ["دوخه", "دوخة", "دايخ", "راسي بيدور"],
    // ضيق التنفس
    breathless: ["ضيق نفس", "مختنق", "صعوبة تنفس", "نفسي قصير"]
  };
  
  // 🔍 البحث عن الأعراض في الجملة
  for (let [symptom, keywords] of Object.entries(patterns)) {
    for (let keyword of keywords) {
      if (q.includes(keyword)) {
        symptoms.push(symptom);
        break;
      }
    }
  }
  
  return symptoms;
}

// 🎯 ربط الأعراض بالأمراض المحتملة
function symptomToDisease(symptoms) {
  const mapping = {
    headache: ["صداع_نصفي", "انفلونزا", "ضغط_دم", "جيوب_انفية"],
    stomach: ["قرحة", "قولون", "اسهال", "امساك", "حصى_مرارة"],
    back: ["خشونة", "فتاق", "حصوات"],
    throat: ["انفلونزا", "التهاب_حلق"],
    cough: ["كحة", "انفلونزا", "ربو", "حساسية"],
    fever: ["انفلونزا", "التهاب_مسالك", "جدري_الماء"],
    nausea: ["قرحة", "حصى_مرارة", "اسهال"],
    diarrhea: ["اسهال", "قولون", "التهاب_معوي"],
    constipation: ["امساك", "قولون"],
    itch: ["حساسية", "اكزيما", "صدفية", "فطريات"],
    rash: ["حساسية", "اكزيما", "صدفية", "جدري_الماء", "حب_شباب"],
    fatigue: ["انيميا", "غدة_درقية", "اكتئاب"],
    dizzy: ["ضغط_دم", "انيميا", "قلق"],
    breathless: ["ربو", "حساسية", "قلق"]
  };
  
  const diseases = new Set();
  symptoms.forEach(symptom => {
    if (mapping[symptom]) {
      mapping[symptom].forEach(disease => diseases.add(disease));
    }
  });
  
  return Array.from(diseases);
}

function smartSearch(query){
  const q = normalizeArabic(query);
  if(!q) return [];
  
  let results = [];
  foodDB.forEach(food => {
    food.t.forEach(term => {
      const t = normalizeArabic(term);
      if(t === q || t.includes(q) || q.includes(t)) {
        results.push(food);
      }
    });
  });
  
  return results.slice(0, 10);
}

function parseCalInput(input){
  input = normalizeArabic(input);
  let multiplier = 1;
  let foodName = input;
  
  const numMatch = input.match(/(\d+(?:[.,]\d+)?)/);
  if(numMatch){
    const num = parseFloat(numMatch[1].replace(',', '.'));
    multiplier *= num;
    foodName = foodName.replace(numMatch[0], '').trim();
  }
  
  return {query: foodName, multiplier};
}

function initCalories(){
  const calInput = $('calInput');
  const calResult = $('calResult');
  const calItemsList = $('calItemsList');
  
  let debounce = null;
  
  calInput.addEventListener('input', ()=> {
    clearTimeout(debounce);
    debounce = setTimeout(()=> {
      const input = calInput.value.trim();
      
      if(!input){
        calResult.innerHTML = '<p class="muted">اكتب عدة أصناف مفصولة بفاصلة...</p>';
        calItemsList.style.display = 'none';
        return;
      }
      
      const items = input.split(/،|,/).map(i => i.trim()).filter(i => i);
      
      if(items.length === 0){
        calResult.innerHTML = '<p class="muted">❌ اكتب اسم طعام صحيح</p>';
        return;
      }
      
      let totalCalories = 0;
      let itemsHTML = '';
      
      items.forEach(item => {
        const parsed = parseCalInput(item);
        const matches = smartSearch(parsed.query);
        
        if(matches.length > 0){
          const best = matches[0];
          const itemCal = Math.round(best.k * parsed.multiplier);
          totalCalories += itemCal;
          
          itemsHTML += `
            <div style="background: var(--accent-light); padding: 10px; border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border-right: 3px solid var(--accent);">
              <div>
                <strong>${best.n}</strong>
                ${parsed.multiplier !== 1 ? `<span style="color: var(--muted); font-size: 13px;">× ${parsed.multiplier.toFixed(1)}</span>` : ''}
              </div>
              <div style="font-weight: bold; color: var(--accent); font-size: 16px;">${itemCal} سعرة</div>
            </div>
          `;
        } else {
          itemsHTML += `
            <div style="background: #ffebee; padding: 10px; border-radius: 10px; margin-bottom: 8px; border-right: 3px solid #f44336;">
              <span style="color: #d32f2f;">❌ لم أجد: ${item}</span>
            </div>
          `;
        }
      });
      
      calResult.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
          <div style="font-size: 18px; margin-bottom: 8px; color: var(--text);">
            <strong>المجموع الكلي</strong>
          </div>
          <div class="total">${totalCalories} سعرة حرارية</div>
          <div style="font-size: 13px; color: var(--muted); margin-top: 5px;">
            ${items.length} صنف
          </div>
        </div>
      `;
      
      calItemsList.innerHTML = itemsHTML;
      calItemsList.style.display = 'block';
      
      addLog(`حساب سعرات: ${items.join(' + ')} = ${totalCalories} kcal`);
      
    }, 300);
  });
}

/* ===== EXERCISES ===== */
const exercises = {
  morning: [
     {
  name:"المشي السريع + كارديو",
  desc:"تمرين مشي سريع مع حركات كارديو بسيطة - 10 دقائق.",
  video:"https://www.youtube.com/embed/M0uO8X3_tEA"
},
    {
      name:"تمارين الإطالة الصباحية",
      desc:"إطالة العضلات والمفاصل لتحسين المرونة وتجنب الإصابات.",
      video:"https://www.youtube.com/embed/g_tea8ZNk5A"
    },
    {
      name:"تمارين الكارديو الخفيف",
      desc:"رفع معدل ضربات القلب بتمارين بسيطة مثل القفز والجري في المكان.",
      video:"https://www.youtube.com/embed/ml6cT4AZdqI"
    },
    {
      name:"اليوغا الصباحية",
      desc:"وضعيات يوغا لطيفة لتنشيط الجسم والعقل.",
      video:"https://www.youtube.com/embed/v7AYKMP6rOE"
    },
    {
      name:"تمارين الكارديو HIIT صباحي",
      desc:"10 دقائق فقط! تمارين عالية الشدة بفترات راحة قصيرة. فعالية مضاعفة.",
      video:"https://www.youtube.com/embed/M0uO8X3_tEA"
    },
  ],

  noon: [
    {
      name:"تمارين القوة",
      desc:"تقوية العضلات باستخدام وزن الجسم - بوش أب، سكوات، لانجز.",
      video:"https://www.youtube.com/embed/IODxDxX7oi4"
    },
    {
      name:"البلانك",
      desc:"تمرين ثبات يقوي عضلات البطن والظهر والكتفين.",
      video:"https://www.youtube.com/embed/pSHjTRCQxIw"
    },
    {
      name:"تمارين البطن",
      desc:"كرنشز ورفع الأرجل لتقوية عضلات البطن.",
      video:"https://www.youtube.com/embed/1919eTCoESo"
    },
    {
      name:"السكوات",
      desc:"تمرين أساسي لتقوية الفخذين والأرداف.",
      video:"https://www.youtube.com/embed/YaXPRqUwItQ"
    },
    {
      name:"رفعة ميتة (وزن خفيف)",
      desc:"بزجاجات ماء أو أوزان، انحني من الورك والركب وارفع. حافظ على ظهر مستقيم.",
      video:"https://www.youtube.com/embed/XxWcirHIwVo"
    },
    {
      name:"الجلوس على الحائط",
      desc:"ظهرك على الحائط، اجلس بزاوية 90 درجة. احتفظ 30-60 ثانية. 3 مرات.",
      video:"https://www.youtube.com/embed/y-wV4Venusw"
    },
    {
      name:"دراجة البطن",
      desc:"استلقي وحرك رجلين كأنك تركب دراجة مع لمس الكوع للركبة المقابلة.",
      video:"https://www.youtube.com/embed/9FGilxCbdz8"
    },
    {
      name:"ديبس التراي",
      desc:"على كرسي، نزول بثني الكوع. يستهدف خلف الذراع. 3 × 12.",
      video:"https://www.youtube.com/embed/6kALZikXxLc"
    },
    {
      name:"ضغط كتف",
      desc:"بزجاجات ماء أو دمبلز، ارفع فوق الرأس. 3 مجموعات × 12-15.",
      video:"https://www.youtube.com/embed/qEwKCR5JCog"
    },
    {
      name:"متسلق الجبال",
      desc:"بوضع البلانك، بدل الركب للصدر بسرعة. 3 مجموعات × 30 ثانية.",
      video:"https://www.youtube.com/embed/nmwgirgXLYM"
    },
    {
      name:"تمرين الظهر Superman",
      desc:"استلقي على البطن وارفع ذراعين ورجلين معاً. احتفظ 3 ثواني.",
      video:"https://www.youtube.com/embed/z6PJMT2y8GQ"
    },
    {
      name:"اللانجز (الطعن)",
      desc:"خطوة واسعة ونزول بالركبة. يمين ويسار بالتبادل.",
      video:"https://www.youtube.com/embed/QOVaHwm-Q6U"
    },
    {
      name:"رفع الأرجل",
      desc:"استلقي وارفع رجلين مستقيمة. يستهدف البطن السفلية.",
      video:"https://www.youtube.com/embed/JB2oyawG9KI"
    },
    {
      name:"البيربي الشامل",
      desc:"أقوى تمرين! وقوف، نزول، push up، قفز. 3 مجموعات × 10-15.",
      video:"https://www.youtube.com/embed/dZgVxmf6jkA"
    }
  ],

  evening: [
    {
      name:"اليوغا المسائية",
      desc:"وضعيات مريحة للاسترخاء وتخفيف توتر اليوم.",
      video:"https://www.youtube.com/embed/v7AYKMP6rOE"
    },
    {
      name:"تمارين التمدد العميقة",
      desc:"إطالة عميقة لجميع العضلات قبل النوم.",
      video:"https://www.youtube.com/embed/g_tea8ZNk5A"
    },
    {
      name:"المشي الهادئ",
      desc:"مشي بطيء لمدة 15-20 دقيقة للاسترخاء.",
      video:"https://www.youtube.com/embed/ssss7V1_eyA"
    },
    {
      name:"تمارين القدمين والكاحل",
      desc:"دوران الكاحل، إطالة أصابع القدم، تدليك ذاتي.",
      video:"https://www.youtube.com/embed/sRyTV0hzx6E"
    },
    {
      name:"تأمل قبل النوم",
      desc:"تأمل موجه 15 دقيقة. تنفس عميق وتصور إيجابي.",
      video:"https://www.youtube.com/embed/aEqlQvczMJQ"
    },
    {
      name:"يوغا الين (Yin Yoga)",
      desc:"يوغا بطيئة جداً، احتفظ بكل وضعية 3-5 دقائق.",
      video:"https://www.youtube.com/embed/yXXVwd9JiFA"
    },
    {
      name:"تمرين القطة والبقرة",
      desc:"على أربع، قوس ظهرك لأعلى ثم لأسفل. ممتاز لآلام الظهر.",
      video:"https://www.youtube.com/embed/kqnua4rHVVA"
    },
   
    {
      name:"تمدد الفراشة",
      desc:"اجلس والصق باطن قدميك. اضغط الركب للأسفل برفق.",
      video:"https://www.youtube.com/embed/0cKXRzpEiWo"
    },
    {
      name:"التنفس التناوبي",
      desc:"تنفس يوغا من فتحة أنف واحدة بالتبادل. يوازن طاقة الجسم.",
      video:"https://www.youtube.com/embed/8VwufJrUhic"
    }
  ]
};

function initExercises(){
  const container = $('exercisesList');
  let currentFilter = 'morning';
  
  function renderExercises(time){
    container.innerHTML = '';
    exercises[time].forEach(ex => {
      const div = document.createElement('div');
      div.className = 'exercise-item';
      div.innerHTML = `
        <h4>${ex.name}</h4>
        <p>${ex.desc}</p>
        <button class="btn primary" data-video="${ex.video}">مشاهدة الفيديو</button>
        <button class="btn" onclick="addLog('بدء تمرين: ${ex.name}')">أضف للسجل</button>
      `;
      container.appendChild(div);
    });
  }
  
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', ()=> {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.time;
      renderExercises(currentFilter);
      beep(800, 0.05);
    });
  });
  
  container.addEventListener('click', (e)=> {
    if(e.target.classList.contains('btn') && e.target.dataset.video){
      const url = e.target.dataset.video;
      $('videoIframe').src = url + '?rel=0&autoplay=1';
      $('videoDialog').showModal();
      addLog('مشاهدة فيديو تمرين');
    }
  });
  
  $('closeVideo').addEventListener('click', ()=> {
    $('videoIframe').src = '';
    $('videoDialog').close();
  });
  
  renderExercises('morning');
  }

/* ===== BREATHING ===== */
const breathingEx = [
  {
    name:"تمرين 4-7-8 للاسترخاء",
    desc:"تقنية دكتور أندرو ويل الشهيرة",
    video:"https://www.youtube.com/embed/gz4G31LGyog",
    inhale:4, hold:7, exhale:8, cycles:4
  },
  {
    name:"Box Breathing (تنفس المربع)",
    desc:"تقنية القوات الخاصة للتركيز",
    video:"https://www.youtube.com/embed/tEmt1Znux58",
    inhale:4, hold:4, exhale:4, hold2:4, cycles:5
  },
  {
    name:"Wim Hof Breathing",
    desc:"تقنية ويم هوف القوية",
    video:"https://www.youtube.com/embed/tybOi4hjZFQ",
    inhale:2, exhale:2, cycles:30
  },
  {
    name:"تنفس التأمل البطيء",
    desc:"شهيق عميق، زفير بطيء",
    video:"https://www.youtube.com/embed/inpok4MKVLM",
    inhale:5, exhale:5, cycles:10
  }
];

function initBreathing(){
  const container = $('breathingList');
  
  breathingEx.forEach((ex, idx) => {
    const div = document.createElement('div');
    div.className = 'breathing-item';
    div.innerHTML = `
      <h4>${ex.name}</h4>
      <p>${ex.desc}</p>
      <div class="breathing-controls">
        <button class="btn primary" data-video="${ex.video}">مشاهدة الفيديو</button>
        <button class="btn" data-idx="${idx}">ابدأ التمرين</button>
      </div>
      <div id="breathing-timer-${idx}" class="breathing-timer" style="display:none"></div>
      <div id="breathing-instruction-${idx}" class="breathing-instruction" style="display:none"></div>
    `;
    container.appendChild(div);
  });
  
  container.addEventListener('click', (e)=> {
    if(e.target.dataset.video){
      $('videoIframe').src = e.target.dataset.video + '?rel=0&autoplay=1';
      $('videoDialog').showModal();
    }
    
    if(e.target.dataset.idx !== undefined){
      const idx = parseInt(e.target.dataset.idx);
      startBreathingExercise(idx);
    }
  });
}

function startBreathingExercise(idx){
  const ex = breathingEx[idx];
  const timerEl = $(`breathing-timer-${idx}`);
  const instrEl = $(`breathing-instruction-${idx}`);
  
  timerEl.style.display = 'block';
  instrEl.style.display = 'block';
  
  let cycle = 0;
  let phase = 'inhale';
  let timeLeft = ex.inhale;
  
  function updateDisplay(){
    timerEl.textContent = timeLeft;
    if(phase === 'inhale') instrEl.textContent = '🌬️ استنشق...';
    else if(phase === 'hold') instrEl.textContent = '⏸️ احبس النفس...';
    else if(phase === 'hold2') instrEl.textContent = '⏸️ احبس بعد الزفير...';
    else instrEl.textContent = '💨 ازفر...';
  }
  
  updateDisplay();
  addLog(`بدء تمرين تنفس: ${ex.name}`);
  
  const interval = setInterval(()=> {
    timeLeft--;
    
    if(timeLeft <= 0){
      if(phase === 'inhale'){
        phase = 'hold';
        timeLeft = ex.hold || 0;
        if(timeLeft === 0) phase = 'exhale';
      } else if(phase === 'hold'){
        phase = 'exhale';
        timeLeft = ex.exhale;
      } else if(phase === 'exhale'){
        if(ex.hold2){
          phase = 'hold2';
          timeLeft = ex.hold2;
        } else {
          cycle++;
          if(cycle >= ex.cycles){
            clearInterval(interval);
            instrEl.textContent = '✅ انتهى التمرين!';
            timerEl.textContent = '🎉';
            beep(1200, 0.1);
            addLog(`إنهاء تمرين: ${ex.name}`);
            setTimeout(()=> {
              timerEl.style.display = 'none';
              instrEl.style.display = 'none';
            }, 3000);
            return;
          }
          phase = 'inhale';
          timeLeft = ex.inhale;
        }
      } else if(phase === 'hold2'){
        cycle++;
        if(cycle >= ex.cycles){
          clearInterval(interval);
          instrEl.textContent = '✅ انتهى!';
          timerEl.textContent = '🎉';
          beep(1200, 0.1);
          addLog(`إنهاء: ${ex.name}`);
          setTimeout(()=> {
            timerEl.style.display = 'none';
            instrEl.style.display = 'none';
          }, 3000);
          return;
        }
        phase = 'inhale';
        timeLeft = ex.inhale;
      }
    }
    
    updateDisplay();
    beep(phase === 'inhale' ? 440 : (phase === 'exhale' ? 380 : 500), 0.04);
  }, 1000);
}

/* ===== AI MEDICAL ASSISTANT ===== */
const medicalKB = {
  "انفلونزا": {
    keywords: ["انفلونزا","برد","زكام","نزله برد","flu","cold","رشح"],
    response: "📋 **تحليل الإنفلونزا والبرد:**\n\n🔹 **الأعراض:**\n• حمى (38-40°) مفاجئة\n• صداع وآلام جسم شديدة\n• كحة جافة\n• رشح وعطس\n• تعب وإرهاق شديد\n• احتقان حلق\n• فقدان شهية\n\n💊 **العلاج المنزلي:**\n• **راحة تامة** 3-7 أيام\n• شرب سوائل دافئة كثيرة (2-3 لتر يومياً)\n• حساء دجاج (مثبت علمياً)\n• عسل وليمون وزنجبيل\n• غرغرة ماء دافئ وملح 3 مرات يومياً\n• استنشاق بخار\n• فيتامين C 1000mg يومياً\n\n💊 **الأدوية:**\n• خافض حرارة: باراسيتامول 500mg كل 6 ساعات\n• للكحة: شراب ديكستروميثورفان\n• للرشح: مضاد هيستامين (كلاريتين)\n• للاحتقان: بخاخ أنف (أوتريفين)\n\n⚠️ **راجع طبيب فوراً لو:**\n• حمى فوق 40° لأكثر من 3 أيام\n• ضيق تنفس شديد\n• ألم صدر\n• بلغم دموي\n• قيء مستمر\n• تشوش ذهني\n\n💡 **الوقاية:**\n• تطعيم إنفلونزا سنوي\n• غسل يدين متكرر\n• تجنب الازدحام\n• تهوية المنزل",
    drugs: ["باراسيتامول 500mg","ديكستروميثورفان للكحة","كلاريتين للرشح","فيتامين C 1000mg"]
  },
  "ربو": {
    keywords: ["ربو","ضيق نفس","صفير","asthma","حساسية صدر","صدر"],
    response: "📋 **إدارة الربو (حساسية الصدر):**\n\n🔹 **الأعراض:**\n• ضيق تنفس خاصة ليلاً وصباحاً\n• صفير عند الزفير\n• كحة مستمرة\n• ضيق في الصدر\n• تزيد مع المجهود أو التعرض لمثيرات\n\n💊 **العلاج:**\n• **بخاخ الطوارئ (موسع شعبي):**\n  - فنتولين (Ventolin) عند النوبة\n  - 2 بخة، انتظر 30 ثانية، كرر لو لزم\n• **بخاخ وقائي يومي:**\n  - كورتيزون مستنشق (سيريتايد، فليكسوتايد)\n  - مرتين يومياً حتى بدون أعراض\n• **جهاز قياس التنفس** لمتابعة الحالة\n\n🚫 **تجنب المثيرات:**\n• دخان وعطور قوية\n• غبار وعفن\n• حيوانات أليفة\n• هواء بارد مفاجئ\n• رياضة شديدة بدون تحضير\n• التوتر والقلق\n\n💪 **تمارين التنفس:**\n• تنفس بطني عميق\n• تمارين إطالة الصدر\n• سباحة (أفضل رياضة للربو)\n\n⚠️ **طوارئ فوراً لو:**\n• ضيق نفس شديد لا يستجيب للبخاخ\n• صفير شديد جداً\n• شفايف أو أظافر زرقاء\n• عدم قدرة على الكلام جمل كاملة\n• تنفس سريع جداً\n• تشوش أو فقدان وعي\n\n💡 خطة عمل مكتوبة مع الطبيب ضرورية",
    drugs: ["فنتولين بخاخ للطوارئ","سيريتايد بخاخ وقائي يومي","مونتيلوكاست أقراص","متابعة منتظمة"]
  },
   "التهاب_جيوب": {
    keywords: ["جيوب انفية","جيوب","sinusitis","سينوس","انف مسدود","ضغط راس"],
    response: "📋 **التهاب الجيوب الأنفية:**\n\n🔹 **الأعراض:**\n• ألم وضغط في الوجه (جبهة، خدود، أنف)\n• صداع خاصة عند الانحناء\n• رشح أصفر/أخضر سميك\n• انسداد أنف\n• فقدان حاسة الشم\n• ألم أسنان علوية\n• حمى خفيفة\n• تعب\n\n💊 **العلاج:**\n• **غسيل أنف بمحلول ملحي:** 3-4 مرات يومياً (مهم جداً!)\n• **بخار ماء ساخن:** استنشاق 10-15 دقيقة 3 مرات يومياً\n• **كمادات دافئة** على الوجه\n• **شرب سوائل كثيرة** لتخفيف المخاط\n• **بخاخ أنف:**\n  - للاحتقان: أوتريفين (3 أيام فقط!)\n  - كورتيزون: فليكسونيز (أطول مدة)\n• **مسكن:**\n  - إيبوبروفين 400mg يخفف الألم والالتهاب\n• **مضاد هيستامين** لو حساسية\n• **مضاد حيوي** لو التهاب بكتيري (يحتاج طبيب)\n\n🏠 **نصائح منزلية:**\n• نم والرأس مرفوع\n• تجنب الأجواء الجافة\n• استخدم مرطب هواء\n• تجنب السباحة والغطس\n• لا تطير بالطائرة لو ممكن\n\n⚠️ **راجع طبيب لو:**\n• أعراض أكثر من 10 أيام\n• حمى عالية مستمرة\n• ألم شديد لا يتحسن\n• تورم حول العينين\n• تشوش رؤية\n• تصلب رقبة\n• نوبات متكررة\n\n💡 **الوقاية:**\n• غسل أنف يومي\n• علاج الحساسية\n• تجنب التدخين\n• تطعيم إنفلونزا",
    drugs: ["محلول ملحي لغسل الأنف","أوتريفين بخاخ 3 أيام فقط","إيبوبروفين 400mg","أموكسيسيلين لو بكتيري"]
  },
  /* ========== أمراض الجهاز الهضمي ========== */

  "قرحة": {
    keywords: ["قرحة","قرحة معدة","حرقة معدة","ulcer","حموضة شديدة"],
    response: "📋 **قرحة المعدة والإثني عشر:**\n\n🔹 **الأعراض:**\n• ألم حارق أعلى البطن\n• يزيد على معدة فاضية (خاصة ليلاً)\n• يتحسن بالأكل أو مضادات حموضة\n• غثيان وقيء\n• فقدان شهية ووزن\n• انتفاخ وتجشؤ\n• براز أسود (علامة نزيف - خطر!)\n\n💊 **العلاج:**\n• **مثبط حموضة قوي:**\n  - أوميبرازول 40mg صباحاً قبل الأكل بنصف ساعة\n  - أو إيزوميبرازول 40mg\n  - مدة 4-8 أسابيع\n• **مضاد حموضة فوري:** جافيسكون عند الألم\n• **علاج جرثومة المعدة (H. pylori):** لو موجودة\n  - مضادات حيوية + مثبط حموضة (Triple therapy)\n  - 10-14 يوم\n\n🍎 **النظام الغذائي:**\n• ✅ **تناول:**\n  - وجبات صغيرة متعددة (5-6 يومياً)\n  - زبادي (بروبيوتيك)\n  - موز، تفاح، شوفان\n  - خضروات مطبوخة\n  - بروتين خفيف (فراخ، سمك)\n• ❌ **تجنب:**\n  - قهوة وشاي ومشروبات غازية\n  - طعام حار وحامض\n  - طماطم وحمضيات\n  - شوكولاتة ونعناع\n  - كحول وتدخين (مهم جداً!)\n  - مسكنات (إيبوبروفين، أسبرين)\n\n💡 **نمط حياة:**\n• لا تأكل قبل النوم بـ3 ساعات\n• ارفع رأس السرير 15 سم\n• تجنب التوتر\n• لا ملابس ضيقة على البطن\n• وزن صحي\n\n⚠️ **طوارئ فوراً لو:**\n• قيء دموي (أحمر أو بني)\n• براز أسود قطراني\n• ألم حاد شديد مفاجئ\n• دوخة وإغماء\n• شحوب شديد\n(علامات نزيف - خطر على الحياة!)\n\n🔬 **فحوصات مهمة:**\n• منظار معدة\n• اختبار جرثومة المعدة\n• صورة دم كاملة",
    drugs: ["أوميبرازول 40mg صباحاً","جافيسكون عند الألم","علاج ثلاثي للجرثومة","سوكرالفات لحماية المعدة"]
  },
/* ========== أمراض إضافية جديدة ========== */

"حب_شباب": {
  keywords: ["حب الشباب","بثور","حبوب","دهون وجه","acne","بثره","حبه"],
  response: "📋 **حب الشباب (Acne):**\n\n🔹 **الأعراض:**\n• بثور حمراء ملتهبة\n• رؤوس بيضاء وسوداء\n• خراجات عميقة مؤلمة\n• ندبات محتملة\n• أكثر في الوجه، ظهر، صدر\n\n💊 **العلاج:**\n• **خفيف:**\n  - غسول بنزويل بيروكسيد 2.5-5%\n  - كريم ريتينويد (Differin)\n  - صابون طبي (Cetaphil)\n• **متوسط/شديد:**\n  - مضاد حيوي موضعي (كليندامايسين)\n  - أو فموي (دوكسيسيكلين)\n  - آيزوتريتينوين (Roaccutane) للحالات الشديدة\n\n🧴 **العناية:**\n• اغسل وجهك مرتين يومياً\n• مرطب خالي من الزيوت\n• واقي شمس يومي\n• لا تعصر البثور!\n• غير وسادة مرتين أسبوعياً\n\n🍎 **نظام حياة:**\n• قلل سكريات ومنتجات ألبان\n• أكثر خضروات وأوميجا 3\n• شرب ماء كثير\n• نوم كافي\n• تجنب توتر\n\n⚠️ **راجع طبيب لو:**\n• حب شباب كيسي عميق\n• ندبات شديدة\n• لا يستجيب للعلاج",
  drugs: ["بنزويل بيروكسيد 5%","ديفرين جل","دوكسيسيكلين للشديد","واقي شمس"]
},

"امساك": {
  keywords: ["امساك","إمساك","ممساك","مش عارف اخرج","صعوبة تبرز","constipation"],
  response: "📋 **الإمساك (Constipation):**\n\n🔹 **التعريف:**\n• تبرز أقل من 3 مرات أسبوعياً\n• براز صلب وجاف\n• صعوبة وألم عند التبرز\n• شعور بعدم إفراغ كامل\n\n💊 **العلاج:**\n• **ملينات:**\n  - لاكتيلوز (دوفلاك) - آمن طويل المدى\n  - بيساكوديل (Dulcolax) - سريع\n  - جليسرين تحاميل\n• **ألياف:**\n  - سيلليوم (فايبوجيل)\n  - 25-30 جرام يومياً\n\n🍎 **نظام غذائي:**\n• ✅ **أكثر من:**\n  - خضروات ورقية\n  - فواكه (خاصة خوخ، تين)\n  - حبوب كاملة (شوفان، أرز بني)\n  - بقوليات\n  - شرب ماء 2-3 لتر يومياً\n• ❌ **قلل:**\n  - أرز أبيض وخبز أبيض\n  - أجبان\n  - لحوم مصنعة\n\n💪 **نمط حياة:**\n• رياضة يومية 30 دقيقة\n• لا تؤجل الذهاب للحمام\n• روتين صباحي ثابت\n• قهوة صباحية قد تساعد\n• تدليك بطن دائري\n\n⚠️ **راجع طبيب لو:**\n• إمساك مفاجئ شديد\n• دم في البراز\n• فقدان وزن غير مبرر\n• ألم بطن شديد\n• إمساك أكثر من 3 أسابيع",
  drugs: ["دوفلاك شراب","فايبوجيل أكياس","بيساكوديل أقراص","شرب ماء كثير"]
},

"اسهال": {
  keywords: ["اسهال","إسهال","مسهل","بطني سايبة","إسهال","diarrhea"],
  response: "📋 **الإسهال (Diarrhea):**\n\n🔹 **الأسباب:**\n• عدوى فيروسية أو بكتيرية\n• تسمم غذائي\n• أدوية (مضادات حيوية)\n• قولون عصبي\n• حساسية طعام\n\n💊 **العلاج:**\n• **محلول جفاف فموي (ORS):**\n  - هيدروسيف، ريهيدران\n  - أهم من أي دواء!\n• **مضاد إسهال:**\n  - لوبراميد (Imodium)\n  - لا تستخدمه لو حمى أو دم!\n• **بروبيوتيك:**\n  - لاكتيول فورت\n  - بيوجايا\n\n🍎 **نظام غذائي (BRAT):**\n• موز\n• أرز أبيض\n• تفاح مطبوخ أو صوص\n• توست\n• بطاطس مسلوقة\n• زبادي\n• تجنب: ألبان، دهون، حار، كافيين\n\n💧 **ترطيب (الأهم!):**\n• اشرب سوائل كثيرة\n• ماء، شوربة، شاي خفيف\n• محلول ORS كل ساعة\n• تجنب: عصائر، مشروبات غازية\n\n⚠️ **طوارئ فوراً لو:**\n• إسهال شديد أكثر من 3 أيام\n• دم أو مخاط كثير في البراز\n• حمى عالية\n• علامات جفاف:\n  - عطش شديد\n  - بول قليل غامق\n  - دوخة\n  - جفاف فم وجلد\n• ألم بطن شديد",
  drugs: ["محلول ORS","لوبراميد عند الحاجة","لاكتيول بروبيوتيك","ترطيب مستمر"]
},

"انيميا": {
  keywords: ["انيميا","أنيميا","فقر دم","نقص حديد","شحوب","تعب","anemia"],
  response: "📋 **فقر الدم/الأنيميا (Anemia):**\n\n🔹 **الأعراض:**\n• تعب وإرهاق شديد\n• شحوب (وجه، جفون، أظافر)\n• ضيق نفس مع مجهود بسيط\n• خفقان قلب\n• صداع ودوخة\n• برودة أطراف\n• تساقط شعر\n• تشققات زوايا الفم\n\n💊 **العلاج (نقص حديد - الأشيع):**\n• **حديد فموي:**\n  - فيروجلوبين\n  - فيروفول\n  - 100-200mg عنصر حديد يومياً\n  - على معدة فاضية أو مع فيتامين C\n  - 3-6 شهور\n• **حقن حديد:** للحالات الشديدة\n• **فيتامين B12:** لو نقص\n• **حمض فوليك:** للحوامل وبعض الحالات\n\n🍎 **نظام غذائي:**\n• ✅ **غني بالحديد:**\n  - لحوم حمراء (أفضل امتصاص)\n  - كبدة\n  - سبانخ، بروكلي\n  - بقوليات (عدس، فاصوليا)\n  - عسل أسود\n  - بيض\n  - مكسرات\n• **فيتامين C يساعد الامتصاص:**\n  - برتقال، ليمون\n  - فلفل\n  - طماطم\n• ❌ **تجنب مع الحديد:**\n  - شاي وقهوة (ساعتين قبل/بعد)\n  - كالسيوم\n\n⚠️ **راجع طبيب لو:**\n• شحوب شديد\n• ضيق نفس بالراحة\n• خفقان مستمر\n• دم في براز أو بول\n• لا تحسن بعد 3 شهور علاج\n\n🔬 **فحوصات:**\n• صورة دم كاملة (CBC)\n• مخزون حديد (Ferritin)\n• فيتامين B12\n• حمض فوليك",
  drugs: ["فيروجلوبين كبسول","فيتامين C","حمض فوليك","طعام غني بالحديد"]
},

"حصى_مرارة": {
  keywords: ["حصى مرارة","حصوة مرارة","مرارة","ألم مرارة","gallstones","مغص مراري"],
  response: "📋 **حصوات المرارة (Gallstones):**\n\n🔹 **الأعراض:**\n• ألم مفاجئ شديد أعلى يمين البطن\n• ينتقل للكتف الأيمن أو الظهر\n• مدة 30 دقيقة - عدة ساعات\n• يزيد بعد أكل دسم\n• غثيان وقيء\n• انتفاخ\n• قد يسبب يرقان (اصفرار)\n\n💊 **العلاج:**\n• **للألم:**\n  - ديكلوفيناك حقن\n  - هيوسين (بوسكوبان)\n• **حصوات صامتة:** متابعة فقط\n• **حصوات مع أعراض:**\n  - جراحة استئصال المرارة بالمنظار\n  - عملية آمنة وشائعة\n  - شفاء سريع\n• **أدوية إذابة:** نادراً تستخدم\n  - حمض أورسوديوكسيكوليك\n  - تأخذ سنوات\n\n🍎 **نظام غذائي:**\n• ✅ **تناول:**\n  - خضروات وفواكه\n  - حبوب كاملة\n  - بروتين خفيف (سمك، فراخ)\n  - ألياف كثيرة\n• ❌ **تجنب:**\n  - دهون مشبعة\n  - أكل مقلي\n  - صفار بيض\n  - لحوم دهنية\n  - منتجات ألبان كاملة الدسم\n  - وجبات ثقيلة\n\n💡 **الوقاية:**\n• وزن صحي (السمنة أكبر عامل خطر)\n• لا تخسر وزن سريع\n• رياضة منتظمة\n• تجنب صيام طويل\n• وجبات صغيرة متعددة\n\n⚠️ **طوارئ فوراً لو:**\n• ألم شديد مستمر\n• يرقان (اصفرار عينين/جلد)\n• حمى عالية\n• قيء مستمر\n• براز فاتح جداً\n• بول غامق\n(علامات التهاب أو انسداد قناة)",
  drugs: ["بوسكوبان للمغص","ديكلوفيناك حقن","جراحة عند اللزوم","نظام قليل الدهون"]
},

"نقرس": {
  keywords: ["نقرس","gout","داء الملوك","حمض يوريك","إصبع قدم","نقرص"],
  response: "📋 **النقرس (Gout/داء الملوك):**\n\n🔹 **الأعراض:**\n• ألم مفاجئ شديد في مفصل (عادة إصبع القدم الكبير)\n• ألم \"لا يُحتمل\" - حتى لمس الغطاء مؤلم!\n• احمرار وتورم شديد\n• سخونة في المفصل\n• يبدأ ليلاً عادة\n• نوبات تستمر 3-10 أيام\n\n💊 **علاج النوبة:**\n• **مسكنات قوية (فوراً!):**\n  - إندوميثاسين 50mg 3 مرات\n  - أو كولشيسين 0.6mg كل ساعة\n  - أو كورتيزون\n• **كمادات ثلج**\n• **راحة المفصل**\n• **لا أسبرين** (يزيد حمض اليوريك!)\n\n💊 **علاج طويل المدى (بعد انتهاء النوبة):**\n• **ألوبيورينول:**\n  - 100-300mg يومياً\n  - يخفض حمض اليوريك\n  - يُأخذ مدى الحياة\n• **فيبوكسوستات:** بديل\n\n🍎 **نظام غذائي (مهم جداً!):**\n• ❌ **تجنب تماماً:**\n  - كبدة وكلاوي ومخ\n  - سردين وأنشوجة ومحار\n  - لحم أحمر كثير\n  - مرق لحم\n  - كحول (خاصة بيرة)\n  - مشروبات سكرية بفركتوز\n• ✅ **تناول:**\n  - خضروات (حتى السبانخ مسموح!)\n  - فواكه (خاصة كرز)\n  - منتجات ألبان قليلة الدسم\n  - حبوب كاملة\n  - ماء كثير 3 لتر\n  - قهوة (تخفض اليوريك!)\n\n💡 **عوامل خطر:**\n• سمنة\n• ضغط دم\n• سكري\n• وراثة\n• أدوية (مدرات بول)\n\n⚠️ **راجع طبيب لو:**\n• نوبات متكررة\n• تشوه مفاصل\n• حصوات كلى\n• تورمات تحت الجلد (توفي)",
  drugs: ["إندوميثاسين للنوبة","ألوبيورينول وقائي","كولشيسين","نظام قليل البيورين"]
},

"جدري_الماء": {
  keywords: ["جدري الماء","جديري","عنقز","chickenpox","varicella","حبوب ماية"],
  response: "📋 **جدري الماء (Chickenpox/Varicella):**\n\n🔹 **الأعراض:**\n• طفح جلدي يبدأ بالوجه والصدر\n• حبوب حمراء تتحول لحويصلات مائية\n• حكة شديدة جداً\n• حمى\n• تعب وصداع\n• فقدان شهية\n• ينتشر للجسم كله خلال يومين\n• معدي جداً قبل الطفح بيومين\n\n💊 **العلاج:**\n• **لا يوجد علاج خاص** - فيروسي ينتهي لوحده\n• **للحكة:**\n  - كالامين لوشن\n  - مضاد هيستامين (سيتريزين)\n  - حمام شوفان فاتر\n• **خافض حرارة:**\n  - باراسيتامول فقط\n  - **ممنوع أسبرين** (خطر متلازمة راي)\n• **للحالات الشديدة:**\n  - أسيكلوفير مضاد فيروسات\n  - خاصة للبالغين والمناعة الضعيفة\n\n🏠 **العناية:**\n• قص أظافر قصيرة\n• ألبس قفازات قطنية ليلاً\n• ملابس قطنية فضفاضة\n• حمام فاتر (لا صابون قوي)\n• لا تحك الحبوب (تسبب ندبات وعدوى)\n• عزل تام من المدرسة/العمل\n\n🚫 **منع العدوى:**\n• معدي من يومين قبل الطفح\n• حتى تجف كل الحبوب (5-7 أيام)\n• تجنب: حوامل، رضع، ضعاف مناعة\n• غسل يدين متكرر\n• لا مشاركة أدوات\n\n💉 **التطعيم:**\n• تطعيم فاريسيلا فعال 90%\n• جرعتين: عمر سنة و4 سنوات\n• يمنع المرض أو يخففه كثيراً\n\n⚠️ **راجع طبيب فوراً لو:**\n• حمى فوق 39° أكثر من 4 أيام\n• احمرار وصديد في الحبوب\n• صداع شديد وتصلب رقبة\n• صعوبة تنفس\n• قيء متكرر\n• اختلاجات\n• تشوش ذهني\n\n💡 **الوقاية بعد التعرض:**\n• تطعيم خلال 3-5 أيام\n• أو أجسام مضادة (VZIG) خلال 96 ساعة",
  drugs: ["كالامين لوشن","سيتريزين للحكة","باراسيتامول للحمى","لا أسبرين أبداً"]
},

"فتاق": {
  keywords: ["فتق","فتاق","hernia","فتق سري","فتق اربي","نتوء بطن"],
  response: "📋 **الفتق (Hernia):**\n\n🔹 **الأنواع الشائعة:**\n• **فتق إربي (الأشيع 75%):**\n  - انتفاخ في الفخذ/الصفن\n  - أكثر عند الرجال\n• **فتق سري:**\n  - انتفاخ حول السرة\n  - شائع عند الرضع والحوامل\n• **فتق فخذي:**\n  - أعلى الفخذ\n  - أكثر عند النساء\n• **فتق جراحي:**\n  - مكان عملية سابقة\n\n🔹 **الأعراض:**\n• انتفاخ واضح\n• يكبر مع السعال أو الحزق\n• يختفي عند الاستلقاء (غالباً)\n• ألم أو ثقل\n• يزيد مع المجهود\n• **علامات خطر:**\n  - ألم مفاجئ شديد\n  - احمرار\n  - لا يرجع للداخل\n  - غثيان وقيء\n  (فتق مختنق - طوارئ!)\n\n💊 **العلاج:**\n• **لا يوجد علاج دوائي**\n• **الحل الوحيد: جراحة**\n  - إصلاح الفتق بالشبكة\n  - بالمنظار أو مفتوح\n  - آمنة وناجحة 95%\n  - عودة سريعة للنشاط\n• **الانتظار (لو صغير بدون أعراض):**\n  - متابعة دورية\n  - لكن قد يكبر ويختنق\n\n🛡️ **الوقاية:**\n• تجنب حمل أثقال\n• علاج إمساك مزمن\n• علاج سعال مزمن\n• وزن صحي\n• تقوية عضلات بطن (بعد استشارة)\n• لا حزق شديد\n\n⚠️ **طوارئ فوراً لو:**\n• الفتق لا يرجع للداخل\n• ألم شديد مفاجئ\n• احمرار أو ازرقاق\n• قيء\n• انتفاخ بطن\n• عدم خروج غازات أو براز\n(فتق مختنق/منسد - خطر غرغرينا!)\n\n💡 **للأطفال:**\n• فتق سري: 90% يُغلق لوحده قبل سن 4\n• فتق إربي: يحتاج جراحة\n• لا تحاول دفعه بقوة",
  drugs: ["لا يوجد علاج دوائي","الجراحة هي الحل","مسكنات للألم","تجنب الحزق"]
},
  "قولون": {
    keywords: ["قولون عصبي","ibs","انتفاخ","غازات","مغص متكرر"],
    response: "📋 **القولون العصبي (IBS):**\n\n🔹 **الأعراض:**\n• مغص وألم بطن متكرر\n• انتفاخ وغازات\n• إمساك أو إسهال (أو التناوب بينهما)\n• تحسن بعد التبرز\n• شعور بعدم إفراغ كامل\n• مخاط في البراز\n• تزيد الأعراض مع التوتر\n\n💊 **العلاج:**\n• **للمغص:**\n  - بوسكوبان 10mg عند اللزوم\n  - كولوفيرين قبل الأكل\n• **للإمساك:**\n  - دوفلاك شراب\n  - ألياف (فايبوجيل)\n• **للإسهال:**\n  - لوبراميد عند الحاجة\n• **للانتفاخ:**\n  - ديسفلاتيل أو سيميثيكون\n• **مكملات:**\n  - بروبيوتيك (Probiotic) يومياً\n  - زيت نعناع أقراص\n\n🍎 **النظام الغذائي (مهم جداً!):**\n• ✅ **أطعمة صديقة:**\n  - شوفان، أرز، بطاطس مسلوقة\n  - موز، تفاح مقشر\n  - فراخ وسمك مشوي\n  - خضار مطبوخ جيداً\n  - زبادي قليل الدسم\n  - شرب ماء كافي\n• ❌ **تجنب (FODMAP عالي):**\n  - بقوليات (فول، عدس، حمص)\n  - بصل وثوم\n  - ملفوف وقرنبيط\n  - حليب ومنتجات ألبان كاملة الدسم\n  - قهوة ومشروبات غازية\n  - أكل دسم ومقلي\n  - علك وسكريات صناعية\n\n💡 **إدارة التوتر (مفتاح العلاج!):**\n• تمارين تنفس يومياً\n• يوغا وتأمل\n• رياضة منتظمة 30 دقيقة\n• نوم كافي 7-8 ساعات\n• علاج نفسي معرفي (CBT) فعال جداً\n\n📝 **يوميات الطعام:**\n• سجل كل ما تأكله والأعراض\n• اكتشف الأطعمة المحفزة لك شخصياً\n• كل شخص مختلف!\n\n⚠️ **راجع طبيب لو:**\n• فقدان وزن غير مبرر\n• دم في البراز\n• حمى مستمرة\n• ألم شديد ومستمر\n• قيء متكرر\n• صعوبة بلع\n• أعراض بدأت بعد سن 50\n\n💡 القولون العصبي مرض وظيفي (ليس خطر) لكن يحتاج إدارة طويلة المدى",
    drugs: ["بوسكوبان للمغص","دوفلاك للإمساك","بروبيوتيك يومياً","علاج التوتر أهم من الدواء"]
  },
/* ========== أمراض إضافية جديدة (30+ مرض) ========== */

"التهاب_حلق": {
  keywords: ["حلق","زور","زوري","حلقي","التهاب حلق","sore throat","بلعوم","لوز"],
  response: "📋 **التهاب الحلق (Sore Throat):**\n\n🔹 **الأسباب:**\n• فيروسي (الأشيع) - برد أو إنفلونزا\n• بكتيري (Strep throat) - يحتاج مضاد حيوي\n• حساسية\n• هواء جاف\n• ارتجاع معدي\n\n🔹 **الأعراض:**\n• ألم وخشونة في الحلق\n• صعوبة بلع\n• احمرار وتورم\n• لوز متضخمة\n• بقع بيضاء (لو بكتيري)\n• حمى\n• سعال خفيف\n\n💊 **العلاج:**\n• **فيروسي:**\n  - راحة وسوائل دافئة\n  - غرغرة ماء ملح 4-6 مرات\n  - أقراص مص (ستربسلز)\n  - عسل وليمون\n• **بكتيري (يحتاج طبيب):**\n  - مضاد حيوي (بنسلين أو أموكسيسيلين)\n  - 10 أيام كاملة\n• **مسكن:**\n  - باراسيتامول أو إيبوبروفين\n\n🏠 **علاج منزلي:**\n• غرغرة ماء دافئ + ملح\n• شرب سوائل دافئة (زنجبيل، شاي)\n• عسل نحل (ملعقة)\n• استنشاق بخار\n• مرطب هواء\n• راحة صوتية\n\n⚠️ **راجع طبيب لو:**\n• ألم شديد أكثر من 3 أيام\n• صعوبة تنفس أو بلع\n• حمى فوق 38.5°\n• طفح جلدي\n• بقع بيضاء كثيرة\n• تورم رقبة أو لسان",
  drugs: ["غرغرة ماء ملح","ستربسلز","باراسيتامول","عسل وليمون"]
},

"دوالي": {
  keywords: ["دوالي","دوالي الساقين","varicose veins","اوردة منتفخة","عروق زرقاء"],
  response: "📋 **دوالي الساقين (Varicose Veins):**\n\n🔹 **الأعراض:**\n• أوردة منتفخة ملتوية زرقاء/بنفسجية\n• ثقل وألم في الساقين\n• حرقان ونبض\n• تشنجات عضلية\n• حكة حول الأوردة\n• تورم كاحلين\n• جلد متغير اللون\n• تزيد بعد وقوف طويل\n\n💊 **العلاج:**\n• **محافظ:**\n  - جوارب ضاغطة طبية\n  - رفع الساقين\n  - رياضة منتظمة\n  - وزن صحي\n• **أدوية:**\n  - ديوسمين (Daflon)\n  - تحسن الأعراض\n• **إجراءات:**\n  - حقن تصليب\n  - ليزر داخلي\n  - جراحة (الحالات الشديدة)\n\n💡 **نمط حياة:**\n• لا تقف أو تجلس طويلاً\n• حرك ساقيك كل 30 دقيقة\n• تجنب كعب عالي\n• رياضة: مشي، سباحة، دراجة\n• رفع الساقين فوق مستوى القلب\n• لا تعقد ساقيك\n\n⚠️ **راجع طبيب لو:**\n• ألم شديد مفاجئ\n• تورم واحمرار (جلطة محتملة)\n• جرح أو نزيف\n• قرحة جلدية",
  drugs: ["دافلون 500mg","جوارب ضاغطة","رفع الساقين","رياضة منتظمة"]
},

"قولون_عصبي": {
  keywords: ["قولون","قولون عصبي","ibs","انتفاخ","غازات","مغص متكرر","بطني"],
  response: "📋 **القولون العصبي (IBS):**\n\n🔹 **الأعراض:**\n• مغص وألم بطن متكرر\n• انتفاخ وغازات\n• إمساك أو إسهال أو تناوب\n• تحسن بعد التبرز\n• شعور بعدم إفراغ\n• مخاط في البراز\n• تزيد مع التوتر\n\n💊 **العلاج:**\n• **للمغص:**\n  - بوسكوبان، كولوفيرين\n• **للإمساك:**\n  - دوفلاك، فايبوجيل\n• **للإسهال:**\n  - لوبراميد\n• **للانتفاخ:**\n  - ديسفلاتيل\n• **بروبيوتيك يومياً**\n\n🍎 **نظام FODMAP:**\n• ✅ تناول: أرز، موز، فراخ مشوي، جزر\n• ❌ تجنب: بقوليات، بصل، ثوم، ملفوف، حليب\n\n💪 **إدارة التوتر:**\n• تمارين تنفس\n• يوغا وتأمل\n• رياضة\n• علاج نفسي CBT\n\n⚠️ **راجع طبيب لو:**\n• فقدان وزن\n• دم في البراز\n• حمى\n• ألم شديد ليلاً",
  drugs: ["بوسكوبان","دوفلاك","بروبيوتيك","إدارة التوتر"]
},

"نزلة_معوية": {
  keywords: ["نزلة معوية","برد معده","تسمم","gastroenteritis","اسهال وقيء","معدة"],
  response: "📋 **النزلة المعوية (Gastroenteritis):**\n\n🔹 **الأعراض:**\n• إسهال مائي\n• قيء وغثيان\n• مغص بطن\n• حمى خفيفة\n• صداع وآلام جسم\n• فقدان شهية\n\n💊 **العلاج:**\n• **أهم شيء: محلول جفاف ORS**\n• لوبراميد للإسهال\n• أنتينال مطهر معوي\n• بروبيوتيك\n• راحة تامة\n\n🍎 **نظام غذائي:**\n• صيام 4-6 ساعات أول يوم\n• ثم: موز، أرز، تفاح، توست\n• سوائل كثيرة\n• تجنب: ألبان، دهون، حار\n\n⚠️ **طوارئ لو:**\n• جفاف شديد\n• قيء مستمر\n• دم كثير\n• حمى عالية\n• ألم بطن حاد",
  drugs: ["محلول ORS","أنتينال","لوبراميد","بروبيوتيك"]
},

"التهاب_مفاصل": {
  keywords: ["مفاصل","التهاب مفاصل","روماتيزم","arthritis","ركبة","كوع"],
  response: "📋 **التهاب المفاصل (Arthritis):**\n\n🔹 **الأنواع:**\n• **روماتويد:** مناعي ذاتي\n• **خشونة:** تآكل غضاريف\n• **نقرس:** حمض يوريك\n\n🔹 **الأعراض:**\n• ألم وتورم مفاصل\n• تيبس صباحي\n• احمرار وسخونة\n• ضعف حركة\n• تشوه تدريجي\n\n💊 **العلاج:**\n• مسكنات ومضادات التهاب\n• كورتيزون (حالات شديدة)\n• أدوية مثبطة للمناعة (روماتويد)\n• علاج طبيعي\n\n💪 **نمط حياة:**\n• رياضة خفيفة (سباحة)\n• وزن صحي\n• كمادات دافئة/باردة\n• أوميجا 3\n\n⚠️ **راجع طبيب:**\n• تورم مستمر\n• حمى\n• فقدان وظيفة\n• تشوه",
  drugs: ["إيبوبروفين","جلوكوزامين","علاج طبيعي","رياضة مائية"]
},

"قرحة_فم": {
  keywords: ["قرحة فم","تقرحات","canker sore","افتة","فمي موجوع","لساني"],
  response: "📋 **قرح الفم (Canker Sores):**\n\n🔹 **الأعراض:**\n• بقع بيضاء/صفراء مؤلمة\n• محاطة بهالة حمراء\n• داخل الخدود أو اللسان\n• حرقان قبل ظهورها\n• صعوبة أكل وشرب\n• تستمر 7-14 يوم\n\n💊 **العلاج:**\n• **جل موضعي:**\n  - أورافكس (Orafix)\n  - بوراجيل\n• **غسول فم:**\n  - كلورهيكسيدين\n• **مسكن:**\n  - باراسيتامول\n• **فيتامينات:**\n  - B12، حديد، حمض فوليك\n\n🏠 **علاج منزلي:**\n• مضمضة ماء ملح\n• عسل طبيعي\n• ثلج\n• تجنب: حار، حامض، خشن\n\n💡 **الوقاية:**\n• نظافة أسنان جيدة\n• فرشاة ناعمة\n• تجنب توتر\n• نوم كافي\n\n⚠️ **راجع طبيب لو:**\n• قرح كبيرة (>1 سم)\n• تستمر أكثر من 3 أسابيع\n• متكررة كثيراً\n• حمى",
  drugs: ["أورافكس جل","مضمضة كلورهيكسيدين","فيتامين B12","مسكن"]
},

"حموضة": {
  keywords: ["حموضة","حرقان معده","حرقة","heartburn","ارتجاع","gerd"],
  response: "📋 **الحموضة وارتجاع المريء (GERD):**\n\n🔹 **الأعراض:**\n• حرقان خلف الصدر\n• يزيد بعد الأكل أو الاستلقاء\n• طعم مر في الفم\n• صعوبة بلع\n• كحة جافة\n• بحة صوت\n\n💊 **العلاج:**\n• **مثبطات حموضة:**\n  - أوميبرازول 20mg\n  - بانتوبرازول\n• **مضادات حموضة فورية:**\n  - جافيسكون\n  - مالوكس\n\n🍎 **نظام غذائي:**\n• ❌ تجنب:\n  - قهوة، شاي، شوكولاتة\n  - طماطم، حمضيات\n  - حار ودسم\n  - نعناع، بصل، ثوم\n• ✅ تناول:\n  - وجبات صغيرة\n  - موز، شوفان\n  - زبادي\n  - خضار مطبوخ\n\n💡 **نمط حياة:**\n• لا تأكل قبل النوم بـ3 ساعات\n• ارفع رأس السرير 15 سم\n• وزن صحي\n• ملابس فضفاضة\n• توقف تدخين\n\n⚠️ **راجع طبيب لو:**\n• صعوبة بلع\n• قيء دموي\n• فقدان وزن\n• ألم صدر شديد",
  drugs: ["أوميبرازول 20mg","جافيسكون","نظام حياة صحي","تجنب المثيرات"]
},

"طنين": {
  keywords: ["طنين","طنين اذن","tinnitus","صفير اذن","رنين"],
  response: "📋 **طنين الأذن (Tinnitus):**\n\n🔹 **الأعراض:**\n• رنين أو طنين أو صفير\n• في أذن واحدة أو الاثنتين\n• مستمر أو متقطع\n• يزيد في الهدوء\n• قد يؤثر على النوم\n\n🔹 **الأسباب:**\n• تعرض لضوضاء عالية\n• شمع أذن\n• عدوى أذن\n• أدوية (أسبرين جرعات عالية)\n• ضغط دم\n• مشاكل فك صدغي\n\n💊 **العلاج:**\n• **علاج السبب:**\n  - إزالة شمع\n  - علاج التهاب\n  - ضبط ضغط دم\n• **أدوية مساعدة:**\n  - فيتامين B12\n  - جينكو بيلوبا\n  - بيتاهيستين\n\n💡 **إدارة:**\n• تجنب صمت تام (موسيقى خلفية)\n• سماعات ضوضاء بيضاء\n• تقنيات استرخاء\n• علاج نفسي معرفي\n• تجنب كافيين وملح\n\n⚠️ **راجع طبيب لو:**\n• طنين مفاجئ في أذن واحدة\n• مع ضعف سمع\n• دوخة\n• ألم أذن",
  drugs: ["فيتامين B12","بيتاهيستين","جينكو بيلوبا","علاج السبب"]
},

"دمامل": {
  keywords: ["دمل","دمامل","خراج","boil","abscess","حبة صديد"],
  response: "📋 **الدمامل (Boils/Furuncles):**\n\n🔹 **الأعراض:**\n• كتلة حمراء مؤلمة تحت الجلد\n• تكبر وتمتلئ بالصديد\n• رأس أبيض/أصفر\n• تورم واحمرار حولها\n• قد تنفجر وتصرف\n• حمى أحياناً\n\n💊 **العلاج:**\n• **كمادات دافئة:**\n  - 20 دقيقة 3-4 مرات يومياً\n  - تساعد على النضج والتصريف\n• **مضاد حيوي:**\n  - كلوكساسيللين أو أوجمنتين\n  - لو كبيرة أو متعددة\n• **كريم موضعي:**\n  - فيوسيدين\n  - ميوبيروسين\n• **قد تحتاج تصريف جراحي**\n\n🚫 **ممنوع:**\n• عصر أو ثقب الدمل بنفسك!\n• قد ينشر العدوى\n\n💡 **الوقاية:**\n• نظافة شخصية جيدة\n• لا تشارك مناشف\n• علاج السكري لو موجود\n• تقوية مناعة\n\n⚠️ **راجع طبيب لو:**\n• دمل على وجه أو عمود فقري\n• أكثر من 1 سم\n• حمى\n• احمرار ينتشر\n• متكررة (قد تحتاج فحص سكر)",
  drugs: ["كمادات دافئة","أوجمنتين","كريم فيوسيدين","نظافة شخصية"]
},

"شخير": {
  keywords: ["شخير","snoring","شخر","نوم متقطع","توقف تنفس"],
  response: "📋 **الشخير وتوقف التنفس أثناء النوم:**\n\n🔹 **الأعراض:**\n• شخير عالي\n• توقف تنفس لثواني (يلاحظه الشريك)\n• استيقاظ مفاجئ مع اختناق\n• نوم غير مريح\n• نعاس نهاري شديد\n• صداع صباحي\n• تركيز ضعيف\n\n💊 **العلاج:**\n• **جهاز CPAP:**\n  - للحالات المتوسطة/الشديدة\n  - يضغط هواء مستمر\n• **جهاز فموي:**\n  - يبقي الفك للأمام\n• **جراحة:**\n  - استئصال لحمية/لوز\n  - توسيع مجرى\n\n💡 **نمط حياة:**\n• **أهم شيء: خسارة وزن**\n• نم على جنبك (ليس ظهرك)\n• ارفع رأس السرير\n• تجنب كحول وحبوب منومة\n• توقف تدخين\n• علاج حساسية أنف\n\n⚠️ **خطير لو أهمل:**\n• ارتفاع ضغط دم\n• أمراض قلب\n• جلطات\n• سكري نوع 2\n• حوادث (نعاس نهاري)\n\n🔬 **التشخيص:**\n• دراسة نوم (Polysomnography)\n• تقيس توقف التنفس",
  drugs: ["جهاز CPAP","خسارة وزن","نوم على الجنب","علاج حساسية"]
},
  "بواسير": {
    keywords: ["بواسير","hemorrhoids","شرخ شرجي","ألم شرج","نزيف شرج"],
    response: "📋 **البواسير والشرخ الشرجي:**\n\n🔹 **الأعراض:**\n• ألم عند التبرز\n• نزيف أحمر فاتح\n• حكة شرجية\n• تورم أو كتلة خارجية\n• إفرازات مخاطية\n• ألم عند الجلوس\n\n💊 **العلاج:**\n• **كريمات موضعية:**\n  - فاكتو (Faktu)\n  - بروكتوسيديل\n  - ليجنوكايين للألم\n• **تحاميل:**\n  - ألتراپروكت\n  - سيديپروكت\n• **مسكن:**\n  - باراسيتامول (ليس إيبوبروفين)\n• **ملين:**\n  - دوفلاك لتسهيل التبرز\n  - ألياف (فايبوجيل)\n\n🏠 **العلاج المنزلي (مهم جداً!):**\n• **حمام مائي دافئ (Sitz bath):**\n  - 3-4 مرات يومياً\n  - 10-15 دقيقة\n  - ماء دافئ فقط\n• **كمادات ثلج:** للتورم\n• **تنظيف لطيف:**\n  - ماء دافئ (لا ورق جاف!)\n  - مناديل مبللة خالية من العطور\n• **وسادة دائرية** عند الجلوس\n\n🍎 **الوقاية والنظام الغذائي:**\n• ✅ **أكثر من:**\n  - ألياف (خضار، فواكه، شوفان)\n  - ماء 2-3 لتر يومياً\n  - خوخ وتين مجفف\n• ❌ **تجنب:**\n  - إمساك (السبب الأول!)\n  - حار وشطة\n  - كحول\n  - جلوس طويل\n  - حمل أثقال\n  - إجهاد عند التبرز\n\n💡 **عادات صحية:**\n• لا تؤجل الذهاب للحمام\n• لا تجلس على التواليت أكثر من 5 دقائق\n• لا تدفع بقوة\n• رياضة منتظمة\n• وزن صحي\n\n⚠️ **راجع طبيب لو:**\n• نزيف كثير أو مستمر\n• ألم شديد جداً\n• حمى\n• تورم كبير أو لون أرجواني\n• لا تحسن خلال أسبوع\n• نزيف مع تغير عادات التبرز\n(قد يكون سرطان قولون - افحص!)\n\n🔧 **خيارات جراحية:**\n• ربط بالمطاط (Banding)\n• حقن متصلب\n• ليزر أو جراحة (للحالات الشديدة)",
    drugs: ["كريم فاكتو موضعي","تحاميل ألتراپروكت","دوفلاك ملين","فايبوجيل ألياف"]
  },

  /* ========== أمراض القلب والأوعية ========== */

  "ضغط_دم": {
    keywords: ["ضغط","ضغط دم","hypertension","ضغط عالي","ضغط مرتفع"],
    response: "📋 **ارتفاع ضغط الدم:**\n\n🔹 **القراءات:**\n• طبيعي: أقل من 120/80\n• مرحلة 1: 130-139 / 80-89\n• مرحلة 2: 140+ / 90+\n• أزمة: 180+ / 120+ (طوارئ!)\n\n💊 **العلاج الدوائي:**\n• **أشهر الأدوية:**\n  - كونكور (Concor) - حاصر بيتا\n  - نورفاسك (Norvasc) - حاصر كالسيوم\n  - كوفرسيل (Coversyl) - ACE inhibitor\n  - ديوفان (Diovan) - ARB\n  - مدر بول خفيف (هيدروكلوروثيازيد)\n• **مهم:** لا توقف الدواء بدون طبيب!\n• القياس المنتظم ضروري\n\n🍎 **نظام DASH الغذائي:**\n• ✅ **أكثر من:**\n  - خضار وفواكه (8-10 حصص يومياً)\n  - حبوب كاملة\n  - بروتين خفيف (سمك، فراخ بدون جلد)\n  - مكسرات وبقوليات\n  - منتجات ألبان قليلة الدسم\n  - بوتاسيوم (موز، بطاطس، سبانخ)\n• ❌ **قلل:**\n  - **ملح (أهم شيء!): أقل من 5 جم يومياً**\n  - لحوم حمراء\n  - حلويات ومشروبات سكرية\n  - دهون مشبعة\n  - أكل معلب ومصنع\n  - مخللات وزيتون\n\n💪 **نمط حياة (بنفس أهمية الدواء!):**\n• **رياضة:** 150 دقيقة أسبوعياً (مشي سريع)\n• **وزن صحي:** خسارة 5 كجم تخفض الضغط 5-10 نقاط\n• **توقف تدخين:** فوري!\n• **قلل كافيين:** 1-2 فنجان فقط\n• **نوم كافي:** 7-8 ساعات\n• **إدارة توتر:** تأمل، يوغا، تنفس عميق\n• **تجنب كحول**\n\n📊 **قياس منزلي:**\n• اشتري جهاز ضغط منزلي موثوق\n• قس مرتين يومياً (صباح ومساء)\n• بعد راحة 5 دقائق\n• سجل القراءات\n• خذها لطبيبك\n\n⚠️ **طوارئ فوراً لو:**\n• ضغط 180/120 أو أكثر\n• صداع شديد مفاجئ\n• ألم صدر\n• ضيق تنفس\n• تشوش رؤية\n• تنميل أو ضعف\n• دوخة شديدة\n(علامات أزمة ارتفاع ضغط - خطر جلطة!)\n\n💡 **متابعة:**\n• طبيب كل 3-6 شهور\n• تحاليل دورية (كلى، بوتاسيوم)\n• فحص قلب سنوي\n• فحص عيون (الضغط يؤثر على الشبكية)",
    drugs: ["كونكور 5mg أو 10mg","نورفاسك 5mg","كوفرسيل 5mg","نظام حياة أهم من الدواء"]
  },
   /* ========== أمراض الغدد والسكر ========== */

  "سكر_نوع_2": {
    keywords: ["سكري نوع ٢","سكري نوع 2","type 2 diabetes","سكر النوع الثاني"],
    response: "📋 **السكري النوع 2:**\n\n🔹 **الأعراض:**\n• عطش شديد\n• تبول متكرر\n• جوع مستمر\n• تعب وإرهاق\n• تشوش رؤية\n• جروح تلتئم ببطء\n• تنميل أطراف\n• التهابات متكررة\n\n📊 **القراءات المستهدفة:**\n• صائم: 80-130 mg/dL\n• بعد الأكل بساعتين: أقل من 180\n• السكر التراكمي (HbA1c): أقل من 7%\n• قس 2-4 مرات يومياً\n\n💊 **العلاج الدوائي:**\n• **الخط الأول:**\n  - ميتفورمين 500-2000mg يومياً\n  - يُأخذ مع الأكل\n  - أفضل دواء لنوع 2\n• **إضافات:**\n  - جلوكوفاج XR (ممتد المفعول)\n  - جانوميت (ميتفورمين + سيتاجليبتين)\n  - فيكتوزا حقن (فقدان وزن)\n• **قد تحتاج أنسولين** لو السكر عالي جداً\n\n🍎 **النظام الغذائي (80% من العلاج!):**\n• ✅ **تناول:**\n  - خضروات ورقية (غير محدود)\n  - بروتين خفيف (فراخ، سمك، بيض)\n  - كربوهيدرات معقدة (أرز بني، شوفان، حبوب كاملة)\n  - دهون صحية (مكسرات، أفوكادو، زيت زيتون)\n  - فواكه قليلة السكر (تفاح، توت، كمثرى)\n• ❌ **تجنب تماماً:**\n  - سكريات وحلويات\n  - مشروبات محلاة وعصائر\n  - أرز أبيض وخبز أبيض\n  - معجنات ومخبوزات\n  - بطاطس مقلية\n  - أكل مصنع\n\n💡 **نصائح التحكم بالسكر:**\n• وجبات صغيرة متعددة (5-6 يومياً)\n• لا تهمل وجبات\n• تناول بروتين مع كل وجبة\n• ألياف كثيرة\n• اشرب ماء كافي\n\n💪 **الرياضة (ضرورية!):**\n• 150 دقيقة أسبوعياً\n• مشي سريع بعد الأكل مباشرة (30 دقيقة)\n• تمارين مقاومة 2-3 مرات أسبوعياً\n• تخفض السكر بدون دواء!\n\n⚠️ **مضاعفات خطيرة (لو لم يُتحكم به):**\n• أمراض قلب وجلطات\n• فشل كلوي\n• فقدان بصر (شبكية)\n• تلف أعصاب وبتر\n• ضعف جنسي\n\n🚨 **طوارئ:**\n• **هبوط سكر (أقل من 70):**\n  - اشرب عصير أو 3 ملاعق سكر فوراً\n  - أعد القياس بعد 15 دقيقة\n• **ارتفاع شديد (فوق 300):**\n  - اشرب ماء كثير\n  - اتصل بطبيب\n  - راجع طوارئ لو غثيان/قيء\n\n💡 **متابعة دورية:**\n• طبيب كل 3 شهور\n• تحليل تراكمي كل 3 شهور\n• فحص عيون سنوي\n• فحص قدمين شهري\n• تحاليل كلى ودهون سنوياً",
    drugs: ["ميتفورمين 1000mg مرتين يومياً","جانوميت حسب الطبيب","فحص سكر منتظم","نظام حياة هو الأساس"]
  },

  "غدة_درقية": {
    keywords: ["غدة درقية","thyroid","كسل غدة","نشاط غدة","هايبو","هايبر","درقيه"],
    response: "📋 **أمراض الغدة الدرقية:**\n\n🔹 **كسل الغدة (Hypothyroidism):**\n• **أعراض:**\n  - تعب وخمول شديد\n  - زيادة وزن بدون سبب\n  - برودة دائمة\n  - إمساك\n  - جفاف جلد وشعر\n  - تساقط شعر\n  - اكتئاب\n  - بطء نبض\n• **العلاج:**\n  - يوثيروكسين (Euthyrox) 50-200 mcg\n  - يُأخذ صباحاً على معدة فاضية\n  - نصف ساعة قبل الإفطار\n  - مدى الحياة\n• **تحاليل:**\n  - TSH كل 6-8 أسابيع حتى ضبط الجرعة\n  - ثم كل 6 شهور\n\n🔹 **نشاط الغدة (Hyperthyroidism):**\n• **أعراض:**\n  - عصبية وقلق\n  - فقدان وزن مع أكل كثير\n  - تعرق وحرارة\n  - رعشة يدين\n  - سرعة نبض\n  - إسهال\n  - جحوظ عينين (Graves' disease)\n• **العلاج:**\n  - نيوميركازول أو PTU\n  - حاصرات بيتا للأعراض\n  - يود مشع (علاج نهائي)\n  - جراحة (حالات معينة)\n\n💊 **نصائح الدواء:**\n• لا توقف العلاج بدون طبيب\n• اليوثيروكسين حساس للطعام والأدوية\n• ابعد عنه 4 ساعات: كالسيوم، حديد، صويا\n• خذه بنفس الوقت يومياً\n\n🍎 **التغذية:**\n• **للكسل:**\n  - يود (سمك، أعشاب بحرية)\n  - سيلينيوم (برازيل، جوز، تونة)\n  - زنك (لحم، بيض)\n  - تجنب: صويا، ملفوف خام بكثرة\n• **للنشاط:**\n  - قلل يود\n  - كالسيوم وفيتامين D\n\n⚠️ **راجع طبيب لو:**\n• تورم رقبة (تضخم درقية)\n• أعراض تسوء\n• خفقان شديد\n• تغير مفاجئ في الوزن\n• تغيرات عينين",
    drugs: ["يوثيروكسين للكسل","نيوميركازول للنشاط","متابعة TSH منتظمة","فحص دوري"]
  },
/* ========== أمراض العظام والمفاصل ========== */

  "خشونة": {
    keywords: ["خشونة","خشونة مفاصل","osteoarthritis","التهاب مفاصل","مفاصل","arthritis"],
    response: "📋 **خشونة المفاصل (Osteoarthritis):**\n\n🔹 **الأعراض:**\n• ألم مفاصل يزيد مع الحركة\n• تيبس صباحي (أقل من 30 دقيقة)\n• صوت طقطقة\n• تورم خفيف\n• ضعف في المفصل\n• صعوبة الحركة\n• الأشيع: ركبة، ورك، يدين، عمود فقري\n\n💊 **العلاج الدوائي:**\n• **مسكنات:**\n  - باراسيتامول 500mg (الخيار الأول)\n  - إيبوبروفين 400mg (لو لزم)\n  - ديكلوفيناك جل موضعي\n• **حماية غضاريف:**\n  - جلوكوزامين 1500mg يومياً\n  - كوندرويتين 1200mg\n  - MSM\n  - يُأخذوا 3-6 شهور لرؤية نتيجة\n• **حقن:**\n  - حمض هيالورونيك (Hyaluronic acid)\n  - كورتيزون (للألم الشديد - محدود)\n  - PRP (حقن البلازما الغنية)\n\n💪 **العلاج الفيزيائي (الأهم!):**\n• تمارين تقوية عضلات حول المفصل\n• سباحة وتمارين مائية (ممتازة)\n• دراجة ثابتة\n• تجنب: جري، قفز، حمل أثقال\n\n🍎 **نظام حياة:**\n• **خسارة وزن:** كل 5 كجم تخفف الحمل كثيراً\n• **أكل مضاد التهاب:**\n  - أوميجا 3 (سمك دهني)\n  - كركم وزنجبيل\n  - خضروات ورقية\n  - مكسرات\n  - تجنب: سكريات، لحوم مصنعة\n• **مكملات:**\n  - فيتامين D 5000 وحدة\n  - كالسيوم\n  - أوميجا 3\n\n🛠️ **أدوات مساعدة:**\n• عصا للمشي (تخفف الحمل 25%)\n• دعامة ركبة\n• أحذية مريحة\n• مقاعد مرتفعة\n• مساعدات فتح علب\n\n⚠️ **راجع طبيب لو:**\n• ألم شديد لا يستجيب للعلاج\n• تشوه مفصل\n• فقدان قدرة على الحركة\n• تورم واحمرار شديد\n• حمى مع ألم المفصل\n\n🔧 **خيارات جراحية:**\n• منظار تنظيف المفصل\n• تغيير مفصل كامل (الملاذ الأخير)\n• نتائج ممتازة في الحالات المتقدمة",
    drugs: ["جلوكوزامين 1500mg يومياً","إيبوبروفين عند اللزوم","كريم فولتارين","فيتامين D"]
  },

  "هشاشة_عظام": {
    keywords: ["هشاشة","هشاشة عظام","osteoporosis","ضعف عظام"],
    response: "📋 **هشاشة العظام (Osteoporosis):**\n\n🔹 **عوامل الخطر:**\n• سيدات بعد سن اليأس\n• عمر فوق 65 سنة\n• نحافة شديدة\n• تاريخ عائلي\n• تدخين وكحول\n• أدوية (كورتيزون طويل المدى)\n• نقص فيتامين D\n• قلة حركة\n\n🔬 **التشخيص:**\n• أشعة DEXA scan (قياس كثافة العظام)\n• T-score:\n  - طبيعي: -1 أو أعلى\n  - هشاشة مبكرة: -1 إلى -2.5\n  - هشاشة: -2.5 أو أقل\n\n💊 **العلاج:**\n• **أدوية بناء عظام:**\n  - فوساماكس (Fosamax) - أليندرونات\n  - أكتونيل (Actonel) - ريزدرونات\n  - بونفيفا (Bonviva) - حقن كل 3 شهور\n  - بروليا (Prolia) - حقن كل 6 شهور\n• **مكملات ضرورية:**\n  - كالسيوم 1200-1500mg يومياً\n  - فيتامين D3: 2000-5000 وحدة\n  - مغنيسيوم 400mg\n  - فيتامين K2\n\n🍎 **النظام الغذائي:**\n• ✅ **غني بالكالسيوم:**\n  - حليب ومنتجات ألبان\n  - سردين بعظمه\n  - سمسم وطحينة\n  - خضروات ورقية داكنة\n  - لوز\n• ✅ **فيتامين D:**\n  - سمك دهني (سلمون، تونة)\n  - صفار بيض\n  - تعرض لشمس 15-20 دقيقة يومياً\n• ❌ **تجنب:**\n  - كافيين كثير (يسرب كالسيوم)\n  - ملح كثير\n  - مشروبات غازية\n  - كحول\n\n💪 **التمارين (مهمة جداً!):**\n• تمارين حمل وزن:\n  - مشي سريع\n  - صعود سلالم\n  - رقص\n• تمارين مقاومة بأوزان خفيفة\n• تمارين توازن (تمنع السقوط)\n• تجنب: انحناءات أمامية شديدة\n\n⚠️ **الوقاية من الكسور:**\n• أرضيات غير زلقة\n• إضاءة جيدة\n• درابزين في حمام\n• أزل سجاد صغير\n• أحذية بنعل مطاطي\n• نظارة طبية محدثة\n\n🚨 **طوارئ لو:**\n• سقطت وألم شديد\n• عدم قدرة على الوقوف\n• تشوه ظاهر\n• كسور شائعة: ورك، رسغ، فقرات\n\n💡 كلما بدأت العلاج مبكراً، أفضل النتائج",
    drugs: ["فوساماكس 70mg أسبوعياً","كالسيوم 1500mg يومياً","فيتامين D3 5000 وحدة","تمارين حمل وزن"]
  },
 /* ========== أمراض الكلى والمسالك ========== */

  "حصوات": {
    keywords: ["حصوات","حصى","حصوة","kidney stones","مغص كلوي","ألم كلى"],
    response: "📋 **حصوات الكلى والمسالك:**\n\n🔹 **الأعراض:**\n• ألم شديد جداً في الجنب والظهر\n• ألم يأتي على شكل موجات\n• ينتقل للبطن والفخذ\n• دم في البول (وردي، أحمر، بني)\n• غثيان وقيء\n• حرقان وتكرار بول\n• بول عكر أو كريه الرائحة\n• حمى (لو التهاب)\n\n💊 **العلاج:**\n• **للألم (الأولوية!):**\n  - ديكلوفيناك حقن IM/IV (أقوى مسكن)\n  - كيتولاك حقن\n  - إيبوبروفين 600mg\n  - باراسيتامول إضافي\n• **لتفتيت/تسهيل خروج:**\n  - رواتينكس (Rowatinex) كبسولات\n  - تامسولوسين (يوسع الحالب)\n• **مضاد حيوي** لو التهاب\n\n💧 **العلاج الأساسي: الماء!**\n• اشرب 3-4 لتر يومياً\n• البول يجب أن يكون شفاف تقريباً\n• عصير ليمون طازج (يمنع تكون حصوات)\n• تجنب: مشروبات غازية ومحلاة\n\n🍎 **الوقاية حسب نوع الحصوة:**\n• **حصوات كالسيوم (الأشيع 80%):**\n  - قلل ملح\n  - قلل بروتين حيواني\n  - قلل أوكسالات: سبانخ، شاي، شوكولاتة\n  - كالسيوم طبيعي (لا تمنعه!)\n• **حصوات يوريك أسيد:**\n  - قلل: لحوم، مأكولات بحرية\n  - أكثر خضار وفواكه\n  - ألوبيورينول دواء\n• **حصوات ستروفايت:**\n  - علاج التهابات بولية فوراً\n\n💡 **نصائح:**\n• حركة ورياضة (تساعد في الخروج)\n• قد تحتاج تصفية البول لالتقاط الحصوة (للتحليل)\n• حمام دافئ يخفف الألم\n\n🔧 **علاجات طبية:**\n• **حصوات صغيرة (أقل من 5mm):** تخرج لوحدها مع الماء\n• **متوسطة (5-10mm):** موجات صادمة (ESWL)\n• **كبيرة:** منظار أو جراحة\n\n⚠️ **طوارئ فوراً لو:**\n• ألم لا يُحتمل\n• قيء مستمر (لا تقدر تشرب)\n• حمى عالية\n• دم كثير في البول\n• عدم تبول لساعات\n• ألم مع حصوة في كلية واحدة فقط\n(انسداد كامل - خطر على الكلية!)\n\n🔬 **فحوصات:**\n• أشعة مقطعية (الأدق)\n• سونار بطن\n• تحليل بول\n• وظائف كلى\n• تحليل الحصوة بعد خروجها",
    drugs: ["ديكلوفيناك حقن للألم","رواتينكس كبسولات","تامسولوسين","ماء 3-4 لتر يومياً"]
  },

  "التهاب_مسالك": {
    keywords: ["التهاب مسالك","التهاب بول","حرقان بول","uti","infection","مثانة"],
    response: "📋 **التهاب المسالك البولية (UTI):**\n\n🔹 **الأعراض:**\n• حرقان شديد عند التبول\n• تكرار بول (كل شوية)\n• إلحاح شديد\n• ألم أسفل البطن\n• بول عكر أو دموي\n• رائحة كريهة\n• لو وصل للكلى: حمى، ألم ظهر، غثيان\n\n💊 **العلاج:**\n• **مضادات حيوية (ضرورية!):**\n  - سيبروفلوكساسين 500mg مرتين يومياً\n  - أو نيتروفيورانتوين 100mg 4 مرات\n  - أو أموكسيسيلين/كلافيولانيك\n  - مدة 3-7 أيام (أكمل الكورس كاملاً!)\n• **مسكن حرقان:**\n  - يوريكالم (Uricalm)\n  - يوفامين فورت\n• **مسكن ألم:**\n  - إيبوبروفين 400mg\n\n💧 **العلاج المنزلي:**\n• اشرب ماء كثير جداً (2-3 لتر)\n• عصير توت بري (Cranberry) - فعال!\n• فيتامين C يحمض البول\n• كمادات دافئة على البطن\n• تجنب: كافيين، كحول، حار\n\n🚺 **للسيدات خاصة:**\n• تبولي بعد العلاقة مباشرة\n• امسحي من الأمام للخلف\n• تجنبي: دش مهبلي، عطور\n• غيري ملابس داخلية يومياً\n• ملابس قطنية فضفاضة\n\n🔁 **لو التهابات متكررة:**\n• افحصي: سكر، حصوات، تشوهات\n• قد تحتاجي مضاد حيوي وقائي\n• بروبيوتيك مهبلي\n• إستروجين موضعي (بعد سن اليأس)\n\n⚠️ **طوارئ/راجع طبيب لو:**\n• حمى عالية (فوق 38.5°)\n• ألم ظهر أو جنب شديد\n• غثيان وقيء\n• دم كثير في البول\n• لا تحسن خلال 2-3 أيام من المضاد\n• حامل\n• عندك سكري أو مشاكل كلى\n• رجل عنده أعراض (نادر - يحتاج فحص)\n\n💡 **الوقاية:**\n• شرب ماء كافي يومياً\n• لا تحبس البول\n• تبول بانتظام كل 2-3 ساعات\n• نظافة شخصية جيدة\n• توت بري منتظم\n• بروبيوتيك",
    drugs: ["سيبروفلوكساسين 500mg","يوريكالم للحرقان","عصير توت بري","أكمل المضاد كاملاً"]
  },
/* ========== أمراض نفسية وعصبية ========== */

  "اكتئاب": {
    keywords: ["اكتئاب","depression","حزن","زهق","ملل","مكتئب","يأس"],
    response: "📋 **الاكتئاب (Depression):**\n\n🔹 **الأعراض (5 أو أكثر لمدة أسبوعين+):**\n• حزن أو مزاج منخفض معظم اليوم\n• فقدان متعة في كل شيء\n• تغير وزن (زيادة أو نقصان)\n• أرق أو نوم كثير\n• تعب وفقدان طاقة\n• شعور بعدم القيمة أو ذنب\n• صعوبة تركيز واتخاذ قرارات\n• أفكار موت أو انتحار\n• انسحاب اجتماعي\n\n💊 **العلاج الدوائي:**\n• **مضادات اكتئاب SSRI (الخط الأول):**\n  - بروزاك (Fluoxetine) 20mg\n  - زولوفت (Sertraline) 50-200mg\n  - لوسترال، سيبرالكس\n• **ملاحظات مهمة:**\n  - تحتاج 2-4 أسابيع لتبدأ مفعول\n  - لا توقف فجأة (انسحاب خطير)\n  - قد تحتاج 6-12 شهر أو أكثر\n  - آثار جانبية أول أسبوعين ثم تتحسن\n\n🧠 **العلاج النفسي (مهم جداً!):**\n• **العلاج المعرفي السلوكي (CBT):**\n  - الأكثر فعالية\n  - يغير أنماط التفكير السلبية\n• العلاج الجماعي\n• العلاج الأسري\n• بنفس فعالية الدواء أو أكثر!\n\n💪 **علاج ذاتي (أساسي!):**\n• **رياضة منتظمة:**\n  - 30 دقيقة يومياً\n  - مضاد اكتئاب طبيعي\n  - تفرز إندورفين\n• **روتين يومي منتظم:**\n  - استيقاظ ونوم بنفس الوقت\n  - وجبات منتظمة\n  - مهام يومية\n• **تعرض لشمس:**\n  - 15-30 دقيقة صباحاً\n  - خاصة في الشتاء\n• **تواصل اجتماعي:**\n  - لو صعب، ابدأ بشخص واحد\n  - مكالمة أو رسالة\n• **هوايات:**\n  - لو ما عندك متعة، افعلها رغماً\n  - المتعة ترجع تدريجياً\n\n🍎 **نظام غذائي:**\n• أوميجا 3 (سمك دهني)\n• فيتامين D\n• فيتامين B المركب\n• تجنب: كحول، سكريات كثيرة\n• وجبات منتظمة\n\n⚠️ **طوارئ - اتصل فوراً لو:**\n• أفكار انتحارية\n• خطة للانتحار\n• أذية نفس\n• خطر على الآخرين\n**الخط الساخن: 08001110000**\n\n💡 **متى تطلب مساعدة:**\n• الأعراض تعيق حياتك\n• أكثر من أسبوعين\n• لا تتحسن بمفردك\n• اكتئاب ليس ضعف - مرض يُعالج!\n\n🔬 **أنواع خاصة:**\n• اكتئاب ما بعد الولادة\n• اكتئاب موسمي (SAD)\n• اكتئاب ثنائي القطب\n• كل واحد له علاج مختلف",
    drugs: ["بروزاك 20mg","زولوفت 50mg","علاج نفسي CBT","رياضة ونمط حياة"]
  },

  "صداع_نصفي": {
    keywords: ["صداع نصفي","شقيقة","migraine","ميجرين","صداع شديد"],
    response: "📋 **الصداع النصفي (Migraine/الشقيقة):**\n\n🔹 **الأعراض:**\n• صداع نابض شديد (عادة جانب واحد)\n• مدة 4-72 ساعة\n• يزيد مع الحركة\n• غثيان وقيء\n• حساسية شديدة للضوء والصوت\n• **أورا (Aura) قبلها (30%):**\n  - ومضات ضوء، خطوط متعرجة\n  - نقاط عمياء\n  - تنميل وجه أو يد\n\n⚡ **المثيرات (Triggers):**\n• قلة/كثرة نوم\n• تخطي وجبات\n• ضغط نفسي\n• تغيرات هرمونية (دورة شهرية)\n• أطعمة: جبن قديم، شوكولاتة، كحول\n• أضواء ساطعة أو وامضة\n• روائح قوية\n• تغيرات جو\n\n💊 **علاج النوبة:**\n• **خفيفة-متوسطة:**\n  - إيبوبروفين 600-800mg فوراً\n  - أو نابروكسين 500mg\n  - أو باراسيتامول 1000mg\n• **شديدة:**\n  - تريبتان: سوماتريبتان 50-100mg\n  - ريزاتريبتان، زولميتريبتان\n  - يُأخذ أول ما تبدأ النوبة\n• **غثيان:**\n  - ميتوكلوبراميد (بريمبيران)\n• **طوارئ:**\n  - كورتيزون حقن\n  - سوائل وريدية\n\n🛡️ **علاج وقائي (لو نوبات متكررة):**\n• **حاصرات بيتا:** بروبرانولول\n• **مضادات اكتئاب:** أميتريبتيلين\n• **مضادات صرع:** توباماكس\n• **حقن بوتكس:** كل 3 شهور\n• **أجسام مضادة CGRP:** علاج حديث\n• يُأخذون يومياً لشهور\n\n💡 **إدارة ذاتية:**\n• **يوميات صداع:**\n  - سجل: متى، مدة، شدة، مثيرات\n  - اكتشف نمطك الخاص\n• **نمط حياة منتظم:**\n  - نوم 7-8 ساعات بنفس الوقت\n  - وجبات منتظمة\n  - ماء كافي\n• **إدارة توتر:**\n  - تمارين استرخاء\n  - يوغا، تأمل\n  - تنفس عميق\n• **رياضة منتظمة** (لكن لا مجهود مفاجئ)\n\n🏠 **أثناء النوبة:**\n• غرفة مظلمة وهادئة\n• كمادات باردة على الجبهة\n• كمادات ساخنة على الرقبة\n• نم لو ممكن\n• كافيين قليل قد يساعد\n\n⚠️ **راجع طبيب فوراً لو:**\n• صداع مفاجئ شديد (صاعقة)\n• مع حمى وتصلب رقبة\n• تشوش رؤية أو ازدواج\n• ضعف أو تنميل لا يزول\n• صعوبة كلام\n• تغير في الشخصية\n• أول مرة بعد سن 50\n\n💡 العلاج الوقائي يقلل النوبات 50% أو أكثر",
    drugs: ["سوماتريبتان 100mg للنوبة","إيبوبروفين 600mg","بروبرانولول وقائي","يوميات صداع"]
  },
  /* ========== أمراض الجلد ========== */

  "اكزيما": {
    keywords: ["اكزيما","eczema","التهاب جلد","جلد جاف","احمرار جلد","تقشير"],
    response: "📋 **الأكزيما (Eczema/التهاب الجلد التأتبي):**\n\n🔹 **الأعراض:**\n• جفاف شديد وتقشر\n• حكة شديدة (خاصة ليلاً)\n• احمرار والتهاب\n• بقع سميكة متقشرة\n• تشققات وجروح صغيرة\n• قد تنز سائل وتتقشر\n• الأشيع: ثنيات (كوع، خلف ركبة، رقبة)\n\n💊 **العلاج:**\n• **كورتيزون موضعي (حسب الشدة):**\n  - خفيف: هيدروكورتيزون 1%\n  - متوسط: موميتازون (Elocom)\n  - قوي: بيتاميثازون\n  - يُستخدم مرتين يومياً لمدة قصيرة فقط\n  - ثم تخفيض تدريجي\n• **مثبطات مناعة موضعية:**\n  - تاكروليموس (Protopic)\n  - بيميكروليموس (Elidel)\n  - للوجه والمناطق الحساسة\n• **مضاد هيستامين:**\n  - للحكة الليلية\n  - هيدروكسيزين، سيتريزين\n• **مضاد حيوي:** لو التهاب بكتيري\n\n🧴 **الترطيب (الأهم!):**\n• مرطب سميك 3-4 مرات يومياً\n• مباشرة بعد الاستحمام (خلال 3 دقائق)\n• أفضل المرطبات:\n  - CeraVe, Cetaphil\n  - Eucerin, Aquaphor\n  - فازلين للحالات الشديدة\n• كلما أكثر، أحسن!\n\n🚿 **العناية بالجلد:**\n• حمام فاتر (ليس ساخن)\n• 5-10 دقائق فقط\n• صابون لطيف بدون عطور (Dove, Cetaphil)\n• تربيت بمنشفة (لا فرك)\n• ملابس قطنية ناعمة\n• تجنب: صوف، أقمشة خشنة\n\n🚫 **تجنب المثيرات:**\n• عطور ومواد كيميائية\n• صابون قاسي ومنظفات\n• عرق (حافظ على برودة)\n• توتر وضغط نفسي\n• بعض الأطعمة (سجل ولاحظ)\n• غبار وحيوانات أليفة\n\n🍎 **نظام حياة:**\n• أوميجا 3 (سمك أو مكمل)\n• بروبيوتيك\n• فيتامين D\n• تجنب: سكريات، أكل مصنع\n• رطوبة منزل 40-50%\n\n⚠️ **راجع طبيب لو:**\n• لا تحسن مع العلاج\n• التهاب شديد أو صديد\n• حمى\n• انتشار سريع\n• تأثير على النوم والحياة\n• أعراض عدوى فيروسية (حويصلات)\n\n💡 **للأطفال:**\n• شائع جداً (20% من الأطفال)\n• 80% يتحسنون مع الكبر\n• نفس العلاج بجرعات أقل\n• قص أظافر لمنع الخدش",
    drugs: ["كريم إيلوكوم","مرطب سيرافي 4 مرات يومياً","سيتريزين للحكة","تجنب المثيرات"]
  },

  "صدفية": {
    keywords: ["صدفية","psoriasis","بقع حمراء","تقشر فضي","قشور"],
    response: "📋 **الصدفية (Psoriasis):**\n\n🔹 **الأعراض:**\n• بقع حمراء مرتفعة\n• قشور فضية سميكة\n• جلد جاف متشقق (قد ينزف)\n• حكة أو حرقان\n• أظافر سميكة أو منقرة\n• مفاصل متورمة (صدفية مفصلية)\n• الأشيع: كوع، ركبة، فروة رأس، ظهر\n\n💊 **العلاج الموضعي (خفيف-متوسط):**\n• **كورتيزون قوي:**\n  - كلوبيتازول (Dermovate)\n  - بيتاميثازون\n  - للجسم فقط، ليس الوجه\n• **فيتامين D:**\n  - كالسيبوتريول (Daivonex)\n  - يُدهن مرتين يومياً\n  - يُخلط مع كورتيزون أحياناً\n• **قطران الفحم:**\n  - كريمات أو شامبو\n  - رائحة كريهة لكن فعال\n• **حمض الساليسيليك:**\n  - يزيل القشور\n\n💊 **العلاج الضوئي:**\n• UVB ضيق النطاق\n• 3 مرات أسبوعياً\n• فعال جداً للحالات المنتشرة\n• عيادات متخصصة\n\n💊 **علاج جهازي (حالات شديدة):**\n• **أدوية تقليدية:**\n  - ميثوتريكسات\n  - سايكلوسبورين\n  - أسيتريتين\n• **أدوية بيولوجية (حديثة ومكلفة):**\n  - هيوميرا (Humira)\n  - كوسينتكس (Cosentyx)\n  - ستيلارا (Stelara)\n  - حقن كل أسبوعين-شهر\n  - نتائج ممتازة جداً\n\n🍎 **نمط حياة:**\n• وزن صحي (السمنة تزيد الأعراض)\n• تجنب كحول وتدخين\n• إدارة توتر (مثير رئيسي)\n• حمية البحر المتوسط\n• أوميجا 3\n• فيتامين D\n\n☀️ **الشمس:**\n• تعرض معتدل يفيد (15-20 دقيقة)\n• لا تحرق الجلد!\n• البحر الميت علاج شهير\n\n⚠️ **راجع طبيب لو:**\n• تغطي مساحة كبيرة (أكثر من 10%)\n• تؤثر على حياتك\n• التهاب مفاصل\n• لا تستجيب للعلاجات الموضعية\n• صدفية بثرية (صديدية)\n\n💡 **حقائق:**\n• ليست معدية!\n• مرض مناعي ذاتي\n• وراثي (لو أحد الوالدين عنده، 10% احتمال)\n• مزمن لكن يمكن السيطرة عليه\n• فترات هدوء وانتكاس",
    drugs: ["كريم ديرموفيت + دايفونيكس","علاج ضوئي UVB","ميثوتريكسات للشديد","إدارة توتر"]
  },

  "فطريات": {
    keywords: ["فطريات","tinea","سعفة","فطر","حكة قدم","قدم رياضي"],
    response: "📋 **العدوى الفطرية (Fungal Infections):**\n\n🔹 **الأنواع الشائعة:**\n• **قدم رياضي (Athlete's foot):**\n  - بين أصابع القدم\n  - حكة، احمرار، تقشر، تشققات\n• **سعفة الجسم (Ringworm):**\n  - بقع دائرية حمراء\n  - حواف مرتفعة\n  - مركز أفتح\n• **سعفة الأظافر:**\n  - أظافر سميكة صفراء\n  - هشة ومتفتتة\n• **فطريات المناطق الحساسة:**\n  - حكة شديدة\n  - احمرار\n• **نخالة مبرقشة (Pityriasis versicolor):**\n  - بقع بيضاء/بنية على الصدر والظهر\n\n💊 **العلاج الموضعي:**\n• **كريمات مضادة فطريات:**\n  - كلوتريمازول (Canesten)\n  - ميكونازول\n  - تيربينافين (Lamisil)\n  - يُدهن مرتين يومياً\n  - استمر أسبوعين بعد الشفاء!\n• **بودرة:** للوقاية والرطوبة\n• **شامبو:** للفروة والنخالة\n  - كيتوكونازول 2%\n  - سيلينيوم سلفايد\n\n💊 **علاج فموي (للحالات الشديدة):**\n• **تيربينافين أقراص:**\n  - 250mg يومياً\n  - 2-6 أسابيع حسب المكان\n• **فلوكونازول:**\n  - جرعة واحدة أو أسبوعية\n• **للأظافر:**\n  - 3-6 شهور علاج\n  - صعبة العلاج\n\n🛡️ **الوقاية (مهمة جداً!):**\n• **للقدمين:**\n  - جفف جيداً بين الأصابع\n  - جوارب قطنية تمتص العرق\n  - غيرها يومياً\n  - أحذية تتنفس\n  - لا تمشي حافي في أماكن عامة\n  - بودرة مضادة فطريات\n• **للجسم:**\n  - نظافة وجفاف\n  - ملابس فضفاضة\n  - لا مشاركة مناشف أو ملابس\n• **للمناطق الحساسة:**\n  - ملابس داخلية قطنية\n  - غيرها يومياً\n  - جففها جيداً\n\n⚠️ **راجع طبيب لو:**\n• لا تحسن خلال 2-4 أسابيع\n• انتشار رغم العلاج\n• عدوى شديدة أو مؤلمة\n• حمى أو صديد\n• عندك سكري أو ضعف مناعة\n• فطريات أظافر (تحتاج علاج فموي)\n\n💡 **نصائح:**\n• الفطريات تحب الدفء والرطوبة\n• علاج كل أفراد الأسرة المصابين\n• نظف الأحذية والجوارب\n• غسيل ساخن للملابس",
    drugs: ["كريم لاميزيل موضعي","بودرة مضادة فطريات","تيربينافين أقراص للشديد","نظافة وجفاف"]
  },
 // ════════════════════════════════════════════════════════════════
// 👶 أمراض الأطفال والرضع
// ════════════════════════════════════════════════════════════════

"مغص_رضع": {
    keywords: ["ابني بيعيط كتير", "رضيع بيصرخ", "مغص رضيع", "بطن الطفل", "colic"],
    response: "📋 **مغص الرضع (Infant Colic):**\n\n🔹 **الأعراض:**\n• بكاء شديد ومستمر (أكثر من 3 ساعات يومياً)\n• يحدث عادة في المساء\n• الطفل يشد رجليه للبطن\n• احمرار الوجه\n• انتفاخ البطن\n• يبدأ عادة في عمر 2-3 أسابيع ويختفي عند 3-4 شهور\n\n💊 **العلاج:**\n• **تدليك بطن الطفل:** حركات دائرية لطيفة\n• **دواء سيميثيكون (Simethicone):** نقط للغازات\n• **ماء غريب (Gripe Water):** للمغص\n• **وضعية التجشؤ:** بعد كل رضعة\n• **حمل الطفل:** على البطن على ذراعك\n• **تهدئة:** أصوات بيضاء، حركة هزاز\n\n🍼 **للأم المرضعة:**\n• تجنبي: حليب بقري، كافيين، بقوليات، ملفوف\n• أرضعي في وضعية مستقيمة\n• تأكدي من التصاق الطفل الصحيح\n\n⚠️ **راجع طبيب فوراً لو:**\n• حمى فوق 38°\n• قيء شديد أو أخضر\n• دم في البراز\n• فقدان وزن\n• بكاء ضعيف أو مختلف\n• الطفل لا يتحرك بشكل طبيعي",
    drugs: ["نقط سيميثيكون", "ماء غريب", "تدليك البطن", "وضعية صحيحة للرضاعة"]
},

"اسهال_اطفال": {
    keywords: ["ابني عنده اسهال", "طفل اسهال", "براز سائل طفل", "جفاف رضيع"],
    response: "📋 **إسهال الأطفال:**\n\n🔹 **الأسباب:**\n• عدوى فيروسية (الأشيع)\n• تسمم غذائي\n• حساسية طعام\n• تسنين (قد يسبب إسهال خفيف)\n• مضادات حيوية\n\n🔹 **الأعراض:**\n• براز سائل أكثر من 3 مرات يومياً\n• قد يكون مع حمى أو قيء\n• جفاف (شفاه جافة، بكاء بدون دموع)\n\n💊 **العلاج:**\n• **الأهم: محلول الجفاف (ORS):**\n  - أعطيه كل 10-15 دقيقة\n  - ملعقة صغيرة في البداية\n• **استمرار الرضاعة:** طبيعية أو صناعية\n• **لا توقفي الحليب!**\n• **طعام خفيف:** موز، أرز، تفاح مطبوخ، توست\n• **بروبيوتيك:** لاكتيول أو بيوجايا\n• **زنك:** 10-20mg يومياً لمدة 10 أيام\n\n🚫 **ممنوع:**\n• لا تعطي أدوية إسهال للأطفال!\n• لا عصائر أو مشروبات غازية\n\n⚠️ **طوارئ فوراً لو:**\n• **علامات جفاف شديد:**\n  - فم وشفاه جافة جداً\n  - لا دموع عند البكاء\n  - لا بول أكثر من 6 ساعات\n  - عيون غائرة\n  - خمول شديد\n• دم كثير في البراز\n• حمى فوق 39° عند رضيع أقل من 3 شهور\n• قيء مستمر أكثر من 8 ساعات",
    drugs: ["محلول ORS", "زنك", "لاكتيول فورت", "استمرار الرضاعة"]
},

"تسنين": {
    keywords: ["تسنين", "طلوع اسنان", "طفل بيسنن", "اسنان رضيع", "teething"],
    response: "📋 **التسنين (Teething):**\n\n🔹 **العمر:** يبدأ عادة 4-7 شهور (لكن يختلف من طفل لآخر)\n\n🔹 **الأعراض:**\n• سيلان اللعاب الزائد\n• رغبة في عض كل شيء\n• تهيج وبكاء أكثر من المعتاد\n• احمرار اللثة وتورمها\n• قد يكون هناك حمى خفيفة (أقل من 38°)\n• اضطراب نوم\n• فقدان شهية خفيف\n• براز لين قليلاً\n\n💊 **العلاج:**\n• **عضاضة باردة:** ضعيها في الثلاجة (ليس الفريزر)\n• **تدليك اللثة:** بإصبع نظيف\n• **خضار باردة:** جزر أو خيار (تحت إشراف)\n• **مسكن:** باراسيتامول أو إيبوبروفين (حسب الجرعة)\n• **جل تسنين:** (Dentinox) على اللثة\n• **منشفة باردة مبللة:** للعض عليها\n\n🚫 **ممنوع:**\n• جل تسنين يحتوي بنزوكايين (خطر!)\n• عضاضات مجمدة (قد تؤذي اللثة)\n• قلادات التسنين (خطر اختناق)\n\n⚠️ **راجع طبيب لو:**\n• حمى فوق 38.5°\n• إسهال أو قيء شديد\n• طفح جلدي\n• رفض الطعام والشراب تماماً\n\n💡 **ترتيب ظهور الأسنان:**\n• 6-10 شهور: القواطع السفلية\n• 8-12 شهر: القواطع العلوية\n• 9-16 شهر: الأنياب\n• 13-19 شهر: الأضراس الأولى\n• 25-33 شهر: الأضراس الثانية",
    drugs: ["باراسيتامول نقط", "عضاضة باردة", "جل تسنين", "تدليك اللثة"]
},

// ════════════════════════════════════════════════════════════════
// 🩺 أمراض نسائية
// ════════════════════════════════════════════════════════════════

"الام_دورة": {
    keywords: ["الام دورة شهرية", "مغص الدورة", "عسر طمث",  "period pain"],
    response: "📋 **آلام الدورة الشهرية (Dysmenorrhea):**\n\n🔹 **الأعراض:**\n• مغص أسفل البطن قبل أو أثناء الدورة\n• ألم في الظهر السفلي\n• غثيان وصداع\n• إسهال أو إمساك\n• تعب وتقلبات مزاجية\n\n💊 **العلاج:**\n• **مسكنات:**\n  - إيبوبروفين 400mg كل 6 ساعات\n  - ابدئي قبل بدء الدورة بيوم\n  - باراسيتامول 500mg\n• **بوسكوبان:** للمغص\n• **كمادات دافئة:** على البطن\n• **رياضة خفيفة:** مشي، يوغا\n• **شاي أعشاب:** زنجبيل، قرفة، بابونج\n• **مغنيسيوم:** 200-400mg يومياً\n\n🍎 **نمط حياة:**\n• تجنبي: كافيين، ملح، سكريات\n• أكثري: ماء، خضروات، أوميجا 3\n• نوم كافي\n• تجنب التوتر\n\n💊 **للألم الشديد:**\n• حبوب منع حمل (تخفف الألم)\n• مضادات التهاب قوية\n• استشارة طبيبة\n\n⚠️ **راجعي طبيبة لو:**\n• ألم شديد جداً يعيق حياتك\n• دورة غير منتظمة\n• نزيف شديد (أكثر من فوطة كل ساعة)\n• ألم يستمر بعد انتهاء الدورة\n• دورات طويلة (أكثر من 7 أيام)\n• دورات متقاربة (أقل من 21 يوم)",
    drugs: ["إيبوبروفين 400mg", "بوسكوبان", "كمادات دافئة", "مغنيسيوم"]
},
"جدري_الماء": {
  keywords: ["جدري الماء","جديري","عنقز","chickenpox","حبوب ماية","حبوب فقاعات","جسمي ملان حبوب","حبوب بتحك","طفح فقاعي"],
  response: "📋 **جدري الماء (Chickenpox):**\n\n🔹 **الأعراض:**\n• طفح جلدي يبدأ بحبوب حمراء تتحول لفقاعات مائية\n• حكة شديدة جداً\n• حمى\n• صداع وتعب\n• فقدان شهية\n\n💊 **العلاج:**\n• **لا يوجد علاج محدد** (فيروسي)\n• **كالامين لوشن** للحكة\n• **مضاد هيستامين** (سيتريزين)\n• **باراسيتامول** للحمى\n• **ممنوع أسبرين** (خطر!)\n• **قص أظافر** لمنع الخدش\n\n🏠 **العناية:**\n• حمام فاتر مع شوفان\n• ملابس قطنية فضفاضة\n• تجنب الحك (يسبب ندبات)\n• عزل تام (معدي جداً)\n\n⚠️ **راجع طبيب لو:**\n• حمى فوق 39°\n• صديد في الحبوب\n• صعوبة تنفس\n• تشوش ذهني",
  drugs: ["كالامين لوشن","سيتريزين","باراسيتامول","لا أسبرين أبداً"]
},

"حصى_مرارة": {
  keywords: ["حصوة مرارة","حصى مرارة","مرارة","gallstones","ألم يمين فوق","مغص مراري","وجع جنبي اليمين","بطني من فوق يمين"],
  response: "📋 **حصوات المرارة (Gallstones):**\n\n🔹 **الأعراض:**\n• ألم مفاجئ شديد أعلى يمين البطن\n• ينتقل للكتف الأيمن\n• يزيد بعد أكل دسم\n• غثيان وقيء\n• انتفاخ\n\n💊 **العلاج:**\n• **للألم:** ديكلوفيناك حقن، بوسكوبان\n• **جراحة:** استئصال المرارة بالمنظار\n• **أدوية إذابة:** نادراً (تأخذ سنوات)\n\n🍎 **نظام غذائي:**\n• ❌ **تجنب:** دهون، مقليات، صفار بيض\n• ✅ **تناول:** خضار، فواكه، بروتين خفيف\n\n⚠️ **طوارئ لو:**\n• يرقان (اصفرار عينين)\n• حمى عالية\n• قيء مستمر",
  drugs: ["بوسكوبان","ديكلوفيناك حقن","جراحة منظار","نظام قليل الدهون"]
},

"نقرس": {
  keywords: ["نقرس","داء الملوك","gout","حمض يوريك","اصبع رجلي الكبير","إصبع رجلي منتفخ","وجع إصبع القدم","مفصل محمر ساخن"],
  response: "📋 **النقرس (Gout):**\n\n🔹 **الأعراض:**\n• ألم **مفاجئ وشديد جداً** في مفصل إصبع القدم الكبير (الأشيع)\n• احمرار وتورم وسخونة\n• حتى لمس الغطاء مؤلم!\n• يبدأ ليلاً غالباً\n\n💊 **علاج النوبة:**\n• **إندوميثاسين 50mg** 3 مرات\n• **كولشيسين**\n• **كمادات ثلج**\n• **راحة المفصل**\n\n💊 **علاج طويل المدى:**\n• **ألوبيورينول** 300mg يومياً (يخفض حمض اليوريك)\n\n🍎 **نظام غذائي:**\n• ❌ **ممنوع:** كبدة، محار، سردين، لحم أحمر كثير، كحول\n• ✅ **تناول:** كرز، قهوة، ماء كثير\n\n⚠️ **راجع طبيب لو:**\n• نوبات متكررة\n• تشوه مفاصل",
  drugs: ["إندوميثاسين","ألوبيورينول","كولشيسين","نظام قليل البيورين"]
},

"التهاب_كبد": {
  keywords: ["التهاب كبد","كبد","يرقان","hepatitis","عيوني صفرا","جسمي اصفر","لون البول غامق","بولي بني"],
  response: "📋 **التهاب الكبد الفيروسي (Hepatitis):**\n\n🔹 **الأنواع:**\n• **A:** من طعام ملوث\n• **B:** من دم ملوث أو جنسياً\n• **C:** من دم ملوث (الأخطر)\n\n🔹 **الأعراض:**\n• يرقان (اصفرار عينين وجلد)\n• بول غامق جداً (بني)\n• براز فاتح\n• تعب شديد\n• غثيان وفقدان شهية\n• ألم أعلى يمين البطن\n\n💊 **العلاج:**\n• **A:** يزول لوحده\n• **B:** أدوية مضادة فيروسات\n• **C:** أدوية حديثة (شفاء تام!)\n• **راحة تامة**\n• **تجنب كحول نهائياً**\n\n⚠️ **طوارئ لو:**\n• تشوش ذهني\n• نزيف\n• انتفاخ بطن شديد\n\n🛡️ **الوقاية:**\n• تطعيم (A وB)\n• لا مشاركة أمواس حلاقة\n• فحص قبل نقل دم",
  drugs: ["راحة تامة","أدوية مضادة فيروسات","تجنب كحول","تطعيم"]
},

"فتاق": {
  keywords: ["فتق","فتاق","hernia","نتوء بطن","بروز بطن","كتلة في البطن","فتق سري","فتق اربي"],
  response: "📋 **الفتق (Hernia):**\n\n🔹 **الأنواع:**\n• **فتق إربي:** الأشيع (في الفخذ)\n• **فتق سري:** حول السرة\n• **فتق فخذي**\n• **فتق جراحي:** مكان عملية قديمة\n\n🔹 **الأعراض:**\n• انتفاخ واضح (يكبر مع السعال)\n• يختفي عند الاستلقاء\n• ألم أو ثقل\n• يزيد مع المجهود\n\n💊 **العلاج:**\n• **لا يوجد علاج دوائي**\n• **الحل الوحيد: جراحة** (إصلاح بالشبكة)\n• آمنة وناجحة جداً\n\n⚠️ **طوارئ فوراً لو:**\n• **الفتق لا يرجع للداخل** (فتق مختنق)\n• ألم شديد مفاجئ\n• احمرار\n• قيء\n• انتفاخ بطن\n(خطر غرغرينا - طوارئ!)\n\n🛡️ **الوقاية:**\n• تجنب حمل أثقال\n• علاج إمساك\n• وزن صحي",
  drugs: ["لا يوجد علاج دوائي","جراحة","تجنب الحزق","علاج الإمساك"]
},

"دوالي": {
  keywords: ["دوالي","دوالي الساقين","varicose veins","عروق منتفخة","عروق زرقاء","رجلي فيها عروق","أوردة بارزة"],
  response: "📋 **دوالي الساقين (Varicose Veins):**\n\n🔹 **الأعراض:**\n• أوردة منتفخة ملتوية (زرقاء/بنفسجية)\n• ثقل وألم في الساقين\n• حرقان ونبض\n• تورم كاحلين\n• تزيد بعد وقوف طويل\n\n💊 **العلاج:**\n• **جوارب ضاغطة طبية** (الأهم!)\n• **رفع الساقين**\n• **دافلون 500mg** حبوب\n• **حقن تصليب** أو ليزر\n• **جراحة** (الحالات الشديدة)\n\n💪 **نصائح:**\n• لا تقف أو تجلس طويلاً\n• رياضة: مشي، سباحة\n• رفع الساقين فوق القلب\n• وزن صحي\n• تجنب كعب عالي\n\n⚠️ **راجع طبيب لو:**\n• ألم شديد مفاجئ\n• تورم واحمرار (جلطة محتملة)\n• قرحة جلدية",
  drugs: ["جوارب ضاغطة","دافلون 500mg","رفع الساقين","رياضة منتظمة"]
},

"التواء_كاحل": {
  keywords: ["التواء كاحل","التفاف رجلي","ankle sprain","كاحلي متورم","قدمي انلوت","رجلي اتلوت","مش قادر امشي"],
  response: "📋 **التواء الكاحل (Ankle Sprain):**\n\n🔹 **الأعراض:**\n• ألم مفاجئ في الكاحل\n• تورم سريع\n• كدمة (لون أزرق/أسود)\n• صعوبة المشي\n• عدم ثبات\n\n💊 **الإسعاف الفوري (RICE):**\n• **R**est: راحة\n• **I**ce: ثلج (20 دقيقة كل 3 ساعات)\n• **C**ompression: ضغط (رباط ضاغط)\n• **E**levation: رفع القدم فوق القلب\n\n💊 **العلاج:**\n• **مسكن:** إيبوبروفين\n• **جبيرة** أو **واقي كاحل**\n• **علاج طبيعي** (تمارين توازن)\n\n⚠️ **راجع طبيب لو:**\n• لا تستطيع تحميل وزن أبداً (خطر كسر)\n• تورم شديد جداً\n• تشوه واضح\n\n💡 **الوقاية:**\n• حذاء رياضي مناسب\n• تمارين تقوية الكاحل\n• انتبه على أرضيات غير مستوية",
  drugs: ["راحة وثلج (RICE)","إيبوبروفين","جبيرة","تمارين توازن"]
},
  "انفلونزا": {
    keywords: [
      "انفلونزا","برد","زكام","نزله برد","flu","cold","رشح",
      "دماغي تقيلة","راسي وجعاني","كحة ورشح","حراره وكحة",
      "نزلة برد","مخي تقيل","زور وجعاني","حلقي خشن",
      "انفلونزا موسمية","برد شديد","مخنوق ومحموم","جسمي مكسر",
      "عندي فيروس","مريض برد","نزلة برد قوية","رشح وعطس",
      "كحة وحمى","جسمي بارد","قشعريرة","تعبان من البرد",
      "انفلونزا حادة","فيروس","برد ثقيل","مخي موجوع","راسي تقيلة من البرد"
    ],
    response: "📋 **تحليل الإنفلونزا والبرد:**\n\n🔹 **الأعراض:**\n• حمى (38-40°) مفاجئة\n• صداع وآلام جسم شديدة\n• كحة جافة\n• رشح وعطس\n• تعب وإرهاق شديد\n• احتقان حلق\n• فقدان شهية\n\n💊 **العلاج المنزلي:**\n• **راحة تامة** 3-7 أيام\n• شرب سوائل دافئة كثيرة (2-3 لتر يومياً)\n• حساء دجاج (مثبت علمياً)\n• عسل وليمون وزنجبيل\n• غرغرة ماء دافئ وملح 3 مرات يومياً\n• استنشاق بخار\n• فيتامين C 1000mg يومياً\n\n💊 **الأدوية:**\n• خافض حرارة: باراسيتامول 500mg كل 6 ساعات\n• للكحة: شراب ديكستروميثورفان\n• للرشح: مضاد هيستامين (كلاريتين)\n• للاحتقان: بخاخ أنف (أوتريفين)\n\n⚠️ **راجع طبيب فوراً لو:**\n• حمى فوق 40° لأكثر من 3 أيام\n• ضيق تنفس شديد\n• ألم صدر\n• بلغم دموي\n• قيء مستمر\n• تشوش ذهني\n\n💡 **الوقاية:**\n• تطعيم إنفلونزا سنوي\n• غسل يدين متكرر\n• تجنب الازدحام\n• تهوية المنزل",
    drugs: ["باراسيتامول 500mg","ديكستروميثورفان للكحة","كلاريتين للرشح","فيتامين C 1000mg"]
  },

  "ربو": {
    keywords: [
      "ربو","ضيق نفس","صفير","asthma","حساسية صدر","صدري ضيق",
      "مش عارف اتنفس","صدري بيصفر","كحة بالليل","مخنوق","نفسي قصير",
      "حساسية الصدر","ضيق في التنفس","صدري مسدود","مش قادر اتنفس",
      "نفسي واقف","كتمة نفس","صدري ضايق","حساسية تنفسية",
      "كحة وصفير","نفسي تقيل","مش عارف اخد نفسي","صدري مقفول",
      "ربو شعبي","حساسية مزمنة","ضيق نفس مع مجهود","صدري بيحرقني"
    ],
    response: "📋 **إدارة الربو (حساسية الصدر):**\n\n🔹 **الأعراض:**\n• ضيق تنفس خاصة ليلاً وصباحاً\n• صفير عند الزفير\n• كحة مستمرة\n• ضيق في الصدر\n• تزيد مع المجهود أو التعرض لمثيرات\n\n💊 **العلاج:**\n• **بخاخ الطوارئ (موسع شعبي):**\n  - فنتولين (Ventolin) عند النوبة\n  - 2 بخة، انتظر 30 ثانية، كرر لو لزم\n• **بخاخ وقائي يومي:**\n  - كورتيزون مستنشق (سيريتايد، فليكسوتايد)\n  - مرتين يومياً حتى بدون أعراض\n• **جهاز قياس التنفس** لمتابعة الحالة\n\n🚫 **تجنب المثيرات:**\n• دخان وعطور قوية\n• غبار وعفن\n• حيوانات أليفة\n• هواء بارد مفاجئ\n• رياضة شديدة بدون تحضير\n• التوتر والقلق\n\n💪 **تمارين التنفس:**\n• تنفس بطني عميق\n• تمارين إطالة الصدر\n• سباحة (أفضل رياضة للربو)\n\n⚠️ **طوارئ فوراً لو:**\n• ضيق نفس شديد لا يستجيب للبخاخ\n• صفير شديد جداً\n• شفايف أو أظافر زرقاء\n• عدم قدرة على الكلام جمل كاملة\n• تنفس سريع جداً\n• تشوش أو فقدان وعي\n\n💡 خطة عمل مكتوبة مع الطبيب ضرورية",
    drugs: ["فنتولين بخاخ للطوارئ","سيريتايد بخاخ وقائي يومي","مونتيلوكاست أقراص","متابعة منتظمة"]
  },

  "قرحة": {
    keywords: [
      "قرحة","قرحة معدة","حرقة معدة","ulcer","حموضة شديدة",
      "معدتي بتحرقني","نار في معدتي","معدتي وجعاني","بطني من فوق",
      "ألم على الريق","معدتي نار","حرقان شديد","معدتي بتوجعني",
      "حموضة مزمنة","قرحة هضمية","معدتي ملتهبة","حرقان بعد الأكل",
      "ألم معدة","معدتي مش مرتاحة","حموضة وحرقان","بطني بيحرق",
      "وجع معدة","قرحة اثني عشر","حرقان صباحي","معدتي فاضية بتوجعني"
    ],
    response: "📋 **قرحة المعدة والإثني عشر:**\n\n🔹 **الأعراض:**\n• ألم حارق أعلى البطن\n• يزيد على معدة فاضية (خاصة ليلاً)\n• يتحسن بالأكل أو مضادات حموضة\n• غثيان وقيء\n• فقدان شهية ووزن\n• انتفاخ وتجشؤ\n• براز أسود (علامة نزيف - خطر!)\n\n💊 **العلاج:**\n• **مثبط حموضة قوي:**\n  - أوميبرازول 40mg صباحاً قبل الأكل بنصف ساعة\n  - أو إيزوميبرازول 40mg\n  - مدة 4-8 أسابيع\n• **مضاد حموضة فوري:** جافيسكون عند الألم\n• **علاج جرثومة المعدة (H. pylori):** لو موجودة\n  - مضادات حيوية + مثبط حموضة (Triple therapy)\n  - 10-14 يوم\n\n🍎 **النظام الغذائي:**\n• ✅ **تناول:**\n  - وجبات صغيرة متعددة (5-6 يومياً)\n  - زبادي (بروبيوتيك)\n  - موز، تفاح، شوفان\n  - خضروات مطبوخة\n  - بروتين خفيف (فراخ، سمك)\n• ❌ **تجنب:**\n  - قهوة وشاي ومشروبات غازية\n  - طعام حار وحامض\n  - طماطم وحمضيات\n  - شوكولاتة ونعناع\n  - كحول وتدخين (مهم جداً!)\n  - مسكنات (إيبوبروفين، أسبرين)\n\n💡 **نمط حياة:**\n• لا تأكل قبل النوم بـ3 ساعات\n• ارفع رأس السرير 15 سم\n• تجنب التوتر\n• لا ملابس ضيقة على البطن\n• وزن صحي\n\n⚠️ **طوارئ فوراً لو:**\n• قيء دموي (أحمر أو بني)\n• براز أسود قطراني\n• ألم حاد شديد مفاجئ\n• دوخة وإغماء\n• شحوب شديد\n(علامات نزيف - خطر على الحياة!)\n\n🔬 **فحوصات مهمة:**\n• منظار معدة\n• اختبار جرثومة المعدة\n• صورة دم كاملة",
    drugs: ["أوميبرازول 40mg صباحاً","جافيسكون عند الألم","علاج ثلاثي للجرثومة","سوكرالفات لحماية المعدة"]
  },

  "قولون": {
    keywords: [
      "قولون عصبي","ibs","انتفاخ","غازات","مغص متكرر",
      "بطني منفوخة","غازات كتير","بطني بيقرقر","مغص وانتفاخ",
      "قولوني تعبان","القولون العصبي","بطني متقلصة","مغص شديد",
      "معدتي منتفخة","غازات مزعجة","بطني مش مرتاحة","قولون ملتهب",
      "اضطراب قولون","انتفاخ وغازات","مغص متواصل","بطني بتوجعني",
      "معدة حساسة","قولون هضمي","معدتي مضطربة","انتفاخ دائم"
    ],
    response: "📋 **القولون العصبي (IBS):**\n\n🔹 **الأعراض:**\n• مغص وألم بطن متكرر\n• انتفاخ وغازات\n• إمساك أو إسهال (أو التناوب بينهما)\n• تحسن بعد التبرز\n• شعور بعدم إفراغ كامل\n• مخاط في البراز\n• تزيد الأعراض مع التوتر\n\n💊 **العلاج:**\n• **للمغص:**\n  - بوسكوبان 10mg عند اللزوم\n  - كولوفيرين قبل الأكل\n• **للإمساك:**\n  - دوفلاك شراب\n  - ألياف (فايبوجيل)\n• **للإسهال:**\n  - لوبراميد عند الحاجة\n• **للانتفاخ:**\n  - ديسفلاتيل أو سيميثيكون\n• **مكملات:**\n  - بروبيوتيك (Probiotic) يومياً\n  - زيت نعناع أقراص\n\n🍎 **النظام الغذائي (مهم جداً!):**\n• ✅ **أطعمة صديقة:**\n  - شوفان، أرز، بطاطس مسلوقة\n  - موز، تفاح مقشر\n  - فراخ وسمك مشوي\n  - خضار مطبوخ جيداً\n  - زبادي قليل الدسم\n  - شرب ماء كافي\n• ❌ **تجنب (FODMAP عالي):**\n  - بقوليات (فول، عدس، حمص)\n  - بصل وثوم\n  - ملفوف وقرنبيط\n  - حليب ومنتجات ألبان كاملة الدسم\n  - قهوة ومشروبات غازية\n  - أكل دسم ومقلي\n  - علك وسكريات صناعية\n\n💡 **إدارة التوتر (مفتاح العلاج!):**\n• تمارين تنفس يومياً\n• يوغا وتأمل\n• رياضة منتظمة 30 دقيقة\n• نوم كافي 7-8 ساعات\n• علاج نفسي معرفي (CBT) فعال جداً\n\n📝 **يوميات الطعام:**\n• سجل كل ما تأكله والأعراض\n• اكتشف الأطعمة المحفزة لك شخصياً\n• كل شخص مختلف!\n\n⚠️ **راجع طبيب لو:**\n• فقدان وزن غير مبرر\n• دم في البراز\n• حمى مستمرة\n• ألم شديد ومستمر\n• قيء متكرر\n• صعوبة بلع\n• أعراض بدأت بعد سن 50\n\n💡 القولون العصبي مرض وظيفي (ليس خطر) لكن يحتاج إدارة طويلة المدى",
    drugs: ["بوسكوبان للمغص","دوفلاك للإمساك","بروبيوتيك يومياً","علاج التوتر أهم من الدواء"]
  },

  "سكر_نوع_2": {
    keywords: [
      "سكري نوع ٢","سكري نوع 2","type 2 diabetes","سكر النوع الثاني",
      "سكري","عطشان دايماً","بتبول كتير","جوعان دايماً","وزني بينزل",
      "تعبان ومرهق","مرض السكر","سكر الدم","سكري مزمن","عندي سكر",
      "سكر عالي","عطش مستمر","تبول متكرر","جوع شديد","فقدان وزن",
      "إرهاق دائم","تعب مزمن","عيوني مشوشة","جروح ما بتبرأش",
      "سكر غير مضبوط","سكري متقدم","سكر الدم مرتفع","عندي مرض السكر"
    ],
    response: "📋 **السكري النوع 2:**\n\n🔹 **الأعراض:**\n• عطش شديد\n• تبول متكرر\n• جوع مستمر\n• تعب وإرهاق\n• تشوش رؤية\n• جروح تلتئم ببطء\n• تنميل أطراف\n• التهابات متكررة\n\n📊 **القراءات المستهدفة:**\n• صائم: 80-130 mg/dL\n• بعد الأكل بساعتين: أقل من 180\n• السكر التراكمي (HbA1c): أقل من 7%\n• قس 2-4 مرات يومياً\n\n💊 **العلاج الدوائي:**\n• **الخط الأول:**\n  - ميتفورمين 500-2000mg يومياً\n  - يُأخذ مع الأكل\n  - أفضل دواء لنوع 2\n• **إضافات:**\n  - جلوكوفاج XR (ممتد المفعول)\n  - جانوميت (ميتفورمين + سيتاجليبتين)\n  - فيكتوزا حقن (فقدان وزن)\n• **قد تحتاج أنسولين** لو السكر عالي جداً\n\n🍎 **النظام الغذائي (80% من العلاج!):**\n• ✅ **تناول:**\n  - خضروات ورقية (غير محدود)\n  - بروتين خفيف (فراخ، سمك، بيض)\n  - كربوهيدرات معقدة (أرز بني، شوفان، حبوب كاملة)\n  - دهون صحية (مكسرات، أفوكادو، زيت زيتون)\n  - فواكه قليلة السكر (تفاح، توت، كمثرى)\n• ❌ **تجنب تماماً:**\n  - سكريات وحلويات\n  - مشروبات محلاة وعصائر\n  - أرز أبيض وخبز أبيض\n  - معجنات ومخبوزات\n  - بطاطس مقلية\n  - أكل مصنع\n\n💡 **نصائح التحكم بالسكر:**\n• وجبات صغيرة متعددة (5-6 يومياً)\n• لا تهمل وجبات\n• تناول بروتين مع كل وجبة\n• ألياف كثيرة\n• اشرب ماء كافي\n\n💪 **الرياضة (ضرورية!):**\n• 150 دقيقة أسبوعياً\n• مشي سريع بعد الأكل مباشرة (30 دقيقة)\n• تمارين مقاومة 2-3 مرات أسبوعياً\n• تخفض السكر بدون دواء!\n\n⚠️ **مضاعفات خطيرة (لو لم يُتحكم به):**\n• أمراض قلب وجلطات\n• فشل كلوي\n• فقدان بصر (شبكية)\n• تلف أعصاب وبتر\n• ضعف جنسي\n\n🚨 **طوارئ:**\n• **هبوط سكر (أقل من 70):**\n  - اشرب عصير أو 3 ملاعق سكر فوراً\n  - أعد القياس بعد 15 دقيقة\n• **ارتفاع شديد (فوق 300):**\n  - اشرب ماء كثير\n  - اتصل بطبيب\n  - راجع طوارئ لو غثيان/قيء\n\n💡 **متابعة دورية:**\n• طبيب كل 3 شهور\n• تحليل تراكمي كل 3 شهور\n• فحص عيون سنوي\n• فحص قدمين شهري\n• تحاليل كلى ودهون سنوياً",
    drugs: ["ميتفورمين 1000mg مرتين يومياً","جانوميت حسب الطبيب","فحص سكر منتظم","نظام حياة هو الأساس"]
  },

  "ضغط_دم": {
    keywords: [
      "ضغط","ضغط دم","hypertension","ضغط عالي","ضغط مرتفع",
      "راسي تقيل","دايخ","صداع مستمر","خفقان","ضغطي عالي",
      "ارتفاع ضغط الدم","ضغط الدم","ضغط مش مظبوط","قلبي بيدق",
      "صداع خلفي","دوخة وصداع","ضغطي مش مضبوط","خفقان قلب",
      "راسي بتوجعني","ضغط مرتفع مزمن","ضغط غير منتظم","ضغطي واطي",
      "ضغط منخفض","دايخ لما بقوم","ضغط دم مرتفع","ضغط دم عالي"
    ],
    response: "📋 **ارتفاع ضغط الدم:**\n\n🔹 **القراءات:**\n• طبيعي: أقل من 120/80\n• مرحلة 1: 130-139 / 80-89\n• مرحلة 2: 140+ / 90+\n• أزمة: 180+ / 120+ (طوارئ!)\n\n💊 **العلاج الدوائي:**\n• **أشهر الأدوية:**\n  - كونكور (Concor) - حاصر بيتا\n  - نورفاسك (Norvasc) - حاصر كالسيوم\n  - كوفرسيل (Coversyl) - ACE inhibitor\n  - ديوفان (Diovan) - ARB\n  - مدر بول خفيف (هيدروكلوروثيازيد)\n• **مهم:** لا توقف الدواء بدون طبيب!\n• القياس المنتظم ضروري\n\n🍎 **نظام DASH الغذائي:**\n• ✅ **أكثر من:**\n  - خضار وفواكه (8-10 حصص يومياً)\n  - حبوب كاملة\n  - بروتين خفيف (سمك، فراخ بدون جلد)\n  - مكسرات وبقوليات\n  - منتجات ألبان قليلة الدسم\n  - بوتاسيوم (موز، بطاطس، سبانخ)\n• ❌ **قلل:**\n  - **ملح (أهم شيء!): أقل من 5 جم يومياً**\n  - لحوم حمراء\n  - حلويات ومشروبات سكرية\n  - دهون مشبعة\n  - أكل معلب ومصنع\n  - مخللات وزيتون\n\n💪 **نمط حياة (بنفس أهمية الدواء!):**\n• **رياضة:** 150 دقيقة أسبوعياً (مشي سريع)\n• **وزن صحي:** خسارة 5 كجم تخفض الضغط 5-10 نقاط\n• **توقف تدخين:** فوري!\n• **قلل كافيين:** 1-2 فنجان فقط\n• **نوم كافي:** 7-8 ساعات\n• **إدارة توتر:** تأمل، يوغا، تنفس عميق\n• **تجنب كحول**\n\n📊 **قياس منزلي:**\n• اشتري جهاز ضغط منزلي موثوق\n• قس مرتين يومياً (صباح ومساء)\n• بعد راحة 5 دقائق\n• سجل القراءات\n• خذها لطبيبك\n\n⚠️ **طوارئ فوراً لو:**\n• ضغط 180/120 أو أكثر\n• صداع شديد مفاجئ\n• ألم صدر\n• ضيق تنفس\n• تشوش رؤية\n• تنميل أو ضعف\n• دوخة شديدة\n(علامات أزمة ارتفاع ضغط - خطر جلطة!)\n\n💡 **متابعة:**\n• طبيب كل 3-6 شهور\n• تحاليل دورية (كلى، بوتاسيوم)\n• فحص قلب سنوي\n• فحص عيون (الضغط يؤثر على الشبكية)",
    drugs: ["كونكور 5mg أو 10mg","نورفاسك 5mg","كوفرسيل 5mg","نظام حياة أهم من الدواء"]
  }, 
"افرازات_مهبلية": {
    keywords: ["افرازات مهبلية", "افرازات غريبة", "رائحة مهبلية", "حكة نسائية"],
    response: "📋 **الإفرازات المهبلية:**\n\n🔹 **الطبيعي:**\n• إفرازات بيضاء/شفافة بدون رائحة\n• تزيد أثناء التبويض (شفافة ومطاطية)\n• تزيد قبل الدورة\n\n🔹 **غير الطبيعي:**\n• **إفرازات بيضاء سميكة + حكة:**\n  - فطريات مهبلية\n  - علاج: كانستن لبوس، فلوكونازول\n• **إفرازات رمادية + رائحة سمك:**\n  - التهاب بكتيري\n  - علاج: فلاجيل\n• **إفرازات صفراء/خضراء + حكة:**\n  - عدوى منقولة\n  - علاج: مضاد حيوي\n\n💊 **العلاج المنزلي:**\n• **نظافة شخصية:**\n  - غسل خارجي بماء فقط\n  - لا غسول مهبلي داخلي\n• **ملابس قطنية فضفاضة**\n• **بروبيوتيك:** زبادي طبيعي\n• **تجنب:**\n  - صابون معطر\n  - فقاعات حمام\n  - ملابس ضيقة\n\n⚠️ **راجعي طبيبة لو:**\n• حكة شديدة\n• رائحة كريهة\n• ألم أثناء الجماع\n• نزيف بين الدورات\n• حمى\n• ألم بطن",
    drugs: ["كانستن لبوس", "فلوكونازول 150mg", "بروبيوتيك", "نظافة شخصية"]
},

// ════════════════════════════════════════════════════════════════
// 🧓 أمراض كبار السن
// ════════════════════════════════════════════════════════════════

"نسيان_كبار_سن": {
    keywords: ["نسيان كتير", "فقدان ذاكرة", "مش فاكر حاجة", "خرف", "alzheimer"],
    response: "📋 **فقدان الذاكرة وكبار السن:**\n\n🔹 **النسيان الطبيعي مع التقدم في العمر:**\n• نسيان أسماء أحياناً\n• نسيان أين وضعت المفاتيح\n• صعوبة تذكر كلمة معينة\n• **طبيعي ولا يعيق الحياة**\n\n🔹 **علامات تحذيرية (قد تكون ألزهايمر):**\n• **نسيان أحداث حديثة تماماً**\n• **تكرار نفس السؤال**\n• **التيه في أماكن مألوفة**\n• **صعوبة في المهام اليومية** (الطبخ، القيادة)\n• **تغيرات في الشخصية** (عدوانية، شك)\n• **وضع أشياء في أماكن غريبة** (مفاتيح في الثلاجة)\n\n💊 **تحسين الذاكرة:**\n• **تمارين ذهنية:** ألغاز، قراءة، كلمات متقاطعة\n• **رياضة:** مشي 30 دقيقة يومياً\n• **نوم كافي:** 7-8 ساعات\n• **تغذية صحية:**\n  - أوميجا 3 (سمك)\n  - مكسرات\n  - خضروات ورقية\n  - توت\n• **تواصل اجتماعي:** لا عزلة\n• **ضبط:** سكر، ضغط، كوليسترول\n• **فيتامينات:** B12، D\n\n⚠️ **راجع طبيب أعصاب لو:**\n• نسيان يزداد سوءاً بسرعة\n• يؤثر على الحياة اليومية\n• تغيرات شخصية واضحة\n• تشوش وهلوسة\n\n💡 **الكشف المبكر مهم جداً!**",
    drugs: ["فحص طبي شامل", "تمارين ذهنية", "فيتامين B12", "أوميجا 3"]
},

"سقوط_مسنين": {
    keywords: ["طاح", "وقع", "سقط", "كسر ورك مسن", "دوخة مسن"],
    response: "📋 **السقوط عند كبار السن:**\n\n🔹 **أسباب شائعة:**\n• ضعف عضلات الساقين\n• مشاكل توازن\n• انخفاض ضغط مفاجئ\n• أدوية (منومات، مدرات بول)\n• مشاكل بصر\n• أرضيات زلقة أو سجاد\n• إضاءة ضعيفة\n\n⚠️ **خطورة السقوط:**\n• كسر الورك (خطير جداً!)\n• كسور معصم\n• إصابات رأس\n• خوف من الحركة\n\n🛡️ **الوقاية (مهمة جداً!):**\n• **تمارين تقوية:** مشي، تمارين توازن\n• **فحص بصر:** نظارة مناسبة\n• **مراجعة الأدوية:** مع طبيب\n• **تعديل المنزل:**\n  - إضاءة جيدة (خاصة ليلاً)\n  - مقابض في الحمام\n  - إزالة سجاد صغير\n  - أرضيات غير زلقة\n  - كرسي في الحمام\n  - عصا أو مشاية للمشي\n• **أحذية مناسبة:** نعل مطاطي\n• **قياس ضغط:** يومياً\n\n💊 **بعد السقوط:**\n• **افحص:** كسور، كدمات، جروح\n• **راقب:** صداع، دوخة، قيء (علامات ارتجاج)\n• **اتصل بطبيب** حتى لو لم يكن هناك إصابة ظاهرة\n\n⚠️ **طوارئ فوراً لو:**\n• ألم شديد في الورك/الساق (شك في كسر)\n• عدم قدرة على الوقوف\n• إصابة في الرأس\n• فقدان وعي\n• نزيف لا يتوقف",
    drugs: ["تمارين توازن", "فيتامين D وكالسيوم", "فحص بصر", "تعديل المنزل"]
},

// ════════════════════════════════════════════════════════════════
// 💉 أمراض مزمنة شائعة
// ════════════════════════════════════════════════════════════════

"فشل_كلوي_مزمن": {
    keywords: ["فشل كلوي", "كلى ضعيفة", "كرياتينين عالي", "غسيل كلى", "kidney failure"],
    response: "📋 **الفشل الكلوي المزمن (CKD):**\n\n🔹 **الأسباب الرئيسية:**\n• سكري (السبب الأول!)\n• ضغط دم\n• التهاب كلى مزمن\n• تكيس كلى\n• انسداد مجرى بولي\n\n🔹 **الأعراض (في المراحل المتأخرة):**\n• تعب شديد وضعف\n• تورم قدمين ووجه\n• قلة أو كثرة بول\n• غثيان وفقدان شهية\n• ضيق تنفس\n• حكة جلدية\n• طعم معدني في الفم\n\n💊 **العلاج:**\n• **ضبط السبب:** سكر وضغط (الأهم!)\n• **أدوية ضغط:** ACE inhibitors (تحمي الكلى)\n• **مقيدات فوسفور:** لو الفوسفور عالي\n• **علاج أنيميا:** إريثروبويتين، حديد\n• **فيتامين D**\n• **المراحل النهائية:**\n  - غسيل كلى (3 مرات أسبوعياً)\n  - زراعة كلى (الحل الأمثل)\n\n🍎 **النظام الغذائي (مهم جداً!):**\n• **قلل:**\n  - بروتين (لحوم، بيض)\n  - ملح (أقل من 5 جرام)\n  - بوتاسيوم (موز، بطاطس، طماطم)\n  - فوسفور (ألبان، مكسرات، مشروبات غازية)\n• **اشرب:** حسب تعليمات الطبيب (قد يُقيد السوائل)\n\n🔬 **فحوصات دورية:**\n• وظائف كلى (كرياتينين، BUN)\n• كالسيوم وفوسفور\n• صورة دم\n• كل 3-6 شهور\n\n⚠️ **طوارئ لو:**\n• تورم شديد مفاجئ\n• ضيق تنفس شديد\n• ارتباك وتشوش\n• قيء مستمر\n• عدم تبول لأكثر من 8 ساعات",
    drugs: ["ضبط سكر وضغط", "مقيدات فوسفور", "حمية قليلة البروتين", "غسيل كلى"]
},

"تليف_كبد": {
    keywords: ["تليف كبد", "كبد ضعيف", "liver cirrhosis", "يرقان", "استسقاء"],
    response: "📋 **تليف الكبد (Liver Cirrhosis):**\n\n🔹 **الأسباب:**\n• التهاب كبدي فيروسي (B, C)\n• كحول\n• كبد دهني\n• أمراض مناعية\n• أدوية معينة\n\n🔹 **الأعراض:**\n• **مبكراً:** تعب، فقدان شهية\n• **متقدم:**\n  - يرقان (اصفرار عينين وجلد)\n  - استسقاء (انتفاخ بطن بسائل)\n  - تورم ساقين\n  - نزيف لثة وكدمات سهلة\n  - تغير في الشخصية (اعتلال دماغي)\n  - حكة جلدية\n  - بول غامق، براز فاتح\n\n💊 **العلاج:**\n• **علاج السبب:**\n  - أدوية فيروس C (شفاء تام!)\n  - توقف تام عن كحول\n• **أدوية:**\n  - مدرات بول (للاستسقاء)\n  - لاكتيلوز (للاعتلال الدماغي)\n  - حاصرات بيتا (لمنع نزيف دوالي المريء)\n• **منظار دوري:** للكشف عن دوالي المريء\n• **زراعة كبد:** الحل النهائي\n\n🍎 **النظام الغذائي:**\n• **لا كحول نهائياً!**\n• قلل ملح (للاستسقاء)\n• بروتين معتدل (لو اعتلال دماغي قلله)\n• وجبات صغيرة متعددة\n• فيتامينات متعددة\n\n⚠️ **طوارئ فوراً لو:**\n• قيء دموي أو براز أسود (نزيف دوالي)\n• ارتباك شديد\n• يرقان شديد مفاجئ\n• حمى + ألم بطن (التهاب استسقاء)\n• عدم تبول",
    drugs: ["علاج الفيروس", "مدرات بول", "لاكتيلوز", "متابعة دورية"]
}, 
"صداع": {
    keywords: ["صداع","headache",],
    response: "📋 **الصداع وأنواعه الشائعة:**\n\n🔹 **صداع التوتر (الأشيع):**\n• ألم خفيف إلى متوسط حول الرأس كحزام ضاغط.\n• لا يزيد مع المجهود.\n• **العلاج:** مسكنات (باراسيتامول/إيبوبروفين)، تدليك الرقبة والكتفين، راحة، تقليل التوتر.\n\n🔹 **الصداع النصفي (الشقيقة):**\n• ألم نابض وشديد في نصف الرأس.\n• قد يرافقه غثيان، قيء، وحساسية للضوء والصوت.\n• **العلاج:** أدوية التريبتان (إيميتركس)، مسكنات قوية، تجنب المثيرات (أطعمة، ضوء، نوم قليل).\n\n🔹 **صداع الجيوب الأنفية:**\n• ألم وضغط في الوجه والجبهة، يزيد عند الانحناء.\n• **العلاج:** غسيل الأنف، بخاخ كورتيزون، مسكنات، علاج التهاب الجيوب.\n\n⚠️ **راجع طبيب طوارئ فوراً لو:**\n• أسوأ صداع في حياتك (صاعق).\n• صداع مع حمى، تيبس رقبة، أو قيء قذفي.\n• صداع مع تغير في الرؤية أو تنميل مفاجئ.\n• صداع يزيد تدريجياً ولا يستجيب للمسكنات.\n\n💡 **نصائح:** شرب ماء كافي، نوم منتظم، تمارين رياضية، تقليل كافيين.\n",
    drugs: ["باراسيتامول 500mg","إيبوبروفين 400mg","إيميتركس للصداع النصفي","تجنب المثيرات"]
},
"عرق_نسا": {
    keywords: ["عرق نسا","sciatica","ألم ظهر","ألم ساق","انزلاق غضروفي","ديسك"],
    response: "📋 **عرق النسا (Sciatica):**\n\n🔹 **الأسباب:** انضغاط العصب الوركي (الأشيع: انزلاق غضروفي).\n\n🔹 **الأعراض:**\n• ألم حاد ينتقل من أسفل الظهر أو الأرداف إلى أسفل الساق والقدم.\n• تنميل أو وخز أو ضعف في الساق أو القدم.\n• يزيد الألم مع الجلوس أو السعال أو العطس.\n\n💊 **العلاج:**\n• **مسكنات ومضادات التهاب:** إيبوبروفين، ديكلوفيناك.\n• **مرخيات عضلية:** (مثل مايولجين).\n• **جلسات علاج طبيعي** لتقوية العضلات الأساسية.\n• **حقن كورتيزون** في العمود الفقري (حالات شديدة).\n\n💪 **نمط حياة:**\n• **استمرار الحركة:** لا للراحة المطلقة.\n• تجنب حمل الأشياء الثقيلة.\n• **تمارين إطالة** خاصة بالعصب الوركي (استشر مختص).\n• نوم على الجانب مع وسادة بين الركبتين.\n\n⚠️ **راجع طبيب طوارئ لو:**\n• ضعف شديد مفاجئ في الساقين (لا تستطيع رفع القدم).\n• فقدان التحكم في البول أو البراز (متلازمة ذنب الفرس).\n• ألم يزداد سوءاً بشكل لا يحتمل.\n",
    drugs: ["إيبوبروفين 400mg","مرخيات عضلية","علاج طبيعي","تجنب الجلوس الطويل"]
},
"فشل_كلوي": {
    keywords: ["فشل كلوي","كلى","قصور كلوي","غسيل كلوي","kidney failure"],
    response: "📋 **الفشل الكلوي المزمن (Chronic Kidney Disease):**\n\n🔹 **الأعراض (في المراحل المتأخرة):**\n• تورم في الساقين والقدمين وحول العينين.\n• غثيان، قيء، وفقدان شهية.\n• تعب شديد وتغيرات في النوم.\n• ارتفاع ضغط الدم (عادة ما يكون هو السبب أو النتيجة).\n• بول أقل أو أكثر.\n\n💊 **العلاج:**\n• **ضبط السبب:** علاج السكري وضغط الدم (الأسباب الرئيسية).\n• **أدوية لضغط الدم:** ACE inhibitors (كوفرسيل) أو ARBs (ديوفان).\n• **مقيدات الفوسفور** (لو كان مرتفعاً).\n• **إريثروبويتين** لعلاج الأنيميا المصاحبة.\n• **المراحل النهائية:** غسيل كلى (ديلزة) أو زراعة كلى.\n\n🍎 **النظام الغذائي:**\n• تقليل **الملح والصوديوم** جداً.\n• تقليل **البوتاسيوم** (موز، بطاطس، طماطم).\n• تقليل **الفسفور** (ألبان، مكسرات).\n• تقليل **البروتين** (اللحوم) حسب المرحلة.\n• تقليل **السوائل** (حسب تعليمات الطبيب).\n\n⚠️ **الوقاية:** ضبط سكر الدم وضغط الدم، تجنب مسكنات (NSAIDs) مثل إيبوبروفين.\n",
    drugs: ["مراقبة ضغط الدم والسكر","أدوية ضغط","تقييد البروتين","غسيل كلوي (مراحل متأخرة)"]
},
"هشاشة": {
    keywords: ["هشاشة عظام","عظام","نقص كالسيوم","كسور","osteoporosis"],
    response: "📋 **هشاشة العظام (Osteoporosis):**\n\n🔹 **التعريف:** ضعف في كثافة العظام يجعلها عرضة للكسور بسهولة (خاصة الورك، العمود الفقري، الرسغ).\n\n🔹 **الأعراض:**\n• لا أعراض حتى يحدث كسر (المرض الصامت).\n• فقدان تدريجي للطول.\n• انحناء في الظهر (حداب).\n\n💊 **العلاج:**\n• **كالسيوم:** 1000-1200mg يومياً (طعام أو مكمل).\n• **فيتامين D:** 800-2000 وحدة يومياً (ضروري لامتصاص الكالسيوم).\n• **أدوية بناء عظام:** بيسفوسفونات (مثل فوزاماكس) أو دينوسوماب.\n\n💪 **نمط حياة:**\n• **رياضة حمل الوزن:** مشي، جري خفيف، رفع أثقال خفيفة (تقوي العظام).\n• توقف عن **التدخين والكحول**.\n• تجنب السقوط (إضاءة جيدة، تجنب السجاد).\n\n🔬 **التشخيص:** قياس كثافة العظام (DEXA Scan).\n",
    drugs: ["كالسيوم 1000mg","فيتامين D 2000 IU","فوزاماكس","رياضة حمل الوزن"]
},
"التهاب_أذن": {
    keywords: ["التهاب أذن","أذن","ألم أذن","صملاخ","ear ache"],
    response: "📋 **التهاب الأذن الوسطى والخارجية:**\n\n🔹 **التهاب الأذن الوسطى (الأشيع):**\n• ألم أذن شديد، حمى، فقدان سمع مؤقت، سائل يخرج من الأذن (لو انثقبت الطبلة).\n• **الأسباب:** غالباً عدوى فيروسية أو بكتيرية بعد برد أو إنفلونزا.\n• **العلاج:** أموكسيسيلين مضاد حيوي (لو بكتيري)، مسكنات، كمادات دافئة، بخاخ أنف لإزالة الاحتقان.\n\n🔹 **التهاب الأذن الخارجية (أذن السباح):**\n• ألم عند لمس أو تحريك الأذن الخارجية، حكة، احمرار.\n• **الأسباب:** ماء ملوث (عادة بعد السباحة).\n• **العلاج:** قطرات أذن تحتوي على مضاد حيوي أو كورتيزون، تجفيف الأذن جيدا بعد الماء.\n\n⚠️ **راجع طبيب لو:** ألم شديد مستمر، فقدان سمع، سائل يخرج من الأذن، دوخة شديدة.\n",
    drugs: ["أموكسيسيلين (وسطى)","قطرات مضاد حيوي (خارجية)","مسكنات (باراسيتامول)","كمادات دافئة"]
},
"صدفية": {
    keywords: ["صدفية","psoriasis","بقع حمراء","قشور جلدية","جلد"],
    response: "📋 **الصدفية (Psoriasis):**\n\n🔹 **التعريف:** مرض مناعي ذاتي مزمن يسبب تسارع نمو خلايا الجلد، مما يؤدي لتكوين بقع سميكة حمراء مغطاة بقشور فضية.\n\n🔹 **الأعراض:**\n• بقع جلدية حمراء سميكة، ومغطاة بقشور فضية.\n• حكة، حرقان، أو ألم.\n• أشيع في المرفقين، الركبتين، فروة الرأس، وأسفل الظهر.\n• قد يصيب الأظافر والمفاصل (التهاب المفاصل الصدفي).\n\n💊 **العلاج:**\n• **موضعي (للحالات الخفيفة):** كريمات كورتيزون، كريمات فيتامين D (دايفونيكس)، مرطبات سميكة.\n• **علاج ضوئي:** (PUVA أو UVB).\n• **جهازي (للحالات الشديدة):** ميثوتريكسات، بيولوجيك (مثل هيوميرا).\n\n💡 **نصائح:** حمام يومي فاتر، ترطيب الجلد جيداً بعد الحمام، التعرض للشمس باعتدال، تجنب التوتر.\n",
    drugs: ["كريمات كورتيزون موضعية","دايفونيكس كريم","ميثوتريكسات (شديد)","ترطيب مستمر"]
},
"فوبيا": {
    keywords: ["فوبيا","خوف مرضي","قلق","رهاب","نوبة ذعر","خوف"],
    response: "📋 **الفوبيا (Phobia) ونوبات الهلع (Panic Attack):**\n\n🔹 **الفوبيا:** خوف شديد وغير منطقي من شيء أو موقف محدد (مثل المرتفعات، الأماكن المغلقة، الحيوانات).\n\n🔹 **نوبة الهلع:** شعور مفاجئ وشديد بالخوف أو الكارثة، قد يصحبه:\n• خفقان قلب شديد وسرعة نبض.\n• ضيق تنفس وشعور بالاختناق.\n• ألم أو ضغط في الصدر (كأنه نوبة قلبية).\n• غثيان، دوخة، أو تنميل.\n\n💊 **العلاج:**\n• **علاج نفسي معرفي سلوكي (CBT):** العلاج الأول والأكثر فعالية.\n• **تعرض منظم:** مواجهة المخاوف تدريجياً.\n• **أدوية:** مضادات اكتئاب (SSRIs)، وأحياناً بنزوديازيبينات (لفترة قصيرة).\n\n💪 **إدارة النوبة:**\n• **تنفس بطيء عميق:** 4 ثواني شهيق، 6 ثواني زفير.\n• التركيز على شيء ملموس حولك.\n• تذكر أنها نوبة مؤقتة وستنتهي.\n\n⚠️ **اطلب مساعدة فورية لو كانت النوبات متكررة أو تؤثر على الحياة اليومية.**\n",
    drugs: ["CBT (العلاج السلوكي)","مضادات اكتئاب (SSRIs)","تقنيات تنفس","استشارة طبيب نفسي"]
},
"تصلب_لويحي": {
    keywords: ["تصلب لويحي","ms","تصلب متعدد","مناعي ذاتي","ضعف عضلات"],
    response: "📋 **التصلب اللويحي المتعدد (Multiple Sclerosis - MS):**\n\n🔹 **التعريف:** مرض مناعي ذاتي يهاجم الغلاف الواقي للأعصاب (الميالين) في الدماغ والحبل الشوكي، مما يسبب مشكلات في التواصل بين الدماغ وباقي الجسم.\n\n🔹 **الأعراض (تختلف كثيراً):**\n• تنميل أو ضعف في الأطراف (عادة جانب واحد).\n• مشكلات في الرؤية (رؤية مزدوجة أو ضبابية، ألم مع حركة العين).\n• دوخة، تعب، ومشكلات في المشي والتوازن.\n• فقدان التحكم في المثانة والأمعاء.\n\n💊 **العلاج:**\n• **علاج الهجمات الحادة:** كورتيزون بجرعات عالية (ميثيل بريدنيزولون).\n• **علاج تعديل المرض (DMT):** إنترفيرون، أوكرليزوماب (يقلل تكرار الهجمات).\n• **علاج الأعراض:** مرخيات عضلية، مسكنات، أدوية للتعب.\n\n💪 **نصائح:** علاج طبيعي، تبريد الجسم، إدارة التوتر، حمية غذائية صحية.\n\n⚠️ **متابعة دورية مع طبيب أعصاب ضرورية جداً.**\n",
    drugs: ["كورتيزون (للهجمة)","إنترفيرون","علاج طبيعي","إدارة التعب"]
},
"حساسية_طعام": {
    keywords: ["حساسية طعام","حساسية","peanut allergy","لاكتوز","جلوتين"],
    response: "📋 **حساسية الطعام:**\n\n🔹 **الأشيع:** حليب، بيض، قمح (جلوتين)، صويا، مكسرات (فول سوداني)، أسماك، قشريات.\n\n🔹 **الأعراض (عادة تظهر فوراً):**\n• **جلدية:** حكة، احمرار، طفح جلدي (ارتكاريا).\n• **هضمية:** قيء، إسهال، مغص بطن.\n• **تنفسية:** عطس، رشح، صفير، ضيق تنفس (أخطر شيء).\n\n🚨 **صدمة الحساسية (Anaphylaxis):**\n• أعراض شديدة ومفاجئة تهدد الحياة (تورم الحلق، صعوبة التنفس، هبوط الضغط).\n• **العلاج الفوري:** حقن **إبينفرين** (أدرينالين) فوراً (قلم الإبيبن).\n\n💊 **العلاج العام:**\n• مضاد هيستامين (كلاريتين، زيرتك) للأعراض الخفيفة.\n• تجنب الطعام المسبب بشكل كامل.\n• حمل قلم الإبينفرين دائماً لو كانت الحساسية شديدة.\n\n🔬 **التشخيص:** اختبار وخز الجلد، تحليل دم (IgE).\n",
    drugs: ["مضاد هيستامين","قلم إبينفرين (طوارئ)","تجنب الطعام المسبب","اختبار حساسية"]
},
"صمم_أذن": {
    keywords: ["صمم","فقدان سمع","ضعف سمع","deafness","سمع"],
    response: "📋 **ضعف/فقدان السمع (Hearing Loss):**\n\n🔹 **الأنواع:**\n• **توصيلي:** مشكلة في الأذن الخارجية أو الوسطى (شمع، سائل خلف الطبلة).\n• **حسي عصبي:** مشكلة في الأذن الداخلية أو العصب السمعي (أشيع مع تقدم العمر والضوضاء).\n\n🔹 **الأسباب:**\n• شمع أذن متراكم (الأشيع والأسهل علاجاً).\n• عدوى أذن.\n• شيخوخة.\n• ضوضاء عالية جداً لفترة طويلة.\n• أدوية معينة (بعض المضادات الحيوية).\n\n💊 **العلاج:**\n• **توصيلي:** إزالة الشمع، علاج الالتهاب، جراحة (لو مشكلة في العظيمات).\n• **حسي عصبي:** لا يوجد علاج دوائي، الحل هو **سماعات الأذن الطبية** أو زراعة قوقعة.\n\n💡 **الوقاية:**\n• تجنب الضوضاء العالية (استخدام سدادات أذن).\n• لا تدخل أعواد قطن في الأذن.\n• فحص سمع دوري.\n\n⚠️ **راجع طبيب أذن فوراً لو:** فقدان سمع مفاجئ في أذن واحدة.\n",
    drugs: ["قطرات لإذابة الشمع","مضاد التهاب","سماعات أذن طبية","حماية من الضوضاء"]
},
  /* ========== أمراض العيون ========== */

  "رمد": {
    keywords: ["رمد","conjunctivitis","التهاب ملتحمة","عين حمراء","صديد عين"],
    response: "📋 **التهاب الملتحمة (Conjunctivitis/الرمد):**\n\n🔹 **الأنواع:**\n• **فيروسي (الأشيع):**\n  - عين حمراء ودامعة\n  - إفرازات مائية\n  - معدي جداً\n  - يزول لوحده خلال أسبوع\n• **بكتيري:**\n  - إفرازات صفراء/خضراء سميكة\n  - عين ملتصقة بالصباح\n  - يحتاج مضاد حيوي\n• **حساسية:**\n  - حكة شديدة\n  - دموع\n  - في العينين معاً\n  - موسمي\n\n💊 **العلاج:**\n• **فيروسي:**\n  - كمادات باردة\n  - دموع صناعية\n  - ينتهي لوحده\n• **بكتيري:**\n  - قطرة مضاد حيوي:\n    * كلورامفينيكول\n    * توبراميسين (Tobrex)\n    * موكسيفلوكساسين (Vigamox)\n  - 4-6 مرات يومياً\n  - 5-7 أيام\n• **حساسية:**\n  - قطرة مضاد هيستامين (Patanol)\n  - كمادات باردة\n  - تجنب المثيرات\n\n🏠 **العناية المنزلية:**\n• كمادات ماء دافئ أو بارد\n• نظف الإفرازات بقطن معقم\n• دموع صناعية بدون مواد حافظة\n• لا تضع عدسات لاصقة\n• لا مكياج\n• نظافة شخصية ممتازة\n\n🚫 **منع العدوى:**\n• اغسل يديك كثيراً\n• لا تلمس أو تفرك عينيك\n• لا تشارك مناشف أو وسائد\n• غير وسادة يومياً\n• نظف نظارات\n• ارمي مكياج عيون قديم\n• ابق بالبيت (معدي لمدة أسبوع)\n\n⚠️ **راجع طبيب فوراً لو:**\n• ألم عين شديد\n• تشوش رؤية\n• حساسية شديدة للضوء\n• إفرازات كثيفة جداً\n• لا تحسن خلال 3-4 أيام\n• عند حديثي الولادة (خطير!)\n\n💡 **للرضع:**\n• رمد الولادة (Ophthalmia neonatorum)\n• خطير جداً\n• طوارئ فورية\n• قد يسبب عمى",
    drugs: ["قطرة توبريكس","كمادات باردة","دموع صناعية","نظافة شخصية"]
  },
"التهاب_رئوي": {
    keywords: ["التهاب رئوي","pneumonia","رئه","صدر","حمى وكحة","بكتيري"],
    response: "📋 **التهاب الرئة (Pneumonia):**\n\n🔹 **الأعراض:**\n• حمى عالية وقشعريرة\n• كحة ببلغم (أصفر، أخضر، أو صدأ)\n• ضيق تنفس وألم صدر مع التنفس\n• تعب وإرهاق\n• سرعة نبض\n\n💊 **العلاج:**\n• **مضاد حيوي فوري:** (أموكسيسيلين، أزيثروميسين) - حسب النوع\n• **راحة تامة**\n• شرب سوائل دافئة\n• أكسجين (لو ضيق شديد)\n• **خافض حرارة:** باراسيتامول\n\n⚠️ **طوارئ:** لو ضيق نفس شديد، شفاه زرقاء، تشوش ذهني.\n",
    drugs: ["أموكسيسيلين","أزيثروميسين","باراسيتامول","سوائل دافئة"]
},
"التهاب_لوز": {
    keywords: ["التهاب لوز","tonsillitis","لوز","حلق ملتهب","بقع بيضاء"],
    response: "📋 **التهاب اللوزتين (Tonsillitis):**\n\n🔹 **الأعراض:**\n• ألم شديد في الحلق وصعوبة بلع\n• لوز متورمة وحمراء (قد توجد بقع بيضاء/صديد)\n• حمى ورائحة فم كريهة\n• تضخم الغدد الليمفاوية في الرقبة\n\n💊 **العلاج:**\n• **لو بكتيري:** مضاد حيوي (أموكسيسيلين) لمدة 10 أيام كاملة\n• **لو فيروسي:** مسكنات، غرغرة ماء ملح، سوائل دافئة\n• **للألم:** إيبوبروفين أو باراسيتامول\n\n⚠️ **راجع طبيب لو:** حمى فوق 39°، لا تستطيع بلع ريقك، أو تورم كبير في جانب واحد.\n",
    drugs: ["أموكسيسيلين 10 أيام","إيبوبروفين","غرغرة ماء ملح","سوائل دافئة"]
},
"انقطاع_تنفس": {
    keywords: ["انقطاع تنفس","توقف تنفس","شخير","نوم متقطع","apnea"],
    response: "📋 **انقطاع التنفس أثناء النوم (Sleep Apnea):**\n\n🔹 **الأعراض:**\n• شخير عالي جداً\n• توقف ملحوظ في التنفس أثناء النوم (يلاحظه الشريك)\n• اختناق أو لهث ليلاً\n• نعاس نهاري شديد وصداع صباحي\n• تعب وضعف تركيز\n\n💊 **العلاج:**\n• **جهاز CPAP:** (الخيار الأول للحالات المتوسطة والشديدة)\n• **جهاز فموي** (للحالات الخفيفة)\n• **جراحة** (لو كان السبب تضخم لوز أو لحمية)\n\n💡 **نصائح:** خسارة وزن، النوم على الجانب، تجنب الكحول والمنومات.\n",
    drugs: ["جهاز CPAP","خسارة وزن","نوم على الجنب","استشارة طبيب نوم"]
},
"حساسية_أنف": {
    keywords: ["حساسية أنف","جيوب","رشح","عطس","احتقان","hay fever"],
    response: "📋 **حساسية الأنف (Allergic Rhinitis):**\n\n🔹 **الأعراض:**\n• عطس متكرر (خاصة صباحاً)\n• سيلان أنف مائي شفاف\n• حكة في الأنف والعين والحلق\n• احتقان أنف متقطع\n• هالات سوداء تحت العينين\n\n💊 **العلاج:**\n• **مضاد هيستامين:** (كلاريتين، زيرتك، تيلفاست)\n• **بخاخ كورتيزون أنفي:** (فليكسونيز، أفاميس) - فعال جداً\n• **بخاخ كرومولين**\n\n💡 **الوقاية:** تجنب المثيرات (غبار، عطور)، غسيل الأنف بمحلول ملحي، استخدام فلتر هواء.\n",
    drugs: ["بخاخ فليكسونيز","كلاريتين أقراص","محلول ملحي","تجنب المثيرات"]
},
"التهاب_شعب": {
    keywords: ["التهاب شعب","شعب هوائية","bronchitis","كحة مستمرة","سعال"],
    response: "📋 **التهاب الشعب الهوائية (Bronchitis):**\n\n🔹 **الأعراض:**\n• كحة مستمرة (جافة ثم ببلغم أصفر/أخضر)\n• صفير وضيق صدر خفيف\n• حمى منخفضة، تعب، آلام جسم\n• الأعراض تستمر 1-3 أسابيع\n\n💊 **العلاج:**\n• **راحة وسوائل دافئة**\n• **خافض حرارة/مسكن:** باراسيتامول\n• **موسع شعبي:** (فنتولين) لو كان هناك صفير\n• **مضاد حيوي:** نادرًا (لو كان بكتيري ومستمر)\n\n💡 **مهم:** غالباً فيروسي ولا يحتاج مضاد حيوي.\n",
    drugs: ["سوائل دافئة","باراسيتامول","فنتولين (للسعال)","راحة"]
},
  "تسمم_غذائي": {
    keywords: ["تسمم غذائي","food poisoning","مغص وقيء","أكل فاسد","معدة"],
    response: "📋 **التسمم الغذائي (Food Poisoning):**\n\n🔹 **الأعراض:**\n• غثيان وقيء وإسهال مفاجئ وشديد\n• مغص بطن قوي\n• حمى وقشعريرة\n• يبدأ خلال ساعات من تناول الطعام الملوث\n\n💊 **العلاج:**\n• **أهم شيء: الترطيب ومحلول ORS**\n• **راحة تامة**\n• مضاد قيء (بريمبيران)\n• مطهر معوي (أنتينال) - في بعض الحالات\n• نظام غذائي خفيف (موز، أرز، خبز)\n\n⚠️ **طوارئ:** لو قيء مستمر، جفاف شديد، دم في البراز.\n",
    drugs: ["محلول ORS","بريمبيران","أنتينال","راحة"]
},
"بواسير_خارجية": {
    keywords: ["بواسير خارجية","تورم شرجي","ألم عند التبرز","hemorrhoids"],
    response: "📋 **البواسير الخارجية (External Hemorrhoids):**\n\n🔹 **الأعراض:**\n• كتلة أو تورم مؤلم حول فتحة الشرج\n• ألم وحكة وحرقان\n• قد تنزف (دم أحمر فاتح)\n• تزيد مع الإمساك أو الجلوس الطويل\n\n💊 **العلاج:**\n• **حمامات ماء دافئ (Sitz bath):** 3 مرات يومياً\n• **كريمات موضعية:** (فاكتو، بروكتوسيديل)\n• **ملينات:** (دوفلاك، فايبوجيل) لتجنب الإمساك\n• **مسكنات:** باراسيتامول\n\n💡 **الوقاية:** ألياف كثيرة، ماء كثير، لا حزق عند التبرز.\n",
    drugs: ["حمامات ماء دافئ","كريم فاكتو","دوفلاك ملين","ألياف كثيرة"]
},
"ارتجاع_مريئي": {
    keywords: ["ارتجاع مريئي","GERD","حرقان مزمن","حموضة","مرارة في الفم"],
    response: "📋 **الارتجاع المعدي المريئي (GERD):**\n\n🔹 **الأعراض:**\n• حرقان مزمن خلف الصدر (يزيد عند الانحناء أو الاستلقاء)\n• مرارة أو طعم حامض في الفم\n• كحة مزمنة وبحة في الصوت\n• صعوبة بلع\n\n💊 **العلاج:**\n• **مثبطات الحموضة:** (أوميبرازول 20mg، بانتوبرازول)\n• **مضادات حموضة فورية:** جافيسكون عند اللزوم\n\n💡 **نصائح:** لا تأكل قبل النوم بـ3 ساعات، ارفع رأس السرير 15 سم، تجنب الشاي والقهوة والحار.\n",
    drugs: ["أوميبرازول 20mg","جافيسكون","تجنب المثيرات","رفع رأس السرير"]
},
"كبد_دهني": {
    keywords: ["كبد دهني","fatty liver","دهون كبد","تليف كبد","سمنة"],
    response: "📋 **الكبد الدهني (Fatty Liver):**\n\n🔹 **الأعراض:**\n• غالباً لا أعراض (يُكتشف بالصدفة)\n• تعب عام وشعور بالثقل في الجزء العلوي الأيمن من البطن\n• يرقان (في حالات نادرة ومتقدمة)\n\n💊 **العلاج:**\n• **خسارة الوزن (الأهم!):** حتى 5-10% من وزن الجسم\n• **التحكم بالسكري والكوليسترول**\n• **فيتامين E** (لغير المصابين بالسكري)\n• **تجنب الكحول تماماً**\n\n💡 **نصائح:** رياضة منتظمة، حمية غنية بالألياف وقليلة السكريات والدهون المشبعة.\n",
    drugs: ["خسارة الوزن","فيتامين E","ضبط السكري","رياضة منتظمة"]
},
"مغص_كلوي": {
    keywords: ["مغص كلوي","حصوة كلى","ألم كلى","renal colic","ألم ظهر"],
    response: "📋 **المغص الكلوي (Renal Colic):**\n\n🔹 **الأعراض:**\n• ألم حاد ومفاجئ في الخاصرة أو الظهر\n• ينتقل للبطن والفخذين\n• غثيان وقيء\n• دم في البول (أحياناً)\n• تبول متكرر ومؤلم\n\n💊 **العلاج:**\n• **مسكنات قوية:** (ديكلوفيناك حقن أو أقراص) - فعالة جداً\n• **سوائل كثيرة**\n• **أدوية توسيع الحالب:** (تامسولوسين)\n• **الحصوات الكبيرة:** تفتيت بالموجات أو جراحة منظارية\n\n⚠️ **طوارئ:** حمى وقشعريرة (علامة عدوى).\n",
    drugs: ["ديكلوفيناك مسكن","تامسولوسين","شرب ماء كثير","تفتيت حصوات"]
},
  "صداع_نصفي": {
    keywords: ["صداع نصفي","شقيقة","migraine","ألم نابض","غثيان"],
    response: "📋 **الصداع النصفي (Migraine):**\n\n🔹 **الأعراض:**\n• ألم نابض أو خافق (عادة في نصف الرأس)\n• يستمر 4-72 ساعة\n• غثيان وقيء\n• حساسية شديدة للضوء والصوت (Photophobia)\n• قد يسبقه هالة (رؤية أضواء متعرجة)\n\n💊 **العلاج (النوبة):**\n• **تريبتانات:** (إيميتركس، زوميتريبتان) - تؤخذ مبكراً\n• **مسكنات:** إيبوبروفين أو باراسيتامول مع كافيين\n• **راحة في غرفة مظلمة وهادئة**\n\n💊 **العلاج (الوقائي):** أدوية ضغط أو صرع (لو النوبات متكررة).\n",
    drugs: ["إيميتركس","إيبوبروفين","راحة في الظلام","تجنب المثيرات"]
},
"اكتئاب": {
    keywords: ["اكتئاب","حزن","كآبة","depression","فقدان متعة","نوم كثير"],
    response: "📋 **الاكتئاب (Major Depressive Disorder):**\n\n🔹 **الأعراض (أكثر من أسبوعين):**\n• مزاج مكتئب معظم اليوم\n• فقدان المتعة والاهتمام بكل شيء (Anhedonia)\n• تغيرات في الوزن أو الشهية\n• أرق أو نوم كثير\n• تعب أو فقدان طاقة\n• الشعور بالذنب وانعدام القيمة\n• أفكار انتحارية\n\n💊 **العلاج:**\n• **مضادات الاكتئاب (SSRIs):** (سيرترالين، فلوكستين، سيتالوبرام) - تحتاج 4-6 أسابيع للعمل\n• **علاج نفسي** (CBT أو Interpersonal Therapy)\n• **الرياضة والضوء**\n\n⚠️ **طوارئ:** لو كانت هناك نية انتحارية (اطلب مساعدة متخصصة فوراً).\n",
    drugs: ["سيرترالين","علاج سلوكي CBT","رياضة يومية","متابعة طبيب نفسي"]
},
"نوبة_هلع": {
    keywords: ["نوبة هلع","panic attack","خفقان","خوف شديد","اختناق"],
    response: "📋 **نوبة الهلع (Panic Attack):**\n\n🔹 **الأعراض:**\n• خوف مفاجئ وشديد يبلغ الذروة في دقائق\n• خفقان قلب، تسارع نبض\n• ضيق تنفس أو شعور بالاختناق\n• ألم أو ضغط في الصدر\n• دوخة أو إحساس بفقدان السيطرة\n• تنميل أو وخز في الأطراف\n\n💊 **العلاج:**\n• **أدوية مهدئة (لفترة قصيرة):** (ألبرازولام)\n• **مضادات اكتئاب** (لمنع التكرار)\n• **علاج نفسي معرفي (CBT):** لتعلم إدارة الأعراض\n\n💡 **إدارة النوبة:** التنفس البطيء (شهيق 4، زفير 6)، التركيز على الحاضر.\n",
    drugs: ["ألبرازولام","CBT","تنفس بطيء","مضادات اكتئاب"]
},
"متلازمة_نفق": {
    keywords: ["متلازمة نفق","carpal tunnel","تنميل يد","ألم معصم","رسغ"],
    response: "📋 **متلازمة النفق الرسغي (Carpal Tunnel Syndrome):**\n\n🔹 **الأعراض:**\n• تنميل ووخز وألم في الأصابع (باستثناء الخنصر)\n• تزيد الأعراض ليلاً وتوقظ المريض\n• ضعف في القبضة وصعوبة إمساك الأشياء\n• تزيد مع الحركات المتكررة للرسغ\n\n💊 **العلاج:**\n• **جبيرة للرسغ** (خاصة أثناء النوم)\n• **مضادات التهاب** (إيبوبروفين)\n• **حقن كورتيزون** موضعي\n• **جراحة** (لو كان الضغط شديد)\n\n💡 **نصائح:** تجنب ثني الرسغ، أخذ فترات راحة عند استخدام الكمبيوتر، تمارين إطالة.\n",
    drugs: ["جبيرة للرسغ","إيبوبروفين","حقن كورتيزون","جراحة (لو شديد)"]
},
"التهاب_أعصاب": {
    keywords: ["التهاب أعصاب","اعتلال عصبي","neuropathy","تنميل قدم","سكري"],
    response: "📋 **التهاب الأعصاب الطرفية (Neuropathy):**\n\n🔹 **الأسباب:** السكري (الأشيع)، نقص فيتامين B12، كحول، أدوية كيماوية.\n\n🔹 **الأعراض:**\n• تنميل ووخز وألم حارق في القدمين واليدين (عادة كقفاز أو جورب)\n• فقدان الإحساس أو ضعف في العضلات\n• مشكلات توازن\n\n💊 **العلاج:**\n• **ضبط السبب:** التحكم الدقيق بالسكر (الأهم!)\n• **أدوية ألم الأعصاب:** (جابتينتين، بريجابالين)\n• **مكملات:** فيتامين B12 (لو كان هناك نقص)\n• **علاج طبيعي**\n\n💡 **مهم لمرضى السكري:** فحص القدمين يومياً.\n",
    drugs: ["جابتينتين","بريجابالين","فيتامين B12","ضبط سكر"]
},
 "التهاب_وتر": {
    keywords: ["التهاب وتر","tendonitis","ألم مفصل","مرفق التنس","ألم كتف"],
    response: "📋 **التهاب الأوتار (Tendonitis):**\n\n🔹 **الأعراض:**\n• ألم وتيبس حول مفصل (كتف، مرفق، ركبة، كاحل)\n• يزيد مع الحركة ويخف بالراحة\n• تورم خفيف\n• أشهر الأنواع: مرفق التنس أو مرفق الغولف\n\n💊 **العلاج:**\n• **راحة المنطقة المصابة**\n• **كمادات ثلج** (أول 48 ساعة)\n• **مضادات التهاب غير ستيرويدية:** (إيبوبروفين، فولتارين جل موضعي)\n• **علاج طبيعي**\n• **حقن كورتيزون** (نادراً)\n\n💡 **نصائح:** الإحماء قبل الرياضة، تجنب الحركات المتكررة والتحميل الزائد.\n",
    drugs: ["راحة","إيبوبروفين 400mg","كمادات ثلج","علاج طبيعي"]
},
"انزلاق_غضروفي": {
    keywords: ["انزلاق غضروفي","ديسك","ألم ظهر","قرص","protrusion","ديسك ظهر"],
    response: "📋 **الانزلاق الغضروفي (Disc Herniation):**\n\n🔹 **الأعراض:**\n• ألم مفاجئ في أسفل الظهر أو الرقبة\n• ينتقل إلى الساق (عرق النسا) أو الذراع\n• تنميل أو وخز أو ضعف في الأطراف\n• يزيد مع الجلوس والسعال\n\n💊 **العلاج:**\n• **راحة نسبية** (لا راحة تامة)\n• **مسكنات ومضادات التهاب** (ديكلوفيناك)\n• **مرخيات عضلية**\n• **علاج طبيعي** وتقوية عضلات الجذع\n• **جراحة** (لو كان هناك ضعف عضلي أو عدم تحكم في البول)\n\n⚠️ **طوارئ:** ضعف مفاجئ أو فقدان تحكم في البول/البراز.\n",
    drugs: ["مسكنات قوية","مرخيات عضلية","علاج طبيعي","راحة نسبية"]
},
"نقرس_مزمن": {
    keywords: ["نقرس مزمن","حمض يوريك مرتفع","توفي","gout","مفصل منتفخ"],
    response: "📋 **النقرس المزمن (Chronic Gout):**\n\n🔹 **التعريف:** تراكم حمض اليوريك يسبب نوبات متكررة وتكون كتل (توفي) حول المفاصل.\n\n🔹 **العلاج الوقائي (بعد النوبة):**\n• **ألوبيورينول** 100-300mg (لخفض حمض اليوريك)\n• **فيبوكسوستات** (بديل)\n\n🍎 **نظام غذائي:** تقليل البيورينات (كبدة، لحم أحمر كثير، محار، كحول)، شرب ماء كثير، تناول الكرز والقهوة.\n\n⚠️ **ممنوع:** أسبرين ومدرات بول معينة.\n",
    drugs: ["ألوبيورينول","كولشيسين","نظام قليل البيورين","شرب ماء كثير"]
},
"التهاب_مفصل_روماتويدي": {
    keywords: ["التهاب مفاصل روماتويدي","روماتويد","rheumatoid arthritis","تصلب صباحي","مفاصل يد"],
    response: "📋 **التهاب المفاصل الروماتويدي (RA):**\n\n🔹 **الأعراض:**\n• تيبس مفاصل صباحي يستمر أكثر من ساعة\n• تورم وألم في مفاصل صغيرة (اليدين والقدمين)\n• يصيب نفس المفاصل في الجانبين\n• تعب عام وحمى خفيفة\n\n💊 **العلاج:**\n• **DMARDs:** (ميثوتريكسات، سلفاسالازين) - لتعديل سير المرض\n• **مسكنات ومضادات التهاب**\n• **كورتيزون** (لفترة قصيرة)\n• **علاج طبيعي**\n\n⚠️ **متابعة دورية مع طبيب روماتيزم ضرورية جداً.**\n",
    drugs: ["ميثوتريكسات","فوليك أسيد","مسكنات","علاج طبيعي"]
},
"آلام_ظهر_سفلي": {
    keywords: ["آلام ظهر سفلي","low back pain","ألم أسفل الظهر","تشنج ظهر"],
    response: "📋 **آلام أسفل الظهر غير المحددة:**\n\n🔹 **الأسباب:** إجهاد عضلي (الأشيع)، وضعية جلوس خاطئة، حمل ثقيل.\n\n🔹 **الأعراض:**\n• ألم حاد أو مزمن في أسفل الظهر\n• تشنج عضلي\n• يزيد مع الحركة ويخف بالراحة\n• لا يوجد تنميل أو ضعف في الساقين\n\n💊 **العلاج:**\n• **مسكنات ومضادات التهاب:** (إيبوبروفين، ديكلوفيناك)\n• **كمادات دافئة/باردة**\n• **مرخيات عضلية** (مثل سيكلوبنزابرين)\n• **العودة للحركة** تدريجياً\n\n💡 **الوقاية:** تمارين تقوية الجذع، وضعية نوم صحيحة.\n",
    drugs: ["إيبوبروفين","مرخيات عضلية","كمادات دافئة","تمارين تقوية"]
},
  "ذبحة_صدرية": {
    keywords: ["ذبحة صدرية","ألم صدر","Angina","تصلب شرايين","إجهاد"],
    response: "📋 **الذبحة الصدرية (Angina):**\n\n🔹 **الأعراض:**\n• ألم أو ضغط في الصدر (كأن شيئاً ثقيلاً على الصدر)\n• ينتقل إلى الذراع الأيسر، الكتف، الرقبة، أو الفك\n• يحدث مع المجهود أو الضغط النفسي\n• يختفي بالراحة أو النيتروجليسرين\n\n💊 **العلاج:**\n• **نيتروجليسرين تحت اللسان** (للنوبة الحادة)\n• **أدوية سيولة:** (أسبرين)\n• **حاصرات بيتا:** (كونكور) لتقليل جهد القلب\n\n⚠️ **طوارئ:** لو لم يختفِ الألم بالراحة أو النيتروجليسرين (قد تكون جلطة).\n",
    drugs: ["نيتروجليسرين","أسبرين","كونكور","متابعة قلب"]
},
"خفقان": {
    keywords: ["خفقان","سرعة نبض","قلب سريع","palpitations","نبضات مفقودة"],
    response: "📋 **خفقان القلب (Palpitations):**\n\n🔹 **الأسباب:** توتر، كافيين، تدخين، فقر دم، مشاكل غدة درقية، أدوية، اضطراب في نظم القلب.\n\n🔹 **الأعراض:**\n• إحساس بضربات قلب سريعة، أو قفزات، أو فقدان ضربة\n• دوخة خفيفة\n• لا يصاحبه عادة ألم صدر شديد\n\n💊 **العلاج:**\n• **ضبط السبب:** تقليل الكافيين، علاج الأنيميا، علاج الغدة\n• **حاصرات بيتا:** (كونكور) لو كان الخفقان مزعجاً\n\n⚠️ **راجع طبيب لو:** خفقان مع دوخة شديدة، إغماء، ضيق تنفس، أو ألم صدر.\n",
    drugs: ["تقليل كافيين","كونكور (لو لزم)","علاج السبب","تجنب التوتر"]
},
"ارتفاع_دهون": {
    keywords: ["ارتفاع كوليسترول","دهون ثلاثية","hyperlipidemia","دهون دم"],
    response: "📋 **ارتفاع الكوليسترول والدهون الثلاثية:**\n\n🔹 **التعريف:** ارتفاع الدهون الضارة (LDL) أو الدهون الثلاثية (Triglycerides) في الدم، مما يزيد خطر الجلطات.\n\n🔹 **الأعراض:** صامتة (لا أعراض).\n\n💊 **العلاج:**\n• **ستاتينات:** (ليبيتور، كريستور) - لخفض الكوليسترول\n• **فايبريت:** (لخفض الدهون الثلاثية)\n• **أوميجا 3** (بجرعات عالية للدهون الثلاثية)\n\n🍎 **النظام الغذائي:** تقليل الدهون المشبعة والسكريات البسيطة، ألياف كثيرة (شوفان).\n",
    drugs: ["ليبيتور","أوميجا 3","نظام قليل الدهون","رياضة"]
},
"نقص_B12": {
    keywords: ["نقص فيتامين B12","B12 deficiency","خدر","تنميل أطراف","تعب مزمن"],
    response: "📋 **نقص فيتامين B12 (Cobalamin Deficiency):**\n\n🔹 **الأعراض:**\n• تعب وضعف عام\n• شحوب ولسان أحمر أملس\n• تلف الأعصاب: تنميل، خدر، مشكلات توازن\n• اكتئاب وتغيرات مزاجية\n\n💊 **العلاج:**\n• **حقن B12:** (لو كان النقص شديد أو سوء امتصاص)\n• **أقراص B12** (جرعات عالية)\n• **حمض الفوليك** (عادة يعطى معه)\n\n🍎 **النظام الغذائي:** لحوم حمراء، كبدة، بيض، منتجات ألبان.\n",
    drugs: ["حقن B12","أقراص B12 عالية الجرعة","حمض الفوليك","طعام غني بالبي 12"]
},
 "سكري_نوع_1": {
    keywords: ["سكري نوع 1","سكري أطفال","انسولين","Type 1 diabetes"],
    response: "📋 **السكري النوع 1 (Type 1 Diabetes):**\n\n🔹 **التعريف:** مرض مناعي ذاتي يدمر الخلايا المنتجة للأنسولين (عادة يبدأ في الصغر).\n\n🔹 **الأعراض:** عطش شديد، تبول كثير، فقدان وزن مفاجئ، جوع مستمر.\n\n💊 **العلاج:**\n• **الأنسولين:** (الحل الوحيد) - حقن أو مضخة أنسولين\n• **قياس سكر متكرر:** 4-10 مرات يومياً\n• **عد الكربوهيدرات**\n\n⚠️ **طوارئ:** حماض كيتوني (قيء، رائحة أسيتون، تنفس عميق).\n",
    drugs: ["أنسولين طويل المفعول","أنسولين سريع المفعول","قياس سكر منتظم","عد الكربوهيدرات"]
},
"كسل_غدة": {
    keywords: ["كسل الغدة الدرقية","hypothyroidism","خمول","زيادة وزن","برودة"],
    response: "📋 **كسل الغدة الدرقية (Hypothyroidism):**\n\n🔹 **الأعراض:** تعب وخمول شديد، زيادة وزن، برودة دائمة، إمساك، تساقط شعر، اكتئاب، بطء نبض.\n\n💊 **العلاج:**\n• **يوثيروكسين (Euthyrox):** يؤخذ صباحاً على معدة فاضية (مدى الحياة)\n\n💡 **نصائح:** لا تأخذ الدواء مع الكالسيوم أو الحديد، متابعة TSH كل 6 شهور.\n",
    drugs: ["يوثيروكسين","متابعة TSH","زنك وسيلينيوم","خسارة وزن"]
},
"اكزيما": {
    keywords: ["اكزيما","eczema","حساسية جلدية","جلد جاف","حكة شديدة"],
    response: "📋 **الإكزيما (Eczema/Dermatitis):**\n\n🔹 **الأعراض:**\n• جلد جاف، أحمر، وحكة شديدة (خاصة ليلاً)\n• بقع متقشرة\n• قد تظهر فقاعات صغيرة\n\n💊 **العلاج:**\n• **ترطيب مستمر:** (فازلين، سيتيال) - بعد الحمام مباشرة\n• **كريمات كورتيزون:** (كينافورت، بيثاميثازون) - قصيرة المدى\n• **مضاد هيستامين:** (للحكة الليلية)\n\n💡 **الوقاية:** حمام قصير فاتر، تجنب الصابون القوي، ملابس قطنية، تجنب التوتر.\n",
    drugs: ["ترطيب مستمر","كريم كورتيزون موضعي","مضاد هيستامين","تجنب الصابون"]
},
"سعفة": {
    keywords: ["سعفة","فطريات","ringworm","Tinea","جلد"],
    response: "📋 **السعفة/الفطريات الجلدية (Ringworm/Tinea):**\n\n🔹 **الأعراض:**\n• بقع دائرية حمراء مرتفعة على الجلد\n• حكة وتقشير\n• قد تصيب القدم (سعفة القدم) أو فروة الرأس\n\n💊 **العلاج:**\n• **كريم مضاد فطريات:** (كلوتريمازول، لاميسيل) - 2-4 أسابيع\n• **أدوية فموية:** (فلوكونازول) - للحالات الشديدة أو سعفة الرأس\n\n💡 **نصائح:** تجفيف الجلد جيداً، تغيير الملابس الداخلية يومياً، تجنب مشاركة المناشف.\n",
    drugs: ["كريم كلوتريمازول","فلوكونازول (فموي)","تجفيف الجلد","نظافة"]
},
"التهاب_مسالك": {
    keywords: ["التهاب مسالك بولية","UTI","حرقان بول","تبول متكرر","دم في البول"],
    response: "📋 **التهاب المسالك البولية (UTI):**\n\n🔹 **الأعراض:**\n• حرقان أو ألم عند التبول (Dysuria)\n• تبول متكرر وإلحاح\n• بول غائم أو رائحته قوية\n• ألم أسفل البطن\n• حمى (لو وصل للكلى)\n\n💊 **العلاج:**\n• **مضاد حيوي:** (سيبروفلوكساسين، سيفاليكسين) - بعد مزرعة بول\n• **مسكن حرقان:** (بيرايديوم) - يصبغ البول برتقالياً\n• **شرب ماء كثير**\n\n💡 **الوقاية:** شرب ماء، تفريغ المثانة بعد الجماع، مسح من الأمام للخلف (للنساء).\n",
    drugs: ["مضاد حيوي مناسب","بيرايديوم","شرب ماء كثير","عصير توت بري"]
}, 
 "تمزق_الخلفية": {
    keywords: ["تمزق الخلفية","عضلة خلفية","hamstring strain","شد خلفية","إصابة ركض"],
    response: "📋 **تمزق عضلة الفخذ الخلفية (Hamstring Strain):**\n\n🔹 **الموقع:** العضلات **الخلفية للفخذ**، تمتد من أسفل الأرداف وحتى الركبة.\n🔹 **الآلية:** تحدث غالباً عند الركض السريع أو الركل بقوة.\n🔹 **الأعراض:**\n• ألم مفاجئ وشديد في خلفية الفخذ أثناء الجري\n• قد يشعر اللاعب بـ'طعنة' أو 'فرقعة'\n• تورم وظهور كدمة بعد يوم أو يومين\n• صعوبة وألم عند فرد الركبة\n\n💊 **الإسعاف والعلاج:**\n• **فوري (RICE):** **راحة تامة**، **ثلج** (لمدة 15-20 دقيقة كل 3 ساعات)، **ضغط** (رباط ضاغط)، **رفع** الساق.\n• **مسكنات:** إيبوبروفين (للألم والالتهاب) - ممنوع في أول 48 ساعة لو كان التمزق شديداً.\n• **علاج طبيعي:** تمارين إطالة وتقوية تدريجية (بعد زوال الألم الحاد).\n\n⚠️ **العودة للعب:** يجب أن تكون تدريجية وتتم بإشراف طبي لتجنب تكرار الإصابة.\n",
    drugs: ["راحة وثلج (RICE)","إيبوبروفين (بعد 48 ساعة)","علاج طبيعي","تجنب الجري السريع"]
},
  "رجلي_وجعاني": {
  keywords: ["رجلي وجعاني","في الم في رجلي "],
   response: "قولي مكان الام فين بالظبط"
    },
  "ألم_الرأس": {
    keywords: ["راسي وجعاني", "صداع شديد", "الام الرأس", "الم براسي"],
    response: "هل يمكنك تحديد **موقع الألم في الرأس بالظبط؟** هل هو في الجبهة، خلف العينين، في مؤخرة الرأس، أو في جانب واحد (صداع نصفي)؟"
},
"ألم_الصدر": {
    keywords: ["صدري بيوجعني", "الم في الصدر", "وجع الصدر", "ضغط على الصدر"],
    response: "من فضلك صف **موقع ألم الصدر بدقة**، وهل يمتد للكتف الأيسر أو الفك؟ وهل يزيد مع المجهود أو مع التنفس؟"
},
"ألم_الرقبة": {
    keywords: ["رقبتي وجعاني", "الام الرقبة", "تصلب الرقبة", "وجع في الرقبة"],
    response: "هل **ألم الرقبة** في الجزء الخلفي، أم جانبي؟ وهل يمتد إلى الذراع أو الكتف؟ وهل يزيد الألم مع تحريك الرأس؟"
},
"ألم_البطن": {
    keywords: ["بطني وجعاني", "الم في البطن", "مغص شديد", "وجع البطن"],
    response: "هل يمكنك تحديد **موقع ألم البطن بدقة**؟ هل هو في المعدة (أعلى الوسط)، أسفل اليمين، أسفل اليسار، أو منتشر في كل البطن؟"
},
"ألم_الظهر": {
    keywords: ["ضهري وجعاني", "الام الظهر", "وجع في العمود الفقري", "ظهر السفلي"],
    response: "من فضلك، هل الألم في **أعلى الظهر**، أم **أسفل الظهر (المنطقة القطنية)**؟ وهل يمتد إلى الساقين؟"
},
"ألم_الكتف": {
    keywords: ["كتفي وجعاني", "ألم في الكتف", "صعوبة رفع الذراع"],
    response: "هل الألم في **مفصل الكتف** نفسه، أم في **العضلات المحيطة**؟ وهل يزداد عند رفع الذراع لأعلى أو خلف الظهر؟"
},
"ألم_اليد": {
    keywords: ["ايدي وجعاني", "الم في اليد", "ألم رسغ", "ألم كف"],
    response: "هل الألم في **المعصم (الرسغ)**، أم في **كف اليد**؟ وهل يرافقه تنميل في الأصابع؟"
},
"ألم_الركبة": {
    keywords: ["ركبتي وجعاني", "ألم في الركبة", "خشونة ركبة", "وجع ركبة"],
    response: "هل **ألم الركبة** في الأمام (تحت الصابونة)، أم في الجانب الداخلي أو الخارجي؟ وهل يوجد تورم؟"
},
"ألم_القدم": {
    keywords: ["رجلي وجعاني", "في الم في رجلي", "وجع القدم", "ألم الساق"],
    response: "هل الألم في **الساق (عضلة السمانة)**، أم في **مفصل الكاحل**، أم في **الكعب** أو **باطن القدم**؟"
},
"ألم_العين": {
    keywords: ["عيني وجعاني", "ألم في العين", "وجع العين", "احمرار العين"],
    response: "هل الألم في **كرة العين** نفسها، أم حول العين؟ وهل العين **حمراء** أو هناك **حساسية من الضوء**؟"
},
 "ألم_الحلق": {
    keywords: ["حلقي وجعاني", "الام الحلق", "صعوبة بلع", "التهاب حلق"],
    response: "هل **ألم الحلق** في الجزء الخلفي، أم أعلى الحلق؟ وهل يزداد عند البلع؟ وهل يرافق الألم تورم في اللوزتين أو الرقبة؟"
},
"ألم_الفم": {
    keywords: ["فمي وجعاني", "الام الفم", "تقرحات فموية", "وجع اللثة"],
    response: "هل الألم في **اللسان**، أم في **اللثة**، أم في **الشفاه**؟ وهل يوجد تقرحات بيضاء أو حمراء واضحة؟"
},
"ألم_الأسنان": {
    keywords: ["سناني وجعاني", "ألم ضرس", "وجع أسنان", "ضرس العقل"],
    response: "هل الألم في **سن محدد**؟ وهل يزداد مع **المشروبات الباردة أو الساخنة**؟ وهل يوجد تورم في الوجه أو اللثة؟"
},
"ألم_الأذن": {
    keywords: ["أذني وجعاني", "الم في الأذن", "وجع الأذن", "طنين"],
    response: "هل الألم في **الأذن الداخلية**، أم في **الأذن الخارجية** (عند شد صوان الأذن)؟ وهل يوجد إفرازات أو طنين؟"
},
"ألم_المعدة": {
    keywords: ["معدتي وجعاني", "حرقان معدة", "الم في المعدة", "حموضة"],
    response: "هل **ألم المعدة** هو **حرقان** (حموضة) يزداد بعد الأكل؟ أم **ألم حاد** يوقظك ليلاً؟ وهل يمتد للصدر؟"
},
"ألم_الكلى": {
    keywords: ["كليتي وجعاني", "ألم الكلى", "وجع في الخاصرة", "جنبي بيوجعني"],
    response: "هل الألم في **الخاصرة (الجانبين)**؟ وهل هو ألم **حاد ومفاجئ** (مغص كلوي) أم **ألم باهت ومستمر**؟ وهل هناك دم في البول؟"
},
"ألم_الحوض": {
    keywords: ["حوضي وجعاني", "ألم أسفل البطن", "الم في منطقة الحوض", "عظمة العانة"],
    response: "هل الألم في **عظام الحوض** أو **عظم العانة**، أم هو **ألم داخلي** (في الرحم أو المثانة)؟ وهل حدثت إصابة سابقة؟"
},
"ألم_الكوع": {
    keywords: ["كوعي وجعاني", "ألم في المرفق", "مرفق التنس", "وجع الكوع"],
    response: "هل الألم في **الجانب الخارجي** من الكوع (مرفق التنس)، أم في **الجانب الداخلي** (مرفق الغولف)؟ وهل يزداد عند الإمساك بالأشياء؟"
},
"ألم_الفخذ": {
    keywords: ["فخذي وجعاني", "ألم في الفخذ", "ألم الساق من فوق", "شد عضلي فخذ"],
    response: "هل الألم في **الجزء الأمامي**، أم **الخلفي**، أم **الداخلي** من الفخذ؟ وهل حدث الألم فجأة أثناء الجري؟"
},
"ألم_الكاحل": {
    keywords: ["كاحلي وجعاني", "ألم في الكاحل", "التواء كاحل", "تورم الكاحل"],
    response: "هل الألم في **مفصل الكاحل** نفسه، أم في **وتر العرقوب** (خلف الكاحل)؟ وهل حدث التواء مفاجئ للقدم؟"
},
  "الزهايمر": {
    keywords: ["الزهايمر", "نسيان مزمن", "ضعف ذاكرة", "alzheimer's"],
    response: "📋 **مرض الزهايمر (Alzheimer's Disease):**\n🔹 **الأعراض:** فقدان تدريجي للذاكرة القصيرة، صعوبة في الكلام، تغيرات في الشخصية، تدهور في التفكير المنطقي.\n💊 **العلاج:** مثبطات الكولينستراز (مثل أريسبت) و ميمانتين (لتحسين الذاكرة المعرفية)، دعم أسري ومتابعة مستمرة.\n",
    drugs: ["أريسبت", "ميمانتين", "دعم أسري", "تمارين ذهنية"]
},
"الشلل_الرعاش": {
    keywords: ["باركنسون", "شلل رعاش", "رجفة يد", "بطء الحركة", "parkinson"],
    response: "📋 **مرض الشلل الرعاش (Parkinson's Disease):**\n🔹 **الأعراض:** بطء في الحركة، رعشة (ترعش) تبدأ في الراحة، تصلب في الأطراف، مشكلات في التوازن والمشي.\n💊 **العلاج:** ليفودوبا (العلاج الرئيسي)، منبهات الدوبامين، جراحة تحفيز الدماغ العميق (DBS) في حالات محددة.\n",
    drugs: ["ليفودوبا", "منبهات دوبامين", "علاج طبيعي", "DBS"]
},
"الصرع": {
    keywords: ["صرع", "نوبة صرعية", "تشنج", "epilepsy", "فقدان وعي"],
    response: "📋 **الصرع (Epilepsy):**\n🔹 **التعريف:** اضطراب عصبي يسبب نوبات متكررة (تشنجات) نتيجة نشاط كهربائي غير طبيعي في الدماغ.\n🔹 **الأعراض:** تشنجات عضلية، فقدان وعي مؤقت، حركات لا إرادية.\n💊 **العلاج:** أدوية مضادة للصرع (مثل ديباكين، لاميكتال)، تجنب محفزات النوبات (إضاءة قوية، سهر).\n",
    drugs: ["ديباكين", "لاميكتال", "تجنب المحفزات", "متابعة أعصاب"]
},
"اضطراب_ثنائي": {
    keywords: ["ثنائي القطب", "bipolar", "هوس واكتئاب", "تغيرات مزاجية"],
    response: "📋 **اضطراب ثنائي القطب (Bipolar Disorder):**\n🔹 **الأعراض:** تقلبات حادة في المزاج بين فترات الهوس (طاقة مفرطة، قرارات متهورة) وفترات الاكتئاب (حزن، فقدان اهتمام).\n💊 **العلاج:** مثبتات المزاج (مثل الليثيوم، فالبوريك أسيد)، مضادات الذهان، العلاج النفسي (العائلي والسلوكي).\n",
    drugs: ["ليثيوم", "فالبوريك أسيد", "علاج نفسي", "متابعة دورية"]
},
  "التيفوئيد": {
    keywords: ["حمى التيفوئيد", "typhoid fever", "سلمونيلا", "حمى مستمرة"],
    response: "📋 **حمى التيفوئيد (Typhoid Fever):**\n🔹 **الأعراض:** حمى ترتفع تدريجياً، ضعف عام، صداع، آلام في البطن، بقع وردية على الصدر والبطن (نادراً).\n💊 **العلاج:** مضادات حيوية قوية (مثل سيبروفلوكساسين أو أزيثروميسين) لمدة 7-14 يومًا، سوائل ورعاية داعمة.\n",
    drugs: ["سيبروفلوكساسين", "أزيثروميسين", "سوائل وريدية", "عزل"]
},
"الملاريا": {
    keywords: ["ملاريا", "malaria", "قشعريرة وحمى", "بعوض"],
    response: "📋 **الملاريا (Malaria):**\n🔹 **الأعراض:** نوبات متكررة من قشعريرة شديدة، ثم حمى عالية، ثم تعرق غزير، وتعب عام، وفقر دم.\n💊 **العلاج:** أدوية مضادة للملاريا (مثل كلوروكين أو أرتيميسينين) حسب نوع الطفيل، رعاية داعمة (سوائل، خافضات حرارة).\n",
    drugs: ["كلوروكين", "أرتيميسينين", "ناموسية", "خافض حرارة"]
},
"متلازمة_تعب_مزمن": {
    keywords: ["تعب مزمن", "chronic fatigue", "إرهاق دائم", "وجع عضلات"],
    response: "📋 **متلازمة التعب المزمن (CFS):**\n🔹 **الأعراض:** تعب شديد يستمر 6 أشهر أو أكثر لا يتحسن بالراحة، ألم في العضلات والمفاصل، صعوبة في التركيز، أرق أو نوم غير منعش.\n💊 **العلاج:** لا يوجد علاج محدد. إدارة الأعراض (مسكنات)، علاج سلوكي معرفي، تمارين رياضية خفيفة متدرجة.\n",
    drugs: ["علاج سلوكي", "مسكنات ألم", "تمارين تدريجية", "نظام غذائي"]
},
  "أوزغود_شلاتر": {
    keywords: ["شلاتر", "شلتر", "أوزغود شلاتر", "ألم ركبة رياضي", "تورم أسفل الركبة", "Osgood-Schlatter"],
    response: "📋 **متلازمة أوزغود-شلاتر (Osgood-Schlatter Disease):**\n\n🔹 **الموقع:** يحدث في **الركبة**، وتحديداً في منطقة **نتوء عظم الساق** (Tibial Tubercle) أسفل صابونة الركبة مباشرة.\n\n🔹 **الأسباب:** إجهاد متكرر على وتر الرضفة (Patellar Tendon) في نقطة التقائه بعظم الساق أثناء طفرات النمو السريعة.\n\n🔹 **الأعراض:**\n• **ألم وتورم** في النتوء العظمي أسفل الركبة.\n• ظهور **كتلة عظمية مؤلمة** وملموسة في هذه المنطقة.\n• يزداد الألم مع الأنشطة التي تتطلب الجري، القفز، أو صعود الدرج.\n• يقل الألم مع الراحة.\n\n💊 **العلاج (المحافظ هو الأساس):**\n• **الراحة (تقليل النشاط):** تجنب الأنشطة التي تزيد الألم (الجري والقفز).\n• **ثلج:** تطبيق الثلج على المنطقة المتورمة بعد النشاط.\n• **مسكنات:** إيبوبروفين (لتخفيف الألم والالتهاب).\n• **تمارين إطالة:** خاصة لعضلات الفخذ الأمامية (Quadriceps) والخلفية (Hamstrings).\n• **دعامة ركبة (Knee Strap):** لتقليل الشد على الوتر.\n\n💡 **ملاحظة:** هذه حالة نمو مؤقتة، وتزول الأعراض عادةً بمجرد توقف نمو العظام (في سن 14-18 سنة) ولا تتطلب جراحة إلا نادراً.\n",
    drugs: ["راحة وثلج", "إيبوبروفين", "تمارين إطالة الفخذ", "دعامة ركبة"]
},
 "فقر_دم_منجلي": {
    keywords: ["فقر دم منجلي", "sickle cell anemia", "انيميا حادة", "أزمة نقص أكسجين"],
    response: "📋 **فقر الدم المنجلي (Sickle Cell Anemia):**\n\n🔹 **التعريف:** مرض وراثي يغير شكل كريات الدم الحمراء إلى شكل منجلي (هلال)، مما يعيق تدفق الدم.\n🔹 **الأعراض:** نوبات ألم شديدة (أزمة انسداد وعائي)، فقر دم مزمن، التهابات متكررة، تعب.\n💊 **العلاج:** هيدروكسي يوريا (لتقليل الأزمات)، مسكنات قوية للألم، نقل دم، تطعيمات متكررة.\n",
    drugs: ["هيدروكسي يوريا", "نقل دم", "مسكنات أفيونية", "تطعيمات"]
},
"تجلط_وريد_عميق": {
    keywords: ["تجلط وريد عميق", "DVT", "جلطة ساق", "تورم ساق مفاجئ", "رحلات طويلة"],
    response: "📋 **تجلط الأوردة العميقة (DVT):**\n\n🔹 **الموقع:** الأوردة العميقة في **الساق** أو الفخذ.\n🔹 **الأعراض:** تورم مفاجئ وألم في ساق واحدة، احمرار أو دفء في المنطقة، شعور بالشد.\n💊 **العلاج:** مميعات الدم (مثل وارفارين أو إنوكسابارين) لمنع نمو الجلطة، ارتداء جوارب ضاغطة.\n⚠️ **طوارئ:** لو صاحبها ضيق تنفس أو ألم صدر حاد (خطر الانصمام الرئوي).\n",
    drugs: ["وارفارين", "حقن إنوكسابارين", "جوارب ضاغطة", "طوارئ لو ضيق تنفس"]
},
"ارتفاع_ضغط_رئوي": {
    keywords: ["ضغط رئوي", "pulmonary hypertension", "زرقان شفايف", "تعب مع مجهود"],
    response: "📋 **ارتفاع ضغط الشريان الرئوي (Pulmonary Hypertension):**\n\n🔹 **الأعراض:** ضيق تنفس متزايد مع المجهود، تعب، دوخة، أحياناً زرقان في الشفاه والأطراف، تورم في الساقين.\n💊 **العلاج:** موسعات الأوعية الرئوية، مدرات البول، أدوية لضبط السبب الأساسي (لو وجد).\n",
    drugs: ["موسعات أوعية رئوية", "مدرات بول", "أكسجين", "متابعة قلب وصدرية"]
},
  "حصوات_مثانة": {
    keywords: ["حصوات مثانة", "ألم تبول", "دم في البول", "حصى مجاري بولية"],
    response: "📋 **حصوات المثانة:**\n\n🔹 **الموقع:** داخل **المثانة البولية**.\n🔹 **الأعراض:** ألم أسفل البطن، تبول مؤلم ومتقطع، زيادة في الإلحاح البولي، قد يرى دم في البول.\n💊 **العلاج:** شرب سوائل كثيرة، تفتيت بالليزر أو منظار المثانة، علاج السبب (مثل تضخم البروستاتا).\n",
    drugs: ["شرب سوائل كثيرة", "تفتيت بالليزر", "منظار مثانة", "علاج السبب"]
},
"تضخم_البروستاتا": {
    keywords: ["تضخم بروستاتا", "BPH", "صعوبة تبول رجل", "تقطير بول"],
    response: "📋 **تضخم البروستاتا الحميد (BPH):**\n\n🔹 **الموقع:** غدة البروستاتا (تحيط بالإحليل).\n🔹 **الأعراض (الأشيع في كبار السن):** صعوبة في بدء التبول، ضعف في تدفق البول، الشعور بعدم إفراغ المثانة، التبول الليلي المتكرر.\n💊 **العلاج:** أدوية ألفا بلوكر (مثل تامسولوسين) و مثبطات مختزلة الألفا (مثل فيناستيرايد)، جراحة (TURP) في الحالات المتقدمة.\n",
    drugs: ["تامسولوسين", "فيناستيرايد", "تجنب السوائل ليلاً", "جراحة TURP"]
},
"تكيس_المبايض": {
    keywords: ["تكيس مبايض", "PCOS", "شعرانية", "اضطراب دورة", "سمنة أنثوية"],
    response: "📋 **متلازمة تكيّس المبايض (PCOS):**\n\n🔹 **الأعراض:** اضطراب الدورة الشهرية أو انقطاعها، زيادة شعر الجسم والوجه (شعرانية)، حب شباب، صعوبة في الحمل، سمنة، مقاومة أنسولين.\n💊 **العلاج:** حبوب منع الحمل (لتنظيم الدورة)، ميتفورمين (لعلاج مقاومة الأنسولين)، أدوية لتقليل نمو الشعر، خسارة الوزن.\n",
    drugs: ["ميتفورمين", "حبوب منع حمل", "خسارة وزن", "متابعة نسائية"]
},
"التهاب_المهبل": {
    keywords: ["التهاب مهبل", "افرازات مهبلية", "حكة نسائية", "فطريات مهبلية"],
    response: "📋 **التهاب المهبل (Vaginitis):**\n\n🔹 **الأعراض:** إفرازات مهبلية غير عادية (قد تكون بيضاء سميكة أو خضراء/صفراء رغوية)، حكة وحرقان، ألم أثناء الجماع.\n💊 **العلاج:** مضادات فطرية (للفطريات)، مضادات حيوية (للعدوى البكتيرية أو الطفيلية) - حسب السبب بعد الفحص.\n",
    drugs: ["مضادات فطرية", "مضادات حيوية", "نظافة شخصية", "تجنب الملابس الضيقة"]
},
 "الذئبة_الحمراء": {
    keywords: ["ذئبة حمراء", "Lupus", "مرض مناعي ذاتي", "طفح فراشة", "SLE"],
    response: "📋 **الذئبة الحمامية الجهازية (Lupus - SLE):**\n\n🔹 **الأعراض:** طفح جلدي على شكل فراشة على الخدين والأنف، آلام مفاصل، تعب شديد، حمى، قد تصيب الكلى والرئة والقلب.\n💊 **العلاج:** هيدروكسي كلوروكوين (Plaquenil)، كورتيزون، مثبطات مناعة، تجنب التعرض للشمس.\n",
    drugs: ["هيدروكسي كلوروكوين", "كورتيزون", "واقي شمس", "متابعة روماتيزم"]
},
"التهاب_المفاصل_الصدفي": {
    keywords: ["التهاب مفاصل صدفي", "psoriatic arthritis", "صدفية مفاصل", "أصابع متورمة"],
    response: "📋 **التهاب المفاصل الصدفي (Psoriatic Arthritis):**\n\n🔹 **الأعراض:** التهاب المفاصل يرافق الصدفية، تورم الأصابع بأكملها (Dactylitis)، ألم وتيبس في الظهر والمفاصل.\n💊 **العلاج:** نفس علاج الروماتويد (DMARDs)، مضادات التهاب غير ستيرويدية، علاج بيولوجي.\n",
    drugs: ["DMARDs", "علاج بيولوجي", "مضادات التهاب", "علاج طبيعي"]
},
"التهاب_القولون_التقرحي": {
    keywords: ["التهاب قولون تقرحي", "ulcerative colitis", "براز دموي", "إسهال مزمن"],
    response: "📋 **التهاب القولون التقرحي (Ulcerative Colitis):**\n\n🔹 **الأعراض:** إسهال متكرر ومصحوب بدم ومخاط، ألم بطن، فقدان وزن، إلحاح للذهاب إلى المرحاض.\n💊 **العلاج:** ميسالامين (5-ASA)، كورتيزون (للهجمات الحادة)، مثبطات مناعة، جراحة استئصال القولون (في حالات الفشل).\n",
    drugs: ["ميسالامين", "كورتيزون", "مثبطات مناعة", "حمية قليلة الفضلات"]
},
 "تليف_رئوي": {
    keywords: ["تليف رئوي", "pulmonary fibrosis", "صعوبة تنفس", "سعال جاف"],
    response: "📋 **التليف الرئوي (Pulmonary Fibrosis):**\n\n🔹 **التعريف:** مرض يسبب تندب وتصلب الرئة، مما يجعل التنفس صعباً.\n🔹 **الأعراض:** ضيق تنفس متزايد مع المجهود، سعال جاف مزمن، تعب عام.\n💊 **العلاج:** أدوية مضادة للتليف (مثل بيرفنيدون أو نينتيدانيب)، أكسجين علاجي، زراعة رئة (في المراحل المتقدمة).\n",
    drugs: ["أدوية مضادة للتليف", "أكسجين علاجي", "تأهيل رئوي", "زراعة رئة"]
},
"التهاب_جيوب_مزمن": {
    keywords: ["التهاب جيوب مزمن", "الجيوب الانفية", "احتقان مزمن", "لحمية أنفية"],
    response: "📋 **التهاب الجيوب الأنفية المزمن (Chronic Sinusitis):**\n\n🔹 **الأعراض:** احتقان أنف يستمر أكثر من 12 أسبوعًا، تصريف مخاطي متغير اللون، فقدان حاسة الشم، ألم أو ضغط في الوجه.\n💊 **العلاج:** بخاخات كورتيزون أنفية طويلة الأمد، غسول أنفي بكميات كبيرة، مضادات حيوية (لو كان هناك بؤر عدوى)، جراحة الجيوب (لو وُجدت لحمية).\n",
    drugs: ["بخاخ كورتيزون شهري", "غسول ملحي يومي", "مضادات حيوية", "جراحة الجيوب"]
},
  "حروق_الشمس": {
    keywords: ["حروق الشمس", "sunburn", "جلد أحمر", "فقاعات حروق"],
    response: "📋 **حروق الشمس (Sunburn):**\n\n🔹 **الأعراض:** احمرار مؤلم في الجلد، سخونة، تورم، قد تتكون فقاعات مليئة بسائل (في الدرجة الثانية).\n💊 **العلاج:** كمادات باردة، كريمات مرطبة تحتوي على الصبار (Aloe Vera)، مسكنات (إيبوبروفين)، شرب سوائل كثيرة.\n⚠️ **طوارئ:** لو صاحبتها حمى، قشعريرة، أو قيء شديد (إنهاك حراري).\n",
    drugs: ["كمادات باردة", "كريمات الألوفيرا", "إيبوبروفين", "شرب ماء"]
},
"طنين_أذن": {
    keywords: ["طنين أذن", "tinnitus", "صفير أذن", "ضوضاء سمعية"],
    response: "📋 **طنين الأذن (Tinnitus):**\n\n🔹 **التعريف:** سماع صوت (صفير، أزيز، نقر) في الأذن أو الرأس في غياب مصدر صوتي خارجي.\n🔹 **الأسباب:** التعرض لضوضاء عالية، تقدم العمر، تراكم شمع الأذن، بعض الأدوية، مشاكل في الأوعية الدموية.\n💊 **العلاج:** علاج السبب (إزالة الشمع)، العلاج الصوتي (استخدام ضوضاء بيضاء)، علاج نفسي (CBT) لإدارة القلق.\n",
    drugs: ["علاج السبب", "مولد ضوضاء بيضاء", "تجنب الضوضاء", "CBT"]
},
"كسر_مفاجئ": {
    keywords: ["كسر مفاجئ", "ألم مفاجئ", "عدم قدرة على الحركة", "خطر كسر"],
    response: "⚠️ **كسر محتمل:** لو كان هناك **ألم شديد ومفاجئ** بعد صدمة أو سقوط مع **عدم قدرة على تحريك** الطرف أو **تشوه واضح**، يجب **طلب الطوارئ الطبية فوراً** وعدم محاولة تحريك الطرف المصاب.\n",
    drugs: ["طوارئ فوراً", "تثبيت الطرف", "لا تحريك", "ثلج"]
},
"الم_مفاجئ_في_العين": {
    keywords: ["ألم مفاجئ عين", "فقدان بصر مفاجئ", "ظلال في الرؤية", "رؤية مزدوجة"],
    response: "⚠️ **مشكلة عين طارئة:** لو كان هناك **ألم مفاجئ وشديد في العين** مع **فقدان بصر مفاجئ** أو **رؤية ومضات ضوئية** أو **ظلال سوداء**، يجب **التوجه فوراً إلى طبيب العيون أو الطوارئ**.\n",
    drugs: ["طوارئ عيون فوراً", "لا تفرك العين", "راحة تامة"]
},
"الم_موخرة": { 
 keywords: ["طيزي وجعاني"],
 response: "معلش ريحها و حط ماية سقعة"
},
"تمزق_الأمامية": {
    keywords: ["تمزق الأمامية","عضلة أمامية","quadriceps strain","شد فخذ","إصابة ركل"],
    response: "📋 **تمزق عضلة الفخذ الأمامية (Quadriceps Strain):**\n\n🔹 **الموقع:** العضلات **الأمامية للفخذ** (العضلة الرباعية).\n🔹 **الآلية:** تحدث غالباً أثناء الركل القوي للكرة أو التسارع المفاجئ.\n🔹 **الأعراض:**\n• ألم مفاجئ في الجزء الأمامي من الفخذ\n• صعوبة أو عدم القدرة على ثني مفصل الورك أو مد الركبة\n• ضعف ملحوظ في العضلة\n• تورم وكدمة\n\n💊 **الإسعاف والعلاج:**\n• **فوري (RICE):** **راحة**، **ثلج**، **ضغط**، **رفع** الساق.\n• **مسكنات ومضادات التهاب**.\n• **علاج طبيعي:** تمارين تقوية تدريجية (خاصة لتمارين العزل).\n\n💡 **نصيحة:** الالتزام ببرنامج تأهيل كامل يقلل بشدة من خطر تكرار الإصابة.\n",
    drugs: ["راحة وثلج (RICE)","مسكنات","تمارين تقوية","علاج طبيعي"]
},
    "برد_معده": {
    keywords: ["برد معده","معدتي وجعاني","مغص ونفخة","معده باردة","stomach flu","نزلة معوية خفيفة","بطني بيقرقر","غازات كتير","معدة منتفخة","بطني بيوجعني بس مش قوي"],
    response: "📋 **برد المعدة (نزلة معوية خفيفة):**\n\n🔹 **الأعراض:**\n• مغص خفيف إلى متوسط\n• انتفاخ وغازات\n• قرقرة في البطن\n• إسهال خفيف أو إمساك\n• غثيان بسيط\n• فقدان شهية\n\n💊 **العلاج المنزلي:**\n• **سوائل دافئة:** ينسون، كراوية، نعناع\n• **كمادات دافئة** على البطن\n• **أكل خفيف:** زبادي، موز، أرز مسلوق\n• **تجنب:** دهون، حار، بقوليات، ملفوف\n• **راحة** وتجنب توتر\n\n💊 **أدوية:**\n• **للمغص:** بوسكوبان\n• **للانتفاخ:** ديسفلاتيل\n• **بروبيوتيك:** لاكتيول\n\n⚠️ **راجع طبيب لو:**\n• المغص زاد وبقى شديد\n• حمى\n• قيء مستمر\n• إسهال شديد\n• دم في البراز",
    drugs: ["ينسون دافئ","بوسكوبان","ديسفلاتيل","كمادات دافئة"]
  },

  "وجع_ضرس": {
    keywords: ["ضرسي بيوجعني","سنة وجعاني","ألم أسنان","وجع ضرس","toothache","ضرسي بيقتلني","سناني وجعاني","ضرس ملتهب","خراج ضرس","تسوس","ضرسي مكسور","حشو وقع","عصب ضرس","لثة متورمة"],
    response: "📋 **ألم الأسنان والضروس:**\n\n🔹 **الأسباب:**\n• تسوس (نخر)\n• التهاب عصب\n• خراج في اللثة\n• كسر أو شرخ\n• حشو سقط\n• التهاب لثة\n• ضرس عقل\n• حساسية الأسنان\n\n💊 **العلاج الفوري (قبل الطبيب):**\n• **مسكن قوي:**\n  - إيبوبروفين 600mg كل 6 ساعات\n  - أو باراسيتامول 1000mg\n• **مضمضة ماء وملح:** كل 2 ساعة\n• **قرنفل:** حطه على الضرس (مسكن طبيعي)\n• **كمادات باردة:** من برة على الخد\n• **تجنب:** حار، بارد جداً، حلويات\n\n💊 **للخراج:**\n• **مضاد حيوي:** أموكسيسيلين 500mg 3 مرات\n• **مضمضة بيتادين** مخفف\n\n⚠️ **طوارئ أسنان لو:**\n• ورم في الوجه أو الرقبة\n• حمى عالية\n• صعوبة بلع أو تنفس\n• ألم لا يُحتمل\n• نزيف مستمر\n\n🦷 **الوقاية:**\n• فرشاة أسنان مرتين يومياً\n• خيط أسنان\n• زيارة دكتور أسنان كل 6 شهور\n• تقليل سكريات\n\n💡 **ملاحظة:** لازم تروح لدكتور أسنان، المسكن حل مؤقت!",
    drugs: ["إيبوبروفين 600mg","مضمضة ماء وملح","قرنفل موضعي","أموكسيسيلين للخراج"]
  },

  "دوخة_دايخ": {
    keywords: ["دايخ","دوخة","دوخه","راسي بيدور","دوار","vertigo","مش حاسس بنفسي","شايف حاجات بتلف","دوار حركة","دوخة مستمرة","راسي تقيل","عايز اطيح","مش قادر اوقف","الدنيا بتلف"],
    response: "📋 **الدوخة والدوار:**\n\n🔹 **الأنواع:**\n• **دوار حقيقي (Vertigo):** تحس إن الدنيا بتلف\n• **دوخة خفيفة:** تحس بعدم اتزان\n• **إغماء وشيك:** زي ما هتقع\n\n🔹 **الأسباب الشائعة:**\n• **انخفاض ضغط الدم:** وقوف مفاجئ\n• **انخفاض سكر:** جوع\n• **جفاف:** عطش\n• **مشكلة أذن داخلية:** BPPV (أكثر سبب)\n• **أنيميا:** فقر دم\n• **التهاب أذن وسطى**\n• **دوار حركة:** عربية، باخرة\n• **قلق وتوتر**\n• **صداع نصفي**\n\n💊 **العلاج حسب السبب:**\n• **انخفاض ضغط/سكر:**\n  - اقعد فوراً\n  - اشرب ماء أو عصير محلى\n  - ارفع رجليك\n• **BPPV (دوار الوضعة):**\n  - مناورة إيبلي (Epley maneuver)\n  - يعملها دكتور أو فيزيوثيرابي\n• **التهاب أذن:**\n  - بيتاهيستين (Betaserc) 16mg 3 مرات\n• **دوار حركة:**\n  - درامامين قبل السفر بساعة\n• **أنيميا:**\n  - حديد + فيتامين B12\n\n🏠 **نصائح:**\n• اشرب ماء كثير\n• قوم من النوم ببطء\n• تجنب حركات رأس مفاجئة\n• قلل كافيين وملح\n• نوم كافي\n\n⚠️ **طوارئ فوراً لو:**\n• دوخة مع صداع شديد مفاجئ\n• ضعف في جانب واحد من الجسم\n• صعوبة كلام\n• ازدواج رؤية\n• فقدان وعي\n• ألم صدر\n(علامات جلطة دماغية أو قلبية!)",
    drugs: ["بيتاهيستين 16mg","درامامين","ماء وسوائل","علاج السبب الأساسي"]
  },

  "كحة_جافة": {
    keywords: ["كحة جافة","سعال جاف","كحة بدون بلغم","كحة ناشفة","حلقي خشن","dry cough","كحه مزعجه","سعله جافه","كحة ليلية","صدري بيحرقني من الكحة","كحة ما بتوقفش"],
    response: "📋 **الكحة الجافة (بدون بلغم):**\n\n🔹 **الأسباب:**\n• **ارتجاع معدي:** الأشيع!\n• **حساسية صدرية خفيفة**\n• **التهاب شعبي فيروسي** (بعد البرد)\n• **حساسية من غبار أو دخان**\n• **أدوية ضغط** (ACE inhibitors)\n• **هواء جاف**\n• **كورونا** (لو في أعراض تانية)\n\n💊 **العلاج:**\n• **شراب كحة مهدئ:**\n  - توبلكسيل\n  - نوتوسيل\n• **مضاد هيستامين:** زيرتك ليلاً\n• **بخاخ كورتيزون:** لو حساسية صدرية\n• **لو ارتجاع:**\n  - أوميبرازول 20mg\n  - لا تنام بعد الأكل مباشرة\n\n🏠 **علاج منزلي:**\n• **عسل نحل:** ملعقة قبل النوم\n• **زنجبيل وليمون:** مشروب دافئ\n• **استنشاق بخار** بالأوكالبتوس\n• **مرطب هواء** في الغرفة\n• **تجنب:** دخان، عطور، غبار\n\n⚠️ **راجع طبيب لو:**\n• كحة أكثر من 3 أسابيع\n• ضيق تنفس\n• ألم صدر\n• حمى\n• فقدان وزن\n• كحة دموية",
    drugs: ["توبلكسيل شراب","عسل نحل","زيرتك","أوميبرازول لو ارتجاع"]
  },

  "خمول_تعب": {
    keywords: ["تعبان","خمول","كسلان","مرهق","ما عنديش طاقة","exhaustion","fatigue","نفسي انام طول الوقت","مش قادر اصحى","جسمي تقيل","حاسس بإرهاق","تعب مزمن","نفسي مش عايز اعمل حاجة","جسمي مكسر","ما عنديش نشاط"],
    response: "📋 **التعب والخمول المستمر:**\n\n🔹 **الأسباب الشائعة:**\n• **أنيميا (فقر دم):** الأشيع\n• **نقص فيتامين D**\n• **نقص فيتامين B12**\n• **كسل الغدة الدرقية**\n• **قلة نوم** أو نوم غير منتظم\n• **سكري غير مضبوط**\n• **اكتئاب**\n• **جفاف مزمن**\n• **سوء تغذية**\n\n🔬 **تحاليل مهمة:**\n• صورة دم كاملة (CBC)\n• فيتامين D\n• فيتامين B12\n• وظائف غدة درقية (TSH)\n• سكر صائم\n\n💊 **العلاج حسب السبب:**\n• **أنيميا:** حديد + فيتامين B12\n• **نقص فيتامين D:** 50,000 وحدة أسبوعياً\n• **كسل غدة:** يوثيروكسين\n• **سكري:** ضبط السكر\n\n💪 **نصائح لزيادة الطاقة:**\n• **نوم منتظم:** 7-8 ساعات\n• **رياضة:** حتى مشي 20 دقيقة\n• **أكل صحي:** بروتين + فواكه + خضار\n• **شرب ماء كثير:** 2-3 لتر\n• **تقليل كافيين:** بيزود الإرهاق\n• **تعرض لشمس:** 15 دقيقة يومياً\n• **فيتامينات متعددة:** Multivitamin\n\n⚠️ **راجع طبيب لو:**\n• تعب شديد أكثر من شهر\n• فقدان وزن\n• حمى متكررة\n• تورم غدد\n• ألم مفاصل أو عضلات",
    drugs: ["حديد + فيتامين B12","فيتامين D 50000","فحص شامل","نوم منتظم"]
  },

  "امساك_شديد": {
    keywords: ["ممساك","امساك شديد","مش عارف اخرج","عدم تبرز","constipation","معدتي قافلة","بطني منتفخ من الامساك","ما قدرتش ادخل الحمام","براز صلب","ما بطلعش منى حاجة","بقالي ايام ما دخلتش الحمام"],
    response: "📋 **الإمساك الشديد:**\n\n🔹 **التعريف:**\n• تبرز أقل من 3 مرات أسبوعياً\n• براز صلب وجاف\n• صعوبة شديدة في الإخراج\n• ألم وإجهاد\n• انتفاخ بطن\n\n🔹 **الأسباب:**\n• قلة ألياف\n• قلة شرب ماء\n• قلة حركة\n• بعض الأدوية (حديد، مسكنات)\n• القولون العصبي\n• قلق وتوتر\n\n💊 **العلاج السريع:**\n• **ملين فوري:**\n  - لاكتيلوز (دوفلاك) 15ml مرتين\n  - بيساكوديل (Dulcolax) 2 قرص ليلاً\n  - تحاميل جليسرين\n• **ملين طبيعي:**\n  - زيت خروع ملعقة\n  - خوخ مجفف (Prunes)\n• **ألياف:**\n  - فايبوجيل كيس مرتين\n  - سيلليوم\n\n🍎 **نظام غذائي:**\n• ✅ **أكثر من:**\n  - خضروات ورقية\n  - فواكه (خوخ، تين، برقوق)\n  - حبوب كاملة (شوفان، أرز بني)\n  - بقوليات\n  - **ماء 2-3 لتر يومياً** (الأهم!)\n• ❌ **تجنب:**\n  - أرز أبيض\n  - موز\n  - شاي كثير\n  - جبنة\n\n💪 **نصائح:**\n• مشي 30 دقيقة يومياً\n• لا تؤجل الذهاب للحمام\n• روتين صباحي ثابت\n• تدليك بطن دائري\n• قهوة صباحية (تحفز الأمعاء)\n\n⚠️ **طوارئ لو:**\n• إمساك أكثر من أسبوع\n• ألم بطن شديد\n• قيء\n• دم في البراز\n• فقدان وزن\n• انتفاخ شديد",
    drugs: ["دوفلاك شراب","فايبوجيل","تحاميل جليسرين","ماء 3 لتر يومياً"]
  },

  "حساسية_جلد": {
    keywords: ["حساسية جلد","طفح جلدي","هرش","حكة","جلدي احمر","allergy","ارتكاريا","حبوب حمرا","جلدي بيحرقني","هرشان","بقع حمراء","حساسية من اكل","حساسية دوا"],
    response: "📋 **الحساسية الجلدية (Urticaria/Rash):**\n\n🔹 **الأنواع:**\n• **ارتكاريا (شرى):** حبوب حمراء منتفخة حكة شديدة\n• **أكزيما:** جفاف، تقشر، حكة\n• **التهاب تماسي:** من لمس مادة معينة\n\n🔹 **الأسباب:**\n• **أطعمة:** بيض، سمك، مكسرات، فراولة\n• **أدوية:** مضادات حيوية، أسبرين\n• **لدغ حشرات**\n• **مواد تنظيف، صابون، عطور**\n• **حرارة، برودة، ضغط**\n• **توتر نفسي**\n\n💊 **العلاج:**\n• **مضاد هيستامين (الأهم!):**\n  - سيتريزين (زيرتك) 10mg يومياً\n  - لوراتادين (كلاريتين)\n  - فيكسوفينادين (تيلفاست)\n• **كريمات موضعية:**\n  - كورتيزون خفيف (هيدروكورتيزون 1%)\n  - كلامين لوشن للحكة\n• **للحالات الشديدة:**\n  - كورتيزون أقراص (بريدنيزولون) 5 أيام\n\n🏠 **العلاج المنزلي:**\n• **كمادات باردة** على المنطقة\n• **حمام شوفان فاتر**\n• **تجنب الحك** (يزيد الحساسية)\n• **ملابس قطنية فضفاضة**\n• **تجنب المسبب** (لو معروف)\n\n🚫 **تجنب:**\n• الصابون المعطر\n• الاستحمام بماء ساخن جداً\n• الملابس الصوف\n• التوتر\n\n⚠️ **طوارئ فوراً لو:**\n• **تورم في الوجه أو الحلق**\n• **صعوبة تنفس**\n• **دوخة شديدة**\n• **تسارع نبض**\n(علامات صدمة حساسية - خطر الموت!)\n\n💡 **اتصل بالإسعاف فوراً لو حصل أي من الأعراض الخطيرة!**",
    drugs: ["زيرتك 10mg","كريم كورتيزون 1%","كمادات باردة","تجنب المسبب"]
  },

  "جفاف": {
    keywords: ["عطشان","جفاف","ريقي ناشف","فمي جاف","dehydration","ما بشربش ماية","بولي غامق","عطش شديد","شفايفي ناشفة","لساني جاف","عيوني غايرة","حاسس بهبوط"],
    response: "📋 **الجفاف (Dehydration):**\n\n🔹 **الأعراض:**\n• **خفيف:**\n  - عطش\n  - فم جاف\n  - بول غامق وقليل\n• **متوسط:**\n  - صداع\n  - دوخة\n  - إمساك\n  - جفاف جلد\n• **شديد:**\n  - ضعف شديد\n  - عدم تبول أكثر من 8 ساعات\n  - عيون غائرة\n  - خفقان قلب\n  - تشوش ذهني\n\n🔹 **الأسباب:**\n• قلة شرب ماء\n• إسهال أو قيء\n• حمى\n• مجهود بدني شديد\n• حر شديد\n• سكري غير مضبوط\n\n💧 **العلاج:**\n• **خفيف-متوسط:**\n  - **ماء:** رشفات صغيرة متكررة\n  - **محلول جفاف (ORS):** هيدروسيف، ريهيدران\n  - **عصير طبيعي** مخفف\n  - **ماء جوز الهند**\n• **شديد:**\n  - **مستشفى لسوائل وريدية**\n\n🍎 **الوقاية:**\n• **اشرب 2-3 لتر ماء يومياً**\n• زيد الماء لو:\n  - جو حار\n  - رياضة\n  - حامل أو مرضعة\n  - مريض (حمى/إسهال)\n• **خضروات وفواكه:** خيار، بطيخ، برتقان\n• **قلل:** قهوة، شاي، مشروبات غازية\n\n💡 **اختبار بسيط:**\n• **لون البول:**\n  - أصفر فاتح = ممتاز\n  - أصفر غامق = محتاج ماء\n  - بني غامق = جفاف شديد\n\n⚠️ **طوارئ لو:**\n• لا تبول أكثر من 12 ساعة\n• دوخة شديدة عند الوقوف\n• خفقان سريع\n• تشوش أو إغماء\n• إسهال/قيء شديد مستمر",
    drugs: ["محلول ORS","ماء 3 لتر","ماء جوز الهند","سوائل وريدية للشديد"]
  },

  "هبوط_سكر": {
    keywords: ["هبوط سكر","سكري نازل","رعشة","عرق كتير","جوعان جداً","hypoglycemia","حاسس بدوخة وجوع","ايدي بترعش","عرقان فجأة","low blood sugar","سكر واطي","حاسس هموت من الجوع"],
    response: "📋 **هبوط السكر (Hypoglycemia):**\n\n🔹 **الأعراض:**\n• **مبكرة:**\n  - جوع شديد مفاجئ\n  - رعشة\n  - تعرق\n  - خفقان قلب\n  - شحوب\n  - قلق\n• **متأخرة:**\n  - دوخة وضعف\n  - تشوش وصعوبة تركيز\n  - كلام غير واضح\n  - ازدواج رؤية\n  - تشنجات\n  - إغماء\n\n🔹 **الأسباب:**\n• جرعة أنسولين زائدة\n• دواء سكر بدون أكل كافي\n• تخطي وجبة\n• مجهود بدني زائد\n\n🚨 **العلاج الفوري (قاعدة 15-15):**\n1. **كل سكر سريع فوراً:**\n   - 3 ملاعق سكر\n   - أو كوب عصير\n   - أو 4 قطع حلوى\n   - أو ملعقة عسل\n2. **انتظر 15 دقيقة**\n3. **قس السكر:**\n   - لو لسه أقل من 70 → كرر\n   - لو فوق 70 → كل وجبة خفيفة (خبز + جبنة)\n\n⚠️ **ممنوع:**\n• لا تعطي أكل لشخص فاقد الوعي!\n• اتصل بالإسعاف فوراً\n• حقن جلوكاجون (لو متاح)\n\n🛡️ **الوقاية:**\n• لا تخطي وجبات\n• قس السكر قبل القيادة\n• احمل حلوى دائماً\n• ضبط جرعة الدواء مع الطبيب\n• قس السكر قبل/بعد الرياضة\n• علّم أهلك كيف يتصرفوا\n\n⚠️ **طوارئ لو:**\n• فقدان وعي\n• تشنجات\n• لا يستطيع البلع\n• السكر لا يرتفع بعد العلاج",
    drugs: ["سكر أو عصير فوراً","حلوى سريعة","حقن جلوكاجون (طوارئ)","ضبط جرعة الدواء"]
  },
"التواء_الكاحل": {
    keywords: ["التواء كاحل","ankle sprain","التفاف قدم","إصابة قدم","تمزق أربطة كاحل"],
    response: "📋 **التواء الكاحل (Ankle Sprain):**\n\n🔹 **الموقع:** أربطة مفصل **الكاحل** (غالباً الأربطة الجانبية الخارجية).\n🔹 **الآلية:** هبوط خاطئ على القدم، أو 'التواء' القدم للداخل.\n🔹 **الأعراض (حسب الدرجة):**\n• ألم مفاجئ وتورم في الكاحل (فوري)\n• صعوبة في تحميل الوزن والمشي\n• كدمة (لون أزرق/أسود) تظهر لاحقاً\n• عدم ثبات في المفصل (في التواء الدرجة الثالثة)\n\n💊 **الإسعاف والعلاج:**\n• **فوري (RICE):** **راحة**، **ثلج**، **ضغط**، **رفع** القدم فوق مستوى القلب.\n• **مسكنات:** إيبوبروفين.\n• **تثبيت:** (في الدرجة الثانية والثالثة) باستخدام جبيرة أو واقي للكاحل.\n• **علاج طبيعي:** (الأهم) تمارين تقوية الأربطة وتمارين التوازن (Proprioception).\n\n⚠️ **راجع طبيب لو:** عدم القدرة المطلقة على تحميل الوزن بعد الإصابة (خطر كسر).\n",
    drugs: ["راحة وثلج (RICE)","جبيرة تثبيت","إيبوبروفين","تمارين توازن"]
},
"شد_الفخذ_الداخلي": {
    keywords: ["شد فخذ داخلي","عضلات ضامة","adductor strain","الآم عانة","الفخذ الداخلي"],
    response: "📋 **إجهاد العضلات الضامة (Groin/Adductor Strain):**\n\n🔹 **الموقع:** العضلات **الداخلية للفخذ** التي تلتقي عند **عظم العانة**.\n🔹 **الآلية:** شائعة جداً في كرة القدم نتيجة لحركة تغيير الاتجاه السريعة أو الركل العرضي.\n🔹 **الأعراض:**\n• ألم مفاجئ في منطقة الفخذ الداخلية أو العانة\n• ألم عند ضم الساقين معاً (Adduction)\n• صعوبة في الجري أو المشي بخطوات واسعة\n\n💊 **الإسعاف والعلاج:**\n• **فوري (RICE):** راحة، ثلج، ضغط، رفع (بقدر الإمكان).\n• **مسكنات ومضادات التهاب**.\n• **علاج طبيعي:** تمارين تقوية عضلات الضم تدريجياً، مع تمارين تقوية عضلات الجذع.\n\n💡 **العودة للعب:** يجب أن تكون بطيئة جداً، حيث أن هذه الإصابة تميل للتكرار.\n",
    drugs: ["راحة وثلج (RICE)","مسكنات","تمارين إطالة العانة","علاج طبيعي"]
},
"كدمة_الفخذ": {
    keywords: ["كدمة فخذ","ضربة فخذ","contusion","ألم ضربة","تورم فخذ"],
    response: "📋 **كدمة الفخذ العضلية (Muscle Contusion):**\n\n🔹 **الموقع:** أي عضلة في الساق، ولكن الأشيع هي **العضلة الأمامية للفخذ**.\n🔹 **الآلية:** تحدث نتيجة **ضربة مباشرة قوية** (احتواء لاعب بكتف أو ركبة).\n🔹 **الأعراض:**\n• ألم حاد في موقع الضربة\n• تورم وكدمة (تغير لون الجلد إلى الأزرق أو الأرجواني)\n• قد يكون هناك تصلب وصعوبة في ثني المفصل المجاور\n\n💊 **الإسعاف والعلاج:**\n• **فوري (RICE):** **راحة**، **ثلج**، **ضغط** (بشدة معينة)، **رفع**.\n• **مسكنات** (لتخفيف الألم).\n• **ممنوع التدليك** في الأيام الأولى (خطر تحولها إلى تعظم عضلي).\n\n⚠️ **راجع طبيب:** لو كان التورم شديداً جداً، أو استمر الألم والتصلب بعد 3 أسابيع (خطر التعظم العضلي).\n",
    drugs: ["راحة وثلج (RICE)","مسكنات","ممنوع التدليك","رفع الساق"]
}, 
  /* ========== أمراض الأذن والأنف ========== */

  "التهاب_اذن": {
    keywords: ["التهاب اذن","وجع اذن","ear infection","اذن","otitis"],
    response: "📋 **التهاب الأذن (Otitis):**\n\n🔹 **التهاب الأذن الوسطى (الأشيع عند الأطفال):**\n• **أعراض:**\n  - ألم أذن شديد\n  - ضعف سمع مؤقت\n  - امتلاء وضغط\n  - حمى\n  - سائل يخرج من الأذن (لو انثقب الطبل)\n  - عند الرضع: بكاء، شد الأذن، صعوبة نوم\n• **علاج:**\n  - مسكن: إيبوبروفين أو باراسيتامول\n  - مضاد حيوي (لو بكتيري):\n    * أموكسيسيلين 500mg 3 مرات\n    * أو أوجمنتين\n    * 7-10 أيام\n  - كمادات دافئة\n  - قد يُفتح الطبل جراحياً (لو سائل مستمر)\n\n🔹 **التهاب الأذن الخارجية (أذن السباح):**\n• **أعراض:**\n  - حكة\n  - ألم عند شد الأذن أو الضغط\n  - احمرار وتورم\n  - إفرازات\n• **علاج:**\n  - قطرة مضاد حيوي + كورتيزون:\n    * Otosporin\n    * Ciprodex\n  - 3-4 مرات يومياً 7-10 أيام\n  - خل أبيض مخفف (وقاية)\n  - جفف الأذن جيداً بعد السباحة\n  - لا أعواد قطن!\n\n⚠️ **راجع طبيب فوراً لو:**\n• ألم شديد جداً\n• حمى عالية\n• سائل أو دم من الأذن\n• تورم خلف الأذن\n• دوخة أو فقدان توازن\n• ضعف سمع مستمر\n• أعراض تسوء\n\n🛡️ **الوقاية:**\n• لا تدخل أي شيء في الأذن\n• جفف الأذن بعد السباحة\n• علاج حساسية ونزلات برد\n• لا تدخن حول الأطفال\n• رضاعة طبيعية (تحمي الرضع)",
    drugs: ["أموكسيسيلين 500mg","قطرة أوتوسبورين","إيبوبروفين للألم","كمادات دافئة"]
  },

  /* ========== أمراض النساء ========== */

  "التهاب_مهبلي": {
    keywords: ["التهاب مهبلي","vaginitis","حكة مهبلية","افرازات","فطريات مهبلية"],
    response: "📋 **الالتهابات المهبلية:**\n\n🔹 **عدوى فطرية (Yeast infection) - الأشيع:**\n• **أعراض:**\n  - حكة وحرقان شديد\n  - إفرازات بيضاء سميكة (جبن قريش)\n  - احمرار وتورم\n  - ألم عند التبول أو الجماع\n• **علاج:**\n  - كريم مضاد فطريات:\n    * كلوتريمازول (Canesten)\n    * ميكونازول\n  - لبوس مهبلي 1-3 أيام\n  - أو فلوكونازول 150mg جرعة واحدة فموية\n• **وقاية:**\n  - ملابس داخلية قطنية\n  - تجنب غسول مهبلي\n  - جففي جيداً\n  - بروبيوتيك\n  - زبادي بدون سكر\n\n🔹 **التهاب بكتيري (Bacterial vaginosis):**\n• **أعراض:**\n  - إفرازات رمادية/بيضاء\n  - رائحة سمك (خاصة بعد الجماع)\n  - حكة خفيفة\n• **علاج:**\n  - ميترونيدازول (Flagyl):\n    * أقراص 500mg مرتين 7 أيام\n    * أو جل مهبلي\n  - كليندامايسين كريم\n  - لا كحول مع الفلاجيل!\n\n🔹 **داء المشعرات (Trichomoniasis) - منقول جنسياً:**\n• **أعراض:**\n  - إفرازات صفراء/خضراء رغوية\n  - رائحة كريهة\n  - حكة واحمرار شديد\n  - ألم عند التبول\n• **علاج:**\n  - ميترونيدازول 2 جرام جرعة واحدة\n  - أو 500mg مرتين 7 أيام\n  - **علاج الشريك ضروري!**\n\n⚠️ **راجعي طبيبة لو:**\n• أول مرة تحصل معك\n• حامل\n• أعراض شديدة\n• حمى\n• ألم بطن\n• تكرر أكثر من 4 مرات سنوياً\n• لا تحسن بالعلاج\n\n🚫 **تجنبي:**\n• غسول مهبلي (يقتل البكتيريا النافعة)\n• صابون معطر\n• فقاعات حمام\n• ملابس ضيقة\n• بقاء ملابس رياضة مبللة\n• مناديل معطرة\n\n💡 **نصائح:**\n• المهبل ينظف نفسه\n• اغسلي بماء فقط من الخارج\n• امسحي من الأمام للخلف\n• غيري فوط صحية بانتظام\n• قطن 100%",
    drugs: ["كانستن لبوس","فلوكونازول 150mg","فلاجيل للبكتيري","بروبيوتيك"]
  },
  "كحة": {
    keywords: ["كحة","سعال","سعله","كحه","بلغم","cough"],
    response: "السعال قد يكون:\n\n🔹 فيروسي (برد/إنفلونزا): الأكثر شيوعاً\n🔹 حساسية صدرية\n🔹 التهاب شعبي\n🔹 ارتجاع المريء\n\n💊 العلاج المنزلي:\n- شرب سوائل دافئة (زنجبيل، عسل، ليمون)\n- استنشاق بخار ماء دافئ\n- رفع الوسادة عند النوم\n- العسل الطبيعي (ملعقة قبل النوم)\n\n⚠️ راجع طبيب لو:\n- كحة أكثر من 3 أسابيع\n- بلغم دموي\n- ضيق تنفس شديد\n- حمى عالية مستمرة"
  },
  "وجع بطن": {
    keywords: ["بطني","بطن","معدة","معده","امساك","اسهال","مغص","قولون"],
    response: "ألم البطن له أسباب متعددة:\n\n🔹 عسر هضم أو حموضة\n🔹 القولون العصبي\n🔹 إمساك أو إسهال\n🔹 التهاب معوي\n🔹 التهاب زائدة (ألم حاد يمين أسفل)\n\n💊 العلاج:\n- نظام غذائي خفيف (موز، أرز، تفاح)\n- شرب ماء كثير\n- تجنب الطعام الدسم والحار\n- يانسون أو نعناع دافئ\n\n⚠️ طوارئ لو:\n- ألم حاد مفاجئ\n- قيء مستمر أو دموي\n- براز أسود أو دموي\n- انتفاخ شديد مع عدم خروج غازات"
  },
  "وجع ظهر": {
    keywords: ["ظهري","ظهر","ضهر","ضهري","فقرات","عمود فقري","back pain"],
    response: "ألم الظهر شائع جداً:\n\n🔹 شد عضلي: الأكثر شيوعاً\n🔹 وضعية جلوس خاطئة\n🔹 حمل أثقال بطريقة خاطئة\n🔹 انزلاق غضروفي (ديسك)\n🔹 التهاب مفاصل\n\n💊 العلاج:\n- راحة لكن ليست كاملة (حركة خفيفة مفيدة)\n- كمادات دافئة\n- مسكن خفيف\n- تمارين إطالة لطيفة\n- تحسين وضعية الجلوس\n\n⚠️ راجع طبيب لو:\n- ألم ينزل للساق مع تنميل\n- ضعف في الساقين\n- فقدان تحكم في البول/البراز\n- ألم بعد إصابة\n- ألم مع حمى"
  },
  "حساسية": {
    keywords: ["حساسية","حساسيه","هرش","حكة","طفح","جلدي","allergy"],
    response: "الحساسية أنواع:\n\n🔹 حساسية جلدية: احمرار، حكة، طفح\n🔹 حساسية تنفسية: عطس، رشح، كحة\n🔹 حساسية طعام: غثيان، إسهال\n\n💊 العلاج:\n- تجنب المسبب (غبار، حيوانات، طعام معين)\n- مضادات هيستامين (حسب استشارة)\n- كريم مهدئ للجلد\n- كمادات باردة\n\n⚠️ طوارئ لو:\n- صعوبة تنفس\n- تورم في الوجه أو الحلق\n- دوخة شديدة"
  },
  "حرارة": {
    keywords: ["حرارة","حمى","سخونة","سخونه","fever","حراره"],
    response: "الحمى دفاع الجسم ضد العدوى:\n\n🔹 فوق 38°: حمى خفيفة\n🔹 فوق 39°: حمى متوسطة\n🔹 فوق 40°: حمى عالية\n\n💊 العلاج:\n- خافض حرارة (باراسيتامول أو ايبوبروفين)\n- شرب سوائل كثيرة\n- حمام فاتر (ليس بارد)\n- راحة تامة\n- ملابس خفيفة\n\n⚠️ طوارئ لو:\n- حمى فوق 40° ومستمرة\n- تشنجات\n- طفح جلدي منتشر\n- صعوبة تنفس\n- عدم استجابة"
  },
  "ركبة": {
    keywords: ["ركبة","ركبتي","ركب","مفصل","knee"],
    response: "ألم الركبة له أسباب:\n\n🔹 إجهاد أو شد عضلي\n🔹 خشونة المفاصل\n🔹 التهاب الأوتار\n🔹 إصابة غضروف\n🔹 زيادة الوزن\n\n💊 العلاج:\n- راحة وتجنب المجهود\n- كمادات باردة أول 48 ساعة\n- رفع الساق عند الاستلقاء\n- تمارين تقوية خفيفة\n- خسارة وزن لو زائد\n\n⚠️ راجع طبيب لو:\n- ورم شديد\n- عدم قدرة على المشي\n- الركبة محمرة وساخنة\n- ألم مع صوت طقطقة"
  },
  "قلق": {
    keywords: ["قلق","قلقان","توتر","خوف","anxiety","اكتئاب"],
    response: "القلق والتوتر طبيعي لكن المبالغة مشكلة:\n\n🔹 أعراض القلق:\n- خفقان قلب\n- تعرق\n- صعوبة تركيز\n- أرق\n- توتر عضلي\n\n💊 العلاج:\n- تمارين تنفس عميق\n- رياضة منتظمة\n- نوم كافي 7-8 ساعات\n- تقليل كافيين\n- تأمل ويوغا\n- كلام مع أصدقاء\n\n⚠️ راجع أخصائي نفسي لو:\n- يعيق حياتك اليومية\n- أفكار انتحارية\n- نوبات هلع متكررة\n- لا تستطيع السيطرة عليه"
  },
  "نوم": {
    keywords: ["نوم","ارق","مانمتش","تعب","sleep","insomnia"],
    response: "نصائح للنوم الجيد:\n\n🔹 نظافة النوم:\n- نم واستيقظ بنفس الوقت يومياً\n- غرفة مظلمة وباردة وهادئة\n- سرير مريح\n- لا شاشات قبل النوم بساعة\n\n🔹 نمط الحياة:\n- رياضة بانتظام (ليس قبل النوم)\n- تجنب كافيين بعد الظهر\n- وجبة خفيفة مساءً\n- استرخاء قبل النوم (قراءة، حمام دافئ)\n\n💊 حلول طبيعية:\n- شاي بابونج\n- حليب دافئ\n- تمارين تنفس\n\n⚠️ راجع طبيب لو:\n- أرق مزمن أكثر من شهر\n- شخير شديد\n- توقف تنفس أثناء النوم"
  }
};
 

function initAI(){
  const chatWindow = $('chatWindow');
  const chatInput = $('chatInput');
  const sendBtn = $('sendChatBtn');
  const voiceBtn = $('voiceChatBtn');
  
  let chatHistory = JSON.parse(localStorage.getItem('chat_history_v2') || '[]');
  
  function addMessage(text, who='bot'){
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    chatHistory.push({text, who, time: new Date().toISOString()});
    if(chatHistory.length > 100) chatHistory.shift();
    localStorage.setItem('chat_history_v2', JSON.stringify(chatHistory));
  }
  
  chatHistory.forEach(m => addMessage(m.text, m.who));
  
 function analyzeQuery(query){
  const q = normalizeArabic(query);
  
  // 🚨 فحص طوارئ
  const emergency = [
    "صعوبة تنفس", "ضيق نفس", "الم صدر", "فقدان وعي",
    "نزيف شديد", "كسر عظم", "حرق كبير", "جلطة",
    "شلل", "تنميل نص جسم", "دوخة شديدة", "اغماء"
  ];
  
  if(emergency.some(e => q.includes(normalizeArabic(e)))){
    beep(1200, 0.2);
    return "🚨 **تحذير طوارئ!**\n\nالأعراض التي ذكرتها **خطيرة جداً**\n\n📞 **اتصل بالإسعاف فوراً:**\n• مصر: 123\n• السعودية: 997\n• الإمارات: 998/999\n\n⏱️ **كل دقيقة مهمة!**";
  }
  
  // 🧠 البحث الذكي بالتشابه
  let bestMatch = null;
  let highestScore = 0;
  
  for(let topic in medicalKB){
    const data = medicalKB[topic];
    
    for(let keyword of data.keywords){
      const score = fuzzyMatch(keyword, q);
      
      if(score > highestScore && score >= 50) { // نسبة تشابه 50% على الأقل
        highestScore = score;
        bestMatch = data;
      }
    }
  }
  
  // لو لقى تطابق جيد
  if(bestMatch && highestScore >= 60) {
    console.log(`✅ تم العثور على تطابق: ${highestScore.toFixed(0)}%`);
    return bestMatch.response;
  }
  
  // لو تطابق ضعيف (50-59%)
  if(bestMatch && highestScore >= 50) {
    return `🤔 هل تقصد أحد هذه الأعراض؟\n\n${bestMatch.response.split('\n').slice(0, 5).join('\n')}\n\n💡 **أو وضح أكثر:**\nصف الأعراض بالتفصيل`;
  }
  
  // لو مفيش تطابق
  return `شكراً على سؤالك 🩺\n\nلم أفهم تماماً. هل يمكنك:\n\n✅ **وصف الأعراض بالتفصيل:**\n• مكان الألم\n• شدة الألم (1-10)\n• متى بدأ\n• أعراض أخرى\n\n💡 **أو اسأل عن:**\n• أمراض: صداع، كحة، حموضة، إمساك\n• أعراض: ألم، حمى، غثيان\n• مناطق: بطن، ظهر، رأس، صدر`;
}
  
  function handleSend(){
    const text = chatInput.value.trim();
    if(!text) return;
    
    addMessage(text, 'user');
    chatInput.value = '';
    
    addMessage('...جاري التحليل', 'bot');
    
    setTimeout(()=>{
      const msgs = chatWindow.querySelectorAll('.msg.bot');
      if(msgs.length) msgs[msgs.length-1].remove();
      
      const reply = analyzeQuery(text);
      addMessage(reply, 'bot');
      
      if('speechSynthesis' in window){
        const utterance = new SpeechSynthesisUtterance(reply.replace(/\n/g, ' ').replace(/🔹|💊|⚠️|✅|🔴|💡|🚨|🩺/g, ''));
        utterance.lang = 'ar-SA';
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
      
      addLog(`سؤال AI: ${text.substring(0,30)}...`);
    }, 600);
  }
  
  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e)=> {
    if(e.key === 'Enter') handleSend();
  });
  
  voiceBtn.addEventListener('click', ()=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) return alert('التعرف الصوتي غير مدعوم');
    
    const rec = new SpeechRecognition();
    rec.lang='ar-SA';
    rec.interimResults=false;
    
    voiceBtn.textContent = '🎤 استمع...';
    voiceBtn.disabled = true;
    
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      chatInput.value = transcript;
      voiceBtn.textContent = '🎤';
      voiceBtn.disabled = false;
      handleSend();
    };
    
    rec.onerror = () => {
      voiceBtn.textContent = '🎤';
      voiceBtn.disabled = false;
      alert('خطأ في التعرف الصوتي');
    };
    
    rec.start();
  });
  
  $$('.quick').forEach(btn => {
    btn.addEventListener('click', ()=> {
      chatInput.value = btn.dataset.q;
      handleSend();
    });
  });
}

/* ═══════════════════════════════════════════════════
   📊 BMI CALCULATOR
   ═══════════════════════════════════════════════════ */

let bmiHistory = JSON.parse(localStorage.getItem('bmi_history') || '[]');

function calculateBMI() {
  const gender = $('bmiGender').value;
  const age = parseFloat($('bmiAge').value);
  const height = parseFloat($('bmiHeight').value);
  const weight = parseFloat($('bmiWeight').value);
  
  // ✅ التحقق من المدخلات
  if (!gender) {
    alert('⚠️ من فضلك اختر الجنس!');
    return;
  }
  
  if (!age || age < 2 || age > 120) {
    alert('⚠️ من فضلك أدخل سن صحيح!\n\nالسن: 2-120 سنة');
    return;
  }
  
  if (!height || !weight || height < 100 || height > 250 || weight < 30 || weight > 300) {
    alert('⚠️ من فضلك أدخل قيم صحيحة!\n\nالطول: 100-250 سم\nالوزن: 30-300 كجم');
    return;
  }
  
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const bmiRounded = bmi.toFixed(1);
  
  let category = '';
  let categoryColor = '';
  let emoji = '';
  let advice = '';
  let indicatorPosition = 0;
  
  // 🎯 تحديد الفئة حسب BMI
  if (bmi < 18.5) {
    category = 'نحيف';
    categoryColor = '#3b82f6';
    emoji = '🔵';
    advice = `
      <strong>🔵 أنت تحت الوزن الطبيعي</strong><br><br>
      💡 <strong>نصائح ${gender === 'male' ? 'للرجال' : 'للنساء'}:</strong><br>
      • زيادة السعرات الحرارية بطريقة صحية<br>
      • تناول 5-6 وجبات صغيرة يومياً<br>
      • أكثر من البروتين<br>
      • تمارين مقاومة لبناء عضلات
    `;
    indicatorPosition = (bmi / 18.5) * 25;
  } else if (bmi < 25) {
    category = 'طبيعي';
    categoryColor = '#10b981';
    emoji = '🟢';
    advice = `
      <strong>🟢 ممتاز! وزنك مثالي وصحي</strong><br><br>
      💡 <strong>حافظ على صحتك:</strong><br>
      • استمر على نظام غذائي متوازن<br>
      • رياضة منتظمة 30 دقيقة يومياً<br>
      • نوم كافي 7-8 ساعات<br>
      • شرب ماء كثير
    `;
    indicatorPosition = 25 + ((bmi - 18.5) / (24.9 - 18.5)) * 25;
  } else if (bmi < 30) {
    category = 'زيادة وزن';
    categoryColor = '#f59e0b';
    emoji = '🟡';
    advice = `
      <strong>🟡 لديك زيادة في الوزن</strong><br><br>
      💡 <strong>نصائح للتحسين:</strong><br>
      • قلل السعرات 500 kcal يومياً<br>
      • تجنب سكريات ومشروبات غازية<br>
      • زيد خضروات وألياف<br>
      • رياضة كارديو 45 دقيقة 5 مرات أسبوعياً
    `;
    indicatorPosition = 50 + ((bmi - 25) / (29.9 - 25)) * 25;
  } else {
    category = 'سمنة';
    categoryColor = '#ef4444';
    emoji = '🔴';
    
    let obesityLevel = '';
    if (bmi < 35) obesityLevel = 'من الدرجة الأولى';
    else if (bmi < 40) obesityLevel = 'من الدرجة الثانية';
    else obesityLevel = 'مفرطة (الدرجة الثالثة)';
    
    advice = `
      <strong>🔴 سمنة ${obesityLevel}</strong><br><br>
      ⚠️ <strong>تحذير صحي:</strong><br>
      السمنة تزيد خطر: سكري، ضغط دم، قلب، مفاصل<br><br>
      💡 <strong>خطوات ضرورية:</strong><br>
      • استشر طبيب وأخصائي تغذية <strong>فوراً</strong><br>
      • افحص: سكر، ضغط، دهون<br>
      • ابدأ تدريجياً: مشي 15 دقيقة<br>
      • قلل الأكل الدسم والسكريات
    `;
    indicatorPosition = 75 + Math.min(((bmi - 30) / 10) * 25, 25);
  }
  
  // 🎯 حساب الوزن المثالي (مع الأخذ بعين الاعتبار الجنس والعمر)
  const idealBMI = 22;
  const idealWeight = idealBMI * (heightInMeters * heightInMeters);
  const weightDiff = weight - idealWeight;
  
  let idealWeightText = '';
  if (Math.abs(weightDiff) < 2) {
    idealWeightText = `<strong>مثالي! 🎯</strong><br>وزنك الحالي ممتاز`;
  } else if (weightDiff > 0) {
    idealWeightText = `
      <strong>الوزن المثالي ${gender === 'male' ? 'للرجل' : 'للمرأة'} بعمر ${age} سنة:</strong> ${idealWeight.toFixed(1)} كجم<br>
      يعني محتاج تخس: <strong style="color:#ef4444;">${weightDiff.toFixed(1)} كجم</strong><br>
      <span style="font-size:14px;">هدف واقعي: 0.5-1 كجم في الأسبوع ⏰</span>
    `;
  } else {
    idealWeightText = `
      <strong>الوزن المثالي ${gender === 'male' ? 'للرجل' : 'للمرأة'} بعمر ${age} سنة:</strong> ${idealWeight.toFixed(1)} كجم<br>
      يعني محتاج تزيد: <strong style="color:#3b82f6;">${Math.abs(weightDiff).toFixed(1)} كجم</strong><br>
      <span style="font-size:14px;">هدف واقعي: 0.5 كجم في الأسبوع ⏰</span>
    `;
  }
  
  // 📊 عرض النتائج
  $('bmiResult').style.display = 'block';
  $('bmiValue').textContent = bmiRounded;
  $('bmiCategory').textContent = `${emoji} ${category}`;
  $('bmiCategory').style.background = categoryColor;
  $('bmiCategory').style.color = '#fff';
  $('bmiAdvice').innerHTML = advice;
  $('idealWeight').innerHTML = idealWeightText;
  
  // 🆕 عرض النظام الغذائي والتمارين
  showDietAndExercise(category);
  $('bmiIndicator').style.left = `${Math.min(Math.max(indicatorPosition, 0), 100)}%`;
  
  // 💾 حفظ في السجل
  const entry = {
    date: new Date().toISOString(),
    gender,
    age,
    height,
    weight,
    bmi: bmiRounded,
    category
  };
  
  bmiHistory.unshift(entry);
  if (bmiHistory.length > 50) bmiHistory.pop();
  localStorage.setItem('bmi_history', JSON.stringify(bmiHistory));
  
  renderBMIHistory();
  
  addLog(`حساب BMI: ${bmiRounded} (${category}) - ${gender === 'male' ? 'ذكر' : 'أنثى'} ${age} سنة`);
  addPoints(10, 'حساب BMI');
  beep(880, 0.08);
  
  setTimeout(() => {
    $('bmiResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}
// ════════════════════════════════════════════════════════════════
// 🍽️🏋️ عرض النظام الغذائي والتمارين حسب الحالة
// ════════════════════════════════════════════════════════════════
function showDietAndExercise(category) {
  const planDiv = $('bmiPlan');
  const dietDiv = $('dietPlan');
  const exerciseDiv = $('exercisePlan');
  
  let diet = '';
  let exercise = '';
  
  // 🔵 نحيف
  if (category === 'نحيف') {
    diet = `
      <p><strong>🌅 الإفطار:</strong> بيض + جبنة + خبز + عصير فواكه</p>
      <p><strong>🥗 سناك:</strong> مكسرات + زبادي كامل الدسم</p>
      <p><strong>☀️ الغداء:</strong> أرز + لحمة/فراخ + خضار + سلطة</p>
      <p><strong>🌙 العشاء:</strong> بروتين + نشويات + لبن</p>
      <p style="color:#fbbf24;margin-top:10px;">💡 زود السعرات 500 كالوري يومياً</p>
    `;
    
    exercise = `
      <p><strong>💪 تمارين مقاومة:</strong> 3-4 مرات أسبوعياً</p>
      <p>• Push-ups - 3×10</p>
      <p>• Squats - 3×15</p>
      <p>• Planks - 3×30 ث</p>
      <p style="color:#fbbf24;margin-top:10px;">⚠️ قلل الكارديو - ركز على بناء عضلات</p>
    `;
  }
  
  // 🟢 طبيعي
  else if (category === 'طبيعي') {
    diet = `
      <p><strong>🌅 الإفطار:</strong> شوفان + بيض + فواكه</p>
      <p><strong>☀️ الغداء:</strong> أرز بني + بروتين + خضار</p>
      <p><strong>🌙 العشاء:</strong> سلطة + بروتين خفيف</p>
      <p style="color:#10b981;margin-top:10px;">✅ حافظ على التوازن - لا زيادة ولا نقصان</p>
    `;
    
    exercise = `
      <p><strong>🏃 كارديو:</strong> 30 دقيقة - 5 مرات أسبوعياً</p>
      <p><strong>💪 مقاومة:</strong> 3 مرات أسبوعياً</p>
      <p style="color:#10b981;margin-top:10px;">✅ استمر على هذا النظام</p>
    `;
  }
  
  // 🟡 زيادة وزن
  else if (category === 'زيادة وزن') {
    diet = `
      <p><strong>🌅 الإفطار:</strong> بيض مسلوق + خبز أسمر + خيار</p>
      <p><strong>🥗 سناك:</strong> تفاحة + لوز</p>
      <p><strong>☀️ الغداء:</strong> بروتين + نصف كوب أرز + سلطة كبيرة</p>
      <p><strong>🌙 العشاء:</strong> زبادي + خضار</p>
      <p style="color:#f59e0b;margin-top:10px;">⚠️ قلل السعرات 500 كالوري يومياً</p>
    `;
    
    exercise = `
      <p><strong>🏃 كارديو:</strong> 45 دقيقة - 5 مرات أسبوعياً</p>
      <p>• جري، سباحة، دراجة</p>
      <p><strong>💪 مقاومة:</strong> 3 مرات للحفاظ على العضلات</p>
      <p style="color:#f59e0b;margin-top:10px;">⚠️ ابدأ تدريجياً - لا تتعب نفسك</p>
    `;
  }
  
  // 🔴 سمنة
  else if (category === 'سمنة') {
    diet = `
      <p><strong>🌅 الإفطار:</strong> بيض + خضار + قهوة بدون سكر</p>
      <p><strong>☀️ الغداء:</strong> بروتين مشوي + سلطة (بدون نشويات)</p>
      <p><strong>🌙 العشاء:</strong> زبادي لايت + خيار</p>
      <p style="color:#ef4444;margin-top:10px;">🚨 استشر أخصائي تغذية فوراً</p>
    `;
    
    exercise = `
      <p><strong>🚶 مشي:</strong> ابدأ بـ15 دقيقة يومياً</p>
      <p><strong>🏊 سباحة:</strong> ممتازة للمفاصل</p>
      <p><strong>🧘 استرتش:</strong> تمارين خفيفة</p>
      <p style="color:#ef4444;margin-top:10px;">🚨 استشر طبيب قبل بدء أي رياضة شديدة</p>
    `;
  }
  
  // عرض النتائج
  dietDiv.innerHTML = diet;
  exerciseDiv.innerHTML = exercise;
  planDiv.style.display = 'block';
}
// ════════════════════════════════════════════════════════════════
// 💊 قاعدة بيانات الأدوية المصرية - نسخة ذكية ومتطورة
// ════════════════════════════════════════════════════════════════

const egyptianDrugs = [
  {

    name: "بنادول",
    aliases: ["Panadol", "باندول", "بانادول", "پنادول", "باراسيتامول", "بنأدول", "بنإدول", "بننادول", "بنننادول", "بننننادول", "بناادول", "بنااادول", "بناااادول", "بناددول", "بنادددول", "بناددددول", "بنادوول", "بنادووول", "بنادوووول", "بنادولل", "بنادوللل", "بنادولللل", "بادول", "بندول", "بناول", "بناادول", "بنادولل", "بناادول", "بننادول", "بنادولل"],
    scientificName: "Paracetamol 500mg",
    category: "مسكن وخافض حرارة",
    price: "12 جنيه",
    uses: [
      "تسكين الآلام الخفيفة والمتوسطة",
      "خفض درجة الحرارة",
      "الصداع والصداع النصفي",
      "آلام الأسنان",
      "آلام العضلات والمفاصل",
      "آلام الدورة الشهرية"
    ],
    sideEffects: [
      "نادراً: طفح جلدي أو حساسية",
      "نادراً جداً: مشاكل في الكبد عند الجرعات الزائدة",
      "غثيان خفيف في بعض الحالات",
      "نادراً: انخفاض كريات الدم البيضاء"
    ],
    contraindications: [
      "حساسية من الباراسيتامول",
      "مرضى الكبد الشديد",
      "الإفراط في تناول الكحول",
      "أمراض الكلى المزمنة الشديدة"
    ],
    dosage: "للبالغين: قرص أو قرصين (500-1000mg) كل 4-6 ساعات، بحد أقصى 4 جرام يومياً (8 أقراص)",
    warnings: "⚠️ لا تتجاوز الجرعة المحددة - جرعة زائدة قد تسبب تلف كبدي خطير. استشر الطبيب إذا استمرت الأعراض أكثر من 3 أيام."
  },
  {
    name: "فيرناكالانت",
    aliases: ["Vernakalant", "فرناكالانت", "فيرنكالانت", "فيرناكالأنت", "فيرناكالإنت", "فىرناكالانت", "فييرناكالانت", "فيييرناكالانت", "فييييرناكالانت", "فيررناكالانت", "فيرررناكالانت", "فيررررناكالانت", "فيرنناكالانت", "فيرننناكالانت", "فيرنننناكالانت", "فيرنااكالانت", "فيرناااكالانت", "فيرنااااكالانت", "فيرناككالانت", "فيرناكككالانت", "فيرناككككالانت", "فيرناكاالانت", "فيرناكااالانت", "فيرناكاااالانت", "فيرناكاللانت", "فيرناكالللانت", "فيرناكاللللانت", "فيرناكالاانت", "فيرناكالااانت", "فيرناكالاااانت"],
    scientificName: "Vernakalant IV",
    category: "مضاد اضطراب نظم القلب",
    price: "350-500 جنيه",
    uses: [
      "الرجفان الأذيني الحاد",
      "تحويل نظم القلب",
      "اضطرابات نبض القلب"
    ],
    sideEffects: [
      "انخفاض ضغط الدم",
      "غثيان",
      "عطس وسعال",
      "طعم غريب بالفم"
    ],
    contraindications: [
      "قصور القلب الحاد",
      "انخفاض ضغط الدم الشديد",
      "متلازمة QT الطويلة",
      "جراحة قلبية حديثة"
    ],
    dosage: "يُعطى وريدياً في المستشفى فقط تحت إشراف طبي",
    warnings: "⚠️⚠️ يُستخدم في المستشفى فقط. تحت المراقبة الطبية المستمرة."
  },
  {
    name: "ديلتيازم",
    aliases: ["Diltiazem", "دلتيازم", "ديلتازم", "ديلتىازم", "دييلتيازم", "ديييلتيازم", "دييييلتيازم", "ديللتيازم", "ديلللتيازم", "ديللللتيازم", "ديلتتيازم", "ديلتتتيازم", "ديلتتتتيازم", "ديلتييازم", "ديلتيييازم", "ديلتييييازم", "ديلتيآزم", "ديلتياازم", "ديلتيااازم", "ديلتياااازم", "ديلتياززم", "ديلتيازززم", "ديلتياززززم", "ديلتيازمم", "ديلتيازممم", "ديلتيازمممم", "دلتيازم", "ديتيازم", "ديلتيازمم", "ديلتياززم"],
    scientificName: "Diltiazem HCl",
    category: "حاصر قنوات الكالسيوم",
    price: "40-70 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "الذبحة الصدرية",
      "اضطراب نظم القلب الأذيني",
      "تسرع القلب فوق البطيني"
    ],
    sideEffects: [
      "دوخة",
      "صداع",
      "تورم الكاحلين",
      "بطء القلب",
      "إمساك"
    ],
    contraindications: [
      "بطء القلب الشديد",
      "انخفاض الضغط",
      "قصور القلب الحاد",
      "متلازمة الجيب المريض"
    ],
    dosage: "60-120mg 3 مرات يومياً أو 180-360mg SR مرة يومياً",
    warnings: "⚠️ لا تتوقف فجأة. قد يتفاعل مع أدوية كثيرة. راقب النبض والضغط."
  },
  {
    name: "أتينولول",
    aliases: ["Atenolol", "اتينولول", "اتنولول", "أتىنولول", "أتينولل", "أتينوول", "أأتينولول", "أتتينولول", "أتيينولول", "أتييينولول", "أتينولول", "أتيننولول", "أتينوولول", "أتينولوول", "أتينولولل", "أتنولول", "أتيولول", "اتينولول", "اتىنولول", "اتينولل", "اتيننولول", "اتينوولول", "اتينولوول", "أتينولل", "أتينوول", "أتيننولول", "أتينولولل", "أتينوولول", "أتيينولول", "اتينوول"],
    scientificName: "Atenolol 50-100mg",
    category: "حاصر بيتا انتقائي",
    price: "25-45 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "الذبحة الصدرية",
      "اضطراب نظم القلب",
      "الوقاية بعد الجلطة القلبية",
      "الصداع النصفي (وقائي)"
    ],
    sideEffects: [
      "تعب",
      "برودة الأطراف",
      "بطء النبض",
      "دوخة",
      "أحلام مزعجة"
    ],
    contraindications: [
      "الربو",
      "بطء القلب الشديد",
      "انخفاض الضغط الشديد",
      "قصور القلب غير المستقر"
    ],
    dosage: "25-100mg مرة واحدة يومياً",
    warnings: "⚠️ ممنوع لمرضى الربو. لا تتوقف فجأة. قد يخفي أعراض انخفاض السكر."
  },
  {
    name: "بيسوبرولول إيفا",
    aliases: ["Bisoprolol EVA", "بيسوبرولول ايفا", "بسوبرولول ايفا", "بيسوبرلول ايفا", "بىسوبرولول ايفا", "بييسوبرولول ايفا", "بيسوبرولل ايفا", "بيسوبروول ايفا", "بيسوبرولول إيفا", "بيسوبرولول اىفا", "بيسوبرولول ايفأ", "بيسوبرولول إيفأ", "بيصوبرولول ايفا", "بيسسوبرولول ايفا", "بيسوبررولول ايفا", "بيسوبرولوول ايفا", "بيسوبرولول اييفا", "بسوبرولول ايفا", "بيسبرولول ايفا", "بيسوبولول ايفا", "بيسوبرولول يفا", "بيسوبرولول افا", "بيسوبرولول ايفاا", "بيسوبرولول اييفا", "بيسوبرولول ايففا", "بيسوبرولول  ايفا", "بيسوبرولل ايفا", "بيسوبروول ايفا", "بيسسوبرولول ايفا", "بيسوبررولول ايفا"],
    scientificName: "Bisoprolol Fumarate 5-10mg",
    category: "حاصر بيتا انتقائي",
    price: "50-80 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب المزمن",
      "الذبحة الصدرية",
      "اضطراب نظم القلب"
    ],
    sideEffects: [
      "تعب وإرهاق",
      "برودة اليدين والقدمين",
      "بطء النبض",
      "دوخة",
      "صداع"
    ],
    contraindications: [
      "الربو الشديد",
      "بطء القلب الشديد",
      "انخفاض الضغط",
      "قصور القلب الحاد غير المستقر"
    ],
    dosage: "2.5-10mg مرة واحدة يومياً صباحاً",
    warnings: "⚠️ لا تتوقف فجأة. قد يخفي علامات انخفاض السكر. ممنوع للربو."
  },
  {
    name: "فينوفايبرات",
    aliases: ["Fenofibrate", "فينوفبرات", "فنوفايبرات", "فىنوفايبرات", "فيينوفايبرات", "فينوفايبرأت", "فينوفايبرإت", "فينوفأيبرات", "فينوفإيبرات", "فينوفاىبرات", "فينوفايبراات", "فينوفايبرااات", "فينوفايبراتت", "فينوفايبراتتت", "فينوففايبرات", "فينوفايببرات", "فينوفاييبرات", "فينوفايبررات", "فنوفايبرات", "فيوفايبرات", "فينفايبرات", "فينوايبرات", "فينوفيبرات", "فينوفايرات", "فينوفايبات", "فينوفايبرت", "فينوفايبرات", "فينوفايبرات", "فينووفايبرات", "فينوفاييبرات"],
    scientificName: "Fenofibrate 145-160mg",
    category: "خافض دهون (فايبرات)",
    price: "80-120 جنيه",
    uses: [
      "ارتفاع الدهون الثلاثية الشديد",
      "ارتفاع الكوليسترول",
      "الوقاية من أمراض القلب",
      "متلازمة الأيض"
    ],
    sideEffects: [
      "ألم عضلي",
      "اضطراب المعدة",
      "صداع",
      "ارتفاع إنزيمات الكبد",
      "حصوات المرارة"
    ],
    contraindications: [
      "أمراض الكبد الشديدة",
      "أمراض الكلى الشديدة",
      "أمراض المرارة",
      "الحمل والرضاعة"
    ],
    dosage: "145-160mg مرة واحدة يومياً مع الطعام",
    warnings: "⚠️ احذر مع الستاتينات (قد يزيد خطر ألم العضلات). افحص الكبد والعضلات دورياً."
  },
  {
    name: "ليبانتيل",
    aliases: ["Lipanthyl", "لبانتيل", "ليبنتيل", "لىبانتيل", "لييبانتيل", "ليبانتىل", "ليبانتيلل", "ليبانتييل", "ليباانتيل", "ليبانتتيل", "ليببانتيل", "ليبانتيل", "لبنتيل", "ليبنتيل", "ليبانيل", "ليبانتل", "ليبانتيل", "لييبانتيل", "ليبانتيلل", "ليباانتيل", "ليبانتييل", "ليبانتتيل", "ليببانتيل", "ليبانتيل", "لبانتيل", "ليانتيل", "ليبنتيل", "ليبانيل", "ليبانتيل", "ليبانتيل"],
    scientificName: "Fenofibrate 145mg",
    category: "خافض دهون",
    price: "90-130 جنيه",
    uses: [
      "نفس فينوفايبرات",
      "ارتفاع الدهون الثلاثية"
    ],
    sideEffects: [
      "نفس فينوفايبرات"
    ],
    contraindications: [
      "نفس فينوفايبرات"
    ],
    dosage: "145mg مرة يومياً",
    warnings: "✅ نفس فينوفايبرات (اسم تجاري مختلف)"
  },
  {
    name: "جيمفيبروزيل",
    aliases: ["Gemfibrozil", "جمفيبروزيل", "جيمفبروزيل", "جىمفيبروزيل", "جييمفيبروزيل", "جيمفيبروزىل", "جيمفيبروزيلل", "جيمفيبروزييل", "جيمففيبروزيل", "جيمفيببروزيل", "جيمفيبرروزيل", "جيمفيبروززيل", "جيمفيبروزيل", "جمفيبروزيل", "جيفيبروزيل", "جيمفبروزيل", "جيمفيروزيل", "جيمفيبوزيل", "جيمفيبرزيل", "جيمفيبرويل", "جيمفيبروزل", "جيمفيبروزيل", "جييمفيبروزيل", "جيمفيبروزيلل", "جيمفيبروزييل", "جيمففيبروزيل", "جيمفيببروزيل", "جيمفيبرروزيل", "جيمفيبروززيل", "جيمفيبروزيل"],
    scientificName: "Gemfibrozil 600mg",
    category: "خافض دهون (فايبرات)",
    price: "60-90 جنيه",
    uses: [
      "ارتفاع الدهون الثلاثية",
      "انخفاض الكوليسترول النافع (HDL)",
      "الوقاية من التهاب البنكرياس"
    ],
    sideEffects: [
      "اضطراب المعدة",
      "إسهال",
      "ألم عضلي",
      "حصوات المرارة"
    ],
    contraindications: [
      "أمراض الكبد",
      "أمراض الكلى الشديدة",
      "أمراض المرارة"
    ],
    dosage: "600mg مرتين يومياً قبل الأكل بـ30 دقيقة",
    warnings: "⚠️ لا تأخذه مع الستاتينات (خطر جداً). افحص الكبد دورياً."
  },
  {
    name: "إيزيتيميب إيفا",
    aliases: ["Ezetimibe EVA", "ايزيتيميب ايفا", "ايزتيميب ايفا", "إيزيتىميب إيفا", "إيزيتيميب ايفا", "إيزيتيمىب إيفا", "ايزيتيميب ايفأ", "ايزيتيميب إيفا", "إيزيتيميب اىفا", "إيزيتيميب ايففا", "إيزيتيميب اييفا", "إيزيتيميب  ايفا", "إيزيتيمييب ايفا", "إيزيتتيميب ايفا", "إيزييتيميب ايفا", "إيززيتيميب ايفا", "ايزيتميب ايفا", "ايزيتيمب ايفا", "ايزيتيميب يفا", "ايزيتيميب افا", "ايزيتيميب ايفاا", "إيزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا", "ايزيتيميب ايفا"],
    scientificName: "Ezetimibe 10mg",
    category: "خافض كوليسترول (مثبط امتصاص)",
    price: "100-150 جنيه",
    uses: [
      "ارتفاع الكوليسترول",
      "يُضاف للستاتينات",
      "بديل للستاتينات (لمن لا يتحملونها)"
    ],
    sideEffects: [
      "إسهال",
      "ألم مفاصل",
      "تعب",
      "ألم عضلي (نادر)"
    ],
    contraindications: [
      "أمراض الكبد النشطة",
      "الحمل والرضاعة"
    ],
    dosage: "10mg مرة واحدة يومياً",
    warnings: "✅ آمن نسبياً. يُستخدم مع الستاتينات غالباً لتعزيز التأثير."
  },
  {
    name: "ليبيترين",
    aliases: ["Lipitrin", "لبيترين", "ليبترين", "لىبيترين", "لييبيترين", "ليبيترىن", "ليبيتريين", "ليبيترينن", "ليبيتررين", "ليببيترين", "ليبيترين", "لبترين", "ليبترين", "ليبيرين", "ليبيتين", "ليبيترن", "ليبيترين", "لييبيترين", "ليبيتريين", "ليبيترينن", "ليبيتررين", "ليببيترين", "ليبيترين", "لبيترين", "ليبترين", "لييبيترين", "ليبيتريين", "ليبيترينن", "ليبيتررين", "ليببيترين"],
    scientificName: "Atorvastatin + Ezetimibe",
    category: "خافض كوليسترول مركب",
    price: "150-200 جنيه",
    uses: [
      "ارتفاع الكوليسترول الشديد",
      "عدم كفاية الستاتين وحده"
    ],
    sideEffects: [
      "نفس ليبيتور + إيزيتيميب"
    ],
    contraindications: [
      "نفس ليبيتور"
    ],
    dosage: "قرص واحد مساءً",
    warnings: "✅ يجمع بين ستاتين ومثبط امتصاص - قوي جداً."
  },
  {
    name: "أتورفا",
    aliases: ["Atorva", "اتورفا", "اطورفا", "أتورفأ", "أتورفإ", "اتورفا", "أتوورفا", "أتورففا", "أتورفاا", "أتتورفا", "أتورفا", "اتورفا", "أطورفا", "أتورفى", "اتورفا", "أتورفا", "اتورفا", "أتوورفا", "أتورففا", "أتورفاا", "أتتورفا", "أتورفا", "اتورفا", "اتورفا", "أتورفا", "اتورفا", "أتورفا", "اتورفا", "أتورفا", "اتورفا"],
    scientificName: "Atorvastatin 10-20-40-80mg",
    category: "خافض كوليسترول (ستاتين)",
    price: "80-120 جنيه",
    uses: [
      "نفس ليبيتور",
      "ارتفاع الكوليسترول"
    ],
    sideEffects: [
      "نفس ليبيتور"
    ],
    contraindications: [
      "نفس ليبيتور"
    ],
    dosage: "10-80mg مرة يومياً مساءً",
    warnings: "⚠️ نفس ليبيتور (أتورفاستاتين) - بديل أرخص"
  },
  {
    name: "أملوكارد بلس",
    aliases: ["Amlocard Plus", "املوكارد بلس", "أملوكرد بلس", "أملوكأرد بلس", "أملوكإرد بلس", "أملوكارد بلص", "أملوكارد بلوس", "أملوكارد  بلس", "أمللوكارد بلس", "أملووكارد بلس", "أملوككارد بلس", "أملوكاارد بلس", "أملوكاررد بلس", "أملوكارد بللس", "أملوكارد بلسس", "املوكارد بلس", "أملوارد بلس", "أملوكرد بلس", "أملوكاد بلس", "أملوكار بلس", "أملوكارد لس", "أملوكارد بس", "أملوكارد بلس", "أملوكارد بلس", "أملوكارد بلس", "أملوكارد بلس", "أملوكارد بلس", "أملوكارد بلس", "أملوكارد بلس"],
    scientificName: "Amlodipine + Valsartan",
    category: "خافض ضغط مركب",
    price: "100-140 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "عدم كفاية دواء واحد"
    ],
    sideEffects: [
      "تورم الكاحلين",
      "دوخة",
      "صداع"
    ],
    contraindications: [
      "الحمل",
      "انخفاض الضغط الشديد"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "✅ يجمع بين حاصر كالسيوم وARB - فعال جداً"
  },
  {
    name: "فالسارتان بلس",
    aliases: ["Valsartan Plus", "فلسارتان بلس", "فالسرتان بلس", "فألسارتان بلس", "فإلسارتان بلس", "فالسارتأن بلس", "فالسارتإن بلس", "فالسارتان بلص", "فالسارتان بلوس", "فالسارتان  بلس", "فاالسارتان بلس", "فاللسارتان بلس", "فالسسارتان بلس", "فالساارتان بلس", "فالسارتتان بلس", "فالسارتاان بلس", "فالسارتان بللس", "فالسارتان بلسس", "فلسارتان بلس", "فالارتان بلس", "فالسرتان بلس", "فالساتان بلس", "فالساران بلس", "فالسارتن بلس", "فالسارتا بلس", "فالسارتان لس", "فالسارتان بس", "فالسارتان بلس", "فالسارتان بلس"],
    scientificName: "Valsartan + Hydrochlorothiazide",
    category: "خافض ضغط مركب",
    price: "90-130 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "يجمع ARB مع مدر بول"
    ],
    sideEffects: [
      "دوخة",
      "كثرة تبول",
      "انخفاض البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "انخفاض البوتاسيوم الشديد"
    ],
    dosage: "قرص واحد يومياً صباحاً",
    warnings: "⚠️ افحص البوتاسيوم دورياً. قد يسبب جفاف - اشرب ماء كافي"
  },
  {
    name: "أولميزارتان بلس",
    aliases: ["Olmesartan Plus", "اولميزارتان بلس", "أولمزارتان بلس", "أولميزرتان بلس", "أولميزارتأن بلس", "أولميزارتإن بلس", "أولميزارتان بلص", "أولميزارتان بلوس", "أولميزارتان  بلس", "أوولميزارتان بلس", "أولميزارتان بللس", "أولميزارتان بلسس", "اولمزارتان بلس", "أولميارتان بلس", "أولميزرتان بلس", "أولميزاتان بلس", "أولميزاران بلس", "أولميزارتن بلس", "أولميزارتا بلس", "أولميزارتان لس", "أولميزارتان بس", "أولميزارتان بلس", "أولميزارتان بلس", "أولميزارتان بلس", "أولميزارتان بلس", "أولميزارتان بلس", "أولميزارتان بلس", "أولميزارتان بلس", "أولميزارتان بلس"],
    scientificName: "Olmesartan + Hydrochlorothiazide",
    category: "خافض ضغط مركب",
    price: "110-150 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "ARB + مدر بول"
    ],
    sideEffects: [
      "دوخة",
      "إسهال مزمن (نادر لكن مهم)",
      "كثرة تبول"
    ],
    contraindications: [
      "الحمل",
      "انخفاض البوتاسيوم"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "⚠️ قد يسبب إسهال مزمن نادر - أخبر طبيبك إذا حدث"
  },
  {
    name: "كانديسارتان بلس",
    aliases: ["Candesartan Plus", "كنديسارتان بلس", "كانديسرتان بلس", "كأنديسارتان بلس", "كإنديسارتان بلس", "كانديسارتأن بلس", "كانديسارتإن بلس", "كانديسارتان بلص", "كانديسارتان بلوس", "كانديسارتان  بلس", "كاانديسارتان بلس", "كانديسارتان بللس", "كانديسارتان بلسس", "كنديسارتان بلس", "كانيسارتان بلس", "كانديارتان بلس", "كانديسرتان بلس", "كانديساتان بلس", "كانديساران بلس", "كانديسارتن بلس", "كانديسارتا بلس", "كانديسارتان لس", "كانديسارتان بس", "كانديسارتان بلس", "كانديسارتان بلس", "كانديسارتان بلس", "كانديسارتان بلس", "كانديسارتان بلس", "كانديسارتان بلس"],
    scientificName: "Candesartan + Hydrochlorothiazide",
    category: "خافض ضغط مركب",
    price: "100-140 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "ARB + مدر بول"
    ],
    sideEffects: [
      "دوخة",
      "كثرة تبول",
      "انخفاض البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "انخفاض البوتاسيوم الشديد"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "✅ ARB قوي مع مدر بول - فعال جداً"
  },
  {
    name: "إربيسارتان بلس",
    aliases: ["Irbesartan Plus", "اربيسارتان بلس", "ايربيسارتان بلس", "إربيسرتان بلس", "إربيسارتأن بلس", "إربيسارتإن بلس", "إربيسارتان بلص", "إربيسارتان بلوس", "إربيسارتان  بلس", "إرببيسارتان بلس", "إربيسارتان بللس", "إربيسارتان بلسس", "اربسارتان بلس", "إربيارتان بلس", "إربيسرتان بلس", "إربيساتان بلس", "إربيساران بلس", "إربيسارتن بلس", "إربيسارتا بلس", "إربيسارتان لس", "إربيسارتان بس", "إربيسارتان بلس", "إربيسارتان بلس", "إربيسارتان بلس", "إربيسارتان بلس", "إربيسارتان بلس", "إربيسارتان بلس", "إربيسارتان بلس", "إربيسارتان بلس"],
    scientificName: "Irbesartan + Hydrochlorothiazide",
    category: "خافض ضغط مركب",
    price: "95-135 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "ARB + مدر بول"
    ],
    sideEffects: [
      "دوخة",
      "كثرة تبول",
      "انخفاض البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "انخفاض البوتاسيوم"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "✅ ARB فعال - يحمي الكلى عند مرضى السكري"
  },
  {
    name: "دافلون",
    aliases: ["Daflon", "دفلون", "دافولون", "دأفلون", "دإفلون", "داافلون", "دافللون", "دافلوون", "دافلونن", "دفلون", "دالون", "دافون", "دافلن", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون", "دافلون"],
    scientificName: "Diosmin 450mg + Hesperidin 50mg",
    category: "مقوي الأوعية الدموية",
    price: "120-160 جنيه",
    uses: [
      "دوالي الساقين",
      "البواسير",
      "تحسين الدورة الدموية",
      "تورم الساقين",
      "الشعور بالثقل في القدمين"
    ],
    sideEffects: [
      "اضطراب معدة خفيف",
      "صداع نادر",
      "إسهال خفيف"
    ],
    contraindications: [
      "الحساسية من المكونات",
      "الأطفال أقل من 18 سنة"
    ],
    dosage: "قرصين ظهراً وقرصين مساءً (للبواسير الحادة) أو قرصين يومياً (للدوالي)",
    warnings: "✅ آمن جداً. للبواسير: جرعة عالية 3 أيام ثم عادية. للدوالي: استخدام طويل الأمد"
  },
  {
    name: "فينوتون",
    aliases: ["Venoton", "فنوتون", "فينوطون", "فىنوتون", "فيينوتون", "فينوتوون", "فينوتونن", "فينوطون", "فنوتون", "فيوتون", "فينتون", "فينوون", "فينوتن", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون", "فينوتون"],
    scientificName: "Diosmin + Hesperidin",
    category: "مقوي الأوعية الدموية",
    price: "80-110 جنيه",
    uses: [
      "نفس دافلون",
      "دوالي الساقين",
      "البواسير"
    ],
    sideEffects: [
      "نفس دافلون"
    ],
    contraindications: [
      "نفس دافلون"
    ],
    dosage: "نفس دافلون",
    warnings: "✅ بديل أرخص لدافلون - نفس المكونات"
  },
  {
    name: "أنجيوكس",
    aliases: ["Angiox", "انجيوكس", "أنجوكس", "أنجىوكس", "أنجيوكص", "أنجيووكس", "أنجيوككس", "أنجيوكسس", "انجيوكس", "أنجيكس", "أنجيوس", "أنجيوك", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس", "أنجيوكس"],
    scientificName: "Diosmin + Hesperidin",
    category: "مقوي الأوعية الدموية",
    price: "70-100 جنيه",
    uses: [
      "نفس دافلون",
      "البواسير والدوالي"
    ],
    sideEffects: [
      "نفس دافلون"
    ],
    contraindications: [
      "نفس دافلون"
    ],
    dosage: "نفس دافلون",
    warnings: "✅ بديل مصري أرخص لدافلون"
  },
  {
    name: "بنتوكسيفيللين",
    aliases: ["Pentoxifylline", "بنتوكسفيللين", "بنتوكسيفللين", "بنتوكسيفيلىن", "بنتوكسيفيلين", "بنتوكصيفيللين", "بنتوكسيفيللين", "بنتوكسيفيلللين", "بنتكسيفيللين", "بنتوسيفيللين", "بنتوكسفيللين", "بنتوكسيفللين", "بنتوكسيفيلين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين", "بنتوكسيفيللين"],
    scientificName: "Pentoxifylline 400mg",
    category: "محسن الدورة الدموية الطرفية",
    price: "50-80 جنيه",
    uses: [
      "أمراض الشرايين الطرفية",
      "العرج المتقطع (ألم الساق عند المشي)",
      "تحسين تدفق الدم",
      "قروح الساق من ضعف الدورة"
    ],
    sideEffects: [
      "غثيان",
      "دوخة",
      "صداع",
      "اضطراب معدة"
    ],
    contraindications: [
      "نزيف نشط",
      "نزيف شبكية العين",
      "الحساسية من الكافيين"
    ],
    dosage: "400mg 2-3 مرات يومياً مع الطعام",
    warnings: "✅ يحسن تدفق الدم للأطراف. يحتاج 2-8 أسابيع لرؤية النتائج"
  },
  {
    name: "فاسكولار",
    aliases: ["Vascular", "فسكولار", "فاسكلار", "فأسكولار", "فإسكولار", "فاسكوولار", "فاسكولاار", "فاسكولارر", "فسكولار", "فاكولار", "فاسولار", "فاسكلار", "فاسكوار", "فاسكولر", "فاسكولا", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار", "فاسكولار"],
    scientificName: "Pentoxifylline 400mg SR",
    category: "محسن الدورة الدموية",
    price: "60-90 جنيه",
    uses: [
      "نفس بنتوكسيفيللين",
      "أمراض الشرايين الطرفية"
    ],
    sideEffects: [
      "نفس بنتوكسيفيللين"
    ],
    contraindications: [
      "نفس بنتوكسيفيللين"
    ],
    dosage: "400mg مرتين يومياً",
    warnings: "✅ تركيبة ممتدة المفعول - أقل أعراض جانبية"
  },
  {
    name: "كانديسارتان",
    aliases: ["Candesartan", "كنديسارتان", "كانديسرتان", "كأنديسارتان", "كإنديسارتان", "كانديسارتأن", "كانديسارتإن", "كاانديسارتان", "كانديسارتان", "كندسارتان", "كانيسارتان", "كانديارتان", "كانديسرتان", "كانديساتان", "كانديساران", "كانديسارتن", "كانديسارتا", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان", "كانديسارتان"],
    scientificName: "Candesartan Cilexetil 8-16mg",
    category: "خافض ضغط (ARB)",
    price: "70-110 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "حماية الكلى"
    ],
    sideEffects: [
      "دوخة",
      "صداع",
      "ارتفاع البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "ارتفاع البوتاسيوم الشديد"
    ],
    dosage: "8-32mg مرة يومياً",
    warnings: "⚠️ ممنوع في الحمل. افحص البوتاسيوم دورياً"
  },
  {
    name: "فالزاكارد",
    aliases: ["Valsacard", "فلزاكارد", "فالزكارد", "فألزاكارد", "فإلزاكارد", "فالزاكأرد", "فالزاكإرد", "فاالزاكارد", "فالزاكاارد", "فالزاكاررد", "فلزاكارد", "فالاكارد", "فالزكارد", "فالزاارد", "فالزاكرد", "فالزاكاد", "فالزاكار", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد", "فالزاكارد"],
    scientificName: "Valsartan 80-160mg",
    category: "خافض ضغط (ARB)",
    price: "70-100 جنيه",
    uses: [
      "نفس ديوفان",
      "ارتفاع ضغط الدم"
    ],
    sideEffects: [
      "نفس ديوفان"
    ],
    contraindications: [
      "نفس ديوفان"
    ],
    dosage: "80-320mg يومياً",
    warnings: "✅ بديل أرخص لديوفان - نفس المادة"
  },
  {
    name: "أمل أوديبين بلس",
    aliases: ["Amlodipine Plus", "املوديبين بلس", "أملديبين بلس", "أملوديبىن بلس", "أملوديبين بلص", "أملوديبين بلوس", "أملوديبين  بلس", "أمللوديبين بلس", "أملووديبين بلس", "أملوديببين بلس", "أملوديبيين بلس", "أملوديبينن بلس", "املوديبين بلس", "أملديبين بلس", "أملوديين بلس", "أملوديبن بلس", "أملوديبي بلس", "أملوديبين لس", "أملوديبين بس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس", "أملوديبين بلس"],
    scientificName: "Amlodipine + Hydrochlorothiazide or Valsartan",
    category: "خافض ضغط مركب",
    price: "80-120 جنيه",
    uses: [
      "ارتفاع ضغط الدم"
    ],
    sideEffects: [
      "تورم الكاحلين",
      "دوخة"
    ],
    contraindications: [
      "الحمل (إذا كان يحتوي فالسارتان)"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "✅ تركيبة مركبة فعالة"
  },
  {
    name: "كارفيديلول إيفا",
    aliases: ["Carvedilol EVA", "كرفيديلول ايفا", "كارفديلول ايفا", "كأرفيديلول إيفا", "كإرفيديلول إيفا", "كارفيديلول اىفا", "كارفيديلول ايفأ", "كارفيديلول إيفا", "كاارفيديلول ايفا", "كارفيديلول  ايفا", "كارفيديلول اييفا", "كرفيديلول ايفا", "كارفدلول ايفا", "كارفيديول ايفا", "كارفيديلل ايفا", "كارفيديلول يفا", "كارفيديلول افا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا", "كارفيديلول ايفا"],
    scientificName: "Carvedilol 6.25-12.5-25mg",
    category: "حاصر بيتا وألفا",
    price: "60-90 جنيه",
    uses: [
      "نفس كارفيدلول",
      "ارتفاع الضغط وقصور القلب"
    ],
    sideEffects: [
      "نفس كارفيدلول"
    ],
    contraindications: [
      "نفس كارفيدلول"
    ],
    dosage: "6.25-50mg مرتين يومياً",
    warnings: "⚠️ نفس كارفيدلول - بديل مصري"
  },
  {
    name: "نيبيفولول ساندوز",
    aliases: ["Nebivolol Sandoz", "نيبفولول ساندوز", "نبيفولول ساندوز", "نىبيفولول ساندوز", "نييبيفولول ساندوز", "نيبيفولول صاندوز", "نيبيفولول ساندووز", "نيبيفولول ساندوزز", "نبيفولول ساندوز", "نيبفولول ساندوز", "نيبيولول ساندوز", "نيبيفلول ساندوز", "نيبيفوول ساندوز", "نيبيفولل ساندوز", "نيبيفولول اندوز", "نيبيفولول سندوز", "نيبيفولول سادوز", "نيبيفولول سانوز", "نيبيفولول ساندز", "نيبيفولول ساندو", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز", "نيبيفولول ساندوز"],
    scientificName: "Nebivolol 5mg",
    category: "حاصر بيتا انتقائي",
    price: "70-100 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب المزمن",
      "أقل أعراض جانبية من حاصرات بيتا الأخرى"
    ],
    sideEffects: [
      "تعب خفيف",
      "صداع",
      "دوخة"
    ],
    contraindications: [
      "قصور القلب الحاد",
      "بطء القلب الشديد",
      "انخفاض الضغط الشديد"
    ],
    dosage: "2.5-5mg مرة يومياً",
    warnings: "✅ حاصر بيتا حديث - أقل أعراض جانبية. قد يحسن الوظيفة الجنسية مقارنة بحاصرات بيتا الأخرى"
  },
  {
    name: "بروبرانولول فاركو",
    aliases: ["Propranolol Pharco", "بروبرنولول فاركو", "بربرانولول فاركو", "بروبرانولل فاركو", "بروبرانولول فأركو", "بروبرانولول فإركو", "بروبرانولول فاركوو", "بروبرانولول فاركو", "بربرانولول فاركو", "بروبانولول فاركو", "بروبرنولول فاركو", "بروبرانلول فاركو", "بروبرانوول فاركو", "بروبرانولل فاركو", "بروبرانولول اركو", "بروبرانولول فركو", "بروبرانولول فاكو", "بروبرانولول فارو", "بروبرانولول فارك", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو", "بروبرانولول فاركو"],
    scientificName: "Propranolol HCl 10-40mg",
    category: "حاصر بيتا غير انتقائي",
    price: "25-40 جنيه",
    uses: [
      "نفس إندرال",
      "ارتفاع الضغط، القلق، الصداع النصفي"
    ],
    sideEffects: [
      "نفس إندرال"
    ],
    contraindications: [
      "نفس إندرال"
    ],
    dosage: "10-320mg يومياً مقسمة",
    warnings: "⚠️ نفس إندرال - بديل مصري أرخص"
  },
  {
    name: "سوتالول إيفا",
    aliases: ["Sotalol EVA", "سوتلول ايفا", "صوتالول ايفا", "سوتألول إيفا", "سوتإلول إيفا", "سوتالول اىفا", "سوتالول ايفأ", "سوتالول إيفا", "سووتالول ايفا", "سوتاالول ايفا", "سوتاللول ايفا", "سوتالول  ايفا", "سوتالول اييفا", "سوتلول ايفا", "سوالول ايفا", "سوتلول ايفا", "سوتاول ايفا", "سوتالل ايفا", "سوتالول يفا", "سوتالول افا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا", "سوتالول ايفا"],
    scientificName: "Sotalol 40-80mg",
    category: "حاصر بيتا ومضاد اضطراب نظم",
    price: "50-80 جنيه",
    uses: [
      "اضطرابات نظم القلب",
      "الرجفان الأذيني",
      "تسرع القلب البطيني"
    ],
    sideEffects: [
      "بطء القلب",
      "دوخة",
      "تعب",
      "إطالة QT (خطير)"
    ],
    contraindications: [
      "الربو",
      "إطالة QT",
      "بطء القلب الشديد",
      "قصور القلب غير المستقر"
    ],
    dosage: "40-160mg مرتين يومياً",
    warnings: "⚠️⚠️ دواء خطير - يحتاج مراقبة تخطيط القلب. ممنوع للربو"
  },
  {
    name: "إبليرينون ساندوز",
    aliases: ["Eplerenone Sandoz", "ابليرينون ساندوز", "ايبليرينون ساندوز", "إبليرىنون ساندوز", "إبليرينون صاندوز", "إبليرينون ساندووز", "إبليرينون ساندوزز", "ابلرينون ساندوز", "إبليينون ساندوز", "إبليرنون ساندوز", "إبليريون ساندوز", "إبليرينن ساندوز", "إبليرينون اندوز", "إبليرينون سندوز", "إبليرينون سادوز", "إبليرينون سانوز", "إبليرينون ساندز", "إبليرينون ساندو", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز", "إبليرينون ساندوز"],
    scientificName: "Eplerenone 25-50mg",
    category: "مدر بول موفر للبوتاسيوم",
    price: "100-150 جنيه",
    uses: [
      "قصور القلب",
      "بعد الجلطة القلبية",
      "ارتفاع الضغط"
    ],
    sideEffects: [
      "ارتفاع البوتاسيوم (خطير)",
      "دوخة",
      "تعب"
    ],
    contraindications: [
      "ارتفاع البوتاسيوم",
      "أمراض الكلى الشديدة",
      "أدوية ترفع البوتاسيوم"
    ],
    dosage: "25-50mg مرة يومياً",
    warnings: "⚠️⚠️ افحص البوتاسيوم دورياً. لا تأكل موز كثير. خطير مع ارتفاع البوتاسيوم"
  },
  {
    name: "سبيرونولاكتون إيفا",
    aliases: ["Spironolactone EVA", "سبيرونولكتون ايفا", "سبرونولاكتون ايفا", "سبيرونولاكتون اىفا", "سبيرونولاكتون ايفأ", "سبيرونولاكتون إيفا", "صبيرونولاكتون ايفا", "سبيرونولأكتون ايفا", "سبيرونولإكتون ايفا", "سبيرونولاكتون  ايفا", "سبيرونولاكتون اييفا", "سبرونولاكتون ايفا", "سبيرنولاكتون ايفا", "سبيرونلاكتون ايفا", "سبيرونواكتون ايفا", "سبيرونولكتون ايفا", "سبيرونولاتون ايفا", "سبيرونولاكون ايفا", "سبيرونولاكتن ايفا", "سبيرونولاكتو ايفا", "سبيرونولاكتون يفا", "سبيرونولاكتون افا", "سبيرونولاكتون ايفا", "سبيرونولاكتون ايفا", "سبيرونولاكتون ايفا", "سبيرونولاكتون ايفا", "سبيرونولاكتون ايفا", "سبيرونولاكتون ايفا", "سبيرونولاكتون ايفا"],
    scientificName: "Spironolactone 25-100mg",
    category: "مدر بول موفر للبوتاسيوم",
    price: "30-50 جنيه",
    uses: [
      "قصور القلب",
      "تجمع السوائل",
      "ارتفاع الضغط",
      "تكيس المبايض (استخدام غير رسمي)"
    ],
    sideEffects: [
      "ارتفاع البوتاسيوم",
      "تضخم الثدي عند الرجال",
      "اضطراب الدورة عند النساء"
    ],
    contraindications: [
      "ارتفاع البوتاسيوم",
      "أمراض الكلى الشديدة"
    ],
    dosage: "25-100mg يومياً",
    warnings: "⚠️ افحص البوتاسيوم دورياً. قد يسبب تضخم ثدي للرجال"
  },
  {
    name: "فوروسيميد فاركو",
    aliases: ["Furosemide Pharco", "فوروسمايد فاركو", "فروسيميد فاركو", "فوروسيميد فأركو", "فوروسيميد فإركو", "فوروسيميد فاركوو", "فوروصيميد فاركو", "فووروسيميد فاركو", "فوروسيميد  فاركو", "فوروسيميدد فاركو", "فروسيميد فاركو", "فوروسميد فاركو", "فوروسييميد فاركو", "فوروسيمد فاركو", "فوروسيمي فاركو", "فوروسيميد اركو", "فوروسيميد فركو", "فوروسيميد فاكو", "فوروسيميد فارو", "فوروسيميد فارك", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو", "فوروسيميد فاركو"],
    scientificName: "Furosemide 40mg",
    category: "مدر بول قوي",
    price: "20-35 جنيه",
    uses: [
      "نفس لازكس",
      "تورم السوائل وقصور القلب"
    ],
    sideEffects: [
      "نفس لازكس"
    ],
    contraindications: [
      "نفس لازكس"
    ],
    dosage: "20-80mg يومياً صباحاً",
    warnings: "⚠️ نفس لازكس - بديل مصري أرخص"
  },
  {
    name: "أملوديبين فاركو",
    aliases: ["Amlodipine Pharco", "املوديبين فاركو", "أملديبين فاركو", "أملوديبين فأركو", "أملوديبين فإركو", "أملوديبين فاركوو", "أملوديبىن فاركو", "أمللوديبين فاركو", "أملووديبين فاركو", "أملوديببين فاركو", "أملوديبيين فاركو", "أملوديبينن فاركو", "املوديبين فاركو", "أملديبين فاركو", "أملوديين فاركو", "أملوديبن فاركو", "أملوديبي فاركو", "أملوديبين اركو", "أملوديبين فركو", "أملوديبين فاكو", "أملوديبين فارو", "أملوديبين فارك", "أملوديبين فاركو", "أملوديبين فاركو", "أملوديبين فاركو", "أملوديبين فاركو", "أملوديبين فاركو", "أملوديبين فاركو", "أملوديبين فاركو"],
    scientificName: "Amlodipine 5-10mg",
    category: "حاصر قنوات الكالسيوم",
    price: "25-45 جنيه",
    uses: [
      "نفس نورفاسك",
      "ارتفاع ضغط الدم والذبحة"
    ],
    sideEffects: [
      "نفس نورفاسك"
    ],
    contraindications: [
      "نفس نورفاسك"
    ],
    dosage: "5-10mg يومياً",
    warnings: "✅ نفس نورفاسك - بديل مصري أرخص"
  },
  {
    name: "أملوديبين ساندوز",
    aliases: ["Amlodipine Sandoz", "املوديبين ساندوز", "أملديبين ساندوز", "أملوديبين صاندوز", "أملوديبين ساندووز", "أملوديبين ساندوزز", "أملوديبىن ساندوز", "أمللوديبين ساندوز", "أملووديبين ساندوز", "أملوديببين ساندوز", "أملوديبيين ساندوز", "أملوديبينن ساندوز", "املوديبين ساندوز", "أملديبين ساندوز", "أملوديين ساندوز", "أملوديبن ساندوز", "أملوديبي ساندوز", "أملوديبين اندوز", "أملوديبين سندوز", "أملوديبين سادوز", "أملوديبين سانوز", "أملوديبين ساندز", "أملوديبين ساندو", "أملوديبين ساندوز", "أملوديبين ساندوز", "أملوديبين ساندوز", "أملوديبين ساندوز", "أملوديبين ساندوز", "أملوديبين ساندوز"],
    scientificName: "Amlodipine 5-10mg",
    category: "حاصر قنوات الكالسيوم",
    price: "30-50 جنيه",
    uses: [
      "نفس نورفاسك"
    ],
    sideEffects: [
      "نفس نورفاسك"
    ],
    contraindications: [
      "نفس نورفاسك"
    ],
    dosage: "5-10mg يومياً",
    warnings: "✅ نفس نورفاسك - بديل مستورد"
  },
  {
    name: "فالسارتان إيفا",
    aliases: ["Valsartan EVA", "فلسارتان ايفا", "فالسرتان ايفا", "فألسارتان إيفا", "فإلسارتان إيفا", "فالسارتان اىفا", "فالسارتان ايفأ", "فالسارتان إيفا", "فاالسارتان ايفا", "فالسسارتان ايفا", "فالساارتان ايفا", "فالسارتتان ايفا", "فالسارتاان ايفا", "فالسارتان  ايفا", "فالسارتان اييفا", "فلسارتان ايفا", "فالارتان ايفا", "فالسرتان ايفا", "فالساتان ايفا", "فالساران ايفا", "فالسارتن ايفا", "فالسارتا ايفا", "فالسارتان يفا", "فالسارتان افا", "فالسارتان ايفا", "فالسارتان ايفا", "فالسارتان ايفا", "فالسارتان ايفا", "فالسارتان ايفا"],
    scientificName: "Valsartan 80-160mg",
    category: "خافض ضغط (ARB)",
    price: "60-90 جنيه",
    uses: [
      "نفس ديوفان"
    ],
    sideEffects: [
      "نفس ديوفان"
    ],
    contraindications: [
      "نفس ديوفان"
    ],
    dosage: "80-320mg يومياً",
    warnings: "✅ نفس ديوفان - بديل مصري"
  },
  {
    name: "أولميزارتان ساندوز",
    aliases: ["Olmesartan Sandoz", "اولميزارتان ساندوز", "أولمزارتان ساندوز", "أولميزارتان صاندوز", "أولميزارتان ساندووز", "أولميزارتان ساندوزز", "أولميزرتان ساندوز", "أوولميزارتان ساندوز", "أولميزارتان  ساندوز", "أولميزارتاان ساندوز", "أولميزارتتان ساندوز", "اولمزارتان ساندوز", "أولميارتان ساندوز", "أولميزرتان ساندوز", "أولميزاتان ساندوز", "أولميزاران ساندوز", "أولميزارتن ساندوز", "أولميزارتا ساندوز", "أولميزارتان اندوز", "أولميزارتان سندوز", "أولميزارتان سادوز", "أولميزارتان سانوز", "أولميزارتان ساندز", "أولميزارتان ساندو", "أولميزارتان ساندوز", "أولميزارتان ساندوز", "أولميزارتان ساندوز", "أولميزارتان ساندوز", "أولميزارتان ساندوز"],
    scientificName: "Olmesartan 20-40mg",
    category: "خافض ضغط (ARB)",
    price: "80-120 جنيه",
    uses: [
      "ارتفاع ضغط الدم"
    ],
    sideEffects: [
      "دوخة",
      "إسهال مزمن (نادر)",
      "ارتفاع البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "ارتفاع البوتاسيوم الشديد"
    ],
    dosage: "20-40mg يومياً",
    warnings: "⚠️ قد يسبب إسهال مزمن نادر - أخبر طبيبك"
  },
  {
    name: "كانديسارتان فاركو",
    aliases: ["Candesartan Pharco", "كنديسارتان فاركو", "كانديسرتان فاركو", "كأنديسارتان فأركو", "كإنديسارتان فإركو", "كانديسارتان فاركوو", "كاانديسارتان فاركو", "كندسارتان فاركو", "كانيسارتان فاركو", "كانديارتان فاركو", "كانديسرتان فاركو", "كانديساتان فاركو", "كانديساران فاركو", "كانديسارتن فاركو", "كانديسارتا فاركو", "كانديسارتان اركو", "كانديسارتان فركو", "كانديسارتان فاكو", "كانديسارتان فارو", "كانديسارتان فارك", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو", "كانديسارتان فاركو"],
    scientificName: "Candesartan 8-16mg",
    category: "خافض ضغط (ARB)",
    price: "60-95 جنيه",
    uses: [
      "نفس كانديسارتان"
    ],
    sideEffects: [
      "نفس كانديسارتان"
    ],
    contraindications: [
      "نفس كانديسارتان"
    ],
    dosage: "8-32mg يومياً",
    warnings: "✅ نفس كانديسارتان - بديل مصري"
  },
  {
    name: "بيريندوبريل فاركو",
    aliases: ["Perindopril Pharco", "بريندوبريل فاركو", "برندوبريل فاركو", "بىريندوبريل فاركو", "بيريندوبريل فأركو", "بيريندوبريل فإركو", "بيريندوبريل فاركوو", "بييريندوبريل فاركو", "بيريندوبرىل فاركو", "بيرىندوبريل فاركو", "بريندوبريل فاركو", "بيريدوبريل فاركو", "بيريندبريل فاركو", "بيريندوبيل فاركو", "بيريندوبرل فاركو", "بيريندوبري فاركو", "بيريندوبريل اركو", "بيريندوبريل فركو", "بيريندوبريل فاكو", "بيريندوبريل فارو", "بيريندوبريل فارك", "بيريندوبريل فاركو", "بيريندوبريل فاركو", "بيريندوبريل فاركو", "بيريندوبريل فاركو", "بيريندوبريل فاركو", "بيريندوبريل فاركو", "بيريندوبريل فاركو", "بيريندوبريل فاركو"],
    scientificName: "Perindopril 4-8mg",
    category: "خافض ضغط (ACE inhibitor)",
    price: "50-80 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "مرض الشريان التاجي",
      "حماية الكلى"
    ],
    sideEffects: [
      "سعال جاف (شائع)",
      "دوخة",
      "صداع",
      "ارتفاع البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "تاريخ وذمة وعائية",
      "تضيق الشريان الكلوي الثنائي"
    ],
    dosage: "4-8mg يومياً",
    warnings: "⚠️ قد يسبب سعال جاف. ممنوع في الحمل"
  },
  {
    name: "راميبريل ساندوز",
    aliases: ["Ramipril Sandoz", "رميبريل ساندوز", "راميبرل ساندوز", "رأميبريل ساندوز", "رإميبريل ساندوز", "راميبريل صاندوز", "راميبريل ساندووز", "راميبريل ساندوزز", "رااميبريل ساندوز", "راميبرىل ساندوز", "راميببريل ساندوز", "راميبرييل ساندوز", "رميبريل ساندوز", "راميريل ساندوز", "راميبيل ساندوز", "راميبرل ساندوز", "راميبري ساندوز", "راميبريل اندوز", "راميبريل سندوز", "راميبريل سادوز", "راميبريل سانوز", "راميبريل ساندز", "راميبريل ساندو", "راميبريل ساندوز", "راميبريل ساندوز", "راميبريل ساندوز", "راميبريل ساندوز", "راميبريل ساندوز", "راميبريل ساندوز"],
    scientificName: "Ramipril 2.5-5-10mg",
    category: "خافض ضغط (ACE inhibitor)",
    price: "60-100 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "بعد الجلطة القلبية",
      "حماية الكلى عند مرضى السكري"
    ],
    sideEffects: [
      "سعال جاف (شائع جداً)",
      "دوخة",
      "صداع",
      "ارتفاع البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "وذمة وعائية سابقة",
      "تضيق الشريان الكلوي الثنائي"
    ],
    dosage: "2.5-10mg يومياً",
    warnings: "⚠️ السعال الجاف شائع جداً. ممنوع في الحمل"
  },
  {
    name: "ليسينوبريل فاركو",
    aliases: ["Lisinopril Pharco", "لسينوبريل فاركو", "ليسنوبريل فاركو", "لىسينوبريل فاركو", "ليسينوبريل فأركو", "ليسينوبريل فإركو", "ليسينوبريل فاركوو", "لييسينوبريل فاركو", "ليسينوبرىل فاركو", "ليصينوبريل فاركو", "لسينوبريل فاركو", "ليسنوبريل فاركو", "ليسينبريل فاركو", "ليسينوبيل فاركو", "ليسينوبرل فاركو", "ليسينوبري فاركو", "ليسينوبريل اركو", "ليسينوبريل فركو", "ليسينوبريل فاكو", "ليسينوبريل فارو", "ليسينوبريل فارك", "ليسينوبريل فاركو", "ليسينوبريل فاركو", "ليسينوبريل فاركو", "ليسينوبريل فاركو", "ليسينوبريل فاركو", "ليسينوبريل فاركو", "ليسينوبريل فاركو", "ليسينوبريل فاركو"],
    scientificName: "Lisinopril 5-10-20mg",
    category: "خافض ضغط (ACE inhibitor)",
    price: "40-70 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "بعد الجلطة القلبية",
      "حماية الكلى"
    ],
    sideEffects: [
      "سعال جاف",
      "دوخة",
      "صداع",
      "ارتفاع البوتاسيوم"
    ],
    contraindications: [
      "الحمل",
      "وذمة وعائية",
      "تضيق الشريان الكلوي الثنائي"
    ],
    dosage: "5-40mg يومياً",
    warnings: "⚠️ سعال جاف شائع. ممنوع في الحمل"
  },
  {
    name: "إنالابريل إيفا",
    aliases: ["Enalapril EVA", "انالابريل ايفا", "اينالابريل ايفا", "إنألابريل إيفا", "إنإلابريل إيفا", "إنالابريل اىفا", "إنالابريل ايفأ", "إنالابريل إيفا", "إناالابريل ايفا", "إنالاابريل ايفا", "إنالابرىل ايفا", "إنالاببريل ايفا", "إنالابرييل ايفا", "إنالابريل  ايفا", "إنالابريل اييفا", "انالابريل ايفا", "إنالبريل ايفا", "إنالاريل ايفا", "إنالابيل ايفا", "إنالابرل ايفا", "إنالابري ايفا", "إنالابريل يفا", "إنالابريل افا", "إنالابريل ايفا", "إنالابريل ايفا", "إنالابريل ايفا", "إنالابريل ايفا", "إنالابريل ايفا", "إنالابريل ايفا"],
    scientificName: "Enalapril 5-10-20mg",
    category: "خافض ضغط (ACE inhibitor)",
    price: "35-60 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "حماية الكلى"
    ],
    sideEffects: [
      "سعال جاف",
      "دوخة",
      "صداع"
    ],
    contraindications: [
      "الحمل",
      "وذمة وعائية"
    ],
    dosage: "5-40mg يومياً",
    warnings: "⚠️ سعال جاف شائع. ممنوع في الحمل"
  },
  {
  name: "زستريل",
  aliases: ["Zestril", "زيستريل", "زستريل", "زصتريل", "زستريلل", "زسستريل", "زستتريل", "زستريىل", "زسترىل", "زستررل", "زسترل", "زستريال", "زيسترىل", "زستريلا", "زسترييل", "زستريلي", "زستريله", "زستريلة", "زسترال", "زيستريلل", "زسسستريل", "زستتتريل", "زستريلللل", "زيستريال", "زستررريل", "زسترريل", "زيسترل", "زستريللا", "زستريلى", "زسترريال"],
  scientificName: "Lisinopril 5-10-20mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "50-80 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "بعد الجلطة القلبية",
    "حماية الكلى عند مرضى السكري"
  ],
  sideEffects: [
    "كحة جافة (شائع)",
    "دوخة",
    "صداع",
    "إرهاق",
    "ارتفاع البوتاسيوم"
  ],
  contraindications: [
    "الحمل (خطر على الجنين)",
    "الرضاعة",
    "تضيق الشريان الكلوي",
    "ارتفاع البوتاسيوم الشديد"
  ],
  dosage: "5-40mg مرة واحدة يومياً",
  warnings: "⚠️ ممنوع في الحمل. قد يسبب كحة جافة. افحص البوتاسيوم دورياً."
},

{
  name: "ليزينو",
  aliases: ["Lisino", "ليزينو", "ليسينو", "لىزينو", "ليزىنو", "ليزينوو", "ليززينو", "لييزينو", "ليزيينو", "ليزينوه", "ليزينوة", "ليزنو", "ليزينا", "ليسينوو", "ليزينووو", "ليززينوو", "لييزينوو", "ليزيينوو", "ليزينوووو", "لىسينو", "ليزىينو", "ليزيننو", "ليزينووه", "ليسينوه", "ليزينووة", "لىىزينو", "ليززيينو", "ليزينوووه", "ليزيينوه", "ليسينووو"],
  scientificName: "Lisinopril 10mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "40-60 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "حماية الكلى"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة",
    "صداع"
  ],
  contraindications: [
    "الحمل",
    "ارتفاع البوتاسيوم"
  ],
  dosage: "10-40mg يومياً",
  warnings: "⚠️ نفس زستريل (نفس المادة الفعالة)."
},

{
  name: "راميبريل إيفا",
  aliases: ["Ramipril EVA", "راميبريل ايفا", "رامىبريل ايفا", "راميبرىل ايفا", "راميبريلل ايفا", "رامبريل ايفا", "راميبريل ايڤا", "راميبريل إيفا", "راامىبريل ايفا", "راميبرريل ايفا", "راميببريل ايفا", "راميبريل اىفا", "راميبريل ايفاا", "راميبريل ااىفا", "راميبريل ايڤاا", "رامىبرىل ايفا", "راميبريلل إيفا", "راميبريل اايفا", "رامييبريل ايفا", "راميبريل ايففا", "راميبرريل إيفا", "راامبريل ايفا", "راميبريل ايڤاه", "راميبريل ايفاة", "راميبررل ايفا", "راميبريل اىىفا", "رامىبريل اايفا", "راميبريلل ايڤا", "راميبرىل إيفا", "راميبريل ايفااا"],
  scientificName: "Ramipril 5-10mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "35-55 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "بعد الجلطة القلبية"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة",
    "إرهاق"
  ],
  contraindications: [
    "الحمل",
    "الرضاعة"
  ],
  dosage: "2.5-10mg يومياً",
  warnings: "⚠️ نفس تريتاس (شركة مختلفة)."
},

{
  name: "راميبريل فاركو",
  aliases: ["Ramipril Pharco", "راميبريل فركو", "رامىبريل فاركو", "راميبرىل فاركو", "راميبريل فارركو", "راميبريلل فاركو", "راميبريل فااركو", "رامبريل فاركو", "راميبرريل فاركو", "راميبريل فاركوو", "راامىبريل فاركو", "راميببريل فاركو", "راميبريل فرركو", "راميبريل فاركووو", "رامىبرىل فاركو", "راميبريلل فارركو", "راميبريل فااارركو", "رامييبريل فاركو", "راميبررل فاركو", "راميبريل فاركوه", "راميبريل فاركوة", "راامبريل فاركو", "راميبريل ففاركو", "راميبرىل فاركو", "راميبريل فاركووه", "رامىبريل فارركو", "راميبريلل فاركوو", "راميبريل فااركوو", "راميبريل فارككو", "راميبرريل فارركو"],
  scientificName: "Ramipril 2.5-5mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "30-50 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة"
  ],
  contraindications: [
    "الحمل"
  ],
  dosage: "2.5-10mg يومياً",
  warnings: "⚠️ نفس تريتاس (ماركة محلية)."
},

{
  name: "بيريندوبريل إيفا",
  aliases: ["Perindopril EVA", "بيريندوبريل ايفا", "بىريندوبريل ايفا", "بيرىندوبريل ايفا", "بيريندوبرىل ايفا", "بيريندوبريلل ايفا", "بريندوبريل ايفا", "بيريندوبريل ايڤا", "بيريندوبريل إيفا", "بييريندوبريل ايفا", "بيرريندوبريل ايفا", "بيريندوببريل ايفا", "بيريندوبريل اىفا", "بيريندوبريل ايفاا", "بيريندوبريل ااىفا", "بىرىندوبريل ايفا", "بيريندوبريلل إيفا", "بيريندوبريل اايفا", "بيرييندوبريل ايفا", "بيريندوبريل ايففا", "بيريندوبرريل إيفا", "بيريندووبريل ايفا", "بيريندوبريل ايڤاا", "بيريندوبريل ايفاة", "بيريندوبررل ايفا", "بيريندوبريل اىىفا", "بىريندوبريل اايفا", "بيريندوبريلل ايڤا", "بيرىندوبرىل ايفا", "بيريندوبريل ايفااا"],
  scientificName: "Perindopril 4-8mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "40-65 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "أمراض القلب التاجية"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة",
    "صداع"
  ],
  contraindications: [
    "الحمل",
    "الرضاعة"
  ],
  dosage: "4-8mg يومياً صباحاً",
  warnings: "⚠️ قوي جداً. يؤخذ صباحاً قبل الإفطار."
},

{
  name: "بيريندوبريل ساندوز",
  aliases: ["Perindopril Sandoz", "بيريندوبريل سندوز", "بىريندوبريل ساندوز", "بيرىندوبريل ساندوز", "بيريندوبرىل ساندوز", "بيريندوبريلل ساندوز", "بريندوبريل ساندوز", "بيريندوبريل سااندوز", "بييريندوبريل ساندوز", "بيرريندوبريل ساندوز", "بيريندوببريل ساندوز", "بيريندوبريل ساندووز", "بيريندوبريل سانددوز", "بيريندوبريل ساندوزز", "بىرىندوبريل ساندوز", "بيريندوبريلل سااندوز", "بيريندوبريل ساانددوز", "بيرييندوبريل ساندوز", "بيريندوبريل ساندوووز", "بيريندوبرريل ساندوز", "بيريندووبريل ساندوز", "بيريندوبريل ساندوزه", "بيريندوبريل ساندوزة", "بيريندوبررل ساندوز", "بيريندوبريل سانندوز", "بىريندوبريل سااندوز", "بيريندوبريلل ساندووز", "بيرىندوبرىل ساندوز", "بيريندوبريل ساندوززز", "بيريندوبريل سانددووز"],
  scientificName: "Perindopril 4mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "35-55 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة"
  ],
  contraindications: [
    "الحمل"
  ],
  dosage: "4-8mg يومياً",
  warnings: "⚠️ نفس بيريندوبريل (ماركة مختلفة)."
},

{
  name: "كابتوبريل فاركو",
  aliases: ["Captopril Pharco", "كابتوبريل فركو", "كابتوبرىل فاركو", "كابتوبريلل فاركو", "كابتوبريل فارركو", "كبتوبريل فاركو", "كابتوبريل فااركو", "كابتووبريل فاركو", "كاابتوبريل فاركو", "كابتوببريل فاركو", "كابتوبريل فاركوو", "كابتوبريل فرركو", "كابتوبريل فاركووو", "كابتوبرريل فاركو", "كابتوبريلل فارركو", "كابتوبريل فااارركو", "كاابتوبريل فاركو", "كابتوبررل فاركو", "كابتوبريل فاركوه", "كابتوبريل فاركوة", "كاابتووبريل فاركو", "كابتوبريل ففاركو", "كابتوبرىل فاركو", "كابتوبريل فاركووه", "كابتوبريلل فاركوو", "كابتوبريل فااركوو", "كابتوبريل فارككو", "كابتوبرريل فارركو", "كابتووبريل فارركو", "كاابتوبريل فارركو"],
  scientificName: "Captopril 25-50mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "15-30 جنيه",
  uses: [
    "ارتفاع ضغط الدم الطارئ",
    "قصور القلب",
    "بعد الجلطة القلبية"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة",
    "طعم معدني بالفم"
  ],
  contraindications: [
    "الحمل"
  ],
  dosage: "25-50mg 2-3 مرات يومياً",
  warnings: "⚠️ نفس كابوتن (ماركة محلية). يؤخذ قبل الأكل بساعة."
},

{
  name: "إنالابريل فاركو",
  aliases: ["Enalapril Pharco", "انالابريل فاركو", "انالابرىل فاركو", "إنالابريلل فاركو", "انالابريل فارركو", "إنلابريل فاركو", "إنالابريل فااركو", "اىنالابريل فاركو", "إناالابريل فاركو", "إنالاابريل فاركو", "إنالابريل فاركوو", "إنالابريل فرركو", "إنالابريل فاركووو", "إنالابرريل فاركو", "إنالابريلل فارركو", "إنالابريل فااارركو", "اناالابريل فاركو", "إنالابررل فاركو", "إنالابريل فاركوه", "إنالابريل فاركوة", "اىناالابريل فاركو", "إنالابريل ففاركو", "انالابرىل فاركو", "إنالابريل فاركووه", "إنالابريلل فاركوو", "إنالابريل فااركوو", "إنالابريل فارككو", "إنالابرريل فارركو", "اىنالابريل فارركو", "إناالابريل فارركو"],
  scientificName: "Enalapril 5-10mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "20-40 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة"
  ],
  contraindications: [
    "الحمل"
  ],
  dosage: "5-20mg مرة يومياً",
  warnings: "⚠️ قد يسبب كحة جافة مزعجة."
},

{
  name: "إنالابريل ساندوز",
  aliases: ["Enalapril Sandoz", "انالابريل ساندوز", "انالابرىل ساندوز", "إنالابريلل ساندوز", "انالابريل سااندوز", "إنلابريل ساندوز", "إنالابريل ساندووز", "اىنالابريل ساندوز", "إناالابريل ساندوز", "إنالاابريل ساندوز", "إنالابريل سانددوز", "إنالابريل ساندوزز", "إنالابرريل ساندوز", "إنالابريلل سااندوز", "إنالابريل ساانددوز", "اناالابريل ساندوز", "إنالابررل ساندوز", "إنالابريل ساندوزه", "إنالابريل ساندوزة", "اىناالابريل ساندوز", "إنالابريل سانندوز", "انالابرىل ساندوز", "إنالابريل ساندوووز", "إنالابريلل ساندووز", "إنالابريل ساانددووز", "إنالابريل سانددووز", "إنالابرريل سااندوز", "اىنالابريل سااندوز", "إناالابريل ساندووز", "إنالابريل ساندوززز"],
  scientificName: "Enalapril 10mg",
  category: "خافض ضغط (ACE inhibitor)",
  price: "25-45 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب"
  ],
  sideEffects: [
    "كحة جافة",
    "دوخة"
  ],
  contraindications: [
    "الحمل"
  ],
  dosage: "10-20mg يومياً",
  warnings: "⚠️ نفس إنالابريل (ماركة مختلفة)."
},

{
  name: "كاردورا",
  aliases: ["Cardura", "كاردورا", "كاردوره", "كاردوراة", "كردورا", "كاردورة", "كارددورا", "كاردووره", "كاردوراا", "كاردوورا", "كاردورراا", "كاردوررا", "كاردووورا", "كاردوراه", "كااردورا", "كاررددورا", "كاردورى", "كاردوورة", "كاردوورراا", "كاردووراه", "كارردورا", "كاردوراااا", "كاردوووراه", "كاررردورا", "كاردوراة", "كااردوره", "كاردوررراا", "كاردورااا", "كاردووررا", "كارددوورا"],
  scientificName: "Doxazosin 2-4mg",
  category: "خافض ضغط (Alpha blocker)",
  price: "45-65 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "تضخم البروستاتا الحميد",
    "صعوبة التبول"
  ],
  sideEffects: [
    "دوخة شديدة (خاصة عند الوقوف)",
    "إرهاق",
    "صداع",
    "انخفاض ضغط وضعي"
  ],
  contraindications: [
    "انخفاض الضغط الشديد",
    "قصور القلب"
  ],
  dosage: "1-8mg مرة واحدة يومياً مساءً",
  warnings: "⚠️⚠️ قد يسبب دوخة شديدة عند الجرعة الأولى - خذه قبل النوم. قف ببطء."
},

{
  name: "دوكسازوسين إيفا",
  aliases: ["Doxazosin EVA", "دوكسازوسين ايفا", "دوكسازوسىن ايفا", "دوكسازوسين اىفا", "دوكسازوسين ايڤا", "دوكسزوسين ايفا", "دوكسازوسين إيفا", "دووكسازوسين ايفا", "دوكساازوسين ايفا", "دوكسازووسين ايفا", "دوكسازوسىن اىفا", "دوكسازوسين ايفاا", "دوكسازوسين ااىفا", "دوكسازوسين ايڤاا", "دوكسازوسيين ايفا", "دوكسازوسين اايفا", "دووكسازوسين إيفا", "دوكساازوسين ايفا", "دوكسازووسين ايفا", "دوكسازوسين ايففا", "دوكسزوسين إيفا", "دوكسازوسين ايڤاه", "دوكسازوسين ايفاة", "دوكسازوسين اىىفا", "دووكسازوسين اايفا", "دوكسازوسىن ايڤا", "دوكسازوسىن إيفا", "دوكسازوسين ايفااا", "دوكساازوسين اايفا", "دوكسازووسين ايڤا"],
  scientificName: "Doxazosin 4mg",
  category: "خافض ضغط (Alpha blocker)",
  price: "35-55 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "تضخم البروستاتا"
  ],
  sideEffects: [
    "دوخة",
    "إرهاق"
  ],
  contraindications: [
    "انخفاض الضغط"
  ],
  dosage: "2-8mg يومياً",
  warnings: "⚠️ نفس كاردورا (شركة مختلفة)."
},

{
  name: "كاردوزين",
  aliases: ["Cardozin", "كاردوزين", "كردوزين", "كاردوزىن", "كاردووزين", "كاردوزيين", "كارددوزين", "كاردوزينن", "كااردوزين", "كاردوززين", "كاردوزيىن", "كارردوزين", "كاردووززين", "كاردوزيننن", "كااردووزين", "كاررددوزين", "كاردوززيين", "كاردوزىن", "كاردووزيين", "كارردووزين", "كاردوززينن", "كااردوززين", "كاررردوزين", "كاردوووزين", "كاردوززيىن", "كااردوزيين", "كارددووزين", "كاردووززيين", "كارردوززين", "كاردوزىىن"],
  scientificName: "Doxazosin 2mg",
  category: "خافض ضغط (Alpha blocker)",
  price: "30-50 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "تضخم البروستاتا"
  ],
  sideEffects: [
    "دوخة",
    "إرهاق"
  ],
  contraindications: [
    "انخفاض الضغط"
  ],
  dosage: "2-4mg يومياً",
  warnings: "⚠️ نفس كاردورا (ماركة محلية)."
},

{
  name: "تيرازوسين",
  aliases: ["Terazosin", "تيرازوسين", "تىرازوسين", "تيرازوسىن", "تيررازوسين", "تيرازووسين", "تيرازوسيين", "تيرازوسينن", "تيراازوسين", "تيرازوزين", "تيرازوسيىن", "تىرازوسىن", "تييرازوسين", "تيررازووسين", "تيرازوسيننن", "تيراازوسىن", "تىىرازوسين", "تيررازوزين", "تيرازووسىن", "تيرازوسيىىن", "تييرازووسين", "تيرازووزين", "تيراازووسين", "تىرازووسين", "تيررازوسيين", "تيرازوزىن", "تيراازوسيين", "تييررازوسين", "تىرازوزين", "تيرازوسىىن"],
  scientificName: "Terazosin 2-5mg",
  category: "خافض ضغط (Alpha blocker)",
  price: "40-60 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "تضخم البروستاتا الحميد"
  ],
  sideEffects: [
    "دوخة شديدة",
    "إرهاق",
    "احتقان الأنف"
  ],
  contraindications: [
    "انخفاض الضغط"
  ],
  dosage: "1-5mg مرة يومياً قبل النوم",
  warnings: "⚠️ الجرعة الأولى قد تسبب دوخة شديدة. خذه قبل النوم."
},

{
  name: "هايبوتين",
  aliases: ["Hypotin", "هايبوتين", "هايبوتىن", "هاىبوتين", "هايبووتين", "هايبوتيين", "هايبوتينن", "هاايبوتين", "هاىبوتىن", "هايبوتيىن", "هايبووتىن", "هاىىبوتين", "هايبوتيننن", "هااىبوتين", "هاايبووتين", "هايبووتيين", "هاىبووتين", "هايبوتيىىن", "هاايبوتىن", "هايبووتينن", "هاىبوتيين", "هااىبووتين", "هاىىبووتين", "هايبووتيىن", "هاايبوتيين", "هاىبوتينن", "هايبوتىىن", "هااىبوتىن", "هاىىبوتىن", "هايبووتيننن"],
  scientificName: "Terazosin 2mg",
  category: "خافض ضغط (Alpha blocker)",
  price: "35-55 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "تضخم البروستاتا"
  ],
  sideEffects: [
    "دوخة",
    "إرهاق"
  ],
  contraindications: [
    "انخفاض الضغط"
  ],
  dosage: "2-5mg يومياً",
  warnings: "⚠️ نفس تيرازوسين (ماركة مختلفة)."
},

{
  name: "برازوسين",
  aliases: ["Prazosin", "برازوسين", "برازوسىن", "بررازوسين", "برازووسين", "برازوسيين", "برازوسينن", "براازوسين", "برازوزين", "برازوسيىن", "بررازوسىن", "براازوسىن", "برازووسىن", "بررازووسين", "برازوسيننن", "براازووسين", "بررازوزين", "برازووزين", "براازوسيين", "بررازوسيين", "برازوزىن", "براازووسىن", "بررازووسىن", "برازووسيين", "براازوزين", "بررازووزين", "برازووسيىن", "براازوسيىن", "بررازوسيىن", "برازوزيين"],
  scientificName: "Prazosin 1-2mg",
  category: "خافض ضغط (Alpha blocker)",
  price: "25-45 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "تضخم البروستاتا"
  ],
  sideEffects: [
    "دوخة شديدة (خاصة الجرعة الأولى)",
    "خفقان",
    "صداع"
  ],
  contraindications: [
    "انخفاض الضغط"
  ],
  dosage: "1-5mg 2-3 مرات يومياً",
  warnings: "⚠️⚠️ الجرعة الأولى خطيرة - قد تسبب إغماء. خذها قبل النوم."
},

{
  name: "ألدوميت",
  aliases: ["Aldomet", "الدوميت", "الدومىت", "ألدومىت", "ألدوميتت", "الدووميت", "ألدوميىت", "االدوميت", "ألدومييت", "الدوميىت", "ألدوومىت", "االدومىت", "ألدوميتتت", "الدوومىت", "ألدوميىىت", "االدوومىت", "ألدووميت", "الدوميتت", "ألدوميىتت", "االدوميىت", "ألدوومىىت", "الدووميىت", "ألدوميتىت", "االدووميت", "ألدوميىتىت", "الدوومييت", "ألدووميىت", "االدوميتت", "ألدوميىىىت", "الدوومىىت"],
  scientificName: "Methyldopa 250-500mg",
  category: "خافض ضغط (مركزي)",
  price: "20-40 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "ارتفاع ضغط الحمل (آمن للحوامل)"
  ],
  sideEffects: [
    "نعاس شديد",
    "دوخة",
    "جفاف الفم",
    "اكتئاب"
  ],
  contraindications: [
    "أمراض الكبد النشطة",
    "فقر الدم الانحلالي"
  ],
  dosage: "250-500mg 2-3 مرات يومياً",
  warnings: "✅ آمن جداً للحوامل. يسبب نعاس - لا تقود. الخيار الأول لضغط الحمل."
},

{
  name: "ميثيل دوبا فاركو",
  aliases: ["Methyldopa Pharco", "ميثيل دوبا فركو", "مىثيل دوبا فاركو", "ميثىل دوبا فاركو", "ميثيلل دوبا فاركو", "ميثل دوبا فاركو", "ميثيل دوبا فارركو", "ميثيل دوبا فااركو", "مييثيل دوبا فاركو", "ميثيل دووبا فاركو", "ميثيل دوبا فاركوو", "مىثىل دوبا فاركو", "ميثيل دوبا فرركو", "ميثيل دوبا فاركووو", "مييثىل دوبا فاركو", "ميثيلل دووبا فاركو", "ميثيل دوبا فااارركو", "ميثيل دوببا فاركو", "ميثيل دوبا فاركوه", "مىثيل دووبا فاركو", "ميثىل دوبا فارركو", "ميثيلل دوبا فارركو", "ميثيل دووبا فارركو", "مييثيل دوبا فارركو", "ميثيل دوبا ففاركو", "مىثىل دووبا فاركو", "ميثيل دوببا فارركو", "ميثيلل دوبا فاركوو", "ميثيل دوبا فااركوو", "مييثيل دووبا فاركو"],
  scientificName: "Methyldopa 250mg",
  category: "خافض ضغط (مركزي)",
  price: "15-30 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "ضغط الحمل"
  ],
  sideEffects: [
    "نعاس",
    "دوخة"
  ],
  contraindications: [
    "أمراض الكبد"
  ],
  dosage: "250-500mg 2-3 مرات يومياً",
  warnings: "✅ نفس ألدوميت (ماركة محلية). آمن للحوامل."
},

{
  name: "كاتابريس",
  aliases: ["Catapres", "كاتابريس", "كاتابرىس", "كتابريس", "كاتابريص", "كاتابريسس", "كاتابرريس", "كاتاابريس", "كاتابريىس", "كاتابرريىس", "كاتاابرىس", "كاتابريسص", "كاتابرريسس", "كاتاابريىس", "كاتابرىىس", "كاتاابرريس", "كاتابريصص", "كاتابرريىىس", "كاتاابريسس", "كاتابرىس", "كاتاابرىىس", "كاتابرريصص", "كاتاابرريىس", "كاتابريىىس", "كاتاابريص", "كاتابرريسص", "كاتاابرريسس", "كاتابريىسس", "كاتاابرىس", "كاتابرريىسس"],
  scientificName: "Clonidine 75-150mcg",
  category: "خافض ضغط (مركزي)",
  price: "35-55 جنيه",
  uses: [
    "ارتفاع ضغط الدم الشديد",
    "أعراض انسحاب المخدرات",
    "الهبات الساخنة"
  ],
  sideEffects: [
    "نعاس شديد",
    "جفاف الفم شديد",
    "دوخة",
    "إمساك"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "الاكتئاب"
  ],
  dosage: "75-150mcg 2-3 مرات يومياً",
  warnings: "⚠️⚠️ لا تتوقف فجأة - قد يسبب ارتفاع ضغط خطير. قلل الجرعة تدريجياً."
},

{
  name: "كلونيدين إيفا",
  aliases: ["Clonidine EVA", "كلونيدين ايفا", "كلونىدين ايفا", "كلونيدىن ايفا", "كلونيدين اىفا", "كلونيدين ايڤا", "كلونيدين إيفا", "كللونيدين ايفا", "كلوونيدين ايفا", "كلونيددين ايفا", "كلونيدين ايفاا", "كلونيدين ااىفا", "كلونيدين ايڤاا", "كلونىدىن ايفا", "كلونيدين اايفا", "كللونيدين إيفا", "كلوونيدىن ايفا", "كلونيددين اىفا", "كلونيدين ايففا", "كلونىدين إيفا", "كلونيدين ايڤاه", "كلونيدين ايفاة", "كلونيدىن اىفا", "كللوونيدين ايفا", "كلونيدين اىىفا", "كلوونيدين ايڤا", "كلونىدىن إيفا", "كلونيددين ايڤا", "كللونيدين ايفاا", "كلونيدين ايفااا"],
  scientificName: "Clonidine 75mcg",
  category: "خافض ضغط (مركزي)",
  price: "30-50 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "أعراض انسحاب"
  ],
  sideEffects: [
    "نعاس",
    "جفاف الفم"
  ],
  contraindications: [
    "بطء القلب"
  ],
  dosage: "75-150mcg 2-3 مرات يومياً",
  warnings: "⚠️ نفس كاتابريس (شركة مختلفة). لا تتوقف فجأة."
},

{
  name: "موكسونيدين",
  aliases: ["Moxonidine", "موكسونيدين", "موكسونىدين", "موكسونيدىن", "موكسوونيدين", "موكسونيديين", "موكسونيدينن", "مووكسونيدين", "موكسوونىدين", "موكسونيديىن", "موكسونىدىن", "موكسونيدىىن", "مووكسونىدين", "موكسوونيديين", "موكسونيديننن", "مووكسوونيدين", "موكسونىديين", "موكسوونيدىن", "مووكسونيدىن", "موكسونيدىيين", "مووكسوونىدين", "موكسوونىدىن", "موكسونيديىىن", "مووكسونيديين", "موكسوونيدينن", "موكسونىدينن", "مووكسونىدىن", "موكسوونيدىىن", "مووكسوونيدىن", "موكسونىديىن"],
  scientificName: "Moxonidine 0.2-0.4mg",
  category: "خافض ضغط (مركزي)",
  price: "60-90 جنيه",
  uses: [
    "ارتفاع ضغط الدم المقاوم",
    "متلازمة الأيض"
  ],
  sideEffects: [
    "جفاف الفم",
    "دوخة خفيفة",
    "صداع"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "قصور القلب"
  ],
  dosage: "0.2-0.4mg مرة يومياً صباحاً",
  warnings: "✅ أحدث وأفضل من كلونيدين - أعراض جانبية أقل. لا تتوقف فجأة."
},

{
  name: "هيدرالازين",
  aliases: ["Hydralazine", "هيدرالازين", "هىدرالازين", "هيدرالازىن", "هيدرااالازين", "هيدرالاازين", "هيدرالازيين", "هيدرالازينن", "هىدرالازىن", "هيدرالاازىن", "هيدرالازيىن", "هيدرااالازىن", "هىىدرالازين", "هيدرالااازين", "هيدرالازىىن", "هيدرااالاازين", "هىدرالاازين", "هيدرالازيينن", "هيدراالازين", "هيدرالااازىن", "هىىدرالازىن", "هيدرالازىيين", "هيدرااالازيين", "هىدرالااازين", "هيدرالاازيين", "هيدرالازىنن", "هىىدرااالازين", "هيدراالاازين", "هيدرالازيىىن", "هيدرااالااازين"],
  scientificName: "Hydralazine 25-50mg",
  category: "موسع أوعية (Vasodilator)",
  price: "30-50 جنيه",
  uses: [
    "ارتفاع ضغط الدم الشديد",
    "قصور القلب",
    "ضغط الحمل الشديد"
  ],
  sideEffects: [
    "صداع شديد",
    "خفقان",
    "احتباس السوائل",
    "ذئبة دوائية (استعمال طويل)"
  ],
  contraindications: [
    "أمراض القلب التاجية",
    "الذئبة الحمراء"
  ],
  dosage: "25-100mg 2-4 مرات يومياً",
  warnings: "⚠️⚠️ قد يسبب ذئبة دوائية مع الاستعمال الطويل. يستخدم مع مدرات ومثبطات بيتا."
},

{
  name: "أبريزولين",
  aliases: ["Apresoline", "ابريزولين", "ابرىزولين", "أبريزولىن", "ابريزولىن", "أبريزوولين", "ابريزوولين", "أبرىزولين", "ابرريزولين", "أبريززولين", "ابريززولين", "أبريزوليين", "ابريزوليين", "أبريزولينن", "ابرىزولىن", "أبرىزولىن", "ابريزوولىن", "أبريزووولين", "ابرريزولىن", "أبريزولىىن", "ابريزولىىن", "أبرريزولين", "ابرىىزولين", "أبريزووليين", "ابريززوولين", "أبريزولىنن", "ابرريزوولين", "أبرىزوولين", "ابريزوليىن", "أبريززولىن"],
  scientificName: "Hydralazine 25mg",
  category: "موسع أوعية (Vasodilator)",
  price: "25-45 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب"
  ],
  sideEffects: [
    "صداع",
    "خفقان"
  ],
  contraindications: [
    "أمراض القلب التاجية"
  ],
  dosage: "25-100mg يومياً",
  warnings: "⚠️ نفس هيدرالازين (اسم تجاري)."
},

{
  name: "مينوكسيديل أقراص",
  aliases: ["Minoxidil tablets", "مينوكسيديل اقراص", "مىنوكسيديل اقراص", "مينوكسىديل اقراص", "مينوكسيدىل اقراص", "مينوكسيديل أقراص", "مينوكسيديلل اقراص", "مينووكسيديل اقراص", "مينوكسسيديل اقراص", "مينوكسيديل اقرااص", "مينوكسيديل اقرراص", "مىنوكسىديل اقراص", "مينوكسىدىل اقراص", "مينوكسيديلل أقراص", "مينووكسىديل اقراص", "مينوكسسيدىل اقراص", "مينوكسيديل اقراااص", "مىىنوكسيديل اقراص", "مينوكسيدىىل اقراص", "مينووكسيديل أقراص", "مينوكسسىديل اقراص", "مينوكسيديل اقرااااص", "مىنوكسيدىل اقراص", "مينووكسسيديل اقراص", "مينوكسىىديل اقراص", "مينوكسيديلل اقرااص", "مىىنوكسىديل اقراص", "مينووكسيدىل اقراص", "مينوكسسيديل أقراص", "مينوكسيديل اقرصص"],
  scientificName: "Minoxidil 5-10mg",
  category: "موسع أوعية (Vasodilator)",
  price: "80-120 جنيه",
  uses: [
    "ارتفاع ضغط الدم المقاوم للعلاج",
    "ارتفاع ضغط الشديد جداً"
  ],
  sideEffects: [
    "نمو شعر زائد بالجسم (شائع جداً)",
    "احتباس سوائل شديد",
    "خفقان",
    "تغيرات في تخطيط القلب"
  ],
  contraindications: [
    "ورم في الغدة الكظرية",
    "قصور القلب الحاد"
  ],
  dosage: "5-40mg يومياً مقسمة على جرعتين",
  warnings: "⚠️⚠️⚠️ للضغط الشديد المقاوم فقط. يسبب نمو شعر زائد بكل الجسم (حتى للنساء). يستخدم مع مدرات ومثبطات بيتا."
},

{
  name: "ديازوكسيد",
  aliases: ["Diazoxide", "ديازوكسيد", "ديازوكسىد", "دىازوكسيد", "ديازووكسيد", "ديازوكسسيد", "ديازوكسيدد", "دياازوكسيد", "ديازوكسيىد", "دىازوكسىد", "ديازووكسىد", "دياازوكسىد", "ديازوكسسيدد", "دىىازوكسيد", "ديازووكسسيد", "دياازووكسيد", "ديازوكسىىد", "دىازووكسيد", "ديازوكسسىد", "دياازوكسسيد", "ديازووكسيدد", "دىىازوكسىد", "ديازوكسسسيد", "دياازوكسىىد", "ديازووكسىىد", "دىازوكسسيد", "ديازوكسيددد", "دياازووكسىد", "ديازوكسسيىد", "دىىازووكسيد"],
  scientificName: "Diazoxide 50mg",
  category: "موسع أوعية طوارئ",
  price: "غير متاح (مستشفيات فقط)",
  uses: [
    "ارتفاع ضغط الدم الطارئ (حقن وريدي)",
    "انخفاض السكر عند الأطفال (أقراص)"
  ],
  sideEffects: [
    "ارتفاع السكر",
    "احتباس سوائل",
    "خفقان"
  ],
  contraindications: [
    "تشريح الأبهر"
  ],
  dosage: "حقن وريدي في المستشفى فقط",
  warnings: "⚠️⚠️⚠️ للطوارئ فقط في المستشفى. يرفع السكر بشدة."
},

{
  name: "نيتروبروسيد",
  aliases: ["Nitroprusside", "نيتروبروسيد", "نىتروبروسيد", "نيتروبروسىد", "نيتروبروسيدد", "نيتروبرووسيد", "نيتروبروسسيد", "نيترووبروسيد", "نيتروبرروسيد", "نىتروبروسىد", "نيتروبروسيىد", "نيتروبرووسىد", "نىىتروبروسيد", "نيتروبروسسيدد", "نيترووبرووسيد", "نيتروبرروسىد", "نيتروبروسىىد", "نىتروبرووسيد", "نيتروبروسسىد", "نيترووبروسسيد", "نيتروبرروسسيد", "نىىتروبروسىد", "نيتروبرووسسيد", "نيترووبروسىد", "نيتروبرروووسيد", "نىتروبروسسيد", "نيتروبروسيددد", "نيترووبرروسيد", "نىىتروبرووسيد", "نيتروبروسسىىد"],
  scientificName: "Sodium Nitroprusside",
  category: "موسع أوعية طوارئ",
  price: "غير متاح (مستشفيات فقط)",
  uses: [
    "ارتفاع ضغط الدم الطارئ الشديد (حقن وريدي)",
    "قصور القلب الحاد"
  ],
  sideEffects: [
    "انخفاض ضغط شديد",
    "تسمم بالسيانيد (استعمال طويل)",
    "صداع"
  ],
  contraindications: [
    "ضعف الدورة الدموية للدماغ"
  ],
  dosage: "محلول وريدي مستمر في العناية المركزة فقط",
  warnings: "⚠️⚠️⚠️ للطوارئ الحرجة فقط في العناية المركزة. قد يسبب تسمم سيانيد. يحتاج مراقبة دقيقة."
},

{
  name: "إنداباميد",
  aliases: ["Indapamide", "انداباميد", "اندابامىد", "إندابامىد", "انداباميدد", "إنداباامىد", "اندابااميد", "إنداباميىد", "انداباميىد", "إندابامميد", "اندباميد", "إنداباميدد", "انداابامىد", "إندابااميىد", "اندابامىىد", "إنداباامميد", "انددباميد", "إنداباميددد", "اندابااامىد", "إندابامىىد", "انداباميميد", "إنداابامىد", "اندابامميد", "إندابااميدد", "انداباميىىد", "إنداباامىىد", "اندداباميد", "إنداباميىدد", "اندابااميميد", "إندابامميىد"],
  scientificName: "Indapamide 1.5-2.5mg",
  category: "مدر بول (Thiazide-like)",
  price: "35-55 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "احتباس السوائل الخفيف"
  ],
  sideEffects: [
    "انخفاض البوتاسيوم",
    "دوخة",
    "إرهاق"
  ],
  contraindications: [
    "قصور الكلى الشديد",
    "انخفاض البوتاسيوم الشديد"
  ],
  dosage: "1.5-2.5mg مرة واحدة صباحاً",
  warnings: "⚠️ افحص البوتاسيوم دورياً. فعال جداً لخفض الضغط."
},

{
  name: "ناتريليكس",
  aliases: ["Natrilix", "ناتريليكس", "ناتريلىكس", "نتريليكس", "ناتريليكص", "ناتريليكسس", "ناتريلليكس", "ناترريليكس", "نااتريليكس", "ناتريليىكس", "ناتريلىىكس", "نااتريلىكس", "ناتريليكسص", "ناترريلىكس", "ناتريلليكص", "نااتريليىكس", "ناتريليكصص", "ناتررليكس", "ناتريلليىكس", "نااتررليكس", "ناتريلىكص", "ناتريليكسسس", "ناترريليىكس", "نااتريليكص", "ناتريلليكسس", "ناتريليىىكس", "نااتريلليكس", "ناتررليىكس", "ناتريلىىكص", "نااتريليكسس"],
  scientificName: "Indapamide 1.5mg SR",
  category: "مدر بول (Thiazide-like)",
  price: "40-60 جنيه",
  uses: [
    "ارتفاع ضغط الدم"
  ],
  sideEffects: [
    "انخفاض البوتاسيوم",
    "دوخة"
  ],
  contraindications: [
    "قصور الكلى"
  ],
  dosage: "1.5mg مرة صباحاً",
  warnings: "⚠️ نفس إنداباميد (اسم تجاري). افحص البوتاسيوم."
},

{
  name: "موديوريتيك",
  aliases: ["Moduretic", "موديوريتيك", "موديورىتيك", "مودىوريتيك", "موديوريتىك", "موديوريتيكك", "مووديوريتيك", "موديووريتيك", "موددىوريتيك", "موديوريىتيك", "مودىورىتيك", "موديوريتىىك", "مووديورىتيك", "موديووريتىك", "موددىورىتيك", "موديوريتيكى", "مودىىوريتيك", "موديووريىتيك", "مووددىوريتيك", "موديوريىتىك", "موديورريتيك", "مودىوريتىك", "مووديوريتىك", "موديووريتيكك", "موددىوريتىك", "موديوريتيىك", "مودىىورىتيك", "موديووريىتىك", "مووديووريتيك", "موددىووريتيك"],
  scientificName: "Amiloride 5mg + Hydrochlorothiazide 50mg",
  category: "مدر بول (موفر للبوتاسيوم + Thiazide)",
  price: "25-45 جنيه",
  uses: [
    "ارتفاع ضغط الدم",
    "احتباس السوائل",
    "منع نقص البوتاسيوم"
  ],
  sideEffects: [
    "ارتفاع البوتاسيوم (نادر)",
    "دوخة",
    "إرهاق"
  ],
  contraindications: [
    "ارتفاع البوتاسيوم",
    "قصور الكلى"
  ],
  dosage: "1-2 قرص يومياً صباحاً",
  warnings: "✅ ميزته: يحافظ على البوتاسيوم. افحص البوتاسيوم دورياً."
},

{
  name: "أميلورايد",
  aliases: ["Amiloride", "اميلورايد", "امىلورايد", "أميلوراىد", "اميلوراىد", "أميلورايدد", "اميلوورايد", "أميللورايد", "اميللورايد", "أمىلورايد", "اميلورراىد", "أميلوراييد", "امىلوراىد", "أميلوورايد", "اميلورايدد", "أميلوراىىد", "امىىلورايد", "أميللوراىد", "اميلوورراىد", "أمىلوراىد", "اميلورايىد", "أميلوراايد", "امىلورراىد", "أميللورراىد", "اميلوراىىد", "أميلوورراىد", "امىىلوراىد", "أمىىلورايد", "اميللورايدد", "أميلوراىدد", "اميلوورايىد"],
  scientificName: "Amiloride 5mg",
  category: "مدر بول (موفر للبوتاسيوم)",
  price: "20-40 جنيه",
  uses: [
    "احتباس السوائل",
    "منع نقص البوتاسيوم مع مدرات أخرى"
  ],
  sideEffects: [
    "ارتفاع البوتاسيوم",
    "دوخة"
  ],
  contraindications: [
    "ارتفاع البوتاسيوم",
    "قصور الكلى"
  ],
  dosage: "5-10mg يومياً",
  warnings: "⚠️ يستخدم مع مدرات أخرى لحماية البوتاسيوم. افحص البوتاسيوم."
},

{
  name: "بوميتانيد",
  aliases: ["Bumetanide", "بوميتانيد", "بومىتانيد", "بوميتانىد", "بوميتانيدد", "بوومىتانيد", "بوميتاانيد", "بووميتانيد", "بومىتانىد", "بوميتانىىد", "بوومىتانىد", "بوميتاانىد", "بوومميتانيد", "بومىىتانيد", "بووميتانىد", "بوميتانيددد", "بوومىتاانيد", "بومىتاانيد", "بوومميتانىد", "بوميتاانيىد", "بووميتاانيد", "بومىىتانىد", "بوومىىتانيد", "بوميتانىدد", "بووممىتانيد", "بومىتانيددد", "بوومميتاانيد", "بوميتاانىىد", "بووميتانيددد", "بومىىتاانيد"],
  scientificName: "Bumetanide 0.5-1mg",
  category: "مدر بول (Loop diuretic)",
  price: "40-60 جنيه",
  uses: [
    "احتباس السوائل الشديد",
    "قصور القلب",
    "قصور الكلى"
  ],
  sideEffects: [
    "انخفاض البوتاسيوم",
    "جفاف",
    "دوخة"
  ],
  contraindications: [
    "الجفاف الشديد",
    "انخفاض البوتاسيوم الشديد"
  ],
  dosage: "0.5-2mg مرة يومياً صباحاً",
  warnings: "⚠️ أقوى 40 مرة من الفوروسيميد. افحص البوتاسيوم والكهارل دورياً."
},

{
  name: "كليكسان",
  aliases: ["Clexane", "كليكسان", "كلىكسان", "كليكسن", "كليكصان", "كليكسانن", "كليكسسان", "كلليكسان", "كلىىكسان", "كليكساان", "كلىكسن", "كليكصان", "كللىكسان", "كليكسسانن", "كلىكساان", "كليكسنن", "كليكصصان", "كلليكسسان", "كلىىكسن", "كليكسااان", "كللىىكسان", "كلىكصان", "كليكساننن", "كلليكساان", "كلىكسسان", "كليكصانن", "كلليكسنن", "كلىىكساان", "كليكسسسان", "كللىكساان"],
  scientificName: "Enoxaparin 40-60-80mg",
  category: "مضاد تجلط (Low molecular weight heparin)",
  price: "80-150 جنيه (حسب التركيز)",
  uses: [
    "منع الجلطات بعد العمليات",
    "علاج الجلطات الوريدية",
    "الذبحة الصدرية غير المستقرة",
    "غسيل الكلى"
  ],
  sideEffects: [
    "نزيف",
    "كدمات في مكان الحقن",
    "نقص الصفائح الدموية (نادر)"
  ],
  contraindications: [
    "نزيف نشط",
    "قصور الكلى الشديد",
    "الحساسية للهيبارين"
  ],
  dosage: "حقن تحت الجلد حسب الوزن والحالة (20-40-60-80mg يومياً)",
  warnings: "⚠️⚠️ لا تحقن في العضل. افحص الصفائح الدموية. خطر نزيف - لا تستخدم مع أدوية سيولة أخرى بدون استشارة."
},

{
  name: "فلوكسابارين",
  aliases: ["Fluxaparin", "فلوكسابارين", "فلوكسابارىن", "فلوكصابارين", "فلوكسابارينن", "فللوكسابارين", "فلوكساابارين", "فلووكسابارين", "فلوكسابرين", "فلوكسابارىىن", "فلوكصابارىن", "فللوكسابارىن", "فلوكساابارىن", "فلووكسابارىن", "فلوكسابارينnn", "فلوكصصابارين", "فللوكساابارين", "فلوكسابررين", "فلووكساابارين", "فلوكسابارىنن", "فلوكصابارينن", "فللووكسابارين", "فلوكسااباارين", "فلوكسابارىىىن", "فلووكسابرين", "فلوكصصابارىن", "فللوكسابارينن", "فلوكساابررين", "فلووكساابارىن", "فلوكسابارىننن"],
  scientificName: "Enoxaparin 40-60mg",
  category: "مضاد تجلط (LMWH)",
  price: "60-120 جنيه",
  uses: [
    "منع الجلطات",
    "علاج الجلطات"
  ],
  sideEffects: [
    "نزيف",
    "كدمات"
  ],
  contraindications: [
    "نزيف نشط"
  ],
  dosage: "حقن تحت الجلد يومياً",
  warnings: "⚠️ نفس كليكسان (بديل محلي). افحص الصفائح."
},

{
  name: "هيبارين صوديوم",
  aliases: ["Heparin Sodium", "هيبارين صوديوم", "هىبارين صوديوم", "هيبارىن صوديوم", "هيبارين صودىوم", "هيبارين صوديووم", "هيباارين صوديوم", "هيبررين صوديوم", "هىبارىن صوديوم", "هيبارين صودىىوم", "هيباارىن صوديوم", "هىىبارين صوديوم", "هيبررين صودىوم", "هيبارىن صوديووم", "هيبارين صوديومم", "هيباارين صودىوم", "هىبارين صوديووم", "هيبرين صوديوم", "هيبررىن صوديوم", "هىىبارىن صوديوم", "هيباارين صوديووم", "هيبارىن صودىوم", "هىبررين صوديوم", "هيبارين صودىووم", "هيباارىن صوديووم", "هىبارىن صودىوم", "هيبررين صوديووم", "هىىبارين صودىوم", "هيباارىن صودىوم", "هيبارين صوديوومم"],
  scientificName: "Heparin Sodium 5000 IU/ml",
  category: "مضاد تجلط (Heparin)",
  price: "30-60 جنيه",
  uses: [
    "منع وعلاج الجلطات (حقن وريدي أو تحت الجلد)",
    "غسيل الكلى",
    "القسطرة القلبية"
  ],
  sideEffects: [
    "نزيف",
    "نقص الصفائح الدموية",
    "كدمات"
  ],
  contraindications: [
    "نزيف نشط",
    "نقص الصفائح بسبب الهيبارين سابقاً"
  ],
  dosage: "حقن وريدي مستمر أو تحت الجلد كل 8-12 ساعة حسب الحالة",
  warnings: "⚠️⚠️ يحتاج مراقبة دقيقة لتحاليل التجلط (APTT). خطر نزيف. في المستشفى فقط."
},

{
  name: "فوندابارينوكس",
  aliases: ["Fondaparinux", "فوندابارينوكس", "فوندابارىنوكس", "فوندابرينوكس", "فوندابارينوكص", "فوندابارينوكسس", "فونداابارينوكس", "فووندابارينوكس", "فوندابارىىنوكس", "فوندابررينوكس", "فوندابارينووكس", "فونداابارىنوكس", "فووندابارىنوكس", "فوندابارينوكصص", "فونداابرينوكس", "فوندابارىنوكص", "فووندابررينوكس", "فوندابارينوكسسس", "فونداابارينووكس", "فوندابارىىنوكص", "فووندابارينووكس", "فونداابارىىنوكس", "فوندابررىنوكس", "فووندااباري نوكس", "فوندابارينوكصصص", "فونداابررينوكس", "فوندابارىنووكس", "فووندابارىىنوكس", "فونداابارينوكص", "فوندابارىىنووكس"],
  scientificName: "Fondaparinux 2.5-5-7.5mg",
  category: "مضاد تجلط (Selective Factor Xa inhibitor)",
  price: "150-250 جنيه",
  uses: [
    "منع الجلطات بعد العمليات الكبرى",
    "علاج الجلطات الوريدية العميقة",
    "الذبحة الصدرية الحادة"
  ],
  sideEffects: [
    "نزيف",
    "فقر دم",
    "كدمات"
  ],
  contraindications: [
    "نزيف نشط",
    "قصور الكلى الشديد",
    "التهاب الشغاف البكتيري"
  ],
  dosage: "حقن تحت الجلد مرة يومياً (2.5-5-7.5mg حسب الوزن)",
  warnings: "⚠️⚠️ أطول مفعولاً من كليكسان. لا ترياق له - النزيف خطير. للمستشفى فقط."
},

{
  name: "برافاكس",
  aliases: ["Fraxiparine", "برافاكس", "برافكس", "برافاكص", "برافاكسس", "براافاكس", "بررافاكس", "برافااكس", "براافكس", "برافاكصص", "بررافكس", "برافاكسسس", "براافااكس", "بررافاكص", "برافااكص", "براافاكسس", "برراافاكس", "برافاكصصص", "بررافااكس", "برافااكسس", "براافاكصص", "بررافكص", "برافاكسص", "براافااكص", "بررافاكسس", "برافااكصص", "براافكص", "بررراافاكس", "برافاكسسسس", "براافاكسص"],
  scientificName: "Nadroparin Calcium",
  category: "مضاد تجلط (LMWH)",
  price: "100-180 جنيه",
  uses: [
    "منع الجلطات",
    "علاج الجلطات",
    "غسيل الكلى"
  ],
  sideEffects: [
    "نزيف",
    "كدمات"
  ],
  contraindications: [
    "نزيف نشط"
  ],
  dosage: "حقن تحت الجلد يومياً",
  warnings: "⚠️ نوع آخر من الهيبارين. افحص الصفائح."
},

{
  name: "ديجوكسين فاركو",
  aliases: ["Digoxin Pharco", "ديجوكسين فاركو", "ديجوكسىن فاركو", "دىجوكسين فاركو", "ديجوكسين فركو", "ديجوكسين فارركو", "ديجوكصين فاركو", "ديجووكسين فاركو", "دىجوكسىن فاركو", "ديجوكسىن فارركو", "ديججوكسين فاركو", "ديجوكسين فااركو", "دىىجوكسين فاركو", "ديجوكصىن فاركو", "ديجووكسىن فاركو", "ديججوكسىن فاركو", "ديجوكسين فاركوو", "دىجووكسين فاركو", "ديجوكصصين فاركو", "ديججووكسين فاركو", "ديجوكسىن فااركو", "دىىجوكسىن فاركو", "ديجووكصين فاركو", "ديججوكصين فاركو", "ديجوكسين فارركوو", "دىجوكسىن فارركو", "ديجوكسىىن فاركو", "ديججوكسين فااركو", "ديجووكسين فارركو", "دىىجووكسين فاركو"],
  scientificName: "Digoxin 0.25mg",
  category: "دواء القلب (Cardiac glycoside)",
  price: "15-30 جنيه",
  uses: [
    "قصور القلب",
    "الرجفان الأذيني (تنظيم ضربات القلب)",
    "تسرع القلب"
  ],
  sideEffects: [
    "غثيان وقيء",
    "فقدان شهية",
    "اضطراب نظم القلب",
    "رؤية صفراء أو خضراء (تسمم)",
    "تشوش ذهني"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "انسداد القلب",
    "التسمم بالديجوكسين"
  ],
  dosage: "0.125-0.25mg مرة يومياً",
  warnings: "⚠️⚠️⚠️ نافذة علاجية ضيقة جداً - سهل التسمم به. افحص مستوى الديجوكسين بالدم والبوتاسيوم دورياً. نقص البوتاسيوم يزيد خطر التسمم."
},
{
  name: "إنتريستو",
  aliases: ["Entresto", "انتريستو", "إنترستو", "انترىستو", "إنتريسنو", "انتريسطو", "إنترىستو", "انتريستوو", "إنتريستوو", "انترستو", "إنترسنو", "انتريسنو", "إنتريسطو", "انترىسطو", "إنترستوو", "انتريستووو", "إنتريستووو", "انترسنو", "إنترىسطو", "انتريستتو", "إنتريستتو", "انترستوو", "إنترسطو", "انترىستوو", "إنتريسستو", "انتريسستو", "إنترىسنو", "انترسطو", "إنتريستو", "انتريستو"],
  scientificName: "Sacubitril/Valsartan",
  category: "مثبط نبريلايسين ومضاد مستقبلات أنجيوتنسين",
  price: "1800-2500 جنيه (علبة 28 قرص)",
  uses: [
    "قصور القلب المزمن مع انخفاض الكسر القذفي",
    "تقليل خطر الوفاة والدخول للمستشفى في مرضى قصور القلب"
  ],
  sideEffects: [
    "انخفاض ضغط الدم",
    "ارتفاع البوتاسيوم",
    "دوخة",
    "سعال",
    "فشل كلوي"
  ],
  contraindications: [
    "الحمل والرضاعة",
    "تاريخ وذمة وعائية",
    "الاستخدام المتزامن مع مثبطات ACE",
    "انخفاض شديد في ضغط الدم"
  ],
  dosage: "يبدأ بـ 49/51 مجم مرتين يومياً، يمكن زيادته تدريجياً حتى 97/103 مجم مرتين يومياً",
  warnings: "⚠️⚠️ يجب التوقف عن مثبطات ACE قبل 36 ساعة على الأقل. مراقبة الضغط والبوتاسيوم ووظائف الكلى. خطر الوذمة الوعائية."
},

{
  name: "إليكويس",
  aliases: ["Eliquis", "اليكويس", "إليكوىس", "اليكوىس", "إليكويسس", "اليكويسس", "إليكووىس", "اليكووىس", "إليكوويس", "اليكوويس", "إليكويىس", "اليكويىس", "إليكوىىس", "اليكوىىس", "إليكوويسس", "اليكوويسس", "إليكويسسس", "اليكويسسس", "إليككويس", "اليككويس", "إليكوىيس", "اليكوىيس", "إليكووويس", "اليكووويس", "إليكويس", "اليكويس", "إليكوييس", "اليكوييس", "إليكوىسس", "اليكوىسس"],
  scientificName: "Apixaban",
  category: "مضاد تخثر (مثبط العامل Xa)",
  price: "900-1400 جنيه (علبة 60 قرص)",
  uses: [
    "الوقاية من السكتة الدماغية في الرجفان الأذيني",
    "علاج والوقاية من الجلطات الوريدية العميقة والانسداد الرئوي",
    "الوقاية من الجلطات بعد جراحة استبدال الورك أو الركبة"
  ],
  sideEffects: [
    "نزيف (خطير أحياناً)",
    "كدمات",
    "غثيان",
    "أنيميا",
    "نزيف هضمي"
  ],
  contraindications: [
    "نزيف نشط شديد",
    "أمراض الكبد الشديدة",
    "الحمل والرضاعة"
  ],
  dosage: "5 مجم مرتين يومياً للرجفان الأذيني (2.5 مجم إذا توفرت معايير خاصة)، 10 مجم مرتين يومياً لمدة 7 أيام ثم 5 مجم مرتين لعلاج الجلطات",
  warnings: "⚠️⚠️⚠️ خطر النزيف الشديد. لا تتوقف فجأة عن الدواء. أخبر الطبيب قبل أي جراحة أو إجراء. تجنب الأدوية التي تزيد النزيف مثل الأسبرين والإيبوبروفين."
},

{
  name: "زاريلتو",
  aliases: ["Xarelto", "زارلتو", "زاريلطو", "زارىلتو", "زاريلنو", "زارلطو", "زاريلتوو", "زارىلطو", "زاريلطوو", "زارلنو", "زاريلىتو", "زارىلنو", "زاريلتتو", "زارلتوو", "زاريلطتو", "زارىلتوو", "زاريللتو", "زاررلتو", "زارىىلتو", "زاريلتووو", "زارلطتو", "زاريلنتو", "زارىلطتو", "زاريلتو", "زارلتو", "زاريىلتو", "زاررلطو", "زارىلتتو", "زاريلتنو", "زارلنتو"],
  scientificName: "Rivaroxaban",
  category: "مضاد تخثر (مثبط العامل Xa)",
  price: "850-1300 جنيه (علبة 28 قرص)",
  uses: [
    "الوقاية من السكتة الدماغية في الرجفان الأذيني",
    "علاج والوقاية من الجلطات الوريدية العميقة والانسداد الرئوي",
    "الوقاية من الجلطات في متلازمة الشريان التاجي الحادة",
    "الوقاية بعد جراحة استبدال الورك أو الركبة"
  ],
  sideEffects: [
    "نزيف",
    "أنيميا",
    "غثيان",
    "آلام بطن",
    "دوخة",
    "صداع"
  ],
  contraindications: [
    "نزيف نشط",
    "أمراض الكبد الشديدة مع اضطراب تخثر",
    "الحمل والرضاعة"
  ],
  dosage: "15-20 مجم مرة يومياً حسب الحالة، يؤخذ مع الطعام للجرعات العالية",
  warnings: "⚠️⚠️⚠️ خطر النزيف. مراقبة وظائف الكلى. تجنب التوقف المفاجئ. خذ الجرعات العالية (15-20 مجم) مع الطعام."
},

{
  name: "بريلينتا",
  aliases: ["Brilinta", "بريلنتا", "بريلىنتا", "بريلينطا", "بريلنطا", "بريلىنطا", "بريلينتتا", "بريلنتتا", "بريلىنتتا", "بريلينطتا", "بريلنطتا", "بريلىنطتا", "بريليينتا", "بريلىىنتا", "بريللينتا", "بريلينتا", "بريلنتا", "بريىلينتا", "برىلينتا", "بريلينتاا", "بريلنتاا", "بريلىنتاا", "بريلينطاا", "بريللنتا", "برىلنتا", "بريلىىنطا", "بريليينطا", "بريلنططا", "برىىلينتا", "بريلينتتتا"],
  scientificName: "Ticagrelor",
  category: "مضاد صفائح دموية",
  price: "450-700 جنيه (علبة 56 قرص)",
  uses: [
    "متلازمة الشريان التاجي الحادة (ذبحة غير مستقرة، احتشاء عضلة القلب)",
    "الوقاية من الجلطات بعد القسطرة القلبية والدعامات",
    "تقليل خطر السكتة الدماغية والنوبة القلبية"
  ],
  sideEffects: [
    "نزيف",
    "ضيق تنفس",
    "كدمات",
    "صداع",
    "دوخة",
    "غثيان"
  ],
  contraindications: [
    "نزيف نشط",
    "تاريخ نزيف داخل الجمجمة",
    "أمراض كبد شديدة"
  ],
  dosage: "جرعة بداية 180 مجم مرة واحدة، ثم 90 مجم مرتين يومياً",
  warnings: "⚠️⚠️ لا تتوقف فجأة بدون استشارة الطبيب - خطر الجلطة. قد يسبب ضيق تنفس عابر (عادة غير خطير). تجنب الأدوية التي تزيد النزيف."
},

{
  name: "بلافيكس",
  aliases: ["Plavix", "بلفكس", "بلافىكس", "بلافكس", "بلفىكس", "بلافيكسس", "بلفكسس", "بلافىكسس", "بلافييكس", "بلفىىكس", "بلاففكس", "بللافكس", "بلافكسسس", "بلافىىكس", "بلفكس", "بلاڤكس", "بلافيكس", "بلافكس", "بللفكس", "بلاافكس", "بلافىكسسس", "بلاففىكس", "بلفىكسس", "بللافىكس", "بلافيىكس", "بلاافىكس", "بللفىكس", "بلافككس", "بلاففكسس", "بلفىىىكس"],
  scientificName: "Clopidogrel",
  category: "مضاد صفائح دموية",
  price: "120-250 جنيه (علبة 30 قرص) - المستورد أغلى",
  uses: [
    "الوقاية من النوبات القلبية والسكتات الدماغية",
    "بعد جراحة القلب المفتوح أو القسطرة",
    "مرض الشرايين الطرفية",
    "متلازمة الشريان التاجي الحادة"
  ],
  sideEffects: [
    "نزيف",
    "كدمات",
    "اضطرابات هضمية",
    "طفح جلدي",
    "إسهال"
  ],
  contraindications: [
    "نزيف نشط (قرحة هضمية، نزيف داخل الجمجمة)",
    "أمراض كبد شديدة"
  ],
  dosage: "75 مجم مرة واحدة يومياً (جرعة تحميل 300-600 مجم في الحالات الحادة)",
  warnings: "⚠️⚠️ يحتاج تنشيط في الكبد ليعمل - بعض الناس لا يستجيبون جيداً (poor metabolizers). لا تتوقف قبل الجراحة إلا بأمر الطبيب. خطر النزيف."
},

{
  name: "ليبيتور",
  aliases: ["Lipitor", "لبيتور", "ليبىتور", "ليبيطور", "لبىتور", "ليبيتوور", "لبيطور", "ليبىطور", "ليبيتتور", "لبيتوور", "ليبىتوور", "ليبيطوور", "لبىطور", "ليبييتور", "لبيتتور", "ليبىىتور", "ليبيتور", "لبيتور", "ليبيتوورر", "لليبيتور", "ليبيطتور", "لبىتوور", "ليبىتتور", "ليببيتور", "لبيىتور", "ليبيتووور", "لليبىتور", "ليبىطوور", "لبيطتور", "ليبيتتوور"],
  scientificName: "Atorvastatin",
  category: "ستاتين (خافض كوليسترول)",
  price: "80-180 جنيه (علبة 30 قرص) حسب التركيز والشركة",
  uses: [
    "ارتفاع كوليسترول الدم",
    "الوقاية من أمراض القلب والشرايين",
    "بعد النوبات القلبية والسكتات الدماغية",
    "داء السكري مع عوامل خطر قلبية"
  ],
  sideEffects: [
    "آلام عضلات",
    "صداع",
    "غثيان",
    "إسهال",
    "ارتفاع إنزيمات الكبد",
    "نادراً: انحلال العضلات (rhabdomyolysis)"
  ],
  contraindications: [
    "أمراض كبد نشطة",
    "الحمل والرضاعة",
    "حساسية من الستاتينات"
  ],
  dosage: "10-80 مجم مرة واحدة يومياً مساءً",
  warnings: "⚠️ راقب إنزيمات الكبد وإنزيم CPK. أخبر الطبيب فوراً عن آلام عضلات شديدة. تجنب عصير الجريب فروت. يستخدم بحذر مع بعض الأدوية."
},

{
  name: "كريستور",
  aliases: ["Crestor", "كرستور", "كريسطور", "كرىستور", "كريستوور", "كرسطور", "كريىستور", "كرستوور", "كريسنور", "كرىسطور", "كريستتور", "كرستتور", "كريسطوور", "كرىستوور", "كريىسطور", "كرىسنور", "كريستور", "كرستور", "كرريستور", "ككريستور", "كريسستور", "كرىىستور", "كريستوورر", "كرسنور", "كريستتوور", "كرىستتور", "كريىىستور", "كرستوورر", "كريسطتور", "كرريسطور"],
  scientificName: "Rosuvastatin",
  category: "ستاتين (خافض كوليسترول)",
  price: "120-280 جنيه (علبة 30 قرص) حسب التركيز",
  uses: [
    "ارتفاع كوليسترول الدم",
    "ارتفاع الدهون الثلاثية",
    "الوقاية الأولية والثانوية من أمراض القلب",
    "فرط كوليسترول الدم العائلي"
  ],
  sideEffects: [
    "آلام عضلات وضعف",
    "صداع",
    "دوخة",
    "غثيان",
    "آلام بطن",
    "ارتفاع إنزيمات الكبد"
  ],
  contraindications: [
    "أمراض كبد نشطة",
    "الحمل والرضاعة",
    "حساسية من الدواء"
  ],
  dosage: "5-40 مجم مرة واحدة يومياً (يفضل مساءً)",
  warnings: "⚠️ من أقوى الستاتينات فعالية. مراقبة دورية للكبد والعضلات. أخبر الطبيب عن آلام عضلات غير مبررة. يستخدم بحذر مع مرضى الكلى."
},

{
  name: "نورفاسك",
  aliases: ["Norvasc", "نورفسك", "نورفاسكك", "نورڤاسك", "نورفسكك", "نووفاسك", "نورفااسك", "نورفاسسك", "نورفاسك", "نورفسك", "نوورفاسك", "نورففاسك", "نورفاسكك", "نورفاسسكك", "نوررفاسك", "نورفااسكك", "نووورفاسك", "نورفاسككك", "نوورففاسك", "نورفاسك", "نورڤسك", "نورفاسسسك", "نوورفسك", "نورففسك", "نورفاسكككك", "نووررفاسك", "نورفااسسك", "نوورفاسكك", "نورفاسك", "نورففاسكك"],
  scientificName: "Amlodipine",
  category: "حاصر قنوات الكالسيوم",
  price: "35-80 جنيه (علبة 30 قرص) - المحلي أرخص",
  uses: [
    "ارتفاع ضغط الدم",
    "الذبحة الصدرية المستقرة والذبحة الوعائية التشنجية",
    "مرض الشريان التاجي"
  ],
  sideEffects: [
    "تورم الكاحلين والقدمين (شائع)",
    "صداع",
    "دوخة",
    "احمرار الوجه",
    "خفقان",
    "إرهاق"
  ],
  contraindications: [
    "انخفاض شديد في ضغط الدم",
    "صدمة قلبية",
    "تضيق الأبهر الشديد"
  ],
  dosage: "5-10 مجم مرة واحدة يومياً",
  warnings: "⚠️ التورم شائع وليس خطير عادة. يعمل ببطء - قد يستغرق أسابيع للتأثير الكامل. آمن نسبياً. لا تتوقف فجأة."
},

{
  name: "كونكور",
  aliases: ["Concor", "كنكور", "كونكوور", "كونكر", "كنكوور", "كونككور", "كونكورر", "كنككور", "كوونكور", "كونكوورر", "كنكورر", "كونكور", "كنكور", "كووونكور", "كونكوور", "كونككوور", "كنكوورر", "كونكوررر", "كوونككور", "كونكوور", "كنكور", "كووننكور", "كونكورور", "كنكككور", "كونكوورور", "كوونكوور", "كنكوور", "كونكوور", "كونككورر", "كنكوورور"],
  scientificName: "Bisoprolol",
  category: "حاصر بيتا انتقائي",
  price: "45-110 جنيه (علبة 30 قرص) حسب التركيز",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب المزمن المستقر",
    "الذبحة الصدرية",
    "عدم انتظام ضربات القلب"
  ],
  sideEffects: [
    "تعب وإرهاق",
    "برودة الأطراف",
    "بطء القلب",
    "دوخة",
    "صداع",
    "اضطرابات هضمية"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "صدمة قلبية",
    "قصور القلب الحاد غير المعوض",
    "الربو الشديد"
  ],
  dosage: "2.5-10 مجم مرة واحدة يومياً صباحاً",
  warnings: "⚠️ لا تتوقف فجأة - قد يسبب نوبة قلبية. يخفي أعراض انخفاض السكر عند مرضى السكري. يستخدم بحذر مع الربو. قد يسبب تعب."
},

{
  name: "ليزينوبريل",
  aliases: ["Lisinopril", "لزينوبريل", "ليزىنوبريل", "ليزينوبرىل", "لزىنوبريل", "ليزينوبريىل", "لزينوبرىل", "ليزىنوبرىل", "ليزينوبريل", "لزينوبريل", "ليزىىنوبريل", "ليزينووبريل", "لززينوبريل", "ليزينوبرريل", "ليزىنوبريىل", "لزينوبريىل", "ليزينوبريلل", "لزىنوبرىل", "ليزىنووبريل", "ليززينوبريل", "ليزينوبررىل", "لزينووبريل", "ليزىىنوبرىل", "ليزينوببريل", "لززىنوبريل", "ليزينوبريىىل", "لزينوبرريل", "ليزىنوبريلل", "ليزينوبريل", "لزىىنوبريل"],
  scientificName: "Lisinopril",
  category: "مثبط الإنزيم المحول للأنجيوتنسين (ACE inhibitor)",
  price: "25-60 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "بعد احتشاء عضلة القلب",
    "اعتلال الكلية السكري"
  ],
  sideEffects: [
    "سعال جاف (شائع جداً)",
    "دوخة",
    "صداع",
    "ارتفاع البوتاسيوم",
    "انخفاض ضغط الدم",
    "إرهاق"
  ],
  contraindications: [
    "الحمل والرضاعة",
    "تاريخ وذمة وعائية",
    "تضيق الشريان الكلوي الثنائي"
  ],
  dosage: "5-40 مجم مرة واحدة يومياً",
  warnings: "⚠️⚠️ السعال الجاف شائع جداً - إذا أزعجك راجع الطبيب لتغيير الدواء. ممنوع في الحمل. راقب البوتاسيوم ووظائف الكلى. خطر الوذمة الوعائية (نادر)."
},

{
  name: "لوسارتان",
  aliases: ["Losartan", "لوسرتان", "لوسارطان", "لوسرطان", "لوسارتن", "لوسرتن", "لوسارطن", "لوسرطن", "لووسارتان", "لوسارتتان", "لوسرتتان", "لوسارطتان", "لووسرتان", "لوسارتاان", "لوسرطتان", "لوسارتان", "لوسرتان", "لووسارطان", "لوسارتنن", "لوسارتتتان", "لووسرطان", "لوسرتاان", "لوسارططان", "لوسارتتنن", "لووسارتتان", "لوسرتنن", "لوسارطاان", "لووسرتتان", "لوسارتانن", "لوسرططان"],
  scientificName: "Losartan",
  category: "مضاد مستقبلات الأنجيوتنسين II (ARB)",
  price: "30-75 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "اعتلال الكلية السكري في مرضى السكري النوع الثاني",
    "الوقاية من السكتة الدماغية في مرضى ارتفاع الضغط مع تضخم القلب"
  ],
  sideEffects: [
    "دوخة",
    "إرهاق",
    "ارتفاع البوتاسيوم",
    "انخفاض ضغط الدم",
    "إسهال"
  ],
  contraindications: [
    "الحمل والرضاعة",
    "تضيق الشريان الكلوي الثنائي",
    "فشل كبدي شديد"
  ],
  dosage: "50-100 مجم مرة واحدة يومياً",
  warnings: "⚠️ بديل جيد لمثبطات ACE لمن يعانون من السعال. ممنوع في الحمل. راقب البوتاسيوم ووظائف الكلى."
},

{
  name: "فالسارتان",
  aliases: ["Valsartan", "فلسارتان", "فالسرتان", "فلسرتان", "فالسارطان", "فلسارطان", "فالسرطان", "فلسرطان", "فالسارتن", "فلسارتن", "فالسرتن", "فلسرتن", "فاالسارتان", "فالسارتتان", "فللسارتان", "فالسارتان", "فلسارتان", "فالساررتان", "فالسارطتان", "فاالسرتان", "فالسرتتان", "فللسرتان", "فالسارتاان", "فلسارطتان", "فالساارتان", "فالسرطتان", "فاالسارطان", "فالسارتنن", "فللسارطان", "فالسرتاان"],
  scientificName: "Valsartan",
  category: "مضاد مستقبلات الأنجيوتنسين II (ARB)",
  price: "45-95 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "بعد احتشاء عضلة القلب"
  ],
  sideEffects: [
    "دوخة",
    "صداع",
    "إرهاق",
    "ارتفاع البوتاسيوم",
    "انخفاض ضغط الدم"
  ],
  contraindications: [
    "الحمل والرضاعة",
    "تضيق الشريان الكلوي الثنائي",
    "فشل كبدي وكلوي شديد"
  ],
  dosage: "80-320 مجم مرة واحدة يومياً",
  warnings: "⚠️ جزء من دواء Entresto المركب. ممنوع في الحمل. راقب البوتاسيوم ووظائف الكلى."
},

{
  name: "ميتوبرولول",
  aliases: ["Metoprolol", "ميتوبرلول", "ميتوبرولل", "ميتوبرلل", "ميتوبروولول", "ميتوبرووولول", "ميطوبرولول", "ميتوبرىلول", "ميتووبرولول", "ميتوبرولوول", "ميتوبررولول", "ميتوبرلوول", "ميطوبرلول", "ميتوبرىلل", "ميتووبرلول", "ميتوبرولولل", "ميتوبرولول", "ميتوبرلول", "ميتوبروولل", "ميططوبرولول", "ميتوببرولول", "ميتوبررلول", "ميتووبروولول", "ميتوبرىىلول", "ميطوبروولول", "ميتوبرلولل", "ميتوبروولوول", "ميتووبرلل", "ميتوبرىلوول", "ميططوبرلول"],
  scientificName: "Metoprolol",
  category: "حاصر بيتا انتقائي",
  price: "20-55 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "الذبحة الصدرية",
    "قصور القلب المزمن",
    "احتشاء عضلة القلب",
    "اضطراب نظم القلب فوق البطيني"
  ],
  sideEffects: [
    "تعب",
    "بطء القلب",
    "برودة الأطراف",
    "دوخة",
    "انخفاض ضغط الدم",
    "ضيق تنفس"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "صدمة قلبية",
    "قصور القلب الحاد غير المعوض",
    "الربو الشديد"
  ],
  dosage: "50-200 مجم يومياً (مقسمة أو بطيئة الإطلاق مرة واحدة)",
  warnings: "⚠️ لا تتوقف فجأة. يوجد شكل عادي وبطيء الإطلاق - انتبه للفرق. يخفي أعراض انخفاض السكر. يستخدم بحذر مع الربو."
},

{
  name: "كارفيديلول",
  aliases: ["Carvedilol", "كارفدلول", "كارفيدىلول", "كارفدىلول", "كارفيديلل", "كارفدلل", "كارفيدىلل", "كارفديلول", "كارفيديلوول", "كارفدىلل", "كاارفيديلول", "كارففيديلول", "كارفيدديلول", "كارفيديللول", "كارفديلل", "كارفيديلول", "كارفدلول", "كاررفيديلول", "كارفيدىىلول", "كارفدديلول", "كاارفدلول", "كارفيديلوول", "كارففديلول", "كارفيدىلوول", "كارفديىلول", "كاررفدلول", "كارفيديللل", "كارففيدىلول", "كارفديلوول", "كاارفيدىلول"],
  scientificName: "Carvedilol",
  category: "حاصر بيتا وألفا غير انتقائي",
  price: "30-70 جنيه (علبة 30 قرص)",
  uses: [
    "قصور القلب المزمن",
    "ارتفاع ضغط الدم",
    "بعد احتشاء عضلة القلب مع خلل وظيفة البطين الأيسر"
  ],
  sideEffects: [
    "دوخة شديدة (خاصة عند الوقوف)",
    "انخفاض ضغط الدم",
    "تعب",
    "بطء القلب",
    "برودة الأطراف",
    "وذمة"
  ],
  contraindications: [
    "قصور القلب الحاد غير المعوض",
    "بطء القلب الشديد",
    "صدمة قلبية",
    "فشل كبدي شديد"
  ],
  dosage: "يبدأ بجرعة منخفضة (3.125 مجم مرتين) وتزداد تدريجياً حتى 25-50 مجم مرتين يومياً",
  warnings: "⚠️⚠️ خذه مع الطعام لتقليل الدوخة. قف ببطء من الجلوس أو النوم. يحتاج زيادة تدريجية جداً. لا تتوقف فجأة."
},

{
  name: "أميودارون",
  aliases: ["Amiodarone", "اميودارون", "أميوdarرون", "اميودرون", "أميوداارون", "اميوداارون", "أمىودارون", "امىودارون", "أميودارونن", "اميودارونن", "أميوdarوون", "اميوdarوون", "أميىودارون", "امىىودارون", "أميووdarون", "اميووdarون", "أميوداروون", "اميوداروون", "أميوداارون", "اميوداارون", "أمىوdarرون", "امىوdarرون", "أميودارررون", "اميودارررون", "أميوداارونن", "اميوداارونن", "أمىودارونن", "امىودارونن", "أميوdarروون", "اميوdarروون"],
  scientificName: "Amiodarone",
  category: "مضاد اضطراب نظم القلب (Class III)",
  price: "50-120 جنيه (علبة 30 قرص)",
  uses: [
    "اضطرابات نظم القلب البطيني الخطيرة",
    "الرجفان الأذيني المقاوم للعلاج",
    "الرفرفة الأذينية",
    "تسرع القلب فوق البطيني"
  ],
  sideEffects: [
    "ترسبات في القرنية (عادة بدون أعراض)",
    "تصبغ الجلد (رمادي-أزرق)",
    "سمية الغدة الدرقية (فرط أو نقص نشاط)",
    "سمية رئوية (خطيرة)",
    "سمية كبدية",
    "حساسية ضوئية شديدة"
  ],
  contraindications: [
    "بطء القلب الشديد بدون منظم",
    "انسداد قلبي",
    "اضطرابات الغدة الدرقية غير المعالجة"
  ],
  dosage: "جرعة تحميل 200 مجم 3 مرات يومياً لأسبوع، ثم تخفيض تدريجي حتى 200 مجم يومياً للصيانة",
  warnings: "⚠️⚠️⚠️ دواء قوي جداً بآثار جانبية خطيرة. يحتاج مراقبة دورية للغدة الدرقية، الكبد، الرئة، العين. يتفاعل مع أدوية كثيرة جداً. استخدم واقي شمس قوي. البطء في الإطراح - يبقى في الجسم أسابيع بعد التوقف."
},

{
  name: "أتينولول",
  aliases: ["Atenolol", "اتينولول", "أتىنولول", "اتىنولول", "أتينوللول", "اتينوللول", "أتىنوللول", "اتىنوللول", "أتينولوول", "اتينولوول", "أتىنولوول", "اتىنولوول", "أتيينولول", "اتيينولول", "أتىىنولول", "اتىىنولول", "أتينووولول", "اتينووولول", "أتينوللوول", "اتينوللوول", "أتىنوللوول", "اتىنوللوول", "أتيينوللول", "اتيينوللول", "أتينولولل", "اتينولولل", "أتىىنوللول", "اتىىنوللول", "أتينوولول", "اتينوولول"],
  scientificName: "Atenolol",
  category: "حاصر بيتا انتقائي",
  price: "15-40 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "الذبحة الصدرية",
    "اضطراب نظم القلب",
    "بعد احتشاء عضلة القلب"
  ],
  sideEffects: [
    "تعب",
    "برودة الأطراف",
    "بطء القلب",
    "دوخة",
    "غثيان",
    "ضيق تنفس"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "صدمة قلبية",
    "قصور القلب غير المعوض",
    "الربو الشديد"
  ],
  dosage: "25-100 مجم مرة واحدة يومياً",
  warnings: "⚠️ لا يتأيض في الكبد - مفيد لمرضى الكبد. يُطرح عبر الكلى - يحتاج تعديل جرعة في الفشل الكلوي. لا تتوقف فجأة."
},

{
  name: "بروبرانولول",
  aliases: ["Propranolol", "بروبرنولول", "بروبرانلول", "بروبرنلول", "بروبراanولول", "بروبرانوولول", "بروبرنوولول", "بروبرانللول", "بروبرنللول", "بروبراanلول", "بروبرانوللول", "بروبرنوللول", "بروبرانولل", "بروبرنولل", "بروبراanوولول", "بروبرانووللول", "بروبرنووللول", "بروبرانلللول", "بروبرنلللول", "بروبراanللول", "بروبرانولوول", "بروبرنولوول", "بروبراanولل", "بروبرانوولل", "بروبرنوولل", "بروبراanلللول", "بروبرانووولول", "بروبرنووولول", "بروبرانللللول", "بروبرنللللول"],
  scientificName: "Propranolol",
  category: "حاصر بيتا غير انتقائي",
  price: "12-35 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "الذبحة الصدرية",
    "اضطراب نظم القلب",
    "الصداع النصفي (وقاية)",
    "رعاش أساسي",
    "قلق الأداء",
    "فرط نشاط الغدة الدرقية"
  ],
  sideEffects: [
    "تعب",
    "برودة الأطراف",
    "بطء القلب",
    "دوخة",
    "غثيان",
    "ضيق تنفس",
    "أحلام مزعجة"
  ],
  contraindications: [
    "الربو وانسداد الرئة المزمن",
    "بطء القلب الشديد",
    "صدمة قلبية",
    "قصور القلب غير المعوض"
  ],
  dosage: "40-320 مجم يومياً مقسمة على جرعات (أو بطيء الإطلاق مرة واحدة)",
  warnings: "⚠️ غير انتقائي - يؤثر على البيتا-2 أيضاً (خطر أكبر على الربو). يعبر حاجز الدماغ - قد يسبب أحلام مزعجة. لا تتوقف فجأة."
},

{
  name: "راميبريل",
  aliases: ["Ramipril", "راميبرل", "راميبرىل", "رامىبريل", "راميبريىل", "راميبرلل", "راميبرىىل", "رامىبرىل", "راميبريل", "راميبرل", "رااميبريل", "راميببريل", "راميبرريل", "رامىىبريل", "راميبريلل", "راميبرىلل", "رااميبرل", "راميببرىل", "رامىبريىل", "راميبرريىل", "رااميبرىل", "راميبريىىل", "راميببريل", "رامىىبرىل", "راميبرللل", "رااميبريىل", "راميببرلل", "رامىبرىىل", "راميبرريلل", "رااميبرىىل"],
  scientificName: "Ramipril",
  category: "مثبط الإنزيم المحول للأنجيوتنسين (ACE inhibitor)",
  price: "35-75 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "قصور القلب",
    "بعد احتشاء عضلة القلب",
    "الوقاية من السكتة الدماغية والنوبات القلبية",
    "اعتلال الكلية السكري"
  ],
  sideEffects: [
    "سعال جاف (شائع)",
    "دوخة",
    "صداع",
    "ارتفاع البوتاسيوم",
    "إرهاق",
    "طفح جلدي"
  ],
  contraindications: [
    "الحمل والرضاعة",
    "تاريخ وذمة وعائية",
    "تضيق الشريان الكلوي الثنائي"
  ],
  dosage: "2.5-10 مجم مرة واحدة يومياً",
  warnings: "⚠️⚠️ السعال الجاف شائع. ممنوع في الحمل. راقب البوتاسيوم ووظائف الكلى. خطر الوذمة الوعائية (نادر لكن خطير)."
},

{
  name: "تلميسارتان",
  aliases: ["Telmisartan", "تلميسرتان", "تلميسارطان", "تلمىسارتان", "تلميسرطان", "تلميساارتان", "تلمىسرتان", "تلميسارتتان", "تلميسرتتان", "تلمىسارطان", "تلميساررتان", "تلميسارطتان", "تلمىسرطان", "تلميسارتان", "تلميسرتان", "تللميسارتان", "تلميساارطان", "تلمىىسارتان", "تلميسرتاان", "تلميسارططان", "تللميسرتان", "تلميسارتاان", "تلمىسرتتان", "تلميساارتتان", "تللمىسارتان", "تلميسرططان", "تلميسارتنن", "تلمىسارتتان", "تلميساررطان", "تللميسارطان"],
  scientificName: "Telmisartan",
  category: "مضاد مستقبلات الأنجيوتنسين II (ARB)",
  price: "40-90 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "الوقاية من أمراض القلب والأوعية (نوبات قلبية، سكتات، وفيات)"
  ],
  sideEffects: [
    "دوخة",
    "إسهال",
    "آلام ظهر",
    "ارتفاع البوتاسيوم",
    "عدوى جهاز تنفسي علوي"
  ],
  contraindications: [
    "الحمل والرضاعة",
    "تضيق الشريان الكلوي الثنائي",
    "فشل كبدي شديد"
  ],
  dosage: "40-80 مجم مرة واحدة يومياً",
  warnings: "⚠️ له تأثير إضافي على تنشيط PPAR-gamma (قد يحسن حساسية الأنسولين). ممنوع في الحمل. راقب البوتاسيوم ووظائف الكلى."
},

{
  name: "هيدروكلوروثيازيد",
  aliases: ["Hydrochlorothiazide", "هيدروكلوروثيزيد", "هيدروكلوروثىزيد", "هىدروكلوروثيازيد", "هيدروكلوروثيازىد", "هيدروكلوروثىازيد", "هىدروكلوروثىزيد", "هيدروكلوروثيزىد", "هيدروكلوروثياازيد", "هىدروكلوروثيازىد", "هيدروكللوروثيازيد", "هيدروكلووروثيازيد", "هىدروكلوروثىازيد", "هيدروكلوروثياازيد", "هيدروكلوروثىزىد", "هىدروكلوروثيزىد", "هيدروكللوروثىزيد", "هيدروكلووروثىازيد", "هىىدروكلوروثيازيد", "هيدروكلوروثيازيىد", "هيدروكلوروثيزيىد", "هىدروكللوروثيازيد", "هيدروكلوروثىاازيد", "هيدروكلووروثيزيد", "هىدروكلوروثياازيد", "هيدروكلوروثيازىىد", "هيدروكللوروثيازىد", "هىدروكلووروثىزيد", "هيدروكلوروثىىزيد", "هىىدروكلوروثىازيد"],
  scientificName: "Hydrochlorothiazide (HCTZ)",
  category: "مدر بول ثيازيدي",
  price: "8-25 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم (غالباً مع أدوية أخرى)",
    "وذمة (احتباس السوائل)",
    "حصوات الكالسيوم الكلوية (وقاية)"
  ],
  sideEffects: [
    "انخفاض البوتاسيوم",
    "ارتفاع حمض البوليك (نقرس)",
    "ارتفاع سكر الدم",
    "زيادة كوليسترول",
    "دوخة",
    "كثرة التبول",
    "حساسية ضوئية"
  ],
  contraindications: [
    "فشل كلوي شديد",
    "انخفاض شديد في البوتاسيوم أو الصوديوم",
    "حساسية من السلفا"
  ],
  dosage: "12.5-25 مجم مرة واحدة يومياً صباحاً",
  warnings: "⚠️ راقب البوتاسيوم والصوديوم والسكر وحمض البوليك. خذه صباحاً لتجنب التبول الليلي. قد يحتاج مكمل بوتاسيوم. استخدم واقي شمس."
},

{
  name: "سبيرونولاكتون",
  aliases: ["Spironolactone", "سبيرونولكتون", "سبيرونولاكطون", "سبىرونولاكتون", "سبيرونولكطون", "سبيرونولاكتوون", "سبىرونولكتون", "سبيرونوللاكتون", "سبيرونولاكنون", "سبىرونولاكطون", "سبيرونولكتوون", "سبيرونولاكططون", "سبىرونولكطون", "سبيرونوللكتون", "سبيرونولاكتون", "سبيرونولكتون", "سببيرونولاكتون", "سبيروونولاكتون", "سبىىرونولاكتون", "سبيرونوولاكتون", "سبيرونولااكتون", "سببىرونولكتون", "سبيرونولاكتتون", "سبيروونولكطون", "سبىرونوللاكتون", "سبيرونولكتتون", "سببيرونولاكطون", "سبيروونولاكتوون", "سبىىرونولكتون", "سبيرونوولكتون"],
  scientificName: "Spironolactone",
  category: "مدر بول موفر للبوتاسيوم ومضاد ألدوستيرون",
  price: "20-50 جنيه (علبة 30 قرص)",
  uses: [
    "قصور القلب (مع أدوية أخرى)",
    "ارتفاع ضغط الدم المقاوم",
    "فرط الألدوستيرونية",
    "وذمة (احتباس سوائل)",
    "تليف الكبد مع استسقاء",
    "حب الشباب وكثرة الشعر عند النساء (استخدام غير رسمي)"
  ],
  sideEffects: [
    "ارتفاع البوتاسيوم (خطير)",
    "تثدي عند الرجال",
    "اضطرابات طمث عند النساء",
    "غثيان",
    "دوخة",
    "صداع"
  ],
  contraindications: [
    "ارتفاع البوتاسيوم",
    "فشل كلوي شديد",
    "مرض أديسون",
    "الحمل"
  ],
  dosage: "25-200 مجم يومياً مقسمة على جرعات",
  warnings: "⚠️⚠️ راقب البوتاسيوم بانتظام - خطر الارتفاع الشديد. تجنب الأطعمة الغنية بالبوتاسيوم. لا تستخدم مع مكملات البوتاسيوم أو ACE inhibitors/ARBs بدون إشراف دقيق."
},

{
  name: "فيوروسيمايد",
  aliases: ["Furosemide", "فيوروسمايد", "فيوروسىمايد", "فىوروسيمايد", "فيوروسيماىد", "فيوروسماىد", "فىوروسمايد", "فيوروسىماىد", "فيوروسيميد", "فىوروسىمايد", "فيوروسيمااىد", "فيووروسيمايد", "فيوروسسيمايد", "فىىوروسيمايد", "فيوروسيمايىد", "فيوروسميىد", "فىوروسيماىد", "فيووروسمايد", "فيوروسىىمايد", "فىوروسىماىد", "فيوروسيمايد", "فيوروسمايد", "فيووروسىمايد", "فيوروسسماىد", "فىىوروسمايد", "فيوروسيماايىد", "فيوروسيميىد", "فىوروسيمااىد", "فيووروسيماىد", "فيوروسىميد"],
  scientificName: "Furosemide (Lasix)",
  category: "مدر بول عروي قوي",
  price: "5-15 جنيه (علبة 30 قرص) - رخيص جداً",
  uses: [
    "وذمة (احتباس سوائل) في قصور القلب",
    "وذمة رئوية حادة",
    "فشل كلوي مع احتباس سوائل",
    "تليف الكبد مع استسقاء",
    "ارتفاع ضغط الدم (نادراً)"
  ],
  sideEffects: [
    "انخفاض البوتاسيوم (شائع)",
    "انخفاض الصوديوم",
    "انخفاض المغنيسيوم",
    "جفاف",
    "انخفاض ضغط الدم",
    "ارتفاع حمض البوليك (نقرس)",
    "فقدان سمع (جرعات عالية)"
  ],
  contraindications: [
    "فشل كلوي مع انقطاع بول",
    "جفاف شديد",
    "انخفاض شديد في البوتاسيوم أو الصوديوم"
  ],
  dosage: "20-80 مجم صباحاً (حتى 600 مجم يومياً في حالات شديدة)",
  warnings: "⚠️⚠️ راقب البوتاسيوم والصوديوم والكلى. قد يحتاج مكمل بوتاسيوم. خذه صباحاً لتجنب التبول الليلي. قوي جداً - ابدأ بجرعة منخفضة."
},

{
  name: "ديلتيازيم",
  aliases: ["Diltiazem", "ديلتيزيم", "ديلتىزيم", "دلتيازيم", "ديلتيازىم", "ديلتيزىم", "دلتىزيم", "ديلتىازيم", "ديلتياازيم", "دلتيازىم", "ديلتىىزيم", "ديلتيزيىم", "دلتىازيم", "ديلتياززيم", "ديلتيازيم", "ديلتيزيم", "ديللتيازيم", "ديلتياازىم", "دللتيازيم", "ديلتىزىم", "ديلتيزيىىم", "دلتيزىم", "ديلتىاازيم", "ديللتىزيم", "ديلتياازيىم", "دللتىزيم", "ديلتىىازيم", "ديلتيززيم", "دلتياازيم", "ديلتياziم"],
  scientificName: "Diltiazem",
  category: "حاصر قنوات الكالسيوم (غير ديهيدروبيريدين)",
  price: "30-70 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "الذبحة الصدرية",
    "تسرع القلب فوق البطيني",
    "الرجفان الأذيني (التحكم في معدل القلب)"
  ],
  sideEffects: [
    "دوخة",
    "صداع",
    "تورم الكاحلين",
    "بطء القلب",
    "إمساك",
    "إرهاق"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "انسداد قلبي",
    "قصور القلب الحاد",
    "انخفاض شديد في ضغط الدم"
  ],
  dosage: "60-360 مجم يومياً (عادي أو بطيء الإطلاق)",
  warnings: "⚠️ يخفض ضغط الدم ومعدل القلب. لا تستخدم مع حاصرات بيتا بدون إشراف دقيق. يتفاعل مع أدوية كثيرة."
},

{
  name: "فيراباميل",
  aliases: ["Verapamil", "فيرابميل", "فيرابامىل", "فىراباميل", "فيرابامييل", "فيرابمىل", "فىرابميل", "فيراباmىل", "فيراباميل", "فيرابميل", "فيراابباميل", "فيرراباميل", "فىىراباميل", "فيراباميىل", "فيرابمييل", "فىراباמىل", "فيراباامىل", "فيررابميل", "فىرابامىل", "فيراباميلل", "فيراابميل", "فيرابميىل", "فىىرابميل", "فيراباmيىل", "فيرراباמىل", "فىراباميىل", "فيراباامييل", "فيررابامىل", "فىرابمىل", "فيراباميىىل"],
  scientificName: "Verapamil",
  category: "حاصر قنوات الكالسيوم (غير ديهيدروبيريدين)",
  price: "25-60 جنيه (علبة 30 قرص)",
  uses: [
    "ارتفاع ضغط الدم",
    "الذبحة الصدرية",
    "تسرع القلب فوق البطيني",
    "الرجفان الأذيني (التحكم في معدل القلب)",
    "الصداع النصفي (وقاية)"
  ],
  sideEffects: [
    "إمساك (شائع جداً)",
    "دوخة",
    "صداع",
    "بطء القلب",
    "تورم الكاحلين",
    "غثيان"
  ],
  contraindications: [
    "بطء القلب الشديد",
    "انسداد قلبي",
    "قصور القلب",
    "انخفاض شديد في ضغط الدم",
    "متلازمة WPW مع رجفان أذيني"
  ],
  dosage: "120-480 مجم يومياً مقسمة (أو بطيء الإطلاق مرة واحدة)",
  warnings: "⚠️⚠️ الإمساك شائع جداً - أكثر الأعراض الجانبية. لا تستخدم مع حاصرات بيتا. يتفاعل مع أدوية كثيرة جداً. خطر على قصور القلب."
},

{
  name: "برادكسا",
  aliases: ["Pradaxa", "برداكسا", "برادكسه", "برداكسه", "برادكssa", "برادكساا", "برداكساا", "برادكسسا", "برداكسسا", "برادككسا", "برداككسا", "براداكسا", "برداداكسا", "برادكسا", "برداكسا", "بررادكسا", "براادكسا", "بررداكسا", "برادككساا", "براداكسه", "بردداكسا", "برادكسساا", "بررادكسه", "براادكساا", "بررداكسه", "برادكسsا", "بردادكسا", "براداككسا", "بررادكساا", "براادككسا"],
  scientificName: "Dabigatran",
  category: "مضاد تخثر (مثبط الثرومبين المباشر)",
  price: "1100-1600 جنيه (علبة 60 كبسولة)",
  uses: [
    "الوقاية من السكتة الدماغية في الرجفان الأذيني",
    "علاج والوقاية من الجلطات الوريدية العميقة والانسداد الرئوي",
    "الوقاية بعد جراحة استبدال الورك أو الركبة"
  ],
  sideEffects: [
    "نزيف",
    "اضطرابات هضمية (حرقة، غثيان)",
    "آلام بطن",
    "إسهال",
    "أنيميا"
  ],
  contraindications: [
    "نزيف نشط",
    "فشل كلوي شديد",
    "صمامات قلب صناعية",
    "الحمل والرضاعة"
  ],
  dosage: "150 مجم مرتين يومياً (110 مجم للمسنين أو فشل كلوي متوسط)",
  warnings: "⚠️⚠️⚠️ لا تفتح الكبسولة - تؤخذ كاملة. احفظه في العبوة الأصلية (حساس للرطوبة). له ترياق محدد (idarucizumab). مراقبة وظائف الكلى. خطر النزيف."
},

{
  name: "وارفارين",
  aliases: ["Warfarin", "ورفارين", "وارفرين", "ورفرين", "وارفاريين", "وارفارىن", "ورفاريين", "وارفرىن", "ورفارىن", "وارفاارين", "ورفاارين", "وارفرريين", "ورفاارين", "وارفاريىن", "ووارفارين", "ورفرريين", "وارفرىىن", "ورفارىىن", "وارفاارىن", "ووارفرين", "ورفارييىن", "وارففارين", "ورفاارىن", "وارفرىيىن", "ووررفارين", "ورفرىىىن", "وارفاريننن", "ورفاارىىن", "وارففرين", "ووارفاريين"],
  scientificName: "Warfarin",
  category: "مضاد تخثر (مضاد فيتامين K)",
  price: "10-30 جنيه (علبة 30 قرص) - رخيص جداً",
  uses: [
    "الوقاية والعلاج من الجلطات الوريدية والشريانية",
    "الرجفان الأذيني",
    "صمامات القلب الصناعية",
    "بعد احتشاء عضلة القلب",
    "الانسداد الرئوي"
  ],
  sideEffects: [
    "نزيف (خطير)",
    "كdمات",
    "نزيف لثة وأنف",
    "طفح جلدي",
    "نادراً: نخر الجلد"
  ],
  contraindications: [
    "الحمل (خاصة الثلث الأول)",
    "نزيف نشط",
    "جراحة حديثة في الدماغ أو العين أو الحبل الشوكي"
  ],
  dosage: "جرعة فردية حسب INR المستهدف (عادة 2-5 مجم يومياً)",
  warnings: "⚠️⚠️⚠️ يحتاج مراقبة دقيقة ومنتظمة لـ INR. تفاعلات هائلة مع الطعام (فيتامين K) والأدوية. INR المستهدف يختلف حسب الحالة. الحمل ممنوع. صعب التحكم فيه - الأدوية الجديدة أسهل لكن أغلى."
},

// ==================== أدوية السكري ====================

{
  name: "جارديانس",
  aliases: ["Jardiance", "جارديانسس", "جاردىانس", "جارديnس", "جاردياانس", "جارديانسسس", "جاردىىانس", "جارديانss", "جارديانس", "جارديانس", "جاارديانس", "جاررديانس", "جاردىانسس", "جاردياانس", "جاردياننس", "جااردىانس", "جاررديانسس", "جاردىىانسس", "جارديانسس", "جاردياانسس", "جااردياانس", "جارررديانس", "جاردىاننس", "جارديانssس", "جااردىىانس", "جاردىاانس", "جاردياننس", "جااررديانس", "جاردياannس", "جاررديىانس"],
  scientificName: "Empagliflozin",
  category: "مثبط SGLT2",
  price: "450-650 جنيه (علبة 30 قرص)",
  uses: [
    "داء السكري النوع الثاني",
    "تقليل خطر الوفاة القلبية الوعائية",
    "قصور القلب (حتى بدون سكري)",
    "أمراض الكلى المزمنة"
  ],
  sideEffects: [
    "عدوى فطرية تناسلية (شائعة)",
    "عدوى مجرى بولي",
    "كثرة التبول",
    "جفaف",
    "انخفاض ضغط الدم",
    "نادراً: حماض كيتوني سكري",
    "نادراً جداً: غرغرينا في الأعضاء التناسلية (Fournier)"
  ],
  contraindications: [
    "داء السكري النوع الأول",
    "فشل كلوي شديد",
    "حماض كيتوني سكري"
  ],
  dosage: "10-25 مجم مرة واحدة يومياً صباحاً",
  warnings: "⚠️⚠️ النظافة الشخصية الجيدة تقلل العدوى الفطرية. اشرب ماء كافي. راقب وظائف الكلى. قد يسبب حماض كيتوني حتى مع سكر طبيعي. توقف قبل الجراحة الكبرى."
},

{
  name: "فورxيجا",
  aliases: ["Forxiga", "فوركسيجا", "فورxىجا", "فوركسىجا", "فورxيגا", "فوركسيגا", "فوررxيجا", "فووركسيجا", "فورxىىجا", "فوركسىىجا", "فورxيجاا", "فوركسيجاا", "فورركسיجا", "فووrrxيجا", "فورxىجاا", "فوركسيגاא", "فورxيجا", "فوركسيجا", "فوررxىجا", "فووركسىجا", "فورxيיجاא", "فوركسيجااا", "فورركسيجا", "فووrrكسיجا", "فورxىىىجا", "فوركسىגاا", "فورxיجاا", "فوررxيגاא", "فووركسיجاא", "فوركسىىجاא"],
  scientificName: "Dapagliflozin",
  category: "مثبط SGLT2",
  price: "420-600 جنيه (علبة 30 قرص)",
  uses: [
    "داء السكري النوع الثاني",
    "قصور القلب",
    "أمراض الكلى المزمنة"
  ],
  sideEffects: [
    "عدوى فطرية تناسلية",
    "عدوى مجرى بولي",
    "كثرة التبول",
    "جفاف",
    "انخفاض ضغط الدم",
    "نادراً: حماض كيتوني سكري"
  ],
  contraindications: [
    "داء السكري النوع الأول",
    "فشل كلوي شديد",
    "حماض كيتوني سكري"
  ],
  dosage: "5-10 مجم מرة واحدة يومياً صباحاً",
  warnings: "⚠️⚠️ مشابه جداً لـ Jardiance. النظافة الشخصية مهمة. اשرب ماء كافي. راقب وظائف الكلى. قد يسבب حماض كיتوني."
},
{
  name: "ميلرينون",
  aliases: ["Milrinone", "ميلرينون", "ميلرىنون", "مىلرينون", "ميلرينوون", "ميلرريون", "ميللرينون", "ميلرىىنون", "مىلرىنون", "ميلرينونن", "ميلررينون", "ميللرىنون", "مىىلرينون", "ميلرينوونن", "ميلرريىنون", "ميللرينوون", "مىلرينوون", "ميلرىنوون", "ميلررىنون", "ميللرريون", "مىىلرىنون", "ميلرينونnn", "ميلررينوون", "ميللرىىنون", "مىلررينون", "ميلرينوووان", "ميلرريىىنون", "ميللرينونن", "مىىلرينوون", "ميلررىىنون"],
  scientificName: "Milrinone",
  category: "منشط للقلب (Inotrope)",
  price: "غير متاح (مستشفيات فقط)",
  uses: [
    "قصور القلب الحاد (حقن وريدي)",
    "صدمة قلبية"
  ],
  sideEffects: [
    "اضطراب نظم القلب",
    "انخفاض ضغط الدم",
    "صداع"
  ],
  contraindications: [
    "انسداد الصمام الأبهري الشديد"
  ],
  dosage: "محلول وريدي مستمر في العناية المركزة فقط",
  warnings: "⚠️⚠️⚠️ للعناية المركزة فقط. يقوي انقباض القلب ويوسع الأوعية. يحتاج مراقبة دقيقة."
},

{
  name: "دوبوتامين",
  aliases: ["Dobutamine", "دوبوتامين", "دوبوتامىن", "دوبوتمين", "دوبوتاامين", "دووبوتامين", "دوبووتامين", "دوبوتامىىن", "دوبوتميين", "دوبوتاامىن", "دووبوتامىن", "دوبووتامىن", "دوبوتامينن", "دوبوتااميين", "دووبوتاامين", "دوبووتاامين", "دوبوتامىنن", "دوبوتمىن", "دوبوتااامين", "دووبووتامين", "دوبوتامىىىن", "دوبوتميىن", "دووبوتامىىن", "دوبووتااמين", "دوبوتامينnn", "دوبوتاامينن", "دووبوتميين", "دوبووتامىىن", "دوبوتاااامين", "دووبووتامىن"],
  scientificName: "Dobutamine",
  category: "منشط للقلب (حقن)",
  price: "غير متاح (مستشفيات فقط)",
  uses: [
    "قصور القلب الحاد (حقن وريدي)",
    "صدمة قلبية",
    "بعد جراحة القلب"
  ],
  sideEffects: [
    "تسرع القلب",
    "خفقان",
    "اضطراب نظم القلب",
    "ارتفاع ضغط الدم"
  ],
  contraindications: [
    "انسداد مخرج البطين الأيسر"
  ],
  dosage: "محلول وريدي مستمر في العناية المركزة فقط (2.5-20 mcg/kg/min)",
  warnings: "⚠️⚠️⚠️ للعناية المركزة فقط. يقوي انقباض القلب. يحتاج مراقبة دقيقة للقلب والضغط."
},

{
  name: "دوبامين",
  aliases: ["Dopamine", "دوبامين", "دوبامىن", "دووبامين", "دوباامين", "دوبميين", "دوبامىىن", "دووبامىن", "دوباامىن", "دوبامينن", "دوبميىن", "دووباامين", "دوبامىنن", "دوباميىن", "دووبامىىن", "دوباامينن", "دوبمين", "دووباامىن", "دوبامىىىن", "دوباميىىن", "دووبميين", "دوبااامين", "دوبامينnn", "دووبامينن", "دوباامىىن", "دوبمىن", "دووباامىىن", "دوبااميىن", "دووبااميىن", "دوبامىننن", "دووباميىن"],
  scientificName: "Dopamine",
  category: "منشط للقلب والأوعية (حقن)",
  price: "غير متاح (مستشفيات فقط)",
  uses: [
    "صدمة قلبية (حقن وريدي)",
    "انخفاض ضغط الدم الشديد",
    "قصور القلب الحاد"
  ],
  sideEffects: [
    "تسرع القلب",
    "اضطراب نظم القلب",
    "غثيان وقيء",
    "نقص تروية الأطراف"
  ],
  contraindications: [
    "ورم الغدة الكظرية (فيوكروموسيتوما)",
    "اضطراب نظم القلب"
  ],
  dosage: "محلول وريدي مستمر في العناية المركزة فقط (2-20 mcg/kg/min)",
  warnings: "⚠️⚠️⚠️ للعناية المركزة فقط. تأثيره يعتمد على الجرعة: جرعة منخفضة (توسيع كلوي)، متوسطة (تقوية القلب)، عالية (تضييق أوعية). يحتاج مراقبة دقيقة."
},

{
  name: "أدينوزين",
  aliases: ["Adenosine", "ادينوزين", "أدىنوزين", "ادىنوزين", "أدينوزىن", "ادينوزىن", "أدينووزين", "ادينووزين", "أديينوزين", "اديينوزين", "أدىىنوزين", "ادىىنوزين", "أدينوزيين", "ادينوزيين", "أدينوزىىن", "ادينوزىىن", "أدينووزىن", "ادينووزىن", "أدييوزين", "اديينوزىن", "أدىنووزين", "ادىنووزين", "أديينووزين", "اديينووزين", "أدينوززين", "ادينوززين", "أدىىنوزىن", "ادىىنوزىن", "أدينووززين", "اديينوززين"],
  scientificName: "Adenosine 6mg",
  category: "دواء تسرع القلب (حقن طوارئ)",
  price: "غير متاح (مستشفيات فقط)",
  uses: [
    "تسرع القلب فوق البطيني الانتيابي (PSVT) - حقن وريدي سريع",
    "تشخيص بعض اضطرابات نظم القلب"
  ],
  sideEffects: [
    "توقف القلب لثوانٍ (طبيعي)",
    "ضيق تنفس شديد",
    "احمرار الوجه",
    "ألم صدر",
    "دوخة شديدة"
  ],
  contraindications: [
    "انسداد القلب",
    "الربو الشديد",
    "متلازمة الجيب المريض"
  ],
  dosage: "حقن وريدي سريع جداً (6mg ثم 12mg إذا لزم) - طوارئ فقط",
  warnings: "⚠️⚠️⚠️ للطوارئ فقط في المستشفى. يوقف القلب لثوانٍ لإعادة ضبط النظم. مخيف جداً للمريض لكنه آمن. يحتاج حقن سريع جداً يتبعه محلول ملح."
},
  {
    name: "بيرفكتيل",
    aliases: ["Perfectil", "برفكتيل", "برفيكتيل", "فيتامين الشعر", "بيرفكتيل أوريجينال", "ببرفكتيل", "ببررفكتيل", "ببرررفكتيل", "بييرفكتيل", "بييييرفكتيل", "بييييييرفكتيل", "بيرففكتيل", "بيرفففكتيل", "بيرففففكتيل", "بيرفككتيل", "بيرفكككتيل", "بيرفككككتيل", "بيرفكتتيل", "بيرفكتتتيل", "بيرفكتتتتيل", "بيرفكتييل", "بيرفكتيييل", "بيرفكتيييييل", "بيرفكتيلل", "بيرفكتيللل", "بيرفكتيلللل", "برفكتل", "بيرفتيل", "بيركتيل", "بيرفكتيلل"],
    scientificName: "Multivitamins + Minerals (Hair, Skin & Nails)",
    category: "مكمل غذائي للتجميل",
    price: "450-600 جنيه (المستورد) / يتوفر بدائل مصرية",
    uses: [
      "تساقط الشعر وضعفه",
      "تكسر الأظافر",
      "نضارة البشرة الباهتة",
      "تعويض نقص الفيتامينات الأساسية"
    ],
    sideEffects: [
      "غثيان (إذا أخذ على معدة فارغة)",
      "تغير لون البول (طبيعي بسبب الفيتامينات)",
      "إمساك بسيط"
    ],
    contraindications: [
      "الحساسية لأي من المكونات",
      "مرضى زيادة الحديد في الدم"
    ],
    dosage: "كبسولة واحدة يومياً بعد الوجبة الرئيسية (الغداء) مع كوب ماء كبير.",
    warnings: "⚠️ نصيحة: لازم يتأخذ على معدة مليانة جداً لأنه تقيل وممكن يسبب وجع في المعدة أو غثيان لو أخذته على الريق."
  },
 {
    name: "بوليدرم",
    aliases: ["Polyderm", "بولىدرم", "كريم الالتهاب", "بوليديرم", "بووليدرم", "بوووليدرم", "بووووليدرم", "بولليدرم", "بوللليدرم", "بولللليدرم", "بولييدرم", "بوليييدرم", "بولييييدرم", "بوليدررم", "بوليدرررم", "بوليدررررم", "بوليدرمم", "بوليدرممم", "بوليدرمممم", "بوليرم", "بوليدم", "بولدرم", "بوليديرم", "بولي درم", "بولى درم", "بولي درم", "بولي درم", "بولي درم", "بولي درم", "بولي درم"],
    scientificName: "Clotrimazole + Beclomethasone + Neomycin",
    category: "كريم مضاد للفطريات والبكتيريا والالتهاب",
    price: "15-25 جنيه",
    uses: [
      "الالتهابات الجلدية المصحوبة بحكة",
      "التسلخات الشديدة",
      "إكزيما الجلد",
      "التهابات ما بين الأصابع"
    ],
    sideEffects: [
      "ترقق الجلد (عند الاستخدام الطويل)",
      "ظهور خطوط بيضاء"
    ],
    contraindications: [
      "حب الشباب",
      "العدوى الفيروسية (مثل الهربس)",
      "قرح الجلد المفتوحة"
    ],
    dosage: "دهان طبقة رقيقة مرتين يومياً.",
    warnings: "⚠️ يحتوي على كورتيزون، لا يستخدم لفترات طويلة أو على مساحات كبيرة من جسم الأطفال."
  },
  {
    name: "سيلجون",
    aliases: ["Selgon", "سيلجون لبوس", "سيلجون نقط", "دواء الكحة الناشفة", "سييلجون", "سيييلجون", "سييييلجون", "سيللجون", "سيلللجون", "سيللللجون", "سيلجوون", "سيلجووون", "سيلجوووون", "سيلجونن", "سيلجوننن", "سيلجونننن", "سلجون", "سيجون", "سيلجون نقط", "سيلجون لبوس", "سيلجون اقراص", "سيلجونن", "سيلجوون", "سيلجون", "سيلجون", "سيلجون", "سيلجون", "سيلجون", "سيلجون", "سيلجون"],
    scientificName: "Pipazethate",
    category: "مهدئ للسعال (كحة ناشفة)",
    price: "15-30 جنيه",
    uses: [
      "الكحة الناشفة (بدون بلغم)",
      "سعال المدخنين",
      "تهيج الصدر"
    ],
    sideEffects: [
      "نعاس بسيط",
      "غثيان",
      "أرق في حالات نادرة"
    ],
    contraindications: [
      "الحساسية للمادة الفعالة",
      "الأطفال أقل من سنتين (للنقط)"
    ],
    dosage: "أقراص للكبار، نقط أو لبوس للأطفال حسب العمر.",
    warnings: "✅ مفعوله سريع جداً في تهدئة " + "الشرقة" + " والكحة اللي بتمنع النوم."
  },
  
  {

    name: "كونجستال",
    aliases: ["Congestal", "كونجيستال", "كنجستال", "كونچستال", "كونجستأل", "كونجستإل", "كونجصتال", "كوونجستال", "كووونجستال", "كوووونجستال", "كوننجستال", "كونننجستال", "كوننننجستال", "كونججستال", "كونجججستال", "كونججججستال", "كونجسستال", "كونجسسستال", "كونجسسسستال", "كونجستتال", "كونجستتتال", "كونجستتتتال", "كوجستال", "كونستال", "كونجستالل", "كونجسستال", "كونجستالل", "كونجستتال", "كونجستتال", "كوونجستال"],
    scientificName: "Paracetamol + Chlorpheniramine + Pseudoephedrine",
    category: "علاج البرد والإنفلونزا",
    price: "20 جنيه",
    uses: [
      "أعراض البرد والإنفلونزا",
      "احتقان الأنف",
      "الرشح والعطس",
      "الصداع المصاحب للبرد",
      "خفض الحرارة",
      "الرشح التحسسي"
    ],
    sideEffects: [
      "النعاس والدوخة (شائع)",
      "جفاف الفم والحلق",
      "صعوبة في التبول",
      "الأرق أو العصبية (في بعض الحالات)",
      "فقدان الشهية",
      "اضطراب المعدة"
    ],
    contraindications: [
      "ارتفاع ضغط الدم الشديد",
      "أمراض القلب والشرايين",
      "تضخم البروستاتا",
      "الحمل والرضاعة",
      "الجلوكوما (المياه الزرقاء)",
      "فرط نشاط الغدة الدرقية"
    ],
    dosage: "قرص واحد كل 6-8 ساعات (بحد أقصى 4 أقراص يومياً)",
    warnings: "⚠️ يسبب النعاس الشديد - لا تقود السيارة أو تشغل آلات خطرة. ممنوع مع الكحول. لا تستخدمه أكثر من 5-7 أيام بدون استشارة طبيب."
  },
  {

    name: "أوجمنتين",
    aliases: ["Augmentin", "اوجمنتين", "اجمنتين", "أجمنتين", "أوجمنتىن", "أووجمنتين", "أوووجمنتين", "أووووجمنتين", "أوججمنتين", "أوجججمنتين", "أوججججمنتين", "أوجممنتين", "أوجمممنتين", "أوجممممنتين", "أوجمننتين", "أوجمنننتين", "أوجمننننتين", "أوجمنتتين", "أوجمنتتتين", "أوجمنتتتتين", "أومنتين", "أوجنتين", "أوججمنتين", "أوجممنتين", "أوججمنتين", "أوجمنتيين", "أوجمنتينن", "أوجممنتين", "أوجممنتين", "أوججمنتين"],
    scientificName: "Amoxicillin + Clavulanic Acid",
    category: "مضاد حيوي (بنسلين)",
    price: "70 جنيه",
    uses: [
      "التهابات الجهاز التنفسي (التهاب الشعب، الالتهاب الرئوي)",
      "التهاب اللوزتين والحلق البكتيري",
      "التهاب الأذن الوسطى",
      "التهاب الجيوب الأنفية",
      "التهابات الجلد والأنسجة",
      "التهابات المسالك البولية",
      "خراج الأسنان"
    ],
    sideEffects: [
      "إسهال (شائع جداً)",
      "غثيان وقيء",
      "طفح جلدي",
      "اضطرابات المعدة",
      "عدوى فطرية (فطريات الفم أو المهبل)",
      "نادراً: يرقان (اصفرار الجلد)"
    ],
    contraindications: [
      "حساسية من البنسلين أو السيفالوسبورينات",
      "مشاكل الكبد السابقة من هذا الدواء",
      "اليرقان الركودي",
      "الحمل (الأشهر الأولى - استشر الطبيب)"
    ],
    dosage: "حسب العدوى والعمر: 375-625mg كل 8 ساعات، أو 1000mg كل 12 ساعة",
    warnings: "⚠️⚠️ مضاد حيوي قوي - يجب إكمال الكورس كاملاً (5-7 أيام عادة) حتى لو تحسنت الأعراض. لا يؤخذ بدون وصفة طبية. قد يسبب إسهال شديد."
  },
  {

    name: "بروفين",
    aliases: ["Brufen", "Ibuprofen", "ايبوبروفين", "بروفن", "برفين", "بروفىن", "برروفين", "بررروفين", "برررروفين", "برووفين", "بروووفين", "برووووفين", "بروففين", "بروفففين", "بروففففين", "بروفيين", "بروفييين", "بروفيييين", "بروفينن", "بروفيننن", "بروفينننن", "بوفين", "بروين", "بروففين", "بروفينن", "بروففين", "بروفيين", "برروفين", "بروفينن", "برووفين"],
    scientificName: "Ibuprofen 400mg",
    category: "مسكن ومضاد التهاب",
    price: "18 جنيه",
    uses: [
      "تسكين الآلام المتوسطة والشديدة",
      "خفض الحرارة",
      "التهاب المفاصل (الروماتويد والخشونة)",
      "آلام الدورة الشهرية",
      "الصداع والصداع النصفي",
      "آلام الظهر والعضلات",
      "التهاب الأوتار"
    ],
    sideEffects: [
      "حرقة المعدة وعسر الهضم",
      "غثيان وألم بالمعدة",
      "دوخة ودوار",
      "طفح جلدي",
      "نادراً: قرحة المعدة أو نزيف",
      "ارتفاع ضغط الدم"
    ],
    contraindications: [
      "قرحة المعدة أو الاثني عشر النشطة",
      "الربو الحاد أو حساسية الأسبرين",
      "الحمل (خاصة الثلث الأخير)",
      "أمراض الكلى أو الكبد الشديدة",
      "قصور القلب الشديد",
      "تاريخ نزيف المعدة"
    ],
    dosage: "200-400mg كل 6-8 ساعات بعد الأكل (بحد أقصى 1200mg يومياً بدون وصفة)",
    warnings: "⚠️ يجب تناوله بعد الطعام أو مع الحليب لتجنب مشاكل المعدة. لا تستخدمه أكثر من 10 أيام للألم أو 3 أيام للحرارة بدون استشارة طبيب. قد يزيد خطر الجلطات القلبية والسكتة الدماغية."
  },
  {

    name: "أنتينال",
    aliases: ["Antinal", "انتينال", "انتنال", "أنتنال", "أنتينأل", "أنتينإل", "أنتىنال", "أننتينال", "أنننتينال", "أننننتينال", "أنتتينال", "أنتتتينال", "أنتتتتينال", "أنتيينال", "أنتييينال", "أنتيييينال", "أنتيننال", "أنتينننال", "أنتيننننال", "أنتيناال", "أنتينااال", "أنتيناااال", "أتينال", "أنينال", "أنتينالل", "أنتيينال", "أنتينالل", "أنتيناال", "أنتيناال", "أنتيننال"],
    scientificName: "Nifuroxazide 200mg",
    category: "مطهر معوي",
    price: "26 جنيه",
    uses: [
      "الإسهال الحاد البكتيري",
      "النزلات المعوية",
      "التهاب الأمعاء البكتيري",
      "التسمم الغذائي الخفيف إلى المتوسط",
      "إسهال المسافرين"
    ],
    sideEffects: [
      "نادراً: طفح جلدي أو حساسية",
      "نادراً: غثيان",
      "نادراً جداً: ضيق تنفس",
      "آمن بشكل عام"
    ],
    contraindications: [
      "الحساسية من النيتروفيورانات",
      "الأطفال أقل من شهرين",
      "الخداج (الأطفال المولودين مبكراً)"
    ],
    dosage: "للبالغين: 200mg (كبسولة) 3-4 مرات يومياً لمدة 5-7 أيام. للأطفال: حسب الوزن",
    warnings: "⚠️ يجب شرب كميات كافية من السوائل والأملاح (محلول معالجة الجفاف) لتعويض ما يُفقد بالإسهال. إذا استمر الإسهال أكثر من 3 أيام أو ظهر دم في البراز راجع الطبيب فوراً. لا يعالج الإسهال الفيروسي."
  },
  {

    name: "فلاجيل",
    aliases: ["Flagyl", "Metronidazole", "فلاچيل", "فلاجل", "ميترونيدازول", "فلأجيل", "فلإجيل", "فلاجىل", "فللاجيل", "فلللاجيل", "فللللاجيل", "فلااجيل", "فلاااجيل", "فلااااجيل", "فلاججيل", "فلاجججيل", "فلاججججيل", "فلاجييل", "فلاجيييل", "فلاجييييل", "فلاجيلل", "فلاجيللل", "فلاجيلللل", "فاجيل", "فلجيل", "فلايل", "فلااجيل", "فلاجيلل", "فلاجييل", "فلااجيل"],
    scientificName: "Metronidazole 500mg",
    category: "مضاد للطفيليات والبكتيريا اللاهوائية",
    price: "24 جنيه",
    uses: [
      "الأميبا المعوية (Entamoeba histolytica)",
      "الجارديا (Giardia)",
      "التهابات الأسنان واللثة",
      "التهاب المهبل البكتيري",
      "عدوى Trichomonas",
      "قرحة المعدة الناتجة عن جرثومة H.Pylori (مع أدوية أخرى)",
      "التهابات البطن والحوض"
    ],
    sideEffects: [
      "طعم معدني في الفم (شائع جداً)",
      "غثيان وفقدان شهية",
      "صداع ودوخة",
      "بول داكن اللون (طبيعي وغير ضار)",
      "ألم بالمعدة",
      "نادراً: تنميل في الأطراف"
    ],
    contraindications: [
      "الحمل (الثلث الأول - خطر على الجنين)",
      "الرضاعة (يُفرز في اللبن)",
      "تناول الكحول (ممنوع منعاً باتاً)",
      "أمراض الأعصاب الطرفية",
      "اضطرابات الدم"
    ],
    dosage: "حسب نوع العدوى: 250-500mg كل 8-12 ساعة لمدة 5-10 أيام",
    warnings: "⚠️⚠️⚠️ ممنوع منعاً باتاً تناول الكحول (حتى الكولونيا!) أثناء العلاج ولمدة 3 أيام بعد انتهائه - قد يسبب تفاعل خطير (تسمم ديسلفرام): غثيان شديد، قيء، صداع، خفقان. أكمل الكورس كاملاً."
  },
  {

    name: "هستوب",
    aliases: ["Histop", "Ranitidine", "رانيتيدين", "هيستوب", "ةستوب", "هصتوب", "هسستوب", "هسسستوب", "هسسسستوب", "هستتوب", "هستتتوب", "هستتتتوب", "هستووب", "هستوووب", "هستووووب", "هستوبب", "هستوببب", "هستوبببب", "هتوب", "هسوب", "هستب", "هستتوب", "هستتوب", "هسستوب", "هسستوب", "هستتوب", "هستووب", "هستووب", "هستوبب", "هسستوب"],
    scientificName: "Ranitidine 150mg",
    category: "مضاد الحموضة (H2 blocker)",
    price: "16 جنيه",
    uses: [
      "حرقة المعدة والحموضة",
      "ارتجاع المريء (GERD)",
      "قرحة المعدة والاثني عشر",
      "متلازمة زولينجر-إليسون (زيادة الحمض)",
      "الوقاية من قرحة المعدة عند تناول مسكنات"
    ],
    sideEffects: [
      "صداع خفيف",
      "دوخة ونعاس",
      "إمساك أو إسهال",
      "نادراً: ألم بالعضلات",
      "نادراً جداً: اضطراب الكبد"
    ],
    contraindications: [
      "الحساسية من الرانيتيدين",
      "البورفيريا الحادة",
      "أمراض الكلى الشديدة (تعديل الجرعة)"
    ],
    dosage: "150mg مرتين يومياً (صباحاً ومساءً)، أو 300mg قبل النوم مرة واحدة",
    warnings: "⚠️ لا يستخدم أكثر من أسبوعين بدون استشارة طبيب. إذا استمرت الحموضة أو الألم راجع الطبيب - قد تكون علامة على مشكلة أخطر. لا يؤخذ مع مضادات الفطريات (Ketoconazole)."
  },
  {

    name: "دوجماتيل",
    aliases: ["Dogmatil", "Sulpiride", "دوغماتيل", "دوجماتل", "سولبيريد", "دوجمأتيل", "دوجمإتيل", "دوجماتىل", "دووجماتيل", "دوووجماتيل", "دووووجماتيل", "دوججماتيل", "دوجججماتيل", "دوججججماتيل", "دوجمماتيل", "دوجممماتيل", "دوجمممماتيل", "دوجمااتيل", "دوجماااتيل", "دوجمااااتيل", "دوجماتتيل", "دوجماتتتيل", "دوجماتتتتيل", "دجماتيل", "دوماتيل", "دوجاتيل", "دوججماتيل", "دوجماتييل", "دوجماتتيل", "دوجمماتيل"],
    scientificName: "Sulpiride 50mg",
    category: "مضاد للقيء ومهدئ نفسي",
    price: "22 جنيه",
    uses: [
      "القيء والغثيان",
      "الدوخة والدوار (vertigo)",
      "القولون العصبي",
      "القلق والتوتر الخفيف",
      "الاكتئاب الخفيف",
      "اضطرابات المعدة النفسية"
    ],
    sideEffects: [
      "النعاس والخمول",
      "زيادة الوزن",
      "اضطرابات الدورة الشهرية",
      "إفراز حليب من الثدي (galactorrhea)",
      "حركات لا إرادية (نادراً)",
      "ضعف جنسي"
    ],
    contraindications: [
      "الحمل والرضاعة",
      "مرضى الصرع",
      "أورام الثدي المعتمدة على البرولاكتين",
      "ورم الغدة النخامية (Prolactinoma)",
      "الشلل الرعاش (Parkinson)",
      "الأطفال أقل من 6 سنوات"
    ],
    dosage: "50-150mg يومياً مقسمة على جرعات (حسب الحالة)",
    warnings: "⚠️ قد يسبب النعاس والدوخة - لا تقود السيارة. قد يسبب إدمان نفسي - لا تتوقف فجأة. يرفع هرمون البرولاكتين. لا يؤخذ لفترات طويلة (أكثر من 3 شهور) بدون متابعة طبية."
  },
  {

    name: "كلاريتين",
    aliases: ["Claritine", "Loratadine", "كلاريتن", "كلارتين", "لوراتادين", "كلأريتين", "كلإريتين", "كلارىتين", "كللاريتين", "كلللاريتين", "كللللاريتين", "كلااريتين", "كلاااريتين", "كلااااريتين", "كلارريتين", "كلاررريتين", "كلارررريتين", "كلارييتين", "كلاريييتين", "كلارييييتين", "كلاريتتين", "كلاريتتتين", "كلاريتتتتين", "كاريتين", "كلريتين", "كلايتين", "كللاريتين", "كلاريتينن", "كلارييتين", "كلارييتين"],
    scientificName: "Loratadine 10mg",
    category: "مضاد الحساسية (جيل ثاني)",
    price: "30 جنيه",
    uses: [
      "حساسية الأنف (حمى القش - Hay fever)",
      "العطس والرشح التحسسي",
      "حكة العين والأنف",
      "الشرى (الأرتيكاريا - Urticaria)",
      "الحساسية الموسمية (حبوب اللقاح)",
      "حساسية الغبار والحيوانات"
    ],
    sideEffects: [
      "صداع خفيف (الأكثر شيوعاً)",
      "جفاف الفم",
      "نادراً: دوخة أو تعب",
      "نادراً: اضطراب المعدة"
    ],
    contraindications: [
      "الحساسية من اللوراتادين",
      "أمراض الكبد الشديدة (استشر الطبيب)",
      "الأطفال أقل من سنتين"
    ],
    dosage: "للبالغين والأطفال فوق 12 سنة: قرص واحد 10mg يومياً. للأطفال 2-12 سنة: نصف الجرعة أو شراب",
    warnings: "✅ لا يسبب النعاس عادة (مضاد حساسية غير مهدئ). آمن للاستخدام اليومي طويل الأمد في موسم الحساسية. يمكن تناوله قبل أو بعد الأكل. مفعوله يستمر 24 ساعة."
  },
  {

    name: "زيرتك",
    aliases: ["Zyrtec", "Cetirizine", "سيتريزين", "زرتك", "زيرتيك", "زىرتك", "زييرتك", "زيييرتك", "زييييرتك", "زيررتك", "زيرررتك", "زيررررتك", "زيرتتك", "زيرتتتك", "زيرتتتتك", "زيرتكك", "زيرتككك", "زيرتكككك", "زيتك", "زيرك", "زيرتتك", "زييرتك", "زيررتك", "زيرتكك", "زيرتكك", "زييرتك", "زيرتتك", "زييرتك", "زيررتك", "زييرتك"],
    scientificName: "Cetirizine 10mg",
    category: "مضاد الحساسية (جيل ثاني)",
    price: "25-50 جنيه",
    uses: [
      "حساسية الأنف والعطس",
      "الشرى والحكة الجلدية",
      "حساسية العين (دموع، حكة)",
      "الحساسية من الحيوانات",
      "حساسية الطعام (الأعراض فقط)",
      "لدغات الحشرات"
    ],
    sideEffects: [
      "نعاس خفيف (أقل من الجيل الأول)",
      "صداع",
      "جفاف الفم",
      "تعب وإرهاق",
      "نادراً: دوخة"
    ],
    contraindications: [
      "الحساسية من السيتريزين",
      "أمراض الكلى الشديدة",
      "الأطفال أقل من 6 أشهر"
    ],
    dosage: "10mg مرة واحدة يومياً (يفضل مساءً)",
    warnings: "⚠️ قد يسبب نعاس خفيف - احذر عند القيادة. لا تتناول الكحول معه. مفعوله أسرع من كلاريتين لكن قد يسبب نعاس أكثر. آمن للاستخدام اليومي."
  },
  {

    name: "فيفادول",
    aliases: ["Fevadol", "فيفدول", "فيفادل", "فيفأدول", "فيفإدول", "فىفادول", "فييفادول", "فيييفادول", "فييييفادول", "فيففادول", "فيفففادول", "فيففففادول", "فيفاادول", "فيفااادول", "فيفاااادول", "فيفاددول", "فيفادددول", "فيفاددددول", "فيفادوول", "فيفادووول", "فيفادوووول", "ففادول", "فيادول", "فيفادوول", "فيففادول", "فيفادوول", "فيفادولل", "فيفادوول", "فيفاادول", "فيفاادول"],
    scientificName: "Paracetamol 500mg",
    category: "مسكن وخافض حرارة",
    price: "25-50 جنيه",
    uses: [
      "نفس استخدامات بنادول (باراسيتامول)",
      "خفض الحرارة",
      "تسكين الألم الخفيف والمتوسط"
    ],
    sideEffects: [
      "نفس أعراض بنادول",
      "آمن جداً بالجرعات الصحيحة"
    ],
    contraindications: [
      "نفس موانع بنادول",
      "أمراض الكبد"
    ],
    dosage: "نفس جرعة بنادول: 500-1000mg كل 4-6 ساعات",
    warnings: "⚠️ هو نفس بنادول (نفس المادة الفعالة). لا تأخذ الاثنين معاً."
  },
  {

    name: "نو سبا",
    aliases: ["No-Spa", "Drotaverine", "نوسبا", "نو-سبا", "دروتافيرين", "نو سبأ", "نو سبإ", "نو صبا", "نوو سبا", "نووو سبا", "نوووو سبا", "نو  سبا", "نو   سبا", "نو    سبا", "نو سسبا", "نو سسسبا", "نو سسسسبا", "نو سببا", "نو سبببا", "نو سببببا", "نو سباا", "نو سبااا", "نو سباااا", "ن سبا", "نو با", "نوو سبا", "نو سباا", "نو  سبا", "نو سببا", "نو سسبا"],
    scientificName: "Drotaverine 40mg",
    category: "مضاد للتقلصات",
    price: "25-50 جنيه",
    uses: [
      "تقلصات وآلام البطن",
      "مغص الكلى والحالب",
      "آلام القولون العصبي",
      "آلام الدورة الشهرية",
      "تقلصات المرارة",
      "تقلصات المثانة"
    ],
    sideEffects: [
      "دوخة خفيفة",
      "صداع",
      "غثيان نادر",
      "انخفاض ضغط الدم (نادراً)"
    ],
    contraindications: [
      "انخفاض ضغط الدم الشديد",
      "قصور القلب الشديد",
      "قصور الكبد أو الكلى الشديد",
      "الحمل والرضاعة (استشر الطبيب)"
    ],
    dosage: "40-80mg (1-2 قرص) 2-3 مرات يومياً",
    warnings: "✅ آمن وفعال للتقلصات. لا يعالج السبب - فقط يخفف الألم. إذا استمر الألم أكثر من يومين راجع الطبيب."
  },
  {

    name: "فولتارين",
    aliases: ["Voltaren", "Diclofenac", "ديكلوفيناك", "فولتارن", "فولترين", "فولتأرين", "فولتإرين", "فولتارىن", "فوولتارين", "فووولتارين", "فوووولتارين", "فوللتارين", "فولللتارين", "فوللللتارين", "فولتتارين", "فولتتتارين", "فولتتتتارين", "فولتاارين", "فولتااارين", "فولتاااارين", "فولتاررين", "فولتارررين", "فولتاررررين", "فلتارين", "فوتارين", "فولارين", "فولتاارين", "فولتاارين", "فولتاررين", "فولتاريين"],
    scientificName: "Diclofenac Sodium 50mg",
    category: "مسكن ومضاد التهاب قوي",
    price: "35 جنيه",
    uses: [
      "آلام المفاصل والتهابها (خشونة، روماتويد)",
      "آلام الظهر والرقبة",
      "التهاب الأوتار والعضلات",
      "النقرس (Gout)",
      "آلام ما بعد الجراحة",
      "الصداع النصفي الشديد"
    ],
    sideEffects: [
      "حرقة وألم بالمعدة (شائع)",
      "غثيان وعسر هضم",
      "دوخة وصداع",
      "قرحة معدة (مع الاستخدام الطويل)",
      "ارتفاع ضغط الدم",
      "احتباس السوائل"
    ],
    contraindications: [
      "قرحة المعدة النشطة",
      "الربو الحساس للأسبرين",
      "الثلث الأخير من الحمل",
      "أمراض القلب والكلى الشديدة",
      "تاريخ نزيف المعدة"
    ],
    dosage: "50mg 2-3 مرات يومياً بعد الأكل (بحد أقصى 150mg يومياً)",
    warnings: "⚠️⚠️ دواء قوي - يجب تناوله بعد الطعام. قد يزيد خطر النوبات القلبية والسكتة الدماغية. لا يستخدم لفترات طويلة بدون استشارة طبيب. متوفر أيضاً كحقن وجل موضعي."
  },
  {

    name: "كتافاست",
    aliases: ["Catafast", "Diclofenac K", "كتافست", "كتفاست", "كتأفاست", "كتإفاست", "كتافاصت", "كتتافاست", "كتتتافاست", "كتتتتافاست", "كتاافاست", "كتااافاست", "كتاااافاست", "كتاففاست", "كتافففاست", "كتاففففاست", "كتافااست", "كتافاااست", "كتافااااست", "كتافاسست", "كتافاسسست", "كتافاسسسست", "كافاست", "كتااست", "كتافاستت", "كتافااست", "كتافاستت", "كتاففاست", "كتتافاست", "كتتافاست"],
    scientificName: "Diclofenac Potassium 50mg",
    category: "مسكن سريع المفعول",
    price: "25-50 جنيه",
    uses: [
      "آلام حادة (أسنان، صداع، مفاصل)",
      "آلام الدورة الشهرية",
      "الصداع النصفي",
      "آلام ما بعد الجراحة",
      "الحمى"
    ],
    sideEffects: [
      "نفس فولتارين",
      "مفعوله أسرع لأنه ديكلوفيناك بوتاسيوم"
    ],
    contraindications: [
      "نفس فولتارين"
    ],
    dosage: "كيس (50mg) يذاب في الماء 2-3 مرات يومياً",
    warnings: "⚠️ مفعوله أسرع من الأقراص (حوالي 15 دقيقة). نفس احتياطات فولتارين. لا يستخدم للأطفال أقل من 14 سنة."
  },
  {

    name: "ديمرا",
    aliases: ["Dimra", "دمرا", "ديمرة", "باسط عضلات", "برشام الشد العضلي", "ديمرأ", "ديمرإ", "دىمرا", "دييمرا", "ديييمرا", "دييييمرا", "ديممرا", "ديمممرا", "ديممممرا", "ديمررا", "ديمرررا", "ديمررررا", "ديمراا", "ديمرااا", "ديمراااا", "ديرا", "ديما", "ديمراا", "ديمررا", "ديمراا", "دييمرا", "ديمراا", "ديمراا", "ديممرا", "ديممرا"],
    scientificName: "Diclofenac Potassium + Methocarbamol",
    category: "مسكن وباسط للعضلات",
    price: "25-50 جنيه",
    uses: ["الشد العضلي بعد الجيم", "آلام الرقبة (لوحة الكتف)", "تمنع تقلص العضلات", "آلام الظهر"],
    sideEffects: ["نعاس (بييم)", "دوخة خفيفة", "حموضة"],
    contraindications: ["الحمل والرضاعة", "قرحة المعدة", "العمل على آلات خطرة"],
    dosage: "قرص واحد 2-3 مرات يومياً بعد الأكل.",
    warnings: "⚠️ يسبب النعاس، يفضل عدم القيادة بعد تناوله. ممتاز للشباب بعد إصابات الملاعب."
  },
  {

    name: "ميوفين",
    aliases: ["Myofen", "ميوفين", "ميوفن", "مايوفين", "كبسولات العظم", "مىوفين", "مييوفين", "ميييوفين", "مييييوفين", "ميووفين", "ميوووفين", "ميووووفين", "ميوففين", "ميوفففين", "ميوففففين", "ميوفيين", "ميوفييين", "ميوفيييين", "ميوفينن", "ميوفيننن", "ميوفينننن", "موفين", "ميفين", "ميوين", "ميووفين", "ميوففين", "ميووفين", "مييوفين", "ميوففين", "ميووفين"],
    scientificName: "Chlorzoxazone + Ibuprofen",
    category: "باسط عضلات ومسكن",
    price: "25-50 جنيه",
    uses: ["تشنج العضلات", "آلام الظهر (الديسك)", "تمزق الأربطة", "تقلصات العضلات بعد التمرين"],
    sideEffects: ["تغير لون البول (برتقالي/محمر - طبيعي)", "دوخة", "خمول", "ألم معدة"],
    contraindications: ["مرضى الكبد", "قرحة المعدة", "الأطفال أقل من 12 سنة"],
    dosage: "كبسولة بعد الأكل 3 مرات يومياً.",
    warnings: "⚠️ قد يغير لون البول فلا تقلق. يؤخذ بعد الأكل لتجنب ألم المعدة."
  },
  {

    name: "ميوألجين",
    aliases: ["Myolgin", "ميوالجين", "ميولجين", "ميو الجين", "مسكن وميبورش", "مىوألجين", "مييوألجين", "ميييوألجين", "مييييوألجين", "ميووألجين", "ميوووألجين", "ميووووألجين", "ميوأألجين", "ميوأأألجين", "ميوأأأألجين", "ميوأللجين", "ميوألللجين", "ميوأللللجين", "ميوألججين", "ميوألجججين", "ميوألججججين", "موألجين", "ميألجين", "ميوألجينن", "مييوألجين", "ميوأللجين", "ميوألججين", "ميوأللجين", "ميوأألجين", "ميوأللجين"],
    scientificName: "Chlorzoxazone + Paracetamol",
    category: "باسط عضلات (خفيف على المعدة)",
    price: "25-50 جنيه",
    uses: ["آلام الرقبة", "الشد العضلي", "تصلب العضلات", "الصداع التوتري"],
    sideEffects: ["دوخة بسيطة", "خمول", "تغير لون البول"],
    contraindications: ["حساسية الباراسيتامول", "مشاكل الكبد"],
    dosage: "قرص 3 مرات يومياً بعد الأكل.",
    warnings: "✅ أأمن على المعدة من الميوفين وديمرا لأنه يحتوي على باراسيتامول بدلاً من المسكنات القوية."
  },
  {

    name: "ديكلاك",
    aliases: ["Diclac", "ديكلاك", "دكلاك", "ديكلاك 150", "ديكلاك 75", "مسكن المفعول الممتد", "ديكلأك", "ديكلإك", "دىكلاك", "دييكلاك", "ديييكلاك", "دييييكلاك", "ديككلاك", "ديكككلاك", "ديككككلاك", "ديكللاك", "ديكلللاك", "ديكللللاك", "ديكلااك", "ديكلاااك", "ديكلااااك", "ديكلاكك", "ديكلاككك", "ديكلاكككك", "ديلاك", "ديكاك", "دييكلاك", "ديكلااك", "ديكلااك", "ديكلااك"],
    scientificName: "Diclofenac Sodium (Extended Release)",
    category: "مسكن عظام طويل المفعول",
    price: "25-50 جنيه",
    uses: ["التهاب المفاصل المزمن", "آلام العمود الفقري", "الروماتيزم", "النقرس", "خشونة الركبة"],
    sideEffects: ["عسر هضم", "احتباس سوائل", "صداع"],
    contraindications: ["مرضى القلب والشرايين", "قرحة المعدة"],
    dosage: "قرص واحد يومياً (تركيز 75 أو 150) بعد الغداء.",
    warnings: "⚠️ مفعوله يستمر 24 ساعة، لا تكرر الجرعة في نفس اليوم. خطر على مرضى الضغط والقلب."
  },
  {

    name: "أولفين",
    aliases: ["Olfen", "اولفين", "الفين", "أولفين حقن", "أولفين 100", "حقن مسكنة", "أولفىن", "أوولفين", "أووولفين", "أوووولفين", "أوللفين", "أولللفين", "أوللللفين", "أولففين", "أولفففين", "أولففففين", "أولفيين", "أولفييين", "أولفيييين", "أولفينن", "أولفيننن", "أولفينننن", "ألفين", "أوفين", "أولين", "أولفينن", "أولففين", "أوللفين", "أوولفين", "أوولفين"],
    scientificName: "Diclofenac Sodium",
    category: "مسكن ومضاد التهاب",
    price: "25-50 جنيه",
    uses: ["المغص الكلوي (الحقن)", "التهابات المفاصل", "آلام الظهر الشديدة", "النقرس الحاد"],
    sideEffects: ["ألم مكان الحقن", "اضطراب هضمي", "حرقان معدة"],
    contraindications: ["مشاكل التجلط", "قرحة المعدة", "الربو"],
    dosage: "حسب الشكل الصيدلاني (لبوس، حقن، كبسول). الحقن مرة واحدة يومياً.",
    warnings: "⚠️ الحقن مؤلمة قليلاً ولكنها سريعة جداً. لا يُستخدم لفترات طويلة."
  },
  {

    name: "الجزون",
    aliases: ["Algason", "الجزون", "الجازون", "كريم مساج", "الجسون", "ألجزون", "إلجزون", "اللجزون", "الللجزون", "اللللجزون", "الججزون", "الجججزون", "الججججزون", "الجززون", "الجزززون", "الجززززون", "الجزوون", "الجزووون", "الجزوووون", "الجزونن", "الجزوننن", "الجزونننن", "اجزون", "الزون", "الجون", "الجزوون", "الججزون", "اللجزون", "اللجزون", "الجزونن"],
    scientificName: "Diethylamine Salicylate",
    category: "كريم مساج ومسكن موضعي",
    price: "25-50 جنيه",
    uses: ["عرق النسا", "آلام الرقبة", "الكدمات", "آلام الظهر"],
    sideEffects: ["تهيج جلدي بسيط", "رائحة نفاذة (منثول)"],
    contraindications: ["الجروح المفتوحة", "حساسية الساليسيلات"],
    dosage: "دهان مع التدليك 3 مرات يومياً.",
    warnings: "✅ ممتاز للتدفئة وتنشيط الدورة الدموية في العضلة. رائحته قوية."
  },
  {

    name: "موڤ",
    aliases: ["Moov", "موف", "موف هندي", "مووف", "كريم العظم", "مووڤ", "موووڤ", "مووووڤ", "موڤڤ", "موڤڤڤ", "موڤڤڤڤ", "مڤ", "مووڤ", "مووڤ", "موڤڤ", "مووڤ", "مووڤ", "موڤڤ", "مووڤ", "مووڤ", "موڤڤ", "موڤڤ", "موڤڤ", "مووڤ", "مووڤ", "مووڤ", "موڤڤ", "موڤڤ", "مووڤ", "مووڤ"],
    scientificName: "Wintergreen Oil + Menthol",
    category: "دهان مسكن للآلام",
    price: "25-50 جنيه",
    uses: ["التواء المفاصل", "آلام العضلات", "الإجهاد البدني"],
    sideEffects: ["إحساس بالحرارة أو الحرقان", "احمرار الجلد"],
    contraindications: ["الأطفال أقل من 6 سنوات", "الوجه والعين", "الجلد المجروح"],
    dosage: "دهان مرتين يومياً.",
    warnings: "⚠️ يسبب إحساس بالسخونة وهذا طبيعي. اغسل يدك جيداً بعد الاستخدام، ولا تقربها من عينك."
  },
  {

    name: "ريباريل چيل",
    aliases: ["Reparil Gel", "ريباريل", "ريباريل جيل", "كريم الكدمات", "ريبريل", "ريبأريل چيل", "ريبإريل چيل", "رىباريل چيل", "رييباريل چيل", "ريييباريل چيل", "رييييباريل چيل", "ريبباريل چيل", "ريببباريل چيل", "ريبببباريل چيل", "ريبااريل چيل", "ريباااريل چيل", "ريبااااريل چيل", "ريبارريل چيل", "ريباررريل چيل", "ريبارررريل چيل", "ريبارييل چيل", "ريباريييل چيل", "ريبارييييل چيل", "رباريل چيل", "رياريل چيل", "ريبريل چيل", "ريباريل چييل", "ريباريل  چيل", "ريباريل چييل", "ريباريل چييل"],
    scientificName: "Aescin + Diethylamine Salicylate",
    category: "علاج التورم والكدمات",
    price: "25-50 جنيه",
    uses: ["الكدمات الزرقاء", "تورم القدمين", "التواء الكاحل", "علاج التجمعات الدموية", "الدوالي"],
    sideEffects: ["جفاف الجلد في مكان الدهان"],
    contraindications: ["الأغشية المخاطية", "الجروح المفتوحة"],
    dosage: "دهان طبقة رقيقة بدون تدليك شديد 3 مرات يومياً.",
    warnings: "✅ سحري في إزالة التورم والزرقان الناتجة عن الخبطات. يبرد المكان."
  },
  {

    name: "فولتارين جل",
    aliases: ["Voltaren Gel", "فولتارين جيل", "فولترين جل", "دهان فولتارين", "فولتأرين جل", "فولتإرين جل", "فولتارىن جل", "فوولتارين جل", "فووولتارين جل", "فوووولتارين جل", "فوللتارين جل", "فولللتارين جل", "فوللللتارين جل", "فولتتارين جل", "فولتتتارين جل", "فولتتتتارين جل", "فولتاارين جل", "فولتااارين جل", "فولتاااارين جل", "فولتاررين جل", "فولتارررين جل", "فولتاررررين جل", "فلتارين جل", "فوتارين جل", "فولارين جل", "فوللتارين جل", "فولتاررين جل", "فولتتارين جل", "فولتارين  جل", "فولتارينن جل"],
    scientificName: "Diclofenac Diethylammonium",
    category: "دهان مسكن ومضاد للالتهاب",
    price: "35 جنيه",
    uses: ["آلام المفاصل الموضعية", "الركبة", "الرقبة", "التهاب الأوتار"],
    sideEffects: ["حساسية ضوئية (تجنب الشمس مكان الدهان)"],
    contraindications: ["حساسية الديكلوفيناك"],
    dosage: "دهان 2-4 مرات يومياً.",
    warnings: "✅ آمن لمرضى المعدة لأنه دهان موضعي لا يمر بالجهاز الهضمي."
  },
  {

    name: "وان تو ثري",
    aliases: ["123", "ون تو ثري", "وان تو ثري اقراص", "حبوب البرد", "وأن تو ثري", "وإن تو ثري", "وان تو ثرى", "واان تو ثري", "وااان تو ثري", "واااان تو ثري", "وانن تو ثري", "واننن تو ثري", "وانننن تو ثري", "وان  تو ثري", "وان   تو ثري", "وان    تو ثري", "وان تتو ثري", "وان تتتو ثري", "وان تتتتو ثري", "وان توو ثري", "وان تووو ثري", "وان توووو ثري", "وا تو ثري", "وانتو ثري", "وان تتو ثري", "وانن تو ثري", "واان تو ثري", "وان تو ثثري", "وان تو ثريي", "وان تو ثريي"],
    scientificName: "Paracetamol + Pseudoephedrine + Chlorpheniramine",
    category: "علاج البرد والزكام",
    price: "25-50 جنيه",
    uses: ["الرشح والعطس", "انسداد الأنف", "الصداع", "ارتفاع الحرارة"],
    sideEffects: ["النعاس", "جفاف الفم", "عصبية خفيفة"],
    contraindications: ["مرضى الضغط العالي", "تضخم البروستاتا", "مرضى القلب"],
    dosage: "قرص كل 6-8 ساعات.",
    warnings: "⚠️ ممنوع لمرضى الضغط لأنه يرفع ضغط الدم (يحتوي على سودوإيفيدرين)."
  },
  {

    name: "باندول كولد آند فلو",
    aliases: ["Panadol Cold & Flu", "بنادول الاصفر", "بنادول البرد", "باندول كولد", "بأندول كولد آند فلو", "بإندول كولد آند فلو", "بااندول كولد آند فلو", "باااندول كولد آند فلو", "بااااندول كولد آند فلو", "بانندول كولد آند فلو", "باننندول كولد آند فلو", "بانننندول كولد آند فلو", "بانددول كولد آند فلو", "باندددول كولد آند فلو", "بانددددول كولد آند فلو", "باندوول كولد آند فلو", "باندووول كولد آند فلو", "باندوووول كولد آند فلو", "باندولل كولد آند فلو", "باندوللل كولد آند فلو", "باندولللل كولد آند فلو", "بندول كولد آند فلو", "بادول كولد آند فلو", "بانول كولد آند فلو", "باندولل كولد آند فلو", "بانندول كولد آند فلو", "باندول كولد آند فللو", "باندول كولد آنند فلو", "باندول كولد آندد فلو", "باندوول كولد آند فلو"],
    scientificName: "Paracetamol + Phenylephrine + Caffeine",
    category: "برد (لا يسبب النعاس)",
    price: "25-50 جنيه",
    uses: ["احتقان الأنف", "آلام الجسم", "الرشح", "الصداع"],
    sideEffects: ["أرق (بسبب الكافيين)", "ضربات قلب سريعة"],
    contraindications: ["مرضى القلب والضغط"],
    dosage: "قرصين كل 12 ساعة.",
    warnings: "✅ مناسب جداً للعمل نهاراً لأنه لا يسبب النوم (يحتوي كافيين)."
  },
  {

    name: "نايت آند دي",
    aliases: ["Night and Day", "نايت اند داي", "نايت اند دي", "الحباية البيضا والصفرا", "نأيت آند دي", "نإيت آند دي", "ناىت آند دي", "ناايت آند دي", "نااايت آند دي", "ناااايت آند دي", "ناييت آند دي", "نايييت آند دي", "ناييييت آند دي", "نايتت آند دي", "نايتتت آند دي", "نايتتتت آند دي", "نايت  آند دي", "نايت   آند دي", "نايت    آند دي", "نايت آآند دي", "نايت آآآند دي", "نايت آآآآند دي", "نيت آند دي", "نات آند دي", "ناي آند دي", "نايت آند ديي", "نايت  آند دي", "ناايت آند دي", "ناييت آند دي", "نايت آند ددي"],
    scientificName: "Paracetamol + Pseudoephedrine + Diphenhydramine",
    category: "علاج البرد (نظام اليوم الكامل)",
    price: "25-50 جنيه",
    uses: ["برد النهار (تركيز)", "برد الليل (نوم هادئ)"],
    sideEffects: ["القرص الأبيض (نشاط)، القرص الأصفر (نوم عميق)"],
    contraindications: ["مرضى الضغط والقلب"],
    dosage: "القرص الأبيض صباحاً، والقرص الأصفر قبل النوم.",
    warnings: "⚠️ انتبه! لا تبدل الأقراص، القرص الأصفر سيجعلك تنام فوراً!"
  },
  {

    name: "سيتال",
    aliases: ["Cetal", "سيتال", "سيتال نقط", "سيتال شراب", "لبوس سيتال", "سيتأل", "سيتإل", "سىتال", "صيتال", "سييتال", "سيييتال", "سييييتال", "سيتتال", "سيتتتال", "سيتتتتال", "سيتاال", "سيتااال", "سيتاااال", "سيتالل", "سيتاللل", "سيتالللل", "ستال", "سيال", "سيتل", "سيتتال", "سيتاال", "سيتتال", "سيتاال", "سييتال", "سيتالل"],
    scientificName: "Paracetamol 500mg",
    category: "أمان تام للسخونة",
    price: "25-50 جنيه",
    uses: ["سخونة الأطفال والكبار", "بعد التطعيمات", "الصداع", "أمان للحوامل"],
    sideEffects: ["نادرة جداً"],
    contraindications: ["فشل كبدي"],
    dosage: "حسب العمر والوزن.",
    warnings: "✅ هو البديل المصري الأرخص للبنادول وبنفس الجودة تماماً."
  },
  {

    name: "كومتركس",
    aliases: ["Comtrex", "كومتركس", "كمتركس", "كوميتركس", "الاحمر", "كومتركص", "كوومتركس", "كووومتركس", "كوووومتركس", "كوممتركس", "كومممتركس", "كوممممتركس", "كومتتركس", "كومتتتركس", "كومتتتتركس", "كومترركس", "كومتررركس", "كومترررركس", "كومترككس", "كومتركككس", "كومترككككس", "كوتركس", "كومركس", "كوومتركس", "كومترركس", "كوومتركس", "كومترركس", "كوممتركس", "كومترركس", "كومترككس"],
    scientificName: "Acetaminophen + Pseudoephedrine + Brompheniramine",
    category: "علاج البرد القوي",
    price: "25-50 جنيه",
    uses: ["الرشح الشديد", "تكسير الجسم", "الصداع", "الجيوب الأنفية"],
    sideEffects: ["نعاس شديد", "جفاف الحلق"],
    contraindications: ["الضغط العالي", "الجلوكوما"],
    dosage: "قرص كل 8 ساعات.",
    warnings: "⚠️ مشهور جداً في مصر، لكنه يسبب نعاس قوي. ممنوع لمرضى الضغط."
  },
  {

    name: "فلوموكس",
    aliases: ["Flumox", "فلوموكس", "فلموكس", "فلومكس", "فلوموكس 1000", "فلوموكس 500", "فلوموكص", "فللوموكس", "فلللوموكس", "فللللوموكس", "فلووموكس", "فلوووموكس", "فلووووموكس", "فلومموكس", "فلوممموكس", "فلومممموكس", "فلومووكس", "فلوموووكس", "فلومووووكس", "فلوموككس", "فلوموكككس", "فلوموككككس", "فوموكس", "فلووكس", "فلوموكسس", "فلوموكسس", "فلوموكسس", "فلوموككس", "فلوموكسس", "فلووموكس"],
    scientificName: "Amoxicillin + Flucloxacillin",
    category: "مضاد حيوي واسع المجال",
    price: "25-50 جنيه",
    uses: ["خراج الأسنان", "التهابات الجلد", "دمامل", "الجروح الملوثة", "اللوز"],
    sideEffects: ["إسهال", "طفح جلدي", "عسر هضم"],
    contraindications: ["حساسية البنسلين"],
    dosage: "كبسولة كل 8 ساعات (أو كل 12 ساعة لتركيز 1000).",
    warnings: "⚠️ ممتاز للأسنان والجلد. لا تأخذه لو عندك حساسية بنسلين."
  },
  {

    name: "زيثروكان",
    aliases: ["Zithrokan", "زيزروكان", "زيثروكان", "مضاد التلات أيام", "زيثرون", "زيسروكان", "زيثروكأن", "زيثروكإن", "زىثروكان", "زييثروكان", "زيييثروكان", "زييييثروكان", "زيثثروكان", "زيثثثروكان", "زيثثثثروكان", "زيثرروكان", "زيثررروكان", "زيثرررروكان", "زيثرووكان", "زيثروووكان", "زيثرووووكان", "زيثروككان", "زيثروكككان", "زيثروككككان", "زثروكان", "زيروكان", "زيثوكان", "زيثرروكان", "زيثثروكان", "زيثرووكان"],
    scientificName: "Azithromycin 500mg",
    category: "مضاد حيوي (3 أيام فقط)",
    price: "25-50 جنيه",
    uses: ["التهاب الحلق واللوزتين", "النزلات الشعبية", "التهاب الجيوب الأنفية", "كورونا (بروتوكول)"],
    sideEffects: ["مغص", "إسهال", "تغير طعم الفم"],
    contraindications: ["مشاكل ضربات القلب"],
    dosage: "قرص واحد يومياً لمدة 3 أيام فقط قبل الأكل بساعة.",
    warnings: "✅ مفعوله يستمر في الجسم لمدة 10 أيام بعد آخر قرص. مريح جداً في الاستخدام."
  },
  {

    name: "هاى بيوتك",
    aliases: ["Hibiotic", "هاي بيوتك", "هيبوتك", "هايبايوتك", "بديل الاوجمنتين", "هأى بيوتك", "هإى بيوتك", "ةاى بيوتك", "هاى بىوتك", "هااى بيوتك", "هاااى بيوتك", "هااااى بيوتك", "هاىى بيوتك", "هاىىى بيوتك", "هاىىىى بيوتك", "هاى  بيوتك", "هاى   بيوتك", "هاى    بيوتك", "هاى ببيوتك", "هاى بببيوتك", "هاى ببببيوتك", "هاى بييوتك", "هاى بيييوتك", "هاى بييييوتك", "هى بيوتك", "ها بيوتك", "هاىبيوتك", "هاى بيووتك", "هاى بيووتك", "هاىى بيوتك"],
    scientificName: "Amoxicillin + Clavulanic Acid",
    category: "مضاد حيوي قوي",
    price: "25-50 جنيه",
    uses: ["التهاب الأذن الوسطى", "صديد اللوز", "التهاب المسالك البولية", "التهاب رئوي"],
    sideEffects: ["إسهال شديد", "فطريات الفم"],
    contraindications: ["حساسية البنسلين"],
    dosage: "قرص 1 جم كل 12 ساعة بعد الأكل.",
    warnings: "⚠️ يفضل أخذ فوار (لاكتيلوز) أو زبادي معه لتجنب الإسهال. نفس مادة الأوجمنتين."
  },
  {

    name: "سيبروفار",
    aliases: ["Ciprofar", "سيبروفار", "سيبرو", "سبروفار", "مطهر المسالك", "سيبروفأر", "سيبروفإر", "سىبروفار", "صيبروفار", "سييبروفار", "سيييبروفار", "سييييبروفار", "سيببروفار", "سيبببروفار", "سيببببروفار", "سيبرروفار", "سيبررروفار", "سيبرررروفار", "سيبرووفار", "سيبروووفار", "سيبرووووفار", "سيبروففار", "سيبروفففار", "سيبروففففار", "سيروفار", "سيبوفار", "سيبرروفار", "سيببروفار", "سيبروفارر", "سيبرروفار"],
    scientificName: "Ciprofloxacin",
    category: "مضاد حيوي للمسالك",
    price: "25-50 جنيه",
    uses: ["صديد البول", "التهاب المسالك البولية", "التهاب البروستاتا", "التيفود"],
    sideEffects: ["ألم في الأوتار (كعب الرجل)", "غثيان"],
    contraindications: ["الأطفال أقل من 18 سنة (خطر على النمو)", "الحمل"],
    dosage: "قرص 500 كل 12 ساعة.",
    warnings: "⚠️ ممنوع للأطفال والحوامل. اشرب ماء كثير معه."
  },
  {

    name: "أوروفكس",
    aliases: ["Orovex", "اوروفكس", "مضمضة", "غسول فم", "أوروفكص", "أووروفكس", "أوووروفكس", "أووووروفكس", "أورروفكس", "أوررروفكس", "أورررروفكس", "أورووفكس", "أوروووفكس", "أورووووفكس", "أوروففكس", "أوروفففكس", "أوروففففكس", "أوروفككس", "أوروفكككس", "أوروفككككس", "أروفكس", "أووفكس", "أورفكس", "أوروففكس", "أوروفككس", "أورروفكس", "أوروففكس", "أووروفكس", "أوروففكس", "أوروففكس"],
    scientificName: "Chlorhexidine + Thymol",
    category: "مضمضة ومطهر للفم",
    price: "25-50 جنيه",
    uses: ["التهاب اللثة", "رائحة الفم الكريهة", "بعد خلع الأسنان", "قرح الفم"],
    sideEffects: ["تصبغ الأسنان (مع الاستخدام الطويل جداً)"],
    contraindications: ["لا تبتلع"],
    dosage: "مضمضة مرتين يومياً بدون تخفيف.",
    warnings: "✅ طعمها مقبول وممتازة لرائحة الفم."
  },
  {

    name: "بي سي جي",
    aliases: ["BBC", "بي بي سي", "سبراي الزور", "بخاخ مسكن", "بى سي جي", "بي صي جي", "بيي سي جي", "بييي سي جي", "بيييي سي جي", "بي  سي جي", "بي   سي جي", "بي    سي جي", "بي سسي جي", "بي سسسي جي", "بي سسسسي جي", "بي سيي جي", "بي سييي جي", "بي سيييي جي", "بي سي  جي", "بي سي   جي", "بي سي    جي", "ب سي جي", "بيسي جي", "بي ي جي", "بيي سي جي", "بيي سي جي", "بي سيي جي", "بيي سي جي", "بي  سي جي", "بي سي ججي"],
    scientificName: "Benzocaine",
    category: "بخاخ مخدر ومطهر للحلق",
    price: "25-50 جنيه",
    uses: ["ألم الزور الشديد", "صعوبة البلع", "قرح الفم المؤلمة"],
    sideEffects: ["تنميل في اللسان والفم"],
    contraindications: ["حساسية البنج"],
    dosage: "بخة أو بختين في الحلق كل 3 ساعات.",
    warnings: "✅ يسكن ألم الزور فوراً (بنج موضعي). لا تأكل مباشرة بعده حتى لا تعض لسانك."
  },
  {

    name: "ميلجا",
    aliases: ["Milga", "ميلجا", "ميلجا ادفانس", "مقوي أعصاب", "فيتامين ب", "ميلجأ", "ميلجإ", "مىلجا", "مييلجا", "ميييلجا", "مييييلجا", "ميللجا", "ميلللجا", "ميللللجا", "ميلججا", "ميلجججا", "ميلججججا", "ميلجاا", "ميلجااا", "ميلجاااا", "ملجا", "ميجا", "ميلا", "ميلجاا", "مييلجا", "ميللجا", "مييلجا", "ميلجاا", "مييلجا", "ميلجاا"],
    scientificName: "Benfotiamine (B1) + B6 + B12",
    category: "فيتامين ب للأعصاب",
    price: "45 جنيه",
    uses: ["التهاب الأعصاب (لمرضى السكر)", "آلام الرقبة والظهر", "رعشة اليدين", "التركيز"],
    sideEffects: ["رائحة بول نفاذة (فيتامين ب)"],
    contraindications: ["لا يوجد"],
    dosage: "قرص بعد الغداء يومياً.",
    warnings: "✅ ممتاز جداً لمرضى السكري والرياضيين. ميلجا أدفانس أقوى قليلاً."
  },
  {

    name: "نيوروتون",
    aliases: ["Neuroton", "نيروتون", "نيوروتن", "حقن اعصاب", "نىوروتون", "نييوروتون", "نيييوروتون", "نييييوروتون", "نيووروتون", "نيوووروتون", "نيووووروتون", "نيورروتون", "نيوررروتون", "نيورررروتون", "نيورووتون", "نيوروووتون", "نيورووووتون", "نيوروتتون", "نيوروتتتون", "نيوروتتتتون", "نوروتون", "نيووتون", "نيورووتون", "نيوروتتون", "نيورروتون", "نيورووتون", "نيورروتون", "نيووروتون", "نيووروتون", "نيوروتوون"],
    scientificName: "Vitamin B Complex",
    category: "مقوي أعصاب عام",
    price: "25-50 جنيه",
    uses: ["الأنيميا", "رعشة اليدين", "التهاب الأعصاب الحاد"],
    sideEffects: ["ألم مكان الحقن"],
    contraindications: ["لا يوجد"],
    dosage: "حقنة عضل كل 3 أيام أو قرص يومياً.",
    warnings: "✅ الحقن مفعولها أسرع بكثير من الأقراص لمرضى الانزلاق الغضروفي."
  },
  {

    name: "فيروغلوبين",
    aliases: ["Feroglobin", "فيروغلوبين", "فيروجلوبين", "حديد", "كبسولات حديد", "فىروغلوبين", "فييروغلوبين", "فيييروغلوبين", "فييييروغلوبين", "فيرروغلوبين", "فيررروغلوبين", "فيرررروغلوبين", "فيرووغلوبين", "فيروووغلوبين", "فيرووووغلوبين", "فيروغغلوبين", "فيروغغغلوبين", "فيروغغغغلوبين", "فيروغللوبين", "فيروغلللوبين", "فيروغللللوبين", "فروغلوبين", "فيوغلوبين", "فيرغلوبين", "فيروغللوبين", "فيروغللوبين", "فيروغللوبين", "فيروغلوببين", "فيروغغلوبين", "فيروغلوبيين"],
    scientificName: "Iron + B12 + Zinc + Folic Acid",
    category: "علاج الأنيميا وتساقط الشعر",
    price: "25-50 جنيه",
    uses: ["نقص الحديد", "تساقط الشعر الناتجة عن الأنيميا", "الهالات السوداء", "شحوب الوجه"],
    sideEffects: ["إمساك", "براز أسود (طبيعي)", "طعم معدني"],
    contraindications: ["زيادة الحديد في الدم"],
    dosage: "كبسولة يومياً بعد الغداء.",
    warnings: "⚠️ لا تشرب شاي أو قهوة بعده بساعتين لأنها تمنع امتصاص الحديد. يسبب إمساك."
  },
  {

    name: "كيروفيت",
    aliases: ["Kerovit", "كيروفيت", "كيرفيت", "فيتامينات شاملة", "كىروفيت", "كييروفيت", "كيييروفيت", "كييييروفيت", "كيرروفيت", "كيررروفيت", "كيرررروفيت", "كيرووفيت", "كيروووفيت", "كيرووووفيت", "كيروففيت", "كيروفففيت", "كيروففففيت", "كيروفييت", "كيروفيييت", "كيروفييييت", "كروفيت", "كيوفيت", "كييروفيت", "كييروفيت", "كيرووفيت", "كيرووفيت", "كيرروفيت", "كيرروفيت", "كيروفيتت", "كيروفييت"],
    scientificName: "Multivitamins + Minerals + Ginseng",
    category: "مكمل غذائي شامل",
    price: "25-50 جنيه",
    uses: ["الإرهاق والتعب", "تحسين الذاكرة", "تجديد النشاط", "للجيم"],
    sideEffects: ["أرق (لو أخذ مساءً)"],
    contraindications: ["مرضى الضغط العالي (بسبب الجنسنج)"],
    dosage: "كبسولة واحدة بعد الإفطار.",
    warnings: "✅ كبسولة واحدة فيها كل حاجة. تعطي طاقة، لا تأخذها قبل النوم."
  },
  {

    name: "سانسو دي 3",
    aliases: ["Sanso D3", "سانسو دي", "فيتامين د", "دافاليندي", "سأنسو دي 3", "سإنسو دي 3", "سانسو دى 3", "صانسو دي 3", "ساانسو دي 3", "سااانسو دي 3", "ساااانسو دي 3", "ساننسو دي 3", "سانننسو دي 3", "ساننننسو دي 3", "سانسسو دي 3", "سانسسسو دي 3", "سانسسسسو دي 3", "سانسوو دي 3", "سانسووو دي 3", "سانسوووو دي 3", "سانسو  دي 3", "سانسو   دي 3", "سانسو    دي 3", "سنسو دي 3", "ساسو دي 3", "سانو دي 3", "ساانسو دي 3", "سانسو ديي 3", "سانسو دي 33", "ساانسو دي 3"],
    scientificName: "Vitamin D3 (Cholecalciferol)",
    category: "فيتامين د",
    price: "25-50 جنيه",
    uses: ["آلام العظام العامة", "الاكتئاب", "المناعة", "تساقط الشعر"],
    sideEffects: ["لا يوجد بالجرعات العادية"],
    contraindications: ["زيادة الكالسيوم"],
    dosage: "قرص (5000 أو 10000) مرة أسبوعياً أو يومياً حسب التحليل.",
    warnings: "✅ نقص فيتامين د منتشر جداً في مصر ويسبب تكسير الجسم."
  },
  {

    name: "كيناكومب",
    aliases: ["Kenacomb", "كيناكومب", "كينا كومب", "كريم التسلخات", "كيناكوم", "كينأكومب", "كينإكومب", "كىناكومب", "كييناكومب", "كيييناكومب", "كييييناكومب", "كينناكومب", "كيننناكومب", "كينننناكومب", "كينااكومب", "كيناااكومب", "كينااااكومب", "كيناككومب", "كيناكككومب", "كيناككككومب", "كيناكوومب", "كيناكووومب", "كيناكوووومب", "كناكومب", "كياكومب", "كينكومب", "كيناككومب", "كييناكومب", "كينناكومب", "كينناكومب"],
    scientificName: "Nystatin + Neomycin + Gramicidin + Triamcinolone",
    category: "كريم شامل (فطريات وبكتيريا والتهاب)",
    price: "25-50 جنيه",
    uses: ["التسلخات الشديدة", "التهابات الحفاضات (بحذر)", "فطريات بين الأصابع", "هرش"],
    sideEffects: ["أعراض الكورتيزون الموضعي"],
    contraindications: ["الاستخدام الطويل جداً"],
    dosage: "دهان مرتين يومياً.",
    warnings: "⚠️ " + "مشهور جداً في مصر (السحر)، لكن كثرة استخدامه للأطفال خطر بسبب الكورتيزون."
  },
  {

    name: "ميبو",
    aliases: ["Mebo", "ميبو", "كريم الحروق", "ميبو مرهم", "مىبو", "مييبو", "ميييبو", "مييييبو", "ميببو", "ميبببو", "ميببببو", "ميبوو", "ميبووو", "ميبوووو", "مبو", "ميو", "ميببو", "ميببو", "ميبوو", "ميببو", "ميبوو", "ميببو", "مييبو", "مييبو", "ميببو", "ميببو", "ميببو", "مييبو", "مييبو", "ميبوو"],
    scientificName: "Beta-Sitosterol + Sesame Oil",
    category: "علاج الحروق والجروح",
    price: "25-50 جنيه",
    uses: ["حروق المطبخ", "حروق الشمس", "جرح الولادة القيصرية", "ليزر الوجه", "الجروح المفتوحة"],
    sideEffects: ["رائحة زيت السمسم النفاذة (ريحة سمسم)"],
    contraindications: ["حساسية زيت السمسم"],
    dosage: "دهان 3-4 مرات يومياً (طبقة سميكة).",
    warnings: "✅ سحري في إعادة بناء الجلد ومنع تكوّن آثار للجروح والحروق. يجب أن يكون في كل مطبخ."
  },
  {

    name: "بانثينول",
    aliases: ["Panthenol", "بانثينول", "مرطب", "ماكرو بانثينول", "بأنثينول", "بإنثينول", "بانثىنول", "باانثينول", "بااانثينول", "باااانثينول", "باننثينول", "بانننثينول", "باننننثينول", "بانثثينول", "بانثثثينول", "بانثثثثينول", "بانثيينول", "بانثييينول", "بانثيييينول", "بانثيننول", "بانثينننول", "بانثيننننول", "بنثينول", "باثينول", "بانينول", "بانثيينول", "باانثينول", "بانثينولل", "بانثثينول", "بانثيننول"],
    scientificName: "D-Panthenol",
    category: "مرطب وملطف للجلد",
    price: "25-50 جنيه",
    uses: ["تشققات الجلد", "جفاف البشرة في الشتاء", "تشقق الحلمات", "ترطيب بعد الشمس"],
    sideEffects: ["لا يوجد"],
    contraindications: ["لا يوجد"],
    dosage: "دهان عند الحاجة.",
    warnings: "✅ آمن جداً ومناسب لكل الأعمار. أرخص وأحسن مرطب."
  },
  {

    name: "لاميزيل",
    aliases: ["Lamisil", "لاميزيل", "لمزيل", "كريم الفطريات", "لأميزيل", "لإميزيل", "لامىزيل", "لااميزيل", "لاااميزيل", "لااااميزيل", "لامميزيل", "لاممميزيل", "لامممميزيل", "لامييزيل", "لاميييزيل", "لامييييزيل", "لاميززيل", "لاميزززيل", "لاميززززيل", "لاميزييل", "لاميزيييل", "لاميزييييل", "لميزيل", "لايزيل", "لامزيل", "لامييزيل", "لاميزيلل", "لاميزييل", "لامييزيل", "لامميزيل"],
    scientificName: "Terbinafine",
    category: "مضاد للفطريات",
    price: "25-50 جنيه",
    uses: ["التينيا (بقع بيضاء أو بني)", "فطريات القدم (بين الأصابع)", "التسلخات الفطرية"],
    sideEffects: ["حرقان بسيط"],
    contraindications: ["لا يوجد"],
    dosage: "دهان مرتين يومياً لمدة أسبوعين.",
    warnings: "✅ يجب الاستمرار عليه حتى بعد اختفاء الأعراض بيومين لضمان عدم عودتها."
  },
  {

    name: "جافيسكون",
    aliases: ["Gaviscon", "جافيسكون", "افيسكون", "شراب الارتجاع", "جأفيسكون", "جإفيسكون", "جافىسكون", "جافيصكون", "جاافيسكون", "جااافيسكون", "جاااافيسكون", "جاففيسكون", "جافففيسكون", "جاففففيسكون", "جافييسكون", "جافيييسكون", "جافييييسكون", "جافيسسكون", "جافيسسسكون", "جافيسسسسكون", "جافيسككون", "جافيسكككون", "جافيسككككون", "جفيسكون", "جايسكون", "جافسكون", "جافيسكونن", "جافيسككون", "جافيسسكون", "جاففيسكون"],
    scientificName: "Sodium Alginate",
    category: "علاج ارتجاع المريء",
    price: "45 جنيه",
    uses: ["الارتجاع (الحرقان اللي بيطلع للزور)", "حموضة الحامل", "حرقان الصدر"],
    sideEffects: ["لا يوجد تقريباً"],
    contraindications: ["لا يوجد"],
    dosage: "ملعقة أو كيس بعد كل وجبة وقبل النوم.",
    warnings: "✅ يعمل طبقة عازلة تمنع الحمض من الارتجاع. أأمن دواء للحوامل."
  },
  {

    name: "فيسيرالجين",
    aliases: ["Visceralgine", "فيسرالجين", "فيسرالچين", "شراب المغص", "حقن المغص", "فيسيرألجين", "فيسيرإلجين", "فىسيرالجين", "فيصيرالجين", "فييسيرالجين", "فيييسيرالجين", "فييييسيرالجين", "فيسسيرالجين", "فيسسسيرالجين", "فيسسسسيرالجين", "فيسييرالجين", "فيسيييرالجين", "فيسييييرالجين", "فيسيررالجين", "فيسيرررالجين", "فيسيررررالجين", "فيسيراالجين", "فيسيرااالجين", "فيسيراااالجين", "فسيرالجين", "فييرالجين", "فيسييرالجين", "فيسيراالجين", "فيسيررالجين", "فيسيراالجين"],
    scientificName: "Tiemonium Methylsulfate",
    category: "مضاد للمغص والتقلصات",
    price: "25-50 جنيه",
    uses: ["مغص الدورة الشهرية", "مغص الكلى", "نزلات المعوية", "ألم البطن"],
    sideEffects: ["جفاف الفم"],
    contraindications: ["المياه الزرقاء في العين", "تضخم البروستاتا"],
    dosage: "قرص 3 مرات يومياً.",
    warnings: "✅ متوفر منه حقن سريعة جداً للمغص الكلوي والمغص الشديد."
  },
  {

    name: "أو كربون",
    aliases: ["Eucarbon", "اوكربون", "حبوب الفحم", "كربون", "او كربون", "أوو كربون", "أووو كربون", "أوووو كربون", "أو  كربون", "أو   كربون", "أو    كربون", "أو ككربون", "أو كككربون", "أو ككككربون", "أو كرربون", "أو كررربون", "أو كرررربون", "أو كرببون", "أو كربببون", "أو كرببببون", "أ كربون", "أوكربون", "أو ربون", "أو كرربون", "أو  كربون", "أوو كربون", "أو  كربون", "أوو كربون", "أو كرببون", "أو ككربون"],
    scientificName: "Vegetable Charcoal + Senna",
    category: "علاج الانتفاخ والغازات",
    price: "25-50 جنيه",
    uses: ["الغازات الشديدة", "الانتفاخ", "الإمساك البسيط", "تطهير المعدة"],
    sideEffects: ["براز أسود (طبيعي)"],
    contraindications: ["الإسهال"],
    dosage: "قرص أو قرصين 3 مرات يومياً.",
    warnings: "⚠️ يسود البراز. ممتاز للغازات. لا تأخذه مع أدوية أخرى في نفس الوقت (يمتص مفعولها)."
  },
  {

    name: "دافلون",
    aliases: ["Daflon", "دافلون", "دافولون", "برشام البواسير", "دواء الدوالي", "دأفلون", "دإفلون", "داافلون", "دااافلون", "داااافلون", "داففلون", "دافففلون", "داففففلون", "دافللون", "دافلللون", "دافللللون", "دافلوون", "دافلووون", "دافلوووون", "دافلونن", "دافلوننن", "دافلونننن", "دفلون", "دالون", "دافون", "داافلون", "داافلون", "داافلون", "دافللون", "داففلون"],
    scientificName: "Diosmin + Hesperidin",
    category: "مقوي للأوعية الدموية",
    price: "25-50 جنيه",
    uses: ["البواسير (النزيف والألم)", "دوالي الساقين", "النزيف الرحمي", "مقوي للشعيرات"],
    sideEffects: ["اضطراب معدة بسيط"],
    contraindications: ["لا يوجد"],
    dosage: "قرصين ظهراً وقرصين مساءً (في حالات البواسير الحادة تزيد الجرعة).",
    warnings: "✅ الدواء الأساسي للبواسير والدوالي في مصر. آمن."
  },
  {

    name: "كابوتن",
    aliases: ["Capoten", "كابوتن", "كبوتن", "قرص تحت اللسان", "كأبوتن", "كإبوتن", "كاابوتن", "كااابوتن", "كاااابوتن", "كاببوتن", "كابببوتن", "كاببببوتن", "كابووتن", "كابوووتن", "كابووووتن", "كابوتتن", "كابوتتتن", "كابوتتتتن", "كابوتنن", "كابوتننن", "كابوتنننن", "كاوتن", "كابتن", "كابوتتن", "كابوتنن", "كابوتتن", "كابوتنن", "كابوتتن", "كابوتتن", "كابووتن"],
    scientificName: "Captopril 25mg",
    category: "خافض للضغط (طوارئ)",
    price: "25-50 جنيه",
    uses: ["ارتفاع الضغط المفاجئ", "قصور القلب"],
    sideEffects: ["كحة جافة", "دوخة"],
    contraindications: ["الحمل", "ضيق الشريان الكلوي"],
    dosage: "قرص تحت اللسان عند ارتفاع الضغط الشديد (طوارئ).",
    warnings: "⚠️ قرص النجدة المصريين! يستخدم عند اللزوم لإنزال الضغط بسرعة."
  },
  {

    name: "دياميكرون",
    aliases: ["Diamicron", "دياميكرون", "ديمكرون", "حبوب السكر", "ديأميكرون", "ديإميكرون", "دىاميكرون", "ديياميكرون", "دييياميكرون", "ديييياميكرون", "ديااميكرون", "دياااميكرون", "ديااااميكرون", "ديامميكرون", "دياممميكرون", "ديامممميكرون", "ديامييكرون", "دياميييكرون", "ديامييييكرون", "دياميككرون", "دياميكككرون", "دياميككككرون", "داميكرون", "ديميكرون", "ديايكرون", "ديامميكرون", "دياميكروون", "دياميككرون", "ديياميكرون", "دياميكررون"],
    scientificName: "Gliclazide",
    category: "علاج السكر (النوع الثاني)",
    price: "25-50 جنيه",
    uses: ["ضبط سكر الدم", "تحفيز البنكرياس"],
    sideEffects: ["هبوط السكر (لو لم تأكل)", "زيادة الوزن قليلاً"],
    contraindications: ["السكر النوع الأول", "قصور الكلى الشديد"],
    dosage: "قرص مع الإفطار.",
    warnings: "⚠️ يجب الأكل جيداً بعده لتجنب هبوط السكر."
  },
  {

    name: "أتور",
    aliases: ["Ator", "اتور", "أطور", "دواء الكوليسترول", "أتتور", "أتتتور", "أتتتتور", "أتوور", "أتووور", "أتوووور", "أتورر", "أتوررر", "أتورررر", "أور", "أتر", "أتوور", "أتوور", "أتورر", "أتوور", "أتورر", "أتتور", "أتتور", "أتوور", "أتورر", "أتوور", "أتورر", "أتورر", "أتورر", "أتوور", "أتورر"],
    scientificName: "Atorvastatin",
    category: "خافض للكوليسترول والدهون",
    price: "25-50 جنيه",
    uses: ["ارتفاع الكوليسترول", "الدهون الثلاثية", "وقاية القلب"],
    sideEffects: ["ألم في العضلات (تكسير)", "صداع"],
    contraindications: ["مرض كبدي نشط", "الحمل"],
    dosage: "قرص واحد مساءً.",
    warnings: "⚠️ قد يسبب ألماً في العضلات. يؤخذ ليلاً."
  },
  {

    name: "توبرين",
    aliases: ["Tobrin", "توبرين", "قطرة مضاد حيوي", "توبركس", "توبرىن", "تووبرين", "توووبرين", "تووووبرين", "توببرين", "توبببرين", "توببببرين", "توبررين", "توبرررين", "توبررررين", "توبريين", "توبرييين", "توبريييين", "توبرينن", "توبريننن", "توبرينننن", "تبرين", "تورين", "توبين", "توبرينن", "توببرين", "توبرينن", "توببرين", "توببرين", "توبرينن", "توببرين"],
    scientificName: "Tobramycin",
    category: "مضاد حيوي للعين",
    price: "25-50 جنيه",
    uses: ["التهاب العين البكتيري", "احمرار العين مع إفرازات (عماص)"],
    sideEffects: ["حرقان بسيط"],
    contraindications: ["الفطريات"],
    dosage: "نقطة كل 4 ساعات.",
    warnings: "✅ آمنة للأطفال. تعالج العين الملتهبة التي تفرز صديد."
  },
  {

    name: "أوتال",
    aliases: ["Otal", "اوتال", "نقط الودان", "قطرة الأذن", "أوتأل", "أوتإل", "أووتال", "أوووتال", "أووووتال", "أوتتال", "أوتتتال", "أوتتتتال", "أوتاال", "أوتااال", "أوتاااال", "أوتالل", "أوتاللل", "أوتالللل", "أتال", "أوال", "أوتل", "أوتالل", "أوتالل", "أووتال", "أوتاال", "أوتتال", "أوتاال", "أوتتال", "أووتال", "أوتتال"],
    scientificName: "Framycetin + Gramicidin + Dexamethasone",
    category: "قطرة للأذن (مضاد حيوي ومسكن)",
    price: "25-50 جنيه",
    uses: ["التهاب الأذن الخارجية", "ألم الأذن", "الهرش في الأذن"],
    sideEffects: ["لا يوجد"],
    contraindications: ["ثقب طبلة الأذن (مهم جداً التأكد)"],
    dosage: "3 نقط 3 مرات يومياً.",
    warnings: "⚠️ ممنوع استخدامها لو طبلة الأذن مخرومة."
  },
  {

    name: "سيتال",
    aliases: ["Cetal", "سيتال", "ستال", "نقط سيتال", "سيتال لبوس", "سيتأل", "سيتإل", "سىتال", "صيتال", "سييتال", "سيييتال", "سييييتال", "سيتتال", "سيتتتال", "سيتتتتال", "سيتاال", "سيتااال", "سيتاااال", "سيتالل", "سيتاللل", "سيتالللل", "سيال", "سيتل", "سيتاال", "سييتال", "سيتاال", "سيتاال", "سيتاال", "سييتال", "سيتتال"],
    scientificName: "Paracetamol",
    category: "خافض حرارة ومسكن للأطفال",
    price: "25-50 جنيه",
    uses: ["سخونة الرضع والأطفال", "بعد التطعيمات", "التسنين", "الصداع عند الأطفال"],
    sideEffects: ["آمن جداً بالجرعات الصحيحة"],
    contraindications: ["مشاكل الكبد الشديدة"],
    dosage: "النقط: نقطتين لكل كيلو من الوزن كل 6 ساعات. الشراب: حسب الوزن.",
    warnings: "✅ هو (الباراسيتامول) الآمن لحديثي الولادة. الجرعة الزائدة خطيرة على الكبد."
  },
  {

    name: "بروفين شراب",
    aliases: ["Brufen Syrup", "بروفين اطفال", "بروفن", "شراب السخونة", "بروفين شرأب", "بروفين شرإب", "بروفىن شراب", "برروفين شراب", "بررروفين شراب", "برررروفين شراب", "برووفين شراب", "بروووفين شراب", "برووووفين شراب", "بروففين شراب", "بروفففين شراب", "بروففففين شراب", "بروفيين شراب", "بروفييين شراب", "بروفيييين شراب", "بروفينن شراب", "بروفيننن شراب", "بروفينننن شراب", "بوفين شراب", "برفين شراب", "بروين شراب", "برروفين شراب", "بروفين  شراب", "بروفينن شراب", "بروفين شرراب", "برروفين شراب"],
    scientificName: "Ibuprofen 100mg/5ml",
    category: "خافض حرارة ومضاد التهاب",
    price: "18 جنيه",
    uses: ["السخونة العالية (التي لا تنزل بالسيتال)", "التهاب الحلق واللوز", "آلام التسنين الشديدة"],
    sideEffects: ["ألم بالمعدة لو أخذ على معدة فارغة"],
    contraindications: ["حساسية الصدر (الربو)", "الأطفال أقل من 6 شهور", "الجفاف"],
    dosage: "حسب الوزن (عادة نصف الوزن بالمللي كل 8 ساعات).",
    warnings: "⚠️ أقوى من السيتال في الحرارة العالية، لكن يجب أن تكون معدة الطفل ممتلئة."
  },
  {

    name: "دولفين",
    aliases: ["Dolphin", "دلفن", "لبوس دولفين", "دولفين 12.5", "دولفين 25", "دولفىن", "دوولفين", "دووولفين", "دوووولفين", "دوللفين", "دولللفين", "دوللللفين", "دولففين", "دولفففين", "دولففففين", "دولفيين", "دولفييين", "دولفيييين", "دولفينن", "دولفيننن", "دولفينننن", "دلفين", "دوفين", "دولين", "دوللفين", "دولفيين", "دوولفين", "دولففين", "دوللفين", "دوللفين"],
    scientificName: "Diclofenac Sodium",
    category: "لبوس مسكن وخافض حرارة قوي",
    price: "25-50 جنيه",
    uses: ["الحرارة العنيدة جداً", "آلام شديدة", "بعد العمليات (اللوز)"],
    sideEffects: ["قد يسبب مغص أو رغبة في التبرز"],
    contraindications: ["أقل من سنة (يفضل)", "حساسية الصدر"],
    dosage: "لبوسة واحدة عند اللزوم (تركيز 12.5 للرضع، 25 للأكبر).",
    warnings: "⚠️ سريع جداً في إنزال الحرارة، لكن لا تفرط في استخدامه."
  },
  {

    name: "بيبي ريست",
    aliases: ["Baby Rest", "بيبي رست", "نقط المغص", "بىبي ريست", "بيبي ريصت", "بييبي ريست", "بيييبي ريست", "بييييبي ريست", "بيببي ريست", "بيبببي ريست", "بيببببي ريست", "بيبيي ريست", "بيبييي ريست", "بيبيييي ريست", "بيبي  ريست", "بيبي   ريست", "بيبي    ريست", "بيبي رريست", "بيبي ررريست", "بيبي رررريست", "ببي ريست", "بيي ريست", "بيب ريست", "بيبي ريستت", "بيببي ريست", "بيبيي ريست", "بيبي ريستت", "بيببي ريست", "بيبي  ريست", "بيبي ريسست"],
    scientificName: "Simethicone",
    category: "طارد للغازات للرضع",
    price: "25-50 جنيه",
    uses: ["الانتفاخ", "مغص الرضع", "تراكم الغازات", "البكاء المستمر بسبب المغص"],
    sideEffects: ["لا يوجد (آمن تماماً)"],
    contraindications: ["لا يوجد"],
    dosage: "5-10 نقط قبل أو بعد الرضاعة.",
    warnings: "✅ دواء آمن، يعمل ميكانيكياً لتجميع فقاعات الغاز وخروجها."
  },
  {

    name: "دينتينوكس",
    aliases: ["Dentinox", "دنتينوكس", "جل التسنين", "دىنتينوكس", "دينتينوكص", "ديينتينوكس", "دييينتينوكس", "ديييينتينوكس", "ديننتينوكس", "دينننتينوكس", "ديننننتينوكس", "دينتتينوكس", "دينتتتينوكس", "دينتتتتينوكس", "دينتيينوكس", "دينتييينوكس", "دينتيييينوكس", "دينتيننوكس", "دينتينننوكس", "دينتيننننوكس", "ديتينوكس", "دينينوكس", "ديننتينوكس", "دينتينوكسس", "ديننتينوكس", "دينتينوكسس", "ديينتينوكس", "دينتتينوكس", "دينتيينوكس", "دينتتينوكس"],
    scientificName: "Lidocaine + Chamomile",
    category: "جل مسكن لآلام التسنين",
    price: "25-50 جنيه",
    uses: ["آلام اللثة عند التسنين", "التهاب اللثة البسيط"],
    sideEffects: ["تنميل بسيط في الفم"],
    contraindications: ["لا يوجد"],
    dosage: "دهان جزء صغير على اللثة بأصبع نظيف.",
    warnings: "✅ يهدئ الطفل فوراً."
  },
  {

    name: "فيسرالجين شراب",
    aliases: ["Visceralgine Syrup", "فيسرالجين اطفال", "دواء المغص", "فيسرألجين شراب", "فيسرإلجين شراب", "فىسرالجين شراب", "فيصرالجين شراب", "فييسرالجين شراب", "فيييسرالجين شراب", "فييييسرالجين شراب", "فيسسرالجين شراب", "فيسسسرالجين شراب", "فيسسسسرالجين شراب", "فيسررالجين شراب", "فيسرررالجين شراب", "فيسررررالجين شراب", "فيسراالجين شراب", "فيسرااالجين شراب", "فيسراااالجين شراب", "فيسراللجين شراب", "فيسرالللجين شراب", "فيسراللللجين شراب", "فسرالجين شراب", "فيرالجين شراب", "فيسالجين شراب", "فيسرالجينن شراب", "فيسرالجين شرابب", "فيسرالجين شرراب", "فيسراللجين شراب", "فيسرالجين  شراب"],
    scientificName: "Tiemonium Methylsulfate",
    category: "مضاد للتقلصات والمغص",
    price: "25-50 جنيه",
    uses: ["المغص المعوي للأطفال", "القيء المصاحب للمغص", "النزلات المعوية"],
    sideEffects: ["جفاف الفم"],
    contraindications: ["الجلوكوما"],
    dosage: "ملعقة صغيرة 3 مرات يومياً (حسب الوزن).",
    warnings: "✅ الساحر في توقيف المغص عند الأطفال الأكبر سناً (ليس الرضع)."
  },
  {

    name: "زيرتك نقط",
    aliases: ["Zyrtec Drops", "زيرتك اطفال", "نقط الحساسية", "زىرتك نقط", "زييرتك نقط", "زيييرتك نقط", "زييييرتك نقط", "زيررتك نقط", "زيرررتك نقط", "زيررررتك نقط", "زيرتتك نقط", "زيرتتتك نقط", "زيرتتتتك نقط", "زيرتكك نقط", "زيرتككك نقط", "زيرتكككك نقط", "زيرتك  نقط", "زيرتك   نقط", "زيرتك    نقط", "زرتك نقط", "زيتك نقط", "زيرك نقط", "زيرتكك نقط", "زيرتكك نقط", "زيرتك ننقط", "زيرتك نققط", "زييرتك نقط", "زيرتك نقطط", "زيرتك ننقط", "زيرتك نقطط"],
    scientificName: "Cetirizine",
    category: "مضاد للحساسية والرشح",
    price: "25-50 جنيه",
    uses: ["الرشح والزكام", "حساسية الأنف", "الهرش والحساسية الجلدية"],
    sideEffects: ["نعاس خفيف"],
    contraindications: ["أقل من سنتين (إلا باستشارة طبيب)"],
    dosage: "5 نقط مرة واحدة مساءً (أو حسب العمر).",
    warnings: "✅ ممتاز للبرد والرشح عند الأطفال ويساعدهم على النوم."
  },
  {

    name: "ميكوجيل",
    aliases: ["Miconaz", "ميكوناز", "جل الفطريات", "ميكوجل", "مىكوجيل", "مييكوجيل", "ميييكوجيل", "مييييكوجيل", "ميككوجيل", "ميكككوجيل", "ميككككوجيل", "ميكووجيل", "ميكوووجيل", "ميكووووجيل", "ميكوججيل", "ميكوجججيل", "ميكوججججيل", "ميكوجييل", "ميكوجيييل", "ميكوجييييل", "مكوجيل", "ميوجيل", "ميكجيل", "ميكووجيل", "ميكوججيل", "ميكوججيل", "ميكوجيلل", "ميكوججيل", "ميككوجيل", "مييكوجيل"],
    scientificName: "Miconazole",
    category: "جل للفطريات الفم",
    price: "25-50 جنيه",
    uses: ["فطريات الفم (اللسان الأبيض)", "تقرحات الفم الفطرية"],
    sideEffects: ["لا يوجد"],
    contraindications: ["لا يوجد"],
    dosage: "دهان داخل الفم 3-4 مرات يومياً.",
    warnings: "✅ للأطفال والرضع: ضع كمية صغيرة ولا تجعل الطفل يبلع كمية كبيرة مرة واحدة."
  },
  {

    name: "فيوسيدين",
    aliases: ["Fucidin", "فيوسيدين", "ابو اسد", "مرهم فيوسيدين", "كريم الاسد", "فىوسيدين", "فيوصيدين", "فييوسيدين", "فيييوسيدين", "فييييوسيدين", "فيووسيدين", "فيوووسيدين", "فيووووسيدين", "فيوسسيدين", "فيوسسسيدين", "فيوسسسسيدين", "فيوسييدين", "فيوسيييدين", "فيوسييييدين", "فيوسيددين", "فيوسيدددين", "فيوسيددددين", "فوسيدين", "فيسيدين", "فيويدين", "فيوسييدين", "فييوسيدين", "فيوسيديين", "فيوسيدينن", "فيوسييدين"],
    scientificName: "Fusidic Acid",
    category: "مضاد حيوي موضعي",
    price: "25-50 جنيه",
    uses: ["الجروح الملوثة", "الدمامل", "حب الشباب", "بعد العمليات والخياطة", "التهاب حول الأظافر"],
    sideEffects: ["حكة بسيطة نادرة"],
    contraindications: ["لا يوجد"],
    dosage: "دهان 2-3 مرات يومياً.",
    warnings: "✅ الأشهر في مصر. (الأحمر كريم سريع الامتصاص، البرتقالي مرهم زيتي للجروح الجافة)."
  },
  {

    name: "فيوسيكورت",
    aliases: ["Fucicort", "فيوسيكورت", "ابو اسد واحمر", "فيوسي كورت", "فىوسيكورت", "فيوصيكورت", "فييوسيكورت", "فيييوسيكورت", "فييييوسيكورت", "فيووسيكورت", "فيوووسيكورت", "فيووووسيكورت", "فيوسسيكورت", "فيوسسسيكورت", "فيوسسسسيكورت", "فيوسييكورت", "فيوسيييكورت", "فيوسييييكورت", "فيوسيككورت", "فيوسيكككورت", "فيوسيككككورت", "فوسيكورت", "فيسيكورت", "فيويكورت", "فيوسيكوررت", "فيوسيكوورت", "فيوسيككورت", "فيوسيككورت", "فيوسيكوورت", "فيووسيكورت"],
    scientificName: "Fusidic Acid + Betamethasone",
    category: "مضاد حيوي + كورتيزون",
    price: "25-50 جنيه",
    uses: ["الالتهابات الجلدية الشديدة المصحوبة بعدوى", "الإكزيما الملتهبة", "التسلخات الشديدة", "لدغات الحشرات المتورمة"],
    sideEffects: ["ترقق الجلد (استخدام طويل)"],
    contraindications: ["حب الشباب الفيروسي", "الاستخدام الطويل"],
    dosage: "مرتين يومياً لمدة 5 أيام.",
    warnings: "⚠️ يختلف عن الفيوسيدين العادي لاحتوائه على كورتيزون. لا يستخدم لفترات طويلة."
  },
  {

    name: "هيموكلار",
    aliases: ["Hemoclar", "هيموكلار", "كريم الكدمات", "مرهم الزرقان", "هيموكلأر", "هيموكلإر", "ةيموكلار", "هىموكلار", "هييموكلار", "هيييموكلار", "هييييموكلار", "هيمموكلار", "هيممموكلار", "هيمممموكلار", "هيمووكلار", "هيموووكلار", "هيمووووكلار", "هيموككلار", "هيموكككلار", "هيموككككلار", "هيموكللار", "هيموكلللار", "هيموكللللار", "هموكلار", "هيوكلار", "هيمكلار", "هيمموكلار", "هيموكللار", "هيموكلاار", "هيموكللار"],
    scientificName: "Pentosan Polysulfate",
    category: "علاج الكدمات والتورم",
    price: "25-50 جنيه",
    uses: ["الكدمات (الزرقان)", "التورم بعد الخبطات", "التواء المفاصل", "مكان الحقن المتورم"],
    sideEffects: ["حساسية جلدية نادرة"],
    contraindications: ["الجروح المفتوحة (ممنوع)"],
    dosage: "دهان 2-4 مرات يومياً مع تدليك خفيف.",
    warnings: "✅ ممتاز للأطفال بعد الوقعات. ممنوع وضعه على جرح ينزف."
  },
  {

    name: "كيناكومب",
    aliases: ["Kenacomb", "كيناكومب", "كينا كومب", "مرهم التسلخات", "المرهم الاصفر", "كينأكومب", "كينإكومب", "كىناكومب", "كييناكومب", "كيييناكومب", "كييييناكومب", "كينناكومب", "كيننناكومب", "كينننناكومب", "كينااكومب", "كيناااكومب", "كينااااكومب", "كيناككومب", "كيناكككومب", "كيناككككومب", "كيناكوومب", "كيناكووومب", "كيناكوووومب", "كناكومب", "كياكومب", "كينكومب", "كييناكومب", "كيناكوومب", "كينااكومب", "كيناككومب"],
    scientificName: "Nystatin + Neomycin + Gramicidin + Triamcinolone",
    category: "كريم شامل (مضاد فطريات + بكتيريا + التهاب)",
    price: "25-50 جنيه",
    uses: ["التسلخات الشديدة", "التهابات الحفاضات (بحذر)", "حكة الجلد الشديدة", "بين الفخذين"],
    sideEffects: ["أعراض الكورتيزون الموضعي"],
    contraindications: ["الاستخدام الطويل", "مساحات واسعة من الجسم"],
    dosage: "مرتين يومياً.",
    warnings: "⚠️ السحر المصري، لكن احذر استخدامه كـ 'كريم حفاظات يومي' بسبب الكورتيزون."
  },
  {

    name: "ديرماتين",
    aliases: ["Dermatin", "ديرماتين", "درماتين", "نقط فطريات", "ديرمأتين", "ديرمإتين", "دىرماتين", "دييرماتين", "ديييرماتين", "دييييرماتين", "ديررماتين", "ديرررماتين", "ديررررماتين", "ديرمماتين", "ديرممماتين", "ديرمممماتين", "ديرمااتين", "ديرماااتين", "ديرمااااتين", "ديرماتتين", "ديرماتتتين", "ديرماتتتتين", "ديماتين", "ديراتين", "دييرماتين", "ديرماتتين", "دييرماتين", "ديرمااتين", "ديرماتينن", "ديررماتين"],
    scientificName: "Clotrimazole",
    category: "مضاد للفطريات",
    price: "25-50 جنيه",
    uses: ["فطريات الجلد (التينيا)", "فطريات القدم (بين الأصابع)", "التسلخات الفطرية"],
    sideEffects: ["حرقان بسيط"],
    contraindications: ["لا يوجد"],
    dosage: "دهان مرتين يومياً.",
    warnings: "✅ رخيص وفعال جداً للفطريات."
  },
  {

    name: "لونا",
    aliases: ["Luna", "لونا", "كريم لونا", "مرطب لونا", "لونأ", "لونإ", "لوونا", "لووونا", "لوووونا", "لوننا", "لونننا", "لوننننا", "لوناا", "لونااا", "لوناااا", "لنا", "لوا", "لوناا", "لوننا", "لوناا", "لوننا", "لوناا", "لوناا", "لوننا", "لوننا", "لوننا", "لوونا", "لوونا", "لوناا", "لوناا"],
    scientificName: "Cocoa Butter + Glycerin",
    category: "مرطب للتشققات",
    price: "25-50 جنيه",
    uses: ["تشققات الكعبين", "جفاف اليدين", "تشقق الشفاه"],
    sideEffects: ["لا يوجد"],
    contraindications: ["لا يوجد"],
    dosage: "دهان عند الحاجة.",
    warnings: "✅ الحل الشعبي الأول لتشققات الرجل في الشتاء."
  },
  {

    name: "بريدوكايين",
    aliases: ["Pridocaine", "بريدوكايين", "كريم بنج", "مخدر موضعي", "بريدوكأيين", "بريدوكإيين", "برىدوكايين", "برريدوكايين", "بررريدوكايين", "برررريدوكايين", "برييدوكايين", "بريييدوكايين", "برييييدوكايين", "بريددوكايين", "بريدددوكايين", "بريددددوكايين", "بريدووكايين", "بريدوووكايين", "بريدووووكايين", "بريدوككايين", "بريدوكككايين", "بريدوككككايين", "بيدوكايين", "بردوكايين", "بريوكايين", "بريدوككايين", "بريدووكايين", "بريدووكايين", "بريدوكاايين", "برريدوكايين"],
    scientificName: "Lidocaine + Prilocaine",
    category: "مخدر موضعي",
    price: "25-50 جنيه",
    uses: ["تخدير الجلد قبل إزالة الشعر", "قبل الحقن المؤلمة", "البواسير المؤلمة", "الحروق البسيطة"],
    sideEffects: ["تنميل", "احمرار بسيط"],
    contraindications: ["الجروح المفتوحة الكبيرة"],
    dosage: "يوضع طبقة سميكة قبل الإجراء بـ 30-60 دقيقة.",
    warnings: "✅ مشهور جداً عند السيدات."
  },
  {

    name: "فولتارين حقن",
    aliases: ["Voltaren Amp", "فولترين حقن", "حقنة مسكنة", "حقنة العظم", "فولتأرين حقن", "فولتإرين حقن", "فولتارىن حقن", "فوولتارين حقن", "فووولتارين حقن", "فوووولتارين حقن", "فوللتارين حقن", "فولللتارين حقن", "فوللللتارين حقن", "فولتتارين حقن", "فولتتتارين حقن", "فولتتتتارين حقن", "فولتاارين حقن", "فولتااارين حقن", "فولتاااارين حقن", "فولتاررين حقن", "فولتارررين حقن", "فولتاررررين حقن", "فلتارين حقن", "فوتارين حقن", "فولارين حقن", "فولتارين حقنن", "فوولتارين حقن", "فولتاررين حقن", "فولتاارين حقن", "فولتارين  حقن"],
    scientificName: "Diclofenac Sodium 75mg",
    category: "مسكن قوي جداً (حقن)",
    price: "35 جنيه",
    uses: ["المغص الكلوي (الحصوات)", "آلام الظهر الحادة (الديسك)", "بعد العمليات", "ألم الكسور"],
    sideEffects: ["ألم بالمعدة", "حساسية (يجب عمل اختبار أحياناً)"],
    contraindications: ["قرحة المعدة", "الربو", "مرضى الكلى"],
    dosage: "حقنة عضل عند اللزوم (مرة واحدة يومياً).",
    warnings: "⚠️ سريعة جداً لكن لا تكرر كثيراً خوفاً على الكلى."
  },
  {

    name: "كولشيسين",
    aliases: ["Colchicine", "كولشيسين", "فوار النقرس", "دواء النقرس", "كولشىسين", "كولشيصين", "كوولشيسين", "كووولشيسين", "كوووولشيسين", "كوللشيسين", "كولللشيسين", "كوللللشيسين", "كولششيسين", "كولشششيسين", "كولششششيسين", "كولشييسين", "كولشيييسين", "كولشييييسين", "كولشيسسين", "كولشيسسسين", "كولشيسسسسين", "كلشيسين", "كوشيسين", "كوليسين", "كوللشيسين", "كولشيسينن", "كوللشيسين", "كولشييسين", "كولشيسينن", "كوللشيسين"],
    scientificName: "Colchicine 500mcg",
    category: "علاج النقرس وحمى البحر المتوسط",
    price: "25-50 جنيه",
    uses: ["نوبات النقرس الحادة", "حمى البحر المتوسط العائلية"],
    sideEffects: ["إسهال شديد (علامة الجرعة العالية)", "مغص"],
    contraindications: ["الفشل الكلوي الشديد"],
    dosage: "حسب تعليمات الطبيب (غالباً قرص عند النوبة وتكرر).",
    warnings: "⚠️ الإسهال هو العرض الجانبي الأساسي."
  },
  {

    name: "لصقة النمر",
    aliases: ["Tiger Balm Plaster", "لزقة النمر", "لصقة الظهر", "اللصقة الحارة", "لصقة ألنمر", "لصقة إلنمر", "لصقه النمر", "لسقة النمر", "لصصقة النمر", "لصصصقة النمر", "لصصصصقة النمر", "لصققة النمر", "لصقققة النمر", "لصققققة النمر", "لصقةة النمر", "لصقةةة النمر", "لصقةةةة النمر", "لصقة  النمر", "لصقة   النمر", "لصقة    النمر", "لصقة االنمر", "لصقة ااالنمر", "لصقة اااالنمر", "لقة النمر", "لصة النمر", "لصق النمر", "لصقة اللنمر", "لصقة الننمر", "لصقة  النمر", "لصقة  النمر"],
    scientificName: "Capsicum + Menthol + Camphor",
    category: "لصقة مسكنة موضعية",
    price: "25-50 جنيه",
    uses: ["آلام الظهر (القطنية)", "آلام الكتف", "الشد العضلي"],
    sideEffects: ["حرقان في الجلد (طبيعي)", "احمرار"],
    contraindications: ["الجلد المجروح", "الحساسية"],
    dosage: "تلصق على مكان الألم وتترك 12-24 ساعة.",
    warnings: "✅ أشهر حل شعبي لآلام الظهر. تسخن المكان جداً."
  },
  {

    name: "راني",
    aliases: ["Rani", "راني فوار", "فوار الحموضة", "رأني", "رإني", "رانى", "رااني", "راااني", "رااااني", "رانني", "راننني", "رانننني", "رانيي", "رانييي", "رانيييي", "رني", "راي", "رااني", "رانيي", "رانيي", "رااني", "رانيي", "رانيي", "رانني", "رانيي", "رانني", "رانني", "رااني", "رانني", "رااني"],
    scientificName: "Ranitidine",
    category: "فوار للحموضة",
    price: "25-50 جنيه",
    uses: ["حرقة المعدة", "الحموضة بعد الأكل"],
    sideEffects: ["نادرة"],
    contraindications: ["لا يوجد تقريباً"],
    dosage: "كيس على نصف كوب ماء عند اللزوم.",
    warnings: "✅ سريع المفعول ورخيص جداً."
  },
  {

    name: "موتيليوم",
    aliases: ["Motilium", "موتيليوم", "موتليم", "دواء الترجيع", "موتىليوم", "مووتيليوم", "موووتيليوم", "مووووتيليوم", "موتتيليوم", "موتتتيليوم", "موتتتتيليوم", "موتييليوم", "موتيييليوم", "موتييييليوم", "موتيلليوم", "موتيللليوم", "موتيلللليوم", "موتيلييوم", "موتيليييوم", "موتيلييييوم", "متيليوم", "مويليوم", "موتليوم", "موتيلييوم", "موتيلليوم", "مووتيليوم", "موتتيليوم", "موتتيليوم", "موتيليووم", "موتييليوم"],
    scientificName: "Domperidone",
    category: "مضاد للقيء ومنظم لحركة المعدة",
    price: "32 جنيه",
    uses: ["الغثيان والقيء", "عسر الهضم", "الامتلاء بعد الأكل"],
    sideEffects: ["مغص بسيط"],
    contraindications: ["مشاكل القلب (عدم انتظام ضربات القلب)"],
    dosage: "قرص قبل الأكل بـ 15 دقيقة.",
    warnings: "⚠️ فعال جداً للغممان النفس."
  },
  {

    name: "سبازمو ديجستين",
    aliases: ["Spasmo Digestin", "سبازمو ديجستين", "مهضم ومسكن", "قرص الهضم", "سبأزمو ديجستين", "سبإزمو ديجستين", "سبازمو دىجستين", "صبازمو ديجستين", "سببازمو ديجستين", "سبببازمو ديجستين", "سببببازمو ديجستين", "سباازمو ديجستين", "سبااازمو ديجستين", "سباااازمو ديجستين", "سباززمو ديجستين", "سبازززمو ديجستين", "سباززززمو ديجستين", "سبازممو ديجستين", "سبازمممو ديجستين", "سبازممممو ديجستين", "سبازموو ديجستين", "سبازمووو ديجستين", "سبازموووو ديجستين", "سازمو ديجستين", "سبزمو ديجستين", "سبامو ديجستين", "سبازمو دديجستين", "سبازمو ديجستيين", "سبازمو ديجستتين", "سبازمو ديجستينن"],
    scientificName: "Digestive Enzymes + Dicyclomine",
    category: "مهضم ومضاد للتقلصات",
    price: "25-50 جنيه",
    uses: ["الانتفاخ بعد الأكل الدسم", "سوء الهضم", "القولون العصبي"],
    sideEffects: ["جفاف الفم"],
    contraindications: ["تضخم البروستاتا"],
    dosage: "قرص وسط الأكل أو بعده مباشرة.",
    warnings: "✅ الدواء الرسمي للعزومات والأكلات الثقيلة."
  },
  {

    name: "لاكسول",
    aliases: ["Laxol", "لاكسول", "بيقولاكس", "نقط الامساك", "لأكسول", "لإكسول", "لاكصول", "لااكسول", "لاااكسول", "لااااكسول", "لاككسول", "لاكككسول", "لاككككسول", "لاكسسول", "لاكسسسول", "لاكسسسسول", "لاكسوول", "لاكسووول", "لاكسوووول", "لاكسولل", "لاكسوللل", "لاكسولللل", "لكسول", "لاسول", "لاكول", "لاكسوول", "لااكسول", "لاكسسول", "لاكسولل", "لاكسسول"],
    scientificName: "Sodium Picosulfate",
    category: "ملين نقط",
    price: "25-50 جنيه",
    uses: ["الإمساك العارض"],
    sideEffects: ["مغص"],
    contraindications: ["آلام البطن غير المشخصة"],
    dosage: "10-15 نقطة مساءً.",
    warnings: "⚠️ لا تتعود عليها حتى لا تكسل الأمعاء."
  },
  {

    name: "اسبوسيد",
    aliases: ["Aspocid", "اسبوسيد اطفال", "اسبوسيد 75", "اسبرين السيولة", "أسبوسيد", "إسبوسيد", "اسبوسىد", "اصبوسيد", "اسسبوسيد", "اسسسبوسيد", "اسسسسبوسيد", "اسببوسيد", "اسبببوسيد", "اسببببوسيد", "اسبووسيد", "اسبوووسيد", "اسبووووسيد", "اسبوسسيد", "اسبوسسسيد", "اسبوسسسسيد", "اسبوسييد", "اسبوسيييد", "اسبوسييييد", "ابوسيد", "اسوسيد", "اسبسيد", "اسبوسييد", "اسسبوسيد", "اسبوسييد", "اسسبوسيد"],
    scientificName: "Acetylsalicylic Acid 75mg",
    category: "مسيل للدم (وقاية)",
    price: "25-50 جنيه",
    uses: ["الوقاية من الجلطات", "مرضى القلب والضغط", "للحوامل (بعض الحالات)"],
    sideEffects: ["حموضة", "سيولة الدم (نزيف من الأنف)"],
    contraindications: ["قرحة المعدة", "الربو"],
    dosage: "قرص واحد يومياً بعد الغداء.",
    warnings: "✅ المصريون يسمونه 'اسبوسيد أطفال' لكنه يستخدم للكبار للسيولة."
  },
  {

    name: "كابوتن",
    aliases: ["Capoten", "كابوتن", "كبوتن", "قرص تحت اللسان", "دواء الضغط العالي", "كأبوتن", "كإبوتن", "كاابوتن", "كااابوتن", "كاااابوتن", "كاببوتن", "كابببوتن", "كاببببوتن", "كابووتن", "كابوووتن", "كابووووتن", "كابوتتن", "كابوتتتن", "كابوتتتتن", "كابوتنن", "كابوتننن", "كابوتنننن", "كاوتن", "كابتن", "كاابوتن", "كاابوتن", "كابووتن", "كاببوتن", "كابوتنن", "كابوتنن"],
    scientificName: "Captopril 25mg",
    category: "خافض للضغط (طوارئ)",
    price: "25-50 جنيه",
    uses: ["ارتفاع الضغط المفاجئ", "قصور القلب"],
    sideEffects: ["كحة جافة", "طعم معدني"],
    contraindications: ["الحمل"],
    dosage: "قرص تحت اللسان عند الطوارئ (الضغط العالي جداً).",
    warnings: "⚠️ دواء الطوارئ في كل بيت مصري."
  },
  {

    name: "سيدوفاج",
    aliases: ["Cidophage", "سيدوفاج", "جلوكوفاج", "دواء السكر والتخسيس", "سيدوفأج", "سيدوفإج", "سىدوفاج", "صيدوفاج", "سييدوفاج", "سيييدوفاج", "سييييدوفاج", "سيددوفاج", "سيدددوفاج", "سيددددوفاج", "سيدووفاج", "سيدوووفاج", "سيدووووفاج", "سيدوففاج", "سيدوفففاج", "سيدوففففاج", "سيدوفااج", "سيدوفاااج", "سيدوفااااج", "سدوفاج", "سيوفاج", "سيدفاج", "سيدووفاج", "سييدوفاج", "سيدووفاج", "سيدوفااج"],
    scientificName: "Metformin",
    category: "علاج السكر",
    price: "50 جنيه",
    uses: ["السكر من النوع الثاني", "تكيس المبايض", "مقاومة الأنسولين", "التخسيس (استخدام شائع)"],
    sideEffects: ["غثيان", "إسهال", "طعم معدني"],
    contraindications: ["فشل كلوي"],
    dosage: "حسب ارشادات الطبيب (عادة وسط أو بعد الأكل).",
    warnings: "✅ الدواء الأول لمريض السكر."
  },
  {

    name: "أتور",
    aliases: ["Ator", "اتور", "أطور", "دواء الكوليسترول", "ليبيتور", "أتتور", "أتتتور", "أتتتتور", "أتوور", "أتووور", "أتوووور", "أتورر", "أتوررر", "أتورررر", "أور", "أتر", "أتوور", "أتوور", "أتورر", "أتورر", "أتورر", "أتورر", "أتوور", "أتوور", "أتورر", "أتتور", "أتورر", "أتورر", "أتوور", "أتورر"],
    scientificName: "Atorvastatin",
    category: "خافض للكوليسترول",
    price: "25-50 جنيه",
    uses: ["ارتفاع الكوليسترول والدهون الثلاثية", "وقاية لمرضى القلب"],
    sideEffects: ["ألم في العضلات (تكسير)"],
    contraindications: ["مرض كبدي نشط"],
    dosage: "قرص واحد مساءً.",
    warnings: "⚠️ يؤخذ ليلاً فقط."
  },
  {

    name: "اوتريفين",
    aliases: ["Otrivin", "اوترفين", "نقط الزكام", "بخاخ الانف", "أوتريفين", "إوتريفين", "اوترىفين", "اووتريفين", "اوووتريفين", "اووووتريفين", "اوتتريفين", "اوتتتريفين", "اوتتتتريفين", "اوترريفين", "اوتررريفين", "اوترررريفين", "اوترييفين", "اوتريييفين", "اوترييييفين", "اوتريففين", "اوتريفففين", "اوتريففففين", "اتريفين", "اوريفين", "اوتيفين", "اووتريفين", "اوتريفيين", "اووتريفين", "اوترييفين", "اوتتريفين"],
    scientificName: "Xylometazoline",
    category: "مزيل لاحتقان الأنف",
    price: "25-50 جنيه",
    uses: ["انسداد الأنف (الزكام)", "الجيوب الأنفية"],
    sideEffects: ["جفاف الأنف", "تعود (إدمان)"],
    contraindications: ["الاستخدام لأكثر من 5 أيام"],
    dosage: "بخة أو نقطتين في كل فتحة 3 مرات يومياً.",
    warnings: "⚠️⚠️ تحذير هام: لا تستخدمها أكثر من 5 أيام متواصلة وإلا سيتعود أنفك عليها وتزداد الحالة سوءاً."
  },
  {

    name: "توبرين",
    aliases: ["Tobrin", "توبرين", "قطرة مضاد حيوي", "توبركس", "توبرىن", "تووبرين", "توووبرين", "تووووبرين", "توببرين", "توبببرين", "توببببرين", "توبررين", "توبرررين", "توبررررين", "توبريين", "توبرييين", "توبريييين", "توبرينن", "توبريننن", "توبرينننن", "تبرين", "تورين", "توبين", "توبرينن", "توبررين", "توبررين", "توبررين", "توبريين", "توبريين", "توببرين"],
    scientificName: "Tobramycin",
    category: "مضاد حيوي للعين",
    price: "25-50 جنيه",
    uses: ["التهاب العين البكتيري", "العين الحمراء بصديد (عماص)"],
    sideEffects: ["حرقان بسيط"],
    contraindications: ["الفطريات"],
    dosage: "نقطة كل 4 ساعات.",
    warnings: "✅ آمنة للأطفال."
  },
  {

    name: "أوتال",
    aliases: ["Otal", "اوتال", "نقط الودان", "قطرة الأذن", "أوتأل", "أوتإل", "أووتال", "أوووتال", "أووووتال", "أوتتال", "أوتتتال", "أوتتتتال", "أوتاال", "أوتااال", "أوتاااال", "أوتالل", "أوتاللل", "أوتالللل", "أتال", "أوال", "أوتل", "أووتال", "أووتال", "أوتالل", "أوتاال", "أوتتال", "أووتال", "أووتال", "أوتاال", "أوتتال"],
    scientificName: "Framycetin + Gramicidin + Dexamethasone",
    category: "قطرة للأذن (مضاد حيوي ومسكن)",
    price: "25-50 جنيه",
    uses: ["التهاب الأذن الخارجية", "ألم الأذن", "الهرش في الأذن"],
    sideEffects: ["لا يوجد"],
    contraindications: ["ثقب طبلة الأذن (مهم جداً التأكد)"],
    dosage: "3 نقط 3 مرات يومياً.",
    warnings: "⚠️ ممنوع استخدامها لو طبلة الأذن مخرومة."
  },
  {

    name: "تيراميسين",
    aliases: ["Terramycin", "تيراميسين", "مرهم العين", "مرهم تيراميسين", "تيرأميسين", "تيرإميسين", "تىراميسين", "تيراميصين", "تييراميسين", "تيييراميسين", "تييييراميسين", "تيرراميسين", "تيررراميسين", "تيرررراميسين", "تيرااميسين", "تيراااميسين", "تيرااااميسين", "تيرامميسين", "تيراممميسين", "تيرامممميسين", "تيرامييسين", "تيراميييسين", "تيرامييييسين", "تراميسين", "تياميسين", "تيرميسين", "تيرامميسين", "تيرامييسين", "تيراميسينن", "تيرامييسين"],
    scientificName: "Oxytetracycline + Polymyxin B",
    category: "مرهم مضاد حيوي للعين",
    price: "25-50 جنيه",
    uses: ["التهابات العين", "الرمد", "الجفون الملتهبة"],
    sideEffects: ["زغللة مؤقتة (لأنه مرهم)"],
    contraindications: ["لا يوجد"],
    dosage: "يوضع داخل الجفن السفلي قبل النوم.",
    warnings: "✅ كلاسيكي ورخيص وفعال جداً."
  },
  {

    name: "اوبلكس",
    aliases: ["Oplex", "أوبلكس", "ابلكس", "دواء الكحة ابو معلقة", "شراب كحة", "إوبلكس", "اوبلكص", "اووبلكس", "اوووبلكس", "اووووبلكس", "اوببلكس", "اوبببلكس", "اوببببلكس", "اوبللكس", "اوبلللكس", "اوبللللكس", "اوبلككس", "اوبلكككس", "اوبلككككس", "اوبلكسس", "اوبلكسسس", "اوبلكسسسس", "اولكس", "اوبكس", "اوببلكس", "اووبلكس", "اوبللكس", "اووبلكس", "اوبلكسس", "اوببلكس"],
    scientificName: "Oxomemazine + Guaifenesin + Paracetamol",
    category: "شراب للكحة والبرد",
    price: "25-50 جنيه",
    uses: ["الكحة الجافة والمصحوبة ببلغم", "حساسية الصدر", "التهاب الشعب الهوائية"],
    sideEffects: ["نعاس (بييم)", "دوخة خفيفة"],
    contraindications: ["الأطفال أقل من 6 سنوات (يحتوي على مهدئ)", "قصور التنفس"],
    dosage: "ملعقة كبيرة 2-3 مرات يومياً.",
    warnings: "⚠️ يسبب النعاس لاحتوائه على مادة مضادة للحساسية. السكر فيه عالي لمرضى السكر."
  },
  {

    name: "برونشيكام",
    aliases: ["Bronchicum", "برونشيكم", "برنشيكام", "دواء كحة اعشاب", "برونشيكأم", "برونشيكإم", "برونشىكام", "بررونشيكام", "برررونشيكام", "بررررونشيكام", "بروونشيكام", "برووونشيكام", "بروووونشيكام", "بروننشيكام", "برونننشيكام", "بروننننشيكام", "برونششيكام", "برونشششيكام", "برونششششيكام", "برونشييكام", "برونشيييكام", "برونشييييكام", "بونشيكام", "بروشيكام", "بروونشيكام", "برونشيكاام", "بروننشيكام", "برونشييكام", "بررونشيكام", "برونشييكام"],
    scientificName: "Thyme + Primula (عشبة الزعتر)",
    category: "مذيب للبلغم ومهدئ للكحة (عشبي)",
    price: "25-50 جنيه",
    uses: ["الكحة المصحوبة ببلغم", "التهاب الشعب الهوائية", "الكحة الجافة البسيطة"],
    sideEffects: ["نادرة جداً (آمن)"],
    contraindications: ["لا يوجد تقريباً"],
    dosage: "ملعقة صغيرة 3 مرات يومياً.",
    warnings: "✅ دواء عشبي آمن جداً ومناسب للأطفال والكبار. طعمه مقبول."
  },
  {

    name: "أستيل سستايين",
    aliases: ["Acetylcystein", "ACC", "فوار استيل", "اكياس البلغم", "اي سي سي", "أستيل سستأيين", "أستيل سستإيين", "استيل سستايين", "أستىل سستايين", "أصتيل سستايين", "أسستيل سستايين", "أسسستيل سستايين", "أسسسستيل سستايين", "أستتيل سستايين", "أستتتيل سستايين", "أستتتتيل سستايين", "أستييل سستايين", "أستيييل سستايين", "أستييييل سستايين", "أستيلل سستايين", "أستيللل سستايين", "أستيلللل سستايين", "أستيل  سستايين", "أستيل   سستايين", "أستيل    سستايين", "أتيل سستايين", "أسيل سستايين", "أستل سستايين", "أستيل سسستايين", "أستيل سستاييين"],
    scientificName: "Acetylcysteine 200/600mg",
    category: "مذيب قوي للبلغم",
    price: "25-50 جنيه",
    uses: ["البلغم اللزج والكثيف", "المدخنين", "التهاب الجيوب الأنفية (مذيب للمخاط)", "حماية الكلى (قبل الأشعة بالصبغة)"],
    sideEffects: ["غثيان", "حموضة (لو أخذ على معدة فارغة)"],
    contraindications: ["قرحة المعدة النشطة", "الربو الشديد (قد يهيج القصبات)"],
    dosage: "كيس 600 مرة يومياً أو كيس 200 ثلاث مرات.",
    warnings: "⚠️ رائحته تشبه البيض الفاسد قليلاً (كبريت)، هذا طبيعي. يجب شرب ماء كثير معه."
  },
  {

    name: "توسكان",
    aliases: ["Tusskan", "تسكان", "توسكان شراب", "توسكأن", "توسكإن", "توصكان", "تووسكان", "توووسكان", "تووووسكان", "توسسكان", "توسسسكان", "توسسسسكان", "توسككان", "توسكككان", "توسككككان", "توسكاان", "توسكااان", "توسكاااان", "توسكانن", "توسكاننن", "توسكانننن", "توكان", "توسان", "تووسكان", "توسككان", "تووسكان", "توسسكان", "توسكانن", "توسككان", "توسسكان"],
    scientificName: "Dextromethorphan + Guaifenesin + Diphenhydramine",
    category: "شراب للكحة (جدول في بعض الصيدليات)",
    price: "25-50 جنيه",
    uses: ["الكحة الناشفة الشديدة", "الكحة ببلغم", "نزلات البرد"],
    sideEffects: ["نعاس شديد", "دوخة"],
    contraindications: ["الأطفال أقل من 6 سنوات", "القيادة"],
    dosage: "ملعقة واحدة عند اللزوم.",
    warnings: "⚠️ يسبب نعاس شديد. يُستخدم بحذر شديد لأنه يحتوي على مشتقات قد تسبب تعود."
  },
  {

    name: "لاري برو",
    aliases: ["Larypro", "لاريبيرو", "لاري برو", "شريط استحلاب", "برشام الزور", "لأري برو", "لإري برو", "لارى برو", "لااري برو", "لاااري برو", "لااااري برو", "لارري برو", "لاررري برو", "لارررري برو", "لاريي برو", "لارييي برو", "لاريييي برو", "لاري  برو", "لاري   برو", "لاري    برو", "لاري ببرو", "لاري بببرو", "لاري ببببرو", "لري برو", "لاي برو", "لار برو", "لااري برو", "لاري  برو", "لااري برو", "لاري  برو"],
    scientificName: "Lysozyme + Dequalinium",
    category: "أقراص استحلاب مطهرة",
    price: "25-50 جنيه",
    uses: ["التهاب الحلق واللوزتين", "آلام الزور", "بعد خلع الأسنان", "فطريات الفم"],
    sideEffects: ["لا يوجد تقريباً"],
    contraindications: ["حساسية البيض (يحتوي على ليزوزيم)"],
    dosage: "قرص استحلاب كل 2-3 ساعات.",
    warnings: "✅ أرخص وأشهر استحلاب في مصر. لا تمضغه، اتركه يذوب ببطء."
  },
  {

    name: "تانتوم وردي",
    aliases: ["Tantum Verde", "تنتام", "تانتوم مضمضة", "تانتوم استحلاب", "تأنتوم وردي", "تإنتوم وردي", "تانتوم وردى", "تاانتوم وردي", "تااانتوم وردي", "تاااانتوم وردي", "تاننتوم وردي", "تانننتوم وردي", "تاننننتوم وردي", "تانتتوم وردي", "تانتتتوم وردي", "تانتتتتوم وردي", "تانتووم وردي", "تانتوووم وردي", "تانتووووم وردي", "تانتومم وردي", "تانتوممم وردي", "تانتومممم وردي", "تنتوم وردي", "تاتوم وردي", "تانوم وردي", "تانتوم ورددي", "تاانتوم وردي", "تاانتوم وردي", "تانتومم وردي", "تاننتوم وردي"],
    scientificName: "Benzydamine",
    category: "مضاد التهاب ومسكن للحلق",
    price: "25-50 جنيه",
    uses: ["احتقان الزور الشديد", "التهاب اللثة", "قرح الفم"],
    sideEffects: ["تنميل بسيط في الفم (مخدر)"],
    contraindications: ["لا يوجد"],
    dosage: "مضمضة (بدون بلع) أو استحلاب 3 مرات يومياً.",
    warnings: "✅ يسكن الألم موضعياً. المضمضة ممتازة لغير القادرين على الاستحلاب."
  },
  {

    name: "بريزولين",
    aliases: ["Prisoline", "برزولين", "بريزولين زنك", "قطرة الاحمرار", "القطرة الزرقاء", "برىزولين", "برريزولين", "بررريزولين", "برررريزولين", "برييزولين", "بريييزولين", "برييييزولين", "بريززولين", "بريزززولين", "بريززززولين", "بريزوولين", "بريزووولين", "بريزوووولين", "بريزوللين", "بريزولللين", "بريزوللللين", "بيزولين", "بريولين", "بريزوولين", "بريزوولين", "برريزولين", "بريززولين", "بريزوليين", "بريزولينن", "برييزولين"],
    scientificName: "Naphazoline + Chlorpheniramine",
    category: "قطرة معقمة ومزيلة للاحتقان",
    price: "25-50 جنيه",
    uses: ["احمرار العين", "حكة العين البسيطة", "دخول تراب في العين", "حساسية العين"],
    sideEffects: ["حرقان لحظي", "اتساع حدقة العين"],
    contraindications: ["الجلوكوما (المياه الزرقاء)", "الاستخدام المستمر"],
    dosage: "نقطة أو نقطتين عند اللزوم.",
    warnings: "⚠️ لا تستخدمها لأكثر من 3-4 أيام متواصلة لأنها تسبب احمرار ارتدادي (الاحمرار يرجع أسوأ)."
  },
  {

    name: "ريفرش تيرز",
    aliases: ["Refresh Tears", "رفرش", "قطرة الجفاف", "دموع صناعية", "رىفرش تيرز", "رييفرش تيرز", "ريييفرش تيرز", "رييييفرش تيرز", "ريففرش تيرز", "ريفففرش تيرز", "ريففففرش تيرز", "ريفررش تيرز", "ريفرررش تيرز", "ريفررررش تيرز", "ريفرشش تيرز", "ريفرششش تيرز", "ريفرشششش تيرز", "ريفرش  تيرز", "ريفرش   تيرز", "ريفرش    تيرز", "رفرش تيرز", "ريرش تيرز", "ريفش تيرز", "ريفرش تيرزز", "ريفرش  تيرز", "رييفرش تيرز", "ريفرش تيررز", "ريففرش تيرز", "ريفرش تيرزز", "ريفرش  تيرز"],
    scientificName: "Carboxymethylcellulose",
    category: "قطرة مرطبة (بديل الدموع)",
    price: "25-50 جنيه",
    uses: ["جفاف العين", "إجهاد الكمبيوتر والموبايل", "بعد عمليات الليزك", "حرقان العين من الجفاف"],
    sideEffects: ["لا يوجد (آمنة جداً)"],
    contraindications: ["لا يوجد"],
    dosage: "عند اللزوم (يمكن استخدامها مرات كثيرة).",
    warnings: "✅ آمنة تماماً، تشبه الدموع الطبيعية. مناسبة جداً للطلاب والمبرمجين."
  },
  {

    name: "ديكساترول",
    aliases: ["Dexatrol", "دكستارول", "دكسترول", "ديكسأترول", "ديكسإترول", "دىكساترول", "ديكصاترول", "دييكساترول", "ديييكساترول", "دييييكساترول", "ديككساترول", "ديكككساترول", "ديككككساترول", "ديكسساترول", "ديكسسساترول", "ديكسسسساترول", "ديكسااترول", "ديكساااترول", "ديكسااااترول", "ديكساتترول", "ديكساتتترول", "ديكساتتتترول", "دكساترول", "ديساترول", "ديكاترول", "دييكساترول", "ديكسااترول", "ديككساترول", "ديكساترولل", "ديكسساترول"],
    scientificName: "Dexamethasone + Neomycin + Polymyxin",
    category: "قطرة مضاد حيوي + كورتيزون",
    price: "25-50 جنيه",
    uses: ["التهاب العين الشديد", "بعد عمليات العين", "الرمد البكتيري القوي"],
    sideEffects: ["ارتفاع ضغط العين (مع الاستخدام الطويل)"],
    contraindications: ["الفطريات", "قرحة القرنية (خطير جداً)"],
    dosage: "حسب وصفة الطبيب.",
    warnings: "⚠️⚠️ ممنوع استخدامها من نفسك! الكورتيزون في العين خطر لو عندك قرحة أو فيروس (ممكن يسبب عمى)."
  },
  {

    name: "إندرال",
    aliases: ["Inderal", "اندرال", "إيندرال", "دواء ضربات القلب", "برشام الامتحانات", "إندرأل", "إندرإل", "إنندرال", "إننندرال", "إنننندرال", "إنددرال", "إندددرال", "إنددددرال", "إندررال", "إندرررال", "إندررررال", "إندراال", "إندرااال", "إندراااال", "إندرالل", "إندراللل", "إندرالللل", "إدرال", "إنرال", "إندال", "إنددرال", "إنندرال", "إنندرال", "إنددرال", "إندرالل"],
    scientificName: "Propranolol 10mg/40mg",
    category: "نظم القلب والقلق",
    price: "25-50 جنيه",
    uses: ["سرعة ضربات القلب", "الخفقان", "القلق والتوتر (الامتحانات)", "الوقاية من الصداع النصفي"],
    sideEffects: ["برودة الأطراف", "أحلام مزعجة (كوابيس)", "إرهاق"],
    contraindications: ["الربو (ممنوع نهائياً)", "مرضى السكر (يخفي أعراض الهبوط)", "بطء القلب"],
    dosage: "10-40mg حسب الحالة.",
    warnings: "⚠️ ممنوع لمرضى حساسية الصدر (يقفل الشعب الهوائية). لا تتوقف عنه فجأة."
  },
  {

    name: "نيتروماك",
    aliases: ["Nitromak", "نيتروماك ريتارد", "نيتروجلسرين", "كبسولة القلب", "نيترومأك", "نيترومإك", "نىتروماك", "نييتروماك", "نيييتروماك", "نييييتروماك", "نيتتروماك", "نيتتتروماك", "نيتتتتروماك", "نيترروماك", "نيتررروماك", "نيترررروماك", "نيترووماك", "نيتروووماك", "نيترووووماك", "نيترومماك", "نيتروممماك", "نيترومممماك", "نتروماك", "نيروماك", "نيتوماك", "نيترروماك", "نيتتروماك", "نيترومماك", "نيتروماكك", "نيترومااك"],
    scientificName: "Nitroglycerin",
    category: "موسع للشرايين (للذبحة)",
    price: "25-50 جنيه",
    uses: ["آلام الذبحة الصدرية", "قصور الشرايين التاجية", "ألم الصدر"],
    sideEffects: ["صداع شديد جداً (مشهور)", "هبوط الضغط", "احمرار الوجه"],
    contraindications: ["منشطات الضعف الجنسي (فياجرا وغيرها) - خطر الموت", "انخفاض الضغط الشديد"],
    dosage: "كبسولة صباحاً ومساءً.",
    warnings: "⚠️⚠️⚠️ ممنوع منعاً باتاً مع الفياجرا أو السياليس (يسبب هبوط حاد في الضغط قد يؤدي للوفاة). يسبب صداع قوي."
  },
  {

    name: "لانوتشين",
    aliases: ["Lanoxin", "لانوكسين", "ديجوكسين", "دواء تقوية القلب", "لأنوتشين", "لإنوتشين", "لانوتشىن", "لاانوتشين", "لااانوتشين", "لاااانوتشين", "لاننوتشين", "لانننوتشين", "لاننننوتشين", "لانووتشين", "لانوووتشين", "لانووووتشين", "لانوتتشين", "لانوتتتشين", "لانوتتتتشين", "لانوتششين", "لانوتشششين", "لانوتششششين", "لنوتشين", "لاوتشين", "لانتشين", "لاننوتشين", "لانوتشيين", "لانوتتشين", "لانووتشين", "لانوتتشين"],
    scientificName: "Digoxin",
    category: "مقوي لعضلة القلب",
    price: "25-50 جنيه",
    uses: ["فشل القلب", "الرجفان الأذيني"],
    sideEffects: ["غثيان", "رؤية هالات صفراء (علامة التسمم)", "بطء القلب"],
    contraindications: ["بطء ضربات القلب الشديد"],
    dosage: "قرص واحد يومياً (يحددها الطبيب بدقة).",
    warnings: "⚠️ دواء دقيق جداً (الجرعة الزائدة سامة). إذا شعرت بغثيان شديد وزغللة راجع الطبيب فوراً."
  },
  {

    name: "اسبوسيد 75",
    aliases: ["Aspocid 75", "اسبوسيد اطفال", "اسبرين السيولة", "جوسبرين", "أسبوسيد 75", "إسبوسيد 75", "اسبوسىد 75", "اصبوسيد 75", "اسسبوسيد 75", "اسسسبوسيد 75", "اسسسسبوسيد 75", "اسببوسيد 75", "اسبببوسيد 75", "اسببببوسيد 75", "اسبووسيد 75", "اسبوووسيد 75", "اسبووووسيد 75", "اسبوسسيد 75", "اسبوسسسيد 75", "اسبوسسسسيد 75", "اسبوسييد 75", "اسبوسيييد 75", "اسبوسييييد 75", "ابوسيد 75", "اسوسيد 75", "اسبسيد 75", "اسببوسيد 75", "اسبووسيد 75", "اسبوسييد 75", "اسببوسيد 75"],
    scientificName: "Acetylsalicylic Acid 75mg",
    category: "مسيل للدم (وقاية)",
    price: "25-50 جنيه",
    uses: ["الوقاية من الجلطات", "الضغط والقلب", "الحوامل (لزيادة الدم للجنين)"],
    sideEffects: ["حموضة", "سيولة (نزيف من اللثة/الأنف)"],
    contraindications: ["قرحة المعدة", "الربو", "سيولة الدم الوراثية"],
    dosage: "قرص واحد بعد الغداء.",
    warnings: "✅ المصريون يسمونه 'اسبوسيد أطفال' لكنه يستخدم للكبار للسيولة. يفضل أخذه بعد الأكل."
  },
  {

    name: "بريمبيران",
    aliases: ["Primperan", "برمبيران", "حقنة الترجيع", "برشام الغثيان", "بريمبيرأن", "بريمبيرإن", "برىمبيران", "برريمبيران", "بررريمبيران", "برررريمبيران", "برييمبيران", "بريييمبيران", "برييييمبيران", "بريممبيران", "بريمممبيران", "بريممممبيران", "بريمببيران", "بريمبببيران", "بريمببببيران", "بريمبييران", "بريمبيييران", "بريمبييييران", "بيمبيران", "بريبيران", "بريممبيران", "بريمبييران", "بريمبيرران", "بريمبيرران", "بريممبيران", "بريمبييران"],
    scientificName: "Metoclopramide",
    category: "مضاد للقيء",
    price: "25-50 جنيه",
    uses: ["القيء والغثيان", "اضطرابات المعدة", "الصداع النصفي (مع المسكن)"],
    sideEffects: ["تشنجات في الرقبة (لو جرعة زائدة)", "نعاس"],
    contraindications: ["الانسداد المعوي", "الصرع"],
    dosage: "قرص او حقنة عند اللزوم (قبل الأكل).",
    warnings: "⚠️ الجرعة الزائدة تسبب تشنجات عضلية خاصة في الأطفال (الرقبة تتعوج). استخدم موتيليوم كبديل آمن."
  },
  {

    name: "فيرموكس",
    aliases: ["Vermox", "فيرموكس", "فارموكس", "دواء الديدان", "فىرموكس", "فيرموكص", "فييرموكس", "فيييرموكس", "فييييرموكس", "فيررموكس", "فيرررموكس", "فيررررموكس", "فيرمموكس", "فيرممموكس", "فيرمممموكس", "فيرمووكس", "فيرموووكس", "فيرمووووكس", "فيرموككس", "فيرموكككس", "فيرموككككس", "فرموكس", "فيموكس", "فيروكس", "فيرموككس", "فيرموككس", "فييرموكس", "فيرموكسس", "فيرموككس", "فيرمموكس"],
    scientificName: "Mebendazole",
    category: "طارد للديدان",
    price: "25-50 جنيه",
    uses: ["الديدان الدبوسية (الهرش ليلاً)", "الديدان الخطافية", "الإسكارس"],
    sideEffects: ["مغص خفيف", "إسهال"],
    contraindications: ["الحمل", "الأطفال أقل من سنتين"],
    dosage: "قرص صباحاً ومساءً لمدة 3 أيام (ويكرر بعد أسبوعين).",
    warnings: "✅ ضروري تكرار الجرعة بعد أسبوعين لقتل البيض الذي فقس. يفضل علاج الأسرة كلها."
  },
  {

    name: "الزينتال",
    aliases: ["Alzental", "الزينتل", "الزنتال", "شربة الديدان", "ألزينتال", "إلزينتال", "الزىنتال", "اللزينتال", "الللزينتال", "اللللزينتال", "الززينتال", "الزززينتال", "الززززينتال", "الزيينتال", "الزييينتال", "الزيييينتال", "الزيننتال", "الزينننتال", "الزيننننتال", "الزينتتال", "الزينتتتال", "الزينتتتتال", "ازينتال", "الينتال", "الزيننتال", "الزيينتال", "الزيننتال", "الزينتالل", "الزينتاال", "الزينتالل"],
    scientificName: "Albendazole",
    category: "طارد ديدان واسع المجال",
    price: "25-50 جنيه",
    uses: ["جميع أنواع الديدان المعوية"],
    sideEffects: ["صداع", "ألم بطن"],
    contraindications: ["الحمل (يسبب تشوهات)"],
    dosage: "قرصين مرة واحدة (أو زجاجة كاملة) وتكرر بعد أسبوعين.",
    warnings: "⚠️ ممنوع تماماً للحوامل. يؤخذ مع وجبة دهنية لزيادة الامتصاص."
  },
  {

    name: "يورينكس",
    aliases: ["Urinex", "يورينكس", "كابسولات الكلى", "مطهر مجرى البول", "ىورينكس", "يورينكص", "يوورينكس", "يووورينكس", "يوووورينكس", "يوررينكس", "يورررينكس", "يوررررينكس", "يوريينكس", "يورييينكس", "يوريييينكس", "يوريننكس", "يورينننكس", "يوريننننكس", "يورينككس", "يورينكككس", "يورينككككس", "يرينكس", "يوينكس", "يورنكس", "يورينككس", "يوريينكس", "يوريننكس", "يوورينكس", "يوريينكس", "يوررينكس"],
    scientificName: "Essential Oils (Pinene + Camphene)",
    category: "مطهر للمسالك ومذيب للحصوات",
    price: "25-50 جنيه",
    uses: ["حصوات الكلى الصغيرة", "المغص الكلوي", "التهاب المسالك"],
    sideEffects: ["مغص بسيط", "تكرار التفتت (رائحة النعناع في النفس)"],
    contraindications: ["لا يوجد تقريباً"],
    dosage: "كبسولة 3 مرات قبل الأكل.",
    warnings: "✅ كبسولات صفراء جيلاتينية. تساعد في طرد الحصوات الصغيرة."
  },
  {

    name: "بروكسيمول",
    aliases: ["Proximol", "بروكسيمول", "فوار الحصوات", "بروكسىمول", "بروكصيمول", "برروكسيمول", "بررروكسيمول", "برررروكسيمول", "برووكسيمول", "بروووكسيمول", "برووووكسيمول", "بروككسيمول", "بروكككسيمول", "بروككككسيمول", "بروكسسيمول", "بروكسسسيمول", "بروكسسسسيمول", "بروكسييمول", "بروكسيييمول", "بروكسييييمول", "بوكسيمول", "بركسيمول", "بروسيمول", "برووكسيمول", "بروكسييمول", "بروكسيموول", "بروكسييمول", "بروكسسيمول", "بروكسيممول", "بروكسسيمول"],
    scientificName: "Halfa Bar + Piperazine + Hexamine",
    category: "طارد للحصوات ومطهر",
    price: "25-50 جنيه",
    uses: ["حصوات الحالب", "تطهير مجرى البول", "الرمال والأملاح"],
    sideEffects: ["غثيان لو على معدة فارغة"],
    contraindications: ["قصور الكلى", "الكبد"],
    dosage: "ملعقة على نصف كوب ماء بعد الأكل.",
    warnings: "✅ قوي جداً في طرد الحصوات، اشرب معه ماء كثير."
  },
  {

    name: "فيتاسيد ج",
    aliases: ["Vitacid C", "فيتاسيد سي", "فوار فيتامين سي", "القرص الفوار البرتقالي", "فيتأسيد ج", "فيتإسيد ج", "فىتاسيد ج", "فيتاصيد ج", "فييتاسيد ج", "فيييتاسيد ج", "فييييتاسيد ج", "فيتتاسيد ج", "فيتتتاسيد ج", "فيتتتتاسيد ج", "فيتااسيد ج", "فيتاااسيد ج", "فيتااااسيد ج", "فيتاسسيد ج", "فيتاسسسيد ج", "فيتاسسسسيد ج", "فيتاسييد ج", "فيتاسيييد ج", "فيتاسييييد ج", "فتاسيد ج", "فياسيد ج", "فيتسيد ج", "فيتاسيد  ج", "فيتااسيد ج", "فييتاسيد ج", "فيتااسيد ج"],
    scientificName: "Vitamin C 1000mg",
    category: "فيتامين سي فوار",
    price: "25-50 جنيه",
    uses: ["رفع المناعة", "البرد والإنفلونزا", "تحسين البشرة", "امتصاص الحديد"],
    sideEffects: ["حصوات كلى (مع الإفراط)", "حرقان معدة"],
    contraindications: ["حصوات الكلى (الأوكسالات)"],
    dosage: "قرص فوار على كوب ماء مرة يومياً.",
    warnings: "✅ الأشهر في مصر. لا تفرط فيه إذا كان لديك استعداد لحصوات الكلى."
  },
  {

    name: "سي ريتارد",
    aliases: ["C-Retard", "سي ريتارد", "فيتامين سي كبسول", "زنك", "سي ريتأرد", "سي ريتإرد", "سى ريتارد", "صي ريتارد", "سيي ريتارد", "سييي ريتارد", "سيييي ريتارد", "سي  ريتارد", "سي   ريتارد", "سي    ريتارد", "سي رريتارد", "سي ررريتارد", "سي رررريتارد", "سي رييتارد", "سي ريييتارد", "سي رييييتارد", "سي ريتتارد", "سي ريتتتارد", "سي ريتتتتارد", "س ريتارد", "سيريتارد", "سي يتارد", "سي ريتاردد", "سي ريتاررد", "سي ريتاررد", "سي رريتارد"],
    scientificName: "Vitamin C 500mg (Extended Release)",
    category: "فيتامين سي ممتد المفعول",
    price: "25-50 جنيه",
    uses: ["المناعة", "نزلات البرد", "للمدخنين"],
    sideEffects: ["نادرة"],
    contraindications: ["حصوات الكلى"],
    dosage: "كبسولة يومياً.",
    warnings: "✅ أفضل من الفوار للمعدة، ومفعوله يستمر طوال اليوم."
  },
  {

    name: "مينوكسيديل",
    aliases: ["Minoxidil", "منوكسيديل", "هير باك", "بيرفورما", "سبراي الشعر", "مىنوكسيديل", "مينوكصيديل", "ميينوكسيديل", "مييينوكسيديل", "ميييينوكسيديل", "ميننوكسيديل", "مينننوكسيديل", "ميننننوكسيديل", "مينووكسيديل", "مينوووكسيديل", "مينووووكسيديل", "مينوككسيديل", "مينوكككسيديل", "مينوككككسيديل", "مينوكسسيديل", "مينوكسسسيديل", "مينوكسسسسيديل", "ميوكسيديل", "مينكسيديل", "مينوكسسيديل", "مينووكسيديل", "ميينوكسيديل", "مينوكسيدديل", "ميننوكسيديل", "ميينوكسيديل"],
    scientificName: "Minoxidil 5% (Men) / 2% (Women)",
    category: "علاج الصلع وتساقط الشعر",
    price: "25-50 جنيه",
    uses: ["الصلع الوراثي", "إنبات شعر الذقن", "تساقط الشعر"],
    sideEffects: ["حكة في الفروة", "ظهور شعر في الوجه (للنساء)", "صداع"],
    contraindications: ["أمراض القلب (احياناً)", "الجروح في الرأس"],
    dosage: "6 بخات صباحاً ومساءً على فروة الرأس الجافة.",
    warnings: "⚠️⚠️ أهم تحذير: إذا توقفت عنه سيسقط الشعر الذي نبت مرة أخرى. هو التزام مدى الحياة."
  },
  {

    name: "دكتارين",
    aliases: ["Daktarin", "دكتارين", "دكترين", "كريم الفطريات", "دكتاكورت", "دكتأرين", "دكتإرين", "دكتارىن", "دككتارين", "دكككتارين", "دككككتارين", "دكتتارين", "دكتتتارين", "دكتتتتارين", "دكتاارين", "دكتااارين", "دكتاااارين", "دكتاررين", "دكتارررين", "دكتاررررين", "دكتاريين", "دكتارييين", "دكتاريييين", "دتارين", "دكارين", "دكتارينن", "دكتارينن", "دكتاررين", "دككتارين", "دكتاريين"],
    scientificName: "Miconazole",
    category: "مضاد للفطريات",
    price: "25-50 جنيه",
    uses: ["فطريات القدم (الرياضي)", "التسلخات الفطرية", "تينيا الجلد"],
    sideEffects: ["حرقان بسيط"],
    contraindications: ["لا يوجد"],
    dosage: "دهان مرتين يومياً.",
    warnings: "✅ دكتاكورت (يحتوي كورتيزون) للالتهاب الشديد، دكتارين (بدون) للفطريات فقط."
  },
  {

    name: "أورليستات",
    aliases: ["Orlistat", "اورلي", "أورلي", "ريجيماكس", "كويك سليم", "دواء الدهون", "أورليستأت", "أورليستإت", "اورليستات", "أورلىستات", "أورليصتات", "أوورليستات", "أووورليستات", "أوووورليستات", "أوررليستات", "أورررليستات", "أوررررليستات", "أورلليستات", "أورللليستات", "أورلللليستات", "أورلييستات", "أورليييستات", "أورلييييستات", "أورليسستات", "أورليسسستات", "أورليسسسستات", "أرليستات", "أوليستات", "أوريستات", "أوورليستات"],
    scientificName: "Orlistat 120mg",
    category: "تخسيس وحرق دهون",
    price: "25-50 جنيه",
    uses: ["إنقاص الوزن", "تثبيت الوزن", "منع امتصاص الدهون من الأكل الدسم"],
    sideEffects: ["بقع زيتية في الملابس الداخلية (محرج)", "غازات", "إسهال دهني"],
    contraindications: ["سوء الامتصاص المزمن", "مشاكل المرارة"],
    dosage: "كبسولة قبل الوجبة الدسمة مباشرة.",
    warnings: "⚠️⚠️ تحذير مهم: الدواء ده بيخلي الدهون تنزل زي ما هي (زيت)، فممكن يسبب موقف محرج لو أكلت دهون كتير. لازم تكون قريب من الحمام."
  },
  {

    name: "كروماتس",
    aliases: ["Chromax", "كروماكس", "كرومكس", "برشام سد الشهية", "كرومأتس", "كرومإتس", "كروماتص", "كرروماتس", "كررروماتس", "كرررروماتس", "كرووماتس", "كروووماتس", "كرووووماتس", "كرومماتس", "كروممماتس", "كرومممماتس", "كرومااتس", "كروماااتس", "كرومااااتس", "كروماتتس", "كروماتتتس", "كروماتتتتس", "كوماتس", "كرماتس", "كرواتس", "كروماتسس", "كروماتتس", "كروماتتس", "كروماتتس", "كرومااتس"],
    scientificName: "Garcinia Cambogia + Chromium",
    category: "سد الشهية وحرق السكر",
    price: "25-50 جنيه",
    uses: ["تقليل الشهية للحلويات والنشويات", "التخسيس", "ضبط سكر الدم"],
    sideEffects: ["جفاف الفم", "انتفاخ بسيط"],
    contraindications: ["الحمل والرضاعة"],
    dosage: "كبسولة قبل الأكل بنصف ساعة.",
    warnings: "✅ بيشتغل أكتر على الناس اللي بتحب الحلويات والمعجنات."
  },
  {

    name: "سياليس",
    aliases: ["Cialis", "سيالس", "تادالافيل", "الحباية الصفرا", "الويك اند", "دايموند ريكتا", "سيأليس", "سيإليس", "سىاليس", "صياليس", "سيياليس", "سييياليس", "سيييياليس", "سيااليس", "سياااليس", "سيااااليس", "سيالليس", "سياللليس", "سيالللليس", "سيالييس", "سياليييس", "سيالييييس", "سياليسس", "سياليسسس", "سياليسسسس", "ساليس", "سيليس", "سيايس", "سيالييس", "سيااليس"],
    scientificName: "Tadalafil 20mg",
    category: "علاج ضعف الانتصاب",
    price: "25-50 جنيه",
    uses: ["ضعف الانتصاب", "تضخم البروستاتا الحميد"],
    sideEffects: ["صداع", "ألم في الظهر والعضلات", "حرقان معدة"],
    contraindications: ["مرضى القلب الذين يتناولون النيترات (نيتروماك/دينيترا) - خطر الموت"],
    dosage: "نصف قرص أو قرص قبل العلاقة بـ 30 دقيقة.",
    warnings: "⚠️⚠️ مفعوله يستمر 36 ساعة (عشان كدة اسمه حباية الويك إند). ممنوع تماماً مع مرضى القلب اللي بياخدوا موسعات شرايين."
  },
  {

    name: "فياجرا",
    aliases: ["Viagra", "الحباية الزرقا", "سيلدينافيل", "فيجرا", "اريك", "فيأجرا", "فيإجرا", "فىاجرا", "فيياجرا", "فييياجرا", "فيييياجرا", "فيااجرا", "فياااجرا", "فيااااجرا", "فياججرا", "فياجججرا", "فياججججرا", "فياجررا", "فياجرررا", "فياجررررا", "فياجراا", "فياجرااا", "فياجراااا", "فاجرا", "فيارا", "فياجررا", "فيااجرا", "فيااجرا", "فياجراا", "فياجراا"],
    scientificName: "Sildenafil 50mg/100mg",
    category: "منشط جنسي",
    price: "25-50 جنيه",
    uses: ["ضعف الانتصاب"],
    sideEffects: ["احمرار الوجه", "زغللة (رؤية زرقاء)", "صداع شديد", "انسداد الأنف"],
    contraindications: ["مرضى القلب (النيترات)", "ضغط الدم غير المنضبط"],
    dosage: "قرص قبل العلاقة بساعة على معدة فاضية.",
    warnings: "⚠️ الأكل الدسم بيقلل مفعولها جداً. تسبب صداع وزغللة."
  },
  {

    name: "ياسمين",
    aliases: ["Yasmin", "يسمين", "حبوب منع الحمل", "برشام ياسمين", "يأسمين", "يإسمين", "ىاسمين", "ياصمين", "يااسمين", "ياااسمين", "يااااسمين", "ياسسمين", "ياسسسمين", "ياسسسسمين", "ياسممين", "ياسمممين", "ياسممممين", "ياسميين", "ياسمييين", "ياسميييين", "ياسمينن", "ياسميننن", "ياسمينننن", "يامين", "ياسين", "يااسمين", "يااسمين", "ياسميين", "يااسمين", "ياسممين"],
    scientificName: "Drospirenone + Ethinylestradiol",
    category: "منع الحمل",
    price: "25-50 جنيه",
    uses: ["منع الحمل", "تظبيط الدورة", "علاج حب الشباب الهرموني"],
    sideEffects: ["غثيان", "ألم في الثدي", "تقلب مزاجي"],
    contraindications: ["تاريخ جلطات سابقة", "التدخين فوق سن 35", "أورام الثدي"],
    dosage: "قرص يومياً في نفس الموعد لمدة 21 يوم.",
    warnings: "✅ من أخف الأنواع وأقلها في زيادة الوزن، لكنه أغلى شوية."
  },
  {

    name: "جولد",
    aliases: ["Gold", "جولد غسول", "تشطيف مهبلي", "غسول سيدات", "جوولد", "جووولد", "جوووولد", "جوللد", "جولللد", "جوللللد", "جولدد", "جولددد", "جولدددد", "جلد", "جود", "جوللد", "جوللد", "جولدد", "جولدد", "جوولد", "جولدد", "جولدد", "جولدد", "جوولد", "جوولد", "جوولد", "جولدد", "جوولد", "جوولد", "جولدد"],
    scientificName: "Menthol + Thymol + Aloe Vera",
    category: "غسول مهبلي",
    price: "25-50 جنيه",
    uses: ["الالتهابات المهبلية", "الروائح الكريهة", "الحكة"],
    sideEffects: ["حرقان بسيط لو التركيز عالي"],
    contraindications: ["لا يستخدم داخلياً للحوامل"],
    dosage: "مكيال على لتر ماء دافئ.",
    warnings: "✅ منظف ومنعش ومطهر."
  },
  {

    name: "موتيفال",
    aliases: ["Motival", "موتفال", "برشام القلق", "مهدئ بسيط", "موتيفأل", "موتيفإل", "موتىفال", "مووتيفال", "موووتيفال", "مووووتيفال", "موتتيفال", "موتتتيفال", "موتتتتيفال", "موتييفال", "موتيييفال", "موتييييفال", "موتيففال", "موتيفففال", "موتيففففال", "موتيفاال", "موتيفااال", "موتيفاااال", "متيفال", "مويفال", "مووتيفال", "مووتيفال", "موتييفال", "موتيففال", "موتيففال", "موتتيفال"],
    scientificName: "Nortriptyline + Fluphenazine",
    category: "مضاد للقلق والتوتر",
    price: "25-50 جنيه",
    uses: ["القولون العصبي", "التوتر والقلق البسيط", "الاكتئاب الخفيف"],
    sideEffects: ["جفاف الفم", "نعاس بسيط"],
    contraindications: ["الجلوكوما", "تضخم البروستاتا"],
    dosage: "قرص واحد مساءً.",
    warnings: "✅ أشهر دواء في مصر للقولون العصبي النفسي."
  },
  {

    name: "دورميفال",
    aliases: ["Dormival", "دورمفال", "منوم اعشاب", "كبسولات النوم", "دورميفأل", "دورميفإل", "دورمىفال", "دوورميفال", "دووورميفال", "دوووورميفال", "دوررميفال", "دورررميفال", "دوررررميفال", "دورمميفال", "دورممميفال", "دورمممميفال", "دورمييفال", "دورميييفال", "دورمييييفال", "دورميففال", "دورميفففال", "دورميففففال", "درميفال", "دوميفال", "دوريفال", "دورمييفال", "دورمييفال", "دورميفاال", "دورمييفال", "دورميفالل"],
    scientificName: "Valerian + Humulus (عشبة الناردين)",
    category: "مساعد على النوم (عشبي)",
    price: "25-50 جنيه",
    uses: ["الأرق", "القلق", "صعوبة النوم"],
    sideEffects: ["رائحة كريهة للكبسولة (ريحة شراب)"],
    contraindications: ["لا يوجد تقريباً"],
    dosage: "2-3 كبسولات قبل النوم بساعة.",
    warnings: "✅ آمن جداً ولا يسبب إدمان. رائحته قوية شوية بس ده طبيعي."
  },
  {

    name: "بيتادين",
    aliases: ["Betadine", "بتادين", "ميكروكروم", "المطهر الاحمر", "بيتأدين", "بيتإدين", "بىتادين", "بييتادين", "بيييتادين", "بييييتادين", "بيتتادين", "بيتتتادين", "بيتتتتادين", "بيتاادين", "بيتااادين", "بيتاااادين", "بيتاددين", "بيتادددين", "بيتاددددين", "بيتاديين", "بيتادييين", "بيتاديييين", "بيادين", "بيتدين", "بيتاددين", "بيتاادين", "بييتادين", "بيتتادين", "بييتادين", "بييتادين"],
    scientificName: "Povidone Iodine",
    category: "مطهر عام",
    price: "25-50 جنيه",
    uses: ["تطهير الجروح", "قبل العمليات", "الغرغرة (النوع المخصص للفم)", "دش مهبلي (النوع المخصص)"],
    sideEffects: ["حساسية اليود", "تصبغ الجلد (مؤقت)"],
    contraindications: ["حساسية اليود", "مشاكل الغدة الدرقية (استخدام مكثف)"],
    dosage: "يستخدم مركز أو مخفف حسب النوع.",
    warnings: "⚠️ لا يوضع داخل الحروق العميقة. انتبه: يوجد بيتادين للجروح، وبيتادين للفم، وبيتادين مهبلي (لا تخلط بينهم)."
  },
  {

    name: "جينوفيل",
    aliases: ["Genuphil", "جينوفل", "جنوفيل", "دواء الخشونة", "فوار الخشونة", "جىنوفيل", "جيينوفيل", "جييينوفيل", "جيييينوفيل", "جيننوفيل", "جينننوفيل", "جيننننوفيل", "جينووفيل", "جينوووفيل", "جينووووفيل", "جينوففيل", "جينوفففيل", "جينوففففيل", "جينوفييل", "جينوفيييل", "جينوفييييل", "جيوفيل", "جينفيل", "جينوفييل", "جينووفيل", "جيينوفيل", "جينوففيل", "جينوففيل", "جيننوفيل", "جينوفيلل"],
    scientificName: "Glucosamine + Chondroitin + MSM",
    category: "مكمل غذائي للمفاصل",
    price: "25-50 جنيه",
    uses: ["خشونة الركبة", "تآكل الغضاريف", "ألم المفاصل المزمن"],
    sideEffects: ["انتفاخ بسيط", "حموضة"],
    contraindications: ["حساسية الأسماك/القشريات"],
    dosage: "قرص 3 مرات يومياً بعد الأكل.",
    warnings: "✅ بيجيب نتيجة بعد الاستمرار عليه شهرين أو تلاتة، مش مسكن فوري."
  },
  {

    name: "أورسوجول",
    aliases: ["Ursogall", "اورسوجول", "اورسوفالك", "دواء المرارة", "مذيب حصوات المرارة", "أورصوجول", "أوورسوجول", "أووورسوجول", "أوووورسوجول", "أوررسوجول", "أورررسوجول", "أوررررسوجول", "أورسسوجول", "أورسسسوجول", "أورسسسسوجول", "أورسووجول", "أورسوووجول", "أورسووووجول", "أورسوججول", "أورسوجججول", "أورسوججججول", "أرسوجول", "أوسوجول", "أوروجول", "أورسوججول", "أوورسوجول", "أوررسوجول", "أوورسوجول", "أورسوجولل", "أورسوججول"],
    scientificName: "Ursodeoxycholic Acid",
    category: "علاج الكبد والمرارة",
    price: "25-50 جنيه",
    uses: ["إذابة حصوات المرارة الصغيرة", "تحسين وظائف الكبد", "الركود الصفراوي"],
    sideEffects: ["إسهال (مشهور)"],
    contraindications: ["التهاب المرارة الحاد"],
    dosage: "حسب الوزن (غالباً قرصين مساءً).",
    warnings: "⚠️ الدواء ده بيعمل سيولة في العصارة الصفراوية، فممكن يعمل إسهال."
  },
  {

    name: "تلفاست",
    aliases: ["Telfast", "تيلفاست", "تلفاست 120", "تلفاست 180", "حساسية بدون نوم", "تلفأست", "تلفإست", "تلفاصت", "تللفاست", "تلللفاست", "تللللفاست", "تلففاست", "تلفففاست", "تلففففاست", "تلفااست", "تلفاااست", "تلفااااست", "تلفاسست", "تلفاسسست", "تلفاسسسست", "تلفاستت", "تلفاستتت", "تلفاستتتت", "تفاست", "تلاست", "تلفست", "تلففاست", "تلفااست", "تلفااست", "تلففاست"],
    scientificName: "Fexofenadine",
    category: "مضاد للحساسية (لا يسبب النعاس)",
    price: "25-50 جنيه",
    uses: ["حساسية الأنف", "الارتيكاريا (الهرش)", "الجيوب الأنفية"],
    sideEffects: ["صداع بسيط"],
    contraindications: ["لا يوجد تقريباً"],
    dosage: "قرص واحد يومياً.",
    warnings: "✅ الميزة الكبرى: لا يسبب النوم (Non-drowsy) عكس الزيرتك والأنالرج."
  },
  {

    name: "ستوجيرون",
    aliases: ["Stugeron", "ستوجرون", "دواء الدوخة", "برشام السفر", "ستوجىرون", "صتوجيرون", "ستتوجيرون", "ستتتوجيرون", "ستتتتوجيرون", "ستووجيرون", "ستوووجيرون", "ستووووجيرون", "ستوججيرون", "ستوجججيرون", "ستوججججيرون", "ستوجييرون", "ستوجيييرون", "ستوجييييرون", "ستوجيررون", "ستوجيرررون", "ستوجيررررون", "سوجيرون", "ستجيرون", "ستويرون", "ستووجيرون", "ستوجيروون", "ستوججيرون", "ستوجيروون", "ستتوجيرون", "ستووجيرون"],
    scientificName: "Cinnarizine",
    category: "مضاد للدوار",
    price: "25-50 جنيه",
    uses: ["دوخة السفر (العربيات والمواصلات)", "الدوار والترجيع", "طنين الأذن"],
    sideEffects: ["نعاس", "زيادة الوزن (مع الاستخدام الطويل)"],
    contraindications: ["مرض باركنسون (الشلل الرعاش)"],
    dosage: "قرص قبل السفر بساعة، أو 3 مرات يومياً للعلاج.",
    warnings: "✅ ممتاز للي بيدوخ في المواصلات."
  },
  {

    name: "يونيكتام",
    aliases: ["Unictam", "يونيكتام", "يونكتام", "حقنة مضاد حيوي", "يوني كتام", "يونيكتأم", "يونيكتإم", "ىونيكتام", "يوونيكتام", "يووونيكتام", "يوووونيكتام", "يوننيكتام", "يونننيكتام", "يوننننيكتام", "يونييكتام", "يونيييكتام", "يونييييكتام", "يونيككتام", "يونيكككتام", "يونيككككتام", "يونيكتتام", "يونيكتتتام", "يونيكتتتتام", "ينيكتام", "يويكتام", "يوونيكتام", "يونييكتام", "يوونيكتام", "يونيكتاام", "يوونيكتام"],
    scientificName: "Ampicillin + Sulbactam",
    category: "مضاد حيوي حقن",
    price: "25-50 جنيه",
    uses: ["العدوى الشديدة", "التهاب الصدر", "التهاب المسالك", "بعد العمليات"],
    sideEffects: ["حساسية (خطيرة)", "إسهال"],
    contraindications: ["حساسية البنسلين (اختبار الحساسية إجباري)"],
    dosage: "حقنة كل 12 ساعة (عضل أو وريد).",
    warnings: "⚠️⚠️ لازم ولابد وحتماً عمل اختبار حساسية قبل كل حقنة، حتى لو أخدها قبل كدة."
  },
  {

    name: "كونترولوك",
    aliases: ["Controloc", "كونترولوك", "كنترولوك", "بانتوزول", "دواء المعدة الغالي", "كوونترولوك", "كووونترولوك", "كوووونترولوك", "كوننترولوك", "كونننترولوك", "كوننننترولوك", "كونتترولوك", "كونتتترولوك", "كونتتتترولوك", "كونتررولوك", "كونترررولوك", "كونتررررولوك", "كونتروولوك", "كونترووولوك", "كونتروووولوك", "كوترولوك", "كونرولوك", "كونتروللوك", "كونتروولوك", "كونتروولوك", "كونتروللوك", "كونترولوكك", "كونتروللوك", "كونتررولوك", "كونتررولوك"],
    scientificName: "Pantoprazole",
    category: "مثبط لمضخة البروتون (PPI)",
    price: "50 جنيه",
    uses: ["قرحة المعدة", "الارتجاع المريئي الشديد", "جرثومة المعدة (في الكورس)"],
    sideEffects: ["نقص المغنيسيوم (استخدام طويل)"],
    contraindications: ["لا يوجد"],
    dosage: "قرص (40 أو 20) قبل الفطار بساعة.",
    warnings: "✅ أقوى وأنظف نوع للمعدة، بيوقف إفراز الحمض تماماً."
  },
  {

    name: "سبازموفري",
    aliases: ["Spasmofree", "Tiemonium", "سبازمفري", "سبازمو فري", "سبأزموفري", "سبإزموفري", "سبازموفرى", "صبازموفري", "سببازموفري", "سبببازموفري", "سببببازموفري", "سباازموفري", "سبااازموفري", "سباااازموفري", "سباززموفري", "سبازززموفري", "سباززززموفري", "سبازمموفري", "سبازممموفري", "سبازمممموفري", "سبازمووفري", "سبازموووفري", "سبازمووووفري", "سازموفري", "سبزموفري", "سباموفري", "سبازموففري", "سبازمموفري", "سببازموفري", "سبازمموفري"],
    scientificName: "Tiemonium Methylsulfate 50mg",
    category: "مضاد للتقلصات المعوية",
    price: "20 جنيه",
    uses: [
      "تقلصات القولون العصبي",
      "آلام ومغص البطن",
      "تقلصات المعدة والأمعاء",
      "آلام الدورة الشهرية",
      "تقلصات المرارة"
    ],
    sideEffects: [
      "جفاف الفم",
      "إمساك",
      "تشوش الرؤية (نادراً)",
      "صعوبة التبول (نادراً)"
    ],
    contraindications: [
      "تضخم البروستاتا",
      "الجلوكوما (المياه الزرقاء)",
      "انسداد الأمعاء"
    ],
    dosage: "قرص 50mg 3 مرات يومياً",
    warnings: "✅ فعال جداً للتقلصات. قد يسبب جفاف الفم - اشرب ماء كثير."
  },
  {

    name: "جاناتون",
    aliases: ["Ganaton", "Itopride", "ايتوبرايد", "جانتون", "جأناتون", "جإناتون", "جااناتون", "جاااناتون", "جااااناتون", "جانناتون", "جاننناتون", "جانننناتون", "جانااتون", "جاناااتون", "جانااااتون", "جاناتتون", "جاناتتتون", "جاناتتتتون", "جاناتوون", "جاناتووون", "جاناتوووون", "جناتون", "جااتون", "جانااتون", "جانااتون", "جااناتون", "جااناتون", "جااناتون", "جانناتون", "جانااتون"],
    scientificName: "Itopride HCl 50mg",
    category: "منشط حركة الجهاز الهضمي",
    price: "25-50 جنيه",
    uses: [
      "عسر الهضم الوظيفي",
      "الانتفاخ والامتلاء",
      "الغثيان والقيء",
      "ارتجاع المريء",
      "بطء حركة المعدة"
    ],
    sideEffects: [
      "إسهال خفيف",
      "صداع",
      "دوخة نادراً",
      "زيادة إفراز اللعاب"
    ],
    contraindications: [
      "نزيف المعدة",
      "انسداد الأمعاء",
      "الحمل (الأشهر الأولى)"
    ],
    dosage: "50mg ثلاث مرات يومياً قبل الأكل بـ15 دقيقة",
    warnings: "✅ آمن وفعال. يجب أخذه قبل الأكل بربع ساعة. لا يعالج السبب - فقط الأعراض."
  },
  {

    name: "موتيليوم",
    aliases: ["Motilium", "Domperidone", "دومبيريدون", "موتليوم", "موتىليوم", "مووتيليوم", "موووتيليوم", "مووووتيليوم", "موتتيليوم", "موتتتيليوم", "موتتتتيليوم", "موتييليوم", "موتيييليوم", "موتييييليوم", "موتيلليوم", "موتيللليوم", "موتيلللليوم", "موتيلييوم", "موتيليييوم", "موتيلييييوم", "متيليوم", "مويليوم", "موتيليومم", "موتيلليوم", "موتيليووم", "موتيليومم", "موتيلليوم", "موتيلليوم", "موتتيليوم", "موتتيليوم"],
    scientificName: "Domperidone 10mg",
    category: "مضاد للقيء ومنشط للمعدة",
    price: "32 جنيه",
    uses: [
      "الغثيان والقيء",
      "عسر الهضم",
      "الانتفاخ والامتلاء",
      "ارتجاع المريء",
      "بطء إفراغ المعدة"
    ],
    sideEffects: [
      "صداع",
      "جفاف الفم",
      "نادراً: إسهال",
      "نادراً جداً: اضطراب نظم القلب"
    ],
    contraindications: [
      "أمراض القلب",
      "اضطراب نظم القلب",
      "الحمل والرضاعة",
      "نزيف المعدة"
    ],
    dosage: "10-20mg (1-2 قرص) قبل الأكل 3 مرات يومياً",
    warnings: "⚠️ قد يؤثر على نظم القلب - لا يستخدم لفترات طويلة. ممنوع لمرضى القلب. فعال جداً للغثيان."
  },
  {

    name: "نيكسيوم",
    aliases: ["Nexium", "Esomeprazole", "ايزوميبرازول", "نكسيوم", "نىكسيوم", "نيكصيوم", "نييكسيوم", "نيييكسيوم", "نييييكسيوم", "نيككسيوم", "نيكككسيوم", "نيككككسيوم", "نيكسسيوم", "نيكسسسيوم", "نيكسسسسيوم", "نيكسييوم", "نيكسيييوم", "نيكسييييوم", "نيكسيووم", "نيكسيوووم", "نيكسيووووم", "نيسيوم", "نيكيوم", "نيكسيومم", "نيككسيوم", "نيككسيوم", "نيكسييوم", "نيكسسيوم", "نيكسيومم", "نيكسييوم"],
    scientificName: "Esomeprazole 40mg",
    category: "مثبط مضخة البروتون (PPI)",
    price: "95 جنيه",
    uses: [
      "ارتجاع المريء الشديد",
      "قرحة المعدة والاثني عشر",
      "علاج جرثومة المعدة H.Pylori (مع مضادات حيوية)",
      "الحموضة المزمنة",
      "متلازمة زولينجر-إليسون"
    ],
    sideEffects: [
      "صداع",
      "إسهال أو إمساك",
      "غثيان",
      "ألم بالمعدة",
      "نادراً: نقص الماغنيسيوم (استخدام طويل)",
      "نادراً: كسور العظام (استخدام طويل)"
    ],
    contraindications: [
      "الحساسية من مثبطات مضخة البروتون",
      "الحمل (استشر الطبيب)"
    ],
    dosage: "20-40mg مرة واحدة يومياً صباحاً قبل الإفطار بنصف ساعة",
    warnings: "⚠️ دواء قوي - يُستخدم للحالات الشديدة فقط. لا يُستخدم أكثر من 8 أسابيع متواصلة بدون استشارة طبيب. يجب أخذه على معدة فارغة. قد يتداخل مع امتصاص بعض الأدوية والفيتامينات."
  },
  {

    name: "كونترولوك",
    aliases: ["Controloc", "Pantoprazole", "بانتوبرازول", "كنترولوك", "كوونترولوك", "كووونترولوك", "كوووونترولوك", "كوننترولوك", "كونننترولوك", "كوننننترولوك", "كونتترولوك", "كونتتترولوك", "كونتتتترولوك", "كونتررولوك", "كونترررولوك", "كونتررررولوك", "كونتروولوك", "كونترووولوك", "كونتروووولوك", "كوترولوك", "كونرولوك", "كونتروولوك", "كونتررولوك", "كونتروللوك", "كوننترولوك", "كونتترولوك", "كونترولووك", "كونترولوكك", "كوننترولوك", "كونتترولوك"],
    scientificName: "Pantoprazole 40mg",
    category: "مثبط مضخة البروتون",
    price: "50 جنيه",
    uses: [
      "نفس استخدامات نيكسيوم",
      "ارتجاع المريء",
      "قرحة المعدة",
      "الحموضة الشديدة"
    ],
    sideEffects: [
      "نفس نيكسيوم",
      "صداع، إسهال"
    ],
    contraindications: [
      "نفس نيكسيوم"
    ],
    dosage: "40mg مرة واحدة يومياً صباحاً قبل الأكل",
    warnings: "⚠️ نفس تحذيرات نيكسيوم. دواء قوي - لا يستخدم لفترات طويلة."
  },
  {

    name: "لاكتيلوز",
    aliases: ["Lactulose", "Duphalac", "دوفالاك", "لكتيلوز", "لأكتيلوز", "لإكتيلوز", "لاكتىلوز", "لااكتيلوز", "لاااكتيلوز", "لااااكتيلوز", "لاككتيلوز", "لاكككتيلوز", "لاككككتيلوز", "لاكتتيلوز", "لاكتتتيلوز", "لاكتتتتيلوز", "لاكتييلوز", "لاكتيييلوز", "لاكتييييلوز", "لاكتيللوز", "لاكتيلللوز", "لاكتيللللوز", "لاتيلوز", "لاكيلوز", "لاكتيلوزز", "لاكتييلوز", "لاكتيللوز", "لاككتيلوز", "لاكتتيلوز", "لاكتيلوزز"],
    scientificName: "Lactulose 10g/15ml",
    category: "ملين آمن",
    price: "25-50 جنيه",
    uses: [
      "الإمساك المزمن",
      "تليين البراز",
      "آمن للحامل والمرضع",
      "آمن للأطفال",
      "غيبوبة الكبد (جرعات عالية)"
    ],
    sideEffects: [
      "انتفاخ وغازات (شائع)",
      "مغص خفيف",
      "إسهال (إذا زادت الجرعة)"
    ],
    contraindications: [
      "انسداد الأمعاء",
      "الجالاكتوزيميا (مرض وراثي نادر)",
      "الحساسية من اللاكتوز"
    ],
    dosage: "15-30ml يومياً (يمكن زيادتها حسب الحاجة)",
    warnings: "✅ آمن جداً - لا يسبب إدمان. قد يستغرق 2-3 أيام ليبدأ المفعول. اشرب ماء كثير. آمن للحامل."
  },
  {

    name: "ليبراكس",
    aliases: ["Librax", "لبراكس", "ليبركس", "ليبرأكس", "ليبرإكس", "لىبراكس", "ليبراكص", "لييبراكس", "ليييبراكس", "لييييبراكس", "ليببراكس", "ليبببراكس", "ليببببراكس", "ليبرراكس", "ليبررراكس", "ليبرررراكس", "ليبرااكس", "ليبراااكس", "ليبرااااكس", "ليبراككس", "ليبراكككس", "ليبراككككس", "ليراكس", "ليباكس", "ليبراكسس", "ليبراككس", "ليبرراكس", "ليبرراكس", "ليبراككس", "ليبراككس"],
    scientificName: "Chlordiazepoxide + Clidinium",
    category: "مهدئ ومضاد للتقلصات",
    price: "25-50 جنيه",
    uses: [
      "القولون العصبي الشديد",
      "قرحة المعدة (مع أدوية أخرى)",
      "القلق المصاحب لمشاكل المعدة",
      "التقلصات الشديدة"
    ],
    sideEffects: [
      "النعاس الشديد",
      "جفاف الفم",
      "إمساك",
      "تشوش الرؤية",
      "إدمان (مع الاستخدام الطويل)",
      "ضعف الذاكرة"
    ],
    contraindications: [
      "الحمل والرضاعة",
      "الجلوكوما",
      "تضخم البروستاتا",
      "الوهن العضلي",
      "إدمان الكحول أو المخدرات"
    ],
    dosage: "كبسولة 1-2 مرة يومياً",
    warnings: "⚠️⚠️⚠️ دواء جدول (مخدر) - قد يسبب إدمان. لا يستخدم أكثر من أسبوعين. يسبب نعاس شديد - لا تقود السيارة. لا يؤخذ إلا بوصفة طبية. لا تتوقف فجأة - قلل الجرعة تدريجياً."
  },
  {

    name: "زانتاك",
    aliases: ["Zantac", "Ranitidine", "زنتاك", "زأنتاك", "زإنتاك", "زاانتاك", "زااانتاك", "زاااانتاك", "زاننتاك", "زانننتاك", "زاننننتاك", "زانتتاك", "زانتتتاك", "زانتتتتاك", "زانتااك", "زانتاااك", "زانتااااك", "زانتاكك", "زانتاككك", "زانتاكككك", "زاتاك", "زاناك", "زانتااك", "زاننتاك", "زاانتاك", "زانتاكك", "زانتااك", "زاننتاك", "زاننتاك", "زاننتاك"],
    scientificName: "Ranitidine 150mg",
    category: "مضاد الحموضة",
    price: "38 جنيه",
    uses: [
      "نفس هستوب (نفس المادة الفعالة)",
      "حرقة المعدة",
      "قرحة المعدة"
    ],
    sideEffects: [
      "نفس هستوب"
    ],
    contraindications: [
      "نفس هستوب"
    ],
    dosage: "نفس هستوب: 150mg مرتين يومياً",
    warnings: "⚠️ هو نفس هستوب (نفس المادة الفعالة - رانيتيدين). تم سحبه من بعض الأسواق العالمية بسبب شوائب مسرطنة محتملة - لكن ما زال متاحاً في مصر."
  },
  {

    name: "إيموديوم",
    aliases: ["Imodium", "Loperamide", "لوبراميد", "اموديوم", "ايموديوم", "إىموديوم", "إييموديوم", "إيييموديوم", "إييييموديوم", "إيمموديوم", "إيممموديوم", "إيمممموديوم", "إيمووديوم", "إيموووديوم", "إيمووووديوم", "إيمودديوم", "إيموددديوم", "إيمودددديوم", "إيمودييوم", "إيموديييوم", "إيمودييييوم", "إموديوم", "إيوديوم", "إيمديوم", "إيموديووم", "إييموديوم", "إيمودييوم", "إييموديوم", "إيمووديوم", "إيمووديوم"],
    scientificName: "Loperamide 2mg",
    category: "مضاد الإسهال",
    price: "25-50 جنيه",
    uses: [
      "الإسهال الحاد",
      "الإسهال المزمن",
      "إسهال المسافرين",
      "السيطرة على الإسهال (ليس علاجاً للسبب)"
    ],
    sideEffects: [
      "إمساك (إذا زادت الجرعة)",
      "دوخة",
      "غثيان",
      "انتفاخ",
      "جفاف الفم"
    ],
    contraindications: [
      "إسهال دموي",
      "حمى مع الإسهال",
      "التهاب القولون التقرحي الحاد",
      "الأطفال أقل من سنتين",
      "انسداد الأمعاء"
    ],
    dosage: "2 كبسولة في البداية، ثم 1 كبسولة بعد كل مرة إسهال (بحد أقصى 8 كبسولات يومياً)",
    warnings: "⚠️ لا يُستخدم إذا كان الإسهال مصحوباً بحمى أو دم - راجع الطبيب فوراً. لا يعالج السبب - فقط يوقف الإسهال. اشرب سوائل كثيرة. إذا لم يتحسن الإسهال خلال 48 ساعة راجع الطبيب."
  },
  {

    name: "ستربتوكين",
    aliases: ["Streptoquin", "ستربتوكوين", "ستربتوكىن", "صتربتوكين", "ستتربتوكين", "ستتتربتوكين", "ستتتتربتوكين", "سترربتوكين", "ستررربتوكين", "سترررربتوكين", "سترببتوكين", "ستربببتوكين", "سترببببتوكين", "ستربتتوكين", "ستربتتتوكين", "ستربتتتتوكين", "ستربتووكين", "ستربتوووكين", "ستربتووووكين", "سربتوكين", "ستبتوكين", "سترتوكين", "ستتربتوكين", "ستتربتوكين", "ستربتوككين", "ستتربتوكين", "ستتربتوكين", "ستربتوكيين", "ستتربتوكين", "سترربتوكين"],
    scientificName: "Streptomycin + Sulphaguanidine + Chloroquine",
    category: "مطهر معوي قديم",
    price: "25-50 جنيه",
    uses: [
      "الإسهال والدوسنتاريا (قديماً)",
      "الأميبا (غير شائع حالياً)"
    ],
    sideEffects: [
      "طفح جلدي",
      "غثيان",
      "اضطراب المعدة"
    ],
    contraindications: [
      "الحمل والرضاعة",
      "حساسية السلفا"
    ],
    dosage: "حسب إرشادات الطبيب (نادر الاستخدام حالياً)",
    warnings: "⚠️ دواء قديم - نادراً ما يُستخدم حالياً. هناك بدائل أفضل وأحدث."
  },
  {

    name: "كولوفيرين",
    aliases: ["Coloverin", "Mebeverine", "ميبفرين", "كولفرين", "كولوفىرين", "كوولوفيرين", "كووولوفيرين", "كوووولوفيرين", "كوللوفيرين", "كولللوفيرين", "كوللللوفيرين", "كولووفيرين", "كولوووفيرين", "كولووووفيرين", "كولوففيرين", "كولوفففيرين", "كولوففففيرين", "كولوفييرين", "كولوفيييرين", "كولوفييييرين", "كلوفيرين", "كووفيرين", "كولفيرين", "كولوفييرين", "كولوفييرين", "كولوفيريين", "كولوفيررين", "كولوففيرين", "كولوفيرينن", "كوللوفيرين"],
    scientificName: "Mebeverine 135mg",
    category: "مضاد للتقلصات",
    price: "25-50 جنيه",
    uses: [
      "القولون العصبي",
      "تقلصات الأمعاء",
      "آلام ومغص البطن",
      "متلازمة القولون المتهيج (IBS)"
    ],
    sideEffects: [
      "نادرة جداً",
      "صداع خفيف",
      "دوخة",
      "طفح جلدي نادر"
    ],
    contraindications: [
      "الحساسية من الميبفرين",
      "انسداد الأمعاء",
      "البورفيريا"
    ],
    dosage: "135mg (كبسولة) 3 مرات يومياً قبل الأكل بـ20 دقيقة",
    warnings: "✅ آمن جداً - يُستخدم لفترات طويلة. يجب أخذه قبل الأكل. فعال جداً للقولون العصبي. لا يسبب إدمان."
  },
  {

    name: "ديسفلاتيل",
    aliases: ["Disflatyl", "Simethicone", "سيميثيكون", "ديسفلاتل", "ديسفلأتيل", "ديسفلإتيل", "دىسفلاتيل", "ديصفلاتيل", "دييسفلاتيل", "ديييسفلاتيل", "دييييسفلاتيل", "ديسسفلاتيل", "ديسسسفلاتيل", "ديسسسسفلاتيل", "ديسففلاتيل", "ديسفففلاتيل", "ديسففففلاتيل", "ديسفللاتيل", "ديسفلللاتيل", "ديسفللللاتيل", "ديسفلااتيل", "ديسفلاااتيل", "ديسفلااااتيل", "دسفلاتيل", "ديفلاتيل", "ديسلاتيل", "ديسفلاتيلل", "ديسففلاتيل", "ديسفلاتيلل", "ديسفلاتتيل"],
    scientificName: "Simethicone 40mg",
    category: "مضاد الانتفاخ والغازات",
    price: "25-50 جنيه",
    uses: [
      "الانتفاخ والغازات",
      "مغص الرضع",
      "عسر الهضم",
      "آلام الغازات"
    ],
    sideEffects: [
      "لا يوجد تقريباً - آمن جداً"
    ],
    contraindications: [
      "انسداد الأمعاء فقط"
    ],
    dosage: "40-125mg بعد كل وجبة وقبل النوم (حسب الحاجة)",
    warnings: "✅ آمن تماماً - حتى للرضع والحوامل. لا يُمتص من الجسم. يعمل بشكل ميكانيكي على تفتيت فقاعات الغاز."
  },
  {

    name: "كولونا",
    aliases: ["Colona", "Sulpiride + Mebeverine", "كلونا", "كولونأ", "كولونإ", "كوولونا", "كووولونا", "كوووولونا", "كوللونا", "كولللونا", "كوللللونا", "كولوونا", "كولووونا", "كولوووونا", "كولوننا", "كولونننا", "كولوننننا", "كولوناا", "كولونااا", "كولوناااا", "كوونا", "كولنا", "كولوناا", "كولوناا", "كولوناا", "كولوونا", "كولوننا", "كولوننا", "كولوناا", "كولوننا"],
    scientificName: "Sulpiride 25mg + Mebeverine 100mg",
    category: "علاج القولون العصبي",
    price: "25-50 جنيه",
    uses: [
      "القولون العصبي مع قلق",
      "تقلصات القولون",
      "آلام البطن النفسية المنشأ",
      "عسر الهضم الوظيفي"
    ],
    sideEffects: [
      "نعاس خفيف",
      "جفاف الفم",
      "زيادة وزن طفيفة",
      "اضطراب الدورة (نادراً)"
    ],
    contraindications: [
      "الحمل والرضاعة",
      "أورام الثدي",
      "الصرع"
    ],
    dosage: "كبسولة 2-3 مرات يومياً قبل الأكل",
    warnings: "⚠️ يحتوي على سولبيريد (مهدئ نفسي خفيف). قد يسبب نعاس خفيف. لا يستخدم لفترات طويلة جداً بدون متابعة."
  },
  {

    name: "نانازوكسيد",
    aliases: ["Nanazoxid", "Nitazoxanide", "نيتازوكسانيد", "نانزوكسيد", "نأنازوكسيد", "نإنازوكسيد", "نانازوكسىد", "نانازوكصيد", "ناانازوكسيد", "نااانازوكسيد", "ناااانازوكسيد", "ناننازوكسيد", "نانننازوكسيد", "ناننننازوكسيد", "ناناازوكسيد", "نانااازوكسيد", "ناناااازوكسيد", "ناناززوكسيد", "نانازززوكسيد", "ناناززززوكسيد", "نانازووكسيد", "نانازوووكسيد", "نانازووووكسيد", "ننازوكسيد", "ناازوكسيد", "نانازوككسيد", "نانازوكسييد", "نانازوكسسيد", "ناناازوكسيد", "ناناازوكسيد"],
    scientificName: "Nitazoxanide 500mg",
    category: "مضاد الطفيليات والفيروسات",
    price: "25-50 جنيه",
    uses: [
      "الإسهال بسبب الجارديا",
      "الإسهال بسبب الكريبتوسبوريديوم",
      "إسهال الروتا فيروس (عند الأطفال)",
      "الأميبا",
      "إسهال المناعة الضعيفة"
    ],
    sideEffects: [
      "ألم بالبطن",
      "غثيان",
      "صداع",
      "تغير لون البول (أخضر مصفر - طبيعي)"
    ],
    contraindications: [
      "الحساسية من الدواء",
      "أمراض الكبد أو الكلى الشديدة"
    ],
    dosage: "500mg كل 12 ساعة لمدة 3 أيام (مع الطعام)",
    warnings: "✅ فعال جداً للإسهال الطفيلي. يجب أخذه مع الطعام. قد يحول لون البول للأخضر - لا تقلق هذا طبيعي."
  },
  {

    name: "بيبتو بيسمول",
    aliases: ["Pepto-Bismol", "Bismuth", "بزموث", "بيبتو", "بىبتو بيسمول", "بيبتو بيصمول", "بييبتو بيسمول", "بيييبتو بيسمول", "بييييبتو بيسمول", "بيببتو بيسمول", "بيبببتو بيسمول", "بيببببتو بيسمول", "بيبتتو بيسمول", "بيبتتتو بيسمول", "بيبتتتتو بيسمول", "بيبتوو بيسمول", "بيبتووو بيسمول", "بيبتوووو بيسمول", "بيبتو  بيسمول", "بيبتو   بيسمول", "بيبتو    بيسمول", "ببتو بيسمول", "بيتو بيسمول", "بيبو بيسمول", "بيبتو بييسمول", "بيبتو ببيسمول", "بيبتو بيسموول", "بيبتو  بيسمول", "بيبتو بيسممول", "بيبتو  بيسمول"],
    scientificName: "Bismuth Subsalicylate",
    category: "مضاد للإسهال والحموضة",
    price: "25-50 جنيه",
    uses: [
      "الإسهال الخفيف",
      "حرقة المعدة",
      "عسر الهضم",
      "الغثيان",
      "إسهال المسافرين"
    ],
    sideEffects: [
      "براز أسود (طبيعي - لا تقلق)",
      "لسان أسود مؤقت",
      "إمساك (نادراً)"
    ],
    contraindications: [
      "الحساسية من الأسبرين",
      "الأطفال والمراهقين (خطر متلازمة راي)",
      "القرحة النازفة",
      "الحمل"
    ],
    dosage: "حسب التعليمات - عادة كل 30-60 دقيقة حسب الحاجة",
    warnings: "⚠️ يحول البراز واللسان للون الأسود - هذا طبيعي. ممنوع للأطفال والمراهقين أثناء الإنفلونزا أو الجديري."
  },
  {

    name: "ستربسلز",
    aliases: ["Strepsils", "ستربسلس", "سترپسلز", "صتربسلز", "ستتربسلز", "ستتتربسلز", "ستتتتربسلز", "سترربسلز", "ستررربسلز", "سترررربسلز", "سترببسلز", "ستربببسلز", "سترببببسلز", "ستربسسلز", "ستربسسسلز", "ستربسسسسلز", "ستربسللز", "ستربسلللز", "ستربسللللز", "سربسلز", "ستبسلز", "سترسلز", "ستربسلزز", "ستربسللز", "ستربسسلز", "ستربسسلز", "سترربسلز", "ستتربسلز", "ستتربسلز", "ستربسلزز"],
    scientificName: "Amylmetacresol + Dichlorobenzyl alcohol",
    category: "مطهر للحلق",
    price: "16 جنيه",
    uses: [
      "التهاب الحلق الخفيف",
      "احتقان الزور",
      "التهاب اللثة الخفيف",
      "بحة الصوت"
    ],
    sideEffects: [
      "نادرة جداً",
      "حساسية نادرة",
      "تهيج فم خفيف"
    ],
    contraindications: [
      "الحساسية من المكونات"
    ],
    dosage: "قرص مص كل 2-3 ساعات (بحد أقصى 12 قرص يومياً)",
    warnings: "✅ آمن جداً - مطهر موضعي. لا يُبلع - يُمص ببطء. لا يغني عن المضاد الحيوي في الالتهابات البكتيرية الشديدة."
  },
  {

    name: "أسبرين",
    aliases: ["Aspirin", "Acetylsalicylic acid", "اسبرين", "اسبيرين", "أسبرىن", "أصبرين", "أسسبرين", "أسسسبرين", "أسسسسبرين", "أسببرين", "أسبببرين", "أسببببرين", "أسبررين", "أسبرررين", "أسبررررين", "أسبريين", "أسبرييين", "أسبريييين", "أسبرينن", "أسبريننن", "أسبرينننن", "أبرين", "أسرين", "أسبين", "أسبريين", "أسببرين", "أسسبرين", "أسسبرين", "أسبررين", "أسسبرين"],
    scientificName: "Acetylsalicylic Acid 100mg",
    category: "مسكن ومسيل للدم",
    price: "10 جنيه",
    uses: [
      "الوقاية من الجلطات والذبحة الصدرية",
      "بعد جراحات القلب",
      "السكتة الدماغية (وقاية)",
      "تسكين الألم الخفيف (جرعات أعلى)",
      "خفض الحرارة (جرعات أعلى)"
    ],
    sideEffects: [
      "حرقة المعدة",
      "قرحة المعدة (مع الاستخدام الطويل)",
      "نزيف (يسيل الدم)",
      "طنين الأذن (جرعات عالية)",
      "طفح جلدي أو حساسية"
    ],
    contraindications: [
      "قرحة المعدة النشطة",
      "اضطرابات النزيف (الهيموفيليا)",
      "الربو الحساس للأسبرين",
      "الأطفال أقل من 12 سنة (خطر متلازمة راي)",
      "الثلث الأخير من الحمل"
    ],
    dosage: "للوقاية من الجلطات: 75-100mg مرة واحدة يومياً. للألم: 300-600mg كل 4-6 ساعات",
    warnings: "⚠️⚠️ يسيل الدم - لا تتوقف فجأة إذا كنت تأخذه للقلب. أخبر طبيب الأسنان والجراح أنك تأخذه. خذه بعد الأكل. ممنوع للأطفال أثناء الإنفلونزا أو الجديري."
  },
  {

    name: "بلافيكس",
    aliases: ["Plavix", "Clopidogrel", "كلوبيدوجريل", "بلفيكس", "بلأفيكس", "بلإفيكس", "بلافىكس", "بلافيكص", "بللافيكس", "بلللافيكس", "بللللافيكس", "بلاافيكس", "بلااافيكس", "بلاااافيكس", "بلاففيكس", "بلافففيكس", "بلاففففيكس", "بلافييكس", "بلافيييكس", "بلافييييكس", "بلافيككس", "بلافيكككس", "بلافيككككس", "بافيكس", "بلايكس", "بلاافيكس", "بلاففيكس", "بلاففيكس", "بلافيكسس", "بللافيكس"],
    scientificName: "Clopidogrel 75mg",
    category: "مسيل دم (مضاد تجمع الصفائح)",
    price: "25-50 جنيه",
    uses: [
      "الوقاية من الجلطات القلبية",
      "بعد جراحات القلب والدعامات",
      "السكتة الدماغية (وقاية)",
      "أمراض الشرايين الطرفية",
      "الذبحة الصدرية غير المستقرة"
    ],
    sideEffects: [
      "نزيف (كدمات، نزيف لثة)",
      "طفح جلدي",
      "إسهال",
      "ألم بالمعدة",
      "نادراً جداً: نزيف داخلي خطير"
    ],
    contraindications: [
      "نزيف نشط",
      "قرحة هضمية نازفة",
      "نزيف داخل الجمجمة",
      "أمراض الكبد الشديدة"
    ],
    dosage: "75mg مرة واحدة يومياً (مع أو بدون طعام)",
    warnings: "⚠️⚠️⚠️ مسيل دم قوي - لا تتوقف عنه فجأة بدون استشارة طبيب القلب (قد يسبب جلطة). أخبر أي طبيب أو طبيب أسنان أنك تأخذه قبل أي جراحة. راقب أي نزيف غير عادي. غالباً يُؤخذ مع الأسبرين."
  },
  {

    name: "جلوكوفاج",
    aliases: ["Glucophage", "Metformin", "ميتفورمين", "جلكوفاج", "جلوكوفأج", "جلوكوفإج", "جللوكوفاج", "جلللوكوفاج", "جللللوكوفاج", "جلووكوفاج", "جلوووكوفاج", "جلووووكوفاج", "جلوككوفاج", "جلوكككوفاج", "جلوككككوفاج", "جلوكووفاج", "جلوكوووفاج", "جلوكووووفاج", "جلوكوففاج", "جلوكوفففاج", "جلوكوففففاج", "جوكوفاج", "جلووفاج", "جلوكوففاج", "جلوكوففاج", "جلوككوفاج", "جلوكووفاج", "جلووكوفاج", "جلوككوفاج", "جلوكوفااج"],
    scientificName: "Metformin 500mg",
    category: "علاج السكري (Biguanide)",
    price: "25-50 جنيه",
    uses: [
      "مرض السكري النوع الثاني",
      "مقاومة الأنسولين",
      "تكيس المبايض (PCOS)",
      "الوقاية من السكري (مرحلة ما قبل السكري)"
    ],
    sideEffects: [
      "إسهال (شائع جداً في البداية)",
      "غثيان وقيء",
      "ألم بالمعدة",
      "طعم معدني بالفم",
      "فقدان شهية",
      "نقص فيتامين B12 (استخدام طويل)",
      "نادراً جداً: حماض لاكتيكي (خطير)"
    ],
    contraindications: [
      "أمراض الكلى الشديدة",
      "قصور القلب الحاد",
      "أمراض الكبد الشديدة",
      "إدمان الكحول",
      "قبل وبعد الجراحة أو الأشعة بالصبغة"
    ],
    dosage: "500-850mg 2-3 مرات يومياً مع أو بعد الأكل (قد تزيد حتى 2000mg يومياً)",
    warnings: "⚠️ ابدأ بجرعة صغيرة وزودها تدريجياً لتقليل الإسهال. خذه مع الطعام. لا تشرب كحول. توقف قبل العمليات والأشعة بالصبغة بيومين. افحص وظائف الكلى دورياً. راقب أعراض الحماض اللاكتيكي (تعب شديد، ألم عضلي، صعوبة تنفس) - نادر لكن خطير."
  },
  {

    name: "أماريل",
    aliases: ["Amaryl", "Glimepiride", "جليميبرايد", "امريل", "أمأريل", "أمإريل", "اماريل", "أمارىل", "أمماريل", "أممماريل", "أمممماريل", "أمااريل", "أماااريل", "أمااااريل", "أمارريل", "أماررريل", "أمارررريل", "أمارييل", "أماريييل", "أمارييييل", "أماريلل", "أماريللل", "أماريلللل", "أاريل", "أمريل", "أمايل", "أمارييل", "أمااريل", "أمماريل", "أمارييل"],
    scientificName: "Glimepiride 2mg",
    category: "علاج السكري (Sulfonylurea)",
    price: "65 جنيه",
    uses: [
      "مرض السكري النوع الثاني",
      "تحفيز إفراز الأنسولين"
    ],
    sideEffects: [
      "انخفاض السكر (نقص سكر الدم - هبوط)",
      "زيادة الوزن",
      "غثيان",
      "صداع",
      "دوخة",
      "طفح جلدي نادر"
    ],
    contraindications: [
      "السكري النوع الأول",
      "الحماض الكيتوني",
      "أمراض الكبد أو الكلى الشديدة",
      "الحمل والرضاعة",
      "الحساسية من السلفا"
    ],
    dosage: "1-4mg مرة واحدة يومياً مع الإفطار",
    warnings: "⚠️⚠️ قد يسبب هبوط سكر خطير - احمل حلوى دائماً. خذه مع الإفطار. لا تفوت وجبات. احذر عند القيادة. أخبر طبيبك بأي دواء آخر. قد يزيد الوزن."
  },
  {

    name: "لانتوس",
    aliases: ["Lantus", "Insulin Glargine", "جلارجين", "لنتوس", "لأنتوس", "لإنتوس", "لانتوص", "لاانتوس", "لااانتوس", "لاااانتوس", "لاننتوس", "لانننتوس", "لاننننتوس", "لانتتوس", "لانتتتوس", "لانتتتتوس", "لانتووس", "لانتوووس", "لانتووووس", "لانتوسس", "لانتوسسس", "لانتوسسسس", "لاتوس", "لانوس", "لانتوسس", "لانتوسس", "لانتتوس", "لانتووس", "لاننتوس", "لانتووس"],
    scientificName: "Insulin Glargine 100IU/ml",
    category: "أنسولين طويل المفعول",
    price: "350 جنيه",
    uses: [
      "السكري النوع الأول",
      "السكري النوع الثاني (عند فشل الأقراص)"
    ],
    sideEffects: [
      "انخفاض السكر (هبوط)",
      "زيادة الوزن",
      "ألم أو احمرار مكان الحقن",
      "تورم (احتباس سوائل)",
      "نادراً: حساسية"
    ],
    contraindications: [
      "انخفاض السكر الحالي"
    ],
    dosage: "حسب قراءة السكر - يُحقن تحت الجلد مرة واحدة يومياً (نفس الوقت)",
    warnings: "⚠️⚠️⚠️ يُحفظ في الثلاجة (لم يُستخدم). القلم المستخدم يُحفظ بدرجة حرارة الغرفة (لا تزيد عن شهر). لا تخلطه مع أنسولين آخر. احمل حلوى دائماً. راقب علامات انخفاض السكر. غير شكل الحقن دائماً."
  },
  {

    name: "كونكور",
    aliases: ["Concor", "Bisoprolol", "بيسوبرولول", "كنكور", "كوونكور", "كووونكور", "كوووونكور", "كوننكور", "كونننكور", "كوننننكور", "كونككور", "كونكككور", "كونككككور", "كونكوور", "كونكووور", "كونكوووور", "كونكورر", "كونكوررر", "كونكورررر", "كوكور", "كونور", "كوونكور", "كونكورر", "كونككور", "كونككور", "كوونكور", "كوننكور", "كونككور", "كونكوور", "كونككور"],
    scientificName: "Bisoprolol 5mg",
    category: "خافض ضغط (Beta blocker)",
    price: "70 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "الذبحة الصدرية",
      "قصور القلب",
      "اضطراب نظم القلب",
      "الوقاية بعد الجلطة القلبية"
    ],
    sideEffects: [
      "تعب وإرهاق",
      "برودة الأطراف",
      "دوخة",
      "صداع",
      "بطء النبض",
      "انخفاض ضغط الدم",
      "ضعف جنسي (نادراً)"
    ],
    contraindications: [
      "الربو أو الانسداد الرئوي المزمن الشديد",
      "بطء القلب الشديد",
      "انخفاض الضغط الشديد",
      "قصور القلب غير المستقر",
      "الصدمة القلبية"
    ],
    dosage: "2.5-10mg مرة واحدة يومياً صباحاً",
    warnings: "⚠️⚠️ لا تتوقف فجأة - قد يسبب ذبحة صدرية أو جلطة. قلل الجرعة تدريجياً. قد يخفي علامات انخفاض السكر عند مرضى السكري. قد يسبب تعب - لا تقود إذا شعرت بدوخة."
  },
  {

    name: "نورفاسك",
    aliases: ["Norvasc", "Amlodipine", "أملودبين", "نورفسك", "نورفأسك", "نورفإسك", "نورفاصك", "نوورفاسك", "نووورفاسك", "نوووورفاسك", "نوررفاسك", "نورررفاسك", "نوررررفاسك", "نورففاسك", "نورفففاسك", "نورففففاسك", "نورفااسك", "نورفاااسك", "نورفااااسك", "نورفاسسك", "نورفاسسسك", "نورفاسسسسك", "نرفاسك", "نوفاسك", "نوراسك", "نورفاسسك", "نورفااسك", "نورففاسك", "نورفاسسك", "نورفاسكك"],
    scientificName: "Amlodipine 5mg",
    category: "خافض ضغط (Calcium channel blocker)",
    price: "60 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "الذبحة الصدرية",
      "تضيق الشرايين التاجية"
    ],
    sideEffects: [
      "تورم الكاحلين والقدمين (شائع)",
      "صداع",
      "دوخة",
      "احمرار الوجه (سخونة)",
      "خفقان",
      "تعب"
    ],
    contraindications: [
      "انخفاض الضغط الشديد",
      "الصدمة القلبية",
      "تضيق الشريان الأورطي الشديد"
    ],
    dosage: "5-10mg مرة واحدة يومياً",
    warnings: "✅ آمن نسبياً - يمكن إيقافه بدون تقليل تدريجي. التورم بالقدمين شائع - ليس خطيراً لكن مزعج. قد يزيد تورم اللثة - اعتن بنظافة الفم."
  },
  {

    name: "ديوفان",
    aliases: ["Diovan", "Valsartan", "فالسارتان", "ديوفن", "ديوفأن", "ديوفإن", "دىوفان", "دييوفان", "ديييوفان", "دييييوفان", "ديووفان", "ديوووفان", "ديووووفان", "ديوففان", "ديوفففان", "ديوففففان", "ديوفاان", "ديوفااان", "ديوفاااان", "ديوفانن", "ديوفاننن", "ديوفانننن", "دوفان", "ديفان", "ديوان", "دييوفان", "ديوفاان", "ديوفاان", "ديوفاان", "ديوفانن"],
    scientificName: "Valsartan 80mg",
    category: "خافض ضغط (ARB)",
    price: "80 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "حماية الكلى عند مرضى السكري",
      "بعد الجلطة القلبية"
    ],
    sideEffects: [
      "دوخة",
      "صداع",
      "إسهال",
      "تعب",
      "ارتفاع البوتاسيوم (نادراً)",
      "سعال (أقل من مثبطات ACE)"
    ],
    contraindications: [
      "الحمل (خطر على الجنين)",
      "تضيق الشريان الكلوي الثنائي",
      "ارتفاع البوتاسيوم الشديد"
    ],
    dosage: "80-160mg مرة واحدة يومياً",
    warnings: "⚠️ ممنوع في الحمل - يسبب تشوهات خطيرة للجنين. قلل الملح في الطعام. افحص البوتاسيوم ووظائف الكلى دورياً. قد يسبب دوخة عند الوقوف المفاجئ."
  },
  {

    name: "لازكس",
    aliases: ["Lasix", "Furosemide", "فيوروسيميد", "لاسكس", "لأزكس", "لإزكس", "لازكص", "لاازكس", "لااازكس", "لاااازكس", "لاززكس", "لازززكس", "لاززززكس", "لازككس", "لازكككس", "لازككككس", "لازكسس", "لازكسسس", "لازكسسسس", "لزكس", "لاكس", "لازس", "لاازكس", "لاززكس", "لازكسس", "لازكسس", "لاززكس", "لاززكس", "لازككس", "لاززكس"],
    scientificName: "Furosemide 40mg",
    category: "مدر بول قوي (Loop diuretic)",
    price: "25-50 جنيه",
    uses: [
      "تورم القدمين (الوذمة)",
      "تجمع السوائل في الرئة",
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "أمراض الكلى"
    ],
    sideEffects: [
      "كثرة التبول (طبيعي)",
      "جفاف وعطش",
      "انخفاض البوتاسيوم (خطير)",
      "انخفاض الصوديوم",
      "دوخة عند الوقوف",
      "طنين الأذن (جرعات عالية)",
      "نقص السوائل"
    ],
    contraindications: [
      "الجفاف الشديد",
      "انخفاض البوتاسيوم الشديد",
      "انسداد مجرى البول",
      "غيبوبة كبدية"
    ],
    dosage: "20-80mg يومياً صباحاً (أو حسب احتياج الطبيب)",
    warnings: "⚠️⚠️ يُدر البول بقوة - لا تأخذه مساءً (سيوقظك للتبول). قد ينقص البوتاسيوم خطيراً - تناول موز وبرتقال أو مكمل بوتاسيوم. افحص الأملاح دورياً. قد يسبب جفاف - اشرب ماء كافي."
  },
  {

    name: "ليبيتور",
    aliases: ["Lipitor", "Atorvastatin", "أتورفاستاتين", "لبيتور", "لىبيتور", "لييبيتور", "ليييبيتور", "لييييبيتور", "ليببيتور", "ليبببيتور", "ليببببيتور", "ليبييتور", "ليبيييتور", "ليبييييتور", "ليبيتتور", "ليبيتتتور", "ليبيتتتتور", "ليبيتوور", "ليبيتووور", "ليبيتوووور", "لييتور", "ليبتور", "ليبيتتور", "ليبيتتور", "ليببيتور", "ليبييتور", "ليببيتور", "ليبييتور", "ليبييتور", "ليببيتور"],
    scientificName: "Atorvastatin 20mg",
    category: "خافض الكوليسترول (Statin)",
    price: "100 جنيه",
    uses: [
      "ارتفاع الكوليسترول",
      "ارتفاع الدهون الثلاثية",
      "الوقاية من الجلطات القلبية",
      "أمراض الشرايين التاجية",
      "السكتة الدماغية (وقاية)"
    ],
    sideEffects: [
      "ألم العضلات (شائع)",
      "صداع",
      "غثيان",
      "إسهال أو إمساك",
      "ارتفاع إنزيمات الكبد",
      "نادراً: انحلال العضلات الخطير"
    ],
    contraindications: [
      "أمراض الكبد النشطة",
      "الحمل والرضاعة",
      "حساسية من الستاتينات"
    ],
    dosage: "10-80mg مرة واحدة يومياً مساءً",
    warnings: "⚠️ خذه مساءً (الكبد ينتج كوليسترول ليلاً). افحص إنزيمات الكبد والعضلات دورياً. أخبر طبيبك فوراً عند ألم عضلي شديد (قد يكون خطير). تجنب عصير الجريب فروت - يزيد الأعراض الجانبية. آمن للاستخدام طويل الأمد."
  },
  {

    name: "كريستور",
    aliases: ["Crestor", "Rosuvastatin", "روزوفاستاتين", "كرستور", "كرىستور", "كريصتور", "كرريستور", "كررريستور", "كرررريستور", "كرييستور", "كريييستور", "كرييييستور", "كريسستور", "كريسسستور", "كريسسسستور", "كريستتور", "كريستتتور", "كريستتتتور", "كريستوور", "كريستووور", "كريستوووور", "كيستور", "كريتور", "كرريستور", "كريستتور", "كرريستور", "كرييستور", "كريستوور", "كريستورر", "كرريستور"],
    scientificName: "Rosuvastatin 10mg",
    category: "خافض الكوليسترول (Statin)",
    price: "130 جنيه",
    uses: [
      "نفس ليبيتور - لكن أقوى",
      "ارتفاع الكوليسترول الشديد"
    ],
    sideEffects: [
      "نفس ليبيتور"
    ],
    contraindications: [
      "نفس ليبيتور"
    ],
    dosage: "5-40mg مرة يومياً مساءً",
    warnings: "⚠️ نفس ليبيتور - لكن أقوى. جرعته أقل لنفس التأثير."
  },
  {

    name: "كارفيدلول",
    aliases: ["Carvedilol", "كرفيدلول", "كأرفيدلول", "كإرفيدلول", "كارفىدلول", "كاارفيدلول", "كااارفيدلول", "كاااارفيدلول", "كاررفيدلول", "كارررفيدلول", "كاررررفيدلول", "كارففيدلول", "كارفففيدلول", "كارففففيدلول", "كارفييدلول", "كارفيييدلول", "كارفييييدلول", "كارفيددلول", "كارفيدددلول", "كارفيددددلول", "كافيدلول", "كاريدلول", "كارفيدللول", "كارفيدلولل", "كاارفيدلول", "كاررفيدلول", "كارفيدلوول", "كارفيدلوول", "كاررفيدلول", "كارففيدلول"],
    scientificName: "Carvedilol 12.5mg",
    category: "خافض ضغط (Alpha & Beta blocker)",
    price: "25-50 جنيه",
    uses: [
      "ارتفاع ضغط الدم",
      "قصور القلب",
      "بعد الجلطة القلبية"
    ],
    sideEffects: [
      "دوخة شديدة (خاصة في البداية)",
      "تعب",
      "بطء النبض",
      "انخفاض ضغط",
      "زيادة وزن (قد تكون علامة سوء)",
      "برودة أطراف"
    ],
    contraindications: [
      "الربو",
      "بطء القلب الشديد",
      "قصور القلب الحاد غير المستقر",
      "أمراض الكبد الشديدة"
    ],
    dosage: "6.25-25mg مرتين يومياً مع الطعام",
    warnings: "⚠️⚠️ قد يسبب دوخة شديدة في البداية - ابدأ بجرعة صغيرة. خذه مع الطعام. قف ببطء من الجلوس. لا تتوقف فجأة. راقب وزنك - الزيادة المفاجئة قد تكون علامة سوء."
  },
  {

    name: "نيوروتون",
    aliases: ["Neuroton", "نيروتون", "نيوروتن", "نوروتون", "نروتون", "نىوروتون", "نييوروتون", "نيييوروتون", "نييييوروتون", "نيووروتون", "نيوووروتون", "نيووووروتون", "نيورروتون", "نيوررروتون", "نيورررروتون", "نيورووتون", "نيوروووتون", "نيورووووتون", "نيوروتتون", "نيوروتتتون", "نيوروتتتتون", "نيووتون", "نييوروتون", "نيوروتتون", "نيورروتون", "نيورروتون", "نيورروتون", "نييوروتون", "نيوروتوون", "نيورروتون"],
    scientificName: "Vitamin B complex (B1, B2, B6, B9, B12)",
    category: "فيتامين ب مركب للأعصاب",
    price: "25-50 جنيه",
    uses: [
      "التهاب الأعصاب الطرفية",
      "نقص فيتامين ب",
      "اعتلال الأعصاب السكري",
      "ضعف الذاكرة والتركيز",
      "الأنيميا الخبيثة",
      "رعشة اليدين"
    ],
    sideEffects: [
      "نادراً: طفح جلدي",
      "غثيان خفيف",
      "تغير لون البول للأصفر الفاقع (طبيعي)",
      "صداع نادر"
    ],
    contraindications: [
      "الحساسية من مكونات الدواء",
      "لا يُحقن في الوريد - عضل فقط"
    ],
    dosage: "قرص 1-3 مرات يومياً، أو حقنة عضل 2-3 مرات أسبوعياً",
    warnings: "✅ متوفر حقن وأقراص. الحقن سريعة المفعول للحالات الحادة. آمن للاستخدام طويل الأمد. فيتامين ب2 وحمض الفوليك يميزه عن ميلجا."
  },
  {

    name: "نيوروبيون",
    aliases: ["Neurobion", "نيروبيون", "نوروبيون", "نيوربيون", "نىوروبيون", "نييوروبيون", "نيييوروبيون", "نييييوروبيون", "نيووروبيون", "نيوووروبيون", "نيووووروبيون", "نيورروبيون", "نيوررروبيون", "نيورررروبيون", "نيورووبيون", "نيوروووبيون", "نيورووووبيون", "نيوروببيون", "نيوروبببيون", "نيوروببببيون", "نيووبيون", "نيووروبيون", "نيوروببيون", "نيوروبييون", "نيورروبيون", "نيوروبيوون", "نيوروببيون", "نيوروبيونن", "نيوروبيوون", "نيوروببيون"],
    scientificName: "Vitamin B1, B6, B12",
    category: "فيتامين ب مركب",
    price: "50 جنيه",
    uses: [
      "التهاب الأعصاب",
      "نقص فيتامين ب",
      "ألم الأعصاب",
      "تنميل الأطراف"
    ],
    sideEffects: [
      "نادرة جداً",
      "طفح جلدي نادر"
    ],
    contraindications: [
      "الحساسية من الفيتامينات"
    ],
    dosage: "قرص 1-3 مرات يومياً بعد الأكل، أو حقنة عضل حسب الحالة",
    warnings: "✅ آمن جداً. متوفر حقن وأقراص. مشهور جداً في مصر. نفس استخدام ميلجا تقريباً."
  },
  {

    name: "ثيوتاسيد",
    aliases: ["Thiotacid", "ثيوتسيد", "ثيوتاسد", "تيوتاسيد", "ثيوتكسيد", "ثيوتأسيد", "ثيوتإسيد", "ثىوتاسيد", "ثيوتاصيد", "ثييوتاسيد", "ثيييوتاسيد", "ثييييوتاسيد", "ثيووتاسيد", "ثيوووتاسيد", "ثيووووتاسيد", "ثيوتتاسيد", "ثيوتتتاسيد", "ثيوتتتتاسيد", "ثيوتااسيد", "ثيوتاااسيد", "ثيوتااااسيد", "ثيوتاسسيد", "ثيوتاسسسيد", "ثيوتاسسسسيد", "ثوتاسيد", "ثيتاسيد", "ثيواسيد", "ثيوتتاسيد", "ثيوتااسيد", "ثيوتاسسيد"],
    scientificName: "Thioctic Acid (Alpha Lipoic Acid)",
    category: "مضاد أكسدة لحماية الأعصاب",
    price: "25-50 جنيه",
    uses: [
      "اعتلال الأعصاب السكري",
      "حماية الأعصاب من التلف",
      "مضاد للأكسدة",
      "تنميل وحرقان القدمين",
      "حماية الكبد"
    ],
    sideEffects: [
      "غثيان خفيف",
      "طفح جلدي نادر",
      "انخفاض السكر (احذر)",
      "صداع"
    ],
    contraindications: [
      "الحساسية من الدواء",
      "الأطفال أقل من 12 سنة"
    ],
    dosage: "600mg مرة واحدة يومياً قبل الإفطار بنصف ساعة",
    warnings: "⚠️ قوي جداً لأعصاب مرضى السكري. يُفضل تناوله على معدة فارغة. قد ينقص السكر - راقب السكر. متوفر عيارات 300 و 600mg."
  },
  {

    name: "ثيوتاسيد مركب",
    aliases: ["Thiotacid Compound", "ثيوتاسيد كمبوند", "تيوتاسيد مركب", "ثيوتأسيد مركب", "ثيوتإسيد مركب", "ثىوتاسيد مركب", "ثيوتاصيد مركب", "ثييوتاسيد مركب", "ثيييوتاسيد مركب", "ثييييوتاسيد مركب", "ثيووتاسيد مركب", "ثيوووتاسيد مركب", "ثيووووتاسيد مركب", "ثيوتتاسيد مركب", "ثيوتتتاسيد مركب", "ثيوتتتتاسيد مركب", "ثيوتااسيد مركب", "ثيوتاااسيد مركب", "ثيوتااااسيد مركب", "ثيوتاسسيد مركب", "ثيوتاسسسيد مركب", "ثيوتاسسسسيد مركب", "ثوتاسيد مركب", "ثيتاسيد مركب", "ثيواسيد مركب", "ثيوتاسيد مرككب", "ثيوتتاسيد مركب", "ثيوتاسييد مركب", "ثيوتاسسيد مركب", "ثيوتتاسيد مركب"],
    scientificName: "Thioctic Acid + B1 + B6 + B12",
    category: "مضاد أكسدة + فيتامين ب",
    price: "25-50 جنيه",
    uses: [
      "اعتلال الأعصاب السكري الشديد",
      "حماية الأعصاب",
      "التهاب الأعصاب الطرفية"
    ],
    sideEffects: [
      "نفس ثيوتاسيد العادي"
    ],
    contraindications: [
      "نفس ثيوتاسيد العادي"
    ],
    dosage: "قرص 1-2 مرة يومياً",
    warnings: "✅ يجمع بين حمض الثيوكتيك وفيتامين ب. أقوى من ثيوتاسيد العادي. غالباً يُستخدم مع ميلجا أو بديلاً عنه."
  },
  {

    name: "اركاليون",
    aliases: ["Arcalion", "اركليون", "ارقليون", "اركاليون فورت", "أركاليون", "إركاليون", "اركالىون", "ارركاليون", "اررركاليون", "ارررركاليون", "ارككاليون", "اركككاليون", "ارككككاليون", "اركااليون", "اركاااليون", "اركااااليون", "اركالليون", "اركاللليون", "اركالللليون", "اركالييون", "اركاليييون", "اركالييييون", "اكاليون", "اراليون", "ارككاليون", "ارركاليون", "اركاليوون", "ارككاليون", "اركاليونن", "اركالييون"],
    scientificName: "Sulbutiamine 200mg",
    category: "منشط ذهني",
    price: "25-50 جنيه",
    uses: [
      "الإرهاق والتعب الشديد",
      "ضعف الذاكرة والتركيز",
      "الوهن العام",
      "الخمول والكسل",
      "فقدان الطاقة"
    ],
    sideEffects: [
      "أرق (لا تأخذه مساءً)",
      "صداع",
      "طفح جلدي نادر",
      "عصبية زائدة"
    ],
    contraindications: [
      "الحساسية من الدواء",
      "الأطفال أقل من 15 سنة"
    ],
    dosage: "قرص 1-2 مرة يومياً صباحاً ووقت الظهر",
    warnings: "⚠️ منشط قوي - لا تأخذه بعد الساعة 4 عصراً (يسبب أرق). ممنوع في الامتحانات دون استشارة طبيب. مشتق من فيتامين ب1 لكن أقوى. يعطي طاقة ونشاط."
  },
  {

    name: "نيوروفيت",
    aliases: ["Neurovit", "نيروفيت", "نوروفيت", "نىوروفيت", "نييوروفيت", "نيييوروفيت", "نييييوروفيت", "نيووروفيت", "نيوووروفيت", "نيووووروفيت", "نيورروفيت", "نيوررروفيت", "نيورررروفيت", "نيورووفيت", "نيوروووفيت", "نيورووووفيت", "نيوروففيت", "نيوروفففيت", "نيوروففففيت", "نيووفيت", "نيووروفيت", "نيوروففيت", "نييوروفيت", "نيوروفييت", "نيورروفيت", "نييوروفيت", "نيورووفيت", "نيوروففيت", "نييوروفيت", "نيووروفيت"],
    scientificName: "Vitamin B1, B6, B12",
    category: "فيتامين ب مركب",
    price: "25-50 جنيه",
    uses: [
      "التهاب الأعصاب",
      "نقص فيتامين ب",
      "تقوية الأعصاب"
    ],
    sideEffects: [
      "نادرة جداً"
    ],
    contraindications: [
      "الحساسية من الفيتامينات"
    ],
    dosage: "قرص 1-3 مرات يومياً",
    warnings: "✅ نفس ميلجا تقريباً (نفس المكونات). اختر الأرخص أو المتوفر."
  },
  {

    name: "كوبال",
    aliases: ["Cobal", "كوبل", "كوبال ف", "كوبأل", "كوبإل", "كووبال", "كوووبال", "كووووبال", "كوببال", "كوبببال", "كوببببال", "كوباال", "كوبااال", "كوباااال", "كوبالل", "كوباللل", "كوبالللل", "كبال", "كوال", "كوببال", "كوببال", "كوباال", "كوببال", "كووبال", "كوباال", "كووبال", "كوباال", "كووبال", "كوببال", "كوببال"],
    scientificName: "Mecobalamin (Vitamin B12)",
    category: "فيتامين ب12 النشط",
    price: "25-50 جنيه",
    uses: [
      "نقص فيتامين ب12 الشديد",
      "التهاب الأعصاب الطرفية",
      "الأنيميا الخبيثة",
      "اعتلال الأعصاب"
    ],
    sideEffects: [
      "نادرة جداً",
      "طفح جلدي نادر"
    ],
    contraindications: [
      "الحساسية من ب12",
      "مرض ليبر (Leber's disease)"
    ],
    dosage: "500 ميكروجرام 1-3 مرات يومياً",
    warnings: "✅ فيتامين ب12 النشط (ميكوبالامين) - أقوى من ب12 العادي. فعال جداً للأعصاب. آمن للاستخدام طويل الأمد."
  },
  {

    name: "ليفابيون",
    aliases: ["Livabion", "ليفبيون", "لفابيون", "ليفأبيون", "ليفإبيون", "لىفابيون", "لييفابيون", "ليييفابيون", "لييييفابيون", "ليففابيون", "ليفففابيون", "ليففففابيون", "ليفاابيون", "ليفااابيون", "ليفاااابيون", "ليفاببيون", "ليفابببيون", "ليفاببببيون", "ليفابييون", "ليفابيييون", "ليفابييييون", "ليابيون", "ليفابيوون", "ليفابيونن", "ليفاابيون", "ليفاببيون", "لييفابيون", "ليفابيونن", "ليفابيونن", "ليفاببيون"],
    scientificName: "B-Complex + Orotic Acid",
    category: "فيتامين ب مركب + حمض الأوروتيك",
    price: "25-50 جنيه",
    uses: [
      "التهاب الأعصاب",
      "نقص فيتامين ب",
      "دعم وظائف الكبد",
      "الأنيميا"
    ],
    sideEffects: [
      "نادرة",
      "تغير لون البول"
    ],
    contraindications: [
      "الحساسية من المكونات"
    ],
    dosage: "حقنة عضل 2-3 مرات أسبوعياً، أو حسب الحالة",
    warnings: "✅ متوفر حقن فقط. يحتوي على ب1، ب2، ب6، ب12، ب9، ب3، ب5 + حمض أوروتيك. تركيبة قوية."
  },
  {

    name: "موف",
    aliases: ["Moov", "موف كريم", "مووف", "موووف", "مووووف", "موفف", "موففف", "موفففف", "مف", "مووف", "موفف", "موفف", "موفف", "مووف", "موفف", "موفف", "مووف", "مووف", "مووف", "موفف", "مووف", "مووف", "مووف", "مووف", "موفف", "موفف", "مووف", "مووف", "موفف", "موفف"],
    scientificName: "Diclofenac Gel + Menthol",
    category: "مسكن موضعي للعضلات",
    price: "20 جنيه",
    uses: [
      "آلام العضلات والمفاصل",
      "الشد العضلي",
      "آلام الظهر والرقبة",
      "الكدمات والالتواءات",
      "آلام ما بعد الرياضة"
    ],
    sideEffects: [
      "تهيج جلدي خفيف",
      "احمرار مكان الدهان",
      "حساسية نادرة"
    ],
    contraindications: [
      "الحساسية من الديكلوفيناك",
      "الجروح المفتوحة",
      "الأطفال أقل من 14 سنة"
    ],
    dosage: "دهان موضعي 3-4 مرات يومياً على المنطقة المصابة",
    warnings: "✅ للاستخدام الخارجي فقط. دلك برفق حتى يُمتص. اغسل يديك بعد الاستخدام. لا تضعه على الوجه أو الأغشية المخاطية."
  },
  {

    name: "رابيد فلام",
    aliases: ["Rapidflam", "رابد فلام", "رابيدفلام", "رأبيد فلام", "رإبيد فلام", "رابىد فلام", "راابيد فلام", "رااابيد فلام", "راااابيد فلام", "راببيد فلام", "رابببيد فلام", "راببببيد فلام", "رابييد فلام", "رابيييد فلام", "رابييييد فلام", "رابيدد فلام", "رابيددد فلام", "رابيدددد فلام", "رابيد  فلام", "رابيد   فلام", "رابيد    فلام", "ربيد فلام", "رايد فلام", "رابيد فللام", "رابييد فلام", "راببيد فلام", "رابيد فللام", "رابيد ففلام", "رابيد فلاام", "رابيد  فلام"],
    scientificName: "Diclofenac Potassium 50mg",
    category: "مسكن سريع المفعول",
    price: "25-50 جنيه",
    uses: [
      "آلام المفاصل الحادة",
      "آلام العضلات",
      "الصداع الشديد",
      "آلام الأسنان",
      "آلام الدورة الشهرية"
    ],
    sideEffects: [
      "حرقة المعدة",
      "غثيان",
      "دوخة"
    ],
    contraindications: [
      "قرحة المعدة",
      "الحمل (الثلث الأخير)",
      "أمراض الكلى الشديدة"
    ],
    dosage: "50mg 2-3 مرات يومياً بعد الأكل",
    warnings: "⚠️ مسكن قوي - بعد الأكل فقط. مفعول سريع (15-20 دقيقة). لا تستخدمه أكثر من 5 أيام بدون طبيب."
  },
  {

    name: "روفيناك",
    aliases: ["Rofenac", "روفناك", "روفنك", "روفينأك", "روفينإك", "روفىناك", "رووفيناك", "روووفيناك", "رووووفيناك", "روففيناك", "روفففيناك", "روففففيناك", "روفييناك", "روفيييناك", "روفييييناك", "روفينناك", "روفيننناك", "روفينننناك", "روفينااك", "روفيناااك", "روفينااااك", "رفيناك", "رويناك", "روففيناك", "روفينااك", "روففيناك", "رووفيناك", "روفينناك", "روففيناك", "روففيناك"],
    scientificName: "Diclofenac Sodium 100mg SR",
    category: "مسكن ومضاد التهاب طويل المفعول",
    price: "25-50 جنيه",
    uses: [
      "التهاب المفاصل الروماتويدي",
      "خشونة المفاصل",
      "آلام الظهر المزمنة",
      "النقرس"
    ],
    sideEffects: [
      "حرقة المعدة",
      "غثيان",
      "دوخة"
    ],
    contraindications: [
      "قرحة المعدة",
      "أمراض القلب",
      "الحمل"
    ],
    dosage: "قرص واحد 100mg يومياً أو مرتين (حسب الحالة)",
    warnings: "⚠️ تركيبة ممتدة المفعول - يستمر 12-24 ساعة. نفس فولتارين لكن تركيز أعلى."
  },
  {

    name: "أولفين",
    aliases: ["Olfen", "اولفين", "اولفن", "أولفىن", "أوولفين", "أووولفين", "أوووولفين", "أوللفين", "أولللفين", "أوللللفين", "أولففين", "أولفففين", "أولففففين", "أولفيين", "أولفييين", "أولفيييين", "أولفينن", "أولفيننن", "أولفينننن", "ألفين", "أوفين", "أولين", "أوللفين", "أولفيين", "أوولفين", "أولفينن", "أولففين", "أولفيين", "أوولفين", "أوولفين"],
    scientificName: "Diclofenac Sodium 75mg",
    category: "مسكن ومضاد التهاب",
    price: "25-50 جنيه",
    uses: [
      "آلام المفاصل",
      "التهاب الأوتار",
      "آلام الظهر",
      "آلام ما بعد الجراحة"
    ],
    sideEffects: [
      "نفس فولتارين"
    ],
    contraindications: [
      "نفس فولتارين"
    ],
    dosage: "قرص 75mg مرتين يومياً بعد الأكل",
    warnings: "⚠️ نفس فولتارين (ديكلوفيناك) - اختر الأرخص. متوفر أقراص وحقن وجل."
  },
  {

    name: "دانزن",
    aliases: ["Danzen", "دنزن", "دانزين", "دأنزن", "دإنزن", "داانزن", "دااانزن", "داااانزن", "داننزن", "دانننزن", "داننننزن", "دانززن", "دانزززن", "دانززززن", "دانزنن", "دانزننن", "دانزنننن", "دازن", "دانن", "داانزن", "دانززن", "داانزن", "دانززن", "دانزنن", "دانززن", "داننزن", "دانزنن", "دانزنن", "داانزن", "داننزن"],
    scientificName: "Serratiopeptidase 5mg",
    category: "مضاد التهاب إنزيمي",
    price: "25-50 جنيه",
    uses: [
      "التورم والالتهاب",
      "ما بعد العمليات الجراحية",
      "التهاب الجيوب الأنفية",
      "تورم الإصابات",
      "البلغم الكثيف"
    ],
    sideEffects: [
      "غثيان خفيف",
      "طفح جلدي نادر",
      "ألم بالمعدة"
    ],
    contraindications: [
      "الحساسية من الإنزيمات",
      "اضطرابات النزيف",
      "قبل العمليات (يُوقف قبلها ب 48 ساعة)"
    ],
    dosage: "5-10mg ثلاث مرات يومياً قبل الأكل بساعتين أو بعده بساعتين",
    warnings: "✅ إنزيم طبيعي - يقلل التورم والالتهاب. يُذيب البلغم. يجب أخذه على معدة فارغة. آمن نسبياً."
  },
  {

    name: "امبيزيم",
    aliases: ["Ambezim", "امبزيم", "امبيزم", "أمبيزيم", "إمبيزيم", "امبىزيم", "اممبيزيم", "امممبيزيم", "اممممبيزيم", "امببيزيم", "امبببيزيم", "امببببيزيم", "امبييزيم", "امبيييزيم", "امبييييزيم", "امبيززيم", "امبيزززيم", "امبيززززيم", "امبيزييم", "امبيزيييم", "امبيزييييم", "ابيزيم", "اميزيم", "امببيزيم", "امبيزييم", "امبيزييم", "امبييزيم", "امبيززيم", "امبيززيم", "امبييزيم"],
    scientificName: "Proteolytic Enzymes Complex",
    category: "مضاد التهاب إنزيمي",
    price: "25-50 جنيه",
    uses: [
      "التورم والالتهاب",
      "ما بعد العمليات",
      "الإصابات الرياضية",
      "التهاب الأوتار"
    ],
    sideEffects: [
      "نادرة",
      "غثيان خفيف"
    ],
    contraindications: [
      "الحساسية من الإنزيمات",
      "اضطرابات النزيف"
    ],
    dosage: "قرص 2-3 مرات يومياً بين الوجبات",
    warnings: "✅ يحتوي على مزيج إنزيمات. نفس فكرة دانزن. على معدة فارغة."
  },
  {

    name: "ميوفين",
    aliases: ["Myofen", "ميوفن", "مايوفين", "مىوفين", "مييوفين", "ميييوفين", "مييييوفين", "ميووفين", "ميوووفين", "ميووووفين", "ميوففين", "ميوفففين", "ميوففففين", "ميوفيين", "ميوفييين", "ميوفيييين", "ميوفينن", "ميوفيننن", "ميوفينننن", "موفين", "ميفين", "ميوين", "ميوفينن", "ميوففين", "ميوفيين", "مييوفين", "ميوففين", "ميوفينن", "ميوففين", "ميوفينن"],
    scientificName: "Ibuprofen 400mg + Methocarbamol 500mg",
    category: "مسكن + باسط عضلات",
    price: "25-50 جنيه",
    uses: [
      "الشد العضلي",
      "آلام الظهر والرقبة",
      "تقلصات العضلات",
      "آلام ما بعد الإصابات"
    ],
    sideEffects: [
      "نعاس",
      "دوخة",
      "غثيان",
      "حرقة المعدة"
    ],
    contraindications: [
      "قرحة المعدة",
      "الوهن العضلي",
      "القيادة (يسبب نعاس)"
    ],
    dosage: "قرص 2-3 مرات يومياً بعد الأكل",
    warnings: "⚠️ يجمع مسكن + باسط عضلات. يسبب نعاس - لا تقود. ممتاز للتقلصات والشد العضلي."
  },
  {

    name: "ريلاكسون",
    aliases: ["Relaxon", "ريلكسون", "ريلاكسن", "ريلأكسون", "ريلإكسون", "رىلاكسون", "ريلاكصون", "رييلاكسون", "ريييلاكسون", "رييييلاكسون", "ريللاكسون", "ريلللاكسون", "ريللللاكسون", "ريلااكسون", "ريلاااكسون", "ريلااااكسون", "ريلاككسون", "ريلاكككسون", "ريلاككككسون", "ريلاكسسون", "ريلاكسسسون", "ريلاكسسسسون", "رلاكسون", "رياكسون", "ريلاكسونن", "رييلاكسون", "رييلاكسون", "ريلاكسونن", "ريللاكسون", "ريلاككسون"],
    scientificName: "Chlorzoxazone 250mg + Paracetamol 300mg",
    category: "باسط عضلات + مسكن",
    price: "25-50 جنيه",
    uses: [
      "الشد العضلي",
      "آلام الظهر الحادة",
      "تقلصات العضلات",
      "التواء العضلات"
    ],
    sideEffects: [
      "نعاس شديد",
      "دوخة",
      "غثيان",
      "بول برتقالي أو أحمر (طبيعي)"
    ],
    contraindications: [
      "أمراض الكبد",
      "الحساسية من المكونات",
      "القيادة"
    ],
    dosage: "قرص 3-4 مرات يومياً",
    warnings: "⚠️⚠️ يسبب نعاس شديد - ممنوع القيادة. البول قد يتغير لونه (طبيعي). فعال جداً للشد العضلي."
  },
  {

    name: "مسكادول",
    aliases: ["Muscadol", "مسكدول", "مسكدل", "مسكأدول", "مسكإدول", "مصكادول", "مسسكادول", "مسسسكادول", "مسسسسكادول", "مسككادول", "مسكككادول", "مسككككادول", "مسكاادول", "مسكااادول", "مسكاااادول", "مسكاددول", "مسكادددول", "مسكاددددول", "مسكادوول", "مسكادووول", "مسكادوووول", "مكادول", "مسادول", "مسكادولل", "مسكاددول", "مسسكادول", "مسكادوول", "مسكادولل", "مسككادول", "مسكاادول"],
    scientificName: "Orphenadrine 35mg + Paracetamol 450mg",
    category: "باسط عضلات + مسكن",
    price: "25-50 جنيه",
    uses: [
      "آلام الظهر والرقبة",
      "الشد العضلي",
      "تقلصات العضلات",
      "آلام الديسك"
    ],
    sideEffects: [
      "جفاف الفم (شائع)",
      "نعاس",
      "دوخة",
      "تشوش الرؤية"
    ],
    contraindications: [
      "الجلوكوما",
      "تضخم البروستاتا",
      "الوهن العضلي",
      "القيادة"
    ],
    dosage: "قرص 3-4 مرات يومياً",
    warnings: "⚠️ يسبب جفاف فم شديد - اشرب ماء كثير. يسبب نعاس - لا تقود. فعال جداً لآلام الديسك."
  },
  {

    name: "كالسيد",
    aliases: ["Calcid", "كلسيد", "كالسد", "كألسيد", "كإلسيد", "كالسىد", "كالصيد", "كاالسيد", "كااالسيد", "كاااالسيد", "كاللسيد", "كالللسيد", "كاللللسيد", "كالسسيد", "كالسسسيد", "كالسسسسيد", "كالسييد", "كالسيييد", "كالسييييد", "كالسيدد", "كالسيددد", "كالسيدددد", "كاسيد", "كاليد", "كاالسيد", "كالسسيد", "كاللسيد", "كاللسيد", "كالسييد", "كاالسيد"],
    scientificName: "Calcium + Vitamin D3",
    category: "مكمل كالسيوم",
    price: "25-50 جنيه",
    uses: [
      "هشاشة العظام",
      "نقص الكالسيوم",
      "الحمل والرضاعة",
      "الوقاية من الكسور",
      "نقص فيتامين د"
    ],
    sideEffects: [
      "إمساك (شائع)",
      "انتفاخ",
      "غثيان خفيف"
    ],
    contraindications: [
      "فرط كالسيوم الدم",
      "حصوات الكلى",
      "فرط نشاط الغدة جار الدرقية"
    ],
    dosage: "قرص 1-2 مرة يومياً مع أو بعد الأكل",
    warnings: "✅ يُفضل أخذه مع الطعام. اشرب ماء كثير لتجنب الإمساك. لا تأخذه مع الحديد (يتعارضان)."
  },
  {

    name: "اوستيوكير",
    aliases: ["Osteocare", "اوستوكير", "استيوكير", "أوستيوكير", "إوستيوكير", "اوستىوكير", "اوصتيوكير", "اووستيوكير", "اوووستيوكير", "اووووستيوكير", "اوسستيوكير", "اوسسستيوكير", "اوسسسستيوكير", "اوستتيوكير", "اوستتتيوكير", "اوستتتتيوكير", "اوستييوكير", "اوستيييوكير", "اوستييييوكير", "اوستيووكير", "اوستيوووكير", "اوستيووووكير", "اوتيوكير", "اوسيوكير", "اوستيوككير", "اوستيوكيرر", "اوستتيوكير", "اوستيوكيرر", "اوستييوكير", "اووستيوكير"],
    scientificName: "Calcium + Magnesium + Zinc + Vitamin D",
    category: "مكمل عظام شامل",
    price: "25-50 جنيه",
    uses: [
      "هشاشة العظام",
      "دعم صحة العظام",
      "الحمل والرضاعة",
      "الوقاية من الكسور"
    ],
    sideEffects: [
      "إمساك خفيف",
      "طعم معدني بالفم"
    ],
    contraindications: [
      "فرط كالسيوم الدم"
    ],
    dosage: "قرص 1-2 مرة يومياً",
    warnings: "✅ تركيبة شاملة - كالسيوم + ماغنيسيوم + زنك + فيتامين د. ممتاز للحوامل والمرضعات."
  },
  {

    name: "اوسوفورتين",
    aliases: ["Ossofortin", "اوسفورتين", "اوسوفرتين", "Ossofortin 0.25", "أوسوفورتين", "إوسوفورتين", "اوسوفورتىن", "اوصوفورتين", "اووسوفورتين", "اوووسوفورتين", "اووووسوفورتين", "اوسسوفورتين", "اوسسسوفورتين", "اوسسسسوفورتين", "اوسووفورتين", "اوسوووفورتين", "اوسووووفورتين", "اوسوففورتين", "اوسوفففورتين", "اوسوففففورتين", "اوسوفوورتين", "اوسوفووورتين", "اوسوفوووورتين", "اسوفورتين", "اووفورتين", "اوسووفورتين", "اوسوفورتتين", "اوسوفورتيين", "اوسسوفورتين", "اوسوفورتينن"],
    scientificName: "Alfacalcidol 0.25 mcg",
    category: "فيتامين د النشط",
    price: "25-50 جنيه",
    uses: [
      "نقص فيتامين د الشديد",
      "هشاشة العظام",
      "الكساح",
      "قصور الغدة جار الدرقية",
      "الفشل الكلوي المزمن"
    ],
    sideEffects: [
      "صداع",
      "غثيان",
      "فرط كالسيوم الدم (خطير)",
      "عطش شديد",
      "كثرة التبول"
    ],
    contraindications: [
      "فرط كالسيوم الدم",
      "فرط فيتامين د",
      "حصوات الكلى"
    ],
    dosage: "كبسولة واحدة يومياً أو يوم بعد يوم (حسب الطبيب)",
    warnings: "⚠️⚠️ فيتامين د نشط - أقوى من فيتامين د العادي. لا تتجاوز الجرعة. افحص كالسيوم الدم دورياً. يُعطى بحذر شديد."
  },
  {

    name: "فيدروب",
    aliases: ["Vi-De3", "فيديروب", "فيدى دروب", "في دي ثري", "فىدروب", "فييدروب", "فيييدروب", "فييييدروب", "فيددروب", "فيدددروب", "فيددددروب", "فيدرروب", "فيدررروب", "فيدرررروب", "فيدرووب", "فيدروووب", "فيدرووووب", "فيدروبب", "فيدروببب", "فيدروبببب", "فدروب", "فيروب", "فيدوب", "فييدروب", "فيدرووب", "فيددروب", "فيددروب", "فيددروب", "فيددروب", "فيدرووب"],
    scientificName: "Cholecalciferol (Vitamin D3) Drops",
    category: "فيتامين د للأطفال",
    price: "25-50 جنيه",
    uses: [
      "الوقاية من الكساح",
      "نقص فيتامين د عند الأطفال",
      "دعم نمو العظام",
      "تقوية المناعة"
    ],
    sideEffects: [
      "نادرة جداً بالجرعات الصحيحة",
      "فرط فيتامين د (جرعات زائدة)"
    ],
    contraindications: [
      "فرط كالسيوم الدم",
      "فرط فيتامين د"
    ],
    dosage: "4 نقط يومياً للرضع، أو حسب إرشادات الطبيب",
    warnings: "✅ آمن للأطفال والرضع. يُعطى من الولادة. 4 نقط = 400 وحدة دولية. ضروري لكل طفل."
  },
  {

    name: "وان الفا",
    aliases: ["One Alpha", "ون الفا", "وان ألفا", "وأن الفا", "وإن الفا", "واان الفا", "وااان الفا", "واااان الفا", "وانن الفا", "واننن الفا", "وانننن الفا", "وان  الفا", "وان   الفا", "وان    الفا", "وان االفا", "وان ااالفا", "وان اااالفا", "وان اللفا", "وان الللفا", "وان اللللفا", "وا الفا", "وانالفا", "وان الفاا", "وانن الفا", "وان  الفا", "وان الففا", "وان الفاا", "واان الفا", "وان الفاا", "واان الفا"],
    scientificName: "Alfacalcidol 1 mcg",
    category: "فيتامين د النشط",
    price: "25-50 جنيه",
    uses: [
      "نفس اوسوفورتين - لكن تركيز أعلى",
      "هشاشة العظام الشديدة"
    ],
    sideEffects: [
      "نفس اوسوفورتين"
    ],
    contraindications: [
      "نفس اوسوفورتين"
    ],
    dosage: "كبسولة واحدة يومياً أو حسب الطبيب",
    warnings: "⚠️⚠️ تركيز عالي - احذر من الجرعة الزائدة. متابعة دورية للكالسيوم ضرورية."
  },
  {

    name: "كومتركس",
    aliases: ["Comtrex", "كمتركس", "كومترك", "كومتركص", "كوومتركس", "كووومتركس", "كوووومتركس", "كوممتركس", "كومممتركس", "كوممممتركس", "كومتتركس", "كومتتتركس", "كومتتتتركس", "كومترركس", "كومتررركس", "كومترررركس", "كومترككس", "كومتركككس", "كومترككككس", "كوتركس", "كومركس", "كومتركسس", "كومترركس", "كومترركس", "كوومتركس", "كوومتركس", "كومتركسس", "كومتتركس", "كومتتركس", "كومترركس"],
    scientificName: "Paracetamol + Chlorpheniramine + Pseudoephedrine",
    category: "علاج البرد والإنفلونزا",
    price: "25-50 جنيه",
    uses: [
      "نفس كونجستال",
      "أعراض البرد والإنفلونزا",
      "احتقان الأنف"
    ],
    sideEffects: [
      "نفس كونجستال"
    ],
    contraindications: [
      "نفس كونجستال"
    ],
    dosage: "قرص كل 6 ساعات (بحد أقصى 4 أقراص يومياً)",
    warnings: "⚠️ نفس كونجستال تماماً (نفس المكونات). يسبب نعاس - لا تقود."
  },
  {

    name: "فلورست",
    aliases: ["Flurest", "فلرست", "فلوريست", "فلورصت", "فللورست", "فلللورست", "فللللورست", "فلوورست", "فلووورست", "فلوووورست", "فلوررست", "فلورررست", "فلوررررست", "فلورسست", "فلورسسست", "فلورسسسست", "فلورستت", "فلورستتت", "فلورستتتت", "فورست", "فلوست", "فلورسست", "فللورست", "فلورستت", "فلورستت", "فلورستت", "فلوررست", "فلوررست", "فلورسست", "فللورست"],
    scientificName: "Paracetamol + Chlorpheniramine + Pseudoephedrine",
    category: "علاج البرد",
    price: "25-50 جنيه",
    uses: [
      "نفس كونجستال وكومتركس"
    ],
    sideEffects: [
      "نفس كونجستال"
    ],
    contraindications: [
      "نفس كونجستال"
    ],
    dosage: "قرص كل 6 ساعات",
    warnings: "⚠️ نفس كونجستال (نفس المكونات). اختر الأرخص."
  },
  {

    name: "123",
    aliases: ["123 cold", "وان تو ثري", "١٢٣", "1223", "12223", "122223", "1233", "12333", "123333", "13", "1233", "1223", "1233", "1233", "1233", "1233", "1233", "1233", "1233", "1223", "1223", "1233", "1223", "1233", "1223", "1223", "1223", "1233", "1223", "1233"],
    scientificName: "Paracetamol + Chlorpheniramine + Pseudoephedrine",
    category: "علاج البرد",
    price: "25-50 جنيه",
    uses: [
      "أعراض البرد والإنفلونزا"
    ],
    sideEffects: [
      "نفس كونجستال"
    ],
    contraindications: [
      "نفس كونجستال"
    ],
    dosage: "قرص كل 6 ساعات",
    warnings: "⚠️ نفس كونجستال (نفس المكونات). مشهور جداً في مصر."
  },
  {

    name: "نوفلو",
    aliases: ["Novaflu", "نوفافلو", "نوفلو", "نووفلو", "نوووفلو", "نووووفلو", "نوففلو", "نوفففلو", "نوففففلو", "نوفللو", "نوفلللو", "نوفللللو", "نوفلوو", "نوفلووو", "نوفلوووو", "نفلو", "نولو", "نوفو", "نووفلو", "نووفلو", "نوففلو", "نوفلوو", "نوفللو", "نوفلوو", "نوفلوو", "نوففلو", "نووفلو", "نوففلو", "نووفلو", "نووفلو"],
    scientificName: "Paracetamol + Chlorpheniramine + Pseudoephedrine",
    category: "علاج البرد",
    price: "25-50 جنيه",
    uses: [
      "أعراض البرد"
    ],
    sideEffects: [
      "نفس كونجستال"
    ],
    contraindications: [
      "نفس كونجستال"
    ],
    dosage: "قرص كل 6 ساعات",
    warnings: "⚠️ نفس كونجستال. متوفر أيضاً شراب للأطفال."
  },
  {

    name: "ونكولد",
    aliases: ["Wincold", "وانكولد", "وان كولد", "وننكولد", "ونننكولد", "وننننكولد", "ونككولد", "ونكككولد", "ونككككولد", "ونكوولد", "ونكووولد", "ونكوووولد", "ونكوللد", "ونكولللد", "ونكوللللد", "ونكولدد", "ونكولددد", "ونكولدددد", "وكولد", "ونولد", "ونكلد", "ونكوللد", "ونكوللد", "ونكوولد", "ونكوللد", "ونكوولد", "ونككولد", "ونككولد", "ونكوللد", "ونككولد"],
    scientificName: "Paracetamol + Chlorpheniramine + Pseudoephedrine",
    category: "علاج البرد",
    price: "25-50 جنيه",
    uses: [
      "أعراض البرد"
    ],
    sideEffects: [
      "نفس كونجستال"
    ],
    contraindications: [
      "نفس كونجستال"
    ],
    dosage: "قرص كل 6 ساعات",
    warnings: "⚠️ نفس كونجستال."
  },
  {

    name: "تلفاست",
    aliases: ["Telfast", "تلفست", "تيلفاست", "Telfast 180", "تلفأست", "تلفإست", "تلفاصت", "تللفاست", "تلللفاست", "تللللفاست", "تلففاست", "تلفففاست", "تلففففاست", "تلفااست", "تلفاااست", "تلفااااست", "تلفاسست", "تلفاسسست", "تلفاسسسست", "تلفاستت", "تلفاستتت", "تلفاستتتت", "تفاست", "تلاست", "تلفاسست", "تلفاسست", "تلفاسست", "تللفاست", "تللفاست", "تللفاست"],
    scientificName: "Fexofenadine 120-180mg",
    category: "مضاد حساسية (جيل ثالث)",
    price: "25-50 جنيه",
    uses: [
      "حساسية الأنف الموسمية",
      "الشرى المزمن",
      "الحكة الجلدية",
      "حساسية الغبار"
    ],
    sideEffects: [
      "صداع خفيف",
      "نادراً: غثيان",
      "لا يسبب نعاس"
    ],
    contraindications: [
      "الحساسية من الدواء",
      "أمراض الكلى الشديدة"
    ],
    dosage: "120-180mg مرة واحدة يومياً",
    warnings: "✅ لا يسبب نعاس (جيل ثالث). أقوى من كلاريتين وزيرتك. آمن للقيادة. متوفر 120 و 180mg."
  },
  {

    name: "ايريوس",
    aliases: ["Aerius", "اريوس", "ايريس", "أيريوس", "إيريوس", "اىريوس", "ايريوص", "اييريوس", "ايييريوس", "اييييريوس", "ايرريوس", "ايررريوس", "ايرررريوس", "ايرييوس", "ايريييوس", "ايرييييوس", "ايريووس", "ايريوووس", "ايريووووس", "ايريوسس", "ايريوسسس", "ايريوسسسس", "اييوس", "ايروس", "اييريوس", "ايرييوس", "اييريوس", "ايريوسس", "اييريوس", "اييريوس"],
    scientificName: "Desloratadine 5mg",
    category: "مضاد حساسية (جيل ثالث)",
    price: "25-50 جنيه",
    uses: [
      "حساسية الأنف",
      "الشرى",
      "الحكة"
    ],
    sideEffects: [
      "صداع خفيف",
      "لا نعاس"
    ],
    contraindications: [
      "الحساسية من الدواء"
    ],
    dosage: "5mg مرة واحدة يومياً",
    warnings: "✅ لا نعاس. جيل ثالث. أقوى من كلاريتين (مشتق منه)."
  },
  {

    name: "زوركس",
    aliases: ["Xyzal", "زيزال", "اكسيزال", "زوركص", "زووركس", "زوووركس", "زووووركس", "زورركس", "زوررركس", "زورررركس", "زورككس", "زوركككس", "زورككككس", "زوركسس", "زوركسسس", "زوركسسسس", "زركس", "زوكس", "زورس", "زوركسس", "زووركس", "زورركس", "زورركس", "زووركس", "زورككس", "زووركس", "زورككس", "زووركس", "زوركسس", "زوركسس"],
    scientificName: "Levocetirizine 5mg",
    category: "مضاد حساسية",
    price: "25-50 جنيه",
    uses: [
      "حساسية الأنف",
      "الشرى",
      "الحكة"
    ],
    sideEffects: [
      "نعاس خفيف (أقل من زيرتك)"
    ],
    contraindications: [
      "الحساسية من الدواء"
    ],
    dosage: "5mg مرة يومياً مساءً",
    warnings: "✅ أقوى من زيرتك (النصف النشط منه). قد يسبب نعاس خفيف."
  },
  {

    name: "اوتريفين",
    aliases: ["Otrivin", "اوترفين", "اوتريفن", "أوتريفين", "إوتريفين", "اوترىفين", "اووتريفين", "اوووتريفين", "اووووتريفين", "اوتتريفين", "اوتتتريفين", "اوتتتتريفين", "اوترريفين", "اوتررريفين", "اوترررريفين", "اوترييفين", "اوتريييفين", "اوترييييفين", "اوتريففين", "اوتريفففين", "اوتريففففين", "اتريفين", "اوريفين", "اوتيفين", "اوترييفين", "اوترريفين", "اوتريفيين", "اوترريفين", "اوتريفينن", "اوتريففين"],
    scientificName: "Xylometazoline 0.1%",
    category: "قطرة أنف مضادة للاحتقان",
    price: "25-50 جنيه",
    uses: [
      "احتقان الأنف الشديد",
      "الزكام",
      "التهاب الجيوب الأنفية"
    ],
    sideEffects: [
      "جفاف الأنف",
      "حرقان خفيف",
      "احتقان ارتدادي (بعد التوقف)"
    ],
    contraindications: [
      "ارتفاع ضغط الدم الشديد",
      "أمراض القلب",
      "الأطفال أقل من 6 سنوات (0.1%)"
    ],
    dosage: "2-3 نقط في كل فتحة أنف 3 مرات يومياً",
    warnings: "⚠️⚠️ لا تستخدمه أكثر من 3-5 أيام (يسبب إدمان الأنف - احتقان ارتدادي). فعال جداً لكن خطير بالاستخدام الطويل."
  },
  {

    name: "نازونكس",
    aliases: ["Nasonex", "نزونكس", "نازونيكس", "نأزونكس", "نإزونكس", "نازونكص", "ناازونكس", "نااازونكس", "ناااازونكس", "ناززونكس", "نازززونكس", "ناززززونكس", "نازوونكس", "نازووونكس", "نازوووونكس", "نازوننكس", "نازونننكس", "نازوننننكس", "نازونككس", "نازونكككس", "نازونككككس", "ناونكس", "نازنكس", "ناازونكس", "نازونكسس", "نازوونكس", "ناازونكس", "ناازونكس", "ناززونكس", "نازونككس"],
    scientificName: "Mometasone Furoate Nasal Spray",
    category: "بخاخ أنف كورتيزون",
    price: "25-50 جنيه",
    uses: [
      "حساسية الأنف المزمنة",
      "التهاب الجيوب الأنفية",
      "الزوائد الأنفية (اللحمية)"
    ],
    sideEffects: [
      "جفاف الأنف",
      "نزيف أنفي خفيف",
      "صداع"
    ],
    contraindications: [
      "عدوى أنفية نشطة",
      "السل الرئوي"
    ],
    dosage: "بختان في كل فتحة أنف مرة واحدة يومياً صباحاً",
    warnings: "✅ كورتيزون موضعي - آمن للاستخدام طويل الأمد. لا يُمتص بالدم. ممتاز للحساسية المزمنة. يستغرق 2-3 أيام ليبدأ المفعول."
  },
  {

    name: "رينوكورت",
    aliases: ["Rhinocort", "رينكورت", "راينوكورت", "رىنوكورت", "ريينوكورت", "رييينوكورت", "ريييينوكورت", "ريننوكورت", "رينننوكورت", "ريننننوكورت", "رينووكورت", "رينوووكورت", "رينووووكورت", "رينوككورت", "رينوكككورت", "رينوككككورت", "رينوكوورت", "رينوكووورت", "رينوكوووورت", "رنوكورت", "ريوكورت", "رينوكوورت", "رينوكوورت", "ريينوكورت", "رينوكورتت", "ريننوكورت", "رينوكوورت", "رينوكورتت", "ريننوكورت", "ريينوكورت"],
    scientificName: "Budesonide Nasal Spray",
    category: "بخاخ أنف كورتيزون",
    price: "25-50 جنيه",
    uses: [
      "حساسية الأنف",
      "التهاب الجيوب الأنفية"
    ],
    sideEffects: [
      "نفس نازونكس"
    ],
    contraindications: [
      "نفس نازونكس"
    ],
    dosage: "بختان في كل فتحة مرة يومياً",
    warnings: "✅ نفس فكرة نازونكس (كورتيزون موضعي). اختر المتوفر."
  },
  {

    name: "زيثروكان",
    aliases: ["Zithrokan", "زيثروكن", "زثروكان", "زيثروكأن", "زيثروكإن", "زىثروكان", "زييثروكان", "زيييثروكان", "زييييثروكان", "زيثثروكان", "زيثثثروكان", "زيثثثثروكان", "زيثرروكان", "زيثررروكان", "زيثرررروكان", "زيثرووكان", "زيثروووكان", "زيثرووووكان", "زيثروككان", "زيثروكككان", "زيثروككككان", "زيروكان", "زيثوكان", "زيثروككان", "زيثرروكان", "زيثرووكان", "زيثروككان", "زيثرووكان", "زيثروكانن", "زيثرروكان"],
    scientificName: "Azithromycin 500mg",
    category: "مضاد حيوي (ماكروليد)",
    price: "25-50 جنيه",
    uses: [
      "التهاب الحلق واللوزتين",
      "التهاب الشعب الهوائية",
      "الالتهاب الرئوي",
      "التهاب الجيوب الأنفية",
      "التهابات الجلد"
    ],
    sideEffects: [
      "إسهال",
      "غثيان",
      "ألم بالبطن",
      "صداع"
    ],
    contraindications: [
      "الحساسية من الماكروليدات",
      "أمراض الكبد الشديدة"
    ],
    dosage: "500mg مرة واحدة يومياً لمدة 3 أيام (جرعة قصيرة)",
    warnings: "✅ مضاد حيوي قوي - جرعة 3 أيام فقط عادة. بديل للبنسلين لمن لديهم حساسية. يُؤخذ قبل الأكل بساعة أو بعده بساعتين."
  },
  {

    name: "يوناسين",
    aliases: ["Unasyn", "يوناسن", "يونسين", "يونأسين", "يونإسين", "ىوناسين", "يوناصين", "يووناسين", "يوووناسين", "يووووناسين", "يونناسين", "يوننناسين", "يونننناسين", "يونااسين", "يوناااسين", "يونااااسين", "يوناسسين", "يوناسسسين", "يوناسسسسين", "يوناسيين", "يوناسييين", "يوناسيييين", "يناسين", "يواسين", "يوناسسين", "يونناسين", "يوناسيين", "يوناسينن", "يوناسينن", "يوناسينن"],
    scientificName: "Ampicillin + Sulbactam",
    category: "مضاد حيوي حقن",
    price: "25-50 جنيه",
    uses: [
      "العدوى الشديدة",
      "الالتهاب الرئوي الحاد",
      "التهابات البطن",
      "الإنتان (Sepsis)"
    ],
    sideEffects: [
      "إسهال",
      "طفح جلدي",
      "ألم مكان الحقن"
    ],
    contraindications: [
      "حساسية البنسلين"
    ],
    dosage: "حقن وريدي أو عضل كل 6-8 ساعات (حسب الطبيب)",
    warnings: "⚠️⚠️ مضاد حيوي قوي جداً - للحالات الشديدة فقط. يُعطى في المستشفى غالباً. متوفر حقن فقط."
  },
  {

    name: "سيفوتاكس",
    aliases: ["Cefotax", "سيفوتكس", "سفوتاكس", "سيفوتأكس", "سيفوتإكس", "سىفوتاكس", "صيفوتاكس", "سييفوتاكس", "سيييفوتاكس", "سييييفوتاكس", "سيففوتاكس", "سيفففوتاكس", "سيففففوتاكس", "سيفووتاكس", "سيفوووتاكس", "سيفووووتاكس", "سيفوتتاكس", "سيفوتتتاكس", "سيفوتتتتاكس", "سيفوتااكس", "سيفوتاااكس", "سيفوتااااكس", "سيوتاكس", "سيفتاكس", "سيفووتاكس", "سييفوتاكس", "سيفوتتاكس", "سيفوتتاكس", "سيفووتاكس", "سيفووتاكس"],
    scientificName: "Cefotaxime",
    category: "مضاد حيوي حقن (سيفالوسبورين)",
    price: "25-50 جنيه",
    uses: [
      "العدوى الشديدة",
      "الحمى",
      "التهابات خطيرة"
    ],
    sideEffects: [
      "طفح جلدي",
      "إسهال",
      "ألم مكان الحقن"
    ],
    contraindications: [
      "حساسية السيفالوسبورينات"
    ],
    dosage: "حقن عضل أو وريد كل 12 ساعة",
    warnings: "⚠️ مضاد حيوي قوي - للحالات الشديدة. يُعطى في المستشفى أو العيادة."
  },
  {

    name: "فلوموكس",
    aliases: ["Flumox", "فلوموكس", "فلموكس", "فلوموكص", "فللوموكس", "فلللوموكس", "فللللوموكس", "فلووموكس", "فلوووموكس", "فلووووموكس", "فلومموكس", "فلوممموكس", "فلومممموكس", "فلومووكس", "فلوموووكس", "فلومووووكس", "فلوموككس", "فلوموكككس", "فلوموككككس", "فوموكس", "فلووكس", "فلوموكسس", "فلوموككس", "فلومموكس", "فلووموكس", "فلووموكس", "فلومووكس", "فلوموكسس", "فللوموكس", "فلووموكس"],
    scientificName: "Amoxicillin 1000mg",
    category: "مضاد حيوي (بنسلين)",
    price: "25-50 جنيه",
    uses: [
      "التهابات الجهاز التنفسي",
      "التهاب اللوزتين",
      "التهاب الأذن",
      "التهابات الجلد"
    ],
    sideEffects: [
      "إسهال",
      "طفح جلدي",
      "غثيان"
    ],
    contraindications: [
      "حساسية البنسلين"
    ],
    dosage: "1000mg مرتين يومياً لمدة 5-7 أيام",
    warnings: "⚠️ بنسلين - أضعف من أوجمنتين (ليس فيه كلافيولينيك). كورس كامل 5-7 أيام."
  },
  {

    name: "ماجناسف",
    aliases: ["Magnacef", "مجناسف", "مغناسف", "مأجناسف", "مإجناسف", "ماجناصف", "مااجناسف", "ماااجناسف", "مااااجناسف", "ماججناسف", "ماجججناسف", "ماججججناسف", "ماجنناسف", "ماجننناسف", "ماجنننناسف", "ماجنااسف", "ماجناااسف", "ماجنااااسف", "ماجناسسف", "ماجناسسسف", "ماجناسسسسف", "ماناسف", "ماجاسف", "ماججناسف", "ماجناسسف", "ماجنناسف", "ماججناسف", "ماجنناسف", "ماجنناسف", "مااجناسف"],
    scientificName: "Cefadroxil",
    category: "مضاد حيوي (سيفالوسبورين)",
    price: "25-50 جنيه",
    uses: [
      "التهاب الحلق",
      "التهاب الجلد",
      "التهاب المسالك البولية"
    ],
    sideEffects: [
      "إسهال",
      "طفح جلدي"
    ],
    contraindications: [
      "حساسية السيفالوسبورينات"
    ],
    dosage: "500mg مرتين يومياً",
    warnings: "✅ سيفالوسبورين جيل أول - آمن نسبياً. بديل للبنسلين."
  },
  {

    name: "دسباتالين",
    aliases: ["Duspatalin", "دسباتلين", "دوسباتالين", "دسبأتالين", "دسبإتالين", "دسباتالىن", "دصباتالين", "دسسباتالين", "دسسسباتالين", "دسسسسباتالين", "دسبباتالين", "دسببباتالين", "دسبببباتالين", "دسبااتالين", "دسباااتالين", "دسبااااتالين", "دسباتتالين", "دسباتتتالين", "دسباتتتتالين", "دسباتاالين", "دسباتااالين", "دسباتاااالين", "دباتالين", "دساتالين", "دسبتالين", "دسبااتالين", "دسباتاليين", "دسباتاليين", "دسباتتالين", "دسبااتالين"],
    scientificName: "Mebeverine 135mg",
    category: "مضاد للتقلصات",
    price: "25-50 جنيه",
    uses: [
      "نفس كولوفيرين",
      "القولون العصبي"
    ],
    sideEffects: [
      "نفس كولوفيرين"
    ],
    contraindications: [
      "نفس كولوفيرين"
    ],
    dosage: "135mg ثلاث مرات يومياً قبل الأكل",
    warnings: "✅ نفس كولوفيرين (نفس المادة - ميبفرين). من أقوى أدوية القولون."
  },
  {

    name: "سبازمو ديجستين",
    aliases: ["Spasmo-Digestin", "سبازمو دايجستين", "سبازمو ديجستن", "سبأزمو ديجستين", "سبإزمو ديجستين", "سبازمو دىجستين", "صبازمو ديجستين", "سببازمو ديجستين", "سبببازمو ديجستين", "سببببازمو ديجستين", "سباازمو ديجستين", "سبااازمو ديجستين", "سباااازمو ديجستين", "سباززمو ديجستين", "سبازززمو ديجستين", "سباززززمو ديجستين", "سبازممو ديجستين", "سبازمممو ديجستين", "سبازممممو ديجستين", "سبازموو ديجستين", "سبازمووو ديجستين", "سبازموووو ديجستين", "سازمو ديجستين", "سبزمو ديجستين", "سبامو ديجستين", "سبازممو ديجستين", "سبازمو  ديجستين", "سببازمو ديجستين", "سبازمو دييجستين", "سبازمو  ديجستين"],
    scientificName: "Tiemonium + Digestive Enzymes",
    category: "مضاد تقلصات + إنزيمات هاضمة",
    price: "25-50 جنيه",
    uses: [
      "القولون العصبي مع عسر هضم",
      "الانتفاخ",
      "سوء الهضم"
    ],
    sideEffects: [
      "جفاف الفم",
      "إمساك خفيف"
    ],
    contraindications: [
      "الجلوكوما",
      "تضخم البروستاتا"
    ],
    dosage: "قرص 3 مرات يومياً قبل الأكل",
    warnings: "✅ يجمع بين مضاد التقلصات + إنزيمات هاضمة. ممتاز للقولون مع سوء الهضم."
  },
  {

    name: "فاتالونج",
    aliases: ["Vatalong", "فتالونج", "فاتلونج", "فأتالونج", "فإتالونج", "فااتالونج", "فاااتالونج", "فااااتالونج", "فاتتالونج", "فاتتتالونج", "فاتتتتالونج", "فاتاالونج", "فاتااالونج", "فاتاااالونج", "فاتاللونج", "فاتالللونج", "فاتاللللونج", "فاتالوونج", "فاتالووونج", "فاتالوووونج", "فاالونج", "فاتتالونج", "فاتالونجج", "فاتاالونج", "فاتاالونج", "فاتاالونج", "فاتاللونج", "فااتالونج", "فاتاللونج", "فاتالوونج"],
    scientificName: "Mebeverine 200mg SR",
    category: "مضاد تقلصات طويل المفعول",
    price: "25-50 جنيه",
    uses: [
      "القولون العصبي",
      "تقلصات الأمعاء"
    ],
    sideEffects: [
      "نادرة جداً"
    ],
    contraindications: [
      "انسداد الأمعاء"
    ],
    dosage: "كبسولة واحدة مرتين يومياً قبل الأكل",
    warnings: "✅ ميبفرين تركيز عالي - يستمر 12 ساعة. أقوى من كولوفيرين."
  },
  {

    name: "ستربتوزول",
    aliases: ["Streptosol", "ستربتوزل", "ستربتسول", "صتربتوزول", "ستتربتوزول", "ستتتربتوزول", "ستتتتربتوزول", "سترربتوزول", "ستررربتوزول", "سترررربتوزول", "سترببتوزول", "ستربببتوزول", "سترببببتوزول", "ستربتتوزول", "ستربتتتوزول", "ستربتتتتوزول", "ستربتووزول", "ستربتوووزول", "ستربتووووزول", "سربتوزول", "ستبتوزول", "سترتوزول", "سترببتوزول", "ستربتوزولل", "ستربتتوزول", "سترببتوزول", "سترربتوزول", "ستربتووزول", "سترربتوزول", "سترببتوزول"],
    scientificName: "Streptococcus faecalis + Clostridium butyricum",
    category: "بروبيوتيك (بكتيريا نافعة)",
    price: "25-50 جنيه",
    uses: [
      "الإسهال",
      "اختلال توازن البكتيريا المعوية",
      "بعد المضادات الحيوية",
      "القولون العصبي"
    ],
    sideEffects: [
      "نادرة جداً - آمن جداً"
    ],
    contraindications: [
      "ضعف المناعة الشديد"
    ],
    dosage: "كبسولة 2-3 مرات يومياً",
    warnings: "✅ بكتيريا نافعة - آمنة تماماً. ممتازة بعد المضادات الحيوية. تُحفظ في الثلاجة."
  },
  {

    name: "لاكتيول فورت",
    aliases: ["Lacteol Fort", "لكتيول فورت", "لاكتول", "لأكتيول فورت", "لإكتيول فورت", "لاكتىول فورت", "لااكتيول فورت", "لاااكتيول فورت", "لااااكتيول فورت", "لاككتيول فورت", "لاكككتيول فورت", "لاككككتيول فورت", "لاكتتيول فورت", "لاكتتتيول فورت", "لاكتتتتيول فورت", "لاكتييول فورت", "لاكتيييول فورت", "لاكتييييول فورت", "لاكتيوول فورت", "لاكتيووول فورت", "لاكتيوووول فورت", "لاتيول فورت", "لاكيول فورت", "لاكتيول فوورت", "لاكتيول ففورت", "لاكتيول فوررت", "لاكتيولل فورت", "لاكتيولل فورت", "لاكتتيول فورت", "لاكتتيول فورت"],
    scientificName: "Lactobacillus",
    category: "بروبيوتيك",
    price: "25-50 جنيه",
    uses: [
      "الإسهال",
      "بعد المضادات الحيوية",
      "اختلال البكتيريا"
    ],
    sideEffects: [
      "نادرة"
    ],
    contraindications: [
      "ضعف المناعة الشديد"
    ],
    dosage: "كيس 2-3 مرات يومياً",
    warnings: "✅ بكتيريا نافعة. آمن للأطفال. يُذاب في ماء أو لبن."
  },
  {

    name: "بيفيكول",
    aliases: ["Pivecol", "بيفيكل", "بفيكول", "بىفيكول", "بييفيكول", "بيييفيكول", "بييييفيكول", "بيففيكول", "بيفففيكول", "بيففففيكول", "بيفييكول", "بيفيييكول", "بيفييييكول", "بيفيككول", "بيفيكككول", "بيفيككككول", "بيفيكوول", "بيفيكووول", "بيفيكوووول", "بييكول", "بيفكول", "بيفيككول", "بيففيكول", "بيفيككول", "بييفيكول", "بيفيكولل", "بيفييكول", "بيففيكول", "بيففيكول", "بيفييكول"],
    scientificName: "Bifidobacterium + Lactobacillus",
    category: "بروبيوتيك",
    price: "25-50 جنيه",
    uses: [
      "الإسهال",
      "القولون العصبي",
      "بعد المضادات الحيوية"
    ],
    sideEffects: [
      "نادرة"
    ],
    contraindications: [
      "ضعف المناعة"
    ],
    dosage: "كيس 1-2 مرة يومياً",
    warnings: "✅ بكتيريا نافعة. آمن. يُذاب في ماء بارد (ليس ساخن)."
  },
  {

    name: "سيلينيوم ايه سي اي",
    aliases: ["Selenium ACE", "سلينيوم ايه سي اي", "سيلينيوم", "سيلينيوم أيه سي اي", "سيلينيوم إيه سي اي", "سيلينيوم اية سي اي", "سىلينيوم ايه سي اي", "صيلينيوم ايه سي اي", "سييلينيوم ايه سي اي", "سيييلينيوم ايه سي اي", "سييييلينيوم ايه سي اي", "سيللينيوم ايه سي اي", "سيلللينيوم ايه سي اي", "سيللللينيوم ايه سي اي", "سيليينيوم ايه سي اي", "سيلييينيوم ايه سي اي", "سيليييينيوم ايه سي اي", "سيليننيوم ايه سي اي", "سيلينننيوم ايه سي اي", "سيليننننيوم ايه سي اي", "سيلينييوم ايه سي اي", "سيلينيييوم ايه سي اي", "سيلينييييوم ايه سي اي", "سيينيوم ايه سي اي", "سيلنيوم ايه سي اي", "سيلينيوم ايه سيي اي", "سيلينيومم ايه سي اي", "سيلينيوم ايه  سي اي", "سيلينيوم ايه  سي اي", "سيلينيوم ايه  سي اي"],
    scientificName: "Selenium + Vitamin A, C, E",
    category: "مضاد أكسدة",
    price: "25-50 جنيه",
    uses: [
      "تقوية المناعة",
      "مضاد للأكسدة",
      "تحسين البشرة والشعر",
      "دعم الخصوبة"
    ],
    sideEffects: [
      "نادرة جداً",
      "غثيان خفيف"
    ],
    contraindications: [
      "فرط السيلينيوم"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "✅ مضاد أكسدة قوي. آمن للاستخدام اليومي. مفيد للمناعة والبشرة."
  },
  {

    name: "كيروفيت",
    aliases: ["Kerovit", "كروفيت", "كيرفيت", "كىروفيت", "كييروفيت", "كيييروفيت", "كييييروفيت", "كيرروفيت", "كيررروفيت", "كيرررروفيت", "كيرووفيت", "كيروووفيت", "كيرووووفيت", "كيروففيت", "كيروفففيت", "كيروففففيت", "كيروفييت", "كيروفيييت", "كيروفييييت", "كيوفيت", "كيروفييت", "كيرووفيت", "كيرووفيت", "كيرروفيت", "كيرروفيت", "كييروفيت", "كيروفيتت", "كييروفيت", "كييروفيت", "كييروفيت"],
    scientificName: "Multivitamins + Minerals",
    category: "مكمل غذائي شامل",
    price: "25-50 جنيه",
    uses: [
      "نقص الفيتامينات والمعادن",
      "الإرهاق والتعب",
      "فترات النقاهة",
      "الحمل والرضاعة"
    ],
    sideEffects: [
      "إمساك خفيف (من الحديد)",
      "غثيان",
      "تغير لون البراز (أسود - من الحديد)"
    ],
    contraindications: [
      "فرط الحديد",
      "فرط الفيتامينات"
    ],
    dosage: "كبسولة واحدة يومياً بعد الأكل",
    warnings: "✅ مكمل شامل - يحتوي على معظم الفيتامينات والمعادن. البراز قد يصبح أسود (من الحديد - طبيعي)."
  },
  {

    name: "فيتاماكس بلس",
    aliases: ["Vitamax Plus", "فيتامكس", "فيتاماكس", "فيتأماكس بلس", "فيتإماكس بلس", "فىتاماكس بلس", "فيتاماكص بلس", "فييتاماكس بلس", "فيييتاماكس بلس", "فييييتاماكس بلس", "فيتتاماكس بلس", "فيتتتاماكس بلس", "فيتتتتاماكس بلس", "فيتااماكس بلس", "فيتاااماكس بلس", "فيتااااماكس بلس", "فيتامماكس بلس", "فيتاممماكس بلس", "فيتامممماكس بلس", "فيتامااكس بلس", "فيتاماااكس بلس", "فيتامااااكس بلس", "فتاماكس بلس", "فياماكس بلس", "فيتماكس بلس", "فيتاماكس  بلس", "فيتاماكس ببلس", "فيتاماكس ببلس", "فيتامااكس بلس", "فيتامااكس بلس"],
    scientificName: "Multivitamins + Ginseng",
    category: "مكمل غذائي + منشط",
    price: "110 جنيه",
    uses: [
      "الإرهاق والتعب",
      "ضعف التركيز",
      "نقص الطاقة"
    ],
    sideEffects: [
      "أرق (إذا أُخذ مساءً)",
      "عصبية زائدة"
    ],
    contraindications: [
      "ارتفاع ضغط الدم الشديد",
      "الأرق"
    ],
    dosage: "كبسولة واحدة صباحاً",
    warnings: "⚠️ يحتوي على جنسنج (منشط) - لا تأخذه مساءً. يعطي طاقة ونشاط."
  },
  {

    name: "بريجناكير",
    aliases: ["Pregnacare", "بريجنكير", "برجناكير", "بريجنأكير", "بريجنإكير", "برىجناكير", "برريجناكير", "بررريجناكير", "برررريجناكير", "برييجناكير", "بريييجناكير", "برييييجناكير", "بريججناكير", "بريجججناكير", "بريججججناكير", "بريجنناكير", "بريجننناكير", "بريجنننناكير", "بريجنااكير", "بريجناااكير", "بريجنااااكير", "بيجناكير", "بريناكير", "بريجناكيرر", "بريجناككير", "بريجناككير", "بريجنااكير", "بريجناكيير", "بريجنااكير", "بريجنناكير"],
    scientificName: "Prenatal Multivitamins",
    category: "فيتامينات الحمل",
    price: "25-50 جنيه",
    uses: [
      "دعم الحمل",
      "الوقاية من التشوهات",
      "دعم نمو الجنين",
      "نقص الفيتامينات أثناء الحمل"
    ],
    sideEffects: [
      "إمساك",
      "غثيان خفيف"
    ],
    contraindications: [
      "فرط الفيتامينات"
    ],
    dosage: "قرص واحد يومياً",
    warnings: "✅ مخصص للحوامل. يحتوي على حمض الفوليك المهم جداً. ابدئي أخذه قبل الحمل إن أمكن."
  },
  {

    name: "ترايمد فلو",
    aliases: ["Trime-flu", "ترايمد", "تريمد فلو", "ترأيمد فلو", "ترإيمد فلو", "تراىمد فلو", "تررايمد فلو", "ترررايمد فلو", "تررررايمد فلو", "تراايمد فلو", "ترااايمد فلو", "تراااايمد فلو", "تراييمد فلو", "ترايييمد فلو", "تراييييمد فلو", "ترايممد فلو", "ترايمممد فلو", "ترايممممد فلو", "ترايمدد فلو", "ترايمددد فلو", "ترايمدددد فلو", "تايمد فلو", "ترامد فلو", "ترايمد ففلو", "ترايممد فلو", "ترايمد  فلو", "تراايمد فلو", "ترايمد  فلو", "تراييمد فلو", "ترايمدد فلو"],
    scientificName: "Paracetamol + Caffeine + Chlorpheniramine",
    category: "علاج البرد + كافيين",
    price: "25-50 جنيه",
    uses: [
      "أعراض البرد والإنفلونزا",
      "الصداع",
      "الإرهاق المصاحب للبرد"
    ],
    sideEffects: [
      "أرق (من الكافيين)",
      "عصبية"
    ],
    contraindications: [
      "ارتفاع ضغط الدم",
      "مشاكل القلب"
    ],
    dosage: "قرص كل 6 ساعات",
    warnings: "⚠️ يحتوي على كافيين - قد يسبب أرق. لا تأخذه مساءً."
  },
  {

    name: "بانتوجار",
    aliases: ["Pantogar", "بنتوجار", "بانتجار", "بأنتوجار", "بإنتوجار", "باانتوجار", "بااانتوجار", "باااانتوجار", "باننتوجار", "بانننتوجار", "باننننتوجار", "بانتتوجار", "بانتتتوجار", "بانتتتتوجار", "بانتووجار", "بانتوووجار", "بانتووووجار", "بانتوججار", "بانتوجججار", "بانتوججججار", "باتوجار", "بانوجار", "باننتوجار", "باانتوجار", "بانتتوجار", "باانتوجار", "بانتووجار", "باننتوجار", "بانتتوجار", "باانتوجار"],
    scientificName: "Keratin + Amino acids + Vitamins",
    category: "مكمل للشعر",
    price: "25-50 جنيه",
    uses: [
      "تساقط الشعر",
      "ضعف الشعر والأظافر",
      "تحسين نمو الشعر"
    ],
    sideEffects: [
      "غثيان خفيف",
      "طفح جلدي نادر"
    ],
    contraindications: [
      "الحساسية من المكونات"
    ],
    dosage: "كبسولة 3 مرات يومياً لمدة 3-6 أشهر",
    warnings: "✅ يحتاج وقت طويل (3-6 أشهر) لرؤية النتائج. آمن. ممتاز للشعر والأظافر."
  },
  {

    name: "هيردال",
    aliases: ["Hairdal", "هيردل", "هايردال", "هيردأل", "هيردإل", "ةيردال", "هىردال", "هييردال", "هيييردال", "هييييردال", "هيرردال", "هيررردال", "هيرررردال", "هيرددال", "هيردددال", "هيرددددال", "هيرداال", "هيردااال", "هيرداااال", "هيردالل", "هيرداللل", "هيردالللل", "هردال", "هيدال", "هيرال", "هيرددال", "هيرداال", "هييردال", "هيردالل", "هيرددال"],
    scientificName: "Biotin + Amino acids + Zinc",
    category: "مكمل للشعر",
    price: "25-50 جنيه",
    uses: [
      "تساقط الشعر",
      "تقوية الشعر"
    ],
    sideEffects: [
      "نادرة"
    ],
    contraindications: [
      "الحساسية"
    ],
    dosage: "كبسولة 1-2 مرة يومياً",
    warnings: "✅ يحتوي على بيوتين (فيتامين ب7) - مهم جداً للشعر."
  },
  {

    name: "فيروجلوبين",
    aliases: ["Feroglobin", "فيروجلبين", "فروجلوبين", "فىروجلوبين", "فييروجلوبين", "فيييروجلوبين", "فييييروجلوبين", "فيرروجلوبين", "فيررروجلوبين", "فيرررروجلوبين", "فيرووجلوبين", "فيروووجلوبين", "فيرووووجلوبين", "فيروججلوبين", "فيروجججلوبين", "فيروججججلوبين", "فيروجللوبين", "فيروجلللوبين", "فيروجللللوبين", "فيوجلوبين", "فيرجلوبين", "فيروجلووبين", "فيروجلوببين", "فيروجلوبينن", "فيروجلوبينن", "فيروجلووبين", "فييروجلوبين", "فيروجلووبين", "فييروجلوبين", "فيرروجلوبين"],
    scientificName: "Iron + B12 + Folic Acid + Vitamin C",
    category: "مكمل حديد",
    price: "90 جنيه",
    uses: [
      "الأنيميا",
      "نقص الحديد",
      "الحمل والرضاعة",
      "الدورة الشهرية الغزيرة"
    ],
    sideEffects: [
      "إمساك (شائع)",
      "براز أسود (طبيعي)",
      "غثيان",
      "ألم بالمعدة"
    ],
    contraindications: [
      "فرط الحديد",
      "الثلاسيميا"
    ],
    dosage: "كبسولة واحدة يومياً بعد الأكل",
    warnings: "✅ حديد + فيتامينات. البراز يصبح أسود (طبيعي). خذه بعد الأكل. اشرب عصير برتقال معه (فيتامين C يزيد الامتصاص)."
  },
  {

    name: "هيموجيت",
    aliases: ["Haemojet", "هيموجت", "هموجيت", "ةيموجيت", "هىموجيت", "هييموجيت", "هيييموجيت", "هييييموجيت", "هيمموجيت", "هيممموجيت", "هيمممموجيت", "هيمووجيت", "هيموووجيت", "هيمووووجيت", "هيموججيت", "هيموجججيت", "هيموججججيت", "هيموجييت", "هيموجيييت", "هيموجييييت", "هيوجيت", "هيمجيت", "هيمووجيت", "هيموججيت", "هييموجيت", "هيمموجيت", "هييموجيت", "هييموجيت", "هيموجيتت", "هييموجيت"],
    scientificName: "Iron Polymaltose Complex",
    category: "حديد سائل",
    price: "25-50 جنيه",
    uses: [
      "الأنيميا",
      "نقص الحديد"
    ],
    sideEffects: [
      "أقل من الحديد العادي",
      "براز داكن"
    ],
    contraindications: [
      "فرط الحديد"
    ],
    dosage: "ملعقة 1-2 مرة يومياً",
    warnings: "✅ حديد سائل - أقل في الأعراض الجانبية من الحديد العادي. مناسب لمن يعاني من إمساك مع الحديد."
  },
  {

    name: "كالسيمات",
    aliases: ["Calcimate", "كلسيمات", "كالسمات", "كألسيمات", "كإلسيمات", "كالسىمات", "كالصيمات", "كاالسيمات", "كااالسيمات", "كاااالسيمات", "كاللسيمات", "كالللسيمات", "كاللللسيمات", "كالسسيمات", "كالسسسيمات", "كالسسسسيمات", "كالسييمات", "كالسيييمات", "كالسييييمات", "كالسيممات", "كالسيمممات", "كالسيممممات", "كاسيمات", "كاليمات", "كالسسيمات", "كالسيممات", "كالسيماتت", "كاالسيمات", "كاالسيمات", "كاللسيمات"],
    scientificName: "Calcium Carbonate + Vitamin D",
    category: "كالسيوم",
    price: "25-50 جنيه",
    uses: [
      "هشاشة العظام",
      "نقص الكالسيوم"
    ],
    sideEffects: [
      "إمساك",
      "انتفاخ"
    ],
    contraindications: [
      "فرط كالسيوم الدم"
    ],
    dosage: "قرص 1-2 مرة يومياً",
    warnings: "✅ كالسيوم + فيتامين د. اشرب ماء كثير."
  },
  {

    name: "رويال جيلي",
    aliases: ["Royal Jelly", "رويال چيلي", "غذاء ملكات النحل", "رويأل جيلي", "رويإل جيلي", "روىال جيلي", "روويال جيلي", "رووويال جيلي", "روووويال جيلي", "روييال جيلي", "رويييال جيلي", "روييييال جيلي", "روياال جيلي", "رويااال جيلي", "روياااال جيلي", "رويالل جيلي", "روياللل جيلي", "رويالللل جيلي", "رويال  جيلي", "رويال   جيلي", "رويال    جيلي", "ريال جيلي", "روال جيلي", "رويل جيلي", "رويال جيللي", "رويال  جيلي", "روييال جيلي", "روويال جيلي", "رويال جييلي", "رويال ججيلي"],
    scientificName: "Royal Jelly (Fresh Bee's Food)",
    category: "منتج طبيعي منشط",
    price: "25-50 جنيه",
    uses: [
      "تقوية المناعة",
      "الطاقة والنشاط",
      "تحسين الخصوبة",
      "مضاد للأكسدة"
    ],
    sideEffects: [
      "حساسية (نادرة لكن خطيرة)",
      "ربو (لمن لديهم حساسية)"
    ],
    contraindications: [
      "حساسية منتجات النحل",
      "الربو الشديد"
    ],
    dosage: "كبسولة 1-2 مرة يومياً",
    warnings: "⚠️ احذر الحساسية - توقف فوراً إذا ظهر طفح أو ضيق تنفس. منتج طبيعي قوي."
  },
  {

    name: "اومجا 3",
    aliases: ["Omega 3", "اوميجا 3", "اوميغا ٣", "زيت السمك", "أومجا 3", "إومجا 3", "اوومجا 3", "اووومجا 3", "اوووومجا 3", "اوممجا 3", "اومممجا 3", "اوممممجا 3", "اومججا 3", "اومجججا 3", "اومججججا 3", "اومجاا 3", "اومجااا 3", "اومجاااا 3", "اومجا  3", "اومجا   3", "اومجا    3", "امجا 3", "اوجا 3", "اوما 3", "اوممجا 3", "اوومجا 3", "اومجاا 3", "اوممجا 3", "اومجا  3", "اومججا 3"],
    scientificName: "Omega-3 Fatty Acids (EPA + DHA)",
    category: "مكمل أحماض دهنية",
    price: "25-50 جنيه",
    uses: [
      "دعم صحة القلب",
      "خفض الدهون الثلاثية",
      "تحسين المزاج",
      "دعم صحة المفاصل",
      "تحسين التركيز"
    ],
    sideEffects: [
      "طعم سمكي بالفم",
      "تجشؤ",
      "إسهال خفيف"
    ],
    contraindications: [
      "حساسية السمك",
      "اضطرابات النزيف (احذر)"
    ],
    dosage: "كبسولة 1-3 مرات يومياً مع الطعام",
    warnings: "✅ مفيد جداً للقلب والمخ. قد يسيل الدم قليلاً - احذر قبل العمليات. خذه مع الطعام لتقليل الطعم السمكي."
  },
  {

    name: "كو انزيم كيو 10",
    aliases: ["Coenzyme Q10", "كوانزيم كيو ١٠", "Q10", "يوبيكوينون", "كو أنزيم كيو 10", "كو إنزيم كيو 10", "كو انزىم كيو 10", "كوو انزيم كيو 10", "كووو انزيم كيو 10", "كوووو انزيم كيو 10", "كو  انزيم كيو 10", "كو   انزيم كيو 10", "كو    انزيم كيو 10", "كو اانزيم كيو 10", "كو ااانزيم كيو 10", "كو اااانزيم كيو 10", "كو اننزيم كيو 10", "كو انننزيم كيو 10", "كو اننننزيم كيو 10", "كو انززيم كيو 10", "كو انزززيم كيو 10", "كو انززززيم كيو 10", "ك انزيم كيو 10", "كوانزيم كيو 10", "كو نزيم كيو 10", "كوو انزيم كيو 10", "كو انززيم كيو 10", "كو انزيم كيو 110", "كو انزيم كيو  10", "كو انزيمم كيو 10"],
    scientificName: "Ubiquinone (Coenzyme Q10)",
    category: "مضاد أكسدة",
    price: "25-50 جنيه",
    uses: [
      "دعم صحة القلب",
      "الطاقة والنشاط",
      "مضاد للشيخوخة",
      "ضعف العضلات من الستاتينات"
    ],
    sideEffects: [
      "نادرة جداً",
      "أرق (إذا أُخذ مساءً)",
      "غثيان خفيف"
    ],
    contraindications: [
      "أدوية السيولة (قد يتداخل)"
    ],
    dosage: "30-200mg يومياً",
    warnings: "✅ مضاد أكسدة قوي. ممتاز لمرضى القلب ومن يأخذون ستاتينات. خذه صباحاً."
  },
  {

    name: "جلوكوزامين",
    aliases: ["Glucosamine", "جلوكوزمين", "جلكوزامين", "جلوكوزأمين", "جلوكوزإمين", "جلوكوزامىن", "جللوكوزامين", "جلللوكوزامين", "جللللوكوزامين", "جلووكوزامين", "جلوووكوزامين", "جلووووكوزامين", "جلوككوزامين", "جلوكككوزامين", "جلوككككوزامين", "جلوكووزامين", "جلوكوووزامين", "جلوكووووزامين", "جلوكوززامين", "جلوكوزززامين", "جلوكوززززامين", "جوكوزامين", "جلووزامين", "جلوكووزامين", "جلووكوزامين", "جلوكوزامينن", "جلوكوزامينن", "جلوكوزاميين", "جلوكوزاامين", "جلوكوزاامين"],
    scientificName: "Glucosamine Sulfate",
    category: "مكمل للمفاصل",
    price: "25-50 جنيه",
    uses: [
      "خشونة المفاصل",
      "آلام المفاصل",
      "دعم صحة الغضاريف"
    ],
    sideEffects: [
      "غثيان خفيف",
      "حرقة معدة",
      "إسهال"
    ],
    contraindications: [
      "حساسية الصدفيات (المحار)",
      "السكري (راقب السكر)"
    ],
    dosage: "1500mg يومياً (جرعة واحدة أو مقسمة)",
    warnings: "✅ يحتاج 4-8 أسابيع لرؤية النتائج. آمن للاستخدام طويل الأمد. غالباً مستخلص من المحار."
  },
  {

    name: "كوندروتين",
    aliases: ["Chondroitin", "كوندرويتين", "كندروتين", "كوندروتىن", "كووندروتين", "كوووندروتين", "كووووندروتين", "كونندروتين", "كوننندروتين", "كونننندروتين", "كونددروتين", "كوندددروتين", "كونددددروتين", "كوندرروتين", "كوندررروتين", "كوندرررروتين", "كوندرووتين", "كوندروووتين", "كوندرووووتين", "كودروتين", "كونروتين", "كونددروتين", "كوندروتيين", "كوندرووتين", "كوندروتتين", "كوندروتينن", "كونددروتين", "كوندروتينن", "كوندرووتين", "كوندرروتين"],
    scientificName: "Chondroitin Sulfate",
    category: "مكمل للمفاصل",
    price: "25-50 جنيه",
    uses: [
      "خشونة المفاصل",
      "دعم الغضاريف"
    ],
    sideEffects: [
      "نادرة",
      "غثيان خفيف"
    ],
    contraindications: [
      "اضطرابات النزيف"
    ],
    dosage: "800-1200mg يومياً",
    warnings: "✅ غالباً يُؤخذ مع جلوكوزامين معاً. نتائج بعد أسابيع."
  },
  {

    name: "فينترن",
    aliases: ["Alphintern", "الفنترن", "فنترن", "فىنترن", "فيينترن", "فييينترن", "فيييينترن", "فيننترن", "فينننترن", "فيننننترن", "فينتترن", "فينتتترن", "فينتتتترن", "فينتررن", "فينترررن", "فينتررررن", "فينترنن", "فينترننن", "فينترنننن", "فيترن", "فينرن", "فيينترن", "فينترنن", "فينترنن", "فينترنن", "فينترنن", "فينتترن", "فينتررن", "فيينترن", "فينترنن"],
    scientificName: "Trypsin + Chymotrypsin",
    category: "مضاد التهاب إنزيمي",
    price: "25-50 جنيه",
    uses: [
      "التورم والالتهاب",
      "ما بعد العمليات",
      "الإصابات الرياضية",
      "الكدمات"
    ],
    sideEffects: [
      "غثيان",
      "طفح جلدي نادر"
    ],
    contraindications: [
      "الحساسية من الإنزيمات",
      "اضطرابات النزيف"
    ],
    dosage: "قرص 3 مرات يومياً بين الوجبات",
    warnings: "✅ إنزيمات محللة للبروتين - تقلل التورم. على معدة فارغة."
  },
  {

    name: "ميوكوفللين",
    aliases: ["Mucophylline", "ميوكوفلين", "موكوفللين", "مىوكوفللين", "مييوكوفللين", "ميييوكوفللين", "مييييوكوفللين", "ميووكوفللين", "ميوووكوفللين", "ميووووكوفللين", "ميوككوفللين", "ميوكككوفللين", "ميوككككوفللين", "ميوكووفللين", "ميوكوووفللين", "ميوكووووفللين", "ميوكوففللين", "ميوكوفففللين", "ميوكوففففللين", "ميكوفللين", "ميووفللين", "مييوكوفللين", "ميوكوففللين", "مييوكوفللين", "ميوكوفلللين", "ميوكووفللين", "ميوككوفللين", "ميوكوفللينن", "ميوكوفلللين", "ميوكوففللين"],
    scientificName: "Theophylline + Guaifenesin",
    category: "موسع شعبي + طارد بلغم",
    price: "25-50 جنيه",
    uses: [
      "الربو",
      "الانسداد الرئوي",
      "السعال مع بلغم",
      "ضيق التنفس"
    ],
    sideEffects: [
      "غثيان",
      "صداع",
      "أرق",
      "خفقان",
      "رعشة"
    ],
    contraindications: [
      "قرحة المعدة النشطة",
      "اضطراب نظم القلب",
      "فرط نشاط الغدة الدرقية"
    ],
    dosage: "كبسولة 2-3 مرات يومياً",
    warnings: "⚠️ موسع شعبي قوي. قد يسبب خفقان وأرق. لا تأخذه مساءً. راقب الأعراض الجانبية."
  },
  {

    name: "كافوسيد",
    aliases: ["Cafosed", "كافسيد", "كفوسيد", "كأفوسيد", "كإفوسيد", "كافوسىد", "كافوصيد", "كاافوسيد", "كااافوسيد", "كاااافوسيد", "كاففوسيد", "كافففوسيد", "كاففففوسيد", "كافووسيد", "كافوووسيد", "كافووووسيد", "كافوسسيد", "كافوسسسيد", "كافوسسسسيد", "كافوسييد", "كافوسيييد", "كافوسييييد", "كاوسيد", "كافوسيدد", "كاففوسيد", "كافوسييد", "كافوسيدد", "كاففوسيد", "كافوسييد", "كافوسيدد"],
    scientificName: "Caffeine + Paracetamol",
    category: "مسكن + منبه",
    price: "24 جنيه",
    uses: [
      "الصداع",
      "الصداع النصفي",
      "آلام خفيفة مع تعب"
    ],
    sideEffects: [
      "أرق",
      "عصبية",
      "خفقان"
    ],
    contraindications: [
      "ارتفاع ضغط الدم الشديد",
      "مشاكل القلب",
      "الأرق"
    ],
    dosage: "قرص عند اللزوم (بحد أقصى 3 أقراص يومياً)",
    warnings: "⚠️ يحتوي على كافيين - لا تأخذه مساءً. ممتاز للصداع + التعب."
  },
  {

    name: "سولبادين",
    aliases: ["Solpadeine", "سولبدين", "سلبادين", "سولبأدين", "سولبإدين", "سولبادىن", "صولبادين", "سوولبادين", "سووولبادين", "سوووولبادين", "سوللبادين", "سولللبادين", "سوللللبادين", "سولببادين", "سولبببادين", "سولببببادين", "سولباادين", "سولبااادين", "سولباااادين", "سولباددين", "سولبادددين", "سولباددددين", "سوبادين", "سولادين", "سوللبادين", "سوولبادين", "سولباديين", "سوللبادين", "سوللبادين", "سولباددين"],
    scientificName: "Paracetamol + Codeine + Caffeine",
    category: "مسكن قوي",
    price: "25-50 جنيه",
    uses: [
      "الآلام المتوسطة إلى الشديدة",
      "الصداع الشديد",
      "الصداع النصفي",
      "آلام الأسنان"
    ],
    sideEffects: [
      "إمساك (من الكودايين)",
      "نعاس",
      "غثيان",
      "إدمان (استخدام طويل)"
    ],
    contraindications: [
      "الحساسية من الكودايين",
      "الربو الحاد",
      "إدمان المخدرات",
      "الأطفال أقل من 12 سنة"
    ],
    dosage: "قرص 1-2 كل 4-6 ساعات (بحد أقصى 8 أقراص يومياً)",
    warnings: "⚠️⚠️ يحتوي على كودايين (أفيوني خفيف) - قد يسبب إدمان. لا تستخدمه أكثر من 3 أيام متواصلة. يسبب إمساك. ممنوع للأطفال."
  },
  {

    name: "ترامادول",
    aliases: ["Tramadol", "ترمادول", "تدول", "الأحمر", "ترأمادول", "ترإمادول", "تررامادول", "ترررامادول", "تررررامادول", "تراامادول", "ترااامادول", "تراااامادول", "تراممادول", "ترامممادول", "تراممممادول", "تراماادول", "ترامااادول", "تراماااادول", "تراماددول", "ترامادددول", "تراماددددول", "تامادول", "تراادول", "تراامادول", "ترامادوول", "ترامادولل", "تراماددول", "تررامادول", "تراممادول", "تررامادول"],
    scientificName: "Tramadol HCl 50mg",
    category: "مسكن أفيوني (جدول)",
    price: "65 جنيه",
    uses: [
      "الآلام الشديدة",
      "آلام السرطان",
      "آلام ما بعد العمليات"
    ],
    sideEffects: [
      "إدمان شديد",
      "غثيان وقيء",
      "دوخة",
      "إمساك",
      "نعاس"
    ],
    contraindications: [
      "إدمان المخدرات",
      "الصرع",
      "تناول الكحول",
      "MAOI inhibitors"
    ],
    dosage: "50-100mg كل 6 ساعات (بوصفة طبيب فقط)",
    warnings: "⚠️⚠️⚠️ دواء جدول (مخدر) - يسبب إدمان شديد. لا يُصرف إلا بروشتة طبيب. ممنوع منعاً باتاً استخدامه بدون إشراف طبي. خطير جداً."
  },
  {

    name: "نوفالجين",
    aliases: ["Novalgin", "نوفلجين", "نوفالجن", "نوفألجين", "نوفإلجين", "نوفالجىن", "نووفالجين", "نوووفالجين", "نووووفالجين", "نوففالجين", "نوفففالجين", "نوففففالجين", "نوفاالجين", "نوفااالجين", "نوفاااالجين", "نوفاللجين", "نوفالللجين", "نوفاللللجين", "نوفالججين", "نوفالجججين", "نوفالججججين", "نفالجين", "نوالجين", "نوفاللجين", "نوفاالجين", "نوفالجيين", "نوفالججين", "نوفالجيين", "نوفالجيين", "نوفاللجين"],
    scientificName: "Metamizole (Dipyrone)",
    category: "مسكن قوي وخافض حرارة",
    price: "25-50 جنيه",
    uses: [
      "الآلام الشديدة",
      "الحرارة العالية",
      "المغص الكلوي",
      "الصداع الشديد"
    ],
    sideEffects: [
      "نادراً جداً: انخفاض كريات الدم البيضاء (خطير)",
      "طفح جلدي",
      "انخفاض ضغط الدم"
    ],
    contraindications: [
      "الحساسية من الدواء",
      "نقص كريات الدم البيضاء",
      "البورفيريا",
      "الحمل (الثلث الأول والأخير)"
    ],
    dosage: "قرص 500mg حتى 3 مرات يومياً، أو حقنة عضل/وريد",
    warnings: "⚠️⚠️ مسكن قوي جداً. ممنوع في بعض الدول (أمريكا وبريطانيا). خطر نادر جداً لكن خطير (Agranulocytosis). استخدم بحذر."
  },
  {

    name: "كيتولاك",
    aliases: ["Ketolac", "كيتلاك", "كتولاك", "كيتولأك", "كيتولإك", "كىتولاك", "كييتولاك", "كيييتولاك", "كييييتولاك", "كيتتولاك", "كيتتتولاك", "كيتتتتولاك", "كيتوولاك", "كيتووولاك", "كيتوووولاك", "كيتوللاك", "كيتولللاك", "كيتوللللاك", "كيتولااك", "كيتولاااك", "كيتولااااك", "كيولاك", "كيتوللاك", "كيتولااك", "كيتتولاك", "كييتولاك", "كيتتولاك", "كيتوولاك", "كييتولاك", "كيتوللاك"],
    scientificName: "Ketorolac 10mg",
    category: "مسكن قوي جداً",
    price: "25-50 جنيه",
    uses: [
      "الآلام الشديدة قصيرة المدى",
      "آلام ما بعد العمليات",
      "المغص الكلوي"
    ],
    sideEffects: [
      "قرحة المعدة",
      "نزيف المعدة",
      "فشل كلوي (استخدام طويل)"
    ],
    contraindications: [
      "قرحة المعدة",
      "نزيف نشط",
      "أمراض الكلى",
      "الحمل والرضاعة",
      "قبل وبعد جراحة القلب"
    ],
    dosage: "10mg كل 6 ساعات لمدة لا تزيد عن 5 أيام",
    warnings: "⚠️⚠️⚠️ مسكن قوي جداً - للاستخدام قصير المدى فقط (أقصاها 5 أيام). خطر كبير على المعدة والكلى. يُستخدم للحالات الشديدة فقط."
  },
  {

    name: "بريدو",
    aliases: ["Predo", "بردو", "بريدوكورت", "برىدو", "برريدو", "بررريدو", "برررريدو", "برييدو", "بريييدو", "برييييدو", "بريددو", "بريدددو", "بريددددو", "بريدوو", "بريدووو", "بريدوووو", "بيدو", "بريو", "بريدوو", "برييدو", "برييدو", "بريدوو", "بريدوو", "برييدو", "بريددو", "برييدو", "برريدو", "بريدوو", "بريدوو", "برريدو"],
    scientificName: "Prednisolone 5mg",
    category: "كورتيزون",
    price: "25-50 جنيه",
    uses: [
      "الأمراض المناعية",
      "الربو الحاد",
      "الحساسية الشديدة",
      "التهاب المفاصل الروماتويدي",
      "الذئبة الحمراء"
    ],
    sideEffects: [
      "زيادة الوزن",
      "احتباس السوائل",
      "ارتفاع السكر",
      "ارتفاع الضغط",
      "هشاشة العظام (استخدام طويل)",
      "ضعف المناعة"
    ],
    contraindications: [
      "عدوى نشطة",
      "السل",
      "القرحة الهضمية النشطة"
    ],
    dosage: "5-60mg يومياً (حسب الحالة والطبيب)",
    warnings: "⚠️⚠️⚠️ كورتيزون - دواء قوي جداً. لا تتوقف فجأة (قلل الجرعة تدريجياً). يضعف المناعة. يرفع السكر والضغط. استخدام طويل خطير. بوصفة طبيب فقط."
  },
  {

    name: "فينتولين",
    aliases: ["Ventolin", "فنتولين", "البخاخ الأزرق", "فىنتولين", "فيينتولين", "فييينتولين", "فيييينتولين", "فيننتولين", "فينننتولين", "فيننننتولين", "فينتتولين", "فينتتتولين", "فينتتتتولين", "فينتوولين", "فينتووولين", "فينتوووولين", "فينتوللين", "فينتولللين", "فينتوللللين", "فيتولين", "فينولين", "فينتولينن", "فيينتولين", "فينتوليين", "فينتوليين", "فينتوليين", "فينتوولين", "فينتولينن", "فينتوللين", "فينتوليين"],
    scientificName: "Salbutamol (Albuterol)",
    category: "موسع شعبي (بخاخ)",
    price: "25-50 جنيه",
    uses: [
      "الربو",
      "ضيق التنفس",
      "الانسداد الرئوي",
      "أزمة الربو الحادة"
    ],
    sideEffects: [
      "رعشة اليدين (شائع)",
      "خفقان",
      "صداع",
      "توتر"
    ],
    contraindications: [
      "الحساسية من الدواء"
    ],
    dosage: "بختان عند اللزوم (بحد أقصى كل 4 ساعات)",
    warnings: "✅ بخاخ إنقاذ سريع المفعول. ضروري لمرضى الربو. آمن نسبياً. إذا احتجته أكثر من 3 مرات أسبوعياً - راجع طبيبك."
  },
  {

    name: "سيريتايد",
    aliases: ["Seretide", "سريتايد", "سيرتايد", "سيريتأيد", "سيريتإيد", "سىريتايد", "صيريتايد", "سييريتايد", "سيييريتايد", "سييييريتايد", "سيرريتايد", "سيررريتايد", "سيرررريتايد", "سيرييتايد", "سيريييتايد", "سيرييييتايد", "سيريتتايد", "سيريتتتايد", "سيريتتتتايد", "سيريتاايد", "سيريتااايد", "سيريتاااايد", "سييتايد", "سيريتاايد", "سيريتايدد", "سيريتتايد", "سيريتاايد", "سيرييتايد", "سيرريتايد", "سيريتاييد"],
    scientificName: "Fluticasone + Salmeterol",
    category: "بخاخ ربو وقائي (كورتيزون + موسع)",
    price: "25-50 جنيه",
    uses: [
      "الربو المزمن",
      "الانسداد الرئوي المزمن",
      "الوقاية من نوبات الربو"
    ],
    sideEffects: [
      "بحة الصوت",
      "فطريات الفم",
      "خفقان خفيف"
    ],
    contraindications: [
      "الحساسية من المكونات"
    ],
    dosage: "بختان مرتين يومياً (صباحاً ومساءً)",
    warnings: "⚠️ بخاخ وقائي - ليس للنوبات الحادة. امضمض فمك بالماء بعد الاستخدام (لمنع الفطريات). استخدام يومي منتظم."
  },
  {

    name: "بلميكورت",
    aliases: ["Pulmicort", "بولميكورت", "بلمكورت", "بلمىكورت", "بللميكورت", "بلللميكورت", "بللللميكورت", "بلمميكورت", "بلممميكورت", "بلمممميكورت", "بلمييكورت", "بلميييكورت", "بلمييييكورت", "بلميككورت", "بلميكككورت", "بلميككككورت", "بلميكوورت", "بلميكووورت", "بلميكوووورت", "بميكورت", "بليكورت", "بلميكوررت", "بلميككورت", "بلميكورتت", "بلميكورتت", "بلميكورتت", "بلميكوررت", "بلمميكورت", "بلميكورتت", "بلمميكورت"],
    scientificName: "Budesonide Inhaler",
    category: "بخاخ ربو كورتيزوني",
    price: "25-50 جنيه",
    uses: [
      "الربو المزمن",
      "الوقاية من نوبات الربو"
    ],
    sideEffects: [
      "بحة صوت",
      "فطريات الفم"
    ],
    contraindications: [
      "الحساسية"
    ],
    dosage: "بختان مرتين يومياً",
    warnings: "✅ كورتيزون موضعي - آمن. امضمض بعد الاستخدام. وقائي - ليس للنوبات."
  },
  {

    name: "ريسبردال",
    aliases: ["Risperdal", "رسبردال", "ريسبيردال", "ريسبردأل", "ريسبردإل", "رىسبردال", "ريصبردال", "رييسبردال", "ريييسبردال", "رييييسبردال", "ريسسبردال", "ريسسسبردال", "ريسسسسبردال", "ريسببردال", "ريسبببردال", "ريسببببردال", "ريسبرردال", "ريسبررردال", "ريسبرررردال", "ريسبرددال", "ريسبردددال", "ريسبرددددال", "ريبردال", "ريسردال", "ريسبرردال", "ريسبرردال", "ريسببردال", "ريسببردال", "ريسبرداال", "ريسبرددال"],
    scientificName: "Risperidone",
    category: "مضاد ذهان",
    price: "25-50 جنيه",
    uses: [
      "الفصام",
      "الهوس الثنائي القطب",
      "التهيج عند التوحد",
      "الذهان"
    ],
    sideEffects: [
      "زيادة وزن شديدة",
      "نعاس",
      "رعشة",
      "اضطراب الحركة",
      "ارتفاع البرولاكتين"
    ],
    contraindications: [
      "الحساسية",
      "الخرف (خطر)"
    ],
    dosage: "حسب الطبيب النفسي (0.5-6mg يومياً)",
    warnings: "⚠️⚠️⚠️ دواء نفسي قوي - بوصفة طبيب نفسي فقط. لا تتوقف فجأة. مراقبة دورية ضرورية."
  },
  {

    name: "زولام",
    aliases: ["Zolam", "زولم", "الزولام", "زولأم", "زولإم", "زوولام", "زووولام", "زوووولام", "زوللام", "زولللام", "زوللللام", "زولاام", "زولااام", "زولاااام", "زولامم", "زولاممم", "زولامممم", "زلام", "زوام", "زوولام", "زولاام", "زوللام", "زوولام", "زوولام", "زوولام", "زوللام", "زولامم", "زولامم", "زوولام", "زولامم"],
    scientificName: "Alprazolam 0.25-0.5mg",
    category: "مهدئ (بنزوديازبين - جدول)",
    price: "25-50 جنيه",
    uses: [
      "القلق الشديد",
      "نوبات الهلع",
      "الأرق الشديد"
    ],
    sideEffects: [
      "إدمان شديد",
      "نعاس",
      "دوخة",
      "ضعف الذاكرة",
      "اكتئاب"
    ],
    contraindications: [
      "إدمان المخدرات",
      "الجلوكوما ضيقة الزاوية",
      "الوهن العضلي الوبيل",
      "الحمل والرضاعة"
    ],
    dosage: "0.25-0.5mg حتى 3 مرات يومياً (بوصفة طبيب فقط)",
    warnings: "⚠️⚠️⚠️ دواء جدول (مخدر) - يسبب إدمان شديد جداً. لا يُصرف إلا بروشتة طبيب. خطر جداً. لا تتوقف فجأة. للاستخدام قصير المدى فقط (2-4 أسابيع أقصى حد)."
  },
{ name: "توبرادكس",
    aliases: ["Tobradex", "توبرديكس", "توبرادكس", "توبرادىكس", "تووبرادكس", "توبراديكس"],
    scientificName: "Tobramycin + Dexamethasone",
    category: "قطرة عين",
    price: "60-80 جنيه",
    uses: [
      "التهاب العين البكتيري",
      "التهاب الملتحمة",
      "بعد عمليات العيون",
      "التهاب الجفون"
    ],
    sideEffects: [
      "حرقان مؤقت",
      "تشوش رؤية",
      "ارتفاع ضغط العين"
    ],
    contraindications: [
      "عدوى فيروسية بالعين",
      "عدوى فطرية",
      "الجلوكوما"
    ],
    dosage: "نقطة كل 4-6 ساعات",
    warnings: "⚠️ لا تستخدم أكثر من أسبوع. قد يرفع ضغط العين."
  }, 
  {

    name: "نيوريل",
    aliases: ["Neuril", "نيورل", "نورل", "نىوريل", "نييوريل", "نيييوريل", "نييييوريل", "نيووريل", "نيوووريل", "نيووووريل", "نيورريل", "نيوررريل", "نيورررريل", "نيورييل", "نيوريييل", "نيورييييل", "نيوريلل", "نيوريللل", "نيوريلللل", "نوريل", "نيريل", "نيويل", "نييوريل", "نيورييل", "نيووريل", "نيووريل", "نيوريلل", "نيوريلل", "نيورييل", "نيوريلل"],
    scientificName: "Pregabalin 75-150mg",
    category: "مضاد الصرع وآلام الأعصاب (جدول)",
    price: "25-50 جنيه",
    uses: [
      "آلام الأعصاب",
      "اعتلال الأعصاب السكري",
      "القلق العام",
      "الصرع (مساعد)",
      "الألم العضلي الليفي"
    ],
    sideEffects: [
      "دوخة شديدة",
      "نعاس",
      "زيادة وزن",
      "تورم الأطراف",
      "تشوش الرؤية"
    ],
    contraindications: [
      "الحساسية",
      "القيادة (يسبب دوخة شديدة)"
    ],
    dosage: "75-300mg يومياً مقسمة على جرعتين (بوصفة طبيب)",
    warnings: "⚠️⚠️ دواء جدول. يسبب دوخة شديدة - لا تقود. يسبب إدمان. فعال جداً لآلام الأعصاب. لا تتوقف فجأة."
  }
];

// ════════════════════════════════════════════════════════════════
// 🧠 نظام البحث الذكي
// ════════════════════════════════════════════════════════════════

// تطبيع النص (إزالة علامات التشكيل والاختلافات الإملائية)
function normalizeArabicText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // توحيد الهمزات
    .replace(/[إأآا]/g, 'ا')
    // توحيد التاء والهاء
    .replace(/ة/g, 'ه')
    // توحيد الياء
    .replace(/ى/g, 'ي')
    // إزالة التشكيل
    .replace(/[\u064B-\u065F]/g, '')
    // إزالة المسافات الزائدة
    .replace(/\s+/g, ' ');
}

// حساب التشابه بين نصين (Levenshtein Distance مبسط)
function calculateSimilarity(str1, str2) {
  const s1 = normalizeArabicText(str1);
  const s2 = normalizeArabicText(str2);
  
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  // حساب المسافة
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// البحث الذكي عن دواء
function smartSearchDrug(searchTerm) {
  const normalized = normalizeArabicText(searchTerm);
  
  if (!normalized) return { found: null, suggestions: [] };
  
  // 1. بحث دقيق
  let exactMatch = egyptianDrugs.find(drug => {
    const drugNormalized = normalizeArabicText(drug.name);
    const scientificNormalized = normalizeArabicText(drug.scientificName);
    
    if (drugNormalized === normalized || scientificNormalized === normalized) {
      return true;
    }
    
    // البحث في الأسماء البديلة
    return drug.aliases.some(alias => 
      normalizeArabicText(alias) === normalized
    );
  });
  
  if (exactMatch) return { found: exactMatch, suggestions: [] };
  
  // 2. بحث جزئي (يحتوي على)
  let partialMatch = egyptianDrugs.find(drug => {
    const drugNormalized = normalizeArabicText(drug.name);
    const scientificNormalized = normalizeArabicText(drug.scientificName);
    
    if (drugNormalized.includes(normalized) || normalized.includes(drugNormalized)) {
      return true;
    }
    
    if (scientificNormalized.includes(normalized) || normalized.includes(scientificNormalized)) {
      return true;
    }
    
    return drug.aliases.some(alias => {
      const aliasNormalized = normalizeArabicText(alias);
      return aliasNormalized.includes(normalized) || normalized.includes(aliasNormalized);
    });
  });
  
  if (partialMatch) return { found: partialMatch, suggestions: [] };
  
  // 3. بحث ذكي بالتشابه (أخطاء إملائية)
  const similarities = egyptianDrugs.map(drug => {
    const nameSim = calculateSimilarity(drug.name, searchTerm);
    const scientificSim = calculateSimilarity(drug.scientificName, searchTerm);
    const aliasesSim = Math.max(...drug.aliases.map(alias => 
      calculateSimilarity(alias, searchTerm)
    ));
    
    const maxSimilarity = Math.max(nameSim, scientificSim, aliasesSim);
    
    return { drug, similarity: maxSimilarity };
  });
  
  // ترتيب حسب التشابه
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // إذا كان التشابه أكثر من 70% → اعتبره نتيجة
  if (similarities[0].similarity >= 0.7) {
    return { 
      found: similarities[0].drug, 
      suggestions: [],
      didYouMean: similarities[0].similarity < 0.95 // إذا التشابه مش 100%
    };
  }
  
  // إذا لم يُعثر على نتيجة دقيقة → اقترح أقرب 3 أدوية
  const suggestions = similarities
    .filter(s => s.similarity >= 0.4) // تشابه معقول
    .slice(0, 3)
    .map(s => s.drug);
  
  return { found: null, suggestions };
}

// عرض اقتراحات البحث (أثناء الكتابة)
function showSmartDrugSuggestions(searchTerm) {
  const suggestionsDiv = $('drugSuggestions');
  
  if (!searchTerm || searchTerm.length < 2) {
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  const normalized = normalizeArabicText(searchTerm);
  
  const matches = egyptianDrugs.filter(drug => {
    const drugNorm = normalizeArabicText(drug.name);
    const sciNorm = normalizeArabicText(drug.scientificName);
    
    if (drugNorm.includes(normalized) || sciNorm.includes(normalized)) {
      return true;
    }
    
    return drug.aliases.some(alias => 
      normalizeArabicText(alias).includes(normalized)
    );
  }).slice(0, 5);
  
  if (matches.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  suggestionsDiv.innerHTML = matches.map(drug => `
    <div class="suggestion-item" data-drug="${drug.name}">
      <strong>${drug.name}</strong>
      <div style="font-size:12px; opacity:0.7;">${drug.scientificName}</div>
    </div>
  `).join('');
  
  suggestionsDiv.style.display = 'block';
  
  // إضافة event listeners
  suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const drugName = item.getAttribute('data-drug');
      $('drugSearchInput').value = drugName;
      suggestionsDiv.style.display = 'none';
      displaySmartDrugInfo(drugName);
    });
  });
}

// عرض معلومات الدواء مع الاقتراحات الذكية
function displaySmartDrugInfo(drugName) {
  const result = smartSearchDrug(drugName);
  const resultDiv = $('drugInfoResult');
  
  // لو ملقاش الدواء
  if (!result.found) {
    let html = `
      <div class="not-found-message">
        <h4>⚠️ لم يتم العثور على "${drugName}"</h4>
    `;
    
    // عرض اقتراحات
    if (result.suggestions.length > 0) {
      html += `
        <p style="margin-top:15px; font-size:16px; font-weight:600;">
          💡 هل تقصد أحد هذه الأدوية؟
        </p>
        <div style="margin-top:10px;">
      `;
      
      result.suggestions.forEach(drug => {
        html += `
          <button 
            class="btn" 
            style="margin:5px; padding:8px 16px; font-size:14px; background:rgba(255,255,255,0.2);"
            onclick="displaySmartDrugInfo('${drug.name}')"
          >
            ${drug.name}
          </button>
        `;
      });
      
      html += `</div>`;
    } else {
      html += `
        <p style="margin-top:10px; font-size:14px;">
          تأكد من كتابة الاسم بشكل صحيح، أو جرب البحث بطريقة أخرى.
        </p>
      `;
    }
    
    html += `</div>`;
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    return;
  }
  
  // لو لقاه
  const drug = result.found;
  
  let html = '';
  
  // رسالة "هل تقصد" إذا كان البحث فيه خطأ إملائي
  if (result.didYouMean && normalizeArabicText(drug.name) !== normalizeArabicText(drugName)) {
    html += `
      <div style="background:rgba(245,158,11,0.2); padding:12px; border-radius:10px; margin-bottom:15px; border-right:4px solid #f59e0b;">
        <strong>💡 هل تقصد:</strong> ${drug.name}؟
      </div>
    `;
  }
  
  html += `
    <div class="drug-header">
      <h4>💊 ${drug.name}</h4>
      <div class="scientific-name">${drug.scientificName}</div>
      <div style="margin-top:8px;">
        <span class="drug-badge">${drug.category}</span>
      </div>
    </div>
    
    <!-- الاستخدامات -->
    <div class="drug-section">
      <h5>✅ الاستخدامات</h5>
      <ul>
        ${drug.uses.map(use => `<li>${use}</li>`).join('')}
      </ul>
    </div>
    
    <!-- الأعراض الجانبية -->
    <div class="drug-section">
      <h5>⚠️ الأعراض الجانبية</h5>
      <ul>
        ${drug.sideEffects.map(effect => `<li>${effect}</li>`).join('')}
      </ul>
    </div>
    
    <!-- موانع الاستعمال -->
    <div class="drug-section">
      <h5>🚫 موانع الاستعمال</h5>
      <ul>
        ${drug.contraindications.map(contra => `<li>${contra}</li>`).join('')}
      </ul>
    </div>
    
    <!-- الجرعة -->
    <div class="drug-section">
      <h5>💊 الجرعة المعتادة</h5>
      <p>${drug.dosage}</p>
    </div>
    
    <!-- تحذيرات -->
    <div class="drug-warning">
      <h5>⚠️ تحذيرات هامة</h5>
      <p>${drug.warnings}</p>
      <p style="margin-top:12px; font-weight:700; font-size:15px;">
        ⚠️ هذه المعلومات استرشادية فقط. استشر طبيبك أو صيدليك قبل تناول أي دواء.
      </p>
    </div>
  `;
  
  resultDiv.innerHTML = html;
  resultDiv.style.display = 'block';
  
  // Scroll للنتيجة
  setTimeout(() => {
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  
  // إضافة للسجل
  if (typeof addLog === 'function') {
    addLog(`بحث عن دواء: ${drug.name}`);
  }
  if (typeof addPoints === 'function') {
    addPoints(5, 'بحث عن دواء');
  }
  if (typeof beep === 'function') {
    beep(880, 0.08);
  }
}

// تفعيل البحث الذكي
setTimeout(() => {
  const drugSearchInput = $('drugSearchInput');
  const drugSuggestions = $('drugSuggestions');
  
  if (drugSearchInput) {
    // كتابة في خانة البحث → اقتراحات
    drugSearchInput.addEventListener('input', (e) => {
      showSmartDrugSuggestions(e.target.value);
    });
    
    // Enter للبحث
    drugSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const drugName = e.target.value.trim();
        if (drugName) {
          drugSuggestions.style.display = 'none';
          displaySmartDrugInfo(drugName);
        }
      }
    });
    
    // إخفاء الاقتراحات عند الضغط خارجها
    document.addEventListener('click', (e) => {
      if (!drugSearchInput.contains(e.target) && !drugSuggestions.contains(e.target)) {
        drugSuggestions.style.display = 'none';
      }
    });
  }
}, 1000);
function renderBMIHistory() {
  const list = $('bmiHistoryList');
  list.innerHTML = '';
  
  if (bmiHistory.length === 0) {
    list.innerHTML = '<li class="muted" style="list-style:none;text-align:center;padding:20px;">لا يوجد سجل</li>';
    return;
  }
  
  bmiHistory.slice(0, 20).forEach((entry) => {
    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let emoji = '';
    let color = '';
    const bmi = parseFloat(entry.bmi);
    
    if (bmi < 18.5) {
      emoji = '🔵';
      color = '#3b82f6';
    } else if (bmi < 25) {
      emoji = '🟢';
      color = '#10b981';
    } else if (bmi < 30) {
      emoji = '🟡';
      color = '#f59e0b';
    } else {
      emoji = '🔴';
      color = '#ef4444';
    }
    
    const li = document.createElement('li');
    li.style.borderColor = color;
 li.innerHTML = `
  <div>
    <strong>${dateStr}</strong> <span style="color:var(--muted);font-size:13px;">${timeStr}</span><br>
    <span style="font-size:15px;">
      ${emoji} BMI: <strong style="color:${color};">${entry.bmi}</strong> (${entry.category})
      • ${entry.gender === 'male' ? '👨 ذكر' : '👩 أنثى'} 
      • ${entry.age} سنة
      • ${entry.height} سم 
      • ${entry.weight} كجم
    </span>
  </div>
`; 
    list.appendChild(li);
  });
}

function initBMI() {
  console.log('🚀 تشغيل BMI Calculator...');
  
  const calcBtn = $('calcBmiBtn');
  const clearBtn = $('clearBmiBtn');
  
  if(!calcBtn || !clearBtn) {
    console.error('❌ أزرار BMI غير موجودة!');
    return;
  }
  
  calcBtn.addEventListener('click', calculateBMI);
  
 ['bmiHeight', 'bmiWeight', 'bmiAge'].forEach(id => {
    const el = $(id);
    if(el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') calculateBMI();
      });
    }
  });
  
  clearBtn.addEventListener('click', () => {
    if (confirm('هل تريد مسح كل سجل BMI؟')) {
      bmiHistory = [];
      localStorage.removeItem('bmi_history');
      renderBMIHistory();
      addLog('مسح سجل BMI');
      beep(600, 0.05);
    }
  });
  
  renderBMIHistory();
  console.log('✅ BMI Calculator جاهز!');
}

/* ═══════════════════════════════════════════════════
   🔓 نظام فتح قفل الصوت التلقائي
   ═══════════════════════════════════════════════════ */

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  
  console.log('🔓 محاولة فتح قفل الصوت...');
  
  const sounds = [alarmRing, music];
  
  sounds.forEach(sound => {
    if (sound) {
      sound.volume = 0;
      const promise = sound.play();
      
      if (promise !== undefined) {
        promise
          .then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.volume = sound === music ? 0.15 : 1.0;
          })
          .catch(() => {});
      }
    }
  });
  
  audioUnlocked = true;
  console.log('✅ تم فتح قفل الصوت بنجاح!');
}

if (app) {
  ['click', 'touchstart', 'touchend'].forEach(eventType => {
    app.addEventListener(eventType, unlockAudio, { once: true });
  });
}

/* ═══════════════════════════════════════════════════
   🚀 تشغيل التطبيق عند تحميل الصفحة
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ الصفحة اتحملت - بدء التشغيل...');
  
  updatePointsDisplay();
  updateGameBadge();
  updateStreak();
  
  renderMeds();
  renderVitals();
  renderActivity();
  autoDark();
  requestNotif(); // ✅ موجود أصلاً
  initCalories();
  initExercises();
  initBreathing();
  initAI();
  initBMI();
  
  // 🔔 تحديث حالة الإشعارات
  setTimeout(() => {
    updateNotificationStatus();
  }, 1000);
  /* ═══════════════════════════════════════════════════
   ✨ Particles Animation للخلفية
   ═══════════════════════════════════════════════════ */

function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particlesArray = [];
  
  // ضبط حجم Canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
  });
  
  // كلاس الجزيئات
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.5 + 0.3;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      // إعادة الجزيء عند خروجه من الشاشة
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
    
    draw() {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // إنشاء الجزيئات
  function init() {
    particlesArray = [];
    const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000);
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }
  }
  
  // رسم الخطوط بين الجزيئات القريبة
  function connect() {
    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a; b < particlesArray.length; b++) {
        const dx = particlesArray[a].x - particlesArray[b].x;
        const dy = particlesArray[a].y - particlesArray[b].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const opacity = 1 - (distance / 120);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  }
  
  // حلقة الأنيميشن
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    
    connect();
    requestAnimationFrame(animate);
  }
  
  init();
  animate();
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  // ... الكود القديم ...
  
  // ✅ إضافة هذا السطر:
  setTimeout(initParticles, 100);
});
/* ═══════════════════════════════════════════════════════ */
/* 📚 Books Section with PDF.js */
/* ═══════════════════════════════════════════════════════ */

// تفعيل PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// عناصر صفحة الكتب
const pageBooksEl = $('page-books');
const pagePdfReaderEl = $('page-pdf-reader');
const pdfCanvas = $('pdfCanvas');
const pdfTitleEl = $('pdfTitle');
const backFromPdfBtn = $('backFromPdf');
const downloadPdfBtn = $('downloadPdfBtn');
const prevPageBtn = $('prevPage');
const nextPageBtn = $('nextPage');
const pageNumEl = $('pageNum');
const pageCountEl = $('pageCount');

let currentPdfUrl = '';
let currentBookTitle = '';
let pdfDoc = null;
let currentPage = 1;
let pageRendering = false;
let pageNumPending = null;

// رسم صفحة PDF
function renderPage(num) {
  pageRendering = true;
  
  pdfDoc.getPage(num).then(function(page) {
    const canvas = pdfCanvas;
    const ctx = canvas.getContext('2d');
    
    // حساب المقاسات
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    const renderTask = page.render(renderContext);
    
    renderTask.promise.then(function() {
      pageRendering = false;
      
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
  
  // تحديث رقم الصفحة
  pageNumEl.textContent = num;
}

// طلب رسم صفحة
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

// الصفحة السابقة
function onPrevPage() {
  if (currentPage <= 1) {
    return;
  }
  currentPage--;
  queueRenderPage(currentPage);
  beep(660, 0.08);
}

// الصفحة التالية
function onNextPage() {
  if (currentPage >= pdfDoc.numPages) {
    return;
  }
  currentPage++;
  queueRenderPage(currentPage);
  beep(880, 0.08);
}

// أزرار التحكم
if (prevPageBtn) {
  prevPageBtn.addEventListener('click', onPrevPage);
}

if (nextPageBtn) {
  nextPageBtn.addEventListener('click', onNextPage);
}

// فتح الكتاب
$$('.btn-book').forEach(btn => {
  btn.addEventListener('click', function() {
    const pdfName = this.getAttribute('data-pdf');
    const bookCard = this.closest('.book-card');
    const bookTitle = bookCard.querySelector('h3').textContent;
    
    currentPdfUrl = pdfName;
    currentBookTitle = bookTitle;
    
    // إخفاء صفحة الكتب وإظهار قارئ PDF
    pageBooksEl.classList.remove('active');
    pageBooksEl.classList.add('hidden');
    
    pagePdfReaderEl.classList.remove('hidden');
    pagePdfReaderEl.classList.add('active');
    
    pdfTitleEl.textContent = bookTitle;
    
    // تحميل PDF
    const loadingTask = pdfjsLib.getDocument(currentPdfUrl);
    loadingTask.promise.then(function(pdf) {
      pdfDoc = pdf;
      pageCountEl.textContent = pdf.numPages;
      
      // رسم الصفحة الأولى
      currentPage = 1;
      renderPage(currentPage);
    }).catch(function(error) {
      console.error('خطأ في تحميل PDF:', error);
      alert('❌ عذراً، حدث خطأ في تحميل الكتاب. تأكد من وجود الملف في المجلد.');
    });
    
    beep(880, 0.1);
  });
});

// زر الرجوع من قارئ PDF
if (backFromPdfBtn) {
  backFromPdfBtn.addEventListener('click', () => {
    pagePdfReaderEl.classList.remove('active');
    pagePdfReaderEl.classList.add('hidden');
    
    pageBooksEl.classList.remove('hidden');
    pageBooksEl.classList.add('active');
    
    // إعادة تعيين
    pdfDoc = null;
    currentPage = 1;
    
    beep(660, 0.1);
  });
}

// زر تحميل الكتاب
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = currentPdfUrl;
    link.download = currentBookTitle + '.pdf';
    link.click();
    
    beep(1046, 0.15);
    
    // رسالة تأكيد
    const toast = document.createElement('div');
    toast.textContent = '✅ جاري تحميل الكتاب...';
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--success);
      color: white;
      padding: 16px 28px;
      border-radius: 12px;
      font-weight: 700;
      z-index: 9999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      animation: slideUp 0.3s;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  });
}
 console.log('✅ ✨ HEAL MATE v3.0 - جاهز للعمل! ✨');
});
