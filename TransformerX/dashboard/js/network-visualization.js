// Network Visualization using Three.js
let scene, camera, renderer, controls;
let networkGroup, particleSystem;
let animationSpeed = 1;
let isAnimating = false;
let layerFilter = 'all';
let isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

// Visualization constants
const NODE_SIZE = 4;
const MIN_NODE_SIZE = 2;
const MAX_NODE_SIZE = 6;
const HIGHLIGHT_NODE_SIZE = 8;
const EDGE_OPACITY = 0.3;
const PARTICLE_COUNT = 300;
const PARTICLE_SIZE = 1.0;
const ANIMATION_SPEED_FACTOR = 0.003;

// Colors (light theme)
const COLORS = {
    background: { light: 0xf8fafc, dark: 0x0f172a },
    inputNode: 0x3b82f6,    // Blue
    encoderNode: 0x6366f1,  // Indigo
    attentionNode: 0x8b5cf6, // Purple
    decoderNode: 0xec4899,  // Pink
    outputNode: 0xf97316,   // Orange
    edge: { light: 0x94a3b8, dark: 0x475569 },
    particle: { light: 0x6366f1, dark: 0x818cf8 },
    highlight: 0x22c55e      // Green
};

// Network architecture definition
const NETWORK_ARCHITECTURE = {
    input: { nodes: 10, position: -60 },
    encoder: [
        { name: 'encoder1', nodes: 12, attention: 4, position: -40 },
        { name: 'encoder2', nodes: 12, attention: 4, position: -20 }
    ],
    decoder: [
        { name: 'decoder1', nodes: 12, attention: 4, position: 20 },
        { name: 'decoder2', nodes: 12, attention: 4, position: 40 }
    ],
    output: { nodes: 10, position: 60 }
};

// Initialize the visualization when DOM is ready
document.addEventListener('DOMContentLoaded', initNetworkVisualization);

// Respond to theme changes
window.addEventListener('themeChange', (e) => {
    isDarkTheme = e.detail.isDark;
    
    // Update scene background color
    if (scene) {
        scene.background = new THREE.Color(isDarkTheme ? COLORS.background.dark : COLORS.background.light);
    }
    
    // Update edges and particles
    if (networkGroup) {
        networkGroup.traverse(child => {
            if (child.type === 'Line' && child.material) {
                child.material.color.set(isDarkTheme ? COLORS.edge.dark : COLORS.edge.light);
            }
        });
    }
    
    if (particleSystem && particleSystem.material) {
        particleSystem.material.color.set(isDarkTheme ? COLORS.particle.dark : COLORS.particle.light);
    }
});

// Public interface for the network visualization
window.networkVisualization = {
    // Set the visibility of different layers
    setLayerVisibility: function(filter) {
        layerFilter = filter;
        updateLayerVisibility();
    },
    
    // Set the animation speed
    setAnimationSpeed: function(speed) {
        animationSpeed = speed;
        return animationSpeed;
    },
    
    // Toggle animation on/off
    toggleAnimation: function() {
        isAnimating = !isAnimating;
        return isAnimating;
    },
    
    // Reset the visualization
    resetView: function() {
        if (controls) {
            controls.reset();
        }
        
        if (networkGroup) {
            networkGroup.rotation.set(0, 0, 0);
        }
    }
};

