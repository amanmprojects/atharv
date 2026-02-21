# DocDraft - Production-Ready Google Docs Clone

A brutalist document editor built with Next.js 14, TypeScript, Tailwind CSS, and Google Cloud Platform services. Features real-time collaboration, granular permissions, and AI-ready architecture.

## Features

- **Rich Text Editor**: TipTap-powered editor with formatting, lists, headings, and more
- **Real-Time Collaboration**: Live cursors, presence indicators, and conflict resolution
- **Granular Permissions**: Owner, Editor, Commenter, Viewer roles
- **Auto-Save**: Debounced saving with Cloud Storage backend
- **AI-Ready Architecture**: Modular AI features with Pub/Sub processing
- **Neutral Brutalist Design**: Sharp, functional UI with monospaced typography

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with brutalist design system
- **Editor**: TipTap 3 with extensions
- **Auth**: Firebase Auth + Google Identity Platform
- **Database**: Firestore (Native mode)
- **Storage**: Cloud Storage
- **AI**: Vertex AI, Pub/Sub for async processing
- **Secrets**: Secret Manager

## Prerequisites

- Node.js 20+
- GCP Account with billing enabled
- gcloud CLI installed
- Terraform 1.0+

## Local Development

### 1. Clone and Install

```bash
git clone <repository-url>
cd docdraft
npm install
```

### 2. Set up GCP Authentication

```bash
# Login with Application Default Credentials
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase config from the Firebase Console.

### 4. Enable GCP APIs

```bash
gcloud services enable firestore.googleapis.com \
                       storage.googleapis.com \
                       secretmanager.googleapis.com \
                       pubsub.googleapis.com \
                       aiplatform.googleapis.com \
                       run.googleapis.com \
                       identitytoolkit.googleapis.com \
                       firebase.googleapis.com
```

### 5. Create Firestore Database

```bash
gcloud firestore databases create --location=us-central1
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Using Terraform

1. Initialize Terraform:

```bash
cd terraform
terraform init -backend-config="bucket=YOUR_TERRAFORM_STATE_BUCKET"
```

2. Create `terraform.tfvars`:

```hcl
project_id = "your-project-id"
region     = "us-central1"
app_name   = "docdraft"
```

3. Apply:

```bash
terraform apply
```

### Manual Deployment

1. Build and push Docker image:

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/docdraft
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy docdraft \
  --image gcr.io/YOUR_PROJECT_ID/docdraft \
  --platform managed \
  --region us-central1 \
  --service-account doc-editor-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │   Editor    │  │  Auth Components    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/docs   │  │ /api/share  │  │    /api/ai/[...]    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Firestore  │  │   Storage   │  │     Vertex AI       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Pub/Sub    │  │   Secrets   │  │     Firebase Auth   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Security

### ADC (Application Default Credentials)

This project uses ADC for authentication, which automatically finds credentials from:

1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable
2. User credentials from `gcloud auth application-default login`
3. Attached service account (Cloud Run)
4. Compute Engine metadata service

### Firestore Security Rules

Rules are defined in `terraform/firestore_rules.tf`:

- Documents: Permission-based access (1-4 levels)
- Comments: Document-level permissions cascade
- Share Invitations: Email-based matching
- AI Requests: User-owned only

### Cloud Storage IAM

- Documents bucket: Private by default
- Signed URLs for client-side uploads
- CORS restricted to Cloud Run domain

## AI Features

### Architecture

```
User Action → API Route → Pub/Sub Topic → Cloud Function → Vertex AI → Firestore
```

### Adding a New AI Feature

1. Define the feature in `src/types/ai.ts`:

```typescript
export type AIFeature = ... | 'my-new-feature';
```

2. Add configuration in `src/app/api/ai/[feature]/route.ts`:

```typescript
const AI_FEATURES: Record<AIFeature, {...}> = {
  ...,
  'my-new-feature': { requiresConsent: true, costPerToken: 0.0001 }
};
```

3. Create the processor Cloud Function

4. Update the editor toolbar

### Consent Management

AI features require explicit user consent stored at:

- Document level: `document.aiConsent`
- Feature level: `document.aiFeatures[]`

## Performance Targets

- Auto-save latency: <100ms p95
- Cursor sync: <50ms
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

## Testing

```bash
# Unit tests
npm run test

# E2E tests (requires running dev server)
npx cypress run

# Load testing (k6)
k6 run tests/load/basic.js
```

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated routes
│   │   ├── dashboard/   # Document listing
│   │   └── docs/[id]/   # Document editor
│   ├── (auth)/          # Public routes
│   │   └── login/       # Login page
│   ├── api/             # API routes
│   │   ├── documents/   # Document CRUD
│   │   ├── share/       # Sharing logic
│   │   └── ai/          # AI endpoints
│   ├── globals.css      # Brutalist styles
│   └── layout.tsx       # Root layout
├── components/
│   ├── auth/            # Auth components
│   ├── dashboard/       # Dashboard components
│   ├── editor/          # TipTap editor
│   └── ui/              # Base UI components
├── context/             # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities
│   ├── firebase.ts      # Firebase client
│   ├── gcp.ts           # GCP clients
│   └── utils.ts         # Helpers
└── types/               # TypeScript types
```

## License

MIT
