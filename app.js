import {
  setOrigin,
  setRoast,
} from "./scene.js?v=50131bed434feb3f85d7c212a9a431be00718a6991c2d5992f1373160b08b00e";

const origins = {
  ethiopia: {
    country: "Ethiopia",
    region: "Sidama",
    altitude: "1,800 to 2,200 m",
    notes: "Jasmine. Peach. Citrus.",
    lat: "06° 45′ N",
  },
  colombia: {
    country: "Colombia",
    region: "Huila",
    altitude: "1,500 to 1,900 m",
    notes: "Caramel. Orange. Cocoa.",
    lat: "02° 32′ N",
  },
  guatemala: {
    country: "Guatemala",
    region: "Antigua",
    altitude: "1,500 to 1,700 m",
    notes: "Cocoa. Almond. Red apple.",
    lat: "14° 33′ N",
  },
};
let selectedOrigin = "ethiopia",
  roast = 30;
const roastInput = document.querySelector("#roast-level");
const originButtons = [...document.querySelectorAll("[data-origin]")];
function selectOrigin(key) {
  if (!origins[key]) return;
  selectedOrigin = key;
  const origin = origins[key];
  document.querySelector("#origin-region").textContent = origin.region;
  document.querySelector("#origin-altitude").textContent = origin.altitude;
  document.querySelector("#origin-notes").textContent = origin.notes;
  document.querySelector("#scene-origin").textContent =
    `${origin.country.toUpperCase()} / ${origin.region.toUpperCase()}`;
  document.querySelector(".scene-coordinate>span").textContent = origin.lat;
  originButtons.forEach((button) => {
    const active = button.dataset.origin === key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  setOrigin(key);
  updateRecipe();
}
originButtons.forEach((button) =>
  button.addEventListener("click", () => selectOrigin(button.dataset.origin)),
);
function updateRoast() {
  roast = Number(roastInput.value);
  setRoast(roast);
  const light = roast < 38,
    medium = roast < 72;
  document.querySelector("#roast-label").textContent = light
    ? "LIGHT / 02"
    : medium
      ? "MEDIUM / 03"
      : "DEEP / 04";
  document.querySelector("#roast-description").textContent = light
    ? "Floral aromatics. Bright acidity. A delicate, tea-like body."
    : medium
      ? "Round sweetness. Soft fruit. A smooth, balanced body."
      : "Chocolate notes. Gentle acidity. A full, lingering body.";
  document.querySelector("#brightness-bar").style.width =
    `${90 - roast * 0.7}%`;
  document.querySelector("#body-bar").style.width = `${24 + roast * 0.68}%`;
  document.querySelector("#roast-bar").style.width = `${12 + roast * 0.88}%`;
  updateRecipe();
}
roastInput.addEventListener("input", updateRoast);

const brewForm = document.querySelector("#brew-form");
const doseInput = document.querySelector("#coffee-dose");
let recipe;
function updateRecipe() {
  const data = new FormData(brewForm);
  const dose = Math.round(Number(doseInput.value));
  if (!Number.isFinite(dose) || dose < 10 || dose > 60) {
    document.querySelector("#recipe-status").textContent =
      "Choose a coffee dose from 10 to 60 grams.";
    return;
  }
  const ratio = Number(data.get("strength"));
  const method = data.get("method");
  const water = dose * ratio;
  const temp =
    (roast < 38 ? 95 : roast < 72 ? 92 : 89) +
    (method === "frenchpress" ? 0 : method === "aeropress" ? -2 : 0);
  const methodData = {
    pourover: {
      name: "Pour-over",
      time: "3:00",
      grind: "Medium-fine",
      steps: `Bloom with ${dose * 3} ml for 30 seconds. Pour the remaining ${water - dose * 3} ml in slow circles. Aim for an even bed.`,
    },
    frenchpress: {
      name: "French press",
      time: "4:00",
      grind: "Coarse",
      steps: `Add ${dose} g of coarsely ground coffee. Pour all ${water} ml of water, stir gently and steep for 4 minutes. Press slowly.`,
    },
    aeropress: {
      name: "AeroPress",
      time: "2:00",
      grind: "Medium-fine",
      steps: `Use ${dose} g of coffee and ${water} ml of water. Stir, steep for 90 seconds, then press gently for 30 seconds.${water > 250 ? ` Divide the coffee and water into ${Math.ceil(water / 250)} equal batches to fit your brewer.` : ""}`,
    },
  }[method];
  document.querySelector("#water-amount").textContent = water;
  document.querySelector("#temperature").textContent = `${temp}°`;
  document.querySelector("#brew-time").textContent = methodData.time;
  document.querySelector("#recipe-method").textContent =
    `${methodData.name.toUpperCase()} / 01`;
  document.querySelector("#recipe-steps").textContent = methodData.steps;
  document.querySelector("#recipe-grind").textContent =
    `${methodData.grind.toUpperCase()} GRIND`;
  document.querySelector("#recipe-ratio").textContent = `1:${ratio} RATIO`;
  document.querySelector("#recipe-status").textContent =
    "A small text file. A better tomorrow morning.";
  recipe = {
    dose,
    water,
    temp,
    ratio,
    method: methodData.name,
    time: methodData.time,
    grind: methodData.grind,
    steps: methodData.steps,
    origin: origins[selectedOrigin].country,
    roast: roast < 38 ? "Light" : roast < 72 ? "Medium" : "Deep",
  };
}
brewForm.addEventListener("input", updateRecipe);
brewForm.addEventListener("change", updateRecipe);
for (const [id, delta] of [
  ["less-coffee", -1],
  ["more-coffee", 1],
])
  document.querySelector(`#${id}`).addEventListener("click", () => {
    doseInput.value = Math.max(
      10,
      Math.min(60, (Number(doseInput.value) || 20) + delta),
    );
    updateRecipe();
  });
doseInput.addEventListener("blur", () => {
  doseInput.value = Math.max(
    10,
    Math.min(60, Math.round(Number(doseInput.value) || 20)),
  );
  updateRecipe();
});
document.querySelector("#save-recipe").addEventListener("click", () => {
  if (!brewForm.reportValidity()) return;
  updateRecipe();
  const r = recipe;
  const text = `ORIGIN / YOUR STARTING POINT\n\n${r.origin}. ${r.roast} roast.\nMethod: ${r.method}\nCoffee: ${r.dose} g\nWater: ${r.water} ml\nRatio: 1:${r.ratio}\nTemperature: ${r.temp} C\nGrind: ${r.grind}\nTime: ${r.time}\n\n${r.steps}\n\nTaste and adjust. A recipe is a starting point.\n\nIndependent coffee brand concept by Polina Koljanikova.\n`;
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `origin-${r.method.toLowerCase().replaceAll(" ", "-")}-recipe.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector("#recipe-status").textContent =
    "Your brew recipe is ready. Here is to a good morning.";
});
updateRoast();
