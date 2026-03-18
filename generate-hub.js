const fs = require('fs');
const path = require('path');

const USERNAME = 'denmard123';
const BASE_URL = `https://${USERNAME}.github.io/`;

async function generateHub() {
    try {
        console.log('Memulai sinkronisasi semua repositori publik...');
        // Mengambil data repo publik (secara default API hanya memberikan yang publik)
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
        const repos = await response.json();

        // Filter: Abaikan repo utama agar tidak double
        const projects = repos.filter(repo => 
            repo.name.toLowerCase() !== `${USERNAME}.github.io`.toLowerCase()
        );

        let projectCards = '';
        projects.forEach(repo => {
            const lastUpdate = new Date(repo.updated_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            });

            // LOGIKA PENGALIHAN: Cek has_pages
            const targetUrl = repo.has_pages ? `${BASE_URL}${repo.name}/` : repo.html_url;
            const statusLabel = repo.has_pages ? 'Active Pages' : 'GitHub Repo';
            const statusClass = repo.has_pages ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 bg-slate-800/50';
            const iconColor = repo.has_pages ? 'text-blue-400 bg-blue-500/20' : 'text-slate-500 bg-slate-500/10';

            projectCards += `
            <a href="${targetUrl}" target="_blank" class="glass p-6 rounded-3xl hover:bg-white/10 transition-all group border border-white/5 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-6">
                        <div class="p-3 ${iconColor} rounded-2xl group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-widest ${statusClass} px-3 py-1 rounded-full">${statusLabel}</span>
                    </div>
                    <h3 class="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors capitalize">${repo.name.replace(/-/g, ' ')}</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">${repo.description || 'Tidak ada deskripsi proyek.'}</p>
                </div>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span class="text-[11px] text-slate-500">Update: ${lastUpdate}</span>
                    <div class="flex items-center text-blue-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                        ${repo.has_pages ? 'Buka Proyek' : 'Lihat Kode'} 
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>
                </div>
            </a>\n`;
        });

        // Update index.html
        const templatePath = path.join(__dirname, 'template.html');
        if (fs.existsSync(templatePath)) {
            const template = fs.readFileSync(templatePath, 'utf8');
            // Ganti placeholder dengan kartu yang digenerate
            const finalHtml = template.replace('', projectCards);
            fs.writeFileSync('index.html', finalHtml);
        }

        // Update sitemap.xml (Hanya masukkan yang punya Pages untuk SEO)
        const pagesOnly = projects.filter(p => p.has_pages);
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        sitemap += `  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>\n`;
        pagesOnly.forEach(repo => { sitemap += `  <url><loc>${BASE_URL}${repo.name}/</loc><priority>0.8</priority></url>\n`; });
        sitemap += `</urlset>`;
        fs.writeFileSync('sitemap.xml', sitemap);

        console.log(`✅ Sukses! ${projects.length} repositori publik disinkronkan.`);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

generateHub();
