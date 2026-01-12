// Cosmic Cleaner - Мобильная версия
// Полностью оптимизировано для телефонов

// Основные переменные игры
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameLoop;
let soundEnabled = true;
let vibrationEnabled = true;
let score = 0;
let health = 100;
let timeLeft = 60;
let power = 0;
let level = 1;
let totalCleaned = 0;
let bestScore = 0;

// Игровые объекты
let player = {
    x: 200,
    y: 200,
    width: 40,
    height: 40,
    speed: 4,
    color: '#00ccff',
    isBoosting: false,
    magnetActive: false,
    shieldActive: false,
    shieldTime: 0,
    speedBoostActive: false,
    speedBoostTime: 0
};

// Массивы объектов
let debris = [];
let enemies = [];
let powerups = [];

// Джойстик
let joystick = {
    x: 0,
    y: 0,
    isActive: false,
    baseX: 0,
    baseY: 0,
    maxDistance: 40
};

// Цвета
const colors = {
    space: '#050510',
    player: '#00ccff',
    debris: '#00ff88',
    enemy: '#ff3366',
    powerupSpeed: '#ffaa00',
    powerupMagnet: '#00ccff',
    powerupShield: '#ff00ff',
    text: '#ffffff'
};

// Настройки игры (оптимизированы для мобильных)
const GAME_SETTINGS = {
    DEBRIS_COUNT: 20,
    ENEMY_COUNT: 4,
    POWERUP_COUNT: 3,
    DEBRIS_TO_WIN: 50, // Уменьшено для мобильных
    MAX_HEALTH: 100,
    INITIAL_TIME: 60,
    PLAYER_SPEED: 4,
    BOOST_SPEED: 6,
    MAGNET_RADIUS: 80,
    SHIELD_DURATION: 8,
    ENEMY_SPEED: 1.5,
    POWERUP_DURATION: 10,
    DEBRIS_SIZE: 10,
    ENEMY_SIZE: 25,
    POWERUP_SIZE: 20
};

// Инициализация игры
async function initGame() {
    // Показываем загрузочный экран
    showLoadingScreen();
    
    // Инициализация canvas с задержкой для отображения загрузки
    setTimeout(() => {
        setupCanvas();
        loadGameData();
        setupEventListeners();
        setupJoystick();
        setupOrientationCheck();
        
        // Скрываем загрузочный экран и показываем меню
        setTimeout(() => {
            hideLoadingScreen();
            showMainMenu();
            playBackgroundMusic();
        }, 1500);
    }, 500);
}

// Настройка canvas
function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Автоматическая подстройка размера canvas
    resizeCanvas();
    
    // Обработка изменения размера экрана
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
}

// Изменение размера canvas
function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) return;
    
    const width = gameArea.clientWidth;
    const height = gameArea.clientHeight;
    
    // Устанавливаем размеры canvas
    canvas.width = width;
    canvas.height = height;
    
    // Обновляем позицию игрока
    if (gameRunning) {
        player.x = Math.min(player.x, canvas.width - player.width/2);
        player.y = Math.min(player.y, canvas.height - player.height/2);
    } else {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
    }
    
    // Перерисовываем игру, если она запущена
    if (gameRunning && !gamePaused) {
        drawGame();
    }
}

// Загрузка сохраненных данных
function loadGameData() {
    try {
        const savedBestScore = localStorage.getItem('cosmicCleanerBestScore');
        const savedTotalCleaned = localStorage.getItem('cosmicCleanerTotalCleaned');
        const savedSoundSetting = localStorage.getItem('cosmicCleanerSound');
        const savedVibrationSetting = localStorage.getItem('cosmicCleanerVibration');
        
        if (savedBestScore) bestScore = parseInt(savedBestScore);
        if (savedTotalCleaned) totalCleaned = parseInt(savedTotalCleaned);
        if (savedSoundSetting) soundEnabled = savedSoundSetting === 'true';
        if (savedVibrationSetting) vibrationEnabled = savedVibrationSetting === 'true';
        
        updateStatsDisplay();
    } catch (e) {
        console.log('Ошибка загрузки данных:', e);
    }
}

