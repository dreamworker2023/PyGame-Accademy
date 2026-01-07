# PyGame Academy - Lezione 3: Labirinto, IA e Sistema Vite (CORRETTO)
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
pygame.display.set_caption("Pac-Man Maze - Lezione 3 Corretta")

# 3. Colori
NERO = (0, 0, 0)
GRIGIO = (68, 68, 68)
GIALLO = (255, 255, 0)
BLU_GHOST = (0, 191, 255)
BIANCO = (255, 255, 255)

# LIVELLO 1: Matrice Labirinto
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

# LIVELLO 2: Dimensione Celle e creazione Muri
CELL_SIZE = LARGHEZZA // len(maze[0])

# Creiamo una lista di Rect per i muri: questo risolve i problemi di collisione!
walls = []
for row_idx, row in enumerate(maze):
    for col_idx, cell in enumerate(row):
        if cell == 1:
            walls.append(pygame.Rect(col_idx * CELL_SIZE, row_idx * CELL_SIZE, CELL_SIZE, CELL_SIZE))

# 4. Caricamento Sprite
try:
    pacman_img = pygame.image.load("pacman1.png")
    ghost_img = pygame.image.load("ghost_blue.png")
    # Ridimensioniamo leggermente meno della cella (padding) per non incastrarsi
    pacman_scaled = pygame.transform.scale(pacman_img, (CELL_SIZE - 4, CELL_SIZE - 4))
    ghost_scaled = pygame.transform.scale(ghost_img, (CELL_SIZE - 4, CELL_SIZE - 4))
    USE_IMAGES = True
except:
    USE_IMAGES = False

# Personaggi come Rect per gestire le collisioni
# Li posizioniamo al centro della cella (1,1) e (10,10)
player_rect = pygame.Rect(CELL_SIZE + 2, CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4)
ghost_rect = pygame.Rect(CELL_SIZE * 10 + 2, CELL_SIZE * 10 + 2, CELL_SIZE - 4, CELL_SIZE - 4)

vel_x, vel_y = 0, 0
VELOCITA = 3 # Ridotta leggermente per precisione
ghost_speed = 2
lives = 3
game_over = False
invincible = False
respawn_timer = 0

# LIVELLO 6: BFS Pathfinding (Invariato, ma usato con i Rect)
def bfs_pathfinding(maze, start, goal):
    queue = deque([start])
    visited = {start}
    parent = {}
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    
    while queue:
        current = queue.popleft()
        if current == goal:
            path = []
            while current in parent:
                path.append(current)
                current = parent[current]
            path.reverse()
            return path
        
        cy, cx = current
        for dy, dx in directions:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < len(maze) and 0 <= nx < len(maze[0]) and maze[ny][nx] == 0:
                if (ny, nx) not in visited:
                    visited.add((ny, nx))
                    parent[(ny, nx)] = current
                    queue.append((ny, nx))
    return []

# Funzioni di disegno (Invariate)
def draw_pacman(surface, rect):
    pygame.draw.circle(surface, GIALLO, rect.center, rect.width // 2)
def draw_ghost(surface, rect):
    pygame.draw.rect(surface, BLU_GHOST, rect, border_radius=5)

font = pygame.font.Font(None, 36)

# Loop di gioco
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN and not game_over:
            if event.key == pygame.K_RIGHT: vel_x, vel_y = VELOCITA, 0
            elif event.key == pygame.K_LEFT: vel_x, vel_y = -VELOCITA, 0
            elif event.key == pygame.K_UP: vel_x, vel_y = 0, -VELOCITA
            elif event.key == pygame.K_DOWN: vel_x, vel_y = 0, VELOCITA
        if event.type == pygame.KEYUP:
            if event.key in [pygame.K_LEFT, pygame.K_RIGHT]: vel_x = 0
            if event.key in [pygame.K_UP, pygame.K_DOWN]: vel_y = 0

    if not game_over:
        # --- MOVIMENTO GIOCATORE CON COLLISIONI REALI ---
        # Muovi X
        player_rect.x += vel_x
        for wall in walls:
            if player_rect.colliderect(wall):
                if vel_x > 0: player_rect.right = wall.left
                if vel_x < 0: player_rect.left = wall.right
        
        # Muovi Y
        player_rect.y += vel_y
        for wall in walls:
            if player_rect.colliderect(wall):
                if vel_y > 0: player_rect.bottom = wall.top
                if vel_y < 0: player_rect.top = wall.bottom

        # --- MOVIMENTO FANTASMA (IA) ---
        p_grid = (player_rect.centery // CELL_SIZE, player_rect.centerx // CELL_SIZE)
        g_grid = (ghost_rect.centery // CELL_SIZE, ghost_rect.centerx // CELL_SIZE)
        
        path = bfs_pathfinding(maze, g_grid, p_grid)
        if path:
            target_cell = path[0]
            target_x = target_cell[1] * CELL_SIZE + 2
            target_y = target_cell[0] * CELL_SIZE + 2
            
            if ghost_rect.x < target_x: ghost_rect.x += ghost_speed
            elif ghost_rect.x > target_x: ghost_rect.x -= ghost_speed
            if ghost_rect.y < target_y: ghost_rect.y += ghost_speed
            elif ghost_rect.y > target_y: ghost_rect.y -= ghost_speed

        # --- COLLISIONE PACMAN-GHOST ---
        if player_rect.colliderect(ghost_rect) and not invincible:
            lives -= 1
            if lives <= 0:
                game_over = True
            else:
                invincible = True
                respawn_timer = pygame.time.get_ticks()
                player_rect.topleft = (CELL_SIZE + 2, CELL_SIZE + 2)

        if invincible and pygame.time.get_ticks() - respawn_timer > 2000:
            invincible = False

    # --- DISEGNO ---
    screen.fill(NERO)
    for wall in walls:
        pygame.draw.rect(screen, GRIGIO, wall)
        pygame.draw.rect(screen, (100, 100, 100), wall, 1)

    if not invincible or (pygame.time.get_ticks() // 200 % 2 == 0):
        if USE_IMAGES: screen.blit(pacman_scaled, player_rect)
        else: draw_pacman(screen, player_rect)
    
    if USE_IMAGES: screen.blit(ghost_scaled, ghost_rect)
    else: draw_ghost(screen, ghost_rect)

    # UI
    txt = font.render(f"Vite: {lives}", True, BIANCO)
    screen.blit(txt, (20, 20))
    if game_over:
        msg = font.render("GAME OVER - Premi R per Reset", True, (255, 0, 0))
        screen.blit(msg, (LARGHEZZA//2 - 150, ALTEZZA//2))

    pygame.display.flip()
    clock.tick(60)

pygame.quit()