const fs = require('fs');
const path = require('path');

const USERNAME = 'denmard123';
const BASE_URL = `https://${USERNAME}.github.io/`;

async function generateHub() {
    try {
        console.log('🚀 Memulai Proses Generasi Central Hub...');
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
        const repos = await response.json();

        // Filter: Abaikan repo utama
        const projects = repos.filter(repo => repo.name.toLowerCase() !== `${USERNAME}.github.io`.toLowerCase());

        let projectCards = '';
        let sitemapUrls = '';

        projects.forEach(repo => {
            const lastUpdate = new Date(repo.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const targetUrl = repo.has_pages ? `${BASE_URL}${repo.name}/` : repo.html_url;
            const badgeLabel = repo.has_pages ? 'Live Project' : 'Source Code';
            const badgeClass = repo.has_pages ? 'bg-blue-500/10 text-blue-400 border-blue-400/20' : 'bg-slate-800 text-slate-500 border-white/5';

            // Generate HTML Card
            projectCards += `
            <article class="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-blue-500/50 transition-all duration-300 group flex flex-col h-full">
                <div class="flex justify-between items-start mb-8">
                    <div class="p-4 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span class="text-[10px] font-bold tracking-widest px-3 py-1 rounded-full border ${badgeClass} uppercase">
                        ${badgeLabel}
                    </span>
                </div>
                <div class="flex-grow">
                    <h2 class="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors capitalize">${repo.name.replace(/-/g, ' ')}</h2>
                    <p class="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">${repo.description || 'Pengembangan sistem web profesional oleh Den Mardiyana.'}</p>
                </div>
                <div class="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <span class="text-[11px] text-slate-500 font-medium">Update: ${lastUpdate}</span>
                    <a href="${targetUrl}" target="_blank" rel="noopener" class="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-white transition-colors">
                        Explore <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                </div>
            </article>\n`;

            // Collect Sitemap URLs
            if (repo.has_pages) {
                sitemapUrls += `  <url><loc>${targetUrl}</loc><lastmod>${new Date(repo.updated_at).toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>\n`;
            }
        });

        // FULL HTML TEMPLATE (Injected with Data)
        const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DenMard123 | Fullstack Developer Hub</title>
    <meta name="description" content="Portal utama Den Mardiyana - Fullstack Developer. Koleksi repositori GitHub dan proyek live.">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root { font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: #020617; color: #e2e8f0; overflow-x: hidden; }
        .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); }
        .gradient-text { background: linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .bg-glow { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100%; height: 100%; 
                   background: radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.15), transparent 70%); z-index: -1; }
        /* Optimasi CLS */
        .grid { min-height: 80vh; }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <header class="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div class="inline-block px-4 py-1.5 mb-8 text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase bg-blue-400/10 border border-blue-400/20 rounded-full">
            Main Repository Hub
        </div>
        <h1 class="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
            Digital Universe <br><span class="gradient-text">DenMard123</span>
        </h1>
        <p class="text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Menghubungkan <span class="text-white font-semibold">${projects.length} proyek</span> digital melalui ekosistem GitHub Pages yang terindeks secara optimal.
        </p>
    </header>

    <main class="max-w-7xl mx-auto px-6 pb-32">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${projectCards}
        </div>
    </main>

    <footer class="max-w-7xl mx-auto px-6 pb-12 text-center border-t border-white/5 pt-12">
        <p class="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-bold">
            © 2026 Den Mardiyana • Fullstack Developer
        </p>
    </footer>
</body>
</html>`;

        // 1. Tulis index.html
        fs.writeFileSync('index.html', htmlContent);

        // 2. Tulis sitemap.xml
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>
${sitemapUrls}</urlset>`;
        fs.writeFileSync('sitemap.xml', sitemapContent);

        // 3. Tulis robots.txt
        const robotsContent = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}sitemap.xml`;
        fs.writeFileSync('robots.txt', robotsContent);

        console.log(`✅ Selesai! Central Hub, Sitemap, dan Robots.txt telah diperbarui.`);
    } catch (error) {
        console.error('❌ Terjadi Kesalahan:', error);
    }
}

generateHub();
