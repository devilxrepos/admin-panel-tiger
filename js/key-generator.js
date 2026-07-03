/**
 * Tiger License Key Generator
 * Advanced key generation system with multiple algorithms and security features
 */

class LicenseKeyGenerator {
    constructor() {
        this.PACKAGE_NAME = "com.Tiger349x.hack.demo";
        this.APP_NAME = "Tiger";
        
        // Key generation algorithms
        this.algorithms = {
            STANDARD: 'standard',    // Basic format
            SECURE: 'secure',        // With checksum
            PREMIUM: 'premium',      // Enhanced security
            ENCRYPTED: 'encrypted'   // AES encrypted
        };
        
        // Key types and their properties
        this.keyTypes = {
            trial: {
                name: 'Trial',
                duration: 7, // days
                prefix: 'TIGERT',
                segments: 4,
                segmentLength: 4,
                algorithm: this.algorithms.STANDARD
            },
            premium: {
                name: 'Premium',
                duration: 30, // days
                prefix: 'TIGERP',
                segments: 5,
                segmentLength: 4,
                algorithm: this.algorithms.SECURE
            },
            lifetime: {
                name: 'Lifetime',
                duration: 36500, // ~100 years
                prefix: 'TIGERL',
                segments: 6,
                segmentLength: 4,
                algorithm: this.algorithms.PREMIUM
            },
            enterprise: {
                name: 'Enterprise',
                duration: 365, // 1 year
                prefix: 'TIGERE',
                segments: 5,
                segmentLength: 5,
                algorithm: this.algorithms.ENCRYPTED
            },
            custom: {
                name: 'Custom',
                duration: 0, // specified by user
                prefix: 'TIGERC',
                segments: 4,
                segmentLength: 4,
                algorithm: this.algorithms.STANDARD
            }
        };
        
        // Character sets for key generation
        this.charSets = {
            alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            numeric: '0123456789',
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            mixed: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Removed ambiguous chars
            hex: '0123456789ABCDEF'
        };
        
        // Security salt (should be stored securely in production)
        this.secretSalt = 'Tiger349xHack2024SecureSalt';
    }
    
    /**
     * Generate a single license key
     * @param {string} type - Key type (trial, premium, lifetime, etc.)
     * @param {string} customPrefix - Optional custom prefix
     * @returns {object} Generated key object
     */
    generateKey(type = 'trial', customPrefix = null) {
        const keyConfig = this.keyTypes[type];
        const prefix = customPrefix || keyConfig.prefix;
        
        let licenseKey;
        
        switch (keyConfig.algorithm) {
            case this.algorithms.SECURE:
                licenseKey = this.generateSecureKey(prefix, keyConfig);
                break;
            case this.algorithms.PREMIUM:
                licenseKey = this.generatePremiumKey(prefix, keyConfig);
                break;
            case this.algorithms.ENCRYPTED:
                licenseKey = this.generateEncryptedKey(prefix, keyConfig);
                break;
            default:
                licenseKey = this.generateStandardKey(prefix, keyConfig);
        }
        
        // Add metadata
        const keyData = {
            key: licenseKey,
            type: type,
            algorithm: keyConfig.algorithm,
            generated: new Date().toISOString(),
            expires: this.calculateExpiration(keyConfig.duration),
            checksum: this.calculateChecksum(licenseKey),
            isValid: true
        };
        
        return keyData;
    }
    
    /**
     * Generate standard format key
     */
    generateStandardKey(prefix, config) {
        const chars = this.charSets.mixed;
        const segments = [];
        
        for (let i = 0; i < config.segments; i++) {
            segments.push(this.generateSegment(chars, config.segmentLength));
        }
        
        return `${prefix}-${segments.join('-')}`;
    }
    
    /**
     * Generate secure key with embedded checksum
     */
    generateSecureKey(prefix, config) {
        const chars = this.charSets.mixed;
        const segments = [];
        
        // Generate main segments
        for (let i = 0; i < config.segments - 1; i++) {
            segments.push(this.generateSegment(chars, config.segmentLength));
        }
        
        // Generate checksum segment
        const partialKey = `${prefix}-${segments.join('-')}`;
        const checksum = this.generateChecksumSegment(partialKey, config.segmentLength);
        segments.push(checksum);
        
        return `${prefix}-${segments.join('-')}`;
    }
    
