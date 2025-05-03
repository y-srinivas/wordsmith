// Game logic for Word Wizards - Vocabulary Game for Grades 1-3
// No imports, using global functions instead

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    
    const startButton = document.getElementById('start-button');
    const guessButton = document.getElementById('guess-button');
    const guessInput = document.getElementById('guess-input');
    const playAgainButton = document.getElementById('play-again-button');
    const playerNameInput = document.getElementById('player-name');
    const gradeButtons = document.querySelectorAll('.grade-button');
    
    // Audio-related elements
    const audioToggle = document.getElementById('audio-toggle');
    const speakHintButton = document.getElementById('speak-hint-button');
    
    // Remove reference to voice input button since it's been removed from HTML
    // const voiceInputButton = document.getElementById('voice-input-button');
    const listeningIndicator = document.getElementById('listening-indicator');
    
    const wordDisplay = document.getElementById('word-display');
    const hintText = document.getElementById('hint-text');
    const scoreElement = document.getElementById('score');
    const chancesElement = document.getElementById('chances');
    const feedbackElement = document.getElementById('feedback');
    const finalScoreElement = document.getElementById('final-score');
    
    // Game state
    let playerName = '';
    let selectedGrade = 1; // Default to 1st grade
    let gameWords = [];
    let currentWordIndex = 0;
    let currentWord = null;
    let partiallyRevealedWord = [];
    let score = 0;
    let chances = 3;
    let audioEnabled = true;
    let gamePaused = false; // Track if game is paused/stopped
    
    // Timer variables
    let timerEnabled = true;
    let timerDuration = 120; // Default 2 minutes (in seconds)
    let timeRemaining = 0;
    let timerInterval = null;
    let timerPerWord = true; // Always true as we now track per-word time
    
    // Get player's name with a default if none provided
    function getPlayerName() {
        const name = playerNameInput.value.trim();
        return name ? name : 'Friend';
    }
    
    // Update subtitle based on selected grade
    function updateSubtitle() {
        const subtitle = document.querySelector('.subtitle');
        subtitle.textContent = `${getOrdinalGradeName(selectedGrade)} Vocabulary Fun!`;
    }
    
    // Get ordinal form of grade number (1st, 2nd, 3rd)
    function getOrdinalGradeName(grade) {
        if (grade === 1) return '1st Grade';
        if (grade === 2) return '2nd Grade';
        if (grade === 3) return '3rd Grade';
        return `${grade}th Grade`;
    }
    
    // Initialize game
    function initGame() {
        // Get and save player's name and audio preference
        playerName = getPlayerName();
        audioEnabled = audioToggle.checked;
        
        // Get timer settings
        timerEnabled = document.getElementById('timer-toggle').checked;
        timerDuration = parseInt(document.getElementById('timer-slider').value) * 60; // Convert minutes to seconds
        
        // Ensure getRandomWordsByGrade is available
        if (typeof window.getRandomWordsByGrade !== 'function') {
            console.error('getRandomWordsByGrade function not found. Make sure words.js is loaded properly.');
            // Fallback with empty array
            gameWords = [];
        } else {
            // Get 10 random words for this game session from selected grade
            gameWords = window.getRandomWordsByGrade(selectedGrade, 10);
        }
        
        currentWordIndex = 0;
        score = 0;
        updateScore(0);
        
        // Update game info display with player name and grade
        updateGameInfoDisplay();
        
        // Set up first word
        loadNextWord();
        
        // Start the timer if enabled
        if (timerEnabled) {
            startTimer();
        } else {
            document.querySelector('.timer').style.display = 'none';
        }
        
        // Welcome the player with audio if enabled
        if (audioEnabled && typeof window.speakText === 'function') {
            window.speakText(`Welcome ${playerName}! Let's play Wordsmith for ${getOrdinalGradeName(selectedGrade)}.`);
        }
    }
    
    // Update game info display with player name and grade
    function updateGameInfoDisplay() {
        const gameInfoElement = document.querySelector('.game-info');
        
        // Add/update player name element
        const playerElement = document.createElement('div');
        playerElement.className = 'player-name';
        playerElement.textContent = `Player: ${playerName}`;
        
        // Add/update grade level element
        const gradeElement = document.createElement('div');
        gradeElement.className = 'grade-level';
        gradeElement.textContent = `Level: ${getOrdinalGradeName(selectedGrade)}`;
        
        // Replace any existing elements or add them if they don't exist
        const existingPlayerElement = gameInfoElement.querySelector('.player-name');
        if (existingPlayerElement) {
            gameInfoElement.replaceChild(playerElement, existingPlayerElement);
        } else {
            gameInfoElement.prepend(playerElement);
        }
        
        const existingGradeElement = gameInfoElement.querySelector('.grade-level');
        if (existingGradeElement) {
            gameInfoElement.replaceChild(gradeElement, existingGradeElement);
        } else {
            gameInfoElement.insertBefore(gradeElement, gameInfoElement.querySelector('.score'));
        }
        
        // Show/hide audio buttons based on audio setting
        speakHintButton.style.display = audioEnabled ? 'flex' : 'none';
        // voiceInputButton.style.display = audioEnabled ? 'flex' : 'none';
    }
    
    // Load the next word in the game
    function loadNextWord() {
        // Check if we've gone through all words
        if (currentWordIndex >= gameWords.length) {
            endGame();
            return;
        }
        
        // Reset chances for new word
        chances = 3;
        updateChances();
        
        // Clear feedback and input
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback';
        guessInput.value = '';
        
        // Get current word data
        currentWord = gameWords[currentWordIndex];
        
        // Generate partially revealed word based on grade level
        partiallyRevealedWord = getPartiallyRevealedWord(
            currentWord.word, 
            selectedGrade
        );
        
        // Display hint
        hintText.textContent = currentWord.hint;
        
        // Render word with hidden letters
        renderWord();
        
        // Focus on input
        guessInput.focus();
        
        // Start new timer for this word if timer is enabled
        if (timerEnabled) {
            startTimer();
        }
        
        // Read hint if audio is enabled
        if (audioEnabled) {
            // Small delay to ensure the UI has updated
            setTimeout(() => {
                speakHint(currentWord.hint);
            }, 500);
        }
    }
    
    // Render the current word with some letters hidden
    function renderWord() {
        // Clear word display
        wordDisplay.innerHTML = '';
        
        // Create letter elements
        partiallyRevealedWord.forEach(letterObj => {
            const letterElement = document.createElement('div');
            letterElement.className = 'letter';
            
            if (letterObj.revealed) {
                letterElement.textContent = letterObj.letter.toUpperCase();
            } else {
                // Use underscore as placeholder instead of hidden letter
                letterElement.textContent = '_';
                letterElement.classList.add('hidden');
            }
            
            wordDisplay.appendChild(letterElement);
        });
    }
    
    // Process player's guess
    function processGuess() {
        const guess = guessInput.value.trim().toLowerCase();
        
        // Check if guess is empty
        if (guess === '') {
            return;
        }
        
        // Check if guess is correct
        if (guess === currentWord.word.toLowerCase()) {
            // Correct guess
            
            // Add points based on word difficulty and grade
            let points = selectedGrade * 10;
            updateScore(points);
            
            // Prepare personalized success feedback
            const feedback = `Great job, ${playerName}! That's correct! 🎉`;
            
            // Show feedback text
            feedbackElement.textContent = feedback;
            feedbackElement.className = 'feedback correct';
            
            // Cancel any existing speech and speak feedback if audio enabled
            if (audioEnabled) {
                // Force cancel any previous speech
                speechSynthesis.cancel();
                
                // Small delay to ensure proper playback
                setTimeout(() => {
                    speakFeedback(feedback);
                }, 100);
            }
            
            // Reveal full word with animation
            revealWord(true);
            
            // Move to next word after delay
            setTimeout(() => {
                currentWordIndex++;
                loadNextWord();
            }, audioEnabled ? 3000 : 2000); // Longer delay if audio is enabled
        } else {
            // Incorrect guess
            
            // Decrease chances
            chances--;
            updateChances();
            
            // Prepare personalized feedback message
            let feedback;
            if (chances > 0) {
                feedback = `Try again, ${playerName}! That's not right. You have ${chances} chance${chances === 1 ? '' : 's'} left.`;
            } else {
                feedback = `Sorry, ${playerName}. The word was: ${currentWord.word.toUpperCase()}`;
            }
            
            // Display feedback
            feedbackElement.textContent = feedback;
            feedbackElement.className = 'feedback incorrect';
            guessInput.classList.add('shake');
            
            // Cancel any existing speech and speak feedback if audio enabled
            if (audioEnabled) {
                // Force cancel any previous speech
                speechSynthesis.cancel();
                
                // Small delay to ensure proper playback
                setTimeout(() => {
                    speakFeedback(feedback);
                }, 100);
            }
            
            // Remove animation class after it completes
            setTimeout(() => {
                guessInput.classList.remove('shake');
            }, 500);
            
            // If out of chances, reveal word and spell it if audio enabled
            if (chances <= 0) {
                // Reveal full word
                revealWord(false);
                
                // Spell the word if audio is enabled
                if (audioEnabled) {
                    setTimeout(() => {
                        spellWord(currentWord.word);
                    }, 1000);
                }
                
                // Move to next word after appropriate delay
                setTimeout(() => {
                    currentWordIndex++;
                    loadNextWord();
                }, audioEnabled ? 5000 : 3000); // Longer delay if audio is enabled for spelling
            }
        }
        
        // Clear input
        guessInput.value = '';
        guessInput.focus();
    }
    
    // Reveal the full word (with animation)
    function revealWord(success) {
        const letterElements = wordDisplay.querySelectorAll('.letter');
        
        letterElements.forEach((element, index) => {
            setTimeout(() => {
                element.textContent = currentWord.word[index].toUpperCase();
                element.classList.remove('hidden');
                
                if (success) {
                    element.classList.add('bounce');
                    setTimeout(() => element.classList.remove('bounce'), 500);
                }
            }, index * 200);
        });
    }
    
    // Update score display
    function updateScore(points) {
        score += points;
        scoreElement.textContent = score;
    }
    
    // Update chances display
    function updateChances() {
        chancesElement.textContent = chances;
    }
    
    // Timer functions
    function startTimer() {
        // Clear any existing timer
        clearInterval(timerInterval);
        
        // Initialize time remaining
        timeRemaining = timerDuration;
        
        // Update timer display initially
        updateTimerDisplay();
        
        // Start the timer interval
        timerInterval = setInterval(() => {
            if (!gamePaused) {
                timeRemaining--;
                updateTimerDisplay();
                
                // Check if time is up
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    timeExpired();
                }
            }
        }, 1000);
    }
    
    // Update the timer display
    function updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        // Format with leading zeros
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        // Add warning class when time is running low (less than 30 seconds)
        if (timeRemaining <= 30) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    }
    
    // Handle timer expiration
    function timeExpired() {
        // Stop and clean up timer
        clearInterval(timerInterval);
        
        // Give feedback that time is up for this word
        feedbackElement.textContent = `Time's up for this word, ${playerName}! The word was: ${currentWord.word.toUpperCase()}`;
        feedbackElement.className = 'feedback incorrect';
        
        // Speak time's up message if audio is enabled
        if (audioEnabled) {
            speechSynthesis.cancel(); // Cancel any existing speech
            speakText(`Time's up, ${playerName}! The word was ${currentWord.word}.`);
        }
        
        // Show the full word
        revealWord(false);
        
        // Spell the word if audio is enabled
        if (audioEnabled) {
            setTimeout(() => {
                spellWord(currentWord.word);
            }, 1000);
        }
        
        // Move to next word after appropriate delay
        setTimeout(() => {
            currentWordIndex++;
            loadNextWord();
        }, audioEnabled ? 5000 : 3000); // Longer delay if audio is enabled for spelling
    }
    
    // End the game
    function endGame() {
        // Update final score with player name and grade
        if (gameOverScreen.querySelector('.player-name-result')) {
            gameOverScreen.querySelector('.player-name-result').remove();
        }
        
        const playerNameResult = document.createElement('p');
        playerNameResult.className = 'player-name-result';
        playerNameResult.textContent = `Great job, ${playerName}! (${getOrdinalGradeName(selectedGrade)})`;
        
        const gameOverTitle = gameOverScreen.querySelector('h2');
        gameOverTitle.insertAdjacentElement('afterend', playerNameResult);
        
        // Update final score
        finalScoreElement.textContent = score;
        
        // Hide game screen, show game over screen
        gameScreen.classList.remove('active');
        gameOverScreen.classList.add('active');
        
        // Read game over message if audio enabled
        if (audioEnabled) {
            speakText(`Game over, ${playerName}! Your final score is ${score} points. Great job!`);
        }
    }
    
    // Handle voice input
    function handleVoiceInput() {
        // Don't proceed if audio is disabled
        if (!audioEnabled) return;
        
        // Show listening indicator
        listeningIndicator.classList.remove('hidden');
        
        // Start listening for speech
        const success = startListening(
            // On result callback
            (transcript) => {
                // Hide listening indicator
                listeningIndicator.classList.add('hidden');
                
                // Fill the input field with the recognized speech
                guessInput.value = transcript;
                
                // Process the guess
                processGuess();
            },
            // On error callback
            (error) => {
                // Hide listening indicator
                listeningIndicator.classList.add('hidden');
                
                // Show error feedback
                feedbackElement.textContent = "Sorry, I couldn't hear you. Please try again or type your answer.";
                feedbackElement.className = 'feedback incorrect';
            }
        );
        
        // If speech recognition couldn't start, show error
        if (!success) {
            listeningIndicator.classList.add('hidden');
            feedbackElement.textContent = "Sorry, voice input is not available in your browser.";
            feedbackElement.className = 'feedback incorrect';
        }
    }
    
    // Switch between screens
    function showScreen(screen) {
        // Hide all screens
        startScreen.classList.remove('active');
        gameScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        
        // Show the requested screen
        screen.classList.add('active');
    }
    
    // Toggle pause state
    function togglePause() {
        gamePaused = !gamePaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        const pauseScore = document.getElementById('pause-score');
        
        if (gamePaused) {
            // Update pause screen score
            pauseScore.textContent = score;
            // Show pause overlay
            pauseOverlay.classList.add('active');
            
            // Cancel any ongoing speech
            if (audioEnabled) {
                speechSynthesis.cancel();
            }
            
            // Announce pause if audio enabled
            if (audioEnabled) {
                speakText("Game paused");
            }
        } else {
            // Hide pause overlay
            pauseOverlay.classList.remove('active');
        }
    }
    
    // Stop the game and return to start screen
    function stopGame() {
        // Cancel any ongoing speech
        if (audioEnabled) {
            speechSynthesis.cancel();
        }
        
        // Hide pause overlay if it's showing
        const pauseOverlay = document.getElementById('pause-overlay');
        pauseOverlay.classList.remove('active');
        
        // Reset game state
        gamePaused = false;
        
        // Return to start screen
        showScreen(startScreen);
    }
    
    // Event Listeners
    // Grade selection
    gradeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            gradeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update selected grade
            selectedGrade = parseInt(button.dataset.grade);
            
            // Update game subtitle
            updateSubtitle();
        });
    });
    
    // Speak hint button
    speakHintButton.addEventListener('click', () => {
        if (audioEnabled && currentWord) {
            speakHint(currentWord.hint);
        }
    });
    
    // Voice input button
    // voiceInputButton.addEventListener('click', handleVoiceInput);
    
    startButton.addEventListener('click', () => {
        if (playerNameInput.value.trim() === '') {
            // Shake the name input if empty
            playerNameInput.classList.add('shake');
            setTimeout(() => {
                playerNameInput.classList.remove('shake');
            }, 500);
            
            // Focus on the input
            playerNameInput.focus();
            return;
        }
        
        showScreen(gameScreen);
        initGame();
    });
    
    // Enable enter key to submit player name on start screen
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && playerNameInput.value.trim() !== '') {
            startButton.click();
        }
    });
    
    guessButton.addEventListener('click', processGuess);
    
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processGuess();
        }
    });
    
    playAgainButton.addEventListener('click', () => {
        // Stop any ongoing speech
        if (audioEnabled) {
            speechSynthesis.cancel();
        }
        
        // Go back to start screen to allow entering a new name and selecting grade
        showScreen(startScreen);
    });
    
    // Update audio toggle
    audioToggle.addEventListener('change', () => {
        audioEnabled = audioToggle.checked;
    });
    
    // Timer controls
    const timerSlider = document.getElementById('timer-slider');
    const timerValue = document.getElementById('timer-value');
    const timerToggle = document.getElementById('timer-toggle');
    
    // Update timer value display when slider changes
    timerSlider.addEventListener('input', () => {
        timerValue.textContent = timerSlider.value;
    });
    
    // Timer toggle
    timerToggle.addEventListener('change', () => {
        timerEnabled = timerToggle.checked;
    });
    
    // Stop game button
    const stopGameButton = document.getElementById('stop-game');
    stopGameButton.addEventListener('click', togglePause);
    
    // Resume game button
    const resumeGameButton = document.getElementById('resume-game');
    resumeGameButton.addEventListener('click', togglePause);
    
    // Exit game button
    const exitGameButton = document.getElementById('exit-game');
    exitGameButton.addEventListener('click', stopGame);
    
    // Also handle escape key to pause/resume
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameScreen.classList.contains('active')) {
            togglePause();
        }
    });
    
    // Initial setup
    guessInput.maxLength = 15;
    playerNameInput.focus();
    updateSubtitle(); // Set initial subtitle based on default grade
    
    // Initialize speech synthesis voices
    if (window.speechSynthesis) {
        // Load voices
        speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
    }
});