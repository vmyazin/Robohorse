// js/managers/SoundManager.js
// Responsible for managing all sound-related functionality in the game

class SoundManager {
    constructor(game) {
        this.game = game;
        this.sounds = {};
        this.backgroundMusic = null;
        this.policeRadioSound1 = null;
        this.policeRadioSound2 = null;
        this.currentPoliceRadioIndex = 0;
        this.policeRadioInterval = this.getRandomInterval(30000, 45000);
        
        // Sound state
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false'; // Default to true if not set
        this.soundToggleElement = document.getElementById('sound-toggle');
        
        // Initialize sound toggle button appearance
        if (this.soundToggleElement) {
            this.soundToggleElement.textContent = this.soundEnabled ? '🔊' : '🔇';
            if (!this.soundEnabled) {
                this.soundToggleElement.classList.add('muted');
            }
        }
    }
    
    loadSounds(soundsConfig) {
        // Load all sounds from the provided configuration
        for (const [key, path] of Object.entries(soundsConfig)) {
            const sound = new Audio(path);
            this.sounds[key] = sound;
        }
        
        // Set up background music
        if (this.sounds.backgroundMusic) {
            this.backgroundMusic = this.sounds.backgroundMusic;
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.3;
        }
        
        // Set up police radio sounds
        if (this.sounds.policeRadio1 && this.sounds.policeRadio2) {
            this.policeRadioSound1 = this.sounds.policeRadio1;
            this.policeRadioSound2 = this.sounds.policeRadio2;
            this.policeRadioSound1.volume = 0.4;
            this.policeRadioSound2.volume = 0.4;
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        // Save sound preference to localStorage
        localStorage.setItem('soundEnabled', this.soundEnabled);
        
        // Update sound toggle button appearance
        if (this.soundToggleElement) {
            if (this.soundEnabled) {
                this.soundToggleElement.textContent = '🔊';
                this.soundToggleElement.classList.remove('muted');
                // Resume background music if game is started
                if (this.game.gameStarted && !this.game.gameOver) {
                    this.backgroundMusic.play().catch(e => console.warn('Could not play background music:', e));
                }
            } else {
                this.soundToggleElement.textContent = '🔇';
                this.soundToggleElement.classList.add('muted');
                // Pause background music
                this.backgroundMusic.pause();
            }
        }
        
        console.log(`Sound ${this.soundEnabled ? 'enabled' : 'disabled'}`);
    }
    
    playSound(soundKey, volume = 0.5) {
        if (!this.soundEnabled || !this.sounds[soundKey]) return;
        
        try {
            const sound = this.sounds[soundKey].cloneNode();
            sound.volume = volume;
            sound.play();
        } catch (e) {
            console.warn(`Could not play ${soundKey} sound:`, e);
        }
    }
    
    playBackgroundMusic() {
        if (!this.soundEnabled || !this.backgroundMusic) return;
        
        try {
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic.play().catch(e => console.warn('Could not play background music:', e));
        } catch (e) {
            console.warn('Could not play background music:', e);
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
    
    playPoliceRadio() {
        if (!this.soundEnabled) return;
        
        try {
            // Alternate between the two radio sounds
            if (this.currentPoliceRadioIndex === 0) {
                this.policeRadioSound1.currentTime = 0;
                this.policeRadioSound1.play();
                this.currentPoliceRadioIndex = 1;
            } else {
                this.policeRadioSound2.currentTime = 0;
                this.policeRadioSound2.play();
                this.currentPoliceRadioIndex = 0;
            }
            
            // Set a new random interval for the next radio sound
            this.policeRadioInterval = this.getRandomInterval(30000, 45000);
        } catch (e) {
            console.warn('Could not play police radio sound:', e);
        }
    }
    
    playAlienWhisper() {
        if (!this.soundEnabled) return;
        
        try {
            // Choose a random whisper sound (1-3)
            const randomWhisper = Math.floor(Math.random() * 3) + 1;
            const whisperSound = this.sounds[`alienWhisper${randomWhisper}`];
            
            // Set appropriate volume
            whisperSound.volume = 0.7;
            
            // Reset playback position and play the sound
            whisperSound.currentTime = 0;
            whisperSound.play();
        } catch (e) {
            console.warn('Could not play alien whisper sound:', e);
        }
    }
    
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

export default SoundManager; 