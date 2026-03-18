const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    USERNAME: 'denmard123',
    BASE_URL: 'https://denmard123.github.io/',
    PROFILE_IMG: '63204258.jpg',
    ADSENSE_CLIENT: 'ca-pub-8194173457016484',
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    CACHE_FILE: '.cache.json'
};

if (!CONFIG.BASE_URL.endsWith('/')) {
    CONFIG.BASE_URL += '/';
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

async function fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`📡 Fetching data... (Attempt ${i + 1}/${retries})`);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Node.js GitHub Hub Generator',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format from GitHub API');
            }
            
            console.log(`✅ Data fetched successfully: ${data.length} repositories`);
            return data;
            
        } catch (error) {
            console.warn(`⚠️ Attempt ${i + 1} failed: ${error.message}`);
            
            if (i === retries - 1) {
                throw new Error(`Failed after ${retries} attempts: ${error.message}`);
            }
            
            const delay = Math.pow(2, i) * 1000;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

function loadCache() {
    try {
        if (fs.existsSync(CONFIG.CACHE_FILE)) {
            const cache = JSON.parse(fs.readFileSync(CONFIG.CACHE_FILE, 'utf8'));
            console.log(`📦 Cache loaded: ${cache.repos?.length || 0} repositories`);
            return cache;
        }
    } catch (error) {
        console.warn(`⚠️ Cache load failed: ${error.message}`);
    }
    return null;
}

function saveCache(data) {
    try {
        fs.writeFileSync(CONFIG.CACHE_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            repos: data
        }, null, 2));
        console.log('💾 Cache saved successfully');
    } catch (error) {
        console.warn(`⚠️ Cache save failed: ${error.message}`);
    }
}

