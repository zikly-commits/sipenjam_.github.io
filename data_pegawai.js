function openEmployeeModal(emp = null) {
    const modalRoot = document.getElementById("modal-container");
    modalRoot.classList.remove("hidden");
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <h3 class="font-bold text-slate-800 text-base">${emp ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                </div>
                <form action="actions/employee" method="POST" class="space-y-4">
                    <input type="hidden" name="action" value="save">
                    <input type="hidden" name="id" value="${emp ? emp.id : ''}">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                            <input type="text" name="name" value="${emp ? emp.name : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">NIP / NIK</label>
                            <input type="text" name="nip" value="${emp ? emp.nip : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Email Instansi</label>
                            <input type="email" name="email" value="${emp ? emp.email : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Nomor Handphone/WA</label>
                            <input type="text" name="phone" value="${emp ? emp.phone : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
                            <input type="text" name="position" value="${emp ? emp.position : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Unit Kerja / Bagian</label>
                            <input type="text" name="department" value="${emp ? emp.department : ''}" required class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        </div>
                    </div>
                    ${emp ? '' : `
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Password Akun Login <span class="text-slate-400 font-normal">(Opsional)</span></label>
                        <input type="password" name="password" placeholder="Kosongkan bila belum perlu akun login" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                        <p class="text-[10px] text-slate-400 mt-1">Akun login hanya dibuat bila kolom ini diisi.</p>
                    </div>`}
                    <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-emerald-700 text-white text-xs rounded-xl">Simpan Pegawai</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
