// Audio utilities for Word Wizards game
// Handles text-to-speech and speech recognition

// Text-to-Speech functionality
const speechSynthesis = window.speechSynthesis;

// Function to speak text aloud
function speakText(text, rate = 0.9, pitch = 1) {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Create utterance object
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set properties
    utterance.rate = rate; // Slightly slower for children
    utterance.pitch = pitch;
    utterance.volume = 1;
    
    // Use a child-friendly voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoices = voices.filter(voice => 
        voice.name.includes('Child') || 
        voice.name.includes('Kid') || 
        voice.name.includes('Female')
    );
    
    if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
    }
    
    // Add error handling
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
    };
    
    // Speak the text
    setTimeout(() => {
        speechSynthesis.speak(utterance);
    }, 50); // Small delay to ensure previous speech is canceled
    
    // Return a promise that resolves when speech is complete
    return new Promise((resolve) => {
        utterance.onend = resolve;
    });
}

// Function to read a word letter by letter with pauses
async function spellWord(word) {
    // First, say "The word is spelled"
    await speakText("The word is spelled");
    
    // Then spell each letter with a pause and phonetic pronunciation
    for (const letter of word) {
        // Create phonetic spelling for clearer pronunciation
        const phonetic = getPhoneticLetter(letter.toUpperCase());
        await speakText(`${letter.toUpperCase()} as in ${phonetic}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // longer pause between letters
    }
    
    // Finish by saying the whole word
    await new Promise(resolve => setTimeout(resolve, 800)); // slightly longer pause
    await speakText(`The complete word is: ${word}`);
}

// Helper function to get phonetic pronunciation for each letter
function getPhoneticLetter(letter) {
    const phonetics = {
        'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 
        'E': 'Echo', 'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel',
        'I': 'India', 'J': 'Juliet', 'K': 'Kilo', 'L': 'Lima',
        'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa',
        'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
        'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray',
        'Y': 'Yankee', 'Z': 'Zulu'
    };
    
    // If it's a letter, return phonetic word, otherwise just return the character
    return phonetics[letter] || letter;
}

// Function to read a hint aloud
function speakHint(hint) {
    return speakText(hint);
}

// Function to speak feedback
function speakFeedback(feedback) {
    return speakText(feedback);
}

// Speech Recognition functionality
// Create a single global instance to avoid repeated permission requests
let recognition = null;
let isListening = false;
let recognitionInitialized = false;
let permissionGranted = false;

// Initialize speech recognition once at the start
function initSpeechRecognition() {
    // If already initialized, don't do it again
    if (recognitionInitialized) return true;
    
    try {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech recognition not supported in this browser");
            return false;
        }
        
        // Create recognition object
        recognition = new SpeechRecognition();
        
        // Set properties
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognitionInitialized = true;
        return true;
    } catch (error) {
        console.error("Error initializing speech recognition:", error);
        return false;
    }
}

// Function to start listening for speech
function startListening(onResultCallback, onErrorCallback) {
    if (!recognitionInitialized) {
        if (!initSpeechRecognition()) {
            return false;
        }
    }
    
    // Don't start if already listening
    if (isListening) {
        return true;
    }
    
    // Set up event handlers
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        onResultCallback(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        isListening = false;
        if (onErrorCallback) {
            onErrorCallback(event.error);
        }
    };
    
    recognition.onend = () => {
        isListening = false;
    };
    
    // Start listening
    try {
        recognition.start();
        isListening = true;
        permissionGranted = true; // Mark that permission was granted once
        return true;
    } catch (error) {
        console.error("Error starting speech recognition:", error);
        return false;
    }
}

// Function to stop listening
function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
    }
}

// Initialize speech recognition on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize speech recognition once the page loads
    setTimeout(initSpeechRecognition, 1000);
    
    // Pre-load speech synthesis voices
    if (window.speechSynthesis) {
        speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
    }
});

// Make audio functions available globally instead of using ES modules
window.speakText = speakText;
window.spellWord = spellWord;
window.speakHint = speakHint;
window.speakFeedback = speakFeedback;
window.startListening = startListening;
window.stopListening = stopListening;