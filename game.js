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
        this.passiveItems = [];
        this.stats = {
            damage: 1,
            speed: 1,
            maxHealth: 100,
            regeneration: 0,
            pickupRange: 50,
            armor: 0,
            critChance: 0,
            critDamage: 1.5,
            xpMultiplier: 1
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
        const actualDamage = amount * (1 - this.stats.armor);
        this.health -= actualDamage;
        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }
        return false;
    }

    gainXP(amount) {
        this.xp += Math.floor(amount * this.stats.xpMultiplier);
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
        this.shootTimer = 0;
        this.teleportTimer = 0;
        this.healTimer = 0;

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
        } else if (type === 'boss') {
            this.radius = 35;
            this.speed = 0.5;
            this.health = 100;
            this.maxHealth = 100;
            this.damage = 20;
            this.xpValue = 50;
            this.color = '#8b0000';
            this.isBoss = true;
        } else if (type === 'shooter') {
            this.radius = 13;
            this.speed = 1.2;
            this.health = 4;
            this.maxHealth = 4;
            this.damage = 4;
            this.xpValue = 3;
            this.color = '#ff6347';
            this.shootCooldown = 3000;
            this.keepDistance = 200;
        } else if (type === 'explosive') {
            this.radius = 11;
            this.speed = 2.0;
            this.health = 3;
            this.maxHealth = 3;
            this.damage = 8;
            this.xpValue = 3;
            this.color = '#ff8c00';
            this.explosionRadius = 80;
            this.explosionDamage = 15;
        } else if (type === 'splitter') {
            this.radius = 14;
            this.speed = 1.3;
            this.health = 5;
            this.maxHealth = 5;
            this.damage = 6;
            this.xpValue = 4;
            this.color = '#9d4edd';
            this.splitCount = 3;
        } else if (type === 'mini') {
            this.radius = 8;
            this.speed = 2.2;
            this.health = 1;
            this.maxHealth = 1;
            this.damage = 3;
            this.xpValue = 1;
            this.color = '#c77dff';
            this.isMini = true;
        } else if (type === 'healer') {
            this.radius = 13;
            this.speed = 1.0;
            this.health = 6;
            this.maxHealth = 6;
            this.damage = 4;
            this.xpValue = 5;
            this.color = '#06ffa5';
            this.healCooldown = 4000;
            this.healAmount = 2;
            this.healRange = 150;
        } else if (type === 'teleporter') {
            this.radius = 12;
            this.speed = 1.8;
            this.health = 4;
            this.maxHealth = 4;
            this.damage = 6;
            this.xpValue = 4;
            this.color = '#a78bfa';
            this.teleportCooldown = 5000;
            this.teleportRange = 250;
        }
    }

    update(player, deltaTime, game) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Type-specific behavior
        if (this.type === 'shooter') {
            // Keep distance from player and shoot
            this.shootTimer += deltaTime;

            if (dist < this.keepDistance) {
                // Move away from player
                this.x -= (dx / dist) * this.speed;
                this.y -= (dy / dist) * this.speed;
            } else if (dist > this.keepDistance + 50) {
                // Move towards player
                this.x += (dx / dist) * this.speed * 0.5;
                this.y += (dy / dist) * this.speed * 0.5;
            }

            if (this.shootTimer >= this.shootCooldown && game) {
                this.shootAtPlayer(player, game);
                this.shootTimer = 0;
            }
        } else if (this.type === 'healer') {
            // Stay back and heal nearby enemies
            this.healTimer += deltaTime;

            if (dist > 100) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }

            if (this.healTimer >= this.healCooldown && game) {
                this.healNearbyEnemies(game.enemies);
                this.healTimer = 0;
            }
        } else if (this.type === 'teleporter') {
            // Teleport closer to player periodically
            this.teleportTimer += deltaTime;

            if (dist > 50) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }

            if (this.teleportTimer >= this.teleportCooldown && dist > this.teleportRange) {
                this.teleportTowardsPlayer(player);
                this.teleportTimer = 0;
            }
        } else {
            // Normal movement towards player
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
    }

    shootAtPlayer(player, game) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const projectile = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            radius: 6,
            damage: this.damage,
            isEnemyProjectile: true,
            color: '#ff6347',
            age: 0,
            lifetime: 5000,
            update: function(deltaTime) {
                this.x += this.vx;
                this.y += this.vy;
                this.age += deltaTime;
                return this.age < this.lifetime &&
                       this.x > 0 && this.x < GAME_WIDTH &&
                       this.y > 0 && this.y < GAME_HEIGHT;
            },
            draw: function() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };
        game.enemyProjectiles.push(projectile);
    }

    healNearbyEnemies(enemies) {
        enemies.forEach(enemy => {
            if (enemy === this) return;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.healRange) {
                enemy.health = Math.min(enemy.maxHealth, enemy.health + this.healAmount);
            }
        });
    }

    teleportTowardsPlayer(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const teleportDistance = 150;

        this.x += Math.cos(angle) * teleportDistance;
        this.y += Math.sin(angle) * teleportDistance;

        // Keep in bounds
        this.x = Math.max(this.radius, Math.min(GAME_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME_HEIGHT - this.radius, this.y));
    }

    draw() {
        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Special visuals for different types
        if (this.type === 'boss') {
            // Boss glow effect
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Boss crown
            ctx.fillStyle = '#ffd700';
            ctx.font = '30px Arial';
            ctx.fillText('👑', this.x - 15, this.y - this.radius - 10);
        } else if (this.type === 'explosive') {
            // Pulsing effect
            const pulseSize = Math.sin(Date.now() * 0.005) * 2;
            ctx.strokeStyle = '#ff4500';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'healer') {
            // Plus sign
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - 5, this.y);
            ctx.lineTo(this.x + 5, this.y);
            ctx.moveTo(this.x, this.y - 5);
            ctx.lineTo(this.x, this.y + 5);
            ctx.stroke();
        } else if (this.type === 'teleporter') {
            // Sparkle effect
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 4; i++) {
                const angle = (Date.now() * 0.002 + i * Math.PI / 2);
                const x = this.x + Math.cos(angle) * (this.radius + 5);
                const y = this.y + Math.sin(angle) * (this.radius + 5);
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'shooter') {
            // Crosshair
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y);
            ctx.lineTo(this.x + 8, this.y);
            ctx.moveTo(this.x, this.y - 8);
            ctx.lineTo(this.x, this.y + 8);
            ctx.stroke();
        }

        // Draw health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = this.isBoss ? 6 : 4;
            const barY = this.y - this.radius - (this.isBoss ? 15 : 8);

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

            ctx.fillStyle = this.isBoss ? '#ff0000' : '#38d9a9';
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
    constructor(player, name, damage, cooldown, icon = '⚔️') {
        this.player = player;
        this.name = name;
        this.damage = damage;
        this.cooldown = cooldown;
        this.timer = 0;
        this.level = 1;
        this.icon = icon;
    }

    update(deltaTime, enemies, projectiles, game) {
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.attack(enemies, projectiles, game);
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
        super(player, '마법 미사일', 5, 1000, '🔮');
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
        super(player, '화염구', 8, 2000, '🔥');
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
        super(player, '번개', 12, 3000, '⚡');
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

// Holy Water weapon
class HolyWater extends Weapon {
    constructor(player) {
        super(player, '성수', 6, 2500, '💧');
        this.poolDuration = 3000;
        this.poolRadius = 60;
    }

    attack(enemies, projectiles) {
        if (enemies.length === 0) return;

        const target = enemies[Math.floor(Math.random() * Math.min(5, enemies.length))];

        const pool = {
            x: target.x,
            y: target.y,
            radius: this.poolRadius,
            damage: this.damage * this.player.stats.damage,
            duration: this.poolDuration,
            age: 0,
            isHolyWater: true,
            color: '#22b8cf'
        };

        projectiles.push(pool);
    }

    upgrade() {
        super.upgrade();
        this.poolRadius += 10;
        this.poolDuration += 500;
    }
}

// Garlic Aura weapon
class GarlicAura extends Weapon {
    constructor(player) {
        super(player, '마늘 오라', 3, 500, '🧄');
        this.radius = 80;
        this.rotation = 0;
    }

    update(deltaTime, enemies, projectiles, game) {
        this.rotation += deltaTime * 0.002;
        this.timer -= deltaTime;

        if (this.timer <= 0) {
            this.attack(enemies, projectiles, game);
            this.timer = this.cooldown;
        }
    }

    attack(enemies, projectiles, game) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.radius + enemy.radius) {
                const died = enemy.takeDamage(this.damage * this.player.stats.damage * 0.016);
                if (died && game) {
                    game.handleEnemyDeath(enemy);
                    enemies.splice(i, 1);
                }
            }
        }
    }

    draw() {
        ctx.strokeStyle = 'rgba(250, 250, 250, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw garlic symbols
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.rotation;
            const x = this.player.x + Math.cos(angle) * this.radius;
            const y = this.player.y + Math.sin(angle) * this.radius;

            ctx.fillStyle = '#f8f9fa';
            ctx.font = '20px Arial';
            ctx.fillText('🧄', x - 10, y + 7);
        }
    }

    upgrade() {
        super.upgrade();
        this.radius += 15;
    }
}