// Initialize the visualization
function initNetworkVisualization() {
    const container = document.getElementById('network-visualization');
    if (!container) return;
    
    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkTheme ? COLORS.background.dark : COLORS.background.light);
    
    // Set up camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.z = 120;
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    
    // Create network
    createNetwork();
    
    // Create flowing particles
    createParticles();
    
    // Initialize animation and UI controls
    initControls();
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create the network structure
function createNetwork() {
    networkGroup = new THREE.Group();
    scene.add(networkGroup);
    
    // Create input layer
    const inputNodes = createLayer(
        NETWORK_ARCHITECTURE.input.nodes,
        NETWORK_ARCHITECTURE.input.position,
        COLORS.inputNode,
        'input'
    );
    
    // Create encoder layers
    let prevEncoderNodes = inputNodes;
    const encoderNodes = [];
    
    NETWORK_ARCHITECTURE.encoder.forEach((layer) => {
        // Create encoder nodes
        const nodes = createLayer(
            layer.nodes,
            layer.position,
            COLORS.encoderNode,
            'encoder'
        );
        
        // Create attention nodes
        const attentionNodes = createAttentionHeads(
            layer.attention,
            layer.position - 8,
            COLORS.attentionNode,
            'attention'
        );
        
        // Connect previous layer to this layer
        connectLayers(prevEncoderNodes, nodes);
        
        // Connect this layer to attention heads
        nodes.forEach(node => {
            attentionNodes.forEach(attn => {
                createEdge(node.position, attn.position);
            });
        });
        
        // Connect attention heads back to this layer
        attentionNodes.forEach(attn => {
            nodes.forEach(node => {
                createEdge(attn.position, node.position);
            });
        });
        
        encoderNodes.push(...nodes);
        prevEncoderNodes = nodes;
    });
    
    // Create decoder layers
    let prevDecoderNodes;
    const decoderNodes = [];
    
    NETWORK_ARCHITECTURE.decoder.forEach((layer, index) => {
        // Create decoder nodes
        const nodes = createLayer(
            layer.nodes,
            layer.position,
            COLORS.decoderNode,
            'decoder'
        );
        
        // Create attention nodes
        const attentionNodes = createAttentionHeads(
            layer.attention,
            layer.position - 8,
            COLORS.attentionNode,
            'attention'
        );
        
        // If this is the first decoder layer, connect with the last encoder layer
        if (index === 0) {
            connectLayers(prevEncoderNodes, nodes);
        } else {
            // Connect previous decoder layer to this layer
            connectLayers(prevDecoderNodes, nodes);
        }
        
        // Connect this layer to attention heads
        nodes.forEach(node => {
            attentionNodes.forEach(attn => {
                createEdge(node.position, attn.position);
            });
        });
        
        // Connect attention heads back to this layer
        attentionNodes.forEach(attn => {
            nodes.forEach(node => {
                createEdge(attn.position, node.position);
            });
        });
        
        // Connect encoder contexts to decoder attention (cross attention simulation)
        if (encoderNodes.length > 0) {
            attentionNodes.forEach(attn => {
                // Connect to a random subset of encoder nodes to reduce visual complexity
                const randomEncoderNodes = encoderNodes
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
                
                randomEncoderNodes.forEach(encoder => {
                    createEdge(encoder.position, attn.position, 0.15);
                });
            });
        }
        
        decoderNodes.push(...nodes);
        prevDecoderNodes = nodes;
    });
    
    // Create output layer
    const outputNodes = createLayer(
        NETWORK_ARCHITECTURE.output.nodes,
        NETWORK_ARCHITECTURE.output.position,
        COLORS.outputNode,
        'output'
    );
    
    // Connect last decoder layer to output layer
    connectLayers(prevDecoderNodes, outputNodes);
}

// Create a layer of nodes
function createLayer(nodeCount, zPosition, color, layerType) {
    const nodes = [];
    const radius = 25;
    
    for (let i = 0; i < nodeCount; i++) {
        const phi = Math.PI * 2 * (i / nodeCount);
        const x = radius * Math.cos(phi);
        const y = radius * Math.sin(phi);
        
        const node = createNode(x, y, zPosition, color, layerType);
        nodes.push({
            position: new THREE.Vector3(x, y, zPosition),
            object: node,
            type: layerType
        });
    }
    
    return nodes;
}

// Create attention heads in a circular pattern
function createAttentionHeads(count, zPosition, color, layerType) {
    const nodes = [];
    const radius = 15;
    
    for (let i = 0; i < count; i++) {
        const phi = Math.PI * 2 * (i / count);
        const x = radius * Math.cos(phi);
        const y = radius * Math.sin(phi);
        
        const node = createNode(x, y, zPosition, color, layerType);
        nodes.push({
            position: new THREE.Vector3(x, y, zPosition),
            object: node,
            type: layerType
        });
    }
    
    return nodes;
}

// Create a single node
function createNode(x, y, z, color, layerType) {
    const geometry = new THREE.SphereGeometry(NODE_SIZE, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const node = new THREE.Mesh(geometry, material);
    node.position.set(x, y, z);
    node.userData = { type: layerType, originalColor: color, originalScale: NODE_SIZE };
    
    networkGroup.add(node);
    return node;
}

// Create an edge between two points
function createEdge(startPos, endPos, opacity = EDGE_OPACITY) {
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: isDarkTheme ? COLORS.edge.dark : COLORS.edge.light,
        transparent: true,
        opacity: opacity
    });
    
    const edge = new THREE.Line(edgeGeometry, edgeMaterial);
    networkGroup.add(edge);
    return edge;
}

