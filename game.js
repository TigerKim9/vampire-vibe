// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1200;
canvas.height = 800;

// Game constants
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 3;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 10;
        this.weapons = [];
        this.stats = {
            damage: 1,
            speed: 1,
            maxHealth: 100,
            regeneration: 0,
            pickupRange: 50
        };
    }

    update(keys) {
        // Movement
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Update position with boundary checking
        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Keep player in bounds
        this.x = Math.max(this.radius, Math.min(GAME_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME_HEIGHT - this.radius, this.y));

        // Health regeneration
        if (this.stats.regeneration > 0) {
            this.health = Math.min(this.maxHealth, this.health + this.stats.regeneration * 0.016);
        }
    }

    draw() {
        // Draw player circle
        ctx.fillStyle = '#4dabf7';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw player outline
        ctx.strokeStyle = '#1971c2';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw direction indicator
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }
        return false;
    }

    gainXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNext = Math.floor(this.xpToNext * 1.5);
    }

    addWeapon(weapon) {
        this.weapons.push(weapon);
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;

        if (type === 'normal') {
            this.radius = 12;
            this.speed = 1.5;
            this.health = 3;
            this.maxHealth = 3;
            this.damage = 5;
            this.xpValue = 1;
            this.color = '#38d9a9';
        } else if (type === 'fast') {
            this.radius = 10;
            this.speed = 2.5;
            this.health = 2;
            this.maxHealth = 2;
            this.damage = 3;
            this.xpValue = 2;
            this.color = '#ffd43b';
        } else if (type === 'tank') {
            this.radius = 18;
            this.speed = 0.8;
            this.health = 10;
            this.maxHealth = 10;
            this.damage = 10;
            this.xpValue = 5;
            this.color = '#f06595';
        }
    }

    update(player) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const barY = this.y - this.radius - 8;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

            ctx.fillStyle = '#38d9a9';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth * (this.health / this.maxHealth), barHeight);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
}

// Projectile class
class Projectile {
    constructor(x, y, targetX, targetY, damage, speed = 5, color = '#ff6b6b') {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.radius = 5;
        this.color = color;

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
        this.lifetime = 2000; // 2 seconds
        this.age = 0;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.age += deltaTime;

        return this.age < this.lifetime &&
               this.x > 0 && this.x < GAME_WIDTH &&
               this.y > 0 && this.y < GAME_HEIGHT;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Experience Gem class
class ExperienceGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 6;
        this.color = '#4dabf7';
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.stats.pickupRange) {
            const speed = 8;
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1971c2';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Weapon base class
class Weapon {
    constructor(player, name, damage, cooldown) {
        this.player = player;
        this.name = name;
        this.damage = damage;
        this.cooldown = cooldown;
        this.timer = 0;
        this.level = 1;
    }

    update(deltaTime, enemies, projectiles) {
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.attack(enemies, projectiles);
            this.timer = this.cooldown;
        }
    }

    upgrade() {
        this.level++;
        this.damage *= 1.2;
    }
}

// Magic Missile weapon
class MagicMissile extends Weapon {
    constructor(player) {
        super(player, '마법 미사일', 5, 1000);
        this.projectileCount = 1;
    }