// Boomerang weapon
class Boomerang extends Weapon {
    constructor(player) {
        super(player, '부메랑', 7, 1500, '🪃');
        this.count = 1;
    }

    attack(enemies, projectiles) {
        for (let i = 0; i < this.count; i++) {
            const angle = (i / this.count) * Math.PI * 2;
            const boomerang = {
                x: this.player.x,
                y: this.player.y,
                angle: angle,
                distance: 0,
                maxDistance: 200,
                returning: false,
                speed: 5,
                damage: this.damage * this.player.stats.damage,
                radius: 10,
                isBoomerang: true,
                color: '#fab005',
                rotation: 0,
                player: this.player
            };
            projectiles.push(boomerang);
        }
    }

    upgrade() {
        super.upgrade();
        if (this.level % 3 === 0) {
            this.count++;
        }
    }
}

// Laser weapon
class Laser extends Weapon {
    constructor(player) {
        super(player, '레이저', 15, 3500, '🔫');
        this.width = 20;
        this.length = 600;
    }

    attack(enemies, projectiles) {
        if (enemies.length === 0) return;

        const target = enemies[0];
        const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);

        const laser = {
            x: this.player.x,
            y: this.player.y,
            angle: angle,
            width: this.width,
            length: this.length,
            damage: this.damage * this.player.stats.damage,
            duration: 500,
            age: 0,
            isLaser: true,
            color: '#ff6b6b',
            hitEnemies: new Set()
        };

