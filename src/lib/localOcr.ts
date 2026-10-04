import { createWorker, type Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng+nor", 1, {
      workerBlobURL: true,
      cacheMethod: "read",
    }).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

export async function recognizeReceiptText(file: Blob): Promise<string> {
  const worker = await getWorker();
  const result = await worker.recognize(file);
  return result.data.text ?? "";
}
