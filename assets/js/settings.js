const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    const { data } = await res.json();

    const container = document.getElementById("placeholder-content");
    if (data) {
      container.innerHTML = `
                <div class="list-card reveal">
                    <div class="card-header">
                        <h3 class="card-title">Cài đặt Hệ thống</h3>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p><strong>Phiên bản Bot:</strong> ${data.version}</p>
                        <p><strong>Prefix mặc định:</strong> ${data.prefix}</p>
                        <p><strong>Chế độ Bảo trì:</strong> ${data.maintenanceMode ? '<span style="color: var(--rose);">Bật</span>' : '<span style="color: var(--green);">Tắt</span>'}</p>
                    </div>
                </div>
            `;
    } else {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--charcoal-muted);">Không có dữ liệu cài đặt.</div>`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById("placeholder-content").innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--rose);">Lỗi khi tải dữ liệu cài đặt.</div>`;
  }
});
