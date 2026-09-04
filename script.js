// Hangman ASCII art
const HANGMAN_ART = [
    `
      +---+
      |   |
          |
          |
          |
          |
    =========`,
    `
      +---+
      |   |
      O   |
          |
          |
          |
    =========`,
    `
      +---+
      |   |
      O   |
      |   |
          |
          |
    =========`,
    `
      +---+
      |   |
      O   |
     /|   |
          |
          |
    =========`,
    `
      +---+
      |   |
      O   |
     /|\\  |
          |
          |
    =========`,
    `
      +---+
      |   |
      O   |
     /|\\  |
     /    |
          |
    =========`,
    `
      +---+
      |   |
      O   |
     /|\\  |
     / \\  |
          |
    =========`
];

const API_URL = 'http://localhost:5000/api';

// DOM Elements
const hangmanArt = document.getElementById('hangman-art');
const wordDisplay = document.getElementById('word-display');
const wrongCount = document.getElementById('wrong-count');
const maxWrong = document.getElementById('max-wrong');
const guessedLetters = document.getElementById('guessed-letters');
const message = document.getElementById('message');
const keyboard = document.getElementById('keyboard');
const newGameBtn = document.getElementById('new-game-btn');

// Game state
let currentWord = '';
let gameActive = false;

// Initialize keyboard
function createKeyboard() {
    keyboard.innerHTML = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
    alphabet.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.addEventListener('click', () => handleGuess(letter));
        keyboard.appendChild(btn);
    });
}

// Start new game
async function startNewGame() {
    try {
        const response = await fetch(`${API_URL}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            gameActive = true;
            currentWord = '_'.repeat(data.word_length);
            maxWrong.textContent = data.max_wrong;
            message.textContent = 'Game started! Guess a letter.';
            message.className = 'message info';
            
            updateDisplay();
            resetKeyboard();
        } else {
            showError('Failed to start game');
        }
    } catch (error) {
        showError('Cannot connect to server. Make sure backend is running on port 5000');
        console.error('Error:', error);
    }
}

// Handle letter guess
async function handleGuess(letter) {
    if (!gameActive) {
        showError('Start a new game first!');
        return;
    }
    
    const btn = document.querySelector(`[data-letter="${letter}"]`);
    if (btn.disabled) return;
    
    try {
        const response = await fetch(`${API_URL}/guess`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ letter })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Disable the button
            btn.disabled = true;
            btn.classList.add(data.correct ? 'correct' : 'wrong');
            
            // Update display
            if (data.correct) {
                updateWordDisplay(letter);
                message.textContent = data.message;
                message.className = 'message success';
                
                if (data.won) {
                    endGame(true);
                }
            } else {
                message.textContent = data.message;
                message.className = 'message error';
                
                if (data.lost) {
                    endGame(false);
                }
            }
            
            updateDisplay(data);
        } else {
            if (data.error) {
                showError(data.error);
            }
        }
    } catch (error) {
        showError('Error connecting to server');
        console.error('Error:', error);
    }
}

// Update word display
function updateWordDisplay(letter) {
    const newWord = currentWord.split('').map((char, index) => {
        if (currentWord[index] === '_' && letter === getCurrentWord()[index]) {
            return letter;
        }
        return char;
    }).join('');
    currentWord = newWord;
    wordDisplay.textContent = currentWord.split('').join(' ');
}

// Get current word from server (for comparison)
function getCurrentWord() {
    return currentWord.replace(/_/g, '?');
}

// Update game display
function updateDisplay(data = null) {
    if (data) {
        wrongCount.textContent = data.wrong_guesses;
        hangmanArt.textContent = HANGMAN_ART[data.wrong_guesses];
        guessedLetters.textContent = data.guessed_letters.join(', ') || 'None';
    }
}

// Reset keyboard
function resetKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.disabled = false;
        key.classList.remove('correct', 'wrong');
    });
}

// End game
function endGame(won) {
    gameActive = false;
    if (won) {
        message.textContent = `🎉 Congratulations! You won! The word was: ${currentWord.toUpperCase()}`;
        message.className = 'message success';
    } else {
        message.textContent = `😢 Game Over! The word was: ${currentWord.toUpperCase()}`;
        message.className = 'message error';
    }
    
    // Disable all keys
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => key.disabled = true);
}

// Show error message
function showError(msg) {
    message.textContent = msg;
    message.className = 'message error';
}

// Event listeners
newGameBtn.addEventListener('click', startNewGame);

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        handleGuess(e.key.toLowerCase());
    }
});

// Initialize
createKeyboard();
startNewGame();