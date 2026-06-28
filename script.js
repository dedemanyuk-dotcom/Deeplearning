/**
 * EduDeep - Core Engine (Vanilla JS)
 * Zero Backend, Offline Ready, Local Storage
 */

const app = {
    user: null,
    dbName: 'eduDeep_data',
    chartInstance: null,

    // Data Materi (Mock Database Lokal)
    materi: [
        { id: 1, title: 'Matematika: Pecahan', icon: '➗', type: 'math' },
        { id: 2, title: 'IPA: Tata Surya', icon: '🪐', type: 'science' },
        { id: 3, title: 'B. Indonesia: Pantun', icon: '📖', type: 'lang' },
        { id: 4, title: 'IPS: Peta Indonesia', icon: '🗺️', type: 'social' },
        { id: 5, title: 'PPKN: Pancasila', icon: '🦅', type: 'civic' }
    ],

    // Simple Local AI Knowledge Base
    aiKnowledge: {
        'halo': 'Halo! Semangat belajarnya ya!',
        'matematika': 'Matematika itu seperti puzzle! Coba pecahkan pelan-pelan.',
        'ipa': 'Alam semesta sangat luas. Mau belajar tentang tumbuhan atau tata surya?',
        'sulit': 'Jangan menyerah! Setiap ahli dulunya juga seorang pemula.',
        'default': 'Maaf, AI Tutor sedang belajar kata ini. Bisa tanyakan yang lain? 🤖'
    },

    init() {
        // Hapus Splash Screen setelah 1.5 detik
        setTimeout(() => {
            document.getElementById('splash-screen').classList.remove('active');
            document.getElementById('splash-screen').classList.add('hidden');
            this.checkLogin();
        }, 1500);

        this.bindEvents();
        this.registerServiceWorker();
    },

    bindEvents() {
        // Avatar selection
        document.querySelectorAll('.avatar-option').forEach(el => {
            el.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        // Login Form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('student-name').value;
            const grade = document.getElementById('student-class').value;
            const avatar = document.querySelector('.avatar-option.selected').dataset.avatar;
            
            this.user = {
                name, grade, avatar,
                xp: 0, streak: 1, lastLogin: new Date().toISOString(),
                badges: ['🌱'], // Badge Pemula
                journal: []
            };
            
            this.saveData();
            this.showToast(`Selamat datang, ${name}!`);
            this.checkLogin();
        });
    },

    checkLogin() {
        const stored = localStorage.getItem(this.dbName);
        if (stored) {
            this.user = JSON.parse(stored);
            this.updateDailyLogin();
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('app-screen').classList.add('active');
            this.populateUI();
            this.navigate('dashboard');
        } else {
            document.getElementById('login-screen').classList.add('active');
            document.getElementById('app-screen').classList.remove('active');
        }
    },

    updateDailyLogin() {
        const today = new Date().toDateString();
        const last = new Date(this.user.lastLogin).toDateString();
        
        if (today !== last) {
            this.user.streak += 1;
            this.user.xp += 50; // Daily reward
            this.user.lastLogin = new Date().toISOString();
            this.showToast('Login harian: +50 XP! 🔥');
            
            if(this.user.streak === 7 && !this.user.badges.includes('🔥')) {
                this.user.badges.push('🔥');
                this.showToast('Badge Baru: Rajin 7 Hari!');
            }
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem(this.dbName, JSON.stringify(this.user));
        this.populateUI(); // Refresh UI on save
    },

    populateUI() {
        if(!this.user) return;
        document.getElementById('user-name-display').innerText = this.user.name;
        document.getElementById('user-class-display').innerText = `Kelas ${this.user.grade}`;
        document.getElementById('user-avatar').innerText = this.user.avatar;
        document.getElementById('streak-count').innerText = this.user.streak;
        document.getElementById('xp-count').innerText = this.user.xp;
        
        // Badges
        const badgeHTML = this.user.badges.map(b => `<span title="Badge">${b}</span>`).join('');
        document.getElementById('badge-container').innerHTML = badgeHTML;

        // Render Materi Cards
        const materiHTML = this.materi.map(m => `
            <div class="card glass text-center" style="cursor:pointer;" onclick="app.gainXP(20, 'Membaca Materi')">
                <div style="font-size: 3rem;">${m.icon}</div>
                <h4 class="mt-4">${m.title}</h4>
            </div>
        `).join('');
        document.getElementById('materi-container').innerHTML = materiHTML;

        this.initChart();
    },

    navigate(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        event.currentTarget.classList?.add('active');

        if(pageId === 'portfolio') this.prepareCertificate();
    },

    gainXP(amount, action) {
        this.user.xp += amount;
        if(this.user.xp > 500 && !this.user.badges.includes('⭐')) {
            this.user.badges.push('⭐'); // Master Badge
        }
        this.saveData();
        this.showToast(`+${amount} XP (${action})`);
        this.fireConfetti();
    },

    saveDeepLearning() {
        const inputs = ['mengamati', 'menanya', 'mencoba', 'menalar', 'refleksi'];
        let filled = true;
        
        inputs.forEach(id => {
            if(!document.getElementById(`dl-${id}`).value) filled = false;
        });

        if(!filled) {
            this.showToast('Isi semua tahapan dulu ya!');
            return;
        }

        inputs.forEach(id => document.getElementById(`dl-${id}`).value = '');
        this.gainXP(100, 'Menyelesaikan Deep Learning');
        this.navigate('dashboard');
    },

    // AI Tutor Logic (Keyword based local DB)
    handleChatEnter(e) { if(e.key === 'Enter') this.sendChat(); },
    
    sendChat() {
        const inputEl = document.getElementById('chat-input');
        const text = inputEl.value.trim().toLowerCase();
        if(!text) return;

        this.appendChat(text, 'user');
        inputEl.value = '';

        setTimeout(() => {
            let response = this.aiKnowledge['default'];
            for (let key in this.aiKnowledge) {
                if (text.includes(key)) {
                    response = this.aiKnowledge[key];
                    break;
                }
            }
            this.appendChat(response, 'ai');
        }, 600);
    },

    appendChat(msg, sender) {
        const box = document.getElementById('chat-box');
        box.innerHTML += `<div class="msg ${sender}">${msg}</div>`;
        box.scrollTop = box.scrollHeight;
    },

    // Utilities
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    },

    toggleTheme() {
        document.body.classList.toggle('dark');
    },

    logout() {
        localStorage.removeItem(this.dbName);
        location.reload();
    },

    filterMateri() {
        const q = document.getElementById('search-materi').value.toLowerCase();
        const cards = document.getElementById('materi-container').children;
        Array.from(cards).forEach(card => {
            const title = card.innerText.toLowerCase();
            card.style.display = title.includes(q) ? 'block' : 'none';
        });
    },

    // Chart.js Setup
    initChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        if(this.chartInstance) this.chartInstance.destroy();
        
        // Mock data based on XP progression logic
        const data = [0, 50, 120, 200, this.user.xp];
        const labels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Hari Ini'];

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'XP Growth',
                    data: data,
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    },

    // jsPDF & HTML2Canvas for Certificates
    prepareCertificate() {
        document.getElementById('cert-name').innerText = this.user.name;
        document.getElementById('cert-xp').innerText = this.user.xp;
        document.getElementById('qrcode').innerHTML = "";
        new QRCode(document.getElementById("qrcode"), {
            text: `EduDeep - ${this.user.name} - XP: ${this.user.xp}`,
            width: 100, height: 100
        });
    },

    generatePDF() {
        const cert = document.getElementById('cert-preview');
        html2canvas(cert).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('l', 'mm', 'a5'); // Landscape A5
            pdf.addImage(imgData, 'PNG', 10, 10, 190, 128);
            pdf.save(`Sertifikat_${this.user.name}.pdf`);
            this.showToast('Sertifikat berhasil diunduh!');
        });
    },

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.user));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "EduDeep_Backup.json");
        dlAnchorElem.click();
    },

    // Visual Effect (Confetti Canvas)
    fireConfetti() {
        // Sederhana, mengubah background sejenak untuk simulasi
        document.body.style.background = "linear-gradient(45deg, #2563EB, #22C55E)";
        setTimeout(() => document.body.style.background = "", 500);
    },

    // PWA Service Worker Registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js').catch(err => {
                    console.log('SW Registration failed: ', err);
                });
            });
        }
    }
};

// Initialize App
app.init();
