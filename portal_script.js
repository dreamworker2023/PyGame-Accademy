// ============================================
// GESTIONE DATI LEZIONI E MANUALE
// ============================================
let lessonsData = null;
let LESSONS = [];
let manualData = null;
let MANUAL_SECTIONS = [];

// Carica i dati delle lezioni dal JSON
async function loadLessonsData() {
    try {
        const response = await fetch('lessons.json');
        lessonsData = await response.json();
        LESSONS = lessonsData.lessons;
        return true;
    } catch (error) {
        console.error('Errore nel caricamento di lessons.json:', error);
        // Fallback: usa dati di default
        LESSONS = [
            {
                id: 1,
                title: "🎯 Lezione 1: Fondamenti di Pygame",
                description: "Impara le basi di Pygame",
                topics: ["pygame.init()", "display.set_mode()"],
                folder: "lezione1",
                file: "lezione1.html",
                completed: false,
                score: 1000,
                attempts: 0,
                completionDate: null
            }
        ];
        lessonsData = { lessons: LESSONS, studentStats: {} };
        return false;
    }
}

// Carica il manuale dal JSON
async function loadManualData() {
    try {
        const response = await fetch('manual.json');
        manualData = await response.json();
        MANUAL_SECTIONS = manualData.manualSections;
        return true;
    } catch (error) {
        console.error('Errore nel caricamento di manual.json:', error);
        MANUAL_SECTIONS = []; // Array vuoto come fallback
        return false;
    }
}

const STORAGE_KEY = 'pygame_academy_data';
let progress = {};
let currentLesson = null;

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    const newProgress = {};
    LESSONS.forEach(lesson => {
        newProgress[`lesson${lesson.number}`] = false;
    });
    return newProgress;
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

progress = loadProgress();

function saveLessonsData() {
    localStorage.setItem('pygame_academy_data', JSON.stringify(lessonsData));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('pygame_academy_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (lessonsData && data.lessons) {
                data.lessons.forEach(savedLesson => {
                    const lesson = lessonsData.lessons.find(l => l.id === savedLesson.id);
                    if (lesson) {
                        lesson.completed = savedLesson.completed;
                        lesson.score = savedLesson.score;
                        lesson.attempts = savedLesson.attempts;
                        lesson.completionDate = savedLesson.completionDate;
                    }
                });
                lessonsData.studentStats = data.studentStats;
                LESSONS = lessonsData.lessons;
            }
        } catch (e) {
            console.error('Errore nel parsing localStorage:', e);
        }
    }
}