// Сохранение данных
function saveGameData() {
    try {
        localStorage.setItem('cosmicCleanerBestScore', bestScore.toString());
        localStorage.setItem('cosmicCleanerTotalCleaned', totalCleaned.toString());
        localStorage.setItem('cosmicCleanerSound', soundEnabled.toString());
        localStorage.setItem('cosmicCleanerVibration', vibrationEnabled.toString());
    } catch (e) {
        console.log('Ошибка сохранения данных:', e);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки меню
    document.getElementById('startGame').addEventListener('click', startGame);
    document.getElementById('continueGame').addEventListener('click', continueGame);
    document.getElementById('howToPlay').addEventListener('click', showTutorial);
    document.getElementById('highScoresBtn').addEventListener('click', showHighScores);
    document.getElementById('toggleSound').addEventListener('click', toggleSound);
    
    // Игровые кнопки
    document.getElementById('boostBtn').addEventListener('touchstart', activateBoost);
    document.getElementById('boostBtn').addEventListener('touchend', deactivateBoost);
    document.getElementById('magnetBtn').addEventListener('click', activateMagnet);
    document.getElementById('shieldBtn').addEventListener('click', activateShield);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    // Кнопки паузы
    document.getElementById('resumeGame').addEventListener('click', togglePause);
    document.getElementById('restartGame').addEventListener('click', restartGame);
    document.getElementById('quitToMenu').addEventListener('click', quitToMenu);
    
    // Кнопки Game Over
    document.getElementById('restartAfterGameOver').addEventListener('click', restartGame);
    document.getElementById('menuAfterGameOver').addEventListener('click', quitToMenu);
    document.getElementById('shareResult').addEventListener('click', shareResult);
    
    // Кнопки победы
    document.getElementById('nextLevel').addEventListener('click', nextLevel);
    document.getElementById('menuAfterVictory').addEventListener('click', quitToMenu);
    
    // Кнопки обучения
    document.getElementById('prevSlide').addEventListener('click', prevSlide);
    document.getElementById('nextSlide').addEventListener('click', nextSlide);
    document.getElementById('skipTutorial').addEventListener('click', skipTutorial);
    
    // Кнопки рекордов
    document.getElementById('backFromScores').addEventListener('click', backToMenu);
    
    // Точки в обучении
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const slideNum = parseInt(e.target.dataset.slide);
            showSlide(slideNum);
        });
    });
    
    // Предотвращение контекстного меню на canvas
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Обработка свайпов для обучения
    let touchStartX = 0;
    const tutorialSlider = document.querySelector('.tutorial-slider');
    
    if (tutorialSlider) {
        tutorialSlider.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        tutorialSlider.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        });
    }
}

// Настройка джойстика
function setupJoystick() {
    const joystickBase = document.getElementById('joystickBase');
    const joystickElement = document.getElementById('joystick');
    
    // Получаем позицию основания джойстика
    const updateJoystickBasePosition = () => {
        const rect = joystickBase.getBoundingClientRect();
        joystick.baseX = rect.left + rect.width / 2;
        joystick.baseY = rect.top + rect.height / 2;
    };
    
    // Обновляем позицию при загрузке и изменении размера
    updateJoystickBasePosition();
    window.addEventListener('resize', updateJoystickBasePosition);
    window.addEventListener('orientationchange', updateJoystickBasePosition);
    
    // Обработка касаний джойстика
    joystickElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystick.isActive = true;
        playSound('clickSound');
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!joystick.isActive || gamePaused || !gameRunning) return;
        
        e.preventDefault();
        
        // Находим касание в пределах джойстика
        const touch = Array.from(e.touches).find(t => {
            const element = document.elementFromPoint(t.clientX, t.clientY);
            return element && (element === joystickElement || element.closest('#joystick'));
        });
        
        if (!touch) return;
        
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Вычисляем расстояние от центра
        const deltaX = touchX - joystick.baseX;
        const deltaY = touchY - joystick.baseY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Ограничиваем расстояние
        const limitedDistance = Math.min(distance, joystick.maxDistance);
        
        // Вычисляем ограниченные дельты
        const limitedDeltaX = (deltaX / distance) * limitedDistance;
        const limitedDeltaY = (deltaY / distance) * limitedDistance;
        
        // Обновляем позицию джойстика
        joystick.x = limitedDeltaX / joystick.maxDistance;
        joystick.y = limitedDeltaY / joystick.maxDistance;
        
        // Перемещаем визуальный элемент джойстика
        joystickElement.style.transform = `translate(calc(-50% + ${limitedDeltaX}px), calc(-50% + ${limitedDeltaY}px))`;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!joystick.isActive) return;
        
        // Сбрасываем джойстик
        joystick.isActive = false;
        joystick.x = 0;
        joystick.y = 0;
        joystickElement.style.transform = 'translate(-50%, -50%)';
    });
}

// Проверка ориентации
function setupOrientationCheck() {
    const orientationOverlay = document.getElementById('orientationOverlay');
    
    const checkOrientation = () => {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isPortrait && window.innerWidth <= 768) {
            orientationOverlay.classList.remove('hidden');
        } else {
            orientationOverlay.classList.add('hidden');
        }
    };
    
    // Проверяем при загрузке и изменении размера
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
}

