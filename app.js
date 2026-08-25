// ==========================================================================
// ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP API, НАВИГАЦИЯ И СОЗДАНИЕ КНОПОК
// ==========================================================================

// Пассивное и безопасное объявление API Telegram
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// Переключение Вкладок (Подбор / Тамагочи)
document.addEventListener('DOMContentLoaded', () => {
    const tabQuiz = document.getElementById('tab-quiz');
    const tabTama = document.getElementById('tab-tama');
    const quizContent = document.getElementById('quiz-tab-content');
    const tamaContent = document.getElementById('tama-tab-content');

    if(tabQuiz && tabTama) {
        tabQuiz.onclick = () => {
            tabQuiz.classList.add('active');
            tabTama.classList.remove('active');
            quizContent.classList.add('active');
            tamaContent.classList.remove('active');
        };
        tabTama.onclick = () => {
            tabTama.classList.add('active');
            tabQuiz.classList.remove('active');
            tamaContent.classList.add('active');
            quizContent.classList.remove('active');
            loadOrCreateTama(); // Загружаем или создаем питомца из сейва
            updateTamaUI();     // Рисуем интерфейс игры
        };
    }

    // Привязка старта опроса
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            switchScreen('welcome-screen', 'quiz-screen', startQuiz);
        };
    }

    // Динамическое создание кнопок действий для Тамагочи
    setupTamaActionButtons();
});

// Добавление квадратных кнопок действий в интерфейс
function setupTamaActionButtons() {
    const actionsContainer = document.querySelector('.tama-actions');
    if (!actionsContainer) return;

    // Сетка кнопок 2х2 с ровным отображением эмодзи
    actionsContainer.innerHTML = `
        <button id="feed-btn" class="game-btn">🍎 Покормить</button>
        <button id="play-btn" class="game-btn">🕺 Развлечь</button>
        <button id="pet-btn" class="game-btn">🥰 Погладить</button>
        <button id="sleep-btn" class="game-btn">😴 Спать</button>
    `;

    document.getElementById('feed-btn').onclick = () => interactTama('feed');
    document.getElementById('play-btn').onclick = () => interactTama('play');
    document.getElementById('pet-btn').onclick = () => interactTama('pet');
    document.getElementById('sleep-btn').onclick = () => interactTama('sleep');
}

// --- ДАННЫЕ ОПРОСА АДМИНИСТРАТОРОВ ---
const ADMINS = [
    { name: "Катя", username: "katya_support", avatar: "👩‍💻", tags: ["chill", "introvert"], desc: "Спокойная, чуткая, уважает ваши границы. Разберет любой сложный кейс без паники и лишних эмоций." },
    { name: "Алекс", username: "alex_admin", avatar: "⚡", tags: ["energy", "creative"], desc: "Динамичный, яркий и хаотичный. Отвечает со скоростью света, поднимет настроение шуткой!" },
    { name: "Мария", username: "maria_care", avatar: "🌟", tags: ["empathy", "creative"], desc: "Искренне увлечена психологией. Выслушает, окутает теплом и решит проблему с максимальной заботой." },
    { name: "Дмитрий", username: "dima_lead", avatar: "🧠", tags: ["rational", "chill"], desc: "Вдумчивый, глубокий и рассудительный. Поможет докопаться до сути проблемы и разложить все по полочкам." }
];
// ==========================================================================
// ЧАСТЬ 2: ПОЛНЫЙ МАССИВ ИЗ 10 ПСИХОЛОГИЧЕСКИХ ВОПРОСОВ И УПРАВЛЕНИЕ ТЕСТОМ
// ==========================================================================

