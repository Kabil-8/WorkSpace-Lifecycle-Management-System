import io
import re

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

def parse_resume_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Parses PDF, DOCX, or TXT binary file bytes and returns clean extracted text.
    Uses safe fallback if pypdf or docx are unavailable.
    """
    extracted_text = ""
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf") and HAS_PYPDF:
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            pages_text = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            extracted_text = "\n".join(pages_text)
        except Exception as e:
            print(f"Error parsing PDF with pypdf: {e}")

    elif (filename_lower.endswith(".docx") or filename_lower.endswith(".doc")) and HAS_DOCX:
        try:
            docx_file = io.BytesIO(file_bytes)
            doc = docx.Document(docx_file)
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            extracted_text = "\n".join(paragraphs)
        except Exception as e:
            print(f"Error parsing DOCX: {e}")

    # Fallback or UTF-8 decode
    if not extracted_text.strip():
        try:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = str(file_bytes)

    # Clean PDF/binary noise (%PDF-1.7, stream obj, non-printable chars)
    cleaned = re.sub(r'%PDF-[\s\S]*?obj', '', extracted_text, flags=re.IGNORECASE)
    cleaned = re.sub(r'\/Filter[\s\S]*?stream', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'endobj|endstream', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', ' ', cleaned)
    cleaned = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', cleaned)
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    cleaned = re.sub(r'\n+', '\n', cleaned).strip()

    return cleaned
