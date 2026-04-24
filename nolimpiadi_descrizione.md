# NOLImpiadi Manager V2 — Descrizione tecnica e operativa

Questa applicazione gestisce le **NOLImpiadi** (12 atleti, 4 discipline) con un'interfaccia moderna in stile Apple, ottimizzata per tablet e desktop.

## 🪐 Visione Generale

L'ecosistema è progettato per gestire un torneo dinamico suddiviso in due fasi principali:
1.  **Fase 1 (Qualificazioni)**: 24 turni pianificati (serie) con 4 match in parallelo e 2 atleti a riposo per turno.
2.  **Fase 2 (Finali)**: Tabelloni ad eliminazione diretta con target crescenti per le discipline singole e girone all'italiana per il Calcio Balilla.

## 🎨 Standard Estetici & UI
*   **Design Apple-style**: Utilizzo di glassmorphism (`backdrop-blur`), ombreggiature stratificate e bordi arrotondati generosi (24px).
*   **Micro-interazioni**: Animazioni fluide tramite `Framer Motion` (effetti spring) e feedback visivi ad ogni interazione.
*   **Dynamic Backgrounds**: La Dashboard Giudici utilizza immagini dinamiche sfocate in background basate sulla disciplina attiva per un'esperienza premium.

## 🛠️ Stack Tecnologico
*   **Framework**: Next.js 16 (App Router) con TypeScript.
*   **Database**: PostgreSQL gestito tramite Prisma ORM.
*   **Styling**: Tailwind CSS 4 con variabili CSS per Dark Mode dinamico.
*   **Componenti**: Radix UI / Shadcn UI personalizzati.

## 📝 Glossario & Regole Core

*   **Turno (Serie)**: Sequenza di 4 match giocati in parallelo.
*   **Target Vittoria**: Punteggio obiettivo. In Fase 1 è fisso; in Fase 2 aumenta progressivamente.
*   **Soglia 840**: Il punteggio massimo raggiungibile (senza malus) per Air Hockey e Calcio Balilla.
*   **Formula Punteggio**: `(Punti_Fatti * Coefficiente) - (Punti_Subiti / 1000)`.
*   **Qualificati**: Top 6 per discipline singole, Top 5 per Calcio Balilla.

## 🏗️ Struttura delle Pagine

### 1. Dashboard Giudici (`/giudici`)
Il centro operativo del torneo.
*   **Visualizzazione Turno**: Mostra i 4 match della serie corrente, gli atleti a riposo e il countdown.
*   **Inserimento Risultati**: Card dedicate con selezione atleti facilitata e validazione real-time.
*   **Avanzamento**: Il pulsante "Prossimo Turno" si abilita solo dopo l'inserimento di 4/4 risultati.

### 2. Classifica Live (`/classifica`)
Classifica generale 1-12 aggiornata in tempo reale tramite polling.
*   Visualizza punteggi pesati, match giocati e posizione istantanea.
*   Highlight per il "Leader della Classifica".

### 3. Gestione Finali (`/admin/finali`)
Visualizzazione dei tabelloni della Fase 2 basata sui risultati delle qualificazioni.
*   **Sport Singoli (6 Qualificati)**:
    *   **Quarti**: (4 vs 5) e (3 vs 6).
    *   **Semifinali**: $1^\circ$ vs Vincente (4 vs 5) e $2^\circ$ vs Vincente (3 vs 6).
    *   **Target variabili**: Es. Freccette passa da 100 (Quarti) a 150 (Semi) fino a 200 (Finale).
*   **Calcio Balilla (5 Qualificati)**:
    *   **Girone all'italiana**: 5 match in cui tutti giocano con/contro tutti in diverse combinazioni per determinare il podio finale.

### 4. Strumenti Amministrativi
*   **Pianificazione (`/admin/calendario`)**: Generazione automatica dei 24 turni con bilanciamento dei riposi e delle accoppiate.
*   **Database Atleti (`/admin/iscritti`)**: Gestione anagrafica e categorie (100/75/50/25).
*   **Setup (`/admin/setup`)**: Bootstrap iniziale del sistema e reset dati.

## 📊 Parametri Discipline (Edizione 2026)

| Disciplina | Coeff | Team | Target (Fase 1) | Target (Fase 2: Q / SF / F) |
| :--- | :---: | :---: | :---: | :---: |
| **Calcio Balilla** | 21 | 2vs2 | 5 | 5 / 5 / 5 |
| **Air Hockey** | 21 | 1vs1 | 40 | 40 / 60 / 80 |
| **Ping Pong** | 15 | 1vs1 | 11 | 10 / 15 / 20 |
| **Freccette** | 1 | 1vs1 | 220 | 100 / 150 / 200 |

## 🚀 Flusso Operativo
1.  **Bootstrap**: Eseguire il bootstrap da `/admin/setup`.
2.  **Pianificazione**: Generare il calendario da `/admin/calendario`.
3.  **Qualificazioni**: I giudici inseriscono i risultati turno per turno su `/giudici`.
4.  **Finali**: Una volta completati i turni, consultare `/admin/finali` per gli scontri diretti.

## 💾 Gestione Dati e Backup
Il sistema include una centrale di manutenzione dati situata in `/admin/backup`.
- **Esportazione**: Genera un file JSON completo dell'intero database (atleti, match, impostazioni).
- **Ripristino**: Permette di caricare un file JSON per sovrascrivere lo stato del torneo. L'operazione è transazionale (se l'import fallisce, i dati vecchi vengono mantenuti).

## 🔐 Sicurezza e Accessi
L'accesso all'area amministrativa e alla Centrale Giudici è protetto da autenticazione.
- **Credenziali Predefinite**: Username: `Pietro` | Password: `nolimpiadi2026`.
- **Tecnologia**: Utilizza `bcryptjs` per la cifratura delle password e cookie `HttpOnly` per la protezione delle sessioni.
- **Bootstrap**: Il processo di inizializzazione garantisce la creazione automatica dell'utente amministratore se non presente.

## 🚀 Note per il Deploy
- **Database**: Richiede PostgreSQL (consigliato Neon.tech per Vercel).
- **Variabili d'Ambiente**: Assicurarsi di configurare `DATABASE_URL` e `NODE_ENV=production`.
- **HTTPS**: Obbligatorio in produzione per il corretto funzionamento dei cookie di sessione.