    /**
     * Generate premium key with timestamp and version
     */
    generatePremiumKey(prefix, config) {
        const chars = this.charSets.mixed;
        const segments = [];
        
        // Version segment
        const version = this.generateVersionSegment();
        segments.push(version);
        
        // Timestamp segment (encoded)
        const timestamp = this.generateTimestampSegment();
        segments.push(timestamp);
        
        // Random segments
        for (let i = 0; i < config.segments - 3; i++) {
            segments.push(this.generateSegment(chars, config.segmentLength));
        }
        
        // Validation segment
        const partialKey = `${prefix}-${segments.join('-')}`;
        const validation = this.generateValidationSegment(partialKey, config.segmentLength);
        segments.push(validation);
        
        return `${prefix}-${segments.join('-')}`;
    }
    
    /**
     * Generate encrypted key
     */
    generateEncryptedKey(prefix, config) {
        // Create payload
        const payload = {
            timestamp: Date.now(),
            random: this.generateSegment(this.charSets.mixed, 8),
            type: 'enterprise'
        };
        
        // Encrypt payload
        const encrypted = this.simpleEncrypt(JSON.stringify(payload));
        
        // Format encrypted data into segments
        const segmentLength = config.segmentLength;
        const encryptedSegments = [];
        
        for (let i = 0; i < encrypted.length; i += segmentLength) {
            encryptedSegments.push(encrypted.substr(i, segmentLength).toUpperCase());
        }
        
        // Take only required number of segments
        const finalSegments = encryptedSegments.slice(0, config.segments);
        
        return `${prefix}-${finalSegments.join('-')}`;
    }
    
    /**
     * Generate a random segment
     */
    generateSegment(chars, length) {
        let segment = '';
        const charsLength = chars.length;
        
        // Use crypto API if available for better randomness
        if (window.crypto && window.crypto.getRandomValues) {
            const randomValues = new Uint32Array(length);
            window.crypto.getRandomValues(randomValues);
            
            for (let i = 0; i < length; i++) {
                segment += chars[randomValues[i] % charsLength];
            }
        } else {
            // Fallback to Math.random()
            for (let i = 0; i < length; i++) {
                segment += chars.charAt(Math.floor(Math.random() * charsLength));
            }
        }
        
        return segment;
    }
    
    /**
     * Generate checksum segment
     */
    generateChecksumSegment(data, length) {
        const checksum = this.calculateChecksum(data);
        const chars = this.charSets.mixed;
        let segment = '';
        
        for (let i = 0; i < length; i++) {
            const index = (checksum.charCodeAt(i % checksum.length) + i) % chars.length;
            segment += chars[index];
        }
        
        return segment;
    }
    
    /**
     * Generate version segment
     */
    generateVersionSegment() {
        const version = '1';
        const major = Math.floor(Math.random() * 10);
        const minor = Math.floor(Math.random() * 10);
        const build = Math.floor(Math.random() * 100);
        
        return `V${version}${major}${minor}${build.toString().padStart(2, '0')}`;
    }
    
    /**
     * Generate timestamp segment
     */
    generateTimestampSegment() {
        const now = Date.now();
        const encoded = this.encodeTimestamp(now);
        return encoded.substring(0, 4).toUpperCase();
    }
    
    /**
     * Generate validation segment
     */
    generateValidationSegment(data, length) {
        const hash = this.simpleHash(data + this.secretSalt);
        return hash.substring(0, length).toUpperCase();
    }
    
    /**
     * Calculate expiration date
     */
    calculateExpiration(durationDays) {
        if (durationDays === 0) return 'never';
        
        const now = new Date();
        const expiration = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        return expiration.toISOString();
    }
    
