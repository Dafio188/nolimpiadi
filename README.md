# NOLImpiadi 2026 — Tournament Engine

Sistema avanzato di gestione per il torneo **NOLImpiadi 2026**, progettato per gestire competizioni multisport in parallelo con scoring engine proporzionale e dashboard in tempo reale.

## 🚀 Caratteristiche Principali

- **Multisport Parallelo**: Gestione simultanea di 4 discipline (Calcio Balilla, Freccette, Ping Pong, Air Hockey).
- **Ecosistema Multi-Agente**: Design premium ispirato all'estetica Apple (Glassmorphism, Framer Motion, micro-interazioni).
- **Scoring Engine Proporzionale**: Sistema di punteggio basato su una base fissa di **840 punti** per fase, garantendo equità tra discipline diverse.
- **Fase 1 (Qualificazioni)**: 24 turni generati algoritmicamente per garantire equità di accoppiamenti e riposi.
- **Fase 2 (Finali)**: Gestione dinamica di bracket a eliminazione diretta (Quarti, Semifinali, Finali) e girone all'italiana per il Calcio Balilla.
- **Live Scoreboard**: Dashboard pubblica sincronizzata in tempo reale per spettatori e atleti.

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Database**: PostgreSQL (Neon.tech).
- **Animazioni**: Framer Motion, Lucide React.
- **Design System**: Shadcn/UI + Antigravity Custom Premium Style.

## 📍 Mappa del Sito (Admin & Public)

| Area | Percorso | Descrizione |
|------|----------|-------------|
| **Public** | `/` | Home Page con accesso rapido. |
| **Public** | `/gare` | **Live Scoreboard** per il monitoraggio dei match in corso. |
| **Public** | `/classifica` | Classifica Generale Assoluta aggiornata live. |
| **Public** | `/finali` | TV Dashboard per i bracket della Fase Finale. |
| **Admin** | `/admin/config` | Configurazione atleti (lettere, categorie) e parametri discipline. |
| **Admin** | `/admin/giudici` | Dashboard operativa per l'inserimento rapido dei risultati. |
| **Admin** | `/admin/classifiche/fase1` | Dettaglio punteggi e ranking della fase di qualificazione. |
| **Admin** | `/admin/classifiche/fase2` | Gestione tabelloni finali e attivazione match sul campo. |
| **Admin** | `/admin/classifiche/generale` | Riepilogo finale con aggregazione automatica Fase 1 + Fase 2. |

## 📐 Scoring Engine

Il sistema utilizza una formula di normalizzazione per rendere confrontabili discipline con target diversi:

1. **Efficienza**: `eff = (Punti Fatti - (Punti Subiti / 1000)) / Target`
2. **Punteggio Ponderato**: Ogni fase (Qualifica/Finali) assegna un massimo di **840 punti** totali per disciplina, distribuiti proporzionalmente alle prestazioni nei match.
3. **Aggregazione**: La classifica finale per disciplina è data dalla somma `Punti Fase 1 + Punti Fase 2`.

## 🗄️ Database Views (SQL)

Il motore si appoggia su viste SQL ottimizzate per il calcolo dei ranking in tempo reale:
- `v_participations`: Appiattimento dei match per analisi singola prestazione.
- `classifica_qualificazione_disciplina`: Ranking normalizzato per la Fase 1.
- `classifica_finale_disciplina`: Aggregazione multiphase (SUM Fase 1 + Fase 2) per tutti i 12 atleti.
- `classifica_complessiva`: Ranking assoluto del torneo.

## ⚙️ Installazione e Sviluppo

1. **Clona il repository**:
   ```bash
   git clone https://github.com/Dafio188/nolimpiadi.git
   ```
2. **Installa le dipendenze**:
   ```bash
   npm install
   ```
3. **Configura le variabili d'ambiente**:
   Crea un file `.env` con la stringa di connessione a PostgreSQL (`DATABASE_URL`).
4. **Inizializza il Database**:
   ```bash
   npx prisma db push
   # Naviga su /api/admin/bootstrap per caricare i dati iniziali e le viste SQL
   ```
5. **Avvia il server**:
   ```bash
   npm run dev
   ```

---
*Progettato con cura per le NOLImpiadi 2026.*