export const LIMITS = Object.freeze({ maxWidth: 1280, maxSamples: 128, maxSpheres: 16, maxDepth: 8, timeoutMs: 60000 });
function number(value, min, max, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return value;
}
function vector(value, label) {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`${label} needs three coordinates.`);
  return value.map(v => number(v, -30, 30, label));
}
function color(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Colors must be six-digit hex values.');
  return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
}
export function serializeScene(scene) {
  if (!scene || typeof scene !== 'object') throw new Error('A scene is required.');
  const { width, samples, spheres, camera } = scene;
  if (![160, 320, 480, 640, 1280].includes(width)) throw new Error('Choose a supported resolution (160–1280 pixels wide).');
  if (![4, 8, 16, 32, 64, 128].includes(samples)) throw new Error('Choose 4, 8, 16, 32, 64, or 128 samples.');
  if (!Array.isArray(spheres) || spheres.length > LIMITS.maxSpheres) throw new Error('Scenes support at most 16 spheres.');
  if (!camera) throw new Error('A camera is required.');
  const from = vector(camera.from, 'Camera position');
  const at = vector(camera.at, 'Camera target');
  if (Math.hypot(from[0] - at[0], from[2] - at[2]) < 0.01) throw new Error('Move the camera away from its target horizontally.');
  const height = width * 9 / 16;
  const lines = [[width, height, samples, ...from, ...at, number(camera.fov, 15, 90, 'Field of view'), ...color(scene.ground), spheres.length].join(' ')];
  for (const sphere of spheres) {
    if (!sphere || !['diffuse', 'metal', 'glass'].includes(sphere.material)) throw new Error('Choose diffuse, metal, or glass.');
    lines.push([...vector(sphere.position, 'Sphere position'), number(sphere.radius, 0.1, 5, 'Radius'), ['diffuse', 'metal', 'glass'].indexOf(sphere.material), ...color(sphere.color), number(sphere.fuzz, 0, 1, 'Roughness'), number(sphere.ior, 1, 2.5, 'Refraction index')].join(' '));
  }
  return { input: lines.join('\n') + '\n', width, height };
}
