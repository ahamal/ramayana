// Loads three.js, then the game's own scripts one after another. They are plain scripts sharing one scope,
// so a page chooses what it is by the list it gives in LIVE: the shared files plus its own.
import * as THREE from 'three';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
Object.assign(window, { THREE, CCDIKSolver, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, SkeletonUtils });
for (const name of window.LIVE)
  await new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = new URL(name + '.js', import.meta.url).href + '?t=' + Date.now();
    s.onload = ok;
    s.onerror = () => fail(new Error('could not load ' + name + '.js'));
    document.head.append(s);
  });
