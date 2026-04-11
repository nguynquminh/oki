const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/security`);
    const { data } = await res.json();

    const container = document.getElementById("placeholder-content");
    if (data) {
      container.innerHTML = `
                <div class="list-card reveal">
                    <div class="card-header">
                        <h3 class="card-title">Trạng thái Bảo mật</h3>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p><strong>Status:</strong> <span style="color: var(--green);">${data.status}</span></p>
                        <p><strong>Last Scan:</strong> ${new Date(data.lastScan).toLocaleString("vi-VN")}</p>
                        <p><strong>Recent Alerts:</strong> ${data.recentAlerts.length === 0 ? "None" : data.recentAlerts.join(", ")}</p>
                    </div>
                </div>
            `;
    } else {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--charcoal-muted);">Không có dữ liệu bảo mật.</div>`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById("placeholder-content").innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--rose);">Lỗi khi tải dữ liệu bảo mật.</div>`;
  }
});