        projectiles.push(laser);
    }

    upgrade() {
        super.upgrade();
        this.width += 5;
        this.length += 50;
    }
}

// Axe weapon
class Axe extends Weapon {
    constructor(player) {
        super(player, '도끼', 10, 1200, '🪓');
        this.count = 1;
        this.orbitRadius = 80;
    }

    attack(enemies, projectiles, game) {
        // Axes orbit around player continuously
    }

    update(deltaTime, enemies, projectiles, game) {
        // Create orbiting axes if they don't exist
        const existingAxes = projectiles.filter(p => p.isAxe && p.weaponId === this);

        if (existingAxes.length < this.count) {
            for (let i = existingAxes.length; i < this.count; i++) {
                const axe = {
                    angle: (i / this.count) * Math.PI * 2,
                    radius: this.orbitRadius,
                    speed: 0.003,
                    damage: this.damage * this.player.stats.damage,
                    size: 15,
                    isAxe: true,
                    weaponId: this,
                    player: this.player,
                    rotation: 0,
                    color: '#868e96',
                    hitCooldown: {},
                    update: function(deltaTime) {
                        this.angle += this.speed * deltaTime;
                        this.rotation += deltaTime * 0.01;
                        this.x = this.player.x + Math.cos(this.angle) * this.radius;
                        this.y = this.player.y + Math.sin(this.angle) * this.radius;
                        return true;
                    },
                    draw: function() {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.fillStyle = this.color;
                        ctx.fillRect(-this.size, -this.size/3, this.size*2, this.size*2/3);
                        ctx.fillRect(-this.size/3, -this.size, this.size*2/3, this.size*2);
                        ctx.restore();
                    }
                };
                axe.x = this.player.x;
                axe.y = this.player.y;
                projectiles.push(axe);
            }
        }
    }

    upgrade() {
        super.upgrade();
        if (this.level % 2 === 0) {
            this.count++;
        }
        this.orbitRadius += 10;
    }
}

// Passive Item base class
class PassiveItem {
    constructor(player, name, description, icon = '📦') {
        this.player = player;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.level = 1;
    }

    apply() {
        // Override in subclasses
    }

    upgrade() {
        this.level++;
        this.apply();
    }
}

// Armor passive item
class Armor extends PassiveItem {
    constructor(player) {
        super(player, '방어구', '받는 데미지 감소', '🛡️');
    }

