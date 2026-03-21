const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'frontend/app/add-text/page.tsx',
    'frontend/app/to-word/page.tsx',
    'frontend/app/split/page.tsx',
    'frontend/app/compress/page.tsx',
    'frontend/app/merge/page.tsx'
];

filesToPatch.forEach(filePaths => {
    let fullPath = path.join(__dirname, filePaths);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Remove the misplaced anchor from the idle state. It was injected directly before the first Cancelar button
    const regexBad = /<a href=\{downloadUrl \|\| "#"\} download=".*?" className=".*?">\s*Baixar Arquivo Final\s*<\/a>\s*<button onClick=\{handleReset\}/g;
    content = content.replace(regexBad, '<button onClick={handleReset}');

    // 2. Inject it into the Success state block right before the "Editar novo arquivo" button
    const fileNames = {
        'add-text': 'Documento_Carimbado_iLovePDF.pdf',
        'to-word': 'Convertido_Word_iLovePDF.docx',
        'split': 'PDF_Extraido_iLovePDF.pdf',
        'compress': 'Comprimido_iLovePDF.pdf',
        'merge': 'Documento_Junto_iLovePDF.pdf'
    };
    const actionKey = Object.keys(fileNames).find(k => filePaths.includes(k));
    const dlName = fileNames[actionKey];

    const btnHTML = `
                                <a href={downloadUrl || "#"} download="${dlName}" className="mb-4 bg-black text-white font-bold py-4 px-12 rounded-xl text-xl hover:bg-gray-800 transition shadow-lg w-full max-w-sm text-center">
                                    🗂️ Baixar Arquivo Final
                                </a>\n                                <button onClick={handleReset} className="mt-4 bg-pdfred hover:bg-red-700 text-white font-bold py-3 px-10 rounded-xl shadow-xl">`;

    if (!content.includes('Baixar Arquivo Final')) {
        content = content.replace(/<button onClick=\{handleReset\} className="mt-8 bg-pdfred hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl shadow-xl">/, btnHTML);
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Cleaned up ${actionKey}`);
});