// Загрузочный экран
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.querySelector('.loading-progress');
    
    loadingScreen.classList.remove('hidden');
    
    // Анимация прогресса
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        loadingProgress.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 30);
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').classList.add('hidden');
}

// Главное меню
function showMainMenu() {
    hideAllScreens();
    document.getElementById('mainMenu').classList.remove('hidden');
    
    // Обновляем статистику
    updateStatsDisplay();
    
    // Проверяем, есть ли сохраненная игра
    const continueBtn = document.getElementById('continueGame');
    const hasSave = localStorage.getItem('cosmicCleanerGameState');
    continueBtn.style.display = hasSave ? 'block' : 'none';
}

function updateStatsDisplay() {
    document.getElementById('bestScoreDisplay').textContent = bestScore;
    document.getElementById('totalCleanedDisplay').textContent = totalCleaned;
    
    // Обновляем кнопку звука
    const soundBtn = document.getElementById('toggleSound');
    const icon = soundBtn.querySelector('i');
    icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
}

// Начать новую игру
function startGame() {
    playSound('clickSound');
    
    // Сбрасываем игровые данные
    score = 0;
    health = GAME_SETTINGS.MAX_HEALTH;
    timeLeft = GAME_SETTINGS.INITIAL_TIME;
    power = 0;
    level = 1;
    
    // Инициализируем игровые объекты
    initializeGameObjects();
    
    // Запускаем игру
    startGameLoop();
    
    // Показываем игровой экран
    hideAllScreens();
    document.getElementById('gameScreen').classList.remove('hidden');
    
    // Запускаем таймер
    startTimer();
    
    // Обновляем UI
    updateUI();
}

// Продолжить игру
function continueGame() {
    playSound('clickSound');
    
    try {
        const savedState = localStorage.getItem('cosmicCleanerGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Восстанавливаем состояние
            score = state.score;
            health = state.health;
            timeLeft = state.timeLeft;
            power = state.power;
            level = state.level;
            player.x = state.playerX;
            player.y = state.playerY;
            
            // Восстанавливаем объекты
            debris = state.debris || [];
            enemies = state.enemies || [];
            powerups = state.powerups || [];
            
            // Запускаем игру
            startGameLoop();
            
            // Показываем игровой экран
            hideAllScreens();
            document.getElementById('gameScreen').classList.remove('hidden');
            
            // Запускаем таймер
            startTimer();
            
            // Обновляем UI
            updateUI();
            
            showNotification('Игра восстановлена');
        }
    } catch (e) {
        console.log('Ошибка загрузки сохранения:', e);
        startGame(); // Запускаем новую игру в случае ошибки
    }
}

// Сохранить игру
function saveGameState() {
    if (!gameRunning) return;
    
    try {
        const state = {
            score,
            health,
            timeLeft,
            power,
            level,
            playerX: player.x,
            playerY: player.y,
            debris: debris.filter(d => !d.collected),
            enemies,
            powerups: powerups.filter(p => p.active)
        };
        
        localStorage.setItem('cosmicCleanerGameState', JSON.stringify(state));
    } catch (e) {
        console.log('Ошибка сохранения игры:', e);
    }
}

// Инициализация игровых объектов
function initializeGameObjects() {
    // Очищаем массивы
    debris = [];
    enemies = [];
    powerups = [];
    
    // Создаем мусор
    for (let i = 0; i < GAME_SETTINGS.DEBRIS_COUNT; i++) {
        debris.push(createDebris());
    }
    
    // Создаем врагов
    for (let i = 0; i < GAME_SETTINGS.ENEMY_COUNT; i++) {
        enemies.push(createEnemy());
    }
    
    // Создаем улучшения
    const powerupTypes = ['speed', 'magnet', 'shield'];
    for (let i = 0; i < GAME_SETTINGS.POWERUP_COUNT; i++) {
        powerups.push(createPowerup(powerupTypes[i]));
    }
    
    // Сбрасываем игрока
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = GAME_SETTINGS.PLAYER_SPEED;
    player.isBoosting = false;
    player.magnetActive = false;
    player.shieldActive = false;
    player.shieldTime = 0;
    player.speedBoostActive = false;
    player.speedBoostTime = 0;
}

function createDebris() {
    return {
        x: Math.random() * (canvas.width - 20) + 10,
        y: Math.random() * (canvas.height - 20) + 10,
        size: GAME_SETTINGS.DEBRIS_SIZE,
        color: colors.debris,
        collected: false,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        type: Math.floor(Math.random() * 3) // Разные типы мусора
    };
}

function createEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    switch(side) {
        case 0: // Сверху
            x = Math.random() * canvas.width;
            y = -30;
            vx = (Math.random() - 0.5) * GAME_SETTINGS.ENEMY_SPEED;
            vy = GAME_SETTINGS.ENEMY_SPEED;
            break;
        case 1: // Справа
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            vx = -GAME_SETTINGS.ENEMY_SPEED;
            vy = (Math.random() - 0.5) * GAME_SETTINGS.ENEMY_SPEED;
            break;
        case 2: // Снизу
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            vx = (Math.random() - 0.5) * GAME_SETTINGS.ENEMY_SPEED;
            vy = -GAME_SETTINGS.ENEMY_SPEED;
            break;
        case 3: // Слева
            x = -30;
            y = Math.random() * canvas.height;
            vx = GAME_SETTINGS.ENEMY_SPEED;
            vy = (Math.random() - 0.5) * GAME_SETTINGS.ENEMY_SPEED;
            break;
    }
    
    return {
        x, y,
        size: GAME_SETTINGS.ENEMY_SIZE,
        color: colors.enemy,
        vx, vy,
        type: Math.floor(Math.random() * 3), // Разные типы врагов
        health: 1
    };
}

function createPowerup(type) {
    const colorsMap = {
        speed: colors.powerupSpeed,
        magnet: colors.powerupMagnet,
        shield: colors.powerupShield
    };
    
    const icons = {
        speed: '⚡',
        magnet: '🧲',
        shield: '🛡️'
    };
    
    return {
        x: Math.random() * (canvas.width - 30) + 15,
        y: Math.random() * (canvas.height - 30) + 15,
        size: GAME_SETTINGS.POWERUP_SIZE,
        color: colorsMap[type],
        type: type,
        icon: icons[type],
        active: true,
        rotation: 0
    };
}

// Запуск игрового цикла
function startGameLoop() {
    gameRunning = true;
    gamePaused = false;
    
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    gameLoop = setInterval(() => {
        if (!gamePaused && gameRunning) {
            updateGame();
            drawGame();
        }
    }, 1000 / 60); // 60 FPS
}

// Обновление игровой логики
function updateGame() {
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем врагов
    updateEnemies();
    
    // Обновляем мусор
    updateDebris();
    
    // Обновляем улучшения
    updatePowerups();
    
    // Обновляем таймеры улучшений
    updatePowerupTimers();
    
    // Проверяем столкновения
    checkCollisions();
    
    // Обновляем UI
    updateUI();
    
    // Проверяем условия окончания игры
    checkGameEnd();
}

// Обновление игрока
function updatePlayer() {
    // Рассчитываем скорость
    let speed = player.speed;
    if (player.isBoosting) {
        speed = GAME_SETTINGS.BOOST_SPEED;
    }
    if (player.speedBoostActive) {
        speed *= 1.5;
    }
    
    // Применяем движение от джойстика
    const moveX = joystick.x * speed;
    const moveY = joystick.y * speed;
    
    // Обновляем позицию
    player.x += moveX;
    player.y += moveY;
    
    // Ограничиваем движение в пределах canvas
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}

// Обновление врагов
function updateEnemies() {
    enemies.forEach(enemy => {
        // Обновляем позицию
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // ИИ для следящих врагов
        if (enemy.type === 2) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.vx = (dx / distance) * GAME_SETTINGS.ENEMY_SPEED * 1.2;
                enemy.vy = (dy / distance) * GAME_SETTINGS.ENEMY_SPEED * 1.2;
            }
        }
        
        // Возвращаем врагов на экран, если они вышли
        if (enemy.x < -50 || enemy.x > canvas.width + 50 || 
            enemy.y < -50 || enemy.y > canvas.height + 50) {
            
            // Пересоздаем врага
            const newEnemy = createEnemy();
            enemy.x = newEnemy.x;
            enemy.y = newEnemy.y;
            enemy.vx = newEnemy.vx;
            enemy.vy = newEnemy.vy;
        }
    });
}

// Обновление мусора
function updateDebris() {
    debris.forEach(deb => {
        if (deb.collected) return;
        
        // Вращение
        deb.rotation += deb.rotationSpeed;
        
        // Притяжение магнитом
        if (player.magnetActive && power > 0) {
            const dx = player.x - deb.x;
            const dy = player.y - deb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < GAME_SETTINGS.MAGNET_RADIUS) {
                deb.x += (dx / distance) * 6;
                deb.y += (dy / distance) * 6;
                power -= 0.1; // Тратим энергию на магнит
            }
        }
    });
}

// Обновление улучшений
function updatePowerups() {
    powerups.forEach(powerup => {
        if (!powerup.active) return;
        
        // Вращение
        powerup.rotation += 0.02;
    });
}

