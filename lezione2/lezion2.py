# PyGame Academy - Lezione 2: Pac-Man
# Movimento continuo, animazioni e collisioni

import pygame
import sys

# 1. Inizializzazione
pygame.init()
clock = pygame.time.Clock()

# 2. Setup Finestra
LARGHEZZA = 600
ALTEZZA = 400
screen = pygame.display.set_mode((LARGHEZZA, ALTEZZA))
pygame.display.set_caption("Pac-Man - Lezione 2")

# 3. Caricamento background
background = pygame.image.load("background.png")

# LIVELLO 1: Variabili di movimento
vel_x = 0
vel_y = 0
VELOCITA = 5

# LIVELLO 3: Caricamento frame animazione
pacman_frames = []
for i in range(1, 4):
    img = pygame.image.load(f"pacman{i}.png")
    pacman_frames.append(img)

current_frame = 0
animation_timer = 0

# LIVELLO 4: Posizione iniziale e Rect
pacman_x = 50
pacman_y = 200
pacman_rect = pacman_frames[0].get_rect()
pacman_rect.topleft = (pacman_x, pacman_y)

# Muro (ostacolo scenico)
wall_rect = pygame.Rect(250, 150, 100, 100)
GRIGIO = (102, 102, 102)

# LIVELLO 6: Variabile per tracciare direzione
direzione = 'right'

# Loop di gioco
running = True
while running:
    
    # Gestione eventi
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            
        # LIVELLO 2: KEYDOWN - quando PREMI il tasto
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RIGHT:
                vel_x = VELOCITA
                vel_y = 0
                direzione = 'right'
            elif event.key == pygame.K_LEFT:
                vel_x = -VELOCITA
                vel_y = 0
                direzione = 'left'
            elif event.key == pygame.K_UP:
                vel_x = 0
                vel_y = -VELOCITA
                direzione = 'up'
            elif event.key == pygame.K_DOWN:
                vel_x = 0
                vel_y = VELOCITA
                direzione = 'down'
        
        # LIVELLO 2: KEYUP - quando RILASCI il tasto
        if event.type == pygame.KEYUP:
            if event.key == pygame.K_RIGHT and vel_x > 0:
                vel_x = 0
            elif event.key == pygame.K_LEFT and vel_x < 0:
                vel_x = 0
            elif event.key == pygame.K_UP and vel_y < 0:
                vel_y = 0
            elif event.key == pygame.K_DOWN and vel_y > 0:
                vel_y = 0
    
    # Aggiornamento posizione
    pacman_x += vel_x
    pacman_y += vel_y
    pacman_rect.topleft = (pacman_x, pacman_y)
    
    # Bordi schermo
    if pacman_x < 0:
        pacman_x = 0
    if pacman_x > LARGHEZZA - pacman_rect.width:
        pacman_x = LARGHEZZA - pacman_rect.width
    if pacman_y < 0:
        pacman_y = 0
    if pacman_y > ALTEZZA - pacman_rect.height:
        pacman_y = ALTEZZA - pacman_rect.height
    
    pacman_rect.topleft = (pacman_x, pacman_y)
    
    # LIVELLO 5: Collisione con il muro
    if pacman_rect.colliderect(wall_rect):
        # Ferma il movimento
        vel_x = 0
        vel_y = 0
    
    # Animazione (cambia frame solo se in movimento)
    if vel_x != 0 or vel_y != 0:
        animation_timer += 1
        if animation_timer > 5:
            current_frame = (current_frame + 1) % 3
            animation_timer = 0
    else:
        # Se fermo, mostra frame chiuso
        current_frame = 0
    
    # LIVELLO 6: Trasformazione in base alla direzione
    frame_corrente = pacman_frames[current_frame]
    
    if direzione == 'right':
        pacman_img = frame_corrente  # Immagine originale
    elif direzione == 'left':
        pacman_img = pygame.transform.flip(frame_corrente, True, False)
    elif direzione == 'up':
        pacman_img = pygame.transform.rotate(frame_corrente, 90)
    elif direzione == 'down':
        pacman_img = pygame.transform.rotate(frame_corrente, 270)
    
    # Disegno
    screen.blit(background, (0, 0))
    
    # Disegna muro
    pygame.draw.rect(screen, GRIGIO, wall_rect)
    pygame.draw.rect(screen, (153, 153, 153), wall_rect, 3)
    
    # Disegna Pac-Man (con trasformazione)
    screen.blit(pacman_img, (pacman_x, pacman_y))
    
    # Aggiornamento schermo
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()