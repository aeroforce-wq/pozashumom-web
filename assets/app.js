(() => {
  const valid = new Set(["instagram","threads","facebook","youtube","tiktok","telegram"]);
  let source="direct";
  try {
    const pending=sessionStorage.getItem("medx_pending_source");
    if(valid.has(pending)) source=pending;
    sessionStorage.removeItem("medx_pending_source");
    localStorage.setItem("medx_last_source",source);
    localStorage.setItem("medx_last_source_at",new Date().toISOString());
  } catch (_) {}
  document.documentElement.dataset.source=source;
  window.MEDX=Object.freeze({brand:"Поза Шумом",domain:"pozashumom.com",source});
  document.querySelectorAll("[data-platform]").forEach(link=>link.addEventListener("click",()=>{
    const detail={event:"medx_outbound",source,destination:link.dataset.platform};
    window.dispatchEvent(new CustomEvent("medx:outbound",{detail}));
    if(Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  }));
})();