const QUESTIONS = [
    { 
        q: "1. ты пришел(ла) в бот, потому что тебе тяжело. чего хочется больше всего?", 
        o: [
            {t:"introvert", text:"чтобы меня просто выслушали"}, 
            {t:"empathy", text:"чтобы меня успокоили и поддержали"}, 
            {t:"rational", text:"чтобы помогли разобраться"}, 
            {t:"energy", text:"чтобы отвлекли и немного развеселили"}
        ] 
    },
    { 
        q: "2. тебе проще открыться человеку, который…", 
        o: [
            {t:"rational", text:"задает вопросы и помогает развивать диалог"}, 
            {t:"introvert", text:"внимательно слушает и не перебивает"}, 
            {t:"empathy", text:"честно делится своим мнением"}, 
            {t:"energy", text:"общается легко, будто мы давно знакомы"}
        ] 
    },
    { 
        q: "3. ты написал(а) админу огромную простыню текста. что думаешь?", 
        o: [
            {t:"rational", text:"«надеюсь, я нормально все объяснил(а)»"}, 
            {t:"introvert", text:"«наконец-то я это высказал(а)»"}, 
            {t:"creative", text:"«интересно, что он скажет»"}, 
            {t:"empathy", text:"«ну все, теперь он знает обо мне вообще все»"}
        ] 
    },
    { 
        q: "4. какой ответ тебе было бы приятнее получить?", 
        o: [
            {t:"introvert", text:"«я понимаю, почему ты так себя чувствуешь»"}, 
            {t:"empathy", text:"«ты можешь побыть здесь столько, сколько нужно»"}, 
            {t:"rational", text:"«давай попробуем вместе разобраться»"}, 
            {t:"energy", text:"«так, иди сюда 🫂 сейчас будем спасать ситуацию»"}
        ] 
    },
    { 
        q: "5. тебе дали совет, но он тебе совсем не подходит. ты…", 
        o: [
            {t:"rational", text:"объяснишь, почему тебе это не подходит"}, 
            {t:"introvert", text:"скорее промолчишь"}, 
            {t:"empathy", text:"предложишь вместе поискать другой вариант"}, 
            {t:"energy", text:"пошутишь и переведешь тему"}
        ] 
    },
    { 
        q: "6. какой вайб общения тебе ближе?", 
        o: [
            {t:"chill", text:"спокойный и уютный"}, 
            {t:"empathy", text:"теплый и заботливый"}, 
            {t:"rational", text:"глубокий и осмысленный"}, 
            {t:"energy", text:"живой, смешной и немного хаотичный"}
        ] 
    },
    { 
        q: "7. ты сам(а) не понимаешь, что именно чувствуешь. хороший админ…", 
        o: [
            {t:"creative", text:"поможет подобрать слова"}, 
            {t:"chill", text:"скажет, что не обязательно сразу во всем разбираться"}, 
            {t:"rational", text:"задаст несколько вопросов, чтобы вместе докопаться до сути"}, 
            {t:"empathy", text:"просто продолжит разговаривать, пока все постепенно не прояснится"}
        ] 
    },
    { 
        q: "8. что для тебя самое важное в общении с админом?", 
        o: [
            {t:"introvert", text:"чтобы меня не осуждали"}, 
            {t:"chill", text:"чтобы рядом было спокойно и безопасно"}, 
            {t:"empathy", text:"чтобы меня действительно пытались понять"}, 
            {t:"energy", text:"чтобы общение не ощущалось формальным"}
        ] 
    },
    { 
        q: "9. какой стиль общения тебе скорее не понравится?", 
        o: [
            {t:"energy", text:"сухие ответы"}, 
            {t:"introvert", text:"когда меня торопят или заставляют открыться"}, 
            {t:"rational", text:"когда мне сразу начинают раздавать советы"}, 
            {t:"creative", text:"когда все превращают в слишком серьёзный разговор"}
        ] 
    },
    { 
        q: "10. выбери фразу, которая сейчас тебе ближе всего:", 
        o: [
            {t:"introvert", text:"«мне просто нужно, чтобы меня услышали»"}, 
            {t:"empathy", text:"«хочется немного тепла»"}, 
            {t:"rational", text:"«я хочу понять, что со мной происходит»"}, 
            {t:"energy", text:"«мне нужен человек, с которым можно просто поговорить»"}
        ] 
    }
];

let currentQuestion = 0;
let userScores = {};

function switchScreen(from, to, callback) {
    const fromEl = document.getElementById(from);
    const toEl = document.getElementById(to);
    if (!fromEl || !toEl) return;
    fromEl.classList.remove('active');
    toEl.classList.add('active');
    if(callback) callback();
}

function startQuiz() {
    buildDots();
    showQuestion();
}

