// ==========================================
// ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ И ЛОГИКА ОПРОСА
// ==========================================

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
            loadOrCreateTama(); // Загружаем или создаем питомца
            updateTamaUI();
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

// Добавление кнопок действий в интерфейс
function setupTamaActionButtons() {
    const actionsContainer = document.querySelector('.tama-actions');
    if (!actionsContainer) return;

    actionsContainer.innerHTML = `
        <button id="feed-btn" class="game-btn">🍎 Покормить</button>
        <button id="play-btn" class="game-btn">🕺 Развлечь</button>
        <button id="pet-btn" class="game-btn">❤️ Погладить</button>
        <button id="sleep-btn" class="game-btn">😴 Спать</button>
    `;

    document.getElementById('feed-btn').onclick = () => interactTama('feed');
    document.getElementById('play-btn').onclick = () => interactTama('play');
    document.getElementById('pet-btn').onclick = () => interactTama('pet');
    document.getElementById('sleep-btn').onclick = () => interactTama('sleep');
}

// --- ДАННЫЕ ОПРОСА АДМИНИСТРАТОРОВ ---
const ADMINS = [
    { name: "Катя", username: "katya_support", avatar: "👩‍💻", tags: ["chill", "introvert"], desc: "Спокойная, чуткая, любит котиков. Разберет любой сложный кейс без паники." },
    { name: "Алекс", username: "alex_admin", avatar: "⚡", tags: ["energy", "extrovert"], desc: "Динамичный, обожает технологии. Отвечает со скоростью света!" },
    { name: "Мария", username: "maria_care", avatar: "🌟", tags: ["empathy", "creative"], desc: "Увлечена психологией. Выслушает и решит проблему с максимальной заботой." }
];

const QUESTIONS = [
    { q: "Как проходит твое идеальное утро?", o: [{t:"chill", text:"В тишине с чашкой кофе"}, {t:"energy", text:"С активной тренировки"}, {t:"creative", text:"За просмотром сериала"}] },
    { q: "Какое качество в людях важнее?", o: [{t:"empathy", text:"Умение сопереживать"}, {t:"chill", text:"Холодный рассудок"}, {t:"introvert", text:"Соблюдение границ"}] },
    { q: "Атмосфера в чате должна быть...", o: [{t:"energy", text:"Быстрой и драйвовой"}, {t:"chill", text:"Размеренной и уютной"}, {t:"empathy", text:"Дружелюбной"}] }
];

let currentQuestion = 0;
let userScores = {};

function switchScreen(from, to, callback) {
    document.getElementById(from).classList.remove('active');
    const toEl = document.getElementById(to);
    toEl.classList.add('active');
    if(callback) callback();
}

function startQuiz() {
    buildDots();
    showQuestion();
}

function buildDots() {
    const container = document.getElementById('dots-container');
    container.innerHTML = '';
    QUESTIONS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        container.appendChild(dot);
    });
}

function showQuestion() {
    const qData = QUESTIONS[currentQuestion];
    document.getElementById('question-title').innerText = qData.q;
    
    document.querySelectorAll('.dot').forEach((dot, idx) => {
        dot.className = `dot ${idx <= currentQuestion ? 'active' : ''}`;
    });

    const optionsContainer = document.getElementById('options-container');
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
    
    if (maxMatches <= 0) {
        document.getElementById('match-avatar').innerText = "🚀";
        document.getElementById('match-name').innerText = "Стань им сам!";
        document.getElementById('match-percent').innerText = "0%";
        document.getElementById('match-desc').innerText = "Похоже, у нас нет подходящего администратора. Попробуй стать им!";
        actionBtn.onclick = () => openLink("https://t.me");
    } else {
        document.getElementById('match-avatar').innerText = bestAdmin.avatar;
        document.getElementById('match-name').innerText = bestAdmin.name;
        document.getElementById('match-percent').innerText = "94%";
        document.getElementById('match-desc').innerText = bestAdmin.desc;
        actionBtn.onclick = () => openLink(`https://t.me{bestAdmin.username}`);
    }
}

function openLink(url) {
    if (tg) tg.openTelegramLink(url);
    else window.open(url, '_blank');
}
// ==========================================
// ЧАСТЬ 2: ГРАФИЧЕСКИЙ ДВИЖОК ТАМАГОЧИ И ЛОКАЛЬНЫЕ СЕЙВЫ
// ==========================================

const TAMA_TYPES = [
    {
        name: "Робо-Помощник",
        happy: "images/robo_happy.png",
        hungry: "images/robo_hungry.png",
        tired: "images/robo_tired.png",
        dead: "images/robo_dead.png"
    },
    {
        name: "Космический Котик",
        happy: "images/cat_happy.png",
        hungry: "images/cat_hungry.png",
        tired: "images/cat_tired.png",
        dead: "images/cat_dead.png"
    }
];

// Дефолтные настройки
let tamaStats = { 
    satiety: 80, 
    energy: 100, 
    isDead: false, 
    typeIndex: null, 
    deathTime: null 
};

// Загрузка или создание питомца
function loadOrCreateTama() {
    const saved = localStorage.getItem('tg_tama_save');
    if (saved) {
        tamaStats = JSON.parse(saved);
        // Проверяем, не прошло ли уже время блокировки умершего питомца
        checkDeathTimeout();
    } else {
        // Создаем нового случайного питомца раз и навсегда
        tamaStats.typeIndex = Math.floor(Math.random() * TAMA_TYPES.length);
        tamaStats.satiety = 80;
        tamaStats.energy = 100;
        tamaStats.isDead = false;
        tamaStats.deathTime = null;
        saveTama();
    }
}

