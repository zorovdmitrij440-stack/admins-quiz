const tg = window.Telegram.WebApp;
tg.expand(); // Расширяем WebApp на весь экран

// База данных администраторов со скрытыми тегами склонностей
const ADMINS = [
    { name: "Катя", username: "katya_support", avatar: "👩‍💻", tags: ["chill", "introvert", "creative"], desc: "Спокойная, чуткая, любит котиков и рисование. Идеально разберет любой сложный кейс без паники." },
    { name: "Алекс", username: "alex_admin", avatar: "⚡", tags: ["energy", "extrovert", "tech"], desc: "Динамичный, обожает технологии и гаджеты. Отвечает со скоростью света, заряжает позитивом!" },
    { name: "Мария", username: "maria_care", avatar: "🌟", tags: ["empathy", "extrovert", "creative"], desc: "Искренне увлечена психологией и книгами. Выслушает, поддержит и решит проблему с максимальной заботой." },
    { name: "Дмитрий", username: "dima_lead", avatar: "🧠", tags: ["chill", "tech", "rational"], desc: "Рациональный, рассудительный фанат системности и рок-музыки. Порядок — его второе имя." }
];

// 10 "размытых" вопросов (Темперамент, Увлечения, Атмосфера)
const QUESTIONS = [
    { q: "Как проходит твое идеальное утро?", o: [{t:"chill", text:"В тишине с чашкой кофе"}, {t:"energy", text:"С активной тренировки и бодрой музыки"}, {t:"creative", text:"За просмотром красивых артов или сериала"}] },
    { q: "Какое качество в людях ты ценишь больше всего?", o: [{t:"empathy", text:"Умение искренне сопереживать"}, {t:"rational", text:"Холодный ум и пунктуальность"}, {t:"introvert", text:"Уважение к личным границам"}] },
    { q: "Если в чате поддержки назревает конфликт, что должен делать админ?", o: [{t:"chill", text:"Мягко сгладить углы юмором"}, {t:"rational", text:"Четко разложить факты по полочкам"}, {t:"energy", text:"Быстро и напористо перехватить инициативу"}] },
    { q: "Твое отношение к спонтанности?", o: [{t:"energy", text:"Обожаю! Лучшие решения — внезапные"}, {t:"chill", text:"Предпочитаю, когда все идет по плану"}, {t:"creative", text:"Спонтанность хороша, если она вдохновляет"}] },
    { q: "Какая сфера увлечений тебе ближе всего?", o: [{t:"tech", text:"Гаджеты, игры, IT-инновации"}, {t:"creative", text:"Музыка, дизайн, кино"}, {t:"empathy", text:"Психология, саморазвитие, уют"}] },
    { q: "Каким должен быть темп общения с поддержкой?", o: [{t:"energy", text:"Быстрым, короткими емкими фразами"}, {t:"chill", text:"Размеренным, подробным, без спешки"}, {t:"empathy", text:"Тёплым, как дружеский разговор"}] },
    { q: "В какой атмосфере тебе комфортнее работать?", o: [{t:"introvert", text:"В уединении, где никто не отвлекает"}, {t:"extrovert", text:"В шумной команде единомышленников"}, {t:"rational", text:"В строго структурированной системе"}] },
    { q: "Какой суперсилой должен обладать твой идеальный админ?", o: [{t:"empathy", text:"Читать мысли и угадывать настроение"}, {t:"tech", text:"Чинить любой баг силой взгляда"}, {t:"chill", text:"Сохранять абсолютное спокойствие в хаосе"}] },
    { q: "Что выберешь посмотреть вечером?", o: [{t:"creative", text:"Артхаус или запутанный детектив"}, {t:"tech", text:"Научпоп про космос или ИИ"}, {t:"energy", text:"Экшен или крутой спортивный матч"}] },
    { q: "Финальный штрих: возрастные предпочтения кандидата?", o: [{t:"energy", text:"Молодой, на одной волне со мной"}, {t:"rational", text:"Опытный, зрелый специалист"}, {t:"chill", text:"Возраст не важен, главное — вайб"}] }
];

let currentQuestion = 0;
let userScores = {}; // Хранилище баллов по тегам

// Инициализация интерфейса
document.getElementById('start-btn').addEventListener('click', () => switchScreen('welcome-screen', 'quiz-screen', startQuiz));

function switchScreen(from, to, callback) {
    const fromEl = document.getElementById(from);
    const toEl = document.getElementById(to);
    fromEl.style.opacity = 0;
    setTimeout(() => {
        fromEl.style.display = 'none';
        toEl.style.display = 'block';
        setTimeout(() => {
            toEl.style.opacity = 1;
            if (callback) callback();
        }, 50);
    }, 400);
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
    
    // Обновляем точки прогресса
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

    // Считаем пересечение тегов пользователя и админов
    ADMINS.forEach(admin => {
        let score = 0;
        admin.tags.forEach(t => {
            if (userScores[t]) score += userScores[t];
        });

        if (score > maxMatches) {
            maxMatches = score;
            bestAdmin = admin;
        }
    });

    // Расчет процента совместимости (минимум 70%, чтобы исключить уныние)
    const basePercent = 70 + Math.floor((maxMatches / 10) * 29);
    const finalPercent = Math.min(99, basePercent);

    // Если юзер вообще тыкал случайные или пустые комбинации (крайне маловероятно)
    if (maxMatches === 0) {
        document.getElementById('result-title').innerText = "Ой, что-то пошло не так...";
        document.getElementById('match-avatar').innerText = "🚀";
        document.getElementById('match-name').innerText = "Ты — наш уникальный кандидат!";
        document.getElementById('match-percent').innerText = "0%";
        document.getElementById('match-desc').innerText = "Похоже, у нас нет подходящего администратора под такие редкие критерии. Попробуй стать им!";
        
        document.getElementById('action-btn').innerText = "Стать админом";
        document.getElementById('action-btn').onclick = () => {
            tg.openTelegramLink("https://t.me"); // Ссылка на вашего HR
        };
    } else {
        // Успешный мэтч
        document.getElementById('match-avatar').innerText = bestAdmin.avatar;
        document.getElementById('match-name').innerText = bestAdmin.name;
        document.getElementById('match-percent').innerText = `${finalPercent}%`;
        document.getElementById('match-desc').innerText = bestAdmin.desc;

        document.getElementById('action-btn').innerText = `Написать ${bestAdmin.name}`;
        document.getElementById('action-btn').onclick = () => {
            // Передаем данные боту назад или открываем личку напрямую
            tg.openTelegramLink(`https://t.me{bestAdmin.username}`);
        };
    }
}

document.getElementById('close-btn').onclick = () => tg.close();
