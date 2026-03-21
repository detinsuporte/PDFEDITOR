# Miriam Editor-PDF 📄✨

Um clone moderno, luxuoso e hiper-poderoso focado na facilidade de manipulação, edições fotográficas parciais e extrações de dados de PDFs. Apresenta tema visual minimalista em homenagem estética aos padrões Mercedes-Benz.

## 🚀 Tecnologias Utilizadas

O projeto foi engenhosamente acoplado em dois motores separados para garantir a máxima performance: um front-end robusto servindo interação gráfica instantânea e uma API backend encarregada de "esmagar" binários de dados.

### 🎨 Front-end (UI/UX)
- **Base:** Next.js 14 (App Router) e React 18.
- **Estilização Pura:** Tailwind CSS (com paletas refinadas Dark da arquitetura Vercel).
- **Tratamento de Temas:** `next-themes` (Evita FOUC e conflito violento entre Cache x Modo Escuro e Claro).
- **Core de Visualização:** `react-pdf` / `pdf.js` executados ocultamente em *Web Workers*, renderizando telas independentes por thumbnail com peso imperceptível ao usuário.
- **Movimentação Relativa:** `react-rnd` criando lógica matemática para injeção e reposicionamento x/y ao interagir na folha A4 em modo de zoom em tempo real.
- **Conexão:** Axios.

### ⚙️ Back-end (Engine de Edição)
- **Base:** FastAPI (Moderno e assíncrono em Python 3).
- **Bisturi PDF (Processamento C/C++):** PyMuPDF (`fitz`). Atua fatiando as streams do PDF, injetando pixels virtuais e realizando o merge utilizando a Memória RAM temporária hiper-veloz sem sujar ou lotar os HDs/SSDs do servidor de arquivos inúteis (Buffers exportados via *StreamingResponse*).
- **Análise Espacial de Dados:** `pdfplumber`. Localiza matematicamente o encontro invisível de coordenadas das linhas/colunas para ler tabelas de faturas corporais.
- **Geração de Arquivos Base:** Bibliotecas `pandas`, `docx`, `io.BytesIO()`.

---

## 🛠️ Resumo de Funcionalidades

1. **Juntar (Merge) PDF com Miniaturas Cirúrgicas**  
   Quebramos o limite de apenas mesclar arquivos inteiros! O usuário agora enxerga a "fotografia" individual de todas as milhares de páginas importadas, consegue arrastá-las entre si e criar uma nova matriz em uma sequência livre num Grid super arranjado.
2. **Dividir (Split) & Explodir PDFs em ZIP**  
   Interface em estilo de "Pinça" fotográfica. É só clicar pelas páginas visualizadas no radar ou apertar o botão de explosão ("Dividir Todo o PDF"), que faz o servidor fragmentar mil páginas ao mesmo tempo para zipa-las e mandá-las de baixo para o navegador.
3. **Extração Tática para Excel XLSX**  
   Extrai tabelas ocultas usando processadores espaciais injetando-os automaticamente no formato proprietário da Microsoft (OpenXML formats), permitindo manipulação imediata da tabela no Excel da máquina.
4. **Comprimir PDFs Otimizado**  
   Motor de minificação com Garbage Collection avançado (Nível 4). Destrói metadados nulos e combina chaves de fontes idênticas sem comprometer a resolução das folhas processadas.
5. **PDF para Word DOCX**  
   Conversor com leitura adaptativa de transcrição pronta para rodar no MS Word.
6. **Editor Visual Inteligente (Adicionar Texto Numérico/Carimbos)**  
   Fielmente emula um "Painel de Pintura/Paint" em um ambiente Web. Permite escalonar (*Zoom até 400%*), navegar na imagem com clique-arraste e inserir áreas de input perfeitamente precisas com suporte a *Shift+Enter* multi-linha.
7. **Dark Mode Absoluto com Proteção de Contraste**  
   Toda a interface migra do "Off-White" F3F0EC para fundos chumbo obscuros ativados por Botão Global sem esforço de hidratação. A funcionalidade foi combinada com rígido *Gate de Contraste*: elementos centrais de documentos PDF não alteram a coloração do seu papel para garantir fidelidade de documento impresso (A4 branco sólido).