    apply() {
        this.player.stats.armor = Math.min(0.5, this.level * 0.05);
    }
}

// Wings passive item
class Wings extends PassiveItem {
    constructor(player) {
        super(player, '날개', '이동 속도 증가', '🪽');
    }

    apply() {
        this.player.speed = 3 + (this.level * 0.3);
    }
}

// Spinach passive item
class Spinach extends PassiveItem {
    constructor(player) {
        super(player, '시금치', '공격력 증가', '🥬');
    }

    apply() {
        this.player.stats.damage = 1 + (this.level * 0.15);
    }
}

// Clover passive item
class Clover extends PassiveItem {
    constructor(player) {
        super(player, '클로버', '크리티컬 확률 증가', '🍀');
    }

    apply() {
        this.player.stats.critChance = Math.min(0.5, this.level * 0.08);
    }
}

// Crown passive item
class Crown extends PassiveItem {
    constructor(player) {
        super(player, '왕관', '경험치 획득량 증가', '👑');
    }

    apply() {
        this.player.stats.xpMultiplier = 1 + (this.level * 0.1);
    }
}

// Magnet passive item
class Magnet extends PassiveItem {
    constructor(player) {
        super(player, '자석', '경험치 습득 범위 증가', '🧲');
    }

    apply() {
        this.player.stats.pickupRange = 50 + (this.level * 20);
    }
}

// Game class
class Game {
    constructor() {
        this.player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.experienceGems = [];
        this.keys = {};
        this.gameTime = 0;
        this.killCount = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 1000;
        this.bossSpawnTimer = 0;
        this.bossSpawnInterval = 60000; // Boss every 60 seconds
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
        this.enemyProjectiles = [];
        this.experienceGems = [];
        this.gameTime = 0;
        this.killCount = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.enemySpawnTimer = 0;
        this.bossSpawnTimer = 0;
        this.player.addWeapon(new MagicMissile(this.player));

        document.getElementById('game-over-menu').classList.add('hidden');
        this.start();
    }

    spawnEnemy(forcedType = null) {
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

        let type = forcedType || 'normal';

        if (!forcedType) {
            const rand = Math.random();
            const difficulty = Math.min(this.gameTime / 10000, 3); // Difficulty scales over time

            // More enemy types appear as game progresses
            if (difficulty > 2 && rand > 0.98) {
                type = 'healer';
            } else if (difficulty > 2 && rand > 0.96) {
                type = 'teleporter';
            } else if (difficulty > 1.5 && rand > 0.93) {
                type = 'splitter';
            } else if (difficulty > 1 && rand > 0.89) {
                type = 'explosive';
            } else if (difficulty > 1 && rand > 0.85) {
                type = 'shooter';
            } else if (rand > 0.82) {
                type = 'tank';
            } else if (rand > 0.65) {
                type = 'fast';
            }
        }

        this.enemies.push(new Enemy(x, y, type));
    }

    spawnBoss() {
        // Spawn boss in center-ish area
        const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 200;
        const y = GAME_HEIGHT / 2 + (Math.random() - 0.5) * 200;
        this.enemies.push(new Enemy(x, y, 'boss'));
    }

    handleEnemyDeath(enemy) {
        this.killCount++;
        this.experienceGems.push(new ExperienceGem(enemy.x, enemy.y, enemy.xpValue));

        // Special death effects
        if (enemy.type === 'explosive') {
            // Explosion damages nearby enemies and player
            this.enemies.forEach(e => {
                const dx = e.x - enemy.x;
                const dy = e.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.explosionRadius) {
                    e.takeDamage(enemy.explosionDamage);
                }
            });

            // Check if player is in explosion range
            const pdx = this.player.x - enemy.x;
            const pdy = this.player.y - enemy.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

            if (pdist < enemy.explosionRadius) {
                const died = this.player.takeDamage(enemy.explosionDamage);
                if (died) this.gameOver();
            }
        } else if (enemy.type === 'splitter' && !enemy.isMini) {
            // Spawn mini enemies
            for (let i = 0; i < enemy.splitCount; i++) {
                const angle = (i / enemy.splitCount) * Math.PI * 2;
                const spawnDist = 30;
                const x = enemy.x + Math.cos(angle) * spawnDist;
                const y = enemy.y + Math.sin(angle) * spawnDist;
                this.enemies.push(new Enemy(x, y, 'mini'));
            }
        }
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

