DROP VIEW IF EXISTS classifica_qualificazione_disciplina;
DROP VIEW IF EXISTS classifica_complessiva;
DROP VIEW IF EXISTS v_participations;

CREATE VIEW v_participations AS
WITH settings AS (
  SELECT COALESCE((SELECT malus_divisor::numeric FROM system_settings WHERE id = 1), 1000::numeric) AS malus_divisor
)
SELECT
  msa.athlete_id,
  m.id AS match_id,
  m.discipline_id,
  m.phase,
  m.final_stage,
  m.played_at,
  ms.points AS points_for,
  ms_opp.points AS points_against,
  m.target_victory,
  d.coefficient,
  (
    (ms.points::numeric - (ms_opp.points::numeric / settings.malus_divisor))
    / NULLIF(m.target_victory::numeric, 0)
  ) AS efficiency,
  (
    (
      (ms.points::numeric - (ms_opp.points::numeric / settings.malus_divisor))
      / NULLIF(m.target_victory::numeric, 0)
    )
    * d.coefficient::numeric
  ) AS weighted
FROM match_side_athletes msa
INNER JOIN match_sides ms ON ms.id = msa.side_id
INNER JOIN matches m ON m.id = ms.match_id
INNER JOIN disciplines d ON d.id = m.discipline_id
INNER JOIN match_sides ms_opp ON ms_opp.match_id = m.id AND ms_opp.side <> ms.side
CROSS JOIN settings;

CREATE VIEW classifica_complessiva AS
SELECT
  a.id AS athlete_id,
  a.name,
  a.category_score,
  COALESCE(SUM(p.weighted), 0) AS total_weighted,
  COALESCE(SUM(CASE WHEN p.phase = 'QUALIFICAZIONE' THEN p.weighted END), 0) AS qualification_weighted,
  COALESCE(SUM(CASE WHEN p.phase = 'FINALI' THEN p.weighted END), 0) AS finals_weighted,
  COUNT(DISTINCT p.match_id) AS matches_played
FROM athletes a
LEFT JOIN v_participations p ON p.athlete_id = a.id
GROUP BY a.id, a.name, a.category_score;

CREATE VIEW classifica_qualificazione_disciplina AS
SELECT
  a.id AS athlete_id,
  d.id AS discipline_id,
  d.kind,
  d.name AS discipline_name,
  COALESCE(SUM(p.weighted), 0) AS qualification_weighted,
  COUNT(DISTINCT p.match_id) AS matches_played
FROM athletes a
CROSS JOIN disciplines d
LEFT JOIN v_participations p
  ON p.athlete_id = a.id
  AND p.discipline_id = d.id
  AND p.phase = 'QUALIFICAZIONE'
GROUP BY a.id, d.id, d.kind, d.name;
