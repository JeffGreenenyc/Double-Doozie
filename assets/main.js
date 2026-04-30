(function(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navlinks a").forEach(a=>{
    const href = a.getAttribute("href");
    if(href === path) a.classList.add("active");
  });

  // Projects lens toggle + filters
  const lens = document.querySelector("[data-lens]");
  if(lens){
    const buttons = lens.querySelectorAll("button[data-set-lens]");
    const cards = document.querySelectorAll("[data-project]");

    const applyLens = (value) => {
      buttons.forEach(b=>b.classList.toggle("active", b.dataset.setLens === value));
      cards.forEach(c=>{
        // each card has data-lens-order-growth and data-lens-order-analytics
        const ord = Number(c.dataset["lensOrder" + (value === "growth" ? "Growth" : "Analytics")] || 999);
        c.style.order = ord;
        // highlight primary label
        c.querySelectorAll("[data-tag-primary]").forEach(el=>{
          el.textContent = (value === "growth") ? (c.dataset.primaryGrowth || "") : (c.dataset.primaryAnalytics || "");
        });
      });
    };

    buttons.forEach(b=>b.addEventListener("click", ()=>applyLens(b.dataset.setLens)));
    applyLens("growth");

    const filterRow = document.querySelector("[data-filters]");
    if(filterRow){
      const fBtns = filterRow.querySelectorAll("button[data-filter]");
      const applyFilter = (tag) => {
        fBtns.forEach(x=>x.classList.toggle("active", x.dataset.filter === tag));
        cards.forEach(c=>{
          const tags = (c.dataset.tags || "").split(",").map(s=>s.trim()).filter(Boolean);
          c.style.display = (tag === "all" || tags.includes(tag)) ? "" : "none";
        });
      };
      fBtns.forEach(x=>x.addEventListener("click", ()=>applyFilter(x.dataset.filter)));
      applyFilter("all");
    }
  }
})();