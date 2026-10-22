function toggleMobileSidebar() {
    const overlay = document.getElementById('mobile-sidebar');
    const panel = document.getElementById('mobile-sidebar-panel');
    overlay.classList.toggle('hidden');
    panel.classList.toggle('hidden');
    panel.classList.toggle('flex');
}

function toggleNotificationsMenu() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('hidden');
}

function closeModal() {
    const modalRoot = document.getElementById('modal-container');
    modalRoot.classList.add('hidden');
    modalRoot.innerHTML = '';
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    const bgClass = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-blue-600";
    const iconClass = type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle";

    toast.className = `${bgClass} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all transform translate-y-2 opacity-0 pointer-events-auto border border-white/20`;
    toast.innerHTML = `<i class="fas ${iconClass} text-lg"></i> <span class="text-xs font-medium">${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove("translate-y-2", "opacity-0"); }, 10);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Pratinjau foto yang dipilih pada form (modal Data Ruangan / Data Kendaraan)
function previewPhoto(input) {
    const img = document.getElementById("photo-preview");
    if (input.files && input.files[0] && img) {
        img.src = URL.createObjectURL(input.files[0]);
    }
}
