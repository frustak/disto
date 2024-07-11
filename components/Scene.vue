<script lang="ts" setup>
import { Curtains } from "curtainsjs";
import GUI from "lil-gui";
import { Planer, type PlanerOptions } from "~/utils/planer";

const containerElement = ref<Element>();
const planeElement = ref<Element>();
const fileInput = ref<HTMLInputElement>();
const curtains = ref<Curtains>();
const planer = ref<Planer>();
const imageElement = ref<HTMLImageElement>();

const defaultOptions: PlanerOptions = {
  interval: 50,
  yMultiplier: 25,
  xMultiplier: 25,
  div: 50,
  axis: "x",
  randomOp: false,
};

const options: PlanerOptions = Object.assign({}, defaultOptions);

function changeImage(event: Event) {
  const target = event.target as HTMLInputElement;
  const image = target.files?.[0];
  if (!image) return alert("please upload a file");
  if (!imageElement.value) return;
  imageElement.value.src = URL.createObjectURL(image);
  planer.value?.refresh(options);
}

function createGui() {
  const gui = new GUI();
  gui.add(options, "interval", 0.00001, 1000);
  gui.add(options, "yMultiplier", 0.1, 1000);
  gui.add(options, "xMultiplier", 0.1, 1000);
  gui.add(options, "div", 0.1, 100);
  gui.add(options, "axis", ["x", "y", "xy"]);
  gui.add(options, "randomOp");
  gui.add(
    {
      image() {
        fileInput.value?.click();
      },
    },
    "image"
  );
  gui.add(
    {
      reset() {
        Object.assign(options, defaultOptions);
        gui.destroy();
        createGui();
      },
    },
    "reset"
  );
  gui.onChange(({ property }) => {
    if (property === "image") return;
    planer.value?.refresh(options);
    location.hash = "#" + btoa(JSON.stringify(options));
  });
}

onMounted(() => {
  const loadedOptions = location.hash.substring(1)
    ? JSON.parse(atob(location.hash.substring(1)))
    : null;
  if (loadedOptions) Object.assign(options, loadedOptions);
  curtains.value = new Curtains({
    container: containerElement.value,
    pixelRatio: Math.min(1.5, window.devicePixelRatio),
  });
  planer.value = new Planer(curtains.value, planeElement.value!, options);
  createGui();
});
</script>

<template>
  <main>
    <input
      type="file"
      class="image-upload"
      ref="fileInput"
      @change="changeImage($event)"
    />
    <div ref="containerElement" class="canvas"></div>
    <div ref="planeElement" class="plane">
      <img src="/image.png" ref="imageElement" />
    </div>
  </main>
</template>

<style>
.image-upload {
  visibility: hidden;
  display: block;
  width: 0;
  height: 0;
}

.plane {
  width: 100vw;
  height: 100vh;
}

.plane img {
  display: none;
}

.canvas {
  position: absolute;
  inset: 0;
}
</style>
