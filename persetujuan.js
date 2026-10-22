function openRejectModal(id, type) {
    const modalRoot = document.getElementById("modal-container");
    modalRoot.classList.remove("hidden");
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <h3 class="font-bold text-slate-800 text-base mb-2">Penolakan Pengajuan</h3>
                <p class="text-xs text-slate-500 mb-4">Mohon berikan alasan penolakan untuk disampaikan ke pemohon.</p>
                <form action="actions/booking" method="POST">
                    <input type="hidden" name="action" value="reject">
                    <input type="hidden" name="id" value="${id}">
                    <input type="hidden" name="type" value="${type}">
                    <select name="reason" required class="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 mb-4 focus:ring-2 focus:ring-rose-500">
                        <option value="">-- Pilih Alasan Penolakan --</option>
                        <option value="Jadwal bentrok dengan agenda prioritas pimpinan">Jadwal bentrok dengan agenda prioritas pimpinan</option>
                        <option value="Ruangan sedang digunakan untuk kegiatan lain">Ruangan sedang digunakan untuk kegiatan lain</option>
                        <option value="Kendaraan sedang digunakan untuk keperluan dinas lain">Kendaraan sedang digunakan untuk keperluan dinas lain</option>
                        <option value="Fasilitas yang diminta tidak tersedia">Fasilitas yang diminta tidak tersedia</option>
                    </select>
                    <div class="flex justify-end gap-2">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl">Tolak Pengajuan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
