import fitz
import os

def test_watermark():
    doc = fitz.open()
    page = doc.new_page()
    
    text = "CONFIDENCIAL"
    fontsize = 60
    
    # Calculate text length roughly
    text_length = fitz.get_text_length(text, fontname="helv", fontsize=fontsize)
    
    x = (page.rect.width - text_length) / 2
    y = page.rect.height / 2
    
    # We want to rotate around the center of the text
    center_p = fitz.Point(page.rect.width / 2, page.rect.height / 2)
    
    try:
        page.insert_text(
            fitz.Point(x, y), 
            text, 
            fontsize=fontsize, 
            color=(1, 0, 0), 
            fill_opacity=0.3,
            morph=(center_p, fitz.Matrix(-45))
        )
    except Exception as e:
        print(f"Error 1: {e}")
        try:
            # Fallback for older fitz
            shape = page.new_shape()
            shape.insert_text(fitz.Point(x, y), text, fontsize=fontsize)
            shape.finish(color=(1,0,0), fill=(1,0,0), fill_opacity=0.3)
            shape.commit(morph=(center_p, fitz.Matrix(-45)))
        except Exception as e2:
            print(f"Error 2: {e2}")

    output_path = "test_wm.pdf"
    doc.save(output_path)
    print("Success, saved to", output_path)

if __name__ == "__main__":
    test_watermark()