// Connect two layers of nodes
function connectLayers(sourceNodes, targetNodes) {
    sourceNodes.forEach(source => {
        // For visual clarity, connect each source to a subset of targets
        const randomTargets = targetNodes
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.max(2, Math.floor(targetNodes.length / 3)));
        
        randomTargets.forEach(target => {
            createEdge(source.position, target.position);
        });
    });
}

// Create particle flow system
function createParticles() {
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleSizes = new Float32Array(PARTICLE_COUNT);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    
    // Create random particles along the edges
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Initial random position in the network volume
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 140;
        
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
        
        // Random size variation
        particleSizes[i] = PARTICLE_SIZE * (0.5 + Math.random() * 0.5);
        
        // Set color based on z position (different layer colors)
        if (z < -40) {
            setParticleColor(particleColors, i, COLORS.inputNode);
        } else if (z < -10) {
            setParticleColor(particleColors, i, COLORS.encoderNode);
        } else if (z < 10) {
            setParticleColor(particleColors, i, COLORS.attentionNode);
        } else if (z < 40) {
            setParticleColor(particleColors, i, COLORS.decoderNode);
        } else {
            setParticleColor(particleColors, i, COLORS.outputNode);
        }
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    // Particle shader material
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDYwLCAyMDIwLzA1LzEyLTE2OjA0OjE3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMiAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDMtMTFUMTc6NDM6MDMrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTAzLTExVDE3OjQ0OjI4KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTAzLTExVDE3OjQ0OjI4KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQzZjgzNzRmLTI4OGQtNDQ5Ni04NjIzLTE4YmY1ZjFkZTZhOSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3ZGRjMDk5Yi1hMWRmLTRkYzgtOWY0ZC1mYWQyYjNhZGNlYzEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZGRjMDk5Yi1hMWRmLTRkYzgtOWY0ZC1mYWQyYjNhZGNlYzEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjdkZGMwOTliLWExZGYtNGRjOC05ZjRkLWZhZDJiM2FkY2VjMSIgc3RFdnQ6d2hlbj0iMjAyMy0wMy0xMVQxNzo0MzowMyswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjIgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQzZjgzNzRmLTI4OGQtNDQ5Ni04NjIzLTE4YmY1ZjFkZTZhOSIgc3RFdnQ6d2hlbj0iMjAyMy0wMy0xMVQxNzo0NDoyOCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjIgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Cd9sBQAAA3RJREFUWMPFl0tsG0UYx3+zuzP7WK9fSRw7iZ2HE+dBm5CHU/JoQlVaVQK1SDRcEHClgguioMIBqXDgUE7lwhFRUQ5cKIhDW0SlVapKIdA0zqvxu4njdWzn5bV3Z4e2qaNWprYTdT7N6NP8PvOb//ynI+GMkbnwzIULwBvAcUABpoFfrbXezC+0Pp3rbbg0dm78jd9O9H4DHAKSQLm9VmYdyYaKRwZupbK/FkePf1T95dRPgDLWNr0OHBnPJXq+nHsJh19eUNZuoQrRsFu9OgP8tQcAf7T7RU9OiQOltYOEoyFU3Z8BzrbvOQFYW3J/xNj3OVDXi/j8R5jPFzWnX5sA3u/8+DsAa+1s1B3gM9+zXdMjbz/oHxz7/h3TSD4H7O88vy8bWhswPcVi+lbQWoUQQtB6Tz1j5/wg+ABnw8q3JRLJw/bKPuD7zn0VfbOOmVl5XK5r1V+A6xud+vZzRy89emPa7rnE2m0JUQKkZO34vY1a5wA3gMlNAY4duTI1P33nTe/+fcilS9A0YWICq/+Cp/v6T7/fKOQtMLMjgOGh6Vg8mWd55BYsLMDMDFy7BkePwsAAtNP4oLc/8jmQA26zhfZ7pPvUaWTZRYQDZDLgOCBJkMtBvg6ynzldQfx+v++Cg/g3B+juAiWFaZQwjAUYGgJdh0QCenrAsqFShvJKiVopXwMu7gwgOQSShzWziLEKgWNQq4GmgaqCGgJfBGZnYPL3m71QnwGubW+GcshJAJGvQssEpwZnzkAqBRMT2JUqXZkslrR3uFkpV4CbO5xCK9OxQZdLOoTTEAio+BLdqJqKUy+TjEVYb5mfbQcQjuSXWi3bPZSCVAqSKSSfB6dRxaXLuN0e5hcLiN3+iNLJ0I1c9mG6YMgQqMPaMhgFqK6Qn5sjGAwyODhI2ajeZm2bbA+QGTk8cnlqMpRsXYfaEtTKNFwuYrEYxWKRRqMJuA93U/adlsw8MLVFmWLA1dGrxaKU9eDYrJHwxMhm5xj/Y5L5/OIcUHnioajTflzX85fK5aX7+ULxQa1uAGVgrVNa8SkAYX/kwl3Zv1auVFxAGXi0C3JiWwCdYTdNgXYzrJVPVzYPt9se7UB23fL/3m5SdyVx7J/7eRz4G1Fm0S+3O/j/AAAAAElFTkSuQmCC') },
            color: { value: new THREE.Color(isDarkTheme ? COLORS.particle.dark : COLORS.particle.light) }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / length(mvPosition.xyz));
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            uniform vec3 color;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// Set RGB color for a particle
function setParticleColor(colors, index, hexColor) {
    const color = new THREE.Color(hexColor);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
}

