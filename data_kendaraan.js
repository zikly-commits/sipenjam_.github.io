function openVehicleModal(v = null) {
    const modalRoot = document.getElementById("modal-container");
    modalRoot.classList.remove("hidden");
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <h3 class="font-bold text-slate-800 text-base">${v ? 'Edit Kendaraan Dinas' : 'Tambah Kendaraan Baru'}</h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                </div>
                <form action="actions/vehicle" method="POST" enctype="multipart/form-data" class="space-y-4">
                    <input type="hidden" name="action" value="save">
                    <input type="hidden" name="id" value="${v ? v.id : ''}">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Jenis Kendaraan</label>
                            <select name="vehicle_type" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                                <option value="Mobil" ${v && v.vehicle_type === 'Mobil' ? 'selected' : ''}>Mobil</option>
                                <option value="Motor" ${v && v.vehicle_type === 'Motor' ? 'selected' : ''}>Motor</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Merk / Pabrikan</label>
                            <input type="text" name="brand" value="${v ? v.brand : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Model / Varian</label>
                            <input type="text" name="model" value="${v ? v.model : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Nomor Polisi (Plat)</label>
                            <input type="text" name="license_plate" value="${v ? v.license_plate : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Tahun Kendaraan</label>
                            <input type="number" name="year" value="${v ? v.year : '2023'}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Kondisi</label>
                            <select name="condition" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                                <option value="Sangat Baik" ${v && v.condition === 'Sangat Baik' ? 'selected' : ''}>Sangat Baik</option>
                                <option value="Baik" ${v && v.condition === 'Baik' ? 'selected' : ''}>Baik</option>
                                <option value="Perlu Perbaikan" ${v && v.condition === 'Perlu Perbaikan' ? 'selected' : ''}>Perlu Perbaikan</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                            <select name="status" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                                <option value="Tersedia" ${v && v.status === 'Tersedia' ? 'selected' : ''}>Tersedia</option>
                                <option value="Dipinjam" ${v && v.status === 'Dipinjam' ? 'selected' : ''}>Dipinjam</option>
                                <option value="Servis" ${v && v.status === 'Servis' ? 'selected' : ''}>Servis</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Foto Kendaraan</label>
                        <div class="flex items-center gap-3">
                            <img id="photo-preview" src="${v ? v.photo_url : 'assets/images/placeholder-car.svg'}" alt="Pratinjau foto" class="w-24 h-16 rounded-lg object-cover border border-slate-200 bg-slate-100">
                            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onchange="previewPhoto(this)" class="block w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold hover:file:bg-emerald-100">
                        </div>
                        <p class="text-[10px] text-slate-400 mt-1">JPG / PNG / WebP, maks. 5 MB. Kosongkan jika tidak ingin mengganti foto.</p>
                    </div>
                    <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-emerald-700 text-white text-xs rounded-xl">Simpan Kendaraan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