// Обновление таймеров улучшений
function updatePowerupTimers() {
    // Таймер щита
    if (player.shieldActive) {
        player.shieldTime -= 1/60;
        if (player.shieldTime <= 0) {
            player.shieldActive = false;
            showNotification('Щит закончился');
        }
    }
    
    // Таймер ускорения
    if (player.speedBoostActive) {
        player.speedBoostTime -= 1/60;
        if (player.speedBoostTime <= 0) {
            player.speedBoostActive = false;
            player.speed = GAME_SETTINGS.PLAYER_SPEED;
            showNotification('Ускорение закончилось');
        }
    }
}

// Проверка столкновений
function checkCollisions() {
    // Столкновения с мусором
    debris.forEach(deb => {
        if (deb.collected) return;
        
        const dx = player.x - deb.x;
        const dy = player.y - deb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width/2 + deb.size/2)) {
            // Собираем мусор
            deb.collected = true;
            score++;
            totalCleaned++;
            power += 2;
            
            playSound('collectSound');
            vibrate(30);
            showNotification('+1 мусор');
            
            // Обновляем лучший результат
            if (score > bestScore) {
                bestScore = score;
                saveGameData();
                showNotification('Новый рекорд!');
            }
            
            // Добавляем новый мусор
            if (debris.filter(d => !d.collected).length < GAME_SETTINGS.DEBRIS_COUNT) {
                debris.push(createDebris());
            }
        }
    });
    
    // Столкновения с врагами
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width/2 + enemy.size/2)) {
            if (!player.shieldActive) {
                // Получаем урон
                health -= 15;
                playSound('hitSound');
                vibrate([100, 50, 100]);
                showNotification('Атакован врагом!', 'danger');
                
                // Отталкиваем игрока
                player.x += (dx / distance) * 30;
                player.y += (dy / distance) * 30;
            }
            
            // Отталкиваем врага
            enemy.x -= (dx / distance) * 40;
            enemy.y -= (dy / distance) * 40;
        }
    });
    
    // Столкновения с улучшениями
    powerups.forEach(powerup => {
        if (!powerup.active) return;
        
        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width/2 + powerup.size/2)) {
            // Активируем улучшение
            powerup.active = false;
            activatePowerup(powerup.type);
            playSound('powerupSound');
            vibrate([50, 30, 50]);
            
            // Показываем сообщение
            const messages = {
                speed: 'Ускорение активировано!',
                magnet: 'Магнит активирован!',
                shield: 'Щит активирован!'
            };
            showNotification(messages[powerup.type]);
            
            // Добавляем новое улучшение через некоторое время
            setTimeout(() => {
                powerups.push(createPowerup(powerup.type));
            }, 10000);
        }
    });
}

// Активация улучшений
function activatePowerup(type) {
    switch(type) {
        case 'speed':
            player.speedBoostActive = true;
            player.speedBoostTime = GAME_SETTINGS.POWERUP_DURATION;
            player.speed = GAME_SETTINGS.PLAYER_SPEED * 1.5;
            break;
            
        case 'magnet':
            player.magnetActive = true;
            setTimeout(() => {
                player.magnetActive = false;
                showNotification('Магнит закончился');
            }, GAME_SETTINGS.POWERUP_DURATION * 1000);
            break;
            
        case 'shield':
            player.shieldActive = true;
            player.shieldTime = GAME_SETTINGS.SHIELD_DURATION;
            break;
    }
}

// Активация ускорения
function activateBoost() {
    if (!gameRunning || gamePaused) return;
    player.isBoosting = true;
    playSound('clickSound');
}

function deactivateBoost() {
    player.isBoosting = false;
}

// Активация магнита
function activateMagnet() {
    if (!gameRunning || gamePaused || power < 10) return;
    
    player.magnetActive = true;
    playSound('clickSound');
    
    // Автоматическое отключение через 3 секунды
    setTimeout(() => {
        player.magnetActive = false;
    }, 3000);
}

// Активация щита
function activateShield() {
    if (!gameRunning || gamePaused || player.shieldActive) return;
    
    player.shieldActive = true;
    player.shieldTime = GAME_SETTINGS.SHIELD_DURATION;
    playSound('clickSound');
    showNotification('Щит активирован');
}

// Отрисовка игры
function drawGame() {
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон
    drawBackground();
    
    // Рисуем мусор
    debris.forEach(deb => {
        if (deb.collected) return;
        drawDebris(deb);
    });
    
    // Рисуем улучшения
    powerups.forEach(powerup => {
        if (!powerup.active) return;
        drawPowerup(powerup);
    });
    
    // Рисуем врагов
    enemies.forEach(enemy => {
        drawEnemy(enemy);
    });
    
    // Рисуем игрока
    drawPlayer();
    
    // Рисуем эффекты
    if (player.magnetActive) {
        drawMagnetEffect();
    }
    
    if (player.shieldActive) {
        drawShieldEffect();
    }
}

