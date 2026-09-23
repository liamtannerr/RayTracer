import { presets, createScene } from './presets.js';
import { backendUrl } from './config.js';
import { Backend } from './backend.js';
const $ = id => document.getElementById(id);
const backend = new Backend(backendUrl, state => {
  const messages = {
    warming: 'Waking up the renderer… You can edit your scene while it starts.',
    ready: 'Renderer ready. Click Render scene whenever you’re ready.',
    unavailable: 'The renderer is taking longer than expected. Click Render scene to try connecting again.'
  };
  $('backend-status').textContent = messages[state];
  $('backend-status').classList.toggle('error', state === 'unavailable');
});
let activePreset = presets[0].id;
let scene = createScene(activePreset), selected = 0, controller = null, imageUrl = null, revision = 0;
function changed() {
  revision++;
  if (!controller) { $('status').textContent = 'Scene updated'; $('status').classList.remove('error'); $('details').textContent = 'Render to see your changes. Downloads keep the last completed image.'; }
}
function numberInput(value, min, max, step, label, onChange) {
  const input = document.createElement('input');
  Object.assign(input, { type: 'number', value, min, max, step });
  input.setAttribute('aria-label', label);
  input.addEventListener('change', () => {
    if (!input.value || !input.checkValidity()) { input.reportValidity(); return; }
    onChange(Number(input.value)); changed();
  });
  return input;
}
function vectorEditor(container, values, label) {
  container.replaceChildren();
  values.forEach((value, index) => {
    const wrapper = document.createElement('label');
    const direction = ['In/Out', 'Up/Down', 'Left/Right'][index];
    const caption = document.createElement('span');
    caption.className = 'axis-caption'; caption.textContent = direction;
    const field = document.createElement('div'); field.className = 'axis-field';
    const axis = document.createElement('span'); axis.className = 'axis-letter'; axis.textContent = 'XYZ'[index];
    field.append(axis, numberInput(value, -30, 30, 0.1, `${label} ${'XYZ'[index]} (${direction})`, n => values[index] = n));
    wrapper.append(caption, field);
    container.append(wrapper);
  });
}
function objects() {
  $('count').textContent = `${scene.spheres.length}/16`;
  $('add').disabled = scene.spheres.length >= 16;
  $('object-list').replaceChildren(...scene.spheres.map((sphere, index) => {
    const button = document.createElement('button');
    button.className = `object ${selected === index ? 'active' : ''}`;
    button.setAttribute('aria-pressed', selected === index);
    button.innerHTML = `<span class="orb" style="--orb:${sphere.color}"></span><span><span class="object-name">Sphere ${String(index + 1).padStart(2, '0')}</span><span class="object-material">${sphere.material}</span></span><span class="index">◉</span>`;
    button.onclick = () => { selected = index; objects(); };
    return button;
  }));
  const sphere = scene.spheres[selected];
  $('inspector').innerHTML = sphere ? `<div class="inspector-heading"><h2>Object properties</h2><button id="delete" class="delete">Remove</button></div><div class="field"><label>Position</label><div id="position" class="xyz"></div></div><div class="field-pair"><div><label for="radius">Radius</label><div id="radius-wrap"></div></div><div><label for="color">Surface color</label><input id="color" type="color" value="${sphere.color}"></div></div><div class="field"><label for="material">Material</label><select id="material"><option value="diffuse">Diffuse · soft & matte</option><option value="metal">Metal · reflective</option><option value="glass">Glass · transparent</option></select></div><div id="material-settings"></div>` : '<p class="limit-note">An open stage. Add a sphere to get started.</p>';
  if (!sphere) return;
  vectorEditor($('position'), sphere.position, 'Sphere position');
  const radius = numberInput(sphere.radius, 0.1, 5, 0.1, 'Sphere radius', n => sphere.radius = n); radius.id = 'radius'; $('radius-wrap').append(radius);
  $('color').disabled = sphere.material === 'glass';
  $('color').oninput = event => { sphere.color = event.target.value; changed(); const orb = document.querySelector('.object.active .orb'); orb.style.setProperty('--orb', sphere.color); };
  $('material').value = sphere.material;
  $('material').onchange = event => { sphere.material = event.target.value; changed(); objects(); };
  if (sphere.material === 'metal') {
    $('material-settings').innerHTML = `<label class="range-label" for="fuzz">Roughness <output id="fuzz-value">${sphere.fuzz}</output></label><input type="range" id="fuzz" min="0" max="1" step="0.01" value="${sphere.fuzz}">`;
    $('fuzz').oninput = event => { sphere.fuzz = Number(event.target.value); $('fuzz-value').textContent = sphere.fuzz; changed(); };
  } else if (sphere.material === 'glass') {
    $('material-settings').innerHTML = '<label for="ior">Refraction index</label>';
    const input = numberInput(sphere.ior, 1, 2.5, 0.05, 'Refraction index', n => sphere.ior = n); input.id = 'ior'; $('material-settings').append(input);
  }
  $('delete').onclick = () => { scene.spheres.splice(selected, 1); selected = Math.max(0, selected - 1); changed(); objects(); };
}
function setup() {
  objects();
  vectorEditor($('camera-from'), scene.camera.from, 'Camera position');
  vectorEditor($('camera-at'), scene.camera.at, 'Camera target');
  for (const key of ['width', 'samples', 'ground']) {
    $(key).value = scene[key];
    $(key).onchange = event => { scene[key] = key === 'ground' ? event.target.value : Number(event.target.value); changed(); };
  }
  $('fov').value = scene.camera.fov; $('fov-value').textContent = `${scene.camera.fov}°`;
  $('fov').oninput = event => { scene.camera.fov = Number(event.target.value); $('fov-value').textContent = `${scene.camera.fov}°`; changed(); };
}
$('add').onclick = () => {
  if (scene.spheres.length >= 16) return;
  scene.spheres.push({ position: [0, 0.5, 2], radius: 0.5, material: 'diffuse', color: '#91acbe', fuzz: 0.1, ior: 1.5 });
  selected = scene.spheres.length - 1; changed(); objects();
};
function loadPreset(id) {
  activePreset = id;
  scene = createScene(id, scene);
  selected = 0;
  changed();
  setup();
  for (const button of $('presets').children) button.setAttribute('aria-pressed', button.dataset.preset === id);
}
for (const preset of presets) {
  const button = document.createElement('button');
  button.className = 'preset';
  button.dataset.preset = preset.id;
  button.setAttribute('aria-pressed', preset.id === activePreset);
  button.innerHTML = `<span class="preset-colors" aria-hidden="true">${preset.colors.map(color => `<span class="orb" style="--orb:${color}"></span>`).join('')}</span><strong>${preset.name}</strong><span class="preset-description">${preset.description}</span>`;
  button.onclick = () => loadPreset(preset.id);
  $('presets').append(button);
}
$('reset').onclick = () => loadPreset(activePreset);
$('cancel').onclick = () => controller?.abort();
$('render').onclick = render;
function startImage(width, height) {
  const canvas = $('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#101410'; ctx.fillRect(0, 0, width, height);
  $('empty').hidden = true; canvas.parentElement.classList.add('has-image');
  $('placeholder').hidden = true;
  $('dimensions').textContent = `${width} × ${height}`;
  $('download').textContent = imageUrl ? '↓ Download previous PNG' : '↓ Download PNG';
}
function displayRow(message, width) {
  const rgb = atob(message.pixels);
  if (rgb.length !== width * 3) throw new Error('Received an incomplete image row.');
  const ctx = $('canvas').getContext('2d'), data = ctx.createImageData(width, 1);
  for (let i = 0, p = 0; i < rgb.length; i += 3, p += 4) { data.data[p] = rgb.charCodeAt(i); data.data[p + 1] = rgb.charCodeAt(i + 1); data.data[p + 2] = rgb.charCodeAt(i + 2); data.data[p + 3] = 255; }
  ctx.putImageData(data, 0, message.row);
}
async function finishImage() {
  const canvas = $('canvas');
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create the PNG download.');
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(blob); $('download').href = imageUrl;
  $('download').classList.remove('disabled'); $('download').setAttribute('aria-disabled', 'false');
  $('download').textContent = '↓ Download PNG';
}
async function render() {
  if (controller) return;
  if (!backend.ready) {
    void backend.wake();
    $('backend-status').textContent = 'The renderer is waking up. This can take about a minute. Please click Render scene once it’s ready.';
    return;
  }
  const invalid = document.querySelector('input:invalid');
  if (invalid) { invalid.reportValidity(); return; }
  controller = new AbortController();
  const start = performance.now(), renderRevision = revision;
  $('render').disabled = true; $('cancel').hidden = false;
  $('status').classList.remove('error'); $('status').textContent = 'Tracing rays…';
  $('details').textContent = 'You can keep editing while this scene renders.'; $('progress').style.width = '0%';
  let complete = false, dimensions = null, rows = 0;
  try {
    const response = await fetch(`${backendUrl}/api/render`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scene), signal: controller.signal, credentials: 'omit' });
    if (response.status >= 500 || (response.ok && !response.headers.get('content-type')?.includes('application/x-ndjson'))) {
      void backend.wake();
      throw new Error('The renderer is reconnecting. Please try again once it’s ready.');
    }
    if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Render request failed.'); }
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let pending = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      let newline;
      while ((newline = pending.indexOf('\n')) >= 0) {
        const message = JSON.parse(pending.slice(0, newline)); pending = pending.slice(newline + 1);
        if (message.error) throw new Error(message.error);
        if (message.progress !== undefined) { $('progress').style.width = `${message.progress}%`; $('status').textContent = `Tracing rays… ${message.progress}%`; }
        if (message.type === 'start') {
          if (dimensions) throw new Error('Unexpected render restart.');
          dimensions = message;
          startImage(message.width, message.height);
        } else if (message.type === 'row') {
          if (!dimensions || message.row !== rows || rows >= dimensions.height) throw new Error('Received an out-of-order image row.');
          displayRow(message, dimensions.width); rows++;
        } else if (message.type === 'done') {
          if (!dimensions || rows !== dimensions.height) throw new Error('The image is incomplete.');
          await finishImage(); complete = true;
          $('status').textContent = `Render complete · ${((performance.now() - start) / 1000).toFixed(1)}s`;
          $('details').textContent = revision === renderRevision ? 'A little light, a lot of rays. Your PNG is ready.' : 'Scene changed during rendering. Render again to see your latest edits.';
        }
      }
    }
    if (!complete) throw new Error('Render connection closed before the image was complete. Please try again.');
  } catch (error) {
    controller.abort();
    if (error instanceof TypeError) void backend.wake();
    $('status').textContent = error.name === 'AbortError' ? 'Render cancelled' : 'Could not render';
    $('status').classList.toggle('error', error.name !== 'AbortError');
    $('details').textContent = error.name === 'AbortError' ? 'Partial preview kept. Downloads use the last completed render.' : error.message;
    $('progress').style.width = '0%';
  } finally { controller = null; $('render').disabled = false; $('cancel').hidden = true; }
}
setup();
void backend.wake();
