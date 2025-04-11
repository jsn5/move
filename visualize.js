/**
 * Visualization helper for rendering dance poses on canvas with 2D sprites
 */
class PoseVisualizer {
    /**
     * Initialize the pose visualizer
     * @param {HTMLCanvasElement} canvas - Canvas element for drawing
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Default settings
        this.settings = {
            keypoint: {
                radius: 5,
                color: '#e74c3c',
                highlightColor: '#f39c12'
            },
            connection: {
                lineWidth: 3,
                color: '#3498db'
            },
            sprite: {
                color: '#3498db',
                headColor: '#e67e22'
            },
            glow: {
                color: '#00ffff',
                jointColor: '#ff00ff',
                shadowBlur: 15
            },
            background: '#111'
        };
        
        // Visualization mode is now fixed to 'glowMotion'
        this._visualizationMode = 'glowMotion';
        
        // Body part definitions (indices and connections)
        this.bodyParts = {
            head: { 
                keypoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Face keypoints
                center: 0 // Nose as center point
            },
            torso: {
                keypoints: [11, 12, 23, 24], // Shoulders and hips
                connections: [[11, 12], [12, 24], [24, 23], [23, 11]] // Torso outline
            },
            leftArm: {
                keypoints: [11, 13, 15], // Left shoulder, elbow, wrist
                connections: [[11, 13], [13, 15]]
            },
            rightArm: {
                keypoints: [12, 14, 16], // Right shoulder, elbow, wrist
                connections: [[12, 14], [14, 16]]
            },
            leftLeg: {
                keypoints: [23, 25, 27, 29, 31], // Left hip, knee, ankle, foot
                connections: [[23, 25], [25, 27], [27, 29], [29, 31]]
            },
            rightLeg: {
                keypoints: [24, 26, 28, 30, 32], // Right hip, knee, ankle, foot
                connections: [[24, 26], [26, 28], [28, 30], [30, 32]]
            }
        };
        
        // Keypoint connections for skeleton visualization (MediaPipe format)
        // IMPORTANT: Using the original connection structure from the skeleton mode
        this.connections = [
            // Face connections
            [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
            // Upper body connections
            [9, 10], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            // Lower body connections
            [11, 23], [12, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32]
        ];
        
        // Log initial state
        console.log("PoseVisualizer initialized");
    }
    
    // Getter for visualizationMode (always returns 'glowMotion')
    get visualizationMode() {
        return this._visualizationMode;
    }
    
    // Setter kept for compatibility
    set visualizationMode(newMode) {
        console.log("Visualization mode fixed to Glow Motion");
        this._visualizationMode = 'glowMotion';
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.settings.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * Draw a glowing connection between two keypoints
     * @param {number} x1 - X coordinate of the first keypoint
     * @param {number} y1 - Y coordinate of the first keypoint
     * @param {number} x2 - X coordinate of the second keypoint
     * @param {number} y2 - Y coordinate of the second keypoint
     * @param {number} lineWidth - Width of the line
     * @param {string} color - Color of the line
     */
    drawGlowingConnection(x1, y1, x2, y2, lineWidth = 5, color = this.settings.glow.color) {
        this.ctx.save();
        
        // Draw glow effect
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = lineWidth + 4; // Wider for glow
        this.ctx.strokeStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = this.settings.glow.shadowBlur;
        this.ctx.stroke();
        
        // Draw inner line (brighter core)
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = lineWidth * 0.6;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * Draw a glowing keypoint
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - Size of the keypoint
     * @param {string} color - Color of the keypoint
     */
    drawGlowingKeypoint(x, y, size = 8, color = this.settings.glow.jointColor) {
        this.ctx.save();
        
        // Draw outer glow
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = this.settings.glow.shadowBlur;
        this.ctx.fill();
        
        // Draw inner core (brighter)
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.6, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * Draw a glow skeleton visualization
     * @param {Array} keypoints - Normalized keypoint coordinates
     */
    drawGlowSkeleton(keypoints) {
        // Set dark background
        this.ctx.fillStyle = this.settings.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stylish background with subtle grid
        this.drawGlowBackground();
        
        // Draw glowing connections - using the ORIGINAL connection structure
        for (const [i, j] of this.connections) {
            if (i >= keypoints.length || j >= keypoints.length) continue;
            
            const [x1, y1] = keypoints[i];
            const [x2, y2] = keypoints[j];
            
            if (x1 === 0 && y1 === 0) continue;
            if (x2 === 0 && y2 === 0) continue;
            
            // Use different colors for different body parts
            let connectionColor;
            
            // Arms - cyan
            if ((i === 11 && j === 13) || (i === 13 && j === 15) || 
                (i === 12 && j === 14) || (i === 14 && j === 16)) {
                connectionColor = '#00ffff';
            } 
            // Legs - magenta
            else if ((i === 23 && j === 25) || (i === 25 && j === 27) || (i === 27 && j === 29) || (i === 29 && j === 31) ||
                     (i === 24 && j === 26) || (i === 26 && j === 28) || (i === 28 && j === 30) || (i === 30 && j === 32)) {
                connectionColor = '#ff00ff';
            }
            // Torso - yellow/gold
            else if ((i === 11 && j === 12) || (i === 11 && j === 23) || (i === 12 && j === 24)) {
                connectionColor = '#ffcc00';
            }
            // Face - green
            else if (i <= 10 && j <= 10) {
                connectionColor = '#00ff99';
            }
            // Default - blue
            else {
                connectionColor = '#3366ff';
            }
            
            this.drawGlowingConnection(x1, y1, x2, y2, 5, connectionColor);
        }
        
        // Draw glowing joints
        for (let i = 0; i < keypoints.length; i++) {
            const [x, y] = keypoints[i];
            if (x === 0 && y === 0) continue;
            
            // Only highlight key joints
            if ([0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32].includes(i)) {
                let jointColor;
                let jointSize = 5;
                
                // Head
                if (i === 0) {
                    jointColor = '#00ff99';
                    jointSize = 7;
                }
                // Shoulders and hips
                else if ([11, 12, 23, 24].includes(i)) {
                    jointColor = '#ffcc00';
                    jointSize = 6;
                }
                // Arms
                else if ([13, 14, 15, 16].includes(i)) {
                    jointColor = '#00ffff';
                    jointSize = 5;
                }
                // Legs
                else if ([25, 26, 27, 28, 31, 32].includes(i)) {
                    jointColor = '#ff00ff';
                    jointSize = 5;
                }
                
                this.drawGlowingKeypoint(x, y, jointSize, jointColor);
            }
        }
    }
    
    /**
     * Draw stylish background for glow effect
     */
    drawGlowBackground() {
        // Create radial gradient
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width
        );
        
        gradient.addColorStop(0, '#111');
        gradient.addColorStop(1, '#000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add subtle grid effect
        this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw a complete pose
     * @param {Array} keypoints - Array of keypoint coordinates [[x1, y1], [x2, y2], ...]
     * @param {boolean} normalize - Whether to normalize the coordinates to fit the canvas
     */
    drawPose(keypoints, normalize = true) {
        if (!keypoints || keypoints.length === 0) return;
        
        // Normalize coordinates if needed
        let normalizedKeypoints = keypoints;
        if (normalize) {
            normalizedKeypoints = this.normalizeCoordinates(keypoints);
        }
        
        // Draw the glow skeleton visualization (our only mode now)
        this.drawGlowSkeleton(normalizedKeypoints);
    }
    
    /**
     * Normalize keypoint coordinates to fit the canvas
     * @param {Array} keypoints - Array of keypoint coordinates [[x1, y1], [x2, y2], ...]
     * @returns {Array} - Normalized keypoints
     */
    normalizeCoordinates(keypoints) {
        if (!keypoints || keypoints.length === 0) return [];
        
        // Find the bounding box
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        for (const [x, y] of keypoints) {
            // Skip [0, 0] coordinates (usually indicates missing keypoints)
            if (x === 0 && y === 0) continue;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        
        // If no valid keypoints found, return the original
        if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
            return keypoints;
        }
        
        // Calculate scale and translation
        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;
        
        const scaleX = (this.width * 0.8) / boxWidth;
        const scaleY = (this.height * 0.8) / boxHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const translateX = (this.width - boxWidth * scale) / 2 - minX * scale;
        const translateY = (this.height - boxHeight * scale) / 2 - minY * scale;
        
        // Normalize keypoints
        const normalizedKeypoints = keypoints.map(([x, y]) => {
            // Skip [0, 0] coordinates
            if (x === 0 && y === 0) return [0, 0];
            
            const normalizedX = x * scale + translateX;
            const normalizedY = y * scale + translateY;
            
            return [normalizedX, normalizedY];
        });
        
        return normalizedKeypoints;
    }
    
    /**
     * Resize the canvas to maintain the aspect ratio
     */
    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Maintain aspect ratio (original is 4:3)
        const aspectRatio = 3 / 4;
        const newHeight = containerWidth * aspectRatio;
        
        this.canvas.width = containerWidth;
        this.canvas.height = newHeight;
        
        this.width = containerWidth;
        this.height = newHeight;
    }
}
