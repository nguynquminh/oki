(function () {
    const canvas = document.getElementById('heartCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawHeart(cx, cy, size) {
        ctx.beginPath();
        const th = size * 0.3;
        ctx.moveTo(cx, cy + th);
        ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + th);
        ctx.bezierCurveTo(cx - size / 2, cy + (size + th) / 2, cx, cy + (size + th) / 1.3, cx, cy + size);
        ctx.bezierCurveTo(cx, cy + (size + th) / 1.3, cx + size / 2, cy + (size + th) / 2, cx + size / 2, cy + th);
        ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + th);
        ctx.closePath();
    }

    class Heart {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 30 + Math.random() * 200;
            this.size = Math.random() * 12 + 6;
            this.vy = -(Math.random() * 0.4 + 0.15);
            this.vx = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.12 + 0.03;
            this.rot = Math.random() * Math.PI * 2;
            this.rotV = (Math.random() - 0.5) * 0.008;
            const colors = [
                'rgba(255,133,169,', 'rgba(255,173,198,',
                'rgba(255,105,180,', 'rgba(212,160,168,',
                'rgba(255,194,212,', 'rgba(255,68,159,'
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        update() {
            this.y += this.vy;
            this.x += this.vx + Math.sin(this.y * 0.004) * 0.15;
            this.rot += this.rotV;
            if (this.y < -40) this.reset();
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color + '1)';
            drawHeart(0, 0, this.size);
            ctx.fill();
            ctx.restore();
        }
    }

    const count = Math.min(Math.floor(window.innerWidth / 45), 40);
    for (let i = 0; i < count; i++) {
        const h = new Heart();
        h.y = Math.random() * canvas.height;
        particles.push(h);
    }

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(loop);
    }
    loop();
})();

const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobileToggle');
const mobileOverlay = document.getElementById('mobileOverlay');

function toggleSidebar() {
    sidebar.classList.toggle('open');
    mobileOverlay.classList.toggle('active');
}

mobileToggle.addEventListener('click', toggleSidebar);
mobileOverlay.addEventListener('click', toggleSidebar);

const revealEls = document.querySelectorAll('.reveal');
const scrollContainer = document.getElementById('mainScroll');

function checkReveal() {
    const rect = scrollContainer.getBoundingClientRect();
    revealEls.forEach(el => {
        const elRect = el.getBoundingClientRect();
        if (elRect.top < rect.bottom - 60) {
            el.classList.add('visible');
        }
    });
}

scrollContainer.addEventListener('scroll', checkReveal, { passive: true });
window.addEventListener('load', () => setTimeout(checkReveal, 100));

const API_BASE = 'http://localhost:3000';
const REFRESH_INTERVAL_MS = 30_000;

let areaChartInstance = null;
let pieChartInstance = null;

