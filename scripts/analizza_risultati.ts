/**
 * analizza_risultati.ts
 * 
 * Legge i risultati dal DB e dall'Excel, poi confronta le due classifiche
 * per trovare incongruenze nei risultati delle Nolimpiadi 7ª edizione.
 *
 * Esecuzione: npx ts-node --esm scripts/analizza_risultati.ts
 * oppure:      npx tsx scripts/analizza_risultati.ts
 */

import "dotenv/config";
import { PrismaClient, DisciplineKind } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

// ─── TIPI ────────────────────────────────────────────────────────────────────

interface AthleteResult {
  name: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  matches: number;
}

interface DisciplineResults {
  discipline: string;
  athletes: AthleteResult[];
}

interface ExcelRow {
  [key: string]: string | number | undefined;
}

// ─── LEGGI DAL DATABASE ───────────────────────────────────────────────────────

async function fetchDBResults(): Promise<DisciplineResults[]> {
  console.log("\n📡 Connessione al DB Neon...");

  const disciplines = await prisma.discipline.findMany({
    include: {
      matches: {
        where: { phase: "QUALIFICAZIONE" },
        include: {
          sides: {
            include: {
              athletes: {
                include: { athlete: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const results: DisciplineResults[] = [];

  for (const disc of disciplines) {
    const athleteMap: Map<string, AthleteResult> = new Map();

    for (const match of disc.matches) {
      if (match.sides.length !== 2) continue;

      const side1 = match.sides.find((s) => s.side === 1);
      const side2 = match.sides.find((s) => s.side === 2);
      if (!side1 || !side2) continue;

      const side1Won = side1.points > side2.points;
      const side2Won = side2.points > side1.points;

      const updateAthlete = (
        athleteName: string,
        myPoints: number,
        theirPoints: number,
        won: boolean
      ) => {
        const existing = athleteMap.get(athleteName) ?? {
          name: athleteName,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          matches: 0,
        };
        athleteMap.set(athleteName, {
          ...existing,
          wins: existing.wins + (won ? 1 : 0),
          losses: existing.losses + (!won ? 1 : 0),
          pointsFor: existing.pointsFor + myPoints,
          pointsAgainst: existing.pointsAgainst + theirPoints,
          matches: existing.matches + 1,
        });
      };

      for (const msa of side1.athletes) {
        updateAthlete(msa.athlete.name, side1.points, side2.points, side1Won);
      }
      for (const msa of side2.athletes) {
        updateAthlete(msa.athlete.name, side2.points, side1.points, side2Won);
      }
    }

    // Ordina per vittorie desc, poi differenza punti desc
    const sorted = Array.from(athleteMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const diffA = a.pointsFor - a.pointsAgainst;
      const diffB = b.pointsFor - b.pointsAgainst;
      return diffB - diffA;
    });

    results.push({
      discipline: disc.name,
      athletes: sorted,
    });
  }

  return results;
}

// ─── LEGGI DALL'EXCEL ─────────────────────────────────────────────────────────

function fetchExcelResults(filePath: string): Map<string, ExcelRow[]> {
  console.log(`\n📊 Lettura file Excel: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File Excel non trovato: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetResults: Map<string, ExcelRow[]> = new Map();

  console.log(`   Fogli trovati: ${workbook.SheetNames.join(", ")}`);

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ExcelRow>(ws, {
      defval: "",
      raw: false,
    });
    sheetResults.set(sheetName, data);
  }

  return sheetResults;
}

// ─── CONFRONTO E REPORT ───────────────────────────────────────────────────────

function printSeparator(char = "─", len = 70) {
  console.log(char.repeat(len));
}

function printDBResults(results: DisciplineResults[]) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║              RISULTATI DAL DATABASE (Fase 1)                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  for (const disc of results) {
    console.log(`\n🏅 ${disc.discipline.toUpperCase()}`);
    printSeparator();
    console.log(
      `${"Pos".padEnd(4)}${"Atleta".padEnd(20)}${"V".padEnd(5)}${"S".padEnd(5)}${"PF".padEnd(8)}${"PS".padEnd(8)}${"Diff".padEnd(8)}${"Partite"}`
    );
    printSeparator();

    disc.athletes.forEach((a, i) => {
      const diff = a.pointsFor - a.pointsAgainst;
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
      console.log(
        `${String(i + 1).padEnd(4)}${a.name.padEnd(20)}${String(a.wins).padEnd(5)}${String(a.losses).padEnd(5)}${String(a.pointsFor).padEnd(8)}${String(a.pointsAgainst).padEnd(8)}${diffStr.padEnd(8)}${a.matches}`
      );
    });
  }
}

function printExcelResults(sheetData: Map<string, ExcelRow[]>) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║              DATI EXCEL (tutti i fogli)                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  for (const [sheet, rows] of sheetData.entries()) {
    console.log(`\n📋 Foglio: "${sheet}" (${rows.length} righe)`);
    if (rows.length === 0) {
      console.log("   [vuoto]");
      continue;
    }

    // Stampa intestazioni
    const headers = Object.keys(rows[0]);
    console.log("   Colonne:", headers.join(" | "));
    printSeparator("·");

    // Stampa max 30 righe per foglio
    const preview = rows.slice(0, 30);
    for (const row of preview) {
      const line = headers.map((h) => String(row[h] ?? "").padEnd(15)).join(" ");
      console.log("  ", line.trim());
    }
    if (rows.length > 30) {
      console.log(`   ... e altre ${rows.length - 30} righe`);
    }
  }
}

function compareResults(
  dbResults: DisciplineResults[],
  sheetData: Map<string, ExcelRow[]>
) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║              ANALISI INCONGRUENZE                            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // Prova a trovare fogli che corrispondono alle discipline
  const disciplineKeywords: Record<string, string[]> = {
    CALCIO_BALILLA: ["calcio", "balilla", "biliardino", "foosball"],
    FRECCETTE: ["freccette", "darts", "dart"],
    PING_PONG: ["ping", "pong", "tennis", "tavolo"],
    AIR_HOCKEY: ["hockey", "air"],
  };

  let incongruenzeFound = 0;

  for (const dbDisc of dbResults) {
    // Trova il foglio Excel corrispondente (ricerca fuzzy)
    let matchedSheet: string | null = null;
    let matchedRows: ExcelRow[] = [];

    for (const [sheetName, rows] of sheetData.entries()) {
      const lower = sheetName.toLowerCase();
      const discUpper = dbDisc.discipline.toLowerCase();
      if (lower.includes(discUpper.substring(0, 4)) || discUpper.includes(lower.substring(0, 4))) {
        matchedSheet = sheetName;
        matchedRows = rows;
        break;
      }
      // Prova keyword
      for (const [, keywords] of Object.entries(disciplineKeywords)) {
        if (keywords.some((k) => lower.includes(k))) {
          matchedSheet = sheetName;
          matchedRows = rows;
          break;
        }
      }
      if (matchedSheet) break;
    }

    console.log(`\n🔍 ${dbDisc.discipline}`);

    if (!matchedSheet) {
      console.log(`   ⚠️  Nessun foglio Excel trovato per questa disciplina.`);
      console.log(`   Fogli disponibili: ${Array.from(sheetData.keys()).join(", ")}`);
      continue;
    }

    console.log(`   ✅ Foglio Excel abbinato: "${matchedSheet}"`);

    // Prova a trovare le vittorie nell'Excel (colonne comuni: V, Vittorie, W, Wins)
    const victoryColumns = ["v", "vittorie", "wins", "w", "vinte", "won"];
    const nameColumns = ["atleta", "nome", "giocatore", "player", "name", "squadra"];

    const firstRow = matchedRows[0];
    if (!firstRow) continue;

    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());
    const nameCol = Object.keys(firstRow).find((h) =>
      nameColumns.some((n) => h.toLowerCase().includes(n))
    );
    const winCol = Object.keys(firstRow).find((h) =>
      victoryColumns.some((v) => h.toLowerCase() === v || h.toLowerCase().includes("vitt"))
    );

    if (!nameCol || !winCol) {
      console.log(`   ℹ️  Colonne Excel non riconosciute automaticamente.`);
      console.log(`   Colonne trovate: ${Object.keys(firstRow).join(", ")}`);
      console.log(`   Dati DB (solo classifica per posizione):`);
      dbDisc.athletes.forEach((a, i) => {
        console.log(`     ${i + 1}° ${a.name} — V:${a.wins} S:${a.losses}`);
      });
      continue;
    }

    // Confronta atleta per atleta
    const excelMap: Map<string, number> = new Map();
    for (const row of matchedRows) {
      const name = String(row[nameCol] ?? "").trim();
      const wins = parseInt(String(row[winCol] ?? "0"), 10);
      if (name) excelMap.set(name, isNaN(wins) ? 0 : wins);
    }

    console.log(`   Confronto DB vs Excel (colonna vittorie: "${winCol}"):`);
    let discHasIssues = false;

    for (const athlete of dbDisc.athletes) {
      // Ricerca fuzzy per nome
      const excelName = Array.from(excelMap.keys()).find(
        (k) =>
          k.toLowerCase() === athlete.name.toLowerCase() ||
          athlete.name.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(athlete.name.toLowerCase())
      );

      const excelWins = excelName !== undefined ? excelMap.get(excelName) : undefined;

      if (excelWins === undefined) {
        console.log(`   ❓ "${athlete.name}" non trovato nell'Excel`);
        discHasIssues = true;
        incongruenzeFound++;
      } else if (excelWins !== athlete.wins) {
        console.log(
          `   ❌ INCONGRUENZA — ${athlete.name}: DB=${athlete.wins}V | Excel="${excelName}"=${excelWins}V`
        );
        discHasIssues = true;
        incongruenzeFound++;
      } else {
        console.log(`   ✅ ${athlete.name}: ${athlete.wins}V (DB = Excel)`);
      }
    }

    // Verifica se ci sono atleti nell'Excel ma non nel DB
    for (const [excelName] of excelMap.entries()) {
      const foundInDB = dbDisc.athletes.some(
        (a) =>
          a.name.toLowerCase() === excelName.toLowerCase() ||
          excelName.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(excelName.toLowerCase())
      );
      if (!foundInDB) {
        console.log(`   ⚠️  "${excelName}" è nell'Excel ma non nel DB per questa disciplina`);
        discHasIssues = true;
        incongruenzeFound++;
      }
    }

    if (!discHasIssues) {
      console.log(`   🎉 Nessuna incongruenza trovata per questa disciplina.`);
    }
  }

  printSeparator("═");
  if (incongruenzeFound === 0) {
    console.log(`\n✅ TUTTO OK — Nessuna incongruenza trovata tra DB ed Excel!`);
  } else {
    console.log(`\n⚠️  TOTALE INCONGRUENZE TROVATE: ${incongruenzeFound}`);
    console.log(`   Rivedi i dettagli sopra per ogni disciplina.`);
  }
  printSeparator("═");
}

// ─── STATISTICHE GENERALI DAL DB ─────────────────────────────────────────────

async function fetchDBStats() {
  const totalMatches = await prisma.match.count({ where: { phase: "QUALIFICAZIONE" } });
  const finalMatches = await prisma.match.count({ where: { phase: "FINALI" } });
  const athletes = await prisma.athlete.findMany({ orderBy: { name: "asc" } });

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║              STATISTICHE GENERALI DB                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`   Atleti registrati: ${athletes.length}`);
  console.log(`   Partite fase qualificazione: ${totalMatches}`);
  console.log(`   Partite finali: ${finalMatches}`);
  console.log(`\n   Atleti:`);
  athletes.forEach((a) =>
    console.log(
      `   - ${a.name.padEnd(20)} Tier: ${a.tier.padEnd(6)} Cat: ${a.categoryScore}`
    )
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const excelPath = path.join(
    "c:/Users/info/Documents/Noli/nolimpiadi2026",
    "Punteggi e classifiche dei gironi di qualificazione (7° edizione).xlsx"
  );

  try {
    await fetchDBStats();

    const dbResults = await fetchDBResults();
    printDBResults(dbResults);

    const sheetData = fetchExcelResults(excelPath);
    printExcelResults(sheetData);

    compareResults(dbResults, sheetData);
  } catch (err) {
    console.error("❌ Errore:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
