export function extractAudioAndAddWavHeader(base64Audio: string): string {
    const pcmData = Buffer.from(base64Audio, 'base64');
    const header = Buffer.alloc(44);
    
    const numChannels = 1;
    const sampleRate = 24000;
    const bytesPerSample = 2; // 16-bit
    const byteRate = sampleRate * numChannels * bytesPerSample;
    const blockAlign = numChannels * bytesPerSample;
    
    // "RIFF"
    header.write('RIFF', 0);
    // ChunkSize (36 + SubChunk2Size)
    header.writeUInt32LE(36 + pcmData.length, 4);
    // "WAVE"
    header.write('WAVE', 8);
    // "fmt "
    header.write('fmt ', 12);
    // Subchunk1Size (16 for PCM)
    header.writeUInt32LE(16, 16);
    // AudioFormat (1 for PCM)
    header.writeUInt16LE(1, 20);
    // NumChannels
    header.writeUInt16LE(numChannels, 22);
    // SampleRate
    header.writeUInt32LE(sampleRate, 24);
    // ByteRate
    header.writeUInt32LE(byteRate, 28);
    // BlockAlign
    header.writeUInt16LE(blockAlign, 32);
    // BitsPerSample
    header.writeUInt16LE(16, 34);
    // "data"
    header.write('data', 36);
    // Subchunk2Size
    header.writeUInt32LE(pcmData.length, 40);
    
    return Buffer.concat([header, pcmData]).toString('base64');
}
