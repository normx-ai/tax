import type { ArticleData, SommaireNode } from "./types";
import { parseArticles, buildChapitreTree } from "./helpers";

// Conventions fiscales
import convCemacCh1Data from "@/data/convention-cemac-chapitre1.json";
import convCemacCh2Data from "@/data/convention-cemac-chapitre2.json";
import convCemacCh3Data from "@/data/convention-cemac-chapitre3.json";
import convCemacCh4Data from "@/data/convention-cemac-chapitre4.json";
import convCemacCh5Data from "@/data/convention-cemac-chapitre5.json";
import convCemacCh6Data from "@/data/convention-cemac-chapitre6.json";
import convChineData from "@/data/convention-chine.json";
import convFranceData from "@/data/convention-france.json";
import convItalieCh1Data from "@/data/convention-italie-chapitre1.json";
import convItalieCh2Data from "@/data/convention-italie-chapitre2.json";
import convItalieCh3Data from "@/data/convention-italie-chapitre3.json";
import convItalieCh4Data from "@/data/convention-italie-chapitre4.json";
import convItalieCh5Data from "@/data/convention-italie-chapitre5.json";
import convItalieCh6Data from "@/data/convention-italie-chapitre6.json";
import convItalieProtoData from "@/data/convention-italie-protocole.json";
import convMauriceCh1Data from "@/data/convention-maurice-chapitre1.json";
import convMauriceCh2Data from "@/data/convention-maurice-chapitre2.json";
import convMauriceCh3Data from "@/data/convention-maurice-chapitre3.json";
import convMauriceCh4Data from "@/data/convention-maurice-chapitre4.json";
import convMauriceCh5Data from "@/data/convention-maurice-chapitre5.json";
import convMauriceCh6Data from "@/data/convention-maurice-chapitre6.json";
import convRwandaCh1Data from "@/data/convention-rwanda-chapitre1.json";
import convRwandaCh2Data from "@/data/convention-rwanda-chapitre2.json";
import convRwandaCh3Data from "@/data/convention-rwanda-chapitre3.json";
import convRwandaCh4Data from "@/data/convention-rwanda-chapitre4.json";
import convRwandaCh5Data from "@/data/convention-rwanda-chapitre5.json";
import convRwandaCh6Data from "@/data/convention-rwanda-chapitre6.json";

// CEMAC
const aConvCemacCh1 = parseArticles(convCemacCh1Data.articles);
const aConvCemacCh2 = parseArticles(convCemacCh2Data.articles);
const aConvCemacCh3 = parseArticles(convCemacCh3Data.articles);
const aConvCemacCh4 = parseArticles(convCemacCh4Data.articles);
const aConvCemacCh5 = parseArticles(convCemacCh5Data.articles);
const aConvCemacCh6 = parseArticles(convCemacCh6Data.articles);
// Bilatérales
const aConvChine = parseArticles(convChineData.articles);
const aConvFrance = parseArticles(convFranceData.articles);
// Italie
const aConvItalieCh1 = parseArticles(convItalieCh1Data.articles);
const aConvItalieCh2 = parseArticles(convItalieCh2Data.articles);
const aConvItalieCh3 = parseArticles(convItalieCh3Data.articles);
const aConvItalieCh4 = parseArticles(convItalieCh4Data.articles);
const aConvItalieCh5 = parseArticles(convItalieCh5Data.articles);
const aConvItalieCh6 = parseArticles(convItalieCh6Data.articles);
const aConvItalieProto = parseArticles(convItalieProtoData.articles);
// Maurice
const aConvMauriceCh1 = parseArticles(convMauriceCh1Data.articles);
const aConvMauriceCh2 = parseArticles(convMauriceCh2Data.articles);
const aConvMauriceCh3 = parseArticles(convMauriceCh3Data.articles);
const aConvMauriceCh4 = parseArticles(convMauriceCh4Data.articles);
const aConvMauriceCh5 = parseArticles(convMauriceCh5Data.articles);
const aConvMauriceCh6 = parseArticles(convMauriceCh6Data.articles);
// Rwanda
const aConvRwandaCh1 = parseArticles(convRwandaCh1Data.articles);
const aConvRwandaCh2 = parseArticles(convRwandaCh2Data.articles);
const aConvRwandaCh3 = parseArticles(convRwandaCh3Data.articles);
const aConvRwandaCh4 = parseArticles(convRwandaCh4Data.articles);
const aConvRwandaCh5 = parseArticles(convRwandaCh5Data.articles);
const aConvRwandaCh6 = parseArticles(convRwandaCh6Data.articles);

// Convention CEMAC
const convCemacNode: SommaireNode = {
  id: "conv-cemac", label: "1.1. Convention fiscale CEMAC",
  articles: [...aConvCemacCh1, ...aConvCemacCh2, ...aConvCemacCh3, ...aConvCemacCh4, ...aConvCemacCh5, ...aConvCemacCh6],
};

// Conventions bilatérales
const convChineNode: SommaireNode = { id: "conv-chine", label: "1.2. Convention fiscale avec la Chine", articles: aConvChine };
const convFranceNode: SommaireNode = { id: "conv-france", label: "1.3. Convention fiscale avec la France", articles: aConvFrance };

// Convention Italie
const convItalieNode: SommaireNode = {
  id: "conv-italie", label: "1.4. Convention fiscale avec l'Italie",
  articles: [...aConvItalieCh1, ...aConvItalieCh2, ...aConvItalieCh3, ...aConvItalieCh4, ...aConvItalieCh5, ...aConvItalieCh6, ...aConvItalieProto],
};

// Convention Maurice
const convMauriceNode: SommaireNode = {
  id: "conv-maurice", label: "1.5. Convention fiscale avec la République de Maurice",
  articles: [...aConvMauriceCh1, ...aConvMauriceCh2, ...aConvMauriceCh3, ...aConvMauriceCh4, ...aConvMauriceCh5, ...aConvMauriceCh6],
};

const convRwandaNode: SommaireNode = {
  id: "conv-rwanda", label: "1.6. Convention fiscale avec le Rwanda",
  articles: [...aConvRwandaCh1, ...aConvRwandaCh2, ...aConvRwandaCh3, ...aConvRwandaCh4, ...aConvRwandaCh5, ...aConvRwandaCh6],
};

export const conventionsNode: SommaireNode = {
  id: "conventions", label: "1. Conventions fiscales",
  children: [
    convCemacNode,
    convChineNode,
    convFranceNode,
    convItalieNode,
    convMauriceNode,
    convRwandaNode,
  ],
};

export const conventionsArticles: ArticleData[] = [
  ...aConvCemacCh1, ...aConvCemacCh2, ...aConvCemacCh3, ...aConvCemacCh4, ...aConvCemacCh5, ...aConvCemacCh6,
  ...aConvChine, ...aConvFrance,
  ...aConvItalieCh1, ...aConvItalieCh2, ...aConvItalieCh3, ...aConvItalieCh4, ...aConvItalieCh5, ...aConvItalieCh6, ...aConvItalieProto,
  ...aConvMauriceCh1, ...aConvMauriceCh2, ...aConvMauriceCh3, ...aConvMauriceCh4, ...aConvMauriceCh5, ...aConvMauriceCh6,
  ...aConvRwandaCh1, ...aConvRwandaCh2, ...aConvRwandaCh3, ...aConvRwandaCh4, ...aConvRwandaCh5, ...aConvRwandaCh6,
];
