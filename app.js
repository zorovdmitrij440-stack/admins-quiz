// Пассивное и безопасное объявление API
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
            loopTamaLogic(); // Запуск симуляции жизни
        };
    }

    // Привязка старта опроса (ПРЯМАЯ, БЕЗ СЛОЖНЫХ СЛУШАТЕЛЕЙ)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            switchScreen('welcome-screen', 'quiz-screen', startQuiz);
        };
    }

    // Кнопки Тамагочи
    document.getElementById('feed-btn').onclick = () => interactTama('feed');
    document.getElementById('play-btn').onclick = () => interactTama('play');
});

// --- ДАННЫЕ ОПРОСА ---
const ADMINS = [
    { name: "Катя", username: "katya_support", avatar: "👩‍💻", tags: ["chill", "introvert"], desc: "Спокойная, чуткая, любит котиков. Разберет любой сложный кейс без паники." },
    { name: "Алекс", username: "alex_admin", avatar: "⚡", tags: ["energy", "extrovert"], desc: "Динамичный, обожает технологии. Отвечает со скоростью света!" },
    { name: "Мария", username: "maria_care", avatar: "🌟", tags: ["empathy", "creative"], desc: "Увлечена психологией. Выслушает, и решит проблему с максимальной заботой." }
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

    // Начисление бонуса питомцу за успешный тест!
    tamaStats.satiety = Math.min(100, tamaStats.satiety + 20);

    const actionBtn = document.getElementById('action-btn');
    
    if (maxMatches <= 0) {
        document.getElementById('match-avatar').innerText = "🚀";
        document.getElementById('match-name').innerText = "Стань им сам!";
        document.getElementById('match-percent').innerText = "0%";
        document.getElementById('match-desc').innerText = "Похоже, у нас нет подходящего администратора. Попробуй стать им!";
        actionBtn.onclick = () => openLink("https://t.me/formkeepmyheart_bot");
    } else {
        document.getElementById('match-avatar').innerText = bestAdmin.avatar;
        document.getElementById('match-name').innerText = bestAdmin.name;
        document.getElementById('match-percent').innerText = "94%";
        document.getElementById('match-desc').innerText = bestAdmin.desc;
        actionBtn.onclick = () => openLink(`https://t.me/keepmyheart_bot`);
    }
}

function openLink(url) {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink(url);
    } else {
        // Если тестируете в обычном браузере на ПК
        window.open(url, '_blank'); 
    }
}

// --- ЛОГИКА ТАМАГОЧИ С РАНДОМНЫМИ ВАРИАНТАМИ ---
// Доступные варианты питомцев (Спрайты для разных состояний)
const TAMA_TYPES = [
    {
        name: "Робо-Помощник",
        happy: "🤖",
        hungry: "🥺",
        tired: "😴",
        dead: "💀"
    },
    {
        name: "Космический Котик",
        happy: "🐱",
        hungry: "😾",
        tired: "🙀",
        dead: "☠️"
    }
];

// Переменная для хранения текущих характеристик
let tamaStats = { 
    satiety: 70, 
    energy: 100, 
    isDead: false,
    petType: null // Сюда запишется выбранный случайный питомец
};

// Функция инициализации питомца (вызывается один раз)
function initTama() {
    if (!tamaStats.petType) {
        // Рандомный выбор индекса 0 или 1
        const randomIndex = Math.floor(Math.random() * TAMA_TYPES.length);
        tamaStats.petType = TAMA_TYPES[randomIndex];
        console.log("Выбран питомец: " + tamaStats.petType.name);
    }
}

function loopTamaLogic() {
    initTama(); // Проверяем, создан ли питомец
    if (tamaStats.isDead) return;

    // Медленный расход параметров со временем
    tamaStats.satiety = Math.max(0, tamaStats.satiety - 2);
    tamaStats.energy = Math.max(0, tamaStats.energy - 1);

    updateTamaUI();
}

function updateTamaUI() {
    initTama();
    const sprite = document.getElementById('monster-sprite');
    const statusText = document.getElementById('monster-status-text');
    const pet = tamaStats.petType;

    document.getElementById('satiety-bar').style.width = tamaStats.satiety + '%';
    document.getElementById('energy-bar').style.width = tamaStats.energy + '%';

    // Проверка на смерть
    if (tamaStats.satiety <= 0 || tamaStats.energy <= 0) {
        tamaStats.isDead = true;
        sprite.innerText = pet.dead;
        statusText.innerText = `Твой ${pet.name} погиб... Нужен перезапуск.`;
        sprite.className = "";
        return;
    }

    // Смена спрайтов в зависимости от состояния
    if (tamaStats.satiety < 35) {
        sprite.innerText = pet.hungry;
        statusText.innerText = `Я голоден! Покорми меня!`;
    } else if (tamaStats.energy < 35) {
        sprite.innerText = pet.tired;
        statusText.innerText = `Я устал, хочу спать...`;
    } else {
        sprite.innerText = pet.happy;
        statusText.innerText = `${pet.name} чувствует себя отлично!`;
    }
}

function interactTama(type) {
    if (tamaStats.isDead) return;

    const sprite = document.getElementById('monster-sprite');
    
    if (type === 'feed') {
        tamaStats.satiety = Math.min(100, tamaStats.satiety + 20);
        sprite.innerText = "😋"; // Временная эмоция радости от еды
    } else if (type === 'play') {
        tamaStats.energy = Math.max(20, tamaStats.energy - 15);
        tamaStats.satiety = Math.max(10, tamaStats.satiety - 10);
        sprite.innerText = "🕺"; // Временная эмоция танца
    }

    // Анимация прыжка при клике
    sprite.style.transform = "scale(1.3) translateY(-20px)";
    setTimeout(() => {
        sprite.style.transform = "none";
        updateTamaUI();
    }, 300);
}

// Запускаем таймер жизни раз в 7 секунд
setInterval(loopTamaLogic, 7000);

