# 🌿 ScrapHappens

**ScrapHappens** is an industry-leading, full-stack circular economy platform designed to transform industrial waste and surplus materials into high-value inventory. Powered by a **Multi-Agent Agentic AI Orchestrator**, real-time **IVR voice systems**, and **3D gamified impact tracking**, it bridges the gap between sustainable supply and demand.

---

## ✨ High-Impact Features

### 🪴 The Garden (3D Gamification)
**The heart of your circular impact.** ScrapHappens features a real-time, 3D-rendered garden powered by **Three.js**.
- **Visual Growth**: Your digital garden grows and flourishes as you complete circular purchases and divert material from landfills.
- **Achievements**: Earn "Circular Saplings" and rare badges for high-impact transactions.
- **Impact Metrics**: Direct visualization of the weight of waste moved, turning sustainability into an immersive experience.

### 📞 IVR & Voice Assistant
**Hands-free circularity.** Integrated with **Twilio**, ScrapHappens provides a programmable voice interface.
- **Automated Support**: Call for real-time material discovery, order status tracking, and platform guidance.
- **Conversational AI**: Uses Gemini-powered speech-to-text and intent analysis for human-like interaction.

### 🤖 Multi-Agent Agentic AI (Orchestrator Pattern)
ScrapHappens uses a sophisticated **Supervisor Routing** system to coordinate specialized AI agents:

#### 1. Seller Agent (Listing Automation)
Automates the creation of material listings using natural language.
- **Good Prompts**: *"Create a listing for 50 aluminium rods"*, *"List 50 aluminium rods for sale"*
- **Expected result**: 
  ```json
  create_listing_draft(item: "aluminium rods", quantity: 50, category: "Metal", price_range: "suggested")
  ```

#### 2. Buyer Agent (Semantic Material Search)
Intelligent product discovery using semantic ranking.
- **Good Prompts**: *"Find cheap plastic materials near me"*, *"Search for recyclable cardboard"*
- **Expected Tool Chain**: `search_materials` → `rank_best_material_matches` → `display_material_cards`.

#### 3. DIY Agent (Upcycling & Inspiration)
Generates creative reuse ideas mapped directly to available marketplace materials.
- **Good Prompts**: *"Suggest DIY projects using plastic bottles"*, *"Show upcycling ideas using glass jars"*
- **Expected Tools**: `list_diy_projects` → `search_materials` → `match_project_materials`.

#### 5. Supervisor Routing (Multi-Agent Dispatch)
The system intelligently routes incoming requests to the correct specialist based on intent:
- **"I want to buy plastic sheets"** → Routes to **Buyer Agent**
- **"I have 20 wooden pallets to sell"** → Routes to **Seller Agent**
- **"Suggest a DIY project using bottles"** → Routes to **DIY Agent**
- **"Track my order"** → Routes to **Logistics Agent**

---

## 🚀 Advanced Integrations

### 🚛 ShipRocket Logistics
- **Real-time API**: Integrated with **ShipRocket** for automated shipping rate calculation and AWB generation.
- **Tracking**: Persistent tracking updates and delivery status synchronization.

### 💬 WHAPI (WhatsApp Integration)
- **Automated Notifications**: Real-time WhatsApp alerts for order confirmations and shipping milestones.
- **Human-Centric**: Uses typing indicators and professional templates for a premium user experience.

### 👓 Augmented Reality (AR) Material Preview
- **Immersive View**: Uses `@google/model-viewer` to allow buyers to preview materials in 3D/AR before purchase.
- **Validation**: Ensure material dimensions and condition meet requirements via visual inspection in the browser.

### 🌍 Multilingual Support
- **Global Reach**: Native support for multiple languages across the chat and IVR interfaces, enabling circular economies in any region.

---

## ⚙️ Technical Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
  - **3D/AR**: Three.js, React-Three-Fiber, Google Model-Viewer.
  - **Real-time**: Socket.io for orchestrator streaming.
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
  - **AI**: Gemini 2.0 (GPT-4o compatible) for Multi-Agent logic.
  - **DB**: Neon PostgreSQL (Serverless).
  - **Third-Party**: ShipRocket (Logistics), WHAPI (WhatsApp), Twilio (Voice).

---

## 🛠️ Project Structure

```text
scrap-happens/
├── apps/
│   ├── frontend/             # React + Vite application
│   │   ├── src/pages/        # Dashboard, Marketplace, Garden, DIY Feed
│   │   ├── src/components/   # AR Viewer, 3D Garden, AI Sidebar
│   │   └── src/contexts/     # Agentic & Auth state management
│   └── backend/              # Node.js + Express API
│       ├── src/modules/      # Multi-Agent Orchestrator, Voice, WhatsApp
│       ├── src/services/     # ShipRocket, AI Service
│       └── src/models/       # Database schemas & migrations
```

---

## 🏁 Quick Start

1. **Install**: `npm install`
2. **Config**: Set up `.env` with `NEON_DATABASE_URL`, `OPENAI_API_KEY`, `SHIPROCKET_TOKEN`, `WHAPI_TOKEN`, and `TWILIO_SID`.
3. **Run**: `npm run dev`
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:4000](http://localhost:4000)

---

## ⚖️ License
MIT License. Turn waste into wealth. 🌿

---

## 🎨 Design Principles
ScrapHappens utilizes an **Eco-Minimalism + Material Design** hybrid theme. It prioritizes:
- **High Visual Contrast**: Neobrutalist shadows and clean layout markers.
- **Natural Palettes**: Sage greens, earth browns, and cream backgrounds.
- **Interactive States**: Smooth transitions and hover effects to encourage exploration.
- **PWA Features**: Service workers for an app-like experience on mobile.

---

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
