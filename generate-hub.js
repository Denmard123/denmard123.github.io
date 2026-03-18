const fs = require('fs');
const path = require('path');

const USERNAME = 'denmard123';
const BASE_URL = `https://${USERNAME}.github.io/`;

async function generateHub() {
    try {
        console.log('Memulai sinkronisasi proyek...');
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
        const repos = await response.json();

        // Filter: Jangan masukkan repo utama ke dalam daftar proyek
        const projects = repos.filter(repo => repo.name.toLowerCase() !== `${USERNAME}.github.io`.toLowerCase());

        let projectCards = '';
        projects.forEach(repo => {
            const lastUpdate = new Date(repo.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            
            // Logika URL: Gunakan GitHub Pages jika aktif, jika tidak gunakan link Repo
            const targetUrl = repo.has_pages ? `${BASE_URL}${repo.name}/` : repo.html_url;
            const badgeLabel = repo.has_pages ? 'Active Pages' : 'Source Code';
            const badgeClass = repo.has_pages ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400';

            projectCards += `
            <a href="${targetUrl}" target="_blank" class="glass p-8 rounded-[2rem] flex flex-col justify-between group h-full">
                <div>
                    <div class="flex justify-between items-center mb-6">
                        <div class="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <span class="text-[10px] font-bold px-3 py-1 rounded-full uppercase ${badgeClass}">${badgeLabel}</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors capitalize">${repo.name.replace(/-/g, ' ')}</h3>
                    <p class="text-slate-400 text-sm line-clamp-2 mb-6">${repo.description || 'Proyek pengembangan kreatif.'}</p>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-white/5 text-[11px] text-slate-500 font-medium">
                    <span>Updated ${lastUpdate}</span>
                    <span class="text-blue-400 group-hover:translate-x-1 transition-transform">View Project →</span>
                </div>
            </a>\n`;
        });

        // Path yang benar: langsung cari template.html di root
        const templatePath = path.join(__dirname, 'template.html');
        
        if (fs.existsSync(templatePath)) {
            const template = fs.readFileSync(templatePath, 'utf8');
            
            // PERBAIKAN: Ganti placeholder spesifik yang ada di template.html Anda
            const finalHtml = template.replace('', projectCards);
            
            // Tulis ke index.html di root
            fs.writeFileSync('index.html', finalHtml);
            console.log(`✅ Berhasil mengupdate index.html dengan ${projects.length} proyek.`);
        } else {
            console.error('❌ Template tidak ditemukan! Pastikan file bernama template.html');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}
generateHub();
