const fs = require('fs');
const path = require('path');

// Simple WAV file generator
function generateWAV(frequency, duration, volume = 0.3) {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bytesPerSample = 2;

    // WAV header
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * numChannels * bytesPerSample, 4);
    header.write('WAVE', 8);

    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
    header.writeUInt16LE(numChannels * bytesPerSample, 32);
    header.writeUInt16LE(bytesPerSample * 8, 34);

    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(numSamples * numChannels * bytesPerSample, 40);

    // Generate samples
    const samples = Buffer.alloc(numSamples * bytesPerSample);
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let value;

        if (Array.isArray(frequency)) {
            // Multiple frequencies (chord)
            value = 0;
            for (const freq of frequency) {
                value += Math.sin(2 * Math.PI * freq * t);
            }
            value /= frequency.length;
        } else {
            // Single frequency
            value = Math.sin(2 * Math.PI * frequency * t);
        }

        // Apply envelope (fade in/out to avoid clicks)
        const envelope = Math.min(
            1,
            Math.min(i / (sampleRate * 0.01), (numSamples - i) / (sampleRate * 0.01))
        );

        value *= volume * envelope;
        const sample = Math.floor(value * 32767);
        samples.writeInt16LE(sample, i * bytesPerSample);
    }

    return Buffer.concat([header, samples]);
}

// Generate ascending tone (success) with specified base note frequency
function generateSuccess(baseFrequency = 261.63) {
    const sampleRate = 44100;
    const duration = 0.15;
    const numSamples = Math.floor(sampleRate * duration);
    const bytesPerSample = 2;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * bytesPerSample, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * bytesPerSample, 28);
    header.writeUInt16LE(bytesPerSample, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(numSamples * bytesPerSample, 40);

    const samples = Buffer.alloc(numSamples * bytesPerSample);
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const progress = i / numSamples;
        // Sweep up from base frequency (creates ascending chirp effect)
        const freq = baseFrequency + (progress * baseFrequency * 0.5);
        const value = Math.sin(2 * Math.PI * freq * t);
        const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (numSamples - i) / (sampleRate * 0.02)));
        const sample = Math.floor(value * 0.3 * envelope * 32767);
        samples.writeInt16LE(sample, i * bytesPerSample);
    }

    return Buffer.concat([header, samples]);
}

// Generate descending tone (error)
function generateError() {
    const sampleRate = 44100;
    const duration = 0.1;
    const numSamples = Math.floor(sampleRate * duration);
    const bytesPerSample = 2;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * bytesPerSample, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * bytesPerSample, 28);
    header.writeUInt16LE(bytesPerSample, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(numSamples * bytesPerSample, 40);

    const samples = Buffer.alloc(numSamples * bytesPerSample);
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const progress = i / numSamples;
        const freq = 300 - (progress * 100); // 300Hz -> 200Hz
        const value = Math.sin(2 * Math.PI * freq * t);
        const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (numSamples - i) / (sampleRate * 0.02)));
        const sample = Math.floor(value * 0.25 * envelope * 32767);
        samples.writeInt16LE(sample, i * bytesPerSample);
    }

    return Buffer.concat([header, samples]);
}

// Generate victory chord
function generateVictory() {
    const sampleRate = 44100;
    const duration = 0.5;
    const numSamples = Math.floor(sampleRate * duration);
    const bytesPerSample = 2;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * bytesPerSample, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * bytesPerSample, 28);
    header.writeUInt16LE(bytesPerSample, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(numSamples * bytesPerSample, 40);

    const samples = Buffer.alloc(numSamples * bytesPerSample);
    // C major chord: C5(523), E5(659), G5(784)
    const frequencies = [523, 659, 784];

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let value = 0;
        for (const freq of frequencies) {
            value += Math.sin(2 * Math.PI * freq * t);
        }
        value /= frequencies.length;

        const envelope = Math.min(1, Math.min(i / (sampleRate * 0.02), (numSamples - i) / (sampleRate * 0.1)));
        const sample = Math.floor(value * 0.35 * envelope * 32767);
        samples.writeInt16LE(sample, i * bytesPerSample);
    }

    return Buffer.concat([header, samples]);
}

// Generate short tick (letter spawn) with specified frequency
function generateTick(frequency = 1200) {
    const sampleRate = 44100;
    const duration = 0.03;
    const numSamples = Math.floor(sampleRate * duration);
    const bytesPerSample = 2;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + numSamples * bytesPerSample, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * bytesPerSample, 28);
    header.writeUInt16LE(bytesPerSample, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(numSamples * bytesPerSample, 40);

    const samples = Buffer.alloc(numSamples * bytesPerSample);
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const value = Math.sin(2 * Math.PI * frequency * t);
        const envelope = Math.max(0, 1 - (i / numSamples));
        const sample = Math.floor(value * 0.15 * envelope * 32767);
        samples.writeInt16LE(sample, i * bytesPerSample);
    }

    return Buffer.concat([header, samples]);
}

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir);
}

// Generate all sounds
console.log('Generating sound files...');

// Chromatic scale starting from C4 (30 semitones)
// C4, C#4, D4, D#4, E4, F4, F#4, G4, G#4, A4, A#4, B4, C5, etc.
const chromaticScale = [
    261.63, // C4
    277.18, // C#4/Db4
    293.66, // D4
    311.13, // D#4/Eb4
    329.63, // E4
    349.23, // F4
    369.99, // F#4/Gb4
    392.00, // G4
    415.30, // G#4/Ab4
    440.00, // A4
    466.16, // A#4/Bb4
    493.88, // B4
    523.25, // C5
    554.37, // C#5/Db5
    587.33, // D5
    622.25, // D#5/Eb5
    659.25, // E5
    698.46, // F5
    739.99, // F#5/Gb5
    783.99, // G5
    830.61, // G#5/Ab5
    880.00, // A5
    932.33, // A#5/Bb5
    987.77, // B5
    1046.50, // C6
    1108.73, // C#6/Db6
    1174.66, // D6
    1244.51, // D#6/Eb6
    1318.51, // E6
    1396.91  // F6
];

// Generate 30 success sounds with chromatic scale
for (let i = 0; i < 30; i++) {
    fs.writeFileSync(path.join(soundsDir, `success${i}.wav`), generateSuccess(chromaticScale[i]));
}
console.log('✓ Generated 30 success sounds (success0.wav - success29.wav) using chromatic scale from C4 to F6');

fs.writeFileSync(path.join(soundsDir, 'error.wav'), generateError());
console.log('✓ Generated error.wav');

fs.writeFileSync(path.join(soundsDir, 'victory.wav'), generateVictory());
console.log('✓ Generated victory.wav');

// Generate two tick sounds with different pitches for tik-tok effect
fs.writeFileSync(path.join(soundsDir, 'tick1.wav'), generateTick(1000)); // Lower pitch "tik"
fs.writeFileSync(path.join(soundsDir, 'tick2.wav'), generateTick(1400)); // Higher pitch "tok"
console.log('✓ Generated tick1.wav and tick2.wav');

console.log('\nAll sound files generated successfully!');
