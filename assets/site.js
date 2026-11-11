"use strict";
(() => {
  const search = document.getElementById("search");
  if (!search) return;
  const grid = document.getElementById("stock-grid");
  const cards = Array.from(grid.querySelectorAll(".stock-card"));
  const sort = document.getElementById("sort");
  const buttons = Array.from(document.querySelectorAll("[data-filter]"));
  const selected = {market: "", state: ""};
  function apply() {
    const query = search.value.trim().normalize("NFKC").toLocaleLowerCase();
    const ordered = cards.slice().sort((a, b) => {
      if (sort.value === "ticker") return a.dataset.ticker.localeCompare(b.dataset.ticker, "en", {numeric: true});
      if (sort.value === "due") return (a.dataset.due || "9999").localeCompare(b.dataset.due || "9999") || a.dataset.ticker.localeCompare(b.dataset.ticker);
      return b.dataset.issued.localeCompare(a.dataset.issued) || a.dataset.ticker.localeCompare(b.dataset.ticker);
    });
    let visible = 0;
    for (const card of ordered) {
      card.hidden = !card.dataset.search.normalize("NFKC").includes(query) || !!(selected.market && card.dataset.market !== selected.market) || !!(selected.state && card.dataset[selected.state] !== "1");
      if (!card.hidden) visible++;
      grid.appendChild(card);
    }
    document.getElementById("shown").textContent = `顯示 ${visible} / ${cards.length} 檔`;
    document.getElementById("empty").hidden = visible !== 0;
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    selected[button.dataset.filter] = button.dataset.value;
    buttons.filter(b => b.dataset.filter === button.dataset.filter).forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    apply();
  }));
  search.addEventListener("input", apply);
  sort.addEventListener("change", apply);
  document.getElementById("clear-search").addEventListener("click", () => { search.value = ""; apply(); search.focus(); });
  document.getElementById("reset-filters").addEventListener("click", () => {
    search.value = ""; selected.market = ""; selected.state = "";
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.value === "")));
    apply(); search.focus();
  });
  document.getElementById("search-form").addEventListener("submit", event => {
    event.preventDefault();
    const visible = cards.filter(card => !card.hidden);
    if (visible.length === 1) window.location.href = visible[0].getAttribute("href");
  });
  apply();
})();
(() => {
  // 瀏覽計數：與選股站相同，正式網址每載入一次頁面 +1（2026-11-11 Henry：原本同一瀏覽器一天只算一次，
  // 看過之後怎麼開都不動，像壞掉）；本機預覽只讀不加。
  const box = document.getElementById("visits");
  if (!box || typeof fetch !== "function" || typeof location === "undefined") return;
  const counting = location.hostname === "sugnis.github.io";
  // 一次請求同時拿今日與累積；今日的日期由計數伺服器以台北時間判定。
  const call = (action, method) => {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;
    return fetch("https://sugnis-visit-counter.ongxin-rchard-emo.workers.dev/" + action + "/research", {method, referrerPolicy: "no-referrer", cache: "no-store", signal: controller ? controller.signal : undefined})
      .then(response => {
        if (timer) clearTimeout(timer);
        return response.ok ? response.json() : Promise.reject(new Error(String(response.status)));
      });
  };
  // 加數失敗只改讀一次、不重送加數。
  const hit = counting ? call("hit", "POST") : Promise.reject(new Error("read-only"));
  hit.catch(() => call("get", "GET")).then(body => {
    const today = Number(body.today), total = Number(body.total);
    if (!Number.isFinite(today) || !Number.isFinite(total)) return;
    document.getElementById("vc-today").textContent = today.toLocaleString("zh-TW");
    document.getElementById("vc-total").textContent = total.toLocaleString("zh-TW");
    box.hidden = false;
  }).catch(() => {});
})();
