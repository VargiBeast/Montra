/** Local Tesseract OCR – never auto-creates transactions. */
import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  suggestedAmount: number | null;
  suggestedMerchant: string | null;
  suggestedDate: string | null;
}

export async function runLocalOcr(file: File): Promise<OcrResult> {
  const { data } = await Tesseract.recognize(file, 'eng+nor', {
    logger: () => {},
  });

  const text = data.text || '';
  const amountMatch = text.match(/(?:total|sum|beløp|amount)[:\s]*([0-9]+[.,][0-9]{2})/i)
    || text.match(/([0-9]+[.,][0-9]{2})\s*(?:kr|nok|,-)/i);
  const suggestedAmount = amountMatch
    ? parseFloat(amountMatch[1].replace(',', '.'))
    : null;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const suggestedMerchant = lines[0]?.slice(0, 60) || null;

  const dateMatch = text.match(/(\d{2})[./-](\d{2})[./-](\d{2,4})/);
  let suggestedDate: string | null = null;
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    suggestedDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return { text, suggestedAmount, suggestedMerchant, suggestedDate };
}