// ============================================
// RENDERING LEZIONI
// ============================================
function renderLessons() {
    const container = document.getElementById('lessonsContainer');
    container.innerHTML = '';
    
    LESSONS.forEach((lesson, index) => {
        const isCompleted = lesson.completed;
        const isUnlocked = index === 0 || LESSONS[index-1].completed;
        
        let statusClass = 'locked';
        let statusText = '🔒 Bloccata';
        let buttonText = `🔒 Completa Lezione ${index}`;
        let buttonDisabled = true;
        
        if (isCompleted) {
            statusClass = 'completed';
            statusText = '✅ Completata';
            buttonText = '🔄 Rivedi Lezione';
            buttonDisabled = false;
        } else if (isUnlocked) {
            statusClass = 'unlocked';
            statusText = 'Disponibile';
            buttonText = 'Inizia Lezione →';
            buttonDisabled = false;
        }
        
        const topicsHTML = lesson.topics.map(topic => 
            `<span class="topic-tag">${topic}</span>`
        ).join('');
        
        const scoreInfo = isCompleted ? 
            `<div style="color: #4caf50; font-size: 0.9em; margin-top: 10px;">
                🏆 Punteggio: ${lesson.score}/1000
            </div>` : '';
        
        const cardHTML = `
            <div class="lesson-card ${statusClass}" data-lesson="${lesson.id}">
                <div class="lesson-header">
                    <div class="lesson-number">${String(lesson.id).padStart(2, '0')}</div>
                    <div class="lesson-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <h3 class="lesson-title">${lesson.title}</h3>
                <p class="lesson-description">${lesson.description}</p>
                <div class="lesson-topics">${topicsHTML}</div>
                ${scoreInfo}
                <button class="lesson-button" onclick="startLesson(${lesson.id})" ${buttonDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;
        
        container.innerHTML += cardHTML;
    });
}

// ============================================
// RENDERING MANUALE
// ============================================
function renderManualLinks() {
    const container = document.getElementById('manualLinksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    MANUAL_SECTIONS.forEach((section, index) => {
        const linkHTML = `
            <a href="#" class="manual-link" onclick="openManual('${section.id}'); return false;">
                <div class="manual-link-title">${section.icon} ${index + 1}. ${section.title.replace(/^[^\s]+\s/, '')}</div>
                <div class="manual-link-desc">${section.shortDesc}</div>
            </a>
        `;
        container.innerHTML += linkHTML;
    });
}

// ============================================
// AGGIORNAMENTO UI
// ============================================
function updateUI() {
    renderLessons();
    renderManualLinks();  // <-- AGGIUNTO QUESTO
    
    const completed = LESSONS.filter(l => l.completed).length;
    const total = LESSONS.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('completedLessons').innerText = `${completed}/${total}`;
    document.getElementById('totalProgress').innerText = `${percentage}%`;
    
    updateProgressRing(percentage);
    
    if (lessonsData) {
        const completedLessons = LESSONS.filter(l => l.completed);
        lessonsData.studentStats.totalScore = completedLessons.reduce((sum, l) => sum + l.score, 0);
        lessonsData.studentStats.averageScore = completedLessons.length > 0 
            ? Math.round(lessonsData.studentStats.totalScore / completedLessons.length) 
            : 0;
        lessonsData.studentStats.totalAttempts = LESSONS.reduce((sum, l) => sum + l.attempts, 0);
        lessonsData.studentStats.lastAccess = new Date().toISOString();
    }
}

function updateProgressRing(percentage) {
    const circle = document.getElementById('progressCircle');
    const text = document.getElementById('progressPercent');
    
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    text.innerText = percentage + '%';
}

// ============================================
// NAVIGAZIONE LEZIONI
// ============================================
function startLesson(lessonId) {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return;
    
    sessionStorage.setItem('current_lesson', lessonId);
    window.location.href = `${lesson.folder}/${lesson.file}`;
}

// ============================================
// RICEZIONE DATI DALLA LEZIONE
// ============================================
function checkLessonCompletion() {
    const completionData = sessionStorage.getItem('lesson_completion');
    
    if (completionData) {
        try {
            const data = JSON.parse(completionData);
            const lesson = LESSONS.find(l => l.id === data.lessonId);
            
            if (lesson && !lesson.completed) {
                lesson.completed = true;
                lesson.score = data.score;
                lesson.attempts = data.attempts || 0;
                lesson.completionDate = new Date().toISOString();
                
                saveLessonsData();
                updateUI();
                
                setTimeout(() => {
                    alert(`🎉 Complimenti! Hai completato "${lesson.title}"!\n\n🏆 Punteggio finale: ${lesson.score}/1000`);
                    
                    const nextLesson = LESSONS.find(l => l.id === data.lessonId + 1);
                    if (nextLesson) {
                        const goNext = confirm(`Vuoi iniziare la prossima lezione:\n"${nextLesson.title}"?`);
                        if (goNext) {
                            startLesson(nextLesson.id);
                        }
                    }
                }, 300);
            }
            
            sessionStorage.removeItem('lesson_completion');
        } catch (e) {
            console.error('Errore nel parsing dei dati di completamento:', e);
        }
    }
}

// ============================================
// SISTEMA MANUALE DINAMICO
// ============================================
function renderManualContent(section) {
    let html = '';
    
    section.content.forEach(item => {
        html += '<div class="manual-section">';
        
        if (item.title) {
            html += `<h3>${item.title}</h3>`;
        }
        
        if (item.text) {
            html += `<p>${item.text}</p>`;
        }
        
        if (item.code) {
            html += `<div class="code-block">${escapeHtml(item.code)}</div>`;
        }
        
        if (item.note) {
            html += `<p><strong>Nota:</strong> ${item.note}</p>`;
        }
        
        if (item.highlight) {
            html += `<p><span class="highlight">${item.highlight}</span></p>`;
        }
        
        if (item.list) {
            html += '<ul>';
            item.list.forEach(listItem => {
                html += `<li>${listItem}</li>`;
            });
            html += '</ul>';
        }
        
        if (item.example) {
            html += '<p><strong>Esempio:</strong></p>';
            html += `<div class="code-block">${escapeHtml(item.example)}</div>`;
        }
        
        html += '</div>';
    });
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openManual(topicId) {
    const modal = document.getElementById('manualModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    const section = MANUAL_SECTIONS.find(s => s.id === topicId);
    if (section) {
        title.innerText = section.title;
        body.innerHTML = renderManualContent(section);
        modal.style.display = 'block';
    }
}

function closeManual() {
    document.getElementById('manualModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('manualModal');
    if (event.target === modal) {
        closeManual();
    }
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
async function init() {
    await loadLessonsData();
    await loadManualData();
    loadFromLocalStorage();
    updateUI();
    checkLessonCompletion();
}

document.addEventListener('DOMContentLoaded', init);