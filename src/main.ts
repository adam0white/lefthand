import { helloFrame } from "./hello";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing app");
root.innerHTML =
  '<main><header><small>THREE WINTER NIGHTS</small><h1>The Left Hand</h1></header><p id="status" role="status">Lighting the village…</p><canvas id="canvas" tabindex="0" aria-label="A winter village"></canvas><p>At the table, Yusuf prepares help for Idris and Samira.</p></main>';
const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const status = document.querySelector<HTMLParagraphElement>("#status");
let rendered = false;
Object.assign(window, {
  HFBridge: {
    ready: () => {},
    get_frame: () => JSON.stringify(helloFrame),
    input: () => {},
    rendered: () => {
      rendered = true;
      if (status) status.textContent = "The village is ready.";
    },
  },
  lefthandHello: () => ({ rendered }),
});
type EngineInstance = {
  startGame(options: { mainPack: string }): Promise<void>;
};
type EngineClass = new (options: Record<string, unknown>) => EngineInstance;
async function load() {
  const manifest: { executable: string; script: string; pack: string } =
    await fetch("/engine.json").then((r) => r.json());
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = manifest.script;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.append(s);
  });
  const Engine = (window as unknown as { Engine: EngineClass }).Engine;
  await new Engine({
    executable: manifest.executable,
    canvas,
    canvasResizePolicy: 2,
    focusCanvasOnStart: false,
    ensureCrossOriginIsolationHeaders: false,
  }).startGame({ mainPack: manifest.pack });
}
void load().catch((e: unknown) => {
  if (status) status.textContent = `The village could not load. ${String(e)}`;
});