    /**
     * Calculate checksum for a key
     */
    calculateChecksum(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).toUpperCase();
    }
    
    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).toUpperCase();
    }
    
    /**
     * Simple encryption (for demonstration - use proper encryption in production)
     */
    simpleEncrypt(text) {
        let result = '';
        const salt = this.secretSalt;
        
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
            result += String.fromCharCode(charCode);
        }
        
        return btoa(result).replace(/[=+\/]/g, '');
    }
    
    /**
     * Encode timestamp into a short string
     */
    encodeTimestamp(timestamp) {
        const base36 = timestamp.toString(36).toUpperCase();
        return base36;
    }
    
    /**
     * Validate a license key format
     */
    validateKeyFormat(key) {
        // Basic format validation
        const keyRegex = /^[A-Z0-9]+-[A-Z0-9]+(-[A-Z0-9]+)+$/;
        return keyRegex.test(key);
    }
    
    /**
     * Verify key checksum
     */
    verifyKeyChecksum(key) {
        const parts = key.split('-');
        const prefix = parts[0];
        const segments = parts.slice(1, -1);
        const checksum = parts[parts.length - 1];
        
        const partialKey = `${prefix}-${segments.join('-')}`;
        const calculatedChecksum = this.generateChecksumSegment(partialKey, checksum.length);
        
        return checksum === calculatedChecksum;
    }
    
    /**
     * Decode key metadata
     */
    decodeKeyMetadata(key) {
        const metadata = {
            prefix: '',
            type: 'unknown',
            version: null,
            timestamp: null,
            isValidFormat: this.validateKeyFormat(key)
        };
        
        if (!metadata.isValidFormat) {
            return metadata;
        }
        
        const parts = key.split('-');
        metadata.prefix = parts[0];
        
        // Determine type from prefix
        for (const [type, config] of Object.entries(this.keyTypes)) {
            if (parts[0].startsWith(config.prefix.replace('-', ''))) {
                metadata.type = type;
                break;
            }
        }
        
        // Extract version if present
        if (parts[1] && parts[1].startsWith('V')) {
            metadata.version = parts[1];
            metadata.timestamp = parts[2] ? this.decodeTimestamp(parts[2]) : null;
        }
        
        return metadata;
    }
    
    /**
     * Decode timestamp from segment
     */
    decodeTimestamp(segment) {
        try {
            const decoded = parseInt(segment, 36);
            return new Date(decoded).toISOString();
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Batch generate keys
     */
    generateBatchKeys(type, count, customPrefix = null) {
        const keys = [];
        const generatedKeys = new Set(); // Prevent duplicates
        
        for (let i = 0; i < count; i++) {
            let keyData;
            let attempts = 0;
            const maxAttempts = 10;
            
            // Try to generate unique key
            do {
                keyData = this.generateKey(type, customPrefix);
                attempts++;
                
                if (attempts >= maxAttempts) {
                    console.warn('Max attempts reached for unique key generation');
                    break;
                }
            } while (generatedKeys.has(keyData.key));
            
            if (!generatedKeys.has(keyData.key)) {
                generatedKeys.add(keyData.key);
                keys.push(keyData);
            }
        }
        
        return keys;
    }
    
    /**
     * Export keys in various formats
     */
    exportKeys(keys, format = 'json') {
        switch (format) {
            case 'csv':
                return this.exportToCSV(keys);
            case 'txt':
                return this.exportToText(keys);
            case 'json':
            default:
                return JSON.stringify(keys, null, 2);
        }
    }
    
    /**
     * Export keys as CSV
     */
    exportToCSV(keys) {
        const headers = ['License Key', 'Type', 'Algorithm', 'Generated', 'Expires', 'Checksum', 'Status'];
        const rows = keys.map(key => [
            key.key,
            key.type,
            key.algorithm,
            key.generated,
            key.expires,
            key.checksum,
            'Active'
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        return csvContent;
    }
    
    /**
     * Export keys as plain text
     */
    exportToText(keys) {
        return keys.map(key => key.key).join('\n');
    }
    
    /**
     * Mask key for display (show only part of the key)
     */
    maskKey(key, visibleChars = 8) {
        if (key.length <= visibleChars) return key;
        
        const parts = key.split('-');
        const firstPart = parts[0];
        const lastPart = parts[parts.length - 1];
        
        const maskedParts = parts.slice(1, -1).map(() => '****');
        
        return `${firstPart}-${maskedParts.join('-')}-${lastPart}`;
    }
    
    /**
     * Generate key statistics
     */
    generateStats(keys) {
        const stats = {
            total: keys.length,
            byType: {},
            byAlgorithm: {},
            uniqueKeys: new Set(keys.map(k => k.key)).size,
            averageLength: 0
        };
        
        let totalLength = 0;
        
        keys.forEach(key => {
            // Count by type
            stats.byType[key.type] = (stats.byType[key.type] || 0) + 1;
            
            // Count by algorithm
            stats.byAlgorithm[key.algorithm] = (stats.byAlgorithm[key.algorithm] || 0) + 1;
            
            // Calculate average length
            totalLength += key.key.length;
        });
        
        stats.averageLength = keys.length > 0 ? Math.round(totalLength / keys.length) : 0;
        
        return stats;
    }
}

// Initialize global key generator instance
const keyGenerator = new LicenseKeyGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseKeyGenerator;
}