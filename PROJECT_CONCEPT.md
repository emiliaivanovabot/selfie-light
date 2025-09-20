# Selfie Transformation App - Projekt Konzept

## 🎯 Haupt-Ziel
Eine Web-App, die User-Selfies basierend auf einem Referenzbild (z.B. Emilia Clarke) transformiert und dabei realistische Gesichtstransformationen erstellt.

## 🔧 Technische Spezifikation

### FAL.ai API Details
- **API**: FAL.ai Nano Banana Edit API (`fal-ai/nano-banana/edit`)
- **API Key**: `d3bb5586-0ace-4c0e-b1e9-4388acbb972c:6e7846f314d2cc594cb513d82b1f8b75`
- **Input**:
  - User-Selfie (base64 oder URL)
  - Referenzbild (base64 oder URL)
  - Text-Prompt
- **Output**: 1024x1365 JPEG
- **Processing Time**: 15-20 Sekunden

### Tech Stack
- **Framework**: Next.js 15 mit App Router
- **UI**: Tailwind CSS + Shadcn UI
- **Image Processing**: FAL.ai API
- **Upload**: File Upload API mit lokaler Speicherung

## 🎨 User Flow

### Step 1: Dual Upload
- **Selfie Upload**: User lädt eigenes Selfie hoch
- **Reference Upload**: User lädt Referenzbild hoch (z.B. Emilia Clarke)

### Step 2: Transformation
- Beide Bilder werden an FAL.ai nano-banana/edit API gesendet
- API transformiert User-Selfie basierend auf Referenzbild
- Benutzt FAL.ai's AI um realistische Gesichtstransformation zu erstellen

### Step 3: Results
- **Vorher**: Original User-Selfie
- **Nachher**: Transformiertes Bild mit Features vom Referenzbild
- **Download**: Möglichkeit das Ergebnis herunterzuladen

## 📁 Projekt Struktur

```
/src/app/
├── page.tsx              # Haupt-UI mit dual upload
├── api/
│   ├── upload/route.ts   # File upload endpoint
│   └── process/route.ts  # FAL.ai processing endpoint
/lib/
└── fal.ts               # FAL.ai API client
/public/uploads/         # Uploaded images storage
```

## 🚨 Wichtige Implementation Details

### Current Status
- ✅ Dual Upload UI (Selfie + Reference)
- ✅ File Upload API
- ✅ Next.js Image configuration für FAL.ai URLs
- ❌ **FEHLT**: FAL.ai nano-banana/edit API Integration
- ❌ **FEHLT**: Beide Bilder an API senden

### Nächste Schritte
1. FAL.ai Client auf nano-banana/edit API umstellen
2. Beide Bilder (Selfie + Reference) an API senden
3. Korrekte API Response handling

## 💡 Beispiel Use Case
"User uploaded Selfie von sich + Emilia Clarke Referenzbild → FAL.ai transformiert User's Gesicht mit Emilia's Features → User sieht wie er/sie als Emilia Clarke aussehen würde"

---
**WICHTIG**: Dieses Konzept muss bei jedem neuen Chat berücksichtigt werden!