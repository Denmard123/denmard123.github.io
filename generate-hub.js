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
// ADSENSE SNIPPET (For All Pages)
// ========================================

function generateAdSenseSnippet() {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AdSense Global Snippet</title>
    
    <!-- ============================================ -->
    <!-- GOOGLE ADSENSE - OWNERSHIP VERIFICATION -->
    <!-- ============================================ -->
    <meta name="google-adsense-account" content="${CONFIG.ADSENSE_CLIENT}">
    
    <!-- Google AdSense Script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CONFIG.ADSENSE_CLIENT}"
         crossorigin="anonymous"></script>
</head>
<body>
    <!-- This file can be included in other pages -->
    
    <!-- AdSense Auto Ads will work on any page that includes this script -->
    
    <!-- Manual Ad Unit Template -->
    <div class="adsense-container" style="margin: 20px auto; max-width: 728px; text-align: center;">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${CONFIG.ADSENSE_CLIENT}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>
             (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
    </div>
</body>
</html>`;
}

// ========================================
// ADSENSE INJECTION SCRIPT (For Existing Pages)
// ========================================

function generateAdSenseInjector() {
    return `<!-- AdSense Injector Script -->
<!-- Add this to the <head> of your GitHub Pages -->
<!-- File: adsense-injector.js -->

(function() {
    // Ownership verification meta tag
    var meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = '${CONFIG.ADSENSE_CLIENT}';
    document.head.appendChild(meta);
    
    // AdSense script
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CONFIG.ADSENSE_CLIENT}';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    
    // Optional: Insert ad unit after page load
    window.addEventListener('load', function() {
        // Find good insertion point (after first h1 or main content)
        var insertPoint = document.querySelector('h1') || document.querySelector('main') || document.body;
        
        if (insertPoint) {
            var adContainer = document.createElement('div');
            adContainer.style.margin = '20px auto';
            adContainer.style.maxWidth = '728px';
            adContainer.style.textAlign = 'center';
            
            var adUnit = document.createElement('ins');
            adUnit.className = 'adsbygoogle';
            adUnit.style.display = 'block';
            adUnit.setAttribute('data-ad-client', '${CONFIG.ADSENSE_CLIENT}');
            adUnit.setAttribute('data-ad-format', 'auto');
            adUnit.setAttribute('data-full-width-responsive', 'true');
            
            adContainer.appendChild(adUnit);
            
            // Insert after h1 or at top of main
            if (insertPoint.tagName === 'H1') {
                insertPoint.parentNode.insertBefore(adContainer, insertPoint.nextSibling);
            } else {
                insertPoint.insertBefore(adContainer, insertPoint.firstChild);
            }
            
            // Push ad
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
    });
})();`;
}

// ========================================
// SITEMAP GENERATION (OPTIMIZED)
// ========================================

function generateSitemap(projects) {
    const now = new Date().toISOString().split('T')[0];
    let urls = '';
    
    // Homepage
    urls += `  <url>
    <loc>${CONFIG.BASE_URL}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;
    
    // AdSense snippet page
    urls += `  <url>
    <loc>${CONFIG.BASE_URL}adsense-snippet.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>\n`;
    
    // All repositories
    const liveProjects = [];
    const sourceProjects = [];
    
    projects.forEach(repo => {
        if (repo.has_pages) {
            liveProjects.push(repo);
        } else {
            sourceProjects.push(repo);
        }
    });
    
    // Live GitHub Pages (PRIORITY)
    liveProjects.forEach(repo => {
        const lastmod = new Date(repo.updated_at).toISOString().split('T')[0];
        const url = `${CONFIG.BASE_URL}${repo.name}/`;
        
        urls += `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });
    
    // Source repos (lower priority, external links)
    sourceProjects.forEach(repo => {
        const lastmod = new Date(repo.updated_at).toISOString().split('T')[0];
        
        urls += `  <url>
    <loc>${repo.html_url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
    });
    
    const totalUrls = projects.length + 2; // +2 for homepage + adsense snippet
    console.log(`📄 Sitemap entries: ${totalUrls} URLs`);
    console.log(`   - Homepage: 1`);
    console.log(`   - Live Pages: ${liveProjects.length}`);
    console.log(`   - Source Repos: ${sourceProjects.length}`);
    console.log(`   - AdSense Snippet: 1`);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
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
Disallow: /.cache.json

# Allow AdSense bot
User-agent: Mediapartners-Google
Allow: /

# Google-specific
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Bing-specific
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Sitemap location
Sitemap: ${CONFIG.BASE_URL}sitemap.xml`;
}

// ========================================
// HTML GENERATION (HOMEPAGE WITH ADSENSE)
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
    <title>Den Mardiyana | Central Repository Hub - Fullstack Developer Portfolio</title>
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
    <meta name="description" content="Portal resmi Den Mardiyana - Fullstack Developer. Koleksi ${projects.length} repositori GitHub dan live demo aplikasi web modern dengan teknologi terkini.">
    <meta name="keywords" content="den mardiyana, fullstack developer, web developer, portfolio, github projects, javascript, react, node.js, indonesia developer">
    <meta name="author" content="Den Mardiyana">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${CONFIG.BASE_URL}">
    <meta property="og:title" content="Den Mardiyana - Fullstack Developer Portfolio">
    <meta property="og:description" content="Portal resmi Den Mardiyana. Koleksi ${projects.length} repositori GitHub dan live demo aplikasi web.">
    <meta property="og:image" content="${CONFIG.BASE_URL}${CONFIG.PROFILE_IMG}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${CONFIG.BASE_URL}">
    <meta property="twitter:title" content="Den Mardiyana - Fullstack Developer Portfolio">
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
      "jobTitle": "Fullstack Developer",
      "description": "Fullstack Developer spesialisasi dalam pengembangan aplikasi web modern",
      "url": "${CONFIG.BASE_URL}",
      "sameAs": [
        "https://github.com/${CONFIG.USERNAME}",
        "https://linkedin.com/in/den-mardiyana-saputra-0628141b7/"
      ]
    }
    </script>
</head>
<body>
    <div class="glow-bg"></div>
    
    <header class="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div class="flex justify-center mb-8">
            <div class="profile-ring shadow-2xl shadow-blue-500/20 transition-transform hover:scale-105 duration-500">
                <img src="${CONFIG.PROFILE_IMG}" alt="Den Mardiyana - Fullstack Developer" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#020617]" width="128" height="128" loading="eager">
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
            © ${new Date().getFullYear()} Den Mardiyana • Fullstack Engineer
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
    console.log('🚀 SEO-Optimized Hub Generator v2.3');
    console.log('   With Universal AdSense Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🌐 Base URL: ${CONFIG.BASE_URL}`);
    console.log(`💰 AdSense: ${CONFIG.ADSENSE_CLIENT}`);
    console.log(`📁 Output: index.html, sitemap.xml, robots.txt, adsense files\n`);
    
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
        const adsenseSnippet = generateAdSenseSnippet();
        const adsenseInjector = generateAdSenseInjector();
        
        // Write main files
        fs.writeFileSync('index.html', htmlContent, 'utf8');
        fs.writeFileSync('sitemap.xml', sitemapContent, 'utf8');
        fs.writeFileSync('robots.txt', robotsContent, 'utf8');
        
        // Write AdSense helper files
        fs.writeFileSync('adsense-snippet.html', adsenseSnippet, 'utf8');
        fs.writeFileSync('adsense-injector.js', adsenseInjector, 'utf8');
        
        console.log('✅ index.html generated (with AdSense)');
        console.log('✅ sitemap.xml generated (all repos + adsense files)');
        console.log('✅ robots.txt generated (Mediapartners-Google allowed)');
        console.log('✅ adsense-snippet.html generated (standalone page)');
        console.log('✅ adsense-injector.js generated (for other pages)');
        
        console.log(`\n📈 Statistics:`);
        console.log(`   Total projects: ${projects.length}`);
        console.log(`   Live GitHub Pages: ${projects.filter(p => p.has_pages).length}`);
        console.log(`   Source repos: ${projects.filter(p => !p.has_pages).length}`);
        console.log(`   Sitemap URLs: ${projects.length + 2}`);
        console.log(`   AdSense placements (homepage): ${Math.floor(projects.length / 6) + 1}`);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Generation completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('📋 NEXT STEPS FOR ADSENSE ON ALL PAGES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. 📤 Upload all generated files to GitHub');
        console.log('2. 🔧 Add this to ALL your GitHub Pages HTML files:');
        console.log('   <script src="https://denmard123.github.io/adsense-injector.js"></script>');
        console.log('   (Place before </body> tag)');
        console.log('');
        console.log('3. ✅ Verify AdSense approval');
        console.log(`4. 🗺️  Submit sitemap to GSC: ${CONFIG.BASE_URL}sitemap.xml`);
        console.log(`5. 🤖 Test robots.txt: ${CONFIG.BASE_URL}robots.txt`);
        console.log('');
        console.log('🔍 Test URLs:');
        console.log(`   Homepage: ${CONFIG.BASE_URL}`);
        console.log(`   AdSense Snippet: ${CONFIG.BASE_URL}adsense-snippet.html`);
        console.log(`   Injector Script: ${CONFIG.BASE_URL}adsense-injector.js`);
        console.log(`   Sitemap: ${CONFIG.BASE_URL}sitemap.xml\n`);
        
        console.log('💡 PRO TIP: For automatic injection, add this line to your');
        console.log('   GitHub Pages build process or template file.\n');
        
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