    attack(enemies, projectiles) {
        if (enemies.length === 0) return;

        // Find closest enemies
        const targets = enemies
            .map(e => ({
                enemy: e,
                dist: Math.sqrt((e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2)
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, this.projectileCount);

        targets.forEach(target => {
            const proj = new Projectile(
                this.player.x,
                this.player.y,
                target.enemy.x,
                target.enemy.y,
                this.damage * this.player.stats.damage,
                8,
                '#a78bfa'
            );
            projectiles.push(proj);
        });
    }

    upgrade() {
        super.upgrade();
        if (this.level % 2 === 0) {
            this.projectileCount++;
        }
        if (this.level % 3 === 0) {
            this.cooldown *= 0.9;
        }
    }
}

// Fireball weapon
class Fireball extends Weapon {
    constructor(player) {
        super(player, '화염구', 8, 2000);
        this.explosionRadius = 50;
    }

    attack(enemies, projectiles) {
        if (enemies.length === 0) return;

        const target = enemies[0];
        const proj = new Projectile(
            this.player.x,
            this.player.y,
            target.x,
            target.y,
            this.damage * this.player.stats.damage,
            4,
            '#ff6b6b'
        );
        proj.explosionRadius = this.explosionRadius;
        proj.isFireball = true;
        projectiles.push(proj);
    }

    upgrade() {
        super.upgrade();
        this.explosionRadius += 10;
        if (this.level % 2 === 0) {
            this.cooldown *= 0.85;
        }
    }
}

// Lightning weapon
class Lightning extends Weapon {
    constructor(player) {
        super(player, '번개', 12, 3000);
        this.chainCount = 3;
    }

    attack(enemies, projectiles) {
        if (enemies.length === 0) return;

        let targets = [enemies[0]];
        let lastTarget = enemies[0];

        for (let i = 1; i < this.chainCount && i < enemies.length; i++) {
            const nearbyEnemies = enemies.filter(e =>
                !targets.includes(e) &&
                Math.sqrt((e.x - lastTarget.x) ** 2 + (e.y - lastTarget.y) ** 2) < 200
            );

            if (nearbyEnemies.length > 0) {
                lastTarget = nearbyEnemies[0];
                targets.push(lastTarget);
            }
        }

        targets.forEach(enemy => {
            enemy.takeDamage(this.damage * this.player.stats.damage);
        });

        // Visual effect
        this.drawLightning(targets);
    }

    drawLightning(targets) {
        ctx.strokeStyle = '#ffd43b';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd43b';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);

        targets.forEach(target => {
            ctx.lineTo(target.x, target.y);
        });

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    upgrade() {
        super.upgrade();
        if (this.level % 2 === 0) {
            this.chainCount++;
        }
    }
}

// Game class
class Game {
    constructor() {
        this.player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.enemies = [];
        this.projectiles = [];
        this.experienceGems = [];
        this.keys = {};
        this.gameTime = 0;
        this.killCount = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 1000;
        this.lastTime = Date.now();

        this.setupEventListeners();
        this.player.addWeapon(new MagicMissile(this.player));
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('start-menu').classList.add('hidden');
            this.start();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
    }

    start() {
        this.lastTime = Date.now();
        this.gameLoop();
    }

    restart() {
        this.player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.enemies = [];
        this.projectiles = [];
        this.experienceGems = [];
        this.gameTime = 0;
        this.killCount = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.enemySpawnTimer = 0;
        this.player.addWeapon(new MagicMissile(this.player));

        document.getElementById('game-over-menu').classList.add('hidden');
        this.start();
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: // Top
                x = Math.random() * GAME_WIDTH;
                y = -20;
                break;
            case 1: // Right
                x = GAME_WIDTH + 20;
                y = Math.random() * GAME_HEIGHT;
                break;
            case 2: // Bottom
                x = Math.random() * GAME_WIDTH;
                y = GAME_HEIGHT + 20;
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * GAME_HEIGHT;
                break;
        }

        let type = 'normal';
        const rand = Math.random();
        if (rand > 0.85) type = 'tank';
        else if (rand > 0.65) type = 'fast';

        this.enemies.push(new Enemy(x, y, type));
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;

        // Update game time
        this.gameTime += deltaTime;

        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;

            // Increase difficulty over time
            if (this.gameTime > 10000) {
                this.enemySpawnRate = Math.max(300, 1000 - (this.gameTime / 100));
            }
        }

        // Update player
        this.player.update(this.keys);

        // Update enemies
        this.enemies.forEach(enemy => enemy.update(this.player));

        // Update weapons
        this.player.weapons.forEach(weapon => {
            weapon.update(deltaTime, this.enemies, this.projectiles);
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            const alive = proj.update(deltaTime);
            if (!alive) return false;

            // Check collision with enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < proj.radius + enemy.radius) {
                    const died = enemy.takeDamage(proj.damage);

                    if (died) {
                        this.killCount++;
                        this.experienceGems.push(new ExperienceGem(enemy.x, enemy.y, enemy.xpValue));
                        this.enemies.splice(i, 1);
                    }

                    // Fireball explosion
                    if (proj.isFireball) {
                        this.enemies.forEach(e => {
                            const edx = e.x - proj.x;
                            const edy = e.y - proj.y;
                            const edist = Math.sqrt(edx * edx + edy * edy);

                            if (edist < proj.explosionRadius) {
                                const died = e.takeDamage(proj.damage * 0.5);
                                if (died) {
                                    this.killCount++;
                                    this.experienceGems.push(new ExperienceGem(e.x, e.y, e.xpValue));
                                    const idx = this.enemies.indexOf(e);
                                    if (idx > -1) this.enemies.splice(idx, 1);
                                }
                            }
                        });
                    }

                    return false;
                }
            }
            return true;
        });

        // Update experience gems
        this.experienceGems = this.experienceGems.filter(gem => {
            gem.update(this.player);

            const dx = gem.x - this.player.x;
            const dy = gem.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + gem.radius) {
                const leveledUp = this.player.gainXP(gem.value);
                if (leveledUp) {
                    this.showLevelUpMenu();
                }
                return false;
            }
            return true;
        });