        // Spawn boss
        this.bossSpawnTimer += deltaTime;
        if (this.bossSpawnTimer >= this.bossSpawnInterval) {
            this.spawnBoss();
            this.bossSpawnTimer = 0;
        }

        // Update player
        this.player.update(this.keys);

        // Update enemies
        this.enemies.forEach(enemy => enemy.update(this.player, deltaTime, this));

        // Update weapons
        this.player.weapons.forEach(weapon => {
            weapon.update(deltaTime, this.enemies, this.projectiles, this);
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            // Handle different projectile types
            if (proj.isHolyWater) {
                proj.age += deltaTime;
                if (proj.age >= proj.duration) return false;

                // Damage enemies in pool
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    const dx = enemy.x - proj.x;
                    const dy = enemy.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < proj.radius) {
                        const died = enemy.takeDamage(proj.damage * 0.016);
                        if (died) {
                            this.handleEnemyDeath(enemy);
                            this.enemies.splice(i, 1);
                        }
                    }
                }
                return true;
            }

            if (proj.isBoomerang) {
                proj.rotation += deltaTime * 0.01;

                if (!proj.returning) {
                    proj.x += Math.cos(proj.angle) * proj.speed;
                    proj.y += Math.sin(proj.angle) * proj.speed;
                    proj.distance += proj.speed;

                    if (proj.distance >= proj.maxDistance) {
                        proj.returning = true;
                    }
                } else {
                    const dx = proj.player.x - proj.x;
                    const dy = proj.player.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 20) return false;

                    proj.x += (dx / dist) * proj.speed;
                    proj.y += (dy / dist) * proj.speed;
                }