function buildDots() {
    const container = document.getElementById('dots-container');
    if (!container) return;
    container.innerHTML = '';
    QUESTIONS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        container.appendChild(dot);
    });
}
// ==========================================================================
// ЧАСТЬ 3: ИИ-СКОРИНГ ПРОЦЕНТОВ, ЛОКАЛЬНЫЕ СЕЙВЫ И ДВИЖОК ТАМАГОЧИ
// ==========================================================================

function showQuestion() {
    const qData = QUESTIONS[currentQuestion];
    const titleEl = document.getElementById('question-title');
    if (titleEl) titleEl.innerText = qData.q;
    
    document.querySelectorAll('.dot').forEach((dot, idx) => {
        dot.className = `dot ${idx <= currentQuestion ? 'active' : ''}`;
    });

    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';

    qData.o.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => handleAnswer(opt.t);
        optionsContainer.appendChild(btn);
    });
}

function handleAnswer(tag) {
    userScores[tag] = (userScores[tag] || 0) + 1;
    if (currentQuestion < QUESTIONS.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        switchScreen('quiz-screen', 'result-screen', calculateResult);
    }
}

function calculateResult() {
    let bestAdmin = null;
    let maxMatches = -1;

    ADMINS.forEach(admin => {
        let score = 0;
        admin.tags.forEach(t => { if (userScores[t]) score += userScores[t]; });
        if (score > maxMatches) { maxMatches = score; bestAdmin = admin; }
    });

    // Начисление бонуса питомцу за успешный тест
    loadOrCreateTama();
    if (!tamaStats.isDead) {
        tamaStats.satiety = Math.min(100, tamaStats.satiety + 20);
        saveTama();
    }

    const actionBtn = document.getElementById('action-btn');
    if (!actionBtn) return;
    
    if (maxMatches <= 0) {
        document.getElementById('match-avatar').innerText = "🚀";
        document.getElementById('match-name').innerText = "Стань им сам!";
        document.getElementById('match-percent').innerText = "0%";
        document.getElementById('match-desc').innerText = "Похоже, у нас нет подходящего администратора. Попробуй стать им!";
        actionBtn.onclick = () => openLink("https://t.me");
    } else {
        const basePercent = 72 + Math.floor((maxMatches / QUESTIONS.length) * 20);
        const randomBonus = Math.floor(Math.random() * 6); 
        const finalPercent = Math.min(99, basePercent + randomBonus);

        document.getElementById('match-avatar').innerText = bestAdmin.avatar;
        document.getElementById('match-name').innerText = bestAdmin.name;
        document.getElementById('match-percent').innerText = finalPercent + "%";
        document.getElementById('match-desc').innerText = bestAdmin.desc;
        actionBtn.onclick = () => openLink(`https://t.me{bestAdmin.username}`);
    }
}

function openLink(url) {
    if (tg) tg.openTelegramLink(url);
    else window.open(url, '_blank');
}

// --- ИГРОВОЙ ДВИЖОК ТАМАГОЧИ ---
const TAMA_TYPES = [
    { name: "Робо-Помощник", happy: "🤖", hungry: "🥺", tired: "😴", dead: "💀" },
    { name: "Космический Котик", happy: "🐱", hungry: "😾", tired: "🙀", dead: "☠️" }
];

let tamaStats = { satiety: 80, energy: 100, isDead: false, typeIndex: null, deathTime: null };

function loadOrCreateTama() {
    const saved = localStorage.getItem('tg_tama_save');
    if (saved) {
        tamaStats = JSON.parse(saved);
        checkDeathTimeout();
    } else {
        tamaStats.typeIndex = Math.floor(Math.random() * TAMA_TYPES.length);
        tamaStats.satiety = 80; tamaStats.energy = 100; tamaStats.isDead = false; tamaStats.deathTime = null;
        saveTama();
    }
}

function saveTama() { localStorage.setItem('tg_tama_save', JSON.stringify(tamaStats)); }

function checkDeathTimeout() {
    if (!tamaStats.isDead || !tamaStats.deathTime) return;
    const now = Date.now();
    if (now - tamaStats.deathTime >= 24 * 60 * 60 * 1000) {
        tamaStats.isDead = false; tamaStats.deathTime = null;
        tamaStats.typeIndex = Math.floor(Math.random() * TAMA_TYPES.length);
        tamaStats.satiety = 80; tamaStats.energy = 100;
        saveTama();
    }
}