function drawBackground() {
    // Темный фон
    ctx.fillStyle = colors.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 17) % canvas.width;
        const y = (i * 13) % canvas.height;
        const size = (i % 2) + 1;
        ctx.fillRect(x, y, size, size);
    }
    
    // Мерцающие звезды
    const time = Date.now() / 1000;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.3 * Math.sin(time * 3)})`;
    for (let i = 0; i < 15; i++) {
        const x = (i * 31) % canvas.width;
        const y = (i * 29) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawDebris(deb) {
    ctx.save();
    ctx.translate(deb.x, deb.y);
    ctx.rotate(deb.rotation);
    
    // Разные формы мусора в зависимости от типа
    switch(deb.type) {
        case 0: // Квадрат
            ctx.fillStyle = deb.color;
            ctx.fillRect(-deb.size/2, -deb.size/2, deb.size, deb.size);
            ctx.fillStyle = '#00cc44';
            ctx.fillRect(-deb.size/4, -deb.size/4, deb.size/2, deb.size/2);
            break;
            
        case 1: // Треугольник
            ctx.fillStyle = deb.color;
            ctx.beginPath();
            ctx.moveTo(0, -deb.size/2);
            ctx.lineTo(deb.size/2, deb.size/2);
            ctx.lineTo(-deb.size/2, deb.size/2);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 2: // Шестеренка
            ctx.fillStyle = deb.color;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const radius = i % 2 === 0 ? deb.size/2 : deb.size/3;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
    }
    
    ctx.restore();
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    // Тело врага
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    
    // Разные враги в зависимости от типа
    switch(enemy.type) {
        case 0: // Квадратный дрон
            ctx.fillRect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size);
            
            // Детали
            ctx.fillStyle = '#ff6699';
            ctx.fillRect(-enemy.size/4, -enemy.size/4, enemy.size/2, enemy.size/2);
            break;
            
        case 1: // Треугольный дрон
            ctx.moveTo(0, -enemy.size/2);
            ctx.lineTo(enemy.size/2, enemy.size/2);
            ctx.lineTo(-enemy.size/2, enemy.size/2);
            ctx.closePath();
            ctx.fill();
            
            // Глаза
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-enemy.size/4, -enemy.size/6, 3, 0, Math.PI * 2);
            ctx.arc(enemy.size/4, -enemy.size/6, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 2: // Следящий дрон (круглый)
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Угрожающие глаза
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-enemy.size/4, 0, 4, 0, Math.PI * 2);
            ctx.arc(enemy.size/4, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Злой рот
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, enemy.size/6, enemy.size/4, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.stroke();
            break;
    }
    
    ctx.restore();
}

function drawPowerup(powerup) {
    ctx.save();
    ctx.translate(powerup.x, powerup.y);
    ctx.rotate(powerup.rotation);
    
    // Внешний круг
    ctx.fillStyle = powerup.color;
    ctx.beginPath();
    ctx.arc(0, 0, powerup.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Внутренний круг
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, powerup.size/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Иконка
    ctx.fillStyle = powerup.color;
    ctx.font = `${powerup.size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.icon, 0, 0);
    
    // Свечение
    ctx.shadowColor = powerup.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, powerup.size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Корпус робота
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    
    // Окно кабины
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.arc(0, 0, player.width/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Детали
    ctx.fillStyle = '#0088cc';
    ctx.fillRect(-player.width/4, -player.height/4, player.width/2, player.height/2);
    
    // Двигатели (если ускоряется)
    if (player.isBoosting || player.speedBoostActive) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-player.width/2 - 5, -player.height/4, 5, player.height/2);
        ctx.fillRect(player.width/2, -player.height/4, 5, player.height/2);
    }
    
    ctx.restore();
}

function drawMagnetEffect() {
    ctx.strokeStyle = 'rgba(0, 204, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, GAME_SETTINGS.MAGNET_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawShieldEffect() {
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width/2 + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Обновление UI
function updateUI() {
    // Обновляем счетчики
    document.getElementById('score').textContent = `${score}/${GAME_SETTINGS.DEBRIS_TO_WIN}`;
    document.getElementById('health').textContent = `${Math.max(0, Math.round(health))}%`;
    document.getElementById('time').textContent = `${Math.max(0, Math.ceil(timeLeft))}с`;
    
    // Обновляем шкалу энергии
    const powerFill = document.getElementById('powerFill');
    const powerPercent = Math.min(100, (power / 50) * 100);
    powerFill.style.width = `${powerPercent}%`;
    
    // Изменяем цвет здоровья в зависимости от значения
    const healthElement = document.getElementById('health');
    if (health > 70) {
        healthElement.style.color = '#00ff88';
    } else if (health > 30) {
        healthElement.style.color = '#ffaa00';
    } else {
        healthElement.style.color = '#ff3366';
        healthElement.classList.add('pulse');
    }
}

// Таймер игры
function startTimer() {
    const timer = setInterval(() => {
        if (!gamePaused && gameRunning) {
            timeLeft -= 1;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                gameOver();
            }
        }
        
        if (!gameRunning) {
            clearInterval(timer);
        }
    }, 1000);
}

