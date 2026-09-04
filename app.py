from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Predefined words
WORDS = ["python", "hangman", "console", "keyboard", "monitor"]

# Store game state (in a real app, use sessions or database)
game_state = {}

@app.route('/api/start', methods=['POST'])
def start_game():
    """Start a new game"""
    word = random.choice(WORDS).lower()
    game_state['word'] = word
    game_state['guessed_letters'] = []
    game_state['wrong_guesses'] = 0
    game_state['max_wrong'] = 6
    
    return jsonify({
        'message': 'Game started!',
        'word_length': len(word),
        'max_wrong': game_state['max_wrong']
    })

@app.route('/api/guess', methods=['POST'])
def guess_letter():
    """Process a letter guess"""
    data = request.get_json()
    letter = data.get('letter', '').lower().strip()
    
    # Validate input
    if not letter or len(letter) != 1 or not letter.isalpha():
        return jsonify({
            'error': 'Invalid input. Please enter a single letter.'
        }), 400
    
    # Check if already guessed
    if letter in game_state.get('guessed_letters', []):
        return jsonify({
            'error': f"You already guessed '{letter}'",
            'guessed_letters': game_state['guessed_letters'],
            'wrong_guesses': game_state['wrong_guesses']
        }), 400
    
    # Add to guessed letters
    game_state['guessed_letters'].append(letter)
    
    # Check if correct
    word = game_state.get('word', '')
    if letter in word:
        # Check if won
        remaining = set(word) - set(game_state['guessed_letters'])
        won = len(remaining) == 0
        
        return jsonify({
            'correct': True,
            'message': f"Good guess! '{letter}' is in the word.",
            'guessed_letters': game_state['guessed_letters'],
            'wrong_guesses': game_state['wrong_guesses'],
            'won': won,
            'word': word if won else None
        })
    else:
        game_state['wrong_guesses'] += 1
        lost = game_state['wrong_guesses'] >= game_state['max_wrong']
        
        return jsonify({
            'correct': False,
            'message': f"Sorry, '{letter}' is not in the word.",
            'guessed_letters': game_state['guessed_letters'],
            'wrong_guesses': game_state['wrong_guesses'],
            'lost': lost,
            'word': word if lost else None
        })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current game status"""
    if not game_state.get('word'):
        return jsonify({'error': 'No game in progress'}), 404
    
    word = game_state['word']
    displayed_word = ''.join([l if l in game_state['guessed_letters'] else '_' for l in word])
    
    return jsonify({
        'word': displayed_word,
        'guessed_letters': game_state['guessed_letters'],
        'wrong_guesses': game_state['wrong_guesses'],
        'max_wrong': game_state['max_wrong']
    })

if __name__ == '__main__':
    print(" Hangman Backend Server Running on http://localhost:5000")
    app.run(debug=True, port=5000)