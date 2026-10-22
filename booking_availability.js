// Cek ketersediaan ruangan/kendaraan terhadap tanggal & jam yang dipilih pemohon.
// Kartu yang bentrok dengan jadwal peminjaman lain akan dinonaktifkan agar tidak bisa dipilih.
(function () {
    const cards = document.querySelectorAll('.booking-card');
    const form = document.querySelector('form[action="actions/booking"]');
    if (!cards.length || !form) return;

    const isVehicle = !!form.querySelector('[name="departure_date"]');

    // Ambil rentang waktu yang dipilih pemohon -> "YYYY-MM-DD HH:MM"
    function getSelectedRange() {
        const v = (n) => (form.querySelector('[name="' + n + '"]') || {}).value || '';
        if (isVehicle) {
            return { start: v('departure_date') + ' ' + v('departure_time'), end: v('return_date') + ' ' + v('return_time') };
        }
        return { start: v('date') + ' ' + v('start_time'), end: v('date') + ' ' + v('end_time') };
    }

    function isComplete(r) {
        return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(r.start) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(r.end);
    }

    function refresh() {
        const range = getSelectedRange();
        const valid = isComplete(range) && range.start < range.end;

        cards.forEach(function (card) {
            if (card.dataset.blocked === '1') return; // diblokir admin (servis, dll.)

            let bookings = [];
            try { bookings = JSON.parse(card.dataset.bookings || '[]'); } catch (e) {}

            // Dua rentang bentrok jika: mulaiBaru < selesaiLama && selesaiBaru > mulaiLama
            // Pengajuan yang Ditolak tidak memblokir jadwal
            const conflict = valid && bookings.some(function (b) {
                return b.status !== 'Ditolak' && range.start < b.end && range.end > b.start;
            });

            const radio = card.querySelector('input[type="radio"]');
            const body = card.querySelector('.card-body');
            const photo = card.querySelector('.card-photo');
            const badge = card.querySelector('.conflict-badge');

            radio.disabled = conflict;
            if (conflict && radio.checked) radio.checked = false;

            card.classList.toggle('cursor-not-allowed', conflict);
            card.classList.toggle('cursor-pointer', !conflict);
            body.classList.toggle('opacity-60', conflict);
            photo.classList.toggle('grayscale', conflict);
            badge.classList.toggle('hidden', !conflict);
        });
    }

    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();
})();