// Проверка условий окончания игры
function checkGameEnd() {
    // Проигрыш при нулевом здоровье
    if (health <= 0) {
        gameOver();
        return;
    }
    
    // Победа при сборе достаточного количества мусора
    if (score >= GAME_SETTINGS.DEBRIS_TO_WIN) {
        victory();
        return;
    }
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Обновляем статистику
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalBestScore').textContent = bestScore;
    document.getElementById('finalTotalCleaned').textContent = totalCleaned;
    
    // Сохраняем данные
    saveGameData();
    
    // Показываем экран Game Over
    hideAllScreens();
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // Проигрываем звук
    playSound('hitSound');
    vibrate([200, 100, 200]);
}

// Победа
function victory() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Обновляем статистику
    document.getElementById('victoryScore').textContent = score;
    document.getElementById('victoryHealth').textContent = `${Math.round(health)}%`;
    document.getElementById('victoryTime').textContent = `${GAME_SETTINGS.INITIAL_TIME - timeLeft}с`;
    
    // Сохраняем данные
    saveGameData();
    
    // Показываем экран победы
    hideAllScreens();
    document.getElementById('victoryScreen').classList.remove('hidden');
    
    // Проигрываем звук победы
    playSound('powerupSound');
    vibrate([100, 50, 100, 50, 100]);
}

// Пауза
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    playSound('clickSound');
    
    if (gamePaused) {
        // Сохраняем игру при паузе
        saveGameState();
        
        // Обновляем статистику на экране паузы
        document.getElementById('pauseScore').textContent = score;
        document.getElementById('pauseHealth').textContent = `${Math.round(health)}%`;
        document.getElementById('pauseTime').textContent = `${Math.ceil(timeLeft)}с`;
        
        // Показываем экран паузы
        hideAllScreens();
        document.getElementById('pauseScreen').classList.remove('hidden');
    } else {
        // Возвращаемся к игре
        hideAllScreens();
        document.getElementById('gameScreen').classList.remove('hidden');
    }
}

// Перезапуск игры
function restartGame() {
    playSound('clickSound');
    startGame();
}

// Выход в меню
function quitToMenu() {
    playSound('clickSound');
    gameRunning = false;
    gamePaused = false;
    
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    showMainMenu();
}

// Следующий уровень
function nextLevel() {
    playSound('clickSound');
    level++;
    
    // Увеличиваем сложность
    GAME_SETTINGS.DEBRIS_COUNT += 5;
    GAME_SETTINGS.ENEMY_COUNT += 2;
    GAME_SETTINGS.INITIAL_TIME += 15;
    GAME_SETTINGS.DEBRIS_TO_WIN += 10;
    
    startGame();
}

// Обучение
let currentSlide = 1;
const totalSlides = 4;

function showTutorial() {
    playSound('clickSound');
    hideAllScreens();
    document.getElementById('tutorialScreen').classList.remove('hidden');
    showSlide(1);
}

function showSlide(slideNum) {
    currentSlide = Math.max(1, Math.min(slideNum, totalSlides));
    
    // Обновляем слайды
    document.querySelectorAll('.tutorial-slide').forEach(slide => {
        slide.classList.remove('active');
    });
    document.getElementById(`slide${currentSlide}`).classList.add('active');
    
    // Обновляем точки
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 === currentSlide);
    });
    
    // Обновляем кнопки навигации
    document.getElementById('prevSlide').style.display = currentSlide === 1 ? 'none' : 'flex';
    document.getElementById('nextSlide').style.display = currentSlide === totalSlides ? 'none' : 'flex';
    document.getElementById('skipTutorial').textContent = currentSlide === totalSlides ? 'Закончить' : 'Пропустить';
}

function prevSlide() {
    playSound('clickSound');
    showSlide(currentSlide - 1);
}

function nextSlide() {
    playSound('clickSound');
    if (currentSlide === totalSlides) {
        skipTutorial();
    } else {
        showSlide(currentSlide + 1);
    }
}

function skipTutorial() {
    playSound('clickSound');
    showMainMenu();
}

