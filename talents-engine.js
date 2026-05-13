let talentData = null;
let globalPoints = 71;
let activeClass = null;
let buildState = {}; // Estructura: { treeIdx: [puntos_por_talento] }

const traducciones = {
    "deathknight": "Caballero de la Muerte",
    "paladin": "Paladín",
    "warrior": "Guerrero",
    "Blood": "Sangre", "Frost": "Escarcha", "Unholy": "Profano"
};

// Cargar Datos
async function init() {
    try {
        const response = await fetch('talentos.json');
        talentData = await response.json();
        renderSidebar();
        if (talentData.classes.length > 0) loadClass(talentData.classes[0].id);
    } catch (e) {
        console.error("Error cargando talentos.json", e);
    }
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar-classes');
    sidebar.innerHTML = '<div class="sidebar-title">Clases (WotLK 3.3.5a)</div>';
    talentData.classes.forEach(cls => {
        const item = document.createElement('div');
        item.className = `nav-item ${activeClass?.id === cls.id ? 'active' : ''}`;
        item.innerHTML = `<img src="icons/${cls.id}.jpg"> <span>${traducciones[cls.id] || cls.name}</span>`;
        item.onclick = () => loadClass(cls.id);
        sidebar.appendChild(item);
    });
}

function loadClass(classId) {
    activeClass = talentData.classes.find(c => c.id === classId);
    document.getElementById('display-class-name').innerText = traducciones[classId] || activeClass.name;
    globalPoints = 71;
    buildState = {};
    renderTrees();
    renderSidebar();
}

function renderTrees() {
    const wrapper = document.getElementById('trees-wrapper');
    wrapper.innerHTML = '';

    activeClass.trees.forEach((tree, treeIdx) => {
        buildState[treeIdx] = Array(tree.talents.length).fill(0);
        const panel = document.createElement('div');
        panel.className = 'tree-panel';
        panel.innerHTML = `
            <div class="tree-bg" style="background-image: url('img/${tree.background}')"></div>
            <div class="tree-header">
                <div class="tree-title">${traducciones[tree.name] || tree.name}</div>
                <div class="tree-pts-count" id="tree-pts-${treeIdx}">0</div>
            </div>
            <div class="tree-grid" id="grid-${treeIdx}"></div>
        `;

        const grid = panel.querySelector('.tree-grid');
        for (let i = 0; i < 44; i++) {
            const r = Math.floor(i / 4);
            const c = i % 4;
            const tIdx = tree.talents.findIndex(t => t.row === r && t.col === c);

            if (tIdx !== -1) {
                const talent = tree.talents[tIdx];
                const slot = document.createElement('div');
                slot.className = 'talent-slot disabled';
                slot.id = `talent-${treeIdx}-${tIdx}`;
                
                // Cálculo Spritesheet
                const x = (talent.icon % 10) * 44;
                const y = Math.floor(talent.icon / 10) * 44;

                slot.innerHTML = `
                    <div class="talent-icon" style="background-image: url('img/${tree.spriteSheet}'); background-position: -${x}px -${y}px;"></div>
                    <div class="talent-rank">0/${talent.maxRank}</div>
                `;
                slot.setAttribute('data-wowhead', `spell&name=${talent.name.replace(/ /g, '+')}&domain=es.wotlk`);
                slot.onmousedown = (e) => handleTalentAction(e, treeIdx, tIdx);
                grid.appendChild(slot);
            } else {
                grid.appendChild(document.createElement('div'));
            }
        }
        wrapper.appendChild(panel);
    });
    refreshUI();
}

function handleTalentAction(e, treeIdx, tIdx) {
    const isLeft = e.button === 0;
    const isRight = e.button === 2;
    const talent = activeClass.trees[treeIdx].talents[tIdx];
    const current = buildState[treeIdx][tIdx];

    if (isLeft) {
        if (globalPoints <= 0 || current >= talent.maxRank) return;
        const totalInTree = buildState[treeIdx].reduce((a, b) => a + b, 0);
        if (totalInTree < talent.row * 5) return;
        if (talent.attached !== "none") {
            const pIdx = activeClass.trees[treeIdx].talents.findIndex(t => t.name === talent.attached);
            if (buildState[treeIdx][pIdx] < activeClass.trees[treeIdx].talents[pIdx].maxRank) return;
        }
        buildState[treeIdx][tIdx]++; globalPoints--;
    } else if (isRight) {
        if (current <= 0) return;
        const totalInTree = buildState[treeIdx].reduce((a, b) => a + b, 0);
        let canRemove = true;
        activeClass.trees[treeIdx].talents.forEach((t, idx) => {
            if (buildState[treeIdx][idx] > 0 && t.row > talent.row) {
                if (totalInTree - 1 < t.row * 5) canRemove = false;
            }
            if (t.attached === talent.name && buildState[treeIdx][idx] > 0) {
                if (current - 1 < talent.maxRank) canRemove = false;
            }
        });
        if (!canRemove) return;
        buildState[treeIdx][tIdx]--; globalPoints++;
    }
    refreshUI();
}

function refreshUI() {
    document.getElementById('global-points').innerText = globalPoints;
    activeClass.trees.forEach((tree, treeIdx) => {
        const totalTree = buildState[treeIdx].reduce((a, b) => a + b, 0);
        document.getElementById(`tree-pts-${treeIdx}`).innerText = totalTree;
        tree.talents.forEach((talent, tIdx) => {
            const el = document.getElementById(`talent-${treeIdx}-${tIdx}`);
            const pts = buildState[treeIdx][tIdx];
            el.querySelector('.talent-rank').innerText = `${pts}/${talent.maxRank}`;
            el.classList.remove('disabled', 'available', 'active', 'maxed');
            const reqRow = totalTree >= talent.row * 5;
            let reqDep = true;
            if (talent.attached !== "none") {
                const pIdx = tree.talents.findIndex(t => t.name === talent.attached);
                reqDep = buildState[treeIdx][pIdx] >= tree.talents[pIdx].maxRank;
            }
            if (pts === talent.maxRank) el.classList.add('maxed');
            else if (pts > 0) el.classList.add('active');
            else if (reqRow && reqDep) el.classList.add('available');
            else el.classList.add('disabled');
        });
    });
    if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
}

function resetBuild() { loadClass(activeClass.id); }
function exportBuild() { alert("Build Code: " + Object.values(buildState).map(t => t.join('')).join('-')); }

window.onload = init;