// Initialize UI controls
function initControls() {
    // Layer visibility control
    const layerVisibilitySelect = document.getElementById('layer-visibility');
    if (layerVisibilitySelect) {
        layerVisibilitySelect.addEventListener('change', function() {
            layerFilter = this.value;
            updateLayerVisibility();
        });
    }
    
    // Animation speed control
    const animationSpeedSlider = document.getElementById('animation-speed');
    if (animationSpeedSlider) {
        animationSpeedSlider.addEventListener('input', function() {
            animationSpeed = parseFloat(this.value);
        });
    }
    
    // Play animation button
    const playAnimationBtn = document.getElementById('play-animation');
    if (playAnimationBtn) {
        playAnimationBtn.addEventListener('click', function() {
            isAnimating = !isAnimating;
            
            // Update button text
            if (isAnimating) {
                this.innerHTML = '<i class="fas fa-pause"></i> Pause Animation';
            } else {
                this.innerHTML = '<i class="fas fa-play"></i> Play Animation';
            }
        });
    }
}

// Update layer visibility based on filter
function updateLayerVisibility() {
    networkGroup.traverse(child => {
        if (child.type === 'Mesh') {
            const type = child.userData.type;
            
            if (layerFilter === 'all') {
                child.visible = true;
            } else if (layerFilter === 'attention') {
                child.visible = type === 'attention';
            } else if (layerFilter === 'encoder') {
                child.visible = type === 'encoder' || type === 'input';
            } else if (layerFilter === 'decoder') {
                child.visible = type === 'decoder' || type === 'output';
            }
        }
    });
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('network-visualization');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (controls) controls.update();
    
    // Animate particle system
    if (particleSystem && isAnimating) {
        const positions = particleSystem.geometry.attributes.position.array;
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Get current position
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;
            
            // Move particles forward (along z-axis)
            positions[iz] += animationSpeed * ANIMATION_SPEED_FACTOR * 1000;
            
            // If particle reaches the end, reset to beginning
            if (positions[iz] > NETWORK_ARCHITECTURE.output.position + 10) {
                positions[iz] = NETWORK_ARCHITECTURE.input.position - 10;
                
                // Reset x, y with slight randomization
                positions[ix] = (Math.random() - 0.5) * 50;
                positions[iy] = (Math.random() - 0.5) * 50;
                
                // Update color based on z position
                const colors = particleSystem.geometry.attributes.color.array;
                if (positions[iz] < -40) {
                    setParticleColor(colors, i, COLORS.inputNode);
                } else if (positions[iz] < -10) {
                    setParticleColor(colors, i, COLORS.encoderNode);
                } else if (positions[iz] < 10) {
                    setParticleColor(colors, i, COLORS.attentionNode);
                } else if (positions[iz] < 40) {
                    setParticleColor(colors, i, COLORS.decoderNode);
                } else {
                    setParticleColor(colors, i, COLORS.outputNode);
                }
            }
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.geometry.attributes.color.needsUpdate = true;
        
        // Rotate the network slightly for visual effect
        networkGroup.rotation.y += 0.001 * animationSpeed;
    }
    
    renderer.render(scene, camera);
} 