(function () {
  const $ = (id) => document.getElementById(id);
  const statusEl = $("status");
  const detailsEl = $("details");
  const progressWrapper = $("progressWrapper");
  const progressBar = $("progressBar");
  const progressText = $("progressText");
  const btnCheck = $("btnCheck");
  const btnDownload = $("btnDownload");
  const btnInstall = $("btnInstall");
  const btnOpenWindow = $("btnOpenWindow");
  const btnSimulate = $("btnSimulate");
  const devRow = $("devRow");

  function setStatus(text) {
    statusEl.textContent = text;
  }
  function setDetails(html) {
    if (!html) {
      detailsEl.classList.add("hidden");
      detailsEl.innerHTML = "";
    } else {
      detailsEl.classList.remove("hidden");
      detailsEl.innerHTML = html;
    }
  }
  function setProgress(p) {
    progressWrapper.classList.remove("hidden");
    const pct = Math.max(0, Math.min(100, Math.round(p || 0)));
    progressBar.style.width = pct + "%";
    progressText.textContent = pct + "%";
  }
  function hideProgress() {
    progressWrapper.classList.add("hidden");
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
  }

  function setState(state) {
    switch (state?.status) {
      case "checking":
        setStatus("Checking for updates…");
        btnCheck.disabled = true;
        btnDownload.disabled = true;
        btnInstall.disabled = true;
        setDetails("");
        hideProgress();
        break;
      case "available":
        setStatus("Update available");
        btnCheck.disabled = false;
        btnDownload.disabled = false;
        btnInstall.disabled = true;
        setDetails(`Version: <b>${state.info?.version || ""}</b>`);
        hideProgress();
        break;
      case "not-available":
        setStatus("You are up to date");
        btnCheck.disabled = false;
        btnDownload.disabled = true;
        btnInstall.disabled = true;
        setDetails("");
        hideProgress();
        break;
      case "downloading":
        setStatus("Downloading update…");
        btnCheck.disabled = true;
        btnDownload.disabled = true;
        btnInstall.disabled = true;
        setDetails("This may take a minute depending on your connection.");
        break;
      case "downloaded":
        setStatus("Update ready to install");
        btnCheck.disabled = false;
        btnDownload.disabled = true;
        btnInstall.disabled = false;
        setDetails(`Downloaded. Click Install & Restart to finish.`);
        hideProgress();
        break;
      case "error":
        setStatus("Update error");
        btnCheck.disabled = false;
        btnDownload.disabled = false;
        btnInstall.disabled = true;
        setDetails(
          `<span style="color:#fca5a5;">${
            state.info?.message || "Unknown error"
          }</span>`
        );
        hideProgress();
        break;
      default:
        setStatus("Idle");
        btnCheck.disabled = false;
        btnDownload.disabled = true;
        btnInstall.disabled = true;
        setDetails("");
        hideProgress();
    }
  }

  // Wire buttons
  btnCheck.addEventListener("click", () => {
    window.electronAPI.update.check();
  });
  btnDownload.addEventListener("click", () => {
    window.electronAPI.update.download();
  });
  btnInstall.addEventListener("click", () => {
    window.electronAPI.update.install();
  });
  btnOpenWindow.addEventListener("click", () => {
    window.electronAPI.update.open();
  });
  btnSimulate.addEventListener("click", () => {
    // in dev we reuse check which triggers simulation
    window.electronAPI.update.check();
  });

  // Listen to events
  const unsubStatus = window.electronAPI.update.onStatus((payload) => {
    setState(payload);
  });
  const unsubProgress = window.electronAPI.update.onProgress((p) => {
    setProgress(p?.percent);
    setState({ status: "downloading", info: p });
  });

  // Toggle dev row visibility
  window.electronAPI.isDev().then((isDev) => {
    if (isDev) devRow.classList.remove("hidden");
  });

  // Initial state
  setState({ status: "idle" });
})();
