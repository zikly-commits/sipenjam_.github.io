document.addEventListener("DOMContentLoaded", function() {
    const ctxMonthly = document.getElementById("chart-monthly");
    const ctxFacility = document.getElementById("chart-facility");

    if (ctxMonthly && ctxFacility) {
        new Chart(ctxMonthly, {
            type: "line",
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
                datasets: [{
                    label: "Jumlah Peminjaman 2026",
                    data: [12, 19, 15, 22, 18, 25, 30, 28, 35, 20, 15, 10],
                    borderColor: "#15803d",
                    backgroundColor: "rgba(21, 128, 61, 0.1)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        new Chart(ctxFacility, {
            type: "doughnut",
            data: {
                labels: ["Ruangan Rapat", "Mobil Dinas", "Motor Dinas"],
                datasets: [{
                    data: [dashboardData.totalRuangan, dashboardData.totalKendaraan, 2],
                    backgroundColor: ["#2563eb", "#15803d", "#f59e0b"]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
});