                // Check collision with enemies
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    const dx = proj.x - enemy.x;
                    const dy = proj.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < proj.radius + enemy.radius) {
                        const died = enemy.takeDamage(proj.damage);
                        if (died) {
                            this.handleEnemyDeath(enemy);
                            this.enemies.splice(i, 1);
                        }
                    }
                }
                return true;
            }

            if (proj.isLaser) {
                proj.age += deltaTime;
                if (proj.age >= proj.duration) return false;

                // Check collision with all enemies in laser path
                this.enemies.forEach(enemy => {
                    if (proj.hitEnemies.has(enemy)) return;

                    const endX = proj.x + Math.cos(proj.angle) * proj.length;
                    const endY = proj.y + Math.sin(proj.angle) * proj.length;

                    // Point to line distance
                    const dx = endX - proj.x;
                    const dy = endY - proj.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const dot = ((enemy.x - proj.x) * dx + (enemy.y - proj.y) * dy) / (len * len);

                    if (dot >= 0 && dot <= 1) {
                        const closestX = proj.x + dot * dx;
                        const closestY = proj.y + dot * dy;
                        const dist = Math.sqrt((enemy.x - closestX) ** 2 + (enemy.y - closestY) ** 2);

                        if (dist < proj.width / 2 + enemy.radius) {
                            proj.hitEnemies.add(enemy);
                            const died = enemy.takeDamage(proj.damage);
                            if (died) {
                                this.handleEnemyDeath(enemy);
                                const idx = this.enemies.indexOf(enemy);
                                if (idx > -1) this.enemies.splice(idx, 1);
                            }
                        }
                    }
                });
                return true;
            }

            if (proj.isAxe) {
                if (proj.update) proj.update(deltaTime);

                // Check collision with enemies (with cooldown per enemy)
                this.enemies.forEach(enemy => {
                    const now = Date.now();
                    if (proj.hitCooldown[enemy] && now - proj.hitCooldown[enemy] < 500) return;

                    const dx = proj.x - enemy.x;
                    const dy = proj.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < proj.size + enemy.radius) {
                        proj.hitCooldown[enemy] = now;
                        const died = enemy.takeDamage(proj.damage);
                        if (died) {
                            this.handleEnemyDeath(enemy);
                            const idx = this.enemies.indexOf(enemy);
                            if (idx > -1) this.enemies.splice(idx, 1);
                        }
                    }
                });
                return true;
            }

            // Regular projectiles
            const alive = proj.update ? proj.update(deltaTime) : true;
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
                        this.handleEnemyDeath(enemy);
                        this.enemies.splice(i, 1);
                    }

                    // Fireball explosion
                    if (proj.isFireball) {
                        for (let j = this.enemies.length - 1; j >= 0; j--) {
                            const e = this.enemies[j];
                            const edx = e.x - proj.x;
                            const edy = e.y - proj.y;
                            const edist = Math.sqrt(edx * edx + edy * edy);

                            if (edist < proj.explosionRadius) {
                                const splashDied = e.takeDamage(proj.damage * 0.5);
                                if (splashDied) {
                                    this.handleEnemyDeath(e);
                                    this.enemies.splice(j, 1);
                                }
                            }
                        }
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

        // Update enemy projectiles
        this.enemyProjectiles = this.enemyProjectiles.filter(proj => {
            const alive = proj.update(deltaTime);
            if (!alive) return false;

            // Check collision with player
            const dx = proj.x - this.player.x;
            const dy = proj.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < proj.radius + this.player.radius) {
                const died = this.player.takeDamage(proj.damage);
                if (died) {
                    this.gameOver();
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
        this.projectiles.forEach(proj => {
            if (proj.isHolyWater) {
                // Draw holy water pool
                ctx.fillStyle = `rgba(34, 184, 207, ${0.3 * (1 - proj.age / proj.duration)})`;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = proj.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (proj.isBoomerang) {
                // Draw boomerang
                ctx.save();
                ctx.translate(proj.x, proj.y);
                ctx.rotate(proj.rotation);
                ctx.fillStyle = proj.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, proj.radius * 2, proj.radius, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            } else if (proj.isLaser) {
                // Draw laser beam
                ctx.save();
                ctx.globalAlpha = 0.8 * (1 - proj.age / proj.duration);
                ctx.strokeStyle = proj.color;
                ctx.lineWidth = proj.width;
                ctx.shadowColor = proj.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(proj.x, proj.y);
                const endX = proj.x + Math.cos(proj.angle) * proj.length;
                const endY = proj.y + Math.sin(proj.angle) * proj.length;
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.restore();
            } else if (proj.isAxe) {
                // Draw axe (custom draw function)
                if (proj.draw) proj.draw();
            } else if (proj.draw) {
                // Regular projectile draw
                proj.draw();
            }
        });

        // Draw garlic auras
        this.player.weapons.forEach(weapon => {
            if (weapon instanceof GarlicAura) {
                weapon.draw();
            }
        });

        // Draw enemy projectiles
        this.enemyProjectiles.forEach(proj => {
            if (proj.draw) proj.draw();
        });

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
            const iconHtml = upgrade.icon ? `<span class="upgrade-icon">${upgrade.icon}</span>` : '';
            div.innerHTML = `
                ${iconHtml}
                <div class="upgrade-text">
                    <h3>${upgrade.name}</h3>
                    <p>${upgrade.description}</p>
                </div>
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
                icon: '❤️',
                apply: () => {
                    this.player.maxHealth += 20;
                    this.player.stats.maxHealth += 20;
                    this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
                }
            },
            {
                name: '이동 속도 증가',
                description: '이동 속도가 10% 증가합니다',
                icon: '👟',
                apply: () => {
                    this.player.speed *= 1.1;
                }
            },
            {
                name: '공격력 증가',
                description: '모든 무기의 공격력이 20% 증가합니다',
                icon: '💪',
                apply: () => {
                    this.player.stats.damage *= 1.2;
                }
            },
            {
                name: '체력 재생',
                description: '초당 체력이 1씩 회복됩니다',
                icon: '💚',
                apply: () => {
                    this.player.stats.regeneration += 1;
                }
            },
            {
                name: '경험치 범위 증가',
                description: '경험치 습득 범위가 증가합니다',
                icon: '✨',
                apply: () => {
                    this.player.stats.pickupRange += 30;
                }
            }
        ];

        // Add new weapon options only if player doesn't have them yet
        if (!this.player.weapons.some(w => w instanceof Fireball)) {
            allUpgrades.push({
                name: '화염구',
                description: '폭발하는 화염구를 발사합니다 (새 무기)',
                icon: '🔥',
                apply: () => {
                    this.player.addWeapon(new Fireball(this.player));
                }
            });
        }

        if (!this.player.weapons.some(w => w instanceof Lightning)) {
            allUpgrades.push({
                name: '번개',
                description: '적들을 연쇄 타격하는 번개 공격 (새 무기)',
                icon: '⚡',
                apply: () => {
                    this.player.addWeapon(new Lightning(this.player));
                }
            });
        }

        if (!this.player.weapons.some(w => w instanceof HolyWater)) {
            allUpgrades.push({
                name: '성수',
                description: '땅에 데미지를 주는 성수를 투척합니다 (새 무기)',
                icon: '💧',
                apply: () => {
                    this.player.addWeapon(new HolyWater(this.player));
                }
            });
        }

        if (!this.player.weapons.some(w => w instanceof GarlicAura)) {
            allUpgrades.push({
                name: '마늘 오라',
                description: '주변에 지속 데미지를 주는 마늘 오라 (새 무기)',
                icon: '🧄',
                apply: () => {
                    this.player.addWeapon(new GarlicAura(this.player));
                }
            });
        }

        if (!this.player.weapons.some(w => w instanceof Boomerang)) {
            allUpgrades.push({
                name: '부메랑',
                description: '되돌아오는 부메랑을 발사합니다 (새 무기)',
                icon: '🪃',
                apply: () => {
                    this.player.addWeapon(new Boomerang(this.player));
                }
            });
        }

        if (!this.player.weapons.some(w => w instanceof Laser)) {
            allUpgrades.push({
                name: '레이저',
                description: '관통하는 레이저 빔을 발사합니다 (새 무기)',
                icon: '🔫',
                apply: () => {
                    this.player.addWeapon(new Laser(this.player));
                }
            });
        }

        if (!this.player.weapons.some(w => w instanceof Axe)) {
            allUpgrades.push({
                name: '도끼',
                description: '주변을 회전하는 도끼 (새 무기)',
                icon: '🪓',
                apply: () => {
                    this.player.addWeapon(new Axe(this.player));
                }
            });
        }

        // Add new passive item options only if player doesn't have them yet
        if (!this.player.passiveItems.some(i => i instanceof Armor)) {
            allUpgrades.push({
                name: '방어구',
                description: '받는 데미지 5% 감소',
                icon: '🛡️',
                apply: () => {
                    const item = new Armor(this.player);
                    item.apply();
                    this.player.passiveItems.push(item);
                }
            });
        }

        if (!this.player.passiveItems.some(i => i instanceof Wings)) {
            allUpgrades.push({
                name: '날개',
                description: '이동 속도 대폭 증가',
                icon: '🪽',
                apply: () => {
                    const item = new Wings(this.player);
                    item.apply();
                    this.player.passiveItems.push(item);
                }
            });
        }

        if (!this.player.passiveItems.some(i => i instanceof Spinach)) {
            allUpgrades.push({
                name: '시금치',
                description: '공격력 대폭 증가',
                icon: '🥬',
                apply: () => {
                    const item = new Spinach(this.player);
                    item.apply();
                    this.player.passiveItems.push(item);
                }
            });
        }

        if (!this.player.passiveItems.some(i => i instanceof Clover)) {
            allUpgrades.push({
                name: '클로버',
                description: '크리티컬 확률 8% 증가',
                icon: '🍀',
                apply: () => {
                    const item = new Clover(this.player);
                    item.apply();
                    this.player.passiveItems.push(item);
                }
            });
        }

        if (!this.player.passiveItems.some(i => i instanceof Crown)) {
            allUpgrades.push({
                name: '왕관',
                description: '경험치 획득량 증가',
                icon: '👑',
                apply: () => {
                    const item = new Crown(this.player);
                    item.apply();
                    this.player.passiveItems.push(item);
                }
            });
        }

        if (!this.player.passiveItems.some(i => i instanceof Magnet)) {
            allUpgrades.push({
                name: '자석',
                description: '경험치 습득 범위 대폭 증가',
                icon: '🧲',
                apply: () => {
                    const item = new Magnet(this.player);
                    item.apply();
                    this.player.passiveItems.push(item);
                }
            });
        }

        // Add weapon upgrades for existing weapons
        this.player.weapons.forEach(weapon => {
            allUpgrades.push({
                name: `${weapon.name} 강화`,
                description: `${weapon.name}의 위력을 강화합니다 (레벨 ${weapon.level} → ${weapon.level + 1})`,
                icon: weapon.icon,
                apply: () => {
                    weapon.upgrade();
                }
            });
        });

        // Add passive item upgrades for existing items
        this.player.passiveItems.forEach(item => {
            allUpgrades.push({
                name: `${item.name} 강화`,
                description: `${item.description} 효과 증가 (레벨 ${item.level} → ${item.level + 1})`,
                icon: item.icon,
                apply: () => {
                    item.upgrade();
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
