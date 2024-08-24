import { TextLineStream } from "jsr:@std/streams/text-line-stream";
import { YomiDict } from "npm:yomi-dict@0.1.8";

async function getGradedWords(filePath, threshold) {
  const examples = [];
  const file = await Deno.open(filePath);
  const lineStream = file.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());
  for await (const line of lineStream) {
    if (!line) continue;
    const arr = line.split(",");
    const word = arr[0];
    const count = parseInt(arr[1]);
    if (count >= threshold) {
      examples.push(word);
    }
  }
  return examples;
}

async function getGradedVocab(level, threshold) {
  const filepath = "graded-vocab-ja/dist/" + level + ".csv";
  return await getGradedWords(filepath, threshold);
}

async function getGradedIdioms(level, threshold) {
  const filepath = "graded-idioms-ja/dist/" + level + ".csv";
  return await getGradedWords(filepath, threshold);
}

async function build(threshold) {
  const yomiDict = await YomiDict.load("yomi-dict/yomi.csv");
  for (let level = 1; level <= 12; level++) {
    const result = [];
    let words = [];
    const vocab = await getGradedVocab(level, threshold);
    const idioms = await getGradedIdioms(level, threshold);
    words.push(...vocab);
    words.push(...idioms);
    words = [...new Set(words)];
    for (const word of words) {
      let yomis = yomiDict.get(word);
      if (!yomis) continue;
      yomis = yomis
        .filter((yomi) => yomi.at(-1) != "っ")
        .filter((yomi) => yomi.length <= 8);
      if (yomis.length == 0) continue;
      const line = word + "\t" + yomis.join("|");
      result.push(line);
    }
    const outPath = "src/data/" + level + ".tsv";
    Deno.writeTextFileSync(outPath, result.join("\n"));
  }
}

const threshold = 100000;
await build(threshold);
