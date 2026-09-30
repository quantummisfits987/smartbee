# SmartBee – Smart Beekeeping & Honey Traceability System

SmartBee is an MVP full-stack beekeeping and honey traceability platform. It empowers beekeepers to monitor colony microclimates using simulated IoT sensor telemetry, integrate ambient weather data from Open-Meteo, assess colony stress patterns using a local Ollama LLM, and seal honey harvests in an immutable SHA-256 cryptographic ledger with consumer QR code verification.

---

## 1. Project Overview
Beekeepers face colony losses due to pests (such as *Varroa destructor* mites), erratic climate swings, and counterfeit honey infiltration in consumer markets. SmartBee solves these challenges with:
- **Telemetry Ingestion & Simulation**: Real-time tracking of core brood chamber temperature, relative humidity, hive weight, and bee flight activity.
- **Ambient Weather Grounding**: Direct Open-Meteo microclimate integration.
- **Local AI Symptom Advisory**: Privacy-first, local Ollama LLM (`llama3`) providing symptom-based health risk advisories (without cloud API reliance or fake mock fallbacks).
- **Cryptographic Traceability Ledger**: Blockchain-style SHA-256 hash chains linking each honey harvest to its origin hive, ensuring zero data tampering.
- **Consumer Verification**: Mobile-optimized QR codes for public verification of honey authenticity.

---

## 2. Technology Stack

### Frontend
- **React.js 19** with **Vite**
- **Tailwind CSS** (amber/gold honey-inspired palette)
- **Axios** for REST API communication
- **React Router DOM** for multi-page routing
- **Recharts** for temperature & humidity telemetry visualization
- **qrcode** for client-side QR generation

### Backend
- **Node.js** & **Express.js** (ES Modules)
- **PostgreSQL** relational database with `pg` Pool client
- **Crypto** built-in module for SHA-256 hash generation and verification
- **Axios** for external API integration
- **CORS** & **dotenv**

### AI
- **Ollama Local LLM API** (`http://localhost:11434`)
- Designed for `llama3` or `mistral`
- Symptom-based risk advisory (NOT image-based disease diagnosis)

### External Services
- **Open-Meteo API** (free, no API key required)

---

## 3. Folder Structure
```
smartbee/
├── backend/
│   ├── database/
│   │   ├── schema.sql         # PostgreSQL schema definition
│   │   └── seed.sql           # Demo seed data (hives, sensors, batches)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── aiController.js
│   │   │   ├── batchController.js
│   │   │   ├── hiveController.js
│   │   │   ├── sensorController.js
│   │   │   └── weatherController.js
│   │   ├── db/
│   │   │   └── index.js       # PostgreSQL pool with graceful demo fallback
│   │   ├── routes/
│   │   │   └── api.js         # REST API route declarations
│   │   ├── services/
│   │   │   ├── hashService.js    # SHA-256 hash chaining & verification
│   │   │   ├── ollamaService.js  # Local Ollama AI client
│   │   │   └── weatherService.js # Open-Meteo client
│   │   ├── app.js             # Express app instance
│   │   └── server.js          # Standalone backend server entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SimulateIoTBanner.tsx
│   │   │   └── WeatherCard.tsx
│   │   ├── pages/
│   │   │   ├── AiHealthAnalysis.tsx
│   │   │   ├── BatchDetails.tsx
│   │   │   ├── ConsumerVerification.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── HiveDetails.tsx
│   │   │   └── HoneyBatches.tsx
│   │   ├── services/
│   │   │   └── api.ts         # Axios REST client
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── server.ts                  # Unified dev & production server (port 3000)
├── metadata.json
├── package.json
└── README.md
```

---

## 4. PostgreSQL Setup

1. Start your local PostgreSQL server:
   ```bash
   # On macOS (Homebrew):
   brew services start postgresql
   
   # On Linux:
   sudo systemctl start postgresql
   
   # Or using Docker:
   docker run --name smartbee-postgres -e POSTGRES_DB=smart_beekeeping -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
   ```

2. Create the database:
   ```bash
   createdb smart_beekeeping
   ```

3. Run the schema and seed scripts:
   ```bash
   psql -d smart_beekeeping -f backend/database/schema.sql
   psql -d smart_beekeeping -f backend/database/seed.sql
   ```

