const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/logs`);
    const { data } = await res.json();

    const container = document.getElementById("placeholder-content");
    if (data && data.logs && data.logs.length > 0) {
      container.innerHTML = `
                <div class="list-card reveal">
                    <div class="card-header">
                        <h3 class="card-title">Nhật ký Hệ thống</h3>
                    </div>
                    <div id="logs-list">
                        ${data.logs
                          .map(
                            (log) => `
                            <div class="activity-item">
                                <div class="activity-icon"><i class="fas fa-clock"></i></div>
                                <div class="activity-details">
                                    <div class="activity-title">${log.user} executed ${log.command}</div>
                                    <div class="activity-time">${new Date(log.timestamp).toLocaleString("vi-VN")} in ${log.server}</div>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `;
    } else {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--charcoal-muted);">Không có nhật ký nào gần đây.</div>`;
    }
  } catch (e) {
    console.error(e);
    document.getElementById("placeholder-content").innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--rose);">Lỗi khi tải nhật ký.</div>`;
  }
});
