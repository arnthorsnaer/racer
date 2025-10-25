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

// Generate ascending tone (success)
function generateSuccess() {
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
        const freq = 600 + (progress * 400); // 600Hz -> 1000Hz
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

// Generate short tick (letter spawn)
function generateTick() {
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
        const value = Math.sin(2 * Math.PI * 1200 * t);
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

fs.writeFileSync(path.join(soundsDir, 'success.wav'), generateSuccess());
console.log('✓ Generated success.wav');

fs.writeFileSync(path.join(soundsDir, 'error.wav'), generateError());
console.log('✓ Generated error.wav');

fs.writeFileSync(path.join(soundsDir, 'victory.wav'), generateVictory());
console.log('✓ Generated victory.wav');

fs.writeFileSync(path.join(soundsDir, 'tick.wav'), generateTick());
console.log('✓ Generated tick.wav');

console.log('\nAll sound files generated successfully!');