function initCharts() {
    const areaCtx = document.getElementById('areaChart').getContext('2d');

    const areaGrad1 = areaCtx.createLinearGradient(0, 0, 0, 300);
    areaGrad1.addColorStop(0, 'rgba(255, 107, 149, 0.3)');
    areaGrad1.addColorStop(1, 'rgba(255, 107, 149, 0.01)');

    const areaGrad2 = areaCtx.createLinearGradient(0, 0, 0, 300);
    areaGrad2.addColorStop(0, 'rgba(183, 110, 121, 0.2)');
    areaGrad2.addColorStop(1, 'rgba(183, 110, 121, 0.01)');

    areaChartInstance = new Chart(areaCtx, {
        type: 'line',
        data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [
                {
                    label: 'Lệnh thực thi',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#ff6b95',
                    backgroundColor: areaGrad1,
                    borderWidth: 3, tension: 0.45, fill: true,
                    pointRadius: 5, pointBackgroundColor: '#ff6b95',
                    pointBorderColor: '#fff', pointBorderWidth: 2,
                    pointHoverRadius: 8, pointHoverBorderWidth: 3,
                },
                {
                    label: 'Tuần trước',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#b76e79',
                    backgroundColor: areaGrad2,
                    borderWidth: 2, borderDash: [6, 4],
                    tension: 0.45, fill: true,
                    pointRadius: 0, pointHoverRadius: 5,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { family: "'Poppins', sans-serif", size: 12 }, color: '#6b6b6b' }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.92)', titleColor: '#3d3d3d',
                    bodyColor: '#6b6b6b', borderColor: 'rgba(255,133,169,0.3)',
                    borderWidth: 1, cornerRadius: 12, padding: 14, displayColors: true, boxPadding: 6,
                    titleFont: { family: "'Playfair Display', serif", size: 14, weight: '600' },
                    bodyFont: { family: "'Poppins', sans-serif", size: 12 },
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,133,169,0.06)', drawBorder: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 11 }, color: '#999', padding: 10 } },
                x: { grid: { display: false }, ticks: { font: { family: "'Poppins', sans-serif", size: 11 }, color: '#999', padding: 8 } }
            }
        }
    });

    const pieCtx = document.getElementById('pieChart').getContext('2d');

    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#ff6b95', '#ffadc6', '#b76e79', '#ffc2d4', '#ff449f', '#ffe8ef'],
                borderColor: 'rgba(255,250,245,0.9)',
                borderWidth: 4, hoverBorderColor: '#fff',
                hoverBorderWidth: 5, hoverOffset: 12
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, pointStyle: 'rectRounded', padding: 16, font: { family: "'Poppins', sans-serif", size: 11 }, color: '#6b6b6b' }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.92)', titleColor: '#3d3d3d',
                    bodyColor: '#6b6b6b', borderColor: 'rgba(255,133,169,0.3)',
                    borderWidth: 1, cornerRadius: 12, padding: 14,
                    titleFont: { family: "'Playfair Display', serif", size: 13, weight: '600' },
                    bodyFont: { family: "'Poppins', sans-serif", size: 12 },
                    callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}% users` }
                }
            }
        }
    });
}

function renderMetrics(data) {
    const isOnline = data.botStatus === 'online';

    const dot = document.getElementById('stat-status-dot');
    const txt = document.getElementById('stat-status-text');
    if (dot) {
        dot.style.background = isOnline ? 'var(--green)' : 'var(--red)';
        dot.style.boxShadow = isOnline
            ? '0 0 12px var(--green-glow), 0 0 24px var(--green-glow)'
            : '0 0 12px rgba(239,68,68,0.4)';
    }
    if (txt) {
        txt.textContent = isOnline ? 'Online' : 'Offline';
        txt.style.color = isOnline ? 'var(--green)' : 'var(--red)';
    }

    const guildsEl = document.getElementById('stat-total-guilds');
    if (guildsEl) guildsEl.textContent = data.totalGuilds.toLocaleString('vi-VN');

    const commandsEl = document.getElementById('stat-total-commands');
    if (commandsEl) commandsEl.textContent = data.totalCommands.toLocaleString('vi-VN');

    const guildsTrend = document.getElementById('stat-guilds-trend');
    if (guildsTrend) guildsTrend.innerHTML = `<i class="fas fa-arrow-up"></i> +${data.newGuildsThisMonth}`;

    const guildsSub = document.getElementById('stat-guilds-sub');
    if (guildsSub) guildsSub.textContent = `+${data.newGuildsThisMonth} servers trong tháng này`;

    const membersEl = document.getElementById('stat-total-members');
    if (membersEl) membersEl.textContent = data.totalMembers.toLocaleString('vi-VN');

    const membersTrend = document.getElementById('stat-members-trend');
    if (membersTrend) membersTrend.innerHTML = `<i class="fas fa-arrow-up"></i> +${(data.newMembersThisWeek / 1000).toFixed(1)}k`;

    const membersSub = document.getElementById('stat-members-sub');
    if (membersSub) membersSub.textContent = `Tăng ${data.memberGrowthPercent}% so với tuần trước`;

    const pingEl = document.getElementById('stat-ping');
    if (pingEl) {
        const color = data.ping < 80 ? 'var(--green)' : data.ping < 150 ? 'var(--yellow)' : 'var(--red)';
        pingEl.innerHTML = `<span style="color:${color}">${data.ping}</span><span style="font-size:1rem;color:var(--charcoal-muted);">ms</span>`;
    }
}

function renderCharts(data) {
    if (areaChartInstance && data.areaChart && data.areaChart.datasets) {
        areaChartInstance.data.labels = data.areaChart.labels;
        areaChartInstance.data.datasets[0].data = data.areaChart.datasets[0].data;
        areaChartInstance.data.datasets[1].data = data.areaChart.datasets[1].data;
        areaChartInstance.update('active');
    }

    if (pieChartInstance && data.pieChart && data.pieChart.datasets) {
        pieChartInstance.data.labels = data.pieChart.labels;
        pieChartInstance.data.datasets[0].data = data.pieChart.datasets[0].data;
        pieChartInstance.update('active');
    }
}

function renderServerStatus(guilds) {
    const container = document.getElementById('server-status-list');
    if (!container || !Array.isArray(guilds)) return;

    container.innerHTML = guilds.map(g => {
        const statusLabel = { online: 'Online', offline: 'Offline', idle: 'Idle' }[g.status] ?? g.status;
        const subText = g.status === 'offline'
            ? `Lần online cuối: ${g.lastSeenText ?? 'không rõ'}`
            : `Ping: ${g.ping}ms • Uptime: ${g.uptimeDays} ngày`;

        return `
      <div class="list-item">
        <span class="server-dot ${g.status}"></span>
        <div class="list-item-content">
          <div class="list-item-title">${escHtml(g.name)}</div>
          <div class="list-item-sub">${subText}</div>
        </div>
        <div style="text-align:right;">
          <span class="list-item-status ${g.status}">● ${statusLabel}</span>
          <div class="server-members">
            <i class="fas fa-users"></i> ${g.memberCount.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>`;
    }).join('');
}

function renderActivity(activities) {
    const container = document.getElementById('activity-list');
    if (!container || !Array.isArray(activities)) return;

    container.innerHTML = activities.slice(0, 5).map(act => {
        const timeAgo = getTimeAgo(new Date(act.timestamp));
        return `
      <div class="list-item">
        <div class="list-item-icon heart"><i class="fas ${escHtml(act.icon)}"></i></div>
        <div class="list-item-content">
          <div class="list-item-title">${escHtml(act.command)}</div>
          <div class="list-item-sub">User: ${escHtml(act.user)} • Server: ${escHtml(act.server)}</div>
        </div>
        <span class="list-item-time">${timeAgo}</span>
      </div>`;
    }).join('');
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getTimeAgo(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

async function fetchStats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) throw new Error(`/api/stats ${res.status}`);
    const json = await res.json();
    if (json.success) renderMetrics(json.data);
}

async function fetchDashboard() {
    const res = await fetch(`${API_BASE}/api/dashboard`);
    if (!res.ok) throw new Error(`/api/dashboard ${res.status}`);
    const json = await res.json();
    if (json.success) {
        renderCharts(json.data);
        renderServerStatus(json.data.topGuilds);
        renderActivity(json.data.recentActivity);
    }
}

async function refreshAll() {
    try {
        await Promise.all([fetchStats(), fetchDashboard()]);
    } catch (err) {
        console.warn('[Dashboard] Không thể kết nối bot API:', err.message);
    }
}

const liveIndicator = document.getElementById('liveIndicator');
setInterval(() => {
    if (liveIndicator)
        liveIndicator.style.opacity = liveIndicator.style.opacity === '0.4' ? '1' : '0.4';
}, 1200);

window.addEventListener('load', () => {
    initCharts();
    setTimeout(refreshAll, 200);
    setInterval(refreshAll, REFRESH_INTERVAL_MS);
});