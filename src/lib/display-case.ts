/**
 * Headlines were first written in capitals (the old design shouted). The
 * CMS still holds that text, so an all-caps headline is shown in sentence
 * case here, keeping acronyms and names. Anything typed in mixed case is left
 * exactly as the editor wrote it.
 */
const KEEP = [
  "ACM", "AI", "ML", "LLM", "LLMs", "API", "APIs", "UX", "UI", "IEEE", "IoT", "AR", "VR", "RAG", "QR", "SQL", "CSE", "IT",
  "Amity", "University", "Lucknow", "Noida", "BuildHub", "GitHub", "India",
];
const byUpper = new Map(KEEP.map((w) => [w.toUpperCase(), w]));

export function displayCase(text: string): string {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4 || letters !== letters.toUpperCase()) return text;
  // Capital only at the start and after a full stop — a line break inside a
  // sentence ("Build something / worth showing.") is not a new sentence.
  let out = text.toLowerCase().replace(/(^\s*|[.!?]["”’)]?\s+)([a-z])/g, (_, pre: string, c: string) => pre + c.toUpperCase());
  out = out.replace(/[A-Za-z]+/g, (w) => byUpper.get(w.toUpperCase()) ?? w);
  // "I" on its own and after an apostrophe-less contraction stays capital.
  return out.replace(/\bi\b/g, "I");
}
