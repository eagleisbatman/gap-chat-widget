/**
 * Location Manager for FarmerChat
 * Handles browser geolocation with East Africa validation
 */

// Default coordinates (Nairobi, Kenya)
const DEFAULT_COORDINATES = {
    latitude: -1.2864,
    longitude: 36.8172,
    source: 'default',
    location: 'Nairobi, Kenya'
};

// East Africa coverage area bounds
const COVERAGE_BOUNDS = {
    minLat: -12.0,  // Southern Tanzania
    maxLat: 18.0,   // Northern Ethiopia/Somalia
    minLon: 29.0,   // Western Uganda
    maxLon: 52.0    // Eastern Somalia
};

// LocalStorage keys
const STORAGE_KEYS = {
    COORDINATES: 'farmerchat-coordinates',
    TIMESTAMP: 'farmerchat-location-timestamp',
    PERMISSION_ASKED: 'farmerchat-location-asked'
};

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Location Manager Class
 */
class LocationManager {
    constructor() {
        this.coordinates = null;
        this.permissionAsked = this.hasAskedPermission();
    }

    /**
     * Check if geolocation is supported
     */
    isGeolocationSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * Check if we've previously asked for permission
     */
    hasAskedPermission() {
        return localStorage.getItem(STORAGE_KEYS.PERMISSION_ASKED) === 'true';
    }

    /**
     * Mark that we've asked for permission
     */
    markPermissionAsked() {
        localStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');
        this.permissionAsked = true;
    }

    /**
     * Check if coordinates are within East Africa coverage area
     */
    isInCoverageArea(latitude, longitude) {
        return (
            latitude >= COVERAGE_BOUNDS.minLat &&
            latitude <= COVERAGE_BOUNDS.maxLat &&
            longitude >= COVERAGE_BOUNDS.minLon &&
            longitude <= COVERAGE_BOUNDS.maxLon
        );
    }

    /**
     * Get cached coordinates if still valid
     */
    getCachedCoordinates() {
        try {
            const coordsStr = localStorage.getItem(STORAGE_KEYS.COORDINATES);
            const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

            if (!coordsStr || !timestamp) {
                return null;
            }

            const age = Date.now() - parseInt(timestamp, 10);
            if (age > CACHE_DURATION) {
                // Cache expired
                this.clearCache();
                return null;
            }

            return JSON.parse(coordsStr);
        } catch (error) {
            console.error('[Location] Error reading cache:', error);
            return null;
        }
    }

    /**
     * Save coordinates to cache
     */
    saveToCache(coordinates) {
        try {
            localStorage.setItem(STORAGE_KEYS.COORDINATES, JSON.stringify(coordinates));
            localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
        } catch (error) {
            console.error('[Location] Error saving to cache:', error);
        }
    }

    /**
     * Clear cached coordinates
     */
    clearCache() {
        localStorage.removeItem(STORAGE_KEYS.COORDINATES);
        localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    }

    /**
     * Get approximate location name from coordinates (simplified)
     */
    getLocationName(latitude, longitude) {
        // Simplified country detection for East Africa
        if (latitude >= -4.5 && latitude <= 5.0 && longitude >= 33.5 && longitude <= 42.0) {
            return 'Kenya';
        } else if (latitude >= -12.0 && latitude <= -1.0 && longitude >= 29.5 && longitude <= 40.5) {
            return 'Tanzania';
        } else if (latitude >= -1.5 && latitude <= 4.5 && longitude >= 29.5 && longitude <= 35.0) {
            return 'Uganda';
        } else if (latitude >= 3.0 && latitude <= 15.0 && longitude >= 32.0 && longitude <= 48.0) {
            return 'Ethiopia';
        } else if (latitude >= -2.0 && latitude <= 12.0 && longitude >= 41.0 && longitude <= 52.0) {
            return 'Somalia';
        }
        return 'East Africa';
    }

