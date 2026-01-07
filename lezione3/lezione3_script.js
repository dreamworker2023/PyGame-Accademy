// ============================================
// STATO DEL GIOCO
// ============================================
let score = 1000;
let attempts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
let completed = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false };

// ============================================
// VARIABILI GIOCO (per simulazione)
// ============================================
const CELL_SIZE = 50;
const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,1,0,1],
    [1,1,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
];

let canvas, ctx;
let player_x = 75, player_y = 75;
let ghost_x = 525, ghost_y = 525;
let vel_x = 0, vel_y = 0;
let lives = 3;
let ghostPath = [];
let gameLoop = null;
let keysPressed = {};

// ============================================
// HINT A 3 LIVELLI
// ============================================
const hints = {
    1: {
        level1: "💡 Una matrice è una lista di liste. Ogni riga è circondata da []...",
        level2: "💡 Quasi! Ogni riga: [1,1,1,...]. Servono almeno 3 righe per testare",
        level3: "💡 Esempio: [[1,1,1],[1,0,1],[1,1,1]] crea un bordo con centro vuoto"
    },
    2: {
        level1: "💡 Per dividere usa l'operatore // (divisione intera)...",
        level2: "💡 Quasi! LARGHEZZA // len(maze[0]) - maze[0] è la prima riga",
        level3: "💡 Soluzione: // | 0"
    },
    3: {
        level1: "💡 Per iterare una lista usi range(len(lista))...",
        level2: "💡 Quasi! for row in range(len(maze)) e maze[row] per la riga",
        level3: "💡 Soluzione: range | row | 1 (muro = 1)"
    },
    4: {
        level1: "💡 La funzione per scalare è transform.scale()...",
        level2: "💡 Quasi! scale(img, (nuova_larghezza, nuova_altezza))",
        level3: "💡 Soluzione: scale | CELL_SIZE"
    },
    5: {
        level1: "💡 Per convertire pixel in griglia usi la divisione intera //...",
        level2: "💡 Quasi! grid_x = new_x // CELL_SIZE, poi controlla maze[grid_y][grid_x]",
        level3: "💡 Soluzione: // | grid_y | 0 (0 = cella vuota, OK per muoversi)"
    },
    6: {
        level1: "💡 BFS usa una coda. In Python si chiama deque...",
        level2: "💡 Quasi! from collections import deque, queue = deque([start]), visited = {start}",
        level3: "💡 Soluzione: deque | start | {start} oppure set([start])"
    },
    7: {
        level1: "💡 Per calcolare distanza serve il modulo math con la funzione sqrt...",
        level2: "💡 Quasi! import math, lives = 3, math.sqrt((x1-x2)**2 + (y1-y2)**2)",
        level3: "💡 Soluzione: math | 3 | sqrt"
    },
    8: {
        level1: "💡 Il path[0] è la posizione corrente, path[1] è il prossimo passo...",
        level2: "💡 Quasi! if len(path) > 1, poi next_pos = path[1], poi next_pos[0] = colonna",
        level3: "💡 Soluzione: 1 | 1 | 0 (indice 0 per x/colonna, indice 1 per y/riga)"
    }
};

// ============================================
// FUNZIONI UI
// ============================================
function toggleInfo(id) {
    const content = document.getElementById(id + '-info');
    content.classList.toggle('expanded');
}

function updateProgress() {
    const total = 8;
    const completedCount = Object.values(completed).filter(v => v).length;
    const percentage = (completedCount / total) * 100;
    
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').innerText = `${completedCount}/${total} completati`;
}

function updateScore(amount) {
    score += amount;
    if (score < 0) score = 0;
    
    const display = document.getElementById("scoreDisplay");
    const hud = document.getElementById("hudBox");
    
    display.innerText = score;
    
    if (amount < 0) {
        hud.classList.remove("damage-anim");
        void hud.offsetWidth;
        hud.classList.add("damage-anim");
    }
}