---

## 5. Environment Variables

### Backend (`backend/.env` or root `.env`)
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_beekeeping
DB_USER=postgres
DB_PASSWORD=your_postgres_password
OLLAMA_URL=http://localhost:11434
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Backend Setup

```bash
cd backend
npm install
npm run start
```
The backend starts on `http://localhost:5000` and REST endpoints will be active at `http://localhost:5000/api`.

---

## 7. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend starts on Vite dev server (e.g., `http://localhost:5173` or `http://localhost:3000`).

---

## 8. Ollama Setup

1. Install Ollama from [ollama.ai](https://ollama.ai).
2. Pull and start the recommended model:
   ```bash
   ollama pull llama3
   ollama run llama3
   ```
3. Ollama runs on `http://localhost:11434`. SmartBee connects to `POST /api/generate` on this local port.
4. If Ollama is offline or unavailable, the SmartBee UI and API will display:
   > *"Ollama is not available. Please start the local Ollama service."*
   *(Per design constraints, no fake AI responses are generated).*

---

## 9. How to Run the Project

### Option A: Unified Full-Stack Mode (Recommended)
From the project root:
```bash
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

### Option B: Separate Backend & Frontend
Terminal 1 (Backend):
```bash
cd backend && npm start
```
Terminal 2 (Frontend):
```bash
cd frontend && npm run dev
```

---

## 10. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/system-status` | Database and Ollama connection status |
| `GET` | `/api/hives` | Retrieve all hives with latest telemetry |
| `POST` | `/api/hives` | Register a new hive unit |
| `GET` | `/api/hives/:id` | Get single hive details and history |
| `GET` | `/api/sensors/recent` | Recent telemetry across all hives |
| `GET` | `/api/sensors/:hiveId` | Telemetry logs for a specific hive |
| `POST` | `/api/sensors` | Ingest real or simulated sensor telemetry |
| `GET` | `/api/weather` | Current weather from Open-Meteo |
| `GET` | `/api/ai/status` | Ollama LLM availability check |
| `POST` | `/api/ai/health-analysis`| Submit symptoms for Ollama risk evaluation |
| `GET` | `/api/batches` | List all honey batches in ledger |
| `POST` | `/api/batches` | Create and seal new batch in SHA-256 ledger |
| `GET` | `/api/batches/:batchCode`| Get batch details and QR code |
| `GET` | `/api/verify/:batchCode` | Public consumer cryptographic verification |

---

## 11. Demo Flow

1. **Dashboard Overview**: Check aggregate hive count, active colonies, honey mass, and live weather conditions from Open-Meteo.
2. **Simulate IoT Telemetry**: Click the **"Simulate New Reading"** button on the prominent banner to record realistic temperature, humidity, and weight readings into PostgreSQL.
3. **Inspect Hive**: Navigate to **Hives**, view colony cards, click **"Inspect Details"** on `HIVE-001` to examine the Recharts telemetry trends.
4. **AI Health Advisory**: Navigate to **AI Health**, select a hive, input symptom levels (e.g. High Varroa mites, irregular brood), and click **"Analyze Hive Health"**. Observe structured risk levels and recommendations from Ollama.
5. **Honey Batch Creation**: Navigate to **Honey Batches**, click **"Record New Honey Batch"**, input batch code and weight. The backend links the previous batch hash and computes the new SHA-256 seal.
6. **Consumer Verification**: Click the QR icon on any batch or visit `/verify/BATCH-2026-001` to see the public consumer verification screen with `"✓ Honey Batch Verified"`.

---

## 12. Limitations & Future Scope

### Current Prototype Scope
- Simulated IoT telemetry rather than physical microcontroller boards.
- Cryptographic hash-linked ledger instead of decentralized consensus blockchain.
- Symptom-based risk evaluation instead of deep image-based disease models.

### Future Scope
- **Hardware Ingestion**: MQTT broker integration for physical ESP32 temperature/humidity probes and load cells.
- **Multilingual Consumer UI**: Localization of consumer QR verification pages for global honey markets.
- **Spectral Honey Analysis**: Integration of refractometer and pollen analysis data for botanical origin certification.
