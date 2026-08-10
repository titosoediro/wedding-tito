document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi AOS (Animate on Scroll)
    AOS.init({
        once: true, // Animasi hanya berjalan sekali saat di-scroll
        offset: 50, // Offset sebelum animasi dimulai
    });

    // Fungsi untuk mendapatkan dan memformat nama dari URL
    let guestName = null;
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('to')) {
        guestName = urlParams.get('to');
    } else if (urlParams.has('name')) {
        guestName = urlParams.get('name');
    } else if (window.location.hash) {
        guestName = window.location.hash.substring(1);
    } else {
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0 && segment !== 'index.html');
        if (pathSegments.length > 0) {
            guestName = pathSegments[pathSegments.length - 1];
        }
    }

    // Tampilkan nama tamu
    if (guestName) {
        const formattedName = decodeURIComponent(guestName)
            .replace(/[_-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        const guestNameElement = document.getElementById('guest-name');
        if (guestNameElement) {
            guestNameElement.textContent = `${formattedName}`;
        }

        // Auto-fill nama di form RSVP jika nama tamu terdeteksi dari URL
        const rsvpNameInput = document.getElementById('rsvp-name');
        if (rsvpNameInput) {
            rsvpNameInput.value = formattedName;
        }
    }

    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // --- LOGIKA RSVP (Simpan JSON Lokal) ---
    // Karena ini web statis tanpa server (di Git), kita menyimpan data secara lokal di browser
    // dan menyediakan tombol untuk export/download ke file JSON.

    const rsvpForm = document.getElementById('rsvp-form');
    const downloadBtn = document.getElementById('download-json');

    // Ambil data dari local storage jika sudah ada, jika tidak mulai array kosong
    let rsvpData = JSON.parse(localStorage.getItem('wedding_rsvp_data')) || [];

    // Fungsi update tampilan tombol download
    function updateDownloadButton() {
        if (rsvpData.length > 0 && downloadBtn) {
            downloadBtn.style.display = 'inline-block';
        }
    }

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('rsvp-name').value;
            const status = document.getElementById('rsvp-status').value;

            const entry = {
                id: Date.now(),
                name: name,
                status: status,
                timestamp: new Date().toLocaleString()
            };

            // Tambahkan ke array data
            rsvpData.push(entry);

            // Simpan ke localStorage
            localStorage.setItem('wedding_rsvp_data', JSON.stringify(rsvpData));

            alert('Terima kasih! Konfirmasi kehadiran Anda berhasil disimpan.');

            // Reset form
            rsvpForm.reset();
            updateDownloadButton();
        });
    }

    // Fungsi Download JSON (Untuk diakses pemilik web secara manual)
    if (downloadBtn) {
        updateDownloadButton(); // Cek saat pertama load

        downloadBtn.addEventListener('click', () => {
            // Ubah objek array jadi string format JSON yang cantik (indentasi 2 spasi)
            const jsonString = JSON.stringify(rsvpData, null, 2);

            // Buat Blob data untuk file JSON
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            // Buat elemen <a> sementara untuk mendownload
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.href = url;
            downloadAnchorNode.download = "rsvp_data_tamu.json";

            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click(); // Trigger klik otomatis
            downloadAnchorNode.remove(); // Hapus dari HTML setelah klik

            // Lepas memori object URL
            URL.revokeObjectURL(url);
        });
    }

    // --- BACKGROUND MUSIC LOGIC ---
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    const musicIcon = musicBtn ? musicBtn.querySelector('i') : null;
    let isPlaying = false;

    function toggleMusic() {
        if (!bgMusic || !musicBtn) return;

        if (isPlaying) {
            bgMusic.pause();
            if (musicIcon) {
                musicIcon.classList.remove('fa-music');
                musicIcon.classList.add('fa-play');
            }
            musicBtn.classList.add('paused');
            isPlaying = false;
        } else {
            bgMusic.play().then(() => {
                if (musicIcon) {
                    musicIcon.classList.remove('fa-play');
                    musicIcon.classList.add('fa-music');
                }
                musicBtn.classList.remove('paused');
                isPlaying = true;
            }).catch(error => {
                console.log("Gagal memutar musik: Pengguna harus berinteraksi dengan layar terlebih dahulu.");
            });
        }
    }

    if (musicBtn) {
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah memicu klik dokumen ganda
            toggleMusic();
        });
    }

    // Autoplay musik saat ada interaksi sentuh/klik pertama dari user 
    const startMusicOnInteraction = () => {
        if (!isPlaying && bgMusic) {
            bgMusic.play().then(() => {
                isPlaying = true;
                if (musicIcon) {
                    musicIcon.classList.remove('fa-play');
                    musicIcon.classList.add('fa-music');
                }
                if (musicBtn) {
                    musicBtn.classList.remove('paused');
                }
                // Hapus event listener jika musik sudah berhasil berputar
                document.removeEventListener('click', startMusicOnInteraction);
                document.removeEventListener('touchstart', startMusicOnInteraction);
                document.removeEventListener('scroll', startMusicOnInteraction);
            }).catch(error => {
                // Browser memblokir karena belum ada interaksi valid (misal: scroll).
                // Jangan hapus listener, biarkan menunggu klik selanjutnya.
            });
        }
    };

    // Tambahkan kembali trigger scroll sesuai permintaan
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('touchstart', startMusicOnInteraction);
    document.addEventListener('scroll', startMusicOnInteraction);
});
