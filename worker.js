// Worker для обработки дешифрования
class VigenereWorker {
    constructor() {
        this.frequencyTable = this.buildFrequencyTable();
        this.initializeListeners();
    }
    
    buildFrequencyTable() {
        return {
            'a': 0.08167, 'b': 0.01492, 'c': 0.02782, 'd': 0.04253,
            'e': 0.12702, 'f': 0.02228, 'g': 0.02015, 'h': 0.06094,
            'i': 0.06966, 'j': 0.00153, 'k': 0.00772, 'l': 0.04025,
            'm': 0.02406, 'n': 0.06749, 'o': 0.07507, 'p': 0.01929,
            'q': 0.00095, 'r': 0.05987, 's': 0.06327, 't': 0.09056,
            'u': 0.02758, 'v': 0.00978, 'w': 0.02360, 'x': 0.00150,
            'y': 0.01974, 'z': 0.00074
        };
    }
    
    initializeListeners() {
        self.onmessage = async (e) => {
            const { type, ciphertext, key } = e.data;
            
            if (type === 'DECRYPT') {
                try {
                    const decrypted = this.decrypt(ciphertext, key);
                    const score = this.scoreText(decrypted);
                    
                    self.postMessage({
                        type: 'RESULT',
                        result: {
                            key,
                            decrypted,
                            score
                        }
                    });
                    
                    // Периодическая отправка прогресса
                    if (Math.random() < 0.1) {
                        self.postMessage({
                            type: 'PROGRESS',
                            progress: Math.random() * 100
                        });
                    }
                } catch (error) {
                    self.postMessage({
                        type: 'ERROR',
                        error: error.message
                    });
                }
            }
        };
    }
    
    decrypt(ciphertext, key) {
        let result = '';
        const keyLen = key.length;
        const lowerA = 'a'.charCodeAt(0);
        const upperA = 'A'.charCodeAt(0);
        
        for (let i = 0; i < ciphertext.length; i++) {
            const char = ciphertext.charCodeAt(i);
            const keyChar = key.charCodeAt(i % keyLen) - lowerA;
            
            if (char >= lowerA && char <= lowerA + 25) {
                result += String.fromCharCode(((char - lowerA - keyChar + 26) % 26) + lowerA);
            } else if (char >= upperA && char <= upperA + 25) {
                result += String.fromCharCode(((char - upperA - keyChar + 26) % 26) + upperA);
            } else {
                result += ciphertext[i];
            }
        }
        
        return result;
    }
    
    scoreText(text) {
        // Частотный анализ
        const counts = {};
        let total = 0;
        
        for (const char of text.toLowerCase()) {
            if (/[a-z]/.test(char)) {
                counts[char] = (counts[char] || 0) + 1;
                total++;
            }
        }
        
        let score = 0;
        for (const char in counts) {
            const expected = this.frequencyTable[char] || 0;
            const observed = counts[char] / total;
            score += Math.abs(expected - observed);
        }
        
        // Нормализация (меньше = лучше)
        return 1 - (score / 26);
    }
}

// Запуск worker'а
new VigenereWorker();
