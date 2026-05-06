import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runSimulation() {
  console.log("🚀 Avvio simulazione Nolimpiadi Fase 2...");

  // Reset tournament phase 2 first to ensure a clean state
  await fetch("http://localhost:3000/api/admin/reset-tournament", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  console.log("✅ Torneo Fase 2 resettato.");

  let iter = 0;
  while (true) {
    iter++;
    if (iter > 50) {
      console.log("⚠️ Troppe iterazioni, possibile loop infinito. Interruzione.");
      break;
    }

    // 1. Get current state from database
    const matches = await prisma.match.findMany({
      where: { phase: 'FINALI' },
      include: { sides: { include: { athletes: true } } }
    });

    const disciplines = await prisma.discipline.findMany();
    
    // Get phase 1 rankings
    const phase1Rankings: any[] = await prisma.$queryRaw`
      SELECT c.discipline_id, c.athlete_id, a.name 
      FROM classifica_qualificazione_disciplina c
      JOIN athletes a ON a.id = c.athlete_id
      ORDER BY c.discipline_id, c.qualification_weighted DESC
    `;

    // Figure out busy athletes
    const busyAthleteIds = new Set<string>();
    matches.filter(m => m.sides && m.sides.length > 0 && m.sides[0].points === -1).forEach(m => {
      m.sides.forEach(s => s.athletes.forEach(a => busyAthleteIds.add(a.athleteId)));
    });

    // 2. Logic to find playable matches (replica of getPlayableMatches)
    const playable: any[] = [];
    
    for (const disc of disciplines) {
      const discMatches = matches.filter(m => m.disciplineId === disc.id);
      const rankings = phase1Rankings
        .filter(r => r.discipline_id === disc.id)
        .map(r => ({ id: r.athlete_id, name: r.name }));

      if (disc.kind === "CALCIO_BALILLA") {
        const top5 = rankings.slice(0, 5);
        if (top5.length < 5) continue;
        const c1=top5[0], c2=top5[1], c3=top5[2], c4=top5[3], c5=top5[4];
        const schedule = [
          { id: 1, title: "Girone", stage: "GIRONE", s1: [c1, c2], s2: [c3, c4] },
          { id: 2, title: "Girone", stage: "GIRONE", s1: [c1, c3], s2: [c2, c5] },
          { id: 3, title: "Girone", stage: "GIRONE", s1: [c1, c5], s2: [c2, c4] },
          { id: 4, title: "Girone", stage: "GIRONE", s1: [c1, c4], s2: [c3, c5] },
          { id: 5, title: "Girone", stage: "GIRONE", s1: [c2, c3], s2: [c4, c5] },
        ];
        schedule.forEach(m => {
          const hasExact = (s:any, ids:string[]) => s?.athletes?.map((a:any)=>a.athleteId).sort().join(",") === ids.sort().join(",");
          const saved = discMatches.find(dm => {
            return (hasExact(dm.sides[0], m.s1.map(x=>x.id)) && hasExact(dm.sides[1], m.s2.map(x=>x.id))) || 
                   (hasExact(dm.sides[0], m.s2.map(x=>x.id)) && hasExact(dm.sides[1], m.s1.map(x=>x.id)));
          });
          if (!saved) {
            const isBusy = m.s1.some(a => busyAthleteIds.has(a.id)) || m.s2.some(a => busyAthleteIds.has(a.id));
            if (!isBusy) {
              playable.push({ 
                disciplineId: disc.id,
                disciplineName: disc.kind,
                finalStage: m.stage,
                s1: m.s1.map(a => a.id),
                s2: m.s2.map(a => a.id)
              });
            }
          }
        });
      } else {
        const quarti = discMatches.filter(m => m.finalStage === "QUARTI");
        const semi = discMatches.filter(m => m.finalStage === "SEMIFINALI");
        const finali = discMatches.filter(m => m.finalStage === "FINALE");

        const getAthleteId = (side: any) => side?.athletes?.[0]?.athleteId;
        const hasAthlete = (match: any, athleteId: string) => match && (getAthleteId(match.sides[0]) === athleteId || getAthleteId(match.sides[1]) === athleteId);
        
        const getWinner = (match: any) => {
          if (!match) return null;
          const s1 = match.sides.find((s:any)=>s.side===1);
          const s2 = match.sides.find((s:any)=>s.side===2);
          if(!s1||!s2) return null;
          if(s1.points > s2.points) return getAthleteId(s1);
          if(s2.points > s1.points) return getAthleteId(s2);
          return null;
        };

        const getLoser = (match: any) => {
          if (!match) return null;
          const s1 = match.sides.find((s:any)=>s.side===1);
          const s2 = match.sides.find((s:any)=>s.side===2);
          if(!s1||!s2) return null;
          if(s1.points < s2.points) return getAthleteId(s1);
          if(s2.points < s1.points) return getAthleteId(s2);
          return null;
        };

        let q1 = quarti.find(m => hasAthlete(m, rankings[2]?.id) || hasAthlete(m, rankings[5]?.id));
        let q2 = quarti.find(m => m.id !== q1?.id && (hasAthlete(m, rankings[3]?.id) || hasAthlete(m, rankings[4]?.id)));
        if (!q1) q1 = quarti.find((m:any) => m.id !== q2?.id);
        if (!q2) q2 = quarti.find((m:any) => m.id !== q1?.id);

        let s1 = semi.find(m => hasAthlete(m, rankings[0]?.id));
        let s2 = semi.find(m => m.id !== s1?.id && hasAthlete(m, rankings[1]?.id));
        if (!s1) s1 = semi.find((m:any) => m.id !== s2?.id);
        if (!s2) s2 = semi.find((m:any) => m.id !== s1?.id);

        let f1 = finali.find(m => hasAthlete(m, getWinner(s1)));
        let f3 = finali.find(m => m.id !== f1?.id);
        if (!f1) f1 = finali.find((m:any) => m.id !== f3?.id);
        if (!f3) f3 = finali.find((m:any) => m.id !== f1?.id);

        const checkPlayable = (match: any, a1: any, a2: any, stage: string) => {
          if (!a1 || !a2) return;
          if (match) return; // Già in corso o salvato
          if (!busyAthleteIds.has(a1.id) && !busyAthleteIds.has(a2.id)) {
            playable.push({ 
              disciplineId: disc.id,
              disciplineName: disc.kind,
              finalStage: stage,
              s1: [a1.id],
              s2: [a2.id]
            });
          }
        };

        if (rankings.length >= 6) checkPlayable(q1, rankings[2], rankings[5], "QUARTI");
        if (rankings.length >= 5) checkPlayable(q2, rankings[3], rankings[4], "QUARTI");
        
        const wQ1 = getWinner(q1);
        const wQ2 = getWinner(q2);
        
        const aS1_2 = rankings.length >= 5 ? rankings.find((a:any)=>a.id===wQ2) : rankings[3];
        const aS2_2 = rankings.length >= 6 ? rankings.find((a:any)=>a.id===wQ1) : rankings[2];

        checkPlayable(s1, rankings[0], aS1_2, "SEMIFINALI");
        checkPlayable(s2, rankings[1], aS2_2, "SEMIFINALI");

        const wS1 = getWinner(s1);
        const wS2 = getWinner(s2);
        const lS1 = getLoser(s1);
        const lS2 = getLoser(s2);
        
        checkPlayable(f1, rankings.find((a:any)=>a.id===wS1), rankings.find((a:any)=>a.id===wS2), "FINALE");
        checkPlayable(f3, rankings.find((a:any)=>a.id===lS1), rankings.find((a:any)=>a.id===lS2), "FINALE");
      }
    }

    if (playable.length === 0) {
      console.log("🏁 Nessuna partita giocabile rimasta. Torneo completato!");
      break;
    }

    // 3. Play one match
    const nextMatch = playable[0]; // Pick the first available
    console.log(`\n▶️ Mando in campo: ${nextMatch.disciplineName} - ${nextMatch.finalStage}`);

    const setResponse = await fetch("http://localhost:3000/api/admin/set-active-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disciplineId: nextMatch.disciplineId,
        finalStage: nextMatch.finalStage,
        athletesSide1: nextMatch.s1,
        athletesSide2: nextMatch.s2
      })
    });

    if (!setResponse.ok) {
      const errorText = await setResponse.text();
      console.error(`❌ Errore in set-active-match: ${setResponse.status} ${errorText}`);
      break;
    }
    const matchData = await setResponse.json();

    // Random score
    const p1 = Math.floor(Math.random() * 10) + 1;
    let p2 = Math.floor(Math.random() * 10) + 1;
    if (p1 === p2) p2 += 1; // Avoid draws for simplicity

    console.log(`💾 Salvo risultato: ${p1} a ${p2} (ID: ${matchData.match.id})`);
    const saveResponse = await fetch("http://localhost:3000/api/admin/save-single-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: matchData.match.id,
        points1: p1,
        points2: p2,
        durationSeconds: 120
      })
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error(`❌ Errore in save-single-match: ${saveResponse.status} ${errorText}`);
      break;
    }
  }
}

runSimulation()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
