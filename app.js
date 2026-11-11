// Ombrelune Studio : diaporama Diablofus, braises de l'accueil, nouveautés et classement lus à chaque visite.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ligne = (d, t) => `<li><span>${esc(d)}</span><b>${esc(t)}</b></li>`;
  const jj = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${m[3]}/${m[2]}` : ""; };
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Diaporama : une image toutes les 4,5 s, points cliquables, pause au survol.
  const figs = [...document.querySelectorAll("#slides figure")], dots = $("dots");
  let cur = 0, timer = null, pause = false;
  figs.forEach((_, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Image " + (i + 1)); b.onclick = () => go(i, true); dots.appendChild(b); });
  const go = (i, user) => { figs[cur].classList.remove("on"); dots.children[cur].classList.remove("on"); cur = (i + figs.length) % figs.length; figs[cur].classList.add("on"); dots.children[cur].classList.add("on"); if (user) restart(); };
  const restart = () => { clearInterval(timer); if (!calme) timer = setInterval(() => { if (!pause && !document.hidden) go(cur + 1); }, 4500); };
  const show = document.querySelector(".show");
  show.addEventListener("mouseenter", () => (pause = true)); show.addEventListener("mouseleave", () => (pause = false));
  go(0); restart();

  // Lien de Diablofus à copier sur téléphone.
  const cl = $("copyLink");
  if (cl) cl.onclick = () => {
    const url = "https://diablofus.com/";
    const ok = () => { cl.textContent = "Lien copié !"; setTimeout(() => (cl.textContent = "Copier le lien de Diablofus"), 1800); };
    if (navigator.share) { navigator.share({ title: "Diablofus", url }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(url).then(ok, () => prompt("Lien de Diablofus :", url)); } catch (e) { prompt("Lien de Diablofus :", url); }
  };

  // Braises qui montent dans l'accueil (s'arrêtent si l'onglet est caché ou si l'appareil demande moins d'animations).
  const c = $("fx");
  if (c && !calme) {
    const x = c.getContext("2d"); let W, H; const P = [];
    const size = () => { const r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); };
    const born = (y) => ({ x: Math.random() * W, y: y ?? H + 10, r: 0.8 + Math.random() * 2.2, v: 0.4 + Math.random() * 1, w: Math.random() * 6.28, col: Math.random() < 0.7 ? "255,160,60" : "255,225,140" });
    size(); addEventListener("resize", size);
    for (let i = 0; i < (W < 600 ? 35 : 70); i++) P.push(born(Math.random() * H));
    const tick = () => {
      if (document.hidden) { setTimeout(tick, 600); return; }
      x.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.v; p.w += 0.03; p.x += Math.sin(p.w) * 0.3;
        x.beginPath(); x.fillStyle = `rgba(${p.col},${Math.min(1, p.y / H + 0.15) * (0.55 + 0.45 * Math.sin(p.w * 2))})`;
        x.arc(p.x, p.y, p.r, 0, 6.28); x.fill();
        if (p.y < -10) Object.assign(p, born());
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  // Nouveautés des deux jeux (si un jeu ne répond pas, la liste écrite dans la page reste).
  fetch("https://raw.githubusercontent.com/Mathiss29/dofus-diablo/main/src/data/journal.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      const l = (d.carnets || []).filter((x) => x.date && x.titre).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
      if (l.length) $("newsDiablo").innerHTML = l.map((x) => ligne(jj(x.date), x.titre)).join("");
    }).catch(() => {});
  fetch("https://idlus.github.io/changelog.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      const v = (d.versions || []).slice(0, 3);
      if (v.length) $("newsIdlus").innerHTML = v.map((x) => ligne(x.v, x.name)).join("");
      if (d.version) $("verIdlus").textContent = "version " + d.version;
    }).catch(() => {});

  // Classement Diablofus en direct. À activer (true) quand le serveur de Diablofus autorise cette page
  // (en-tête Access-Control-Allow-Origin), sinon le navigateur bloque la demande et affiche une erreur.
  const CLASSEMENT = true;
  const CL = { iop: "Iop", cra: "Crâ", osamodas: "Osamodas", sacrieur: "Sacrieur" };
  if (CLASSEMENT) fetch("https://api.diablofus.com/classement")
    .then((r) => r.json())
    .then((d) => {
      const ps = Object.values(d.persos || {}).sort((a, b) => b.niveau - a.niveau || b.xp - a.xp).slice(0, 5);
      if (!ps.length) return;
      $("ladList").innerHTML = ps.map((p) => `<li><b>${esc(p.nom)}</b><span>${esc(CL[p.classe] || p.classe)} · ${esc(p.lieu || "")}</span><em>niv. ${+p.niveau}</em></li>`).join("");
      $("ladInfo").textContent = `${d.total || ps.length} aventuriers classés · mis à jour en direct`;
      $("ladder").hidden = false;
    }).catch(() => {});
})();