        // Check player collision with enemies
        this.enemies.forEach(enemy => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + enemy.radius) {
                const died = this.player.takeDamage(enemy.damage * 0.016); // Damage per frame
                if (died) {
                    this.gameOver();
                }
            }
        });

        this.updateUI();
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw grid
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < GAME_WIDTH; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < GAME_HEIGHT; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }

        // Draw experience gems
        this.experienceGems.forEach(gem => gem.draw());

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw());

        // Draw projectiles
        this.projectiles.forEach(proj => proj.draw());

        // Draw player
        this.player.draw();
    }

    updateUI() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-bar').style.width = healthPercent + '%';
        document.getElementById('health-text').textContent =
            `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        const xpPercent = (this.player.xp / this.player.xpToNext) * 100;
        document.getElementById('xp-bar').style.width = xpPercent + '%';
        document.getElementById('xp-text').textContent =
            `${this.player.xp}/${this.player.xpToNext}`;

        document.getElementById('level-text').textContent = this.player.level;

        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        document.getElementById('time-text').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('kill-text').textContent = this.killCount;
    }

    showLevelUpMenu() {
        this.isPaused = true;

        const upgrades = this.getRandomUpgrades(3);
        const optionsDiv = document.getElementById('upgrade-options');
        optionsDiv.innerHTML = '';

        upgrades.forEach(upgrade => {
            const div = document.createElement('div');
            div.className = 'upgrade-option';
            div.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
            `;
            div.addEventListener('click', () => {
                upgrade.apply();
                document.getElementById('level-up-menu').classList.add('hidden');
                this.isPaused = false;
            });
            optionsDiv.appendChild(div);
        });

        document.getElementById('level-up-menu').classList.remove('hidden');
    }

    getRandomUpgrades(count) {
        const allUpgrades = [
            {
                name: '체력 증가',
                description: '최대 체력이 20 증가합니다',
                apply: () => {
                    this.player.maxHealth += 20;
                    this.player.stats.maxHealth += 20;
                    this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
                }
            },
            {
                name: '이동 속도 증가',
                description: '이동 속도가 10% 증가합니다',
                apply: () => {
                    this.player.speed *= 1.1;
                }
            },
            {
                name: '공격력 증가',
                description: '모든 무기의 공격력이 20% 증가합니다',
                apply: () => {
                    this.player.stats.damage *= 1.2;
                }
            },
            {
                name: '체력 재생',
                description: '초당 체력이 1씩 회복됩니다',
                apply: () => {
                    this.player.stats.regeneration += 1;
                }
            },
            {
                name: '경험치 범위 증가',
                description: '경험치 습득 범위가 증가합니다',
                apply: () => {
                    this.player.stats.pickupRange += 30;
                }
            },
            {
                name: '화염구',
                description: '폭발하는 화염구를 발사합니다 (새 무기)',
                apply: () => {
                    const hasWeapon = this.player.weapons.some(w => w instanceof Fireball);
                    if (hasWeapon) {
                        this.player.weapons.find(w => w instanceof Fireball).upgrade();
                    } else {
                        this.player.addWeapon(new Fireball(this.player));
                    }
                }
            },
            {
                name: '번개',
                description: '적들을 연쇄 타격하는 번개 공격 (새 무기)',
                apply: () => {
                    const hasWeapon = this.player.weapons.some(w => w instanceof Lightning);
                    if (hasWeapon) {
                        this.player.weapons.find(w => w instanceof Lightning).upgrade();
                    } else {
                        this.player.addWeapon(new Lightning(this.player));
                    }
                }
            }
        ];

        // Add weapon upgrades for existing weapons
        this.player.weapons.forEach(weapon => {
            allUpgrades.push({
                name: `${weapon.name} 강화`,
                description: `${weapon.name}의 위력을 강화합니다 (레벨 ${weapon.level} → ${weapon.level + 1})`,
                apply: () => {
                    weapon.upgrade();
                }
            });
        });

        // Shuffle and return
        const shuffled = allUpgrades.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    gameOver() {
        this.isGameOver = true;

        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        document.getElementById('final-time').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-kills').textContent = this.killCount;
        document.getElementById('final-level').textContent = this.player.level;

        document.getElementById('game-over-menu').classList.remove('hidden');
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
const game = new Game();