// Рекорды
function showHighScores() {
    playSound('clickSound');
    hideAllScreens();
    document.getElementById('highScoresScreen').classList.remove('hidden');
    
    // Обновляем личный рекорд
    document.getElementById('personalBestScore').textContent = bestScore;
    
    // Генерируем демо-рекорды
    const scoresList = document.getElementById('highScoresList');
    scoresList.innerHTML = '';
    
    const demoHighScores = [
        { player: "Космонавт", score: 150, date: "15.10.23" },
        { player: "Звездный охотник", score: 120, date: "14.10.23" },
        { player: "Галактический уборщик", score: 95, date: "13.10.23" },
        { player: "Новичок", score: 75, date: "12.10.23" },
        { player: "Испытатель", score: 60, date: "11.10.23" }
    ];
    
    // Добавляем текущий результат, если он есть
    if (bestScore > 0) {
        demoHighScores.push({ player: "Вы", score: bestScore, date: "Сегодня" });
    }
    
    // Сортируем по убыванию
    demoHighScores.sort((a, b) => b.score - a.score);
    
    // Отображаем топ-5
    demoHighScores.slice(0, 5).forEach((scoreData, index) => {
        if (scoreData.player === "Вы") return; // Уже отображаем отдельно
        
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.innerHTML = `
            <div class="score-rank">${index + 1}</div>
            <div class="score-info">
                <span class="score-player">${scoreData.player}</span>
                <span class="score-date">${scoreData.date}</span>
            </div>
            <div class="score-value">${scoreData.score}</div>
        `;
        scoresList.appendChild(scoreItem);
    });
}

function backToMenu() {
    playSound('clickSound');
    showMainMenu();
}

// Управление звуком
function toggleSound() {
    soundEnabled = !soundEnabled;
    saveGameData();
    updateStatsDisplay();
    playSound('clickSound');
    
    if (soundEnabled) {
        playBackgroundMusic();
    } else {
        pauseBackgroundMusic();
    }
}

// Звуковые эффекты
function playSound(soundId) {
    if (!soundEnabled) return;
    
    try {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.volume = 0.5;
            sound.play().catch(e => console.log('Ошибка воспроизведения звука:', e));
        }
    } catch (e) {
        console.log('Ошибка воспроизведения звука:', e);
    }
}

function playBackgroundMusic() {
    if (!soundEnabled) return;
    
    try {
        const bgMusic = document.getElementById('backgroundMusic');
        if (bgMusic) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log('Автовоспроизведение музыки заблокировано'));
        }
    } catch (e) {
        console.log('Ошибка воспроизведения музыки:', e);
    }
}

function pauseBackgroundMusic() {
    const bgMusic = document.getElementById('backgroundMusic');
    if (bgMusic) {
        bgMusic.pause();
    }
}

// Вибрация
function vibrate(pattern) {
    if (!vibrationEnabled || !('vibrate' in navigator)) return;
    
    try {
        navigator.vibrate(pattern);
    } catch (e) {
        console.log('Ошибка вибрации:', e);
    }
}

// Уведомления
function showNotification(text, type = 'info') {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const textElement = notification.querySelector('.notification-text');
    
    // Устанавливаем иконку в зависимости от типа
    let iconClass = '';
    switch(type) {
        case 'danger':
            iconClass = 'fas fa-exclamation-triangle';
            break;
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        default:
            iconClass = 'fas fa-info-circle';
    }
    
    icon.className = `notification-icon ${iconClass}`;
    textElement.textContent = text;
    
    // Показываем уведомление
    notification.classList.remove('hidden');
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Поделиться результатом
function shareResult() {
    const shareText = `Я собрал ${score} единиц космического мусора в игре Cosmic Cleaner! Мой лучший результат: ${bestScore}. Попробуй и ты!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Cosmic Cleaner',
            text: shareText,
            url: window.location.href
        }).catch(e => console.log('Ошибка шаринга:', e));
    } else {
        // Копируем в буфер обмена как fallback
        navigator.clipboard.writeText(shareText + ' ' + window.location.href)
            .then(() => showNotification('Результат скопирован в буфер обмена!'))
            .catch(() => showNotification('Поделитесь результатом вручную'));
    }
}

// Вспомогательные функции
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
}

// Запуск игры при загрузке страницы
window.addEventListener('DOMContentLoaded', initGame);

// Предотвращение поведения по умолчанию для касаний
document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        // Разрешаем касания кнопок
        return;
    }
    
    // Предотвращаем масштабирование и выделение
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Сохранение состояния игры при закрытии
window.addEventListener('beforeunload', () => {
    if (gameRunning && !gamePaused) {
        saveGameState();
    }
});