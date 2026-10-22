function openUserAccountModal() {
    const modalRoot = document.getElementById("modal-container");
    modalRoot.classList.remove("hidden");
    modalRoot.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 class="font-bold text-slate-800 text-base">Tambah Akun Pengguna Baru</h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                </div>
                <form action="actions/user" method="POST" class="space-y-4">
                    <input type="hidden" name="action" value="create">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                        <input type="text" name="name" required placeholder="Contoh: Rahmat Hidayat, S.E" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Email Login</label>
                        <input type="email" name="email" required placeholder="rahmat@kemenagbabel.go.id" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                        <input type="password" name="password" required placeholder="••••••••" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Role Akses</label>
                        <select name="role" class="w-full p-2.5 text-xs rounded-xl border border-slate-200">
                            <option value="pegawai">Pegawai</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl">Simpan Akun</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function resetUserPassword(id) {
    const newPass = prompt("Masukkan password baru untuk pengguna ini:");
    if (newPass && newPass.trim()) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "actions/user";

        const actionInput = document.createElement("input");
        actionInput.type = "hidden";
        actionInput.name = "action";
        actionInput.value = "reset_password";

        const idInput = document.createElement("input");
        idInput.type = "hidden";
        idInput.name = "id";
        idInput.value = id;

        const passInput = document.createElement("input");
        passInput.type = "hidden";
        passInput.name = "new_password";
        passInput.value = newPass.trim();

        form.appendChild(actionInput);
        form.appendChild(idInput);
        form.appendChild(passInput);
        document.body.appendChild(form);
        form.submit();
    }
}