function loopTamaLogic() {
    loadOrCreateTama();
    if (tamaStats.isDead) return;
    tamaStats.satiety = Math.max(0, tamaStats.satiety - 2);
    tamaStats.energy = Math.max(0, tamaStats.energy - 1);
    if (tamaStats.satiety <= 0 || tamaStats.energy <= 0) {
        tamaStats.isDead = true; tamaStats.deathTime = Date.now();
    }
    saveTama(); updateTamaUI();
}

function updateTamaUI() {
    loadOrCreateTama();
    const sprite = document.getElementById('monster-sprite');
    const statusText = document.getElementById('monster-status-text');
    const actionsContainer = document.querySelector('.tama-actions');
    if (!sprite || !statusText) return;
    
    const pet = TAMA_TYPES[tamaStats.typeIndex];
    const satBar = document.getElementById('satiety-bar');
    const nrgBar = document.getElementById('energy-bar');
    if (satBar) satBar.style.width = tamaStats.satiety + '%';
    if (nrgBar) nrgBar.style.width = tamaStats.energy + '%';

    if (tamaStats.isDead) {
        sprite.innerHTML = `<div class="tama-emoji-sprite">${pet.dead}</div>`;
        const timeLeft = (24 * 60 * 60 * 1000) - (Date.now() - tamaStats.deathTime);
        if (timeLeft > 0) {
            statusText.innerHTML = `Ваш питомец погиб.<br><span style="color:var(--hint-color); font-size:14px;">Получить нового вы сможете через ${Math.ceil(timeLeft / (1000 * 60 * 60))} ч.</span>`;
            if (actionsContainer) actionsContainer.innerHTML = `<button class="game-btn" style="background:rgba(255,235,235,0.4); color:#c62828; border:none; width:100%; grid-column: span 2; cursor:not-allowed;" disabled>🔒 Доступ заблокирован</button>`;
        } else {
            statusText.innerText = "Время прошло. Вы можете призвать нового питомца!";
            if (actionsContainer) {
                actionsContainer.innerHTML = `<button id="revive-btn" class="main-button" style="width:100%; grid-column: span 2;">✨ Воскресить питомца</button>`;
                document.getElementById('revive-btn').onclick = () => {
                    localStorage.removeItem('tg_tama_save'); loadOrCreateTama(); setupTamaActionButtons(); updateTamaUI();
                };
            }
        }
        return;
    }

    let currentEmoji = pet.happy;
    if (tamaStats.satiety < 35) { currentEmoji = pet.hungry; statusText.innerText = `Я голоден! Покорми меня! 🍎`; }
    else if (tamaStats.energy < 35) { currentEmoji = pet.tired; statusText.innerText = `Я устал, хочу спать... 💤`; }
    else { currentEmoji = pet.happy; statusText.innerText = `${pet.name} чувствует себя отлично! 🥰`; }
    sprite.innerHTML = `<div class="tama-emoji-sprite">${currentEmoji}</div>`;
}

function interactTama(type) {
    loadOrCreateTama(); if (tamaStats.isDead) return;
    const sprite = document.getElementById('monster-sprite'); if (!sprite) return;
    let actionEmoji = TAMA_TYPES[tamaStats.typeIndex].happy;
    
    if (type === 'feed') { tamaStats.satiety = Math.min(100, tamaStats.satiety + 20); tamaStats.energy = Math.min(100, tamaStats.energy + 5); actionEmoji = "😋"; }
    else if (type === 'play') { tamaStats.energy = Math.max(10, tamaStats.energy - 15); tamaStats.satiety = Math.max(10, tamaStats.satiety - 12); actionEmoji = "🕺"; }
    else if (type === 'pet') { tamaStats.energy = Math.min(100, tamaStats.energy + 10); actionEmoji = "🥰"; }
    else if (type === 'sleep') { tamaStats.energy = Math.min(100, tamaStats.energy + 40); tamaStats.satiety = Math.max(10, tamaStats.satiety - 15); actionEmoji = "😴"; }

    saveTama();
    sprite.innerHTML = `<div class="tama-emoji-sprite">${actionEmoji}</div>`;
    sprite.style.transform = "scale(1.15) translateY(-15px)";
    setTimeout(() => { sprite.style.transform = "none"; updateTamaUI(); }, 250);
}

setInterval(loopTamaLogic, 20000);
