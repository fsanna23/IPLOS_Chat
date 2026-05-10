# IPLOS Chatbot Questionnaire

## Project Overview

This project is an AI-powered chatbot designed to conduct employee questionnaires. It utilizes the Google Gemini API to conduct a dynamic conversation regarding AI adoption in the workplace and then extracts the respondent's answers into a structured format for storage in a PostgreSQL database.

## Architecture and File Interaction

The application follows a client-server architecture, built with Node.js and Express on the backend, and vanilla HTML/CSS/JS on the frontend.

### Frontend

- **`index.html`**: The main user interface containing the chat window layout.
- **`style.css`**: Provides the visual styling (colors, layout, chat bubbles, animations).
- **`script.js`**: Manages the frontend logic. It handles user input, updates the UI, and communicates with the backend via REST API endpoints (`/api/start`, `/api/chat`, `/api/finish`).

### Backend (Node.js/Express)

- **`server.js`**: The entry point for the Node.js application. It sets up the Express server, serves static files, and defines the API routes that the frontend calls.
- **`chatService.js`**: The core logic interacting with the Google Gemini API. It handles initializing chat sessions, sending user messages, receiving AI responses, and at the end of the session, it prompts the AI to extract a structured JSON object containing all the user's answers.
- **`dbService.js`**: Manages the connection to a remote Supabase Database. It provides the `saveToDB` function used by `chatService.js` to persist the extracted JSON answers.
- **`excelService.js`**: Contains logic for exporting data to an `.xlsx` file using `exceljs`. _(Note: The main execution flow primarily relies on `dbService.js` for data persistence, but this service provides an alternative output format)._

### Configuration and Deployment

- **`package.json`**: Defines project metadata, dependencies (Express, Google GenAI SDK, PostgreSQL client, etc.), and the launch scripts.
- **`Dockerfile`**: Provides instructions for building a production-ready Docker container for the application, exposing port 8080 as required by environments like Google Cloud Run.

## Project Setup and Local Execution

### Prerequisites

1. **Node.js** (v20 or higher recommended)
2. **PostgreSQL** database (We recommend [Supabase](https://supabase.com/) for a quick, free cloud database)
3. **Google Gemini API Key**

### Directory Structure Notice

The codebase expects a specific directory structure to run properly out-of-the-box. If all files are currently in the root directory, create the necessary folders and move the respective files before starting the server:

```bash
mkdir public services
mv index.html style.css script.js public/
mv chatService.js dbService.js excelService.js services/
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory and add the following configuration variables:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_google_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
3. **Initialize your Supabase/PostgreSQL database.** You must create a table named `risposte` with columns matching the data keys extracted by the Gemini AI. If you are using Supabase, go to the **SQL Editor** in your project dashboard, paste and run the following command:
   ```sql
   CREATE TABLE risposte (
       id SERIAL PRIMARY KEY,
       "Item_1_Filtro" TEXT,
       "Item_2_PercorsoA_ImparatoUsare" TEXT,
       "Item_3_PercorsoA_Attivita" TEXT,
       "Item_4_PercorsoA_Prompt" TEXT,
       "Item_5_PercorsoA_AdozioneAzienda" TEXT,
       "Item_6_PercorsoA_PercezioneRuolo" TEXT,
       "Item_7_PercorsoA_FiduciaRisultato" TEXT,
       "Item_8_PercorsoA_ResponsabilitaErrore" TEXT,
       "Item_9_PercorsoA_VissutoLavoro" TEXT,
       "Item_10_PercorsoA_PressioneApprendimento" TEXT,
       "Item_11_PercorsoA_AspettativaTempi" TEXT,
       "Item_12_PercorsoA_ToccoUmano" TEXT,
       "Item_13_PercorsoA_TimoreSostituzione" TEXT,
       "Item_14_PercorsoA_RapportiColleghi" TEXT,
       "Item_15_PercorsoA_AiutoResponsabile" TEXT,
       "Item_16_PercorsoA_RischiEtici" TEXT,
       "Item_2B_PercorsoB_MotivoNonUso" TEXT,
       "Item_3B_PercorsoB_SensazioneDiffusione" TEXT,
       "Item_4B_PercorsoB_VantaggioChiUsa" TEXT,
       "Item_5B_PercorsoB_InteresseCorso" TEXT,
       "Item_6B_PercorsoB_TimoreNonUso" TEXT,
       "Item_17_Tutti_Ostacoli" TEXT,
       "Item_18_Tutti_IniziativaPrioritaria" TEXT,
       "Item_19_Tutti_Facoltativo" TEXT,
       "Demo_Settore" TEXT,
       "Demo_Ruolo" TEXT,
       "Demo_Anzianita" TEXT,
       "Demo_Genere" TEXT,
       "Demo_Eta" TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Launching the Application

Run the application using the start script:

```bash
npm start
```

The application will be accessible at `http://localhost:3000`.

## Deploying to Google Cloud

This application is containerized and ready to be deployed to **Google Cloud Run**, a managed compute platform that lets you run containers directly on top of Google's scalable infrastructure.

### Prerequisites for Deployment

1. A Google Cloud Platform (GCP) Account with billing enabled.
2. The [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
3. A PostgreSQL database accessible from the internet (e.g., your Supabase database).

### Deployment Steps

1. **Build and Push the Docker Image:**
   Submit your build to Google Cloud Build, which will build the image based on your `Dockerfile` and store it in the Artifact Registry.

   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/iploschat
   ```

2. **Deploy to Cloud Run:**
   Deploy the container image to Cloud Run. Ensure you pass the required environment variables during the deployment process.

   ```bash
   gcloud run deploy iploschat-service \
     --image gcr.io/YOUR_PROJECT_ID/iploschat \
     --platform managed \
     --region your-preferred-region \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY="your_gemini_api_key",DATABASE_URL="your_supabase_connection_string"
   ```

   _(Note: For production, consider using Google Cloud Secret Manager to securely handle the `GEMINI_API_KEY` and `DATABASE_URL` rather than plain text environment variables)._

3. **Access the Application:**
   Once the deployment is complete, the CLI will output a secure service URL (e.g., `https://iploschat-service-xxxxx-uc.a.run.app`). Visit this URL to access your deployed chatbot.
