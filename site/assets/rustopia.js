/* Rustopia: the island map behind the course route.
   Five regions, one per act, and a trail of 21 stepping stones, one per
   chapter. This file is art and coordinates only; the home page draws the
   interactive stones, progress and Oxi on top.

   OxMap.svg()   -> the island as an <svg> (viewBox 0 0 1000 660)
   OxMap.stones  -> [{ n, x, y }] chapter stones in map units
   OxMap.regions -> [{ act, name, sub, x, y }] label anchors
   OxMap.trail   -> the SVG path data of the trail through every stone */
(function () {
  "use strict";
  const STONES = [
    [130, 528], [212, 566], [302, 552], [366, 494],
    [300, 430], [208, 402], [158, 330], [214, 262],
    [302, 214], [392, 176], [482, 156], [566, 198], [526, 270],
    [470, 352], [562, 412], [642, 498], [742, 470],
    [826, 420], [872, 338], [842, 252], [782, 172],
  ].map(([x, y], i) => ({ n: i + 1, x, y }));

  // A smooth trail through the stones (Catmull-Rom to cubic Bezier).
  function smooth(pts) {
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x} ${p2.y}`;
    }
    return d;
  }
  const TRAIL = smooth(STONES);

  const REGIONS = [
    { act: 1, name: "Ore Hills", sub: "Foundations", x: 236, y: 618 },
    { act: 2, name: "Smelter Coast", sub: "The Ownership Trilogy", x: 104, y: 214 },
    { act: 3, name: "Cast Village", sub: "Shape Your Data", x: 446, y: 92 },
    { act: 4, name: "Temper Peaks", sub: "Abstraction Without Cost", x: 560, y: 566 },
    { act: 5, name: "Alloy City", sub: "Fearless & Fast", x: 878, y: 72 },
  ];

  const hill = (x, y, w, h, cls) => `<path class="${cls}" d="M${x - w / 2} ${y} Q${x - w / 4} ${y - h} ${x} ${y - h} Q${x + w / 4} ${y - h} ${x + w / 2} ${y} Z"/>`;
  const house = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect class="mp-wall" x="-12" y="-14" width="24" height="18" rx="2"/><path class="mp-roof" d="M-16 -13 L0 -28 L16 -13 Z"/><rect class="mp-window" x="-4" y="-9" width="8" height="8" rx="1"/></g>`;
  const tower = (x, y, w, h) => `<rect class="mp-tower" x="${x}" y="${y - h}" width="${w}" height="${h}" rx="3"/>` + Array.from({ length: Math.floor(h / 16) }, (_, i) => `<rect class="mp-window" x="${x + w / 2 - 3}" y="${y - h + 8 + i * 16}" width="6" height="7" rx="1"/>`).join("");
  const crate = (x, y) => `<rect class="mp-crate" x="${x}" y="${y}" width="14" height="12" rx="1.5"/><path class="mp-crate-line" d="M${x} ${y + 6} H${x + 14}"/>`;

  function svg() {
    return `<svg class="mp-svg" viewBox="0 0 1000 660" role="img" aria-label="Rustopia: the course as an island, from Ore Hills to Alloy City">
      <defs>
        <pattern id="mp-waves" width="80" height="40" patternUnits="userSpaceOnUse"><path class="mp-wave" d="M6 22 q8 -6 16 0 t16 0"/><path class="mp-wave" d="M46 8 q8 -6 16 0 t16 0"/></pattern>
      </defs>
      <rect class="mp-sea" x="0" y="0" width="1000" height="660" rx="18"/>
      <rect x="0" y="0" width="1000" height="660" rx="18" fill="url(#mp-waves)"/>
      <path class="mp-shallows" d="M52 476 C18 372 66 232 152 172 C230 116 304 66 414 58 C526 48 610 40 708 50 C816 60 924 96 966 186 C1002 262 976 352 956 432 C934 516 878 594 768 614 C664 636 560 604 470 626 C376 648 274 642 192 626 C104 610 66 556 52 476 Z"/>
      <path class="mp-land" d="M74 470 C44 378 86 252 164 196 C234 144 306 96 414 86 C522 76 604 70 704 80 C806 90 902 120 942 196 C976 264 952 344 932 422 C912 500 862 568 762 588 C662 608 562 580 472 600 C382 620 282 616 202 602 C124 588 88 544 74 470 Z"/>
      <path class="mp-blob mp-r1" d="M86 496 C92 452 160 444 250 452 C330 458 410 470 406 520 C402 574 340 600 250 600 C156 600 80 552 86 496 Z"/>
      <path class="mp-blob mp-r2" d="M104 402 C96 330 116 250 182 226 C250 202 292 250 300 318 C308 392 362 450 300 462 C236 474 112 470 104 402 Z"/>
      <path class="mp-blob mp-r3" d="M262 222 C266 160 340 120 450 116 C560 112 618 150 612 212 C606 278 560 300 480 296 C392 292 258 290 262 222 Z"/>
      <path class="mp-blob mp-r4" d="M432 352 C436 316 500 306 570 330 C650 356 790 410 780 478 C770 548 660 560 588 540 C510 518 428 404 432 352 Z"/>
      <path class="mp-blob mp-r5" d="M782 446 C756 382 790 300 800 236 C810 176 840 128 890 138 C940 148 934 236 922 300 C910 372 900 444 862 470 C826 494 800 480 782 446 Z"/>
      <!-- Ore Hills: rocky hills and a mine -->
      ${hill(176, 486, 96, 40, "mp-rock")}${hill(248, 482, 74, 30, "mp-rock-2")}${hill(102, 470, 60, 26, "mp-rock-2")}
      <path class="mp-mine" d="M390 592 V574 Q390 560 404 560 Q418 560 418 574 V592 Z"/><path class="mp-track" d="M376 596 H432 M380 600 H428"/>
      <!-- Smelter Coast: chimneys and a glowing pool -->
      <rect class="mp-chimney" x="118" y="250" width="12" height="40" rx="2"/><rect class="mp-chimney" x="138" y="262" width="12" height="28" rx="2"/>
      <circle class="mp-smoke" cx="124" cy="240" r="7"/><circle class="mp-smoke mp-smoke-2" cx="146" cy="252" r="6"/>
      <rect class="mp-furnace" x="112" y="286" width="44" height="22" rx="5"/>
      <ellipse class="mp-lava" cx="262" cy="350" rx="26" ry="11"/><ellipse class="mp-lava-2" cx="262" cy="350" rx="14" ry="5"/>
      <!-- Cast Village: houses and molds -->
      ${house(330, 168, 0.9)}${house(446, 214, 0.8)}${house(608, 162, 0.9)}${house(360, 274, 0.75)}
      <rect class="mp-mold" x="430" y="240" width="34" height="14" rx="3"/><rect class="mp-mold-cavity" x="434" y="243" width="26" height="8" rx="2"/>
      <!-- Temper Peaks: mountains and the anvil -->
      ${hill(682, 446, 120, 92, "mp-peak")}${hill(612, 470, 90, 60, "mp-peak-2")}${hill(744, 420, 70, 50, "mp-peak-2")}
      <path class="mp-snow" d="M664 372 L682 354 L700 372 L692 368 L682 376 L672 368 Z"/>
      <path class="mp-anvil" d="M486 450 H530 Q528 458 518 460 V468 H526 V474 H490 V468 H498 V460 Q490 458 486 450 Z"/>
      <!-- Alloy City: towers and the final flag -->
      ${tower(866, 206, 18, 70)}${tower(888, 214, 22, 92)}${tower(914, 222, 16, 56)}${tower(846, 226, 14, 44)}
      <path class="mp-pole" d="M782 172 V118"/><path class="mp-flag" d="M782 120 L812 128 L782 138 Z"/>
      <!-- the crates.io harbor -->
      <path class="mp-dock" d="M740 592 H828 V602 H740 Z M752 602 V622 M816 602 V622"/>
      ${crate(754, 578)}${crate(772, 578)}${crate(763, 566)}
      <text class="mp-note" x="808" y="642">crates.io harbor</text>
      <!-- the trail -->
      <path class="mp-trail-base" d="${TRAIL}"/>
      <path class="mp-trail" d="${TRAIL}"/>
      ${REGIONS.map((r) => `<g class="mp-label"><text class="mp-region" x="${r.x}" y="${r.y}">${r.name}</text><text class="mp-sub" x="${r.x}" y="${r.y + 18}">Act ${["I", "II", "III", "IV", "V"][r.act - 1]} · ${r.sub}</text></g>`).join("")}
    </svg>`;
  }

  window.OxMap = { svg, stones: STONES, regions: REGIONS, trail: TRAIL, w: 1000, h: 660 };
})();
