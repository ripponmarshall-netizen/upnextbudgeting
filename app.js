const appChunks = [
  "assets/app-chunks/app.01.js",
  "assets/app-chunks/app.02.js",
  "assets/app-chunks/app.03.js",
  "assets/app-chunks/app.04.js",
  "assets/app-chunks/app.05.js",
  "assets/app-chunks/app.06.js"
];

async function loadApp() {
  const parts = await Promise.all(appChunks.map(async (path) => {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.text();
  }));
  const source = `${parts.join("\n")}\n//# sourceURL=upnextbudgeting-app.js`;
  new Function(source)();
}

loadApp().catch((error) => {
  console.error(error);
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = `
      <section class="notice-panel">
        <div>
          <h1>UpNextBudgeting</h1>
          <p class="small-note">The app could not finish loading. Refresh the page and try again.</p>
        </div>
      </section>
    `;
  }
});
