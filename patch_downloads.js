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

    // Remove auto-download logic
    content = content.replace(/link\.click\(\);\s*link\.remove\(\);/g, '// auto-download removido para prevenir erro de nome');

    // Add Download Button to Success State
    const actionKey = Object.keys(fileNames).find(k => filePaths.includes(k));
    const dlName = fileNames[actionKey];

    const btnHTML = `
                                <a href={downloadUrl || "#"} download="${dlName}" className="mt-6 bg-black text-white font-bold py-4 px-12 rounded-xl text-xl hover:bg-gray-800 transition shadow-lg">
                                    Baixar Arquivo Final
                                </a>`;

    // Achar o status success:
    if (content.includes('status === "success"')) {
        content = content.replace(/<button onClick=\{handleReset\}/, btnHTML + '\n                                <button onClick={handleReset}');
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Patched ${actionKey}`);
});
