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
  // 瀏覽計數：同一瀏覽器每個台北日只加一次（今日＝當天人次，累積＝每日人次加總）；本機預覽只讀不加。
  const box = document.getElementById("visits");
  if (!box || typeof fetch !== "function" || typeof location === "undefined") return;
  let day;
  try {
    day = "d" + new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()).replace(/-/g, "");
  } catch (error) { return; }
  if (!/^d\d{8}$/.test(day)) return;
  const seenKey = "sugnis-visit-" + day;
  let seen = false;
  try { seen = localStorage.getItem(seenKey) === "1"; } catch (error) {}
  const counting = location.hostname === "sugnis.github.io" && !seen;
  const base = "https://abacus.jasoncameron.dev/" + (counting ? "hit/" : "get/") + "sugnis-research-site/";
  const show = (id, value) => {
    if (!Number.isFinite(value)) return;
    document.getElementById(id).textContent = value.toLocaleString("zh-TW");
    box.hidden = false;
  };
  const read = key => fetch(base + key, {referrerPolicy: "no-referrer", cache: "no-store"})
    .then(response => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
    .then(body => Number(body.value));
  Promise.allSettled([read("total").then(value => show("vc-total", value)), read(day).then(value => show("vc-today", value))]).then(results => {
    if (counting && results.every(result => result.status === "fulfilled")) {
      try { localStorage.setItem(seenKey, "1"); } catch (error) {}
    }
  });
})();
