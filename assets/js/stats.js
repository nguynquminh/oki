const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/full-stats`);
    const { data } = await res.json();

    const container = document.getElementById("placeholder-content");
    if (data && data.stats) {
      container.innerHTML = `
                <div class="list-card reveal">
                    <div class="card-header">
                        <h3 class="card-title">Thông số chi tiết</h3>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p><strong>Total Guilds:</strong> ${data.stats.totalGuilds}</p>
                        <p><strong>Total Members:</strong> ${data.stats.totalMembers}</p>
                        <p><strong>Total Commands:</strong> ${data.stats.totalCommands}</p>
                        <p><strong>Bot Status:</strong> ${data.stats.botStatus}</p>
                        <p><strong>Ping:</strong> ${data.stats.ping} ms</p>
                    </div>
                </div>
            `;
    } else {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--charcoal-muted);">Không có dữ liệu thống kê.</div>`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById("placeholder-content").innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--rose);">Lỗi khi tải dữ liệu thống kê.</div>`;
  }
});
