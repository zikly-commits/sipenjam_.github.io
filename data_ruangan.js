function openRoomModal(data = null) {
    const modalRoot = document.getElementById("modal-container");
    modalRoot.classList.remove("hidden");
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <h3 class="font-bold text-slate-800 text-base">${data ? 'Edit Data Ruangan' : 'Tambah Ruangan Baru'}</h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                </div>
                <form action="actions/room" method="POST" enctype="multipart/form-data" class="space-y-4">
                    <input type="hidden" name="action" value="save">
                    <input type="hidden" name="id" value="${data ? data.id : ''}">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Ruangan</label>
                        <input type="text" name="room_name" value="${data ? data.room_name : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Kapasitas (Orang)</label>
                            <input type="number" name="capacity" value="${data ? data.capacity : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                            <select name="status" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                                <option value="Tersedia" ${data && data.status === 'Tersedia' ? 'selected' : ''}>Tersedia</option>
                                <option value="Digunakan" ${data && data.status === 'Digunakan' ? 'selected' : ''}>Digunakan</option>
                                <option value="Tidak tersedia" ${data && data.status === 'Tidak tersedia' ? 'selected' : ''}>Tidak tersedia</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Lokasi Gedung / Lantai</label>
                        <input type="text" name="location" value="${data ? data.location : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Fasilitas Ruangan</label>
                        <textarea name="facilities" required rows="3" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">${data ? data.facilities : ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Foto Ruangan</label>
                        <div class="flex items-center gap-3">
                            <img id="photo-preview" src="${data ? data.photo_url : 'assets/images/placeholder-room.svg'}" alt="Pratinjau foto" class="w-24 h-16 rounded-lg object-cover border border-slate-200 bg-slate-100">
                            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onchange="previewPhoto(this)" class="block w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold hover:file:bg-emerald-100">
                        </div>
                        <p class="text-[10px] text-slate-400 mt-1">JPG / PNG / WebP, maks. 5 MB. Kosongkan jika tidak ingin mengganti foto.</p>
                    </div>
                    <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-emerald-700 text-white text-xs rounded-xl">Simpan Ruangan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