    /**
     * Request user's current location
     */
    async requestLocation(options = {}) {
        const { timeout = 10000, showUI = true } = options;

        console.log('[Location] Requesting user location...');

        // Check if geolocation is supported
        if (!this.isGeolocationSupported()) {
            console.warn('[Location] Geolocation not supported');
            if (showUI) {
                this.showNotification('Your browser doesn\'t support location services. Using demo location.', 'warning');
            }
            return this.useDefaultCoordinates();
        }

        // Check cache first
        const cached = this.getCachedCoordinates();
        if (cached) {
            console.log('[Location] Using cached coordinates:', cached);
            this.coordinates = cached;
            return cached;
        }

        // Mark that we're asking for permission
        this.markPermissionAsked();

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        timeout,
                        maximumAge: 0,
                        enableHighAccuracy: false // Faster, battery-friendly
                    }
                );
            });

            const { latitude, longitude } = position.coords;
            console.log('[Location] Got coordinates:', { latitude, longitude });

            // Check if within coverage area
            if (!this.isInCoverageArea(latitude, longitude)) {
                console.warn('[Location] Coordinates outside coverage area:', { latitude, longitude });
                console.warn('[Location] Coverage area:', COVERAGE_BOUNDS);
                if (showUI) {
                    this.showNotification(
                        'Your location is outside our East Africa coverage area. Using Nairobi demo location for testing.',
                        'warning'
                    );
                }
                return this.useDefaultCoordinates();
            }

            // Valid coordinates in coverage area
            const locationName = this.getLocationName(latitude, longitude);
            const coordinates = {
                latitude,
                longitude,
                source: 'user',
                location: locationName,
                accuracy: position.coords.accuracy
            };

            // Save to cache
            this.saveToCache(coordinates);
            this.coordinates = coordinates;

            if (showUI) {
                this.showNotification(
                    `Using your location in ${locationName} for accurate weather forecasts.`,
                    'success'
                );
            }

            console.log('[Location] Successfully obtained user location:', coordinates);
            return coordinates;

        } catch (error) {
            console.warn('[Location] Error getting location:', error.message);

            // Handle different error types
            let message = 'Unable to get your location. Using Nairobi demo location.';

            if (error.code === 1) {
                // Permission denied
                message = 'Location permission denied. Using Nairobi demo location for testing.';
            } else if (error.code === 2) {
                // Position unavailable
                message = 'Location unavailable. Using Nairobi demo location.';
            } else if (error.code === 3) {
                // Timeout
                message = 'Location request timed out. Using Nairobi demo location.';
            }

            if (showUI) {
                this.showNotification(message, 'warning');
            }

            return this.useDefaultCoordinates();
        }
    }

    /**
     * Use default coordinates (Nairobi)
     */
    useDefaultCoordinates() {
        console.log('[Location] Using default coordinates (Nairobi)');
        this.coordinates = DEFAULT_COORDINATES;
        this.saveToCache(DEFAULT_COORDINATES);
        return DEFAULT_COORDINATES;
    }

    /**
     * Get current coordinates (from cache or default)
     */
    getCurrentCoordinates() {
        if (this.coordinates) {
            return this.coordinates;
        }

        const cached = this.getCachedCoordinates();
        if (cached) {
            this.coordinates = cached;
            return cached;
        }

        return this.useDefaultCoordinates();
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `location-notification location-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Show location permission dialog
     */
    showPermissionDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'location-dialog-overlay';
            dialog.innerHTML = `
                <div class="location-dialog">
                    <div class="location-dialog-header">
                        <h3>📍 Get Accurate Weather for Your Farm</h3>
                    </div>
                    <div class="location-dialog-body">
                        <p>Share your location to receive:</p>
                        <ul>
                            <li>✅ Precise weather forecasts for your area</li>
                            <li>✅ Better planting recommendations</li>
                            <li>✅ Accurate irrigation schedules</li>
                        </ul>
                        <p class="privacy-note">
                            <small>ℹ️ We only use your location for weather data. It's not stored on our servers.</small>
                        </p>
                    </div>
                    <div class="location-dialog-actions">
                        <button class="btn-secondary" id="useDemoLocation">
                            Use Demo Location (Nairobi)
                        </button>
                        <button class="btn-primary" id="shareLocation">
                            📍 Share My Location
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
            setTimeout(() => dialog.classList.add('show'), 10);

            // Handle button clicks
            dialog.querySelector('#shareLocation').addEventListener('click', async () => {
                dialog.remove();
                const coords = await this.requestLocation({ showUI: true });
                resolve(coords);
            });

            dialog.querySelector('#useDemoLocation').addEventListener('click', () => {
                dialog.remove();
                this.markPermissionAsked();
                const coords = this.useDefaultCoordinates();
                this.showNotification('Using Nairobi demo location for testing.', 'info');
                resolve(coords);
            });
        });
    }

    /**
     * Initialize location manager
     */
    async initialize(options = {}) {
        const { askPermission = true, showUI = true } = options;

        console.log('[Location] Initializing location manager...');

        // Check cache first
        const cached = this.getCachedCoordinates();
        if (cached) {
            console.log('[Location] Using cached coordinates');
            this.coordinates = cached;
            return cached;
        }

        // If we haven't asked permission and should ask, show dialog
        if (askPermission && !this.permissionAsked) {
            return await this.showPermissionDialog();
        }

        // Otherwise, try to get location silently or use default
        return await this.requestLocation({ showUI });
    }
}

// Create singleton instance
const locationManager = new LocationManager();

// Export for use in other scripts
window.locationManager = locationManager;
