const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/servers`);
    const { data } = await res.json();

    const container = document.getElementById("placeholder-content");
    if (data && data.servers && data.servers.length > 0) {
      container.innerHTML = `
                <div class="list-card reveal">
                    <div class="card-header">
                        <h3 class="card-title">Servers List</h3>
                    </div>
                    <div id="servers-list">
                        ${data.servers
                          .map(
                            (s) => `
                            <div class="activity-item">
                                <div class="activity-icon blue"><i class="fas fa-server"></i></div>
                                <div class="activity-details">
                                    <div class="activity-title">${s.name}</div>
                                    <div class="activity-time">${s.memberCount} members • Uptime: ${s.uptimeDays} days</div>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `;
    } else {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--charcoal-muted);">Không có dữ liệu servers.</div>`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById("placeholder-content").innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--rose);">Lỗi khi tải dữ liệu servers.</div>`;
  }
});
