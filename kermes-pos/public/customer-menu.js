(function () {
  const STORAGE_KEY = "kermes.menu.data.v1";
  const CHANNEL = "kermes-menu-channel";
  const titleEl = document.getElementById("menu-title");
  const listEl = document.getElementById("menu-list");
  const printBtn = document.getElementById("print-btn");

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  function render(data) {
    if (!data) {
      listEl.innerHTML =
        '<div style="text-align:center;color:#999">No data</div>';
      return;
    }
    const {
      title = "Menu",
      currency = "€",
      showCategories = true,
      columns = 2,
      fontSize = 16,
      items = [],
    } = data;
    titleEl.textContent = title;
    listEl.innerHTML = "";
    // Apply layout styles
    const root = document.querySelector(".menu-container");
    if (root) {
      root.style.setProperty("--fontSize", fontSize + "px");
      root.style.setProperty("--columns", Math.max(1, Math.min(3, columns)));
    }

    if (showCategories) {
      // Group items by category
      const groupsMap = {};
      items.forEach((p) => {
        const c = p.category || "other";
        (groupsMap[c] || (groupsMap[c] = [])).push(p);
      });

      // Convert to list and sort by size desc for greedy balancing
      const groupList = Object.keys(groupsMap)
        .map((cat) => ({
          cat,
          items: groupsMap[cat],
        }))
        .sort((a, b) => b.items.length - a.items.length);

      const colCount = clamp(columns, 1, 3);
      const cols = Array.from({ length: colCount }, () => ({
        size: 0,
        groups: [],
      }));

      // Greedy distribute by number of items per category
      for (const g of groupList) {
        let target = 0;
        for (let i = 1; i < cols.length; i++) {
          if (cols[i].size < cols[target].size) target = i;
        }
        cols[target].groups.push(g);
        cols[target].size += g.items.length;
      }

      // Render columns with their groups
      cols.forEach((c) => {
        const col = document.createElement("div");
        col.className = "menu-col";
        c.groups
          // keep a stable order within the column by category name
          .sort((a, b) => a.cat.localeCompare(b.cat))
          .forEach(({ cat, items }) => {
            col.appendChild(categorySection(cat, items, currency));
          });
        listEl.appendChild(col);
      });
    } else {
      const chunks = chunk(items, Math.max(1, Math.min(3, columns)));
      chunks.forEach((chunkItems) => {
        const col = document.createElement("div");
        col.className = "menu-col";
        chunkItems.forEach((p) => col.appendChild(itemRow(p, currency)));
        listEl.appendChild(col);
      });
    }
  }

  function itemRow(p, currency) {
    const row = document.createElement("div");
    row.className = "menu-item";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = p.name;
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `${p.price} ${currency}`;
    row.appendChild(name);
    row.appendChild(price);
    return row;
  }
  function capitalize(s) {
    return (s || "").charAt(0).toUpperCase() + s.slice(1);
  }

  function chunk(arr, parts) {
    const n = Math.max(1, Math.min(3, parts || 1));
    const size = Math.ceil((arr?.length || 0) / n);
    const out = [];
    for (let i = 0; i < n; i++) out.push(arr.slice(i * size, (i + 1) * size));
    return out;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v == null ? min : v));
  }

  function categorySection(cat, items, currency) {
    const group = document.createElement("div");
    group.className = "menu-category";
    const header = document.createElement("div");
    header.className = "category-title";
    header.textContent = capitalize(cat);
    group.appendChild(header);
    items.forEach((p) => group.appendChild(itemRow(p, currency)));
    return group;
  }

  // Load from localStorage initially
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
    render(cached);
  } catch {}

  // Listen live via BroadcastChannel
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (ev) => {
      if (ev?.data?.type === "menu:data") {
        render(ev.data.payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ev.data.payload));
      }
    };
  } catch {}
})();
