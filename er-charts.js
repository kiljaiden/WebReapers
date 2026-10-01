/* =========================================================
   er-charts.js — GRAFICAS SVG PURAS (sin librerias)
   =========================================================
   window.erCharts.line(el, datos, opts)  -> evolucion DKP por miembro
       datos = [{ label:'12 Sep', value: 340 }, ...]
   window.erCharts.bars(el, datos, opts)  -> DKP ganado por raid
       datos = [{ label:'ToC', value: 85 }, ...]
   Ambas con animacion de dibujo, tooltips hover y modo claro.
   Uso en dkp.html: erCharts.line(document.querySelector('#dkpChart'), rows)
   ========================================================= */
window.erCharts = (function () {
    const NS = 'http://www.w3.org/2000/svg';
    let uid = 0;

    function mk(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }
    function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

    function frame(el, w, h, pad) {
        el.innerHTML = '';
        const svg = mk('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', height: h, class: 'er-chart' });
        el.appendChild(svg);
        return svg;
    }

    function gridAndAxes(svg, w, h, pad, maxV, labels) {
        const iw = w - pad * 2, ih = h - pad * 2;
        for (let i = 0; i <= 4; i++) {
            const y = pad + ih - (ih * i / 4);
            svg.appendChild(mk('line', { x1: pad, y1: y, x2: w - pad, y2: y, stroke: 'rgba(133,139,153,.18)', 'stroke-dasharray': '3 4' }));
            const t = mk('text', { x: pad - 6, y: y + 4, 'text-anchor': 'end', fill: '#858b99', 'font-size': 10 });
            t.textContent = Math.round(maxV * i / 4);
            svg.appendChild(t);
        }
        return { iw, ih };
    }

    window.erCharts.line = function (el, data, opts = {}) {
        if (!el || !data || !data.length) return;
        const w = 720, h = opts.height || 260, pad = 34;
        const svg = frame(el, w, h, pad);
        const maxV = Math.max(...data.map(d => d.value), 1) * 1.1;
        const { iw, ih } = gridAndAxes(svg, w, h, pad, maxV);
        const gold = getComputedStyle(document.documentElement).getPropertyValue('--wow-gold').trim() || '#f8b700';
        const gid = 'erg' + (++uid);

        const defs = mk('defs', {});
        defs.innerHTML = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${gold}" stop-opacity=".38"/>
            <stop offset="100%" stop-color="${gold}" stop-opacity="0"/></linearGradient>`;
        svg.appendChild(defs);

        const X = i => pad + (data.length === 1 ? iw / 2 : iw * i / (data.length - 1));
        const Y = v => pad + ih - (v / maxV) * ih;

        let dPath = '', dArea = '';
        data.forEach((d, i) => {
            const x = X(i), y = Y(d.value);
            dPath += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        });
        dArea = dPath + ` L${X(data.length - 1)} ${pad + ih} L${X(0)} ${pad + ih} Z`;

        const area = mk('path', { d: dArea, fill: `url(#${gid})`, opacity: 0 });
        const path = mk('path', { d: dPath, fill: 'none', stroke: gold, 'stroke-width': 2.5, 'stroke-linecap': 'round', filter: 'drop-shadow(0 0 6px rgba(248,183,0,.4))' });
        svg.appendChild(area); svg.appendChild(path);

        // animacion de trazado
        const len = path.getTotalLength ? path.getTotalLength() : 1000;
        path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
        requestAnimationFrame(() => {
            path.style.transition = 'stroke-dashoffset 1.2s ease';
            path.style.strokeDashoffset = '0';
            area.style.transition = 'opacity 1s ease .5s'; area.setAttribute('opacity', '1');
        });

        data.forEach((d, i) => {
            const c = mk('circle', { cx: X(i), cy: Y(d.value), r: 3.5, fill: '#101216', stroke: gold, 'stroke-width': 2, class: 'er-pt' });
            const tip = mk('title', {}); tip.textContent = `${d.label}: ${d.value}`;
            c.appendChild(tip); svg.appendChild(c);
            if (data.length <= 14 || i % Math.ceil(data.length / 12) === 0) {
                const t = mk('text', { x: X(i), y: h - 8, 'text-anchor': 'middle', fill: '#858b99', 'font-size': 10 });
                t.textContent = esc(d.label); svg.appendChild(t);
            }
        });
    };

    window.erCharts.bars = function (el, data, opts = {}) {
        if (!el || !data || !data.length) return;
        const w = 720, h = opts.height || 260, pad = 34;
        const svg = frame(el, w, h, pad);
        const maxV = Math.max(...data.map(d => d.value), 1) * 1.1;
        const { iw, ih } = gridAndAxes(svg, w, h, pad, maxV);
        const gold = getComputedStyle(document.documentElement).getPropertyValue('--wow-gold').trim() || '#f8b700';
        const bw = Math.min(46, iw / data.length * 0.62);

        data.forEach((d, i) => {
            const x = pad + iw * (i + 0.5) / data.length - bw / 2;
            const bh = (d.value / maxV) * ih;
            const r = mk('rect', { x, y: pad + ih, width: bw, height: 0, rx: 3,
                fill: `url(#bg)` , class: 'er-bar' });
            const gradId = 'erb' + (++uid);
            if (!svg.querySelector('#' + gradId)) {
                const defs = mk('defs', {});
                defs.innerHTML = `<linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${gold}"/><stop offset="100%" stop-color="#8a6400"/></linearGradient>`;
                svg.appendChild(defs);
            }
            r.setAttribute('fill', `url(#${gradId})`);
            const tip = mk('title', {}); tip.textContent = `${d.label}: ${d.value} DKP`;
            r.appendChild(tip); svg.appendChild(r);
            requestAnimationFrame(() => {
                r.style.transition = `y .8s cubic-bezier(.2,.8,.3,1) ${i * 60}ms, height .8s cubic-bezier(.2,.8,.3,1) ${i * 60}ms`;
                r.setAttribute('y', pad + ih - bh); r.setAttribute('height', Math.max(bh, 1));
            });
            const t = mk('text', { x: x + bw / 2, y: h - 8, 'text-anchor': 'middle', fill: '#858b99', 'font-size': 10 });
            t.textContent = esc(d.label.length > 9 ? d.label.slice(0, 8) + '…' : d.label);
            svg.appendChild(t);
        });
    };
})();
