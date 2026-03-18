const fs = require('fs');
const path = require('path');

const USERNAME = 'denmard123';
const BASE_URL = `https://${USERNAME}.github.io/`;

async function generateHub() {
    try {
        console.log('fetching daftar repositori dari GitHub API...');
        // 1. Ambil data repo dari GitHub API
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`);
        const repos = await response.json();

        // 2. Filter hanya repo yang punya GitHub Pages dan bukan repo utama ini sendiri
        const projects = repos.filter(repo => 
            repo.has_pages && 
            repo.name !== `${USERNAME}.github.io` &&
            repo.name !== 'github' // Kecualikan folder temp jika ada
        );

        // 3. Generate HTML Cards
        let projectCards = '';
        projects.forEach(repo => {
            const displayName = repo.name.replace(/-/g, ' ');
            projectCards += `
            <a href="https://${USERNAME}.github.io/${repo.name}/" class="glass p-6 rounded-2xl hover:bg-white/5 transition-all group">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span class="text-xs text-slate-500 italic">Repo: ${repo.name}</span>
                </div>
                <h3 class="text-xl font-semibold mb-2 capitalize">${displayName}</h3>
                <p class="text-slate-400 text-sm leading-relaxed">${repo.description || 'Proyek GitHub Pages otomatis terdeteksi.'}</p>
            </a>\n`;
        });

        // 4. Update index.html
        const templatePath = path.join(__dirname, 'template.html');
        if (fs.existsSync(templatePath)) {
            const template = fs.readFileSync(templatePath, 'utf8');
            const finalHtml = template.replace('', projectCards);
            fs.writeFileSync('index.html', finalHtml);
        }

        // 5. Update sitemap.xml
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        sitemap += `  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>\n`;
        projects.forEach(repo => {
            sitemap += `  <url><loc>${BASE_URL}${repo.name}/</loc><priority>0.8</priority></url>\n`;
        });
        sitemap += `</urlset>`;
        fs.writeFileSync('sitemap.xml', sitemap);

        // 6. Generate robots.txt
        fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}sitemap.xml`);

        console.log(`✅ Berhasil! Terdeteksi ${projects.length} proyek GitHub Pages.`);
    } catch (error) {
        console.error('❌ Gagal mengambil data:', error);
    }
}

generateHub();
