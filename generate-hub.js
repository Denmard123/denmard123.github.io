const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://denmard123.github.io/';
const EXCLUDE_FOLDERS = ['.git', '.github', 'node_modules', 'assets'];

// 1. Ambil daftar folder proyek secara otomatis
const projects = fs.readdirSync('./', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !EXCLUDE_FOLDERS.includes(dirent.name))
    .map(dirent => dirent.name);

// 2. Generate HTML Cards secara dinamis
let projectCards = '';
projects.forEach(project => {
    projectCards += `
    <a href="/${project}/" class="glass p-6 rounded-2xl hover:bg-white/5 transition-all group">
        <div class="flex justify-between items-start mb-4">
            <div class="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                </svg>
            </div>
            <span class="text-xs text-slate-500 italic">Sub-folder: /${project}</span>
        </div>
        <h3 class="text-xl font-semibold mb-2 capitalize">${project.replace(/-/g, ' ')}</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Proyek otomatis terdeteksi. Klik untuk melihat detail di repositori ${project}.</p>
    </a>\n`;
});

// 3. Update index.html dengan memasukkan kartu ke dalam placeholder
const templatePath = path.join(__dirname, 'template.html');
if (fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, 'utf8');
    // Memastikan placeholder '' diganti dengan kartu proyek
    const finalHtml = template.replace('', projectCards);
    fs.writeFileSync('index.html', finalHtml);
}

// 4. Update sitemap.xml untuk SEO yang optimal
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemap += `  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>\n`;
projects.forEach(p => {
    sitemap += `  <url><loc>${BASE_URL}${p}/</loc><priority>0.8</priority></url>\n`;
});
sitemap += `</urlset>`;
fs.writeFileSync('sitemap.xml', sitemap);

// 5. Generate robots.txt secara otomatis (BARU)
let robots = `User-agent: *\n`;
robots += `Allow: /\n`;
robots += `Sitemap: ${BASE_URL}sitemap.xml\n`;
fs.writeFileSync('robots.txt', robots);

console.log('✅ Berhasil: index.html, sitemap.xml, dan robots.txt diperbarui secara otomatis!');