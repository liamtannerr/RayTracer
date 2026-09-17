const sphere = (position, radius, material, color, fuzz = 0, ior = 1.5) => ({ position, radius, material, color, fuzz, ior });

export const presets = [
  {
    id: 'candy', name: 'Candy shop', description: 'Bubblegum pink, citrus yellow, and a splash of chrome.',
    colors: ['#f52e89', '#ffd21c', '#19c7c5'],
    ground: '#e9b8d0', camera: { from: [6, 4, 9], at: [0, 1, 0], fov: 38 },
    spheres: [
      sphere([-1.8, 1.2, 0], 1.2, 'diffuse', '#f52e89'),
      sphere([0.6, 0.9, -0.8], 0.9, 'diffuse', '#ffd21c'),
      sphere([2, 1, 0.8], 1, 'metal', '#19c7c5', 0.12),
      sphere([-0.4, 0.7, 1.8], 0.7, 'metal', '#eeeeff', 0.02),
      sphere([-2.6, 0.4, 2], 0.4, 'diffuse', '#ff761a'),
      sphere([0.7, 0.4, 2.7], 0.4, 'diffuse', '#6938ec'),
      sphere([2.2, 0.5, -1.5], 0.5, 'diffuse', '#4bb92d')
    ]
  },
  {
    id: 'mirror', name: 'Mirror garden', description: 'A giant mirror surrounded by a rainbow of little worlds.',
    colors: ['#dce9ff', '#ff4525', '#2b80ff'],
    ground: '#172c43', camera: { from: [7, 4, 10], at: [0, 1.1, 0], fov: 40 },
    spheres: [
      sphere([0, 1.6, 0], 1.6, 'metal', '#eff5ff', 0),
      ...['#ff4525', '#ffba08', '#9cde32', '#17c9bb', '#2b80ff', '#bb43f4', '#f63283'].map((color, i) => {
        const angle = i * Math.PI * 2 / 7;
        const radius = [0.6, 0.5, 0.7, 0.5, 0.7, 0.5, 0.6][i];
        return sphere([Math.round(Math.cos(angle) * 31) / 10, radius, Math.round(Math.sin(angle) * 31) / 10], radius, 'diffuse', color);
      })
    ]
  },
  {
    id: 'orbit', name: 'Floating orbit', description: 'A golden sun, suspended planets, and long soft shadows.',
    colors: ['#ffb42c', '#5566ff', '#ff5c45'],
    ground: '#26304c', camera: { from: [8, 6, 11], at: [0, 2.1, 0], fov: 42 },
    spheres: [
      sphere([0, 2.1, 0], 1.3, 'metal', '#ffb42c', 0.16),
      sphere([-2.7, 1.1, 0.7], 0.8, 'diffuse', '#5566ff'),
      sphere([2.6, 3.4, 0.1], 0.7, 'diffuse', '#ff5c45'),
      sphere([0.2, 4.5, -0.5], 0.5, 'metal', '#57ddd4', 0.08),
      sphere([2, 0.5, 2.1], 0.5, 'glass', '#ffffff'),
      sphere([-2, 3.4, -1.9], 0.4, 'diffuse', '#e887f5'),
      sphere([-0.7, 0.3, 2.4], 0.3, 'metal', '#dee7ff', 0),
      sphere([3.4, 1.3, -1.7], 0.3, 'diffuse', '#9be849')
    ]
  },
  {
    id: 'classic', name: 'The original', description: 'The quiet trio: matte terracotta, clear glass, and metal.',
    colors: ['#c9774f', '#e0ebdc', '#c4d1b3'],
    ground: '#8b9380', camera: { from: [7, 3, 7], at: [0, 0.8, 0], fov: 40 },
    spheres: [
      sphere([-2.1, 1, 0], 1, 'diffuse', '#c9774f'),
      sphere([0, 1, 0], 1, 'glass', '#e0ebdc'),
      sphere([2.1, 1, 0], 1, 'metal', '#c4d1b3', 0.05)
    ]
  }
];

export function createScene(id, quality = { width: 320, samples: 8 }) {
  const preset = presets.find(preset => preset.id === id) || presets[0];
  return structuredClone({ width: quality.width, samples: quality.samples, ground: preset.ground, camera: preset.camera, spheres: preset.spheres });
}