function sanitize(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========================================
// SITEMAP GENERATION (FIXED & VALIDATED)
// ========================================

function generateSitemap(projects) {
    const now = new Date().toISOString().split('T')[0];
    let urls = '';
    
    // Homepage (Priority 1.0)
    urls += `  <url>\n    <loc>${CONFIG.BASE_URL}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    
    // Only Live GitHub Pages (TIDAK termasuk external github.com links)
    const liveProjects = projects.filter(repo => repo.has_pages);
    
    liveProjects.forEach(repo => {
        const lastmod = new Date(repo.updated_at).toISOString().split('T')[0];
        const url = `${CONFIG.BASE_URL}${repo.name}/`;
        
        urls += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });
    
    const totalUrls = liveProjects.length + 1;
    console.log(`📄 Sitemap entries: ${totalUrls} URLs`);
    console.log(`   - Homepage: 1`);
    console.log(`   - Live GitHub Pages: ${liveProjects.length}`);
    
    // CRITICAL: Proper XML formatting with correct encoding
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;
}

// ========================================
// ROBOTS.TXT GENERATION
// ========================================

function generateRobots() {
    return `# robots.txt for ${CONFIG.BASE_URL}
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Disallow unnecessary paths
Disallow: /.git/
Disallow: /node_modules/
Disallow: /*.json$

# Allow AdSense bot
User-agent: Mediapartners-Google
Allow: /

# Google bot
User-agent: Googlebot
Allow: /

# Sitemap location
Sitemap: ${CONFIG.BASE_URL}sitemap.xml`;
}

// ========================================
// HTML GENERATION (WITH ADSENSE)
// ========================================

function generateHTML(projects) {
    let projectCards = '';
    
    projects.forEach((repo, index) => {
        const lastUpdate = new Date(repo.updated_at).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const targetUrl = repo.has_pages 
            ? `${CONFIG.BASE_URL}${repo.name}/` 
            : repo.html_url;
        
        const isLive = repo.has_pages;
        const badgeLabel = isLive ? 'Live Project' : 'Source Code';
        const badgeStyle = isLive 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        
        const repoName = sanitize(repo.name.replace(/-/g, ' '));
        const repoDesc = sanitize(repo.description || 'Pengembangan aplikasi web modern dengan optimasi performa tinggi.');

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
                        <h2 class="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors capitalize tracking-tight">${repoName}</h2>
                        <p class="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">${repoDesc}</p>
                    </div>

                    <div class="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Last Release</span>
                            <span class="text-xs text-slate-300">${lastUpdate}</span>
                        </div>
                        <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${repoName}" class="p-3 rounded-full bg-white/5 text-white hover:bg-white hover:text-black transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </a>
                    </div>
                </div>
            </article>\n`;
        
        // Insert AdSense every 6 cards
        if ((index + 1) % 6 === 0 && index < projects.length - 1) {
            projectCards += `
            <div class="col-span-1 md:col-span-2 lg:col-span-3">
                <div class="glass p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-center min-h-[120px]">
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="${CONFIG.ADSENSE_CLIENT}"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                    <script>
                         (adsbygoogle = window.adsbygoogle || []).push({});
                    </script>
                </div>
            </div>\n`;
        }
    });

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Den Mardiyana | Central Repository Hub</title>
    <link rel="icon" type="image/jpeg" href="${CONFIG.PROFILE_IMG}">
    <link rel="canonical" href="${CONFIG.BASE_URL}">

    <!-- ============================================ -->
    <!-- GOOGLE ADSENSE - OWNERSHIP VERIFICATION -->
    <!-- ============================================ -->
    <meta name="google-adsense-account" content="${CONFIG.ADSENSE_CLIENT}">
    
    <!-- Google AdSense Script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CONFIG.ADSENSE_CLIENT}"
         crossorigin="anonymous"></script>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Portal resmi Den Mardiyana - Website Developer. Koleksi ${projects.length} repositori GitHub dan live demo aplikasi web modern dengan teknologi terkini.">
    <meta name="keywords" content="den mardiyana, fullstack developer, web developer, portfolio, github projects, javascript, react, node.js, indonesia developer">
    <meta name="author" content="Den Mardiyana">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${CONFIG.BASE_URL}">
    <meta property="og:title" content="Den Mardiyana - Website Developer">
    <meta property="og:description" content="Portal resmi Den Mardiyana. Koleksi ${projects.length} repositori GitHub dan live demo aplikasi web.">
    <meta property="og:image" content="${CONFIG.BASE_URL}${CONFIG.PROFILE_IMG}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${CONFIG.BASE_URL}">
    <meta property="twitter:title" content="Den Mardiyana - Website Developer Portfolio">
    <meta property="twitter:description" content="Portal resmi Den Mardiyana. Koleksi ${projects.length} repositori GitHub dan live demo aplikasi web.">
    <meta property="twitter:image" content="${CONFIG.BASE_URL}${CONFIG.PROFILE_IMG}">
    
    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://pagead2.googlesyndication.com">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #020617; color: #f8fafc; }
        .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .gradient-text { background: linear-gradient(to right, #60a5fa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-bg { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 100vh; 
                   background: radial-gradient(circle at 50% -10%, rgba(37, 99, 235, 0.1), transparent 60%); z-index: -1; pointer-events: none; }
        .profile-ring { padding: 4px; background: linear-gradient(135deg, #60A5FA, #A78BFA); border-radius: 9999px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    </style>

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Den Mardiyana",
      "image": "${CONFIG.BASE_URL}${CONFIG.PROFILE_IMG}",
      "jobTitle": "Website Developer",
      "description": "Website Developer spesialisasi dalam pengembangan web modern",
      "url": "${CONFIG.BASE_URL}",
      "sameAs": [
        "https://github.com/${CONFIG.USERNAME}",
        "https://www.linkedin.com/in/den-mardiyana-saputra/"
      ]
    }
    </script>
</head>
<body>
    <div class="glow-bg"></div>
    
    <header class="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div class="flex justify-center mb-8">
            <div class="profile-ring shadow-2xl shadow-blue-500/20 transition-transform hover:scale-105 duration-500">
                <img src="${CONFIG.PROFILE_IMG}" alt="Den Mardiyana - Website Developer" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#020617]" width="128" height="128" loading="eager">
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
            Menampilkan <span class="text-white">${projects.length} repositori</span> pilihan yang telah di bangun.
        </p>
    </header>

    <!-- AdSense Banner (Header) -->
    <div class="max-w-7xl mx-auto px-6 mb-10">
        <div class="glass p-4 rounded-[2rem] border border-white/5 flex items-center justify-center min-h-[90px]">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="${CONFIG.ADSENSE_CLIENT}"
                 data-ad-format="horizontal"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-6 pb-40">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            ${projectCards}
        </div>
    </main>

    <footer class="max-w-5xl mx-auto px-6 py-20 text-center border-t border-white/5">
        <p class="text-[10px] text-slate-500 uppercase tracking-[0.5em] font-black">
            © ${new Date().getFullYear()} Den Mardiyana • Website Developer
        </p>
    </footer>
</body>
</html>`;
}

// ========================================
// MAIN GENERATOR
// ========================================

async function generateHub() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 SEO-Optimized Hub Generator v2.4');
    console.log('   GSC Sitemap Fixed Edition');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🌐 Base URL: ${CONFIG.BASE_URL}`);
    console.log(`💰 AdSense: ${CONFIG.ADSENSE_CLIENT}`);
    console.log(`📁 Output: index.html, sitemap.xml, robots.txt\n`);
    
    let repos = null;
    
    try {
        const apiUrl = `https://api.github.com/users/${CONFIG.USERNAME}/repos?per_page=100&sort=updated&direction=desc`;
        repos = await fetchWithRetry(apiUrl);
        saveCache(repos);
        
    } catch (error) {
        console.error(`❌ GitHub API Error: ${error.message}`);
        console.log('🔄 Attempting to use cached data...\n');
        
        const cache = loadCache();
        if (cache && cache.repos) {
            repos = cache.repos;
            console.log('✅ Using cached repositories');
        } else {
            throw new Error('No cached data available. Generator failed.');
        }
    }
    
    if (!repos || !Array.isArray(repos)) {
        throw new Error('Invalid repository data');
    }
    
    const projects = repos.filter(repo => 
        repo.name.toLowerCase() !== `${CONFIG.USERNAME}.github.io`.toLowerCase() && 
        repo.fork === false &&
        !repo.private
    );
    
    console.log(`\n📊 Processing ${projects.length} repositories...\n`);
    
    try {
        const htmlContent = generateHTML(projects);
        const sitemapContent = generateSitemap(projects);
        const robotsContent = generateRobots();
        
        // Write with proper encoding
        fs.writeFileSync('index.html', htmlContent, { encoding: 'utf8' });
        fs.writeFileSync('sitemap.xml', sitemapContent, { encoding: 'utf8' });
        fs.writeFileSync('robots.txt', robotsContent, { encoding: 'utf8' });
        
        console.log('✅ index.html generated (with AdSense)');
        console.log('✅ sitemap.xml generated (GSC-ready, UTF-8 encoded)');
        console.log('✅ robots.txt generated');
        
        console.log(`\n📈 Statistics:`);
        console.log(`   Total projects: ${projects.length}`);
        console.log(`   Live GitHub Pages: ${projects.filter(p => p.has_pages).length}`);
        console.log(`   Source repos: ${projects.filter(p => !p.has_pages).length}`);
        console.log(`   Sitemap URLs: ${projects.filter(p => p.has_pages).length + 1}`);
        console.log(`   AdSense placements: ${Math.floor(projects.length / 6) + 1}`);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Generation completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('📋 FIX STEPS FOR GSC SITEMAP ERROR:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. 📤 Upload semua file ke GitHub:');
        console.log('   git add .');
        console.log('   git commit -m "Fix sitemap.xml encoding"');
        console.log('   git push origin main');
        console.log('');
        console.log('2. ⏳ Tunggu 2-5 menit (GitHub Pages deploy)');
        console.log('');
        console.log('3. ✅ Test sitemap di browser:');
        console.log(`   ${CONFIG.BASE_URL}sitemap.xml`);
        console.log('   (Harus tampil XML, bukan 404)');
        console.log('');
        console.log('4. 🔍 Validate sitemap:');
        console.log('   https://www.xml-sitemaps.com/validate-xml-sitemap.html');
        console.log('');
        console.log('5. 🗺️  Submit ulang ke GSC:');
        console.log('   Google Search Console → Peta Situs');
        console.log('   Delete sitemap lama (jika ada)');
        console.log(`   Submit: ${CONFIG.BASE_URL}sitemap.xml`);
        console.log('');
        console.log('6. ⏰ Tunggu 24-48 jam untuk indexing\n');
        
        console.log('🔧 TROUBLESHOOTING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Jika masih error "Tidak dapat membaca":');
        console.log('• Pastikan file sitemap.xml ada di root repo');
        console.log('• Check GitHub Pages setting: Settings → Pages');
        console.log('• Source harus: Deploy from branch (main)');
        console.log('• Folder harus: / (root)');
        console.log(`• Test manual: curl ${CONFIG.BASE_URL}sitemap.xml\n`);
        
    } catch (writeError) {
        throw new Error(`File write error: ${writeError.message}`);
    }
}

process.on('uncaughtException', (error) => {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n❌ UNHANDLED REJECTION:', reason);
    process.exit(1);
});

(async () => {
    try {
        await generateHub();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        process.exit(1);
    }
})();
