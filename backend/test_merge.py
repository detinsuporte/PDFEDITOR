import fitz

try:
    # cria 2 blocos falsos
    doc1 = fitz.open()
    doc1.new_page()
    doc1.new_page()
    
    doc2 = fitz.open()
    doc2.new_page()
    
    loaded_docs = [doc1, doc2]
    
    doc_dest = fitz.open()
    doc_dest.insert_pdf(loaded_docs[0], from_page=0, to_page=0)
    doc_dest.insert_pdf(loaded_docs[0], from_page=1, to_page=1)
    
    print("Sucesso nas insercoes duplas!")
except Exception as e:
    print(f"ERRO: {e}")
