# NOLImpiadi Manager

Gestione competizioni sportive con 12 atleti e 4 discipline in parallelo.

## Caratteristiche

- **12 atleti** con categorie (100/75/50/25)
- **4 discipline**: Calcio-balilla, Freccette, Ping-pong, Air Hockey
- **Qualificazioni**: turni con 4 match paralleli, 2 atleti a riposo
- **Finali**: tabelloni per disciplina (quarti/semifinali/finale)
- **Classifica generale**: aggiornata in tempo reale

## Pagine

| Pagina | URL | Descrizione |
|--------|-----|-------------|
| Home | `/` | Pagina principale con link |
| Gare | `/gare` | Programma e risultati live |
| Classifica | `/classifica` | Classifica generale live |
| Stampa | `/stampa` | Versione stampabile tabelloni |
| Finali | `/anteprima.html` | Tabelloni finali |
| Giudici | `/giudici.html` | Dashboard inserimento risultati |
| Setup | `/setup.html` | Configurazione |
| Strumenti Admin | `/admin-tools.html` | Bootstrap e reset |

## Parametri Discipline

| Disciplina | Target | Peso | Team Size | Note |
|------------|--------|------|----------|------|
| Calcio-balilla | 4 (configurabile) | 21 | 2 | Target configurable |
| Freccette | 220 | 1 | 1 | |
| Ping-pong | 11 | 15 | 1 | |
| Air Hockey | 4 | 21 | 1 | |

## Punteggio

### Efficienza match
```
eff = (Fatti - (Subiti / P)) / Target
```
- Fatti = punti segnati
- Subiti = punti subiti
- Target = target vittoria disciplina
- P = divisore malus (default: 1000)

### Punteggio pesato
```
weighted = eff * coefficiente_disciplina
```

## Flusso Operativo

### 1. Reset Completo (in un click)
Vai su `/admin-tools.html` e clicca **Reset Completo**:
- Cancella tutti i match, slot e turni
- Esegue bootstrap (discipline + atleti)
- Genera calendario (24 turni)

### 2. Bootstrap Separato
Vai su `/admin-tools.html`:
- **Esegui Bootstrap**: crea/aggiorna discipline e atleti
- **Genera Calendario**: crea turni qualificazione
- **Carica Serie**: carica il turno corrente

### 3. Inserimento Risultati
Vai su `/giudici.html`:
- Inserisci i punteggi per ogni disciplina
- Clicca "Inserisci" per salvare
- Quando tutti e 4 i match sono inseriti, il pulsante **Prossimo Turno** si abilita
- Clicca "Prossimo Turno" per andare avanti

### 4. Configurazione
Vai su `/setup.html`:
- Modifica categorie atleti
- Modifica target delle discipline (es. calcio-balilla da 4 a 5)

## API Setup

```bash
# Carica dati per setup
GET /api/admin/setup

# Aggiorna atleta
PATCH /api/admin/athletes
Body: { athleteId, name, categoryScore }

# Aggiorna target disciplina
PATCH /api/admin/discipline
Body: { disciplineKind, targetFixed }
```

## API Principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/gare` | Gare in corso |
| GET | `/api/classifica` | Classifica generale |
| GET | `/api/turni/suggest` | Turno successivo |
| POST | `/api/matches` | Salva match |
| POST | `/api/admin/bootstrap` | Bootstrap dati |
| POST | `/api/turni/plan` | Genera calendario |

## Struttura File

```
src/
├── app/
│   ├── page.tsx              # Home
│   ├── gare/                 # Gare (programma)
│   ├── classifica/            # Classifica live
│   ├── stampa/              # Stampa tabelloni
│   ├── anteprima/           # Finali (Next)
│   └── api/
│       ├── admin/
│       │   ├── athletes/    # PATCH athlete
│       │   ├── bootstrap/ # POST bootstrap
│       │   ├── discipline/# PATCH disciplina
│       │   └── setup/     # GET dati setup
│       ├── gare/            # GET gare
│       ├── matches/         # POST match
│       ├── classifica/      # GET classifica
│       └── turni/         # Plan/suggest
└── lib/
    └── nolimpiadi.ts       # Costanti e seed
public/
├── setup.html             # Setup (HTML)
├── admin-tools.html      # Strumenti admin (HTML)
├── giudici.html       # Giudici (HTML)
├── anteprima.html     # Finali (HTML)
└── reset.html         # Reset (HTML)
```

## Database

Schema Prisma in `prisma/schema.prisma`:

- **Athlete**: id, name, tier, categoryScore
- **Discipline**: id, kind, name, coefficient, teamSize, targetFixed
- **QualificationTurn**: id, index, scheduledAt
- **QualificationSlot**: turnId, kind, targetVictory, side1AthleteIds, side2AthleteIds
- **Match**: id, disciplineId, phase, targetVictory
- **MatchSide**: matchId, side, points
- **MatchSideAthlete**: sideId, athleteId

## Note

- Il target Calcio-balilla è **4** (configurabile da `/setup.html`)
- La validazione calcio-balilla usa il target del database (non hardcoded)
- Air Hockey ha sostituito Basket come disciplina
- Le pagine admin e giudici sono in HTML (`.html`) per maggiore affidabilità
- La dashboard giudici ha pulsante "Prossimo Turno" che si abilita dopo 4 match inseriti