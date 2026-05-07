import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("🚀 Avvio simulazione Nolimpiadi Fase 2...");

    let results = [];
    let iter = 0;

    await prisma.matchSideAthlete.deleteMany({
      where: { side: { match: { phase: 'FINALI' } } }
    });
    await prisma.matchSide.deleteMany({
      where: { match: { phase: 'FINALI' } }
    });
    await prisma.match.deleteMany({
      where: { phase: 'FINALI' }
    });
    results.push("✅ Torneo Fase 2 resettato.");

    while(true) {
      iter++;
      if (iter > 150) {
        results.push("⚠️ Troppe iterazioni, possibile loop infinito. Interruzione.");
        break;
      }

      const matches = await prisma.match.findMany({
        where: { phase: 'FINALI' },
        include: { sides: { include: { athletes: true } } }
      });

      const disciplines = await prisma.discipline.findMany();
      
      const phase1Rankings: any[] = await prisma.$queryRaw`
        SELECT c.discipline_id, c.athlete_id, a.name 
        FROM classifica_qualificazione_disciplina c
        JOIN athletes a ON a.id = c.athlete_id
        ORDER BY c.discipline_id, c.qualification_weighted DESC
      `;

      const busyAthleteIds = new Set<string>();
      matches.filter(m => m.sides && m.sides.length > 0 && m.sides[0].points === -1).forEach(m => {
        m.sides.forEach((s: any) => s.athletes.forEach((a: any) => busyAthleteIds.add(a.athleteId)));
      });

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
            { id: 1, title: "Girone", stage: "FINALE", s1: [c1, c2], s2: [c3, c4] },
            { id: 2, title: "Girone", stage: "FINALE", s1: [c1, c3], s2: [c2, c5] },
            { id: 3, title: "Girone", stage: "FINALE", s1: [c1, c5], s2: [c2, c4] },
            { id: 4, title: "Girone", stage: "FINALE", s1: [c1, c4], s2: [c3, c5] },
            { id: 5, title: "Girone", stage: "FINALE", s1: [c2, c3], s2: [c4, c5] },
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
          const f12 = discMatches.filter(m => m.finalStage === ("FINALE" as any));
          const f34 = discMatches.filter(m => m.finalStage === ("FINALE_34" as any));
          const f56 = discMatches.filter(m => m.finalStage === ("FINALE_56" as any));

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

          let f1 = f12.find(m => hasAthlete(m, getWinner(s1)));
          let f3 = f34.find(m => hasAthlete(m, getLoser(s1)));
          let f5 = f56.find(m => hasAthlete(m, getLoser(q1)));

          if (!f1) f1 = f12[0];
          if (!f3) f3 = f34[0];
          if (!f5) f5 = f56[0];

          const checkPlayable = (match: any, a1: any, a2: any, stage: string) => {
            if (!a1 || !a2) return;
            if (match) return;
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
          const lQ1 = getLoser(q1);
          const lQ2 = getLoser(q2);
          
          checkPlayable(f1, rankings.find((a:any)=>a.id===wS1), rankings.find((a:any)=>a.id===wS2), "FINALE");
          checkPlayable(f3, rankings.find((a:any)=>a.id===lS1), rankings.find((a:any)=>a.id===lS2), "FINALE_34");
          checkPlayable(f5, rankings.find((a:any)=>a.id===lQ1), rankings.find((a:any)=>a.id===lQ2), "FINALE_56");
        }
      }

      if (playable.length === 0) {
        results.push("🏁 Nessuna partita giocabile rimasta. Torneo completato!");
        break;
      }

      const nextMatch = playable[0];
      results.push(`▶️ Mando in campo: ${nextMatch.disciplineName} - ${nextMatch.finalStage}`);

      // Directly create the match via Prisma to get error details
      try {
        const setMatch = await prisma.match.create({
          data: {
            disciplineId: nextMatch.disciplineId,
            phase: 'FINALI',
            targetVictory: 0,
            finalStage: nextMatch.finalStage,
            sides: {
              create: [
                {
                  side: 1,
                  points: -1,
                  athletes: {
                    create: nextMatch.s1.map((id: string) => ({ athleteId: id }))
                  }
                },
                {
                  side: 2,
                  points: -1,
                  athletes: {
                    create: nextMatch.s2.map((id: string) => ({ athleteId: id }))
                  }
                }
              ]
            }
          }
        });
        var matchData = { match: setMatch };
      } catch (err: any) {
        results.push(`❌ Prisma Create Error: ${err.message}`);
        break;
      }

      // Random score
      const p1 = Math.floor(Math.random() * 10) + 1;
      let p2 = Math.floor(Math.random() * 10) + 1;
      if (p1 === p2) p2 += 1;

      results.push(`💾 Salvo risultato: ${p1} a ${p2} (ID: ${matchData.match.id})`);
      
      const saveResponse = await fetch("http://localhost:3000/api/admin/finali/save-single-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId: nextMatch.disciplineId,
          stage: nextMatch.finalStage, 
          side1AthleteIds: nextMatch.s1,
          side2AthleteIds: nextMatch.s2,
          points1: p1,
          points2: p2
        })
      });

      if (!saveResponse.ok) {
        results.push(`❌ Errore in save-single-match: ${saveResponse.status}`);
        break;
      }
    }

    return NextResponse.json({ success: true, log: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
