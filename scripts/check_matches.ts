import { prisma } from "../src/lib/prisma";

async function checkFinals() {
  const finalMatches = await prisma.match.findMany({
    where: { phase: "FINALI" },
    include: {
      discipline: true,
      sides: {
        include: {
          athletes: {
            include: { athlete: true }
          }
        }
      }
    }
  });

  console.log("Found", finalMatches.length, "final matches");
  if (finalMatches.length > 0) {
    console.log("First match stage:", finalMatches[0].finalStage);
    console.log("Discipline:", finalMatches[0].discipline.kind);
  } else {
    const allMatches = await prisma.match.groupBy({
      by: ['phase'],
      _count: { _all: true }
    });
    console.log("Match distribution:", allMatches);
  }
}

checkFinals();