function saveTama() {
    localStorage.setItem('tg_tama_save', JSON.stringify(tamaStats));
}

// Функция проверки 24 часов после смерти
function checkDeathTimeout() {
    if (!tamaStats.isDead || !tamaStats.deathTime) return;

    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    const timePassed = now - tamaStats.deathTime;

    if (timePassed >= oneDayInMs) {
        // Время прошло — разблокируем и сбрасываем состояние для нового питомца
        tamaStats.isDead = false;
        tamaStats.deathTime = null;
        tamaStats.typeIndex = Math.floor(Math.random() * TAMA_TYPES.length);
        tamaStats.satiety = 80;
        tamaStats.energy = 100;
        saveTama();
    }
}

// Жизненный цикл питомца (Снижено потребление: раз в 20 секунд)
function loopTamaLogic() {
    loadOrCreateTama();
    if (tamaStats.isDead) return;

    // Статистика падает намного медленнее
    tamaStats.satiety = Math.max(0, tamaStats.satiety - 2);
    tamaStats.energy = Math.max(0, tamaStats.energy - 1);

    // Если один из параметров упал до 0 — питомец погибает
    if (tamaStats.satiety <= 0 || tamaStats.energy <= 0) {
        tamaStats.isDead = true;
        tamaStats.deathTime = Date.now();
    }

    saveTama();
    updateTamaUI();
}

// Обновление внешнего вида игры
function updateTamaUI() {
    loadOrCreateTama();
    const sprite = document.getElementById('monster-sprite');
    const statusText = document.getElementById('monster-status-text');
    const actionsContainer = document.querySelector('.tama-actions');
    
    const pet = TAMA_TYPES[tamaStats.typeIndex];

    document.getElementById('satiety-bar').style.width = tamaStats.satiety + '%';
    document.getElementById('energy-bar').style.width = tamaStats.energy + '%';

    // ЕСЛИ ПИТОМЕЦ УМЕР
    if (tamaStats.isDead) {
        sprite.innerHTML = `<img src="${pet.dead}" alt="dead" class="tama-img">`;
        
        // Считаем сколько осталось до воскрешения
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const timeLeft = oneDayInMs - (now - tamaStats.deathTime);
        
        if (timeLeft > 0) {
            const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
            statusText.innerHTML = `Ваш питомец погиб.<br><span style="color:var(--hint-color); font-size:14px;">Получить нового вы сможете через ${hoursLeft} ч.</span>`;
            
            // Заменяем кнопки действий на заглушку
            if (actionsContainer) {
                actionsContainer.innerHTML = `<button class="game-btn" style="background:#ffebee; color:#c62828; border:none; width:100%; cursor:not-allowed;" disabled>🔒 Доступ заблокирован</button>`;
            }
        } else {
            // Если сутки прошли — выводим кнопку Воскресить
            statusText.innerText = "Время прошло. Вы можете призвать нового питомца!";
            if (actionsContainer) {
                actionsContainer.innerHTML = `<button id="revive-btn" class="main-button" style="width:100%;">✨ Воскресить питомца</button>`;
                document.getElementById('revive-btn').onclick = () => {
                    localStorage.removeItem('tg_tama_save'); // Удаляем старое сохранение
                    loadOrCreateTama(); // Пересоздаем
                    setupTamaActionButtons(); // Возвращаем игровые кнопки
                    updateTamaUI();
                };
            }
        }
        return;
    }

    // ЕСЛИ ПИТОМЕЦ ЖИВ (Смена текстур)
    let currentImagePath = pet.happy;

    if (tamaStats.satiety < 35) {
        currentImagePath = pet.hungry;
        statusText.innerText = `Я голоден! Покорми меня! 🍎`;
    } else if (tamaStats.energy < 35) {
        currentImagePath = pet.tired;
        statusText.innerText = `Я устал, хочу спать... 💤`;
    } else {
        currentImagePath = pet.happy;
        statusText.innerText = `${pet.name} чувствует себя отлично! 🥰`;
    }

    sprite.innerHTML = `<img src="${currentImagePath}" alt="pet" class="tama-img">`;
}

// Обработка кликов по кнопкам
function interactTama(type) {
    loadOrCreateTama();
    if (tamaStats.isDead) return;

    const sprite = document.getElementById('monster-sprite');
    
    if (type === 'feed') {
        tamaStats.satiety = Math.min(100, tamaStats.satiety + 20);
        tamaStats.energy = Math.min(100, tamaStats.energy + 5); 
    } else if (type === 'play') {
        tamaStats.energy = Math.max(10, tamaStats.energy - 15);
        tamaStats.satiety = Math.max(10, tamaStats.satiety - 12);
    } else if (type === 'pet') {
        tamaStats.energy = Math.min(100, tamaStats.energy + 10);
    } else if (type === 'sleep') {
        tamaStats.energy = Math.min(100, tamaStats.energy + 40);
        tamaStats.satiety = Math.max(10, tamaStats.satiety - 15);
    }

    saveTama();

    // Визуальный отклик (эффект прыжка/покачивания при нажатии)
    sprite.style.transform = "scale(1.15) translateY(-15px)";
    setTimeout(() => {
        sprite.style.transform = "none";
        updateTamaUI();
    }, 250);
}

// Запускаем игровой таймер жизнедеятельности раз в 20 секунд
setInterval(loopTamaLogic, 20000);
