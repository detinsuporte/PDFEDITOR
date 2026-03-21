const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'frontend/app/add-text/page.tsx',
    'frontend/app/to-word/page.tsx',
    'frontend/app/split/page.tsx',
    'frontend/app/compress/page.tsx',
    'frontend/app/merge/page.tsx'
];

const fileNames = {
    'add-text': 'Documento_Carimbado_iLovePDF.pdf',
    'to-word': 'Convertido_Word_iLovePDF.docx',
    'split': 'PDF_Extraido_iLovePDF.pdf',
    'compress': 'Comprimido_iLovePDF.pdf',
    'merge': 'Documento_Junto_iLovePDF.pdf'
};

filesToPatch.forEach(filePaths => {
    let fullPath = path.join(__dirname, filePaths);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    const actionKey = Object.keys(fileNames).find(k => filePaths.includes(k));
    const dlName = fileNames[actionKey];

    // Inject handleDownload function right before return (
    const executeDownloadFn = `
    const handleDownload = () => {
        if (!downloadUrl) return;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "${dlName}";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (`;

    if (!content.includes('const handleDownload = () => {')) {
        content = content.replace(/return\s*\(\s*<div/, executeDownloadFn + '\n        <div');
    }

    // Replace the <a> anchor with a <button> that triggers handleDownload
    const anchorRegex = /<a href=\{downloadUrl \|\| "#"\} download=".*?" className="(.*?)">\s*🗂️ Baixar Arquivo Final\s*<\/a>/g;

    // We recreate the exact same CSS classes so it looks identical, but as a button
    content = content.replace(anchorRegex, (match, classes) => {
        // Change w-full max-w-sm to be standard if it was an <a> tag
        return `<button onClick={handleDownload} className="${classes}">\n                                    🗂️ Baixar Arquivo Final\n                                </button>`;
    });

    fs.writeFileSync(fullPath, content);
    console.log(`Hardcoded programmatic download for ${actionKey}`);
});
