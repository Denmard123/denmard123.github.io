const fs = require('fs');
const path = require('path');

const USERNAME = 'denmard123';
const BASE_URL = `https://${USERNAME}.github.io/`;
const PROFILE_IMG = '63204258.jpg'; // Gambar Anda

async function generateHub() {
    try {
        console.log('🚀 Menjalankan Generator SEO-Optimized Hub...');
        
        // Fetch data dengan sort updated agar repo terbaru selalu di atas
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
        const repos = await response.json();

        if (!Array.isArray(repos)) {
            throw new Error('Gagal mengambil data dari GitHub API');
        }

        // Filter: Hanya ambil repo publik dan abaikan repo profile utama
        const projects = repos.filter(repo => 
            repo.name.toLowerCase() !== `${USERNAME}.github.io`.toLowerCase() && 
            repo.fork === false // Menghindari clutter dari repo hasil fork orang lain
        );

        let projectCards = '';
        let sitemapUrls = '';
        let jsonLdItems = [];

        projects.forEach((repo) => {
            const lastUpdate = new Date(repo.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const targetUrl = repo.has_pages ? `${BASE_URL}${repo.name}/` : repo.html_url;
            
            const isLive = repo.has_pages;
            const badgeLabel = isLive ? 'Live Project' : 'Source Code';
            const badgeStyle = isLive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

            projectCards += `
            <article class="relative group h-full">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] opacity-0 group-hover:opacity-20 transition duration-500"></div>
                <div class="relative glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col h-full">
                    <div class="flex justify-between items-start mb-8">
                        <div class="p-3 bg-white/5 rounded-2xl border border-white/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        </div>
                        <span class="text-[9px] font-black tracking-[0.2em] px-3 py-1.5 rounded-xl border ${badgeStyle} uppercase">
                            ${badgeLabel}
                        </span>
                    </div>
                    
                    <div class="flex-grow">
                        <h2 class="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors capitalize tracking-tight">${repo.name.replace(/-/g, ' ')}</h2>
                        <p class="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">${repo.description || 'Pengembangan aplikasi web modern dengan optimasi performa tinggi.'}</p>
                    </div>

                    <div class="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Last Release</span>
                            <span class="text-xs text-slate-300">${lastUpdate}</span>
                        </div>
                        <a href="${targetUrl}" target="_blank" rel="noopener" class="p-3 rounded-full bg-white/5 text-white hover:bg-white hover:text-black transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </a>
                    </div>
                </div>
            </article>\n`;

            if (isLive) {
                const isoDate = new Date(repo.updated_at).toISOString().split('T')[0];
                sitemapUrls += `  <url><loc>${targetUrl}</loc><lastmod>${isoDate}</lastmod><priority>0.8</priority></url>\n`;
                jsonLdItems.push({
                    "@type": "SoftwareApplication",
                    "name": repo.name,
                    "url": targetUrl,
                    "applicationCategory": "DeveloperApplication",
                    "operatingSystem": "Web"
                });
            }
        });

        const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Den Mardiyana | Central Repository Hub</title>
    <link rel="icon" type="image/jpeg" href="${PROFILE_IMG}">
    
    <meta name="description" content="Portal resmi Den Mardiyana. Koleksi repositori GitHub dan live demo aplikasi web.">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #020617; color: #f8fafc; }
        .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .gradient-text { background: linear-gradient(to right, #60a5fa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glow-bg { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 100vh; 
                   background: radial-gradient(circle at 50% -10%, rgba(37, 99, 235, 0.1), transparent 60%); z-index: -1; }
        .profile-ring { padding: 4px; background: linear-gradient(135deg, #60A5FA, #A78BFA); border-radius: 9999px; }
    </style>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Den Mardiyana",
      "image": "${BASE_URL}${PROFILE_IMG}",
      "jobTitle": "Fullstack Developer",
      "url": "${BASE_URL}",
      "hasPart": ${JSON.stringify(jsonLdItems)}
    }
    </script>
</head>
<body>
    <div class="glow-bg"></div>
    
    <header class="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div class="flex justify-center mb-8">
            <div class="profile-ring shadow-2xl shadow-blue-500/20 transition-transform hover:scale-105 duration-500">
                <img src="${PROFILE_IMG}" alt="Den Mardiyana" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#020617]">
            </div>
        </div>

        <div class="inline-flex items-center gap-2 px-4 py-2 mb-10 text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Cloud Hub Active
        </div>
        <h1 class="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none">
            Den Mardiyana<br><span class="gradient-text">Studio.</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Menampilkan <span class="text-white">${projects.length} repositori</span> pilihan yang dikembangkan secara profesional.
        </p>
    </header>

    <main class="max-w-7xl mx-auto px-6 pb-40">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            ${projectCards}
        </div>
    </main>

    <footer class="max-w-5xl mx-auto px-6 py-20 text-center border-t border-white/5">
        <p class="text-[10px] text-slate-500 uppercase tracking-[0.5em] font-black">
            © 2026 Den Mardiyana • Fullstack Engineer
        </p>
    </footer>
</body>
</html>`;

        // Bandingkan dengan file lama sebelum menulis (Optimasi Update)
        const currentHtml = fs.existsSync('index.html') ? fs.readFileSync('index.html', 'utf8') : '';
        
        // Hanya tulis jika ada perubahan konten kartu atau jumlah proyek
        if (currentHtml.length !== htmlContent.length || !currentHtml.includes(projects[0]?.name)) {
            fs.writeFileSync('index.html', htmlContent);
            
            const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>
${sitemapUrls}</urlset>`;
            fs.writeFileSync('sitemap.xml', sitemapContent);
            
            const robotsContent = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}sitemap.xml`;
            fs.writeFileSync('robots.txt', robotsContent);
            
            console.log(`✅ Update Berhasil: Menambahkan ${projects.length} proyek ke Hub.`);
        } else {
            console.log('ℹ️ Tidak ada perubahan repositori terdeteksi. Skip update file.');
        }

    } catch (error) {
        console.error('❌ Error Generasi:', error);
    }
}

generateHub();