function createConfetti() {
    const colors = ['#9c27b0', '#e1bee7', '#2196f3', '#ff5722', '#4caf50'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `confetti-fall ${2 + Math.random()}s linear forwards`;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

function showHint(level) {
    const hintEl = document.getElementById("h" + level);
    const attemptCount = attempts[level];
    
    let hintText;
    if (attemptCount === 1) {
        hintText = hints[level].level1;
        hintEl.className = "hint-box level1";
    } else if (attemptCount === 2) {
        hintText = hints[level].level2;
        hintEl.className = "hint-box level2";
    } else {
        hintText = hints[level].level3;
        hintEl.className = "hint-box level3";
    }
    
    hintEl.innerText = hintText;
    hintEl.style.display = "block";
    
    setTimeout(() => {
        hintEl.style.display = "none";
    }, 6000);
}

function unlockNextLevel(level) {
    if (level < 8) {
        const nextSection = document.getElementById('section' + (level + 1));
        nextSection.classList.add('unlocked');
        
        setTimeout(() => {
            nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }
}

// ============================================
// PATHFINDING BFS (SIMULAZIONE)
// ============================================
function bfs(maze, start, goal) {
    const queue = [start];
    const visited = new Set();
    visited.add(`${start[0]},${start[1]}`);
    const parent = {};
    
    const directions = [[0,1], [1,0], [0,-1], [-1,0]];
    
    while (queue.length > 0) {
        const current = queue.shift();
        const [cy, cx] = current;
        
        if (cy === goal[0] && cx === goal[1]) {
            const path = [];
            let node = `${goal[0]},${goal[1]}`;
            while (node) {
                const [y, x] = node.split(',').map(Number);
                path.unshift([y, x]);
                node = parent[node];
            }
            return path;
        }
        
        for (const [dy, dx] of directions) {
            const ny = cy + dy;
            const nx = cx + dx;
            const key = `${ny},${nx}`;
            
            if (ny >= 0 && ny < maze.length && 
                nx >= 0 && nx < maze[0].length &&
                maze[ny][nx] === 0 && 
                !visited.has(key)) {
                
                visited.add(key);
                parent[key] = `${cy},${cx}`;
                queue.push([ny, nx]);
            }
        }
    }
    
    return [];
}

// ============================================
// SIMULAZIONE CANVAS
// ============================================
function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    document.getElementById('msg').style.display = 'none';
}

function drawMaze() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let row = 0; row < MAZE.length; row++) {
        for (let col = 0; col < MAZE[row].length; col++) {
            if (MAZE[row][col] === 1) {
                ctx.fillStyle = '#444';
                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#666';
                ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(player_x + CELL_SIZE/2, player_y + CELL_SIZE/2, CELL_SIZE/2 - 2, 0.2, Math.PI * 2 - 0.2);
    ctx.lineTo(player_x + CELL_SIZE/2, player_y + CELL_SIZE/2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player_x + CELL_SIZE/2 + 8, player_y + CELL_SIZE/2 - 8, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawGhost() {
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(ghost_x + CELL_SIZE/2, ghost_y + CELL_SIZE/2 - 5, CELL_SIZE/2 - 5, Math.PI, 0);
    ctx.lineTo(ghost_x + CELL_SIZE - 5, ghost_y + CELL_SIZE);
    ctx.lineTo(ghost_x + CELL_SIZE - 12, ghost_y + CELL_SIZE - 7);
    ctx.lineTo(ghost_x + CELL_SIZE/2, ghost_y + CELL_SIZE);
    ctx.lineTo(ghost_x + 12, ghost_y + CELL_SIZE - 7);
    ctx.lineTo(ghost_x + 5, ghost_y + CELL_SIZE);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(ghost_x + 15, ghost_y + 20, 5, 0, Math.PI * 2);
    ctx.arc(ghost_x + 35, ghost_y + 20, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ghost_x + 15, ghost_y + 20, 3, 0, Math.PI * 2);
    ctx.arc(ghost_x + 35, ghost_y + 20, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawLives() {
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Consolas';
    ctx.fillText(`Vite: ${lives}`, 10, 30);
    
    for (let i = 0; i < lives; i++) {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(80 + i * 30, 25, 10, 0.2, Math.PI * 2 - 0.2);
        ctx.lineTo(80 + i * 30, 25);
        ctx.fill();
    }
}

function updateGame() {
    if (!canvas) return;
    
    let new_x = player_x + vel_x;
    let new_y = player_y + vel_y;
    
    const grid_x = Math.floor(new_x / CELL_SIZE);
    const grid_y = Math.floor(new_y / CELL_SIZE);
    
    if (MAZE[grid_y] && MAZE[grid_y][grid_x] === 0) {
        player_x = new_x;
        player_y = new_y;
    }
    
    player_x = Math.max(0, Math.min(player_x, canvas.width - CELL_SIZE));
    player_y = Math.max(0, Math.min(player_y, canvas.height - CELL_SIZE));
    
    if (completed[6]) {
        const player_grid = [Math.floor(player_y / CELL_SIZE), Math.floor(player_x / CELL_SIZE)];
        const ghost_grid = [Math.floor(ghost_y / CELL_SIZE), Math.floor(ghost_x / CELL_SIZE)];
        
        ghostPath = bfs(MAZE, ghost_grid, player_grid);
        
        if (ghostPath.length > 1) {
            const next = ghostPath[1];
            const target_x = next[1] * CELL_SIZE;
            const target_y = next[0] * CELL_SIZE;
            
            const speed = 2;
            if (ghost_x < target_x) ghost_x += speed;
            else if (ghost_x > target_x) ghost_x -= speed;
            
            if (ghost_y < target_y) ghost_y += speed;
            else if (ghost_y > target_y) ghost_y -= speed;
        }
    }
    
    if (completed[7]) {
        const dist = Math.sqrt((player_x - ghost_x) ** 2 + (player_y - ghost_y) ** 2);
        if (dist < CELL_SIZE) {
            lives--;
            if (lives > 0) {
                player_x = 75;
                player_y = 75;
                ghost_x = 525;
                ghost_y = 525;
            } else {
                alert('Game Over! Ricarica la pagina per riprovare.');
                if (gameLoop) clearInterval(gameLoop);
                return;
            }
        }
    }
    
    drawMaze();
    drawPlayer();
    if (completed[4]) drawGhost();
    if (completed[7]) drawLives();
}

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    
    initCanvas();
    
    document.addEventListener('keydown', (e) => {
        if (keysPressed[e.key]) return;
        keysPressed[e.key] = true;
        
        const speed = 5;
        if (e.key === 'ArrowRight') { vel_x = speed; vel_y = 0; }
        else if (e.key === 'ArrowLeft') { vel_x = -speed; vel_y = 0; }
        else if (e.key === 'ArrowUp') { vel_x = 0; vel_y = -speed; }
        else if (e.key === 'ArrowDown') { vel_x = 0; vel_y = speed; }
    });
    
    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
        
        if (e.key === 'ArrowRight' && vel_x > 0) vel_x = 0;
        else if (e.key === 'ArrowLeft' && vel_x < 0) vel_x = 0;
        else if (e.key === 'ArrowUp' && vel_y < 0) vel_y = 0;
        else if (e.key === 'ArrowDown' && vel_y > 0) vel_y = 0;
    });
    
    gameLoop = setInterval(updateGame, 33);
}

// ============================================
// VERIFICA LIVELLI
// ============================================
function check(level) {
    if (completed[level]) return;

    let ok = false;
    let resultDiv = document.getElementById("r" + level);
    const gameWindow = document.getElementById("gameWindow");
    
    if (level === 1) {
        const input = document.getElementById("l1a").value.trim();
        ok = input.includes('[') && input.includes(']') && 
             (input.match(/\[/g) || []).length >= 3;
        if(ok) {
            document.getElementById("msg").innerText = ">> Matrice labirinto creata!";
        }
    } 
    else if (level === 2) {
        ok = document.getElementById("l2a").value.trim() === "//" && 
             document.getElementById("l2b").value.trim() === "0";
        if(ok) {
            document.getElementById("msg").innerText = ">> Dimensione celle calcolata (50x50 pixel).";
        }
    }
    else if (level === 3) {
        ok = document.getElementById("l3a").value.trim() === "range" && 
             document.getElementById("l3b").value.trim() === "row" &&
             document.getElementById("l3c").value.trim() === "1";
        if(ok) {
            document.getElementById("msg").innerText = ">> Labirinto disegnato! Avvio simulazione...";
            setTimeout(() => {
                if (!canvas) initCanvas();
                drawMaze();
            }, 500);
        }
    }
    else if (level === 4) {
        ok = document.getElementById("l4a").value.trim() === "scale" && 
             document.getElementById("l4b").value.trim() === "CELL_SIZE";
        if(ok) {
            document.getElementById("msg").innerText = ">> Sprite ridimensionati alle celle!";
            gameWindow.classList.add("pulse");
            setTimeout(() => gameWindow.classList.remove("pulse"), 500);
        }
    }
    else if (level === 5) {
        ok = document.getElementById("l5a").value.trim() === "//" &&
             document.getElementById("l5b").value.trim() === "grid_y" &&
             document.getElementById("l5c").value.trim() === "0";
        if(ok) {
            document.getElementById("msg").innerText = ">> Collisioni con muri attive! Usa frecce per muoverti.";
            if (!gameLoop) startGame();
        }
    }
    else if (level === 6) {
        ok = document.getElementById("l6a").value.trim() === "deque" &&
             document.getElementById("l6b").value.trim() === "start" &&
             document.getElementById("l6c").value.trim().includes("set");
        if(ok) {
            document.getElementById("msg").innerText = ">> BFS Pathfinding implementato!";
        }
    }
    else if (level === 7) {
        ok = document.getElementById("l7a").value.trim() === "math" &&
             document.getElementById("l7b").value.trim() === "3" &&
             document.getElementById("l7c").value.trim() === "sqrt";
        if(ok) {
            document.getElementById("msg").innerText = ">> Sistema vite attivo (3 vite)!";
            lives = 3;
        }
    }
    else if (level === 8) {
        ok = document.getElementById("l8a").value.trim() === "1" &&
             document.getElementById("l8b").value.trim() === "1" &&
             document.getElementById("l8c").value.trim() === "0";
        if(ok) {
            document.getElementById("msg").innerText = ">> IA attiva! Il fantasma ti insegue! 👻";
        }
    }

    if (ok) {
        resultDiv.innerHTML = "✅ LIVELLO COMPLETATO";
        resultDiv.className = "result ok";
        completed[level] = true;
        document.getElementById("btn" + level).disabled = true;
        document.getElementById("h" + level).style.display = "none";
        
        const badge = document.getElementById("badge" + level);
        badge.innerText = "✅";
        badge.classList.add("completed");
        
        createConfetti();
        updateProgress();
        unlockNextLevel(level);
        
        checkAllCompleted();
    } else {
        updateScore(-50);
        attempts[level]++;
        
        if (attempts[level] <= 3) {
            resultDiv.innerHTML = `❌ ERRORE (-50 pt). Suggerimento dopo ${4 - attempts[level]} tentativi.`;
            showHint(level);
        } else {
            resultDiv.innerHTML = `❌ ERRORE (-50 pt). Controlla il suggerimento!`;
            showHint(level);
        }
        resultDiv.className = "result no";
    }
}

// ============================================
// COMPLETAMENTO E CODICE FINALE
// ============================================
function checkAllCompleted() {
    const allCompleted = Object.values(completed).every(status => status === true);
    
    if (allCompleted) {
        document.getElementById("finalCodeSection").style.display = 'block';
        generatePythonCode();
        
        // ===== SALVATAGGIO COMPLETAMENTO =====
        const LESSON_ID = 3;
        const completionData = {
            lessonId: LESSON_ID,
            score: score,
            attempts: Object.values(attempts).reduce((sum, val) => sum + val, 0),
            completedAt: new Date().toISOString()
        };
        
        sessionStorage.setItem('lesson_completion', JSON.stringify(completionData));
        
        setTimeout(() => {
            const goBack = confirm(
                `🎉 Incredibile! Hai completato la Lezione 3!\n\n` +
                `🏆 Punteggio finale: ${score}/1000\n\n` +
                `Hai creato un gioco con IA, pathfinding e sistema vite!\n\n` +
                `Clicca OK per tornare al portale.`
            );
            
            if (goBack) {
                window.location.href = '../index.html';
            }
        }, 1000);
        
        setTimeout(() => {
            document.getElementById("finalCodeSection").scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    }
}

function generatePythonCode() {
    // ===== QUI VA IL CODICE PYTHON COMPLETO =====
    const code = `# PyGame Academy - Lezione 3: Labirinto, IA e Sistema Vite
# Un gioco completo con intelligenza artificiale!

import pygame
import math
from collections import deque

# 1. Inizializzazione
pygame.init()
clock = pygame.time.Clock()

# 2. Setup Finestra
LARGHEZZA = 600
ALTEZZA = 600
screen = pygame.display.set_mode((LARGHEZZA, ALTEZZA))
pygame.display.set_caption("Pac-Man Maze - Lezione 3")

# 3. Colori
NERO = (0, 0, 0)
GRIGIO = (68, 68, 68)
GIALLO = (255, 255, 0)
BLU_GHOST = (0, 191, 255)
BIANCO = (255, 255, 255)

# LIVELLO 1: Matrice Labirinto (0=vuoto, 1=muro)
maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,1,0,1],
    [1,1,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
]

# LIVELLO 2: Dimensione Celle
CELL_SIZE = LARGHEZZA // len(maze[0])

# 4. Caricamento Sprite (se non hai le immagini, usa forme geometriche)
try:
    pacman_img = pygame.image.load("pacman1.png")
    ghost_img = pygame.image.load("ghost_blue.png")
    
    # LIVELLO 4: Ridimensionare Sprite
    pacman_scaled = pygame.transform.scale(pacman_img, (CELL_SIZE, CELL_SIZE))
    ghost_scaled = pygame.transform.scale(ghost_img, (CELL_SIZE, CELL_SIZE))
    USE_IMAGES = True
except:
    print("Immagini non trovate, uso forme geometriche")
    USE_IMAGES = False

# LIVELLO 7: Sistema Vite
lives = 3

# Posizioni iniziali (in pixel)
player_x = CELL_SIZE * 1
player_y = CELL_SIZE * 1
ghost_x = CELL_SIZE * 10
ghost_y = CELL_SIZE * 10

vel_x = 0
vel_y = 0
VELOCITA = 5

ghost_speed = 2
ghost_path = []

# Timer per respawn
respawn_timer = 0
invincible = False


# LIVELLO 6: BFS Pathfinding
def bfs_pathfinding(maze, start, goal):
    """
    Trova il percorso più breve da start a goal usando BFS
    start e goal sono tuple (row, col)
    Restituisce una lista di tuple [(row, col), ...]
    """
    queue = deque([start])
    visited = {start}
    parent = {}
    
    # Direzioni: destra, giù, sinistra, su
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    
    while queue:
        current = queue.popleft()
        
        # Trovato il goal!
        if current == goal:
            # Ricostruisci il percorso
            path = []
            node = goal
            while node in parent:
                path.append(node)
                node = parent[node]
            path.append(start)
            path.reverse()
            return path
        
        cy, cx = current
        
        # Esplora i vicini
        for dy, dx in directions:
            ny, nx = cy + dy, cx + dx
            neighbor = (ny, nx)
            
            # Controlla se è una cella valida
            if (0 <= ny < len(maze) and 
                0 <= nx < len(maze[0]) and
                maze[ny][nx] == 0 and 
                neighbor not in visited):
                
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)
    
    # Nessun percorso trovato
    return []


def draw_pacman(surface, x, y, size):
    """Disegna Pac-Man come forma geometrica"""
    center_x = x + size // 2
    center_y = y + size // 2
    radius = size // 2 - 2
    
    # Corpo giallo
    pygame.draw.circle(surface, GIALLO, (center_x, center_y), radius)
    
    # Bocca (triangolo nero per "tagliare" il cerchio)
    mouth_points = [
        (center_x, center_y),
        (center_x + radius, center_y - radius // 3),
        (center_x + radius, center_y + radius // 3)
    ]
    pygame.draw.polygon(surface, NERO, mouth_points)
    
    # Occhio
    eye_x = center_x + radius // 3
    eye_y = center_y - radius // 3
    pygame.draw.circle(surface, NERO, (eye_x, eye_y), 3)


def draw_ghost(surface, x, y, size):
    """Disegna il fantasma come forma geometrica"""
    center_x = x + size // 2
    center_y = y + size // 2
    
    # Corpo (semicerchio + rettangolo + onde)
    body_rect = pygame.Rect(x + 5, center_y, size - 10, size // 2)
    pygame.draw.rect(surface, BLU_GHOST, body_rect)
    pygame.draw.circle(surface, BLU_GHOST, (center_x, center_y), size // 2 - 5)
    
    # Onde in basso (triangoli)
    wave_width = (size - 10) // 3
    for i in range(3):
        wave_x = x + 5 + i * wave_width
        points = [
            (wave_x, y + size),
            (wave_x + wave_width // 2, y + size - 7),
            (wave_x + wave_width, y + size)
        ]
        pygame.draw.polygon(surface, BLU_GHOST, points)
    
    # Occhi bianchi
    eye_size = 5
    left_eye = (center_x - 10, center_y - 5)
    right_eye = (center_x + 10, center_y - 5)
    pygame.draw.circle(surface, BIANCO, left_eye, eye_size)
    pygame.draw.circle(surface, BIANCO, right_eye, eye_size)
    
    # Pupille nere
    pygame.draw.circle(surface, NERO, left_eye, 3)
    pygame.draw.circle(surface, NERO, right_eye, 3)


# Font per testo
font = pygame.font.Font(None, 36)
small_font = pygame.font.Font(None, 24)

# Loop di gioco
running = True
game_over = False

while running:
    
    # Gestione eventi
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        if event.type == pygame.KEYDOWN:
            if not game_over:
                if event.key == pygame.K_RIGHT:
                    vel_x = VELOCITA
                    vel_y = 0
                elif event.key == pygame.K_LEFT:
                    vel_x = -VELOCITA
                    vel_y = 0
                elif event.key == pygame.K_UP:
                    vel_x = 0
                    vel_y = -VELOCITA
                elif event.key == pygame.K_DOWN:
                    vel_x = 0
                    vel_y = VELOCITA
            
            # Reset con R
            if event.key == pygame.K_r and game_over:
                lives = 3
                player_x = CELL_SIZE * 1
                player_y = CELL_SIZE * 1
                ghost_x = CELL_SIZE * 10
                ghost_y = CELL_SIZE * 10
                vel_x = 0
                vel_y = 0
                game_over = False
                invincible = False
                respawn_timer = 0
        
        if event.type == pygame.KEYUP:
            if event.key == pygame.K_RIGHT and vel_x > 0:
                vel_x = 0
            elif event.key == pygame.K_LEFT and vel_x < 0:
                vel_x = 0
            elif event.key == pygame.K_UP and vel_y < 0:
                vel_y = 0
            elif event.key == pygame.K_DOWN and vel_y > 0:
                vel_y = 0
    
    if not game_over:
        # Gestione invincibilità dopo respawn
        if invincible:
            respawn_timer += 1
            if respawn_timer > 60:  # 1 secondo a 60 FPS
                invincible = False
                respawn_timer = 0
        
        # LIVELLO 5: Movimento con collisione muri
        new_x = player_x + vel_x
        new_y = player_y + vel_y
        
        grid_x = new_x // CELL_SIZE
        grid_y = new_y // CELL_SIZE
        
        # Controlla bordi e muri
        if (0 <= grid_x < len(maze[0]) and 
            0 <= grid_y < len(maze) and
            maze[grid_y][grid_x] == 0):
            player_x = new_x
            player_y = new_y
        
        # LIVELLO 8: Movimento Ghost con pathfinding
        player_grid = (player_y // CELL_SIZE, player_x // CELL_SIZE)
        ghost_grid = (ghost_y // CELL_SIZE, ghost_x // CELL_SIZE)
        
        # Calcola il percorso ogni frame (in un gioco vero lo faresti ogni N frame)
        ghost_path = bfs_pathfinding(maze, ghost_grid, player_grid)
        
        if len(ghost_path) > 1:
            next_pos = ghost_path[1]
            target_x = next_pos[1] * CELL_SIZE
            target_y = next_pos[0] * CELL_SIZE
            
            # Muovi il fantasma verso la prossima cella
            if ghost_x < target_x:
                ghost_x += ghost_speed
            elif ghost_x > target_x:
                ghost_x -= ghost_speed
            
            if ghost_y < target_y:
                ghost_y += ghost_speed
            elif ghost_y > target_y:
                ghost_y -= ghost_speed
        
        # LIVELLO 7: Collisione con ghost
        if not invincible:
            dist = math.sqrt((player_x - ghost_x)**2 + (player_y - ghost_y)**2)
            if dist < CELL_SIZE * 0.8:  # Collisione più precisa
                lives -= 1
                if lives > 0:
                    # Respawn
                    player_x = CELL_SIZE * 1
                    player_y = CELL_SIZE * 1
                    ghost_x = CELL_SIZE * 10
                    ghost_y = CELL_SIZE * 10
                    vel_x = 0
                    vel_y = 0
                    invincible = True
                    respawn_timer = 0
                else:
                    game_over = True
                    vel_x = 0
                    vel_y = 0
    
    # LIVELLO 3: Disegno
    screen.fill(NERO)
    
    # Disegna labirinto
    for row in range(len(maze)):
        for col in range(len(maze[row])):
            if maze[row][col] == 1:
                x = col * CELL_SIZE
                y = row * CELL_SIZE
                pygame.draw.rect(screen, GRIGIO, (x, y, CELL_SIZE, CELL_SIZE))
                pygame.draw.rect(screen, (102, 102, 102), (x, y, CELL_SIZE, CELL_SIZE), 1)
    
    # Disegna personaggi
    if USE_IMAGES:
        # Lampeggia durante invincibilità
        if not invincible or (invincible and respawn_timer % 10 < 5):
            screen.blit(pacman_scaled, (player_x, player_y))
        screen.blit(ghost_scaled, (ghost_x, ghost_y))
    else:
        # Usa forme geometriche
        if not invincible or (invincible and respawn_timer % 10 < 5):
            draw_pacman(screen, player_x, player_y, CELL_SIZE)
        draw_ghost(screen, ghost_x, ghost_y, CELL_SIZE)
    
    # HUD - Disegna vite
    lives_text = font.render(f"Vite: {lives}", True, BIANCO)
    screen.blit(lives_text, (10, 10))
    
    # Disegna le vite come icone
    for i in range(lives):
        icon_x = 10 + i * 30
        icon_y = 50
        if USE_IMAGES:
            icon = pygame.transform.scale(pacman_scaled, (20, 20))
            screen.blit(icon, (icon_x, icon_y))
        else:
            pygame.draw.circle(screen, GIALLO, (icon_x + 10, icon_y + 10), 10)
    
    # Messaggio invincibilità
    if invincible:
        inv_text = small_font.render("INVINCIBILE!", True, GIALLO)
        screen.blit(inv_text, (LARGHEZZA // 2 - 60, 10))
    
    # Game Over
    if game_over:
        overlay = pygame.Surface((LARGHEZZA, ALTEZZA))
        overlay.set_alpha(180)
        overlay.fill(NERO)
        screen.blit(overlay, (0, 0))
        
        go_text = font.render("GAME OVER!", True, (255, 0, 0))
        restart_text = small_font.render("Premi R per ricominciare", True, BIANCO)
        
        text_rect = go_text.get_rect(center=(LARGHEZZA // 2, ALTEZZA // 2 - 20))
        restart_rect = restart_text.get_rect(center=(LARGHEZZA // 2, ALTEZZA // 2 + 20))
        
        screen.blit(go_text, text_rect)
        screen.blit(restart_text, restart_rect)
    
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
print("Grazie per aver giocato!")`;
    
    document.getElementById("finalCodeOutput").innerText = code.trim();
}

function copyCode() {
    const codeText = document.getElementById("finalCodeOutput").innerText;
    const feedback = document.getElementById("copyFeedback");
    
    navigator.clipboard.writeText(codeText).then(() => {
        feedback.innerText = "✅ COPIATO!";
        setTimeout(() => feedback.innerText = "", 2000);
    }).catch(err => {
        console.error('Errore nella copia: ', err);
        feedback.innerText = "❌ Errore!";
    });
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
});