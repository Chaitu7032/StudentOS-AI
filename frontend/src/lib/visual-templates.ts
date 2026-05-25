import type { ConceptMapItem } from "@/components/visual/concept-map";

export interface DiagramTemplate {
  id: string;
  title: string;
  category: "flowchart" | "architecture" | "dsa" | "sequence";
  description: string;
  mermaid: string;
}

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: "binary-search-flow",
    title: "Binary Search Flow",
    category: "dsa",
    description: "Decision flow for binary search on a sorted array",
    mermaid: `flowchart TD
    A[Start] --> B{lo <= hi?}
    B -->|No| C[Not Found]
    B -->|Yes| D[mid = lo + hi / 2]
    D --> E{arr[mid] == target?}
    E -->|Yes| F[Found at mid]
    E -->|No| G{arr[mid] < target?}
    G -->|Yes| H[lo = mid + 1]
    G -->|No| I[hi = mid - 1]
    H --> B
    I --> B`,
  },
  {
    id: "react-render",
    title: "React Render Cycle",
    category: "flowchart",
    description: "How state updates trigger re-renders",
    mermaid: `flowchart LR
    A[State Change] --> B[Schedule Re-render]
    B --> C[Render Phase]
    C --> D[Reconcile Virtual DOM]
    D --> E[Commit to DOM]
    E --> F[useEffect runs]`,
  },
  {
    id: "client-server",
    title: "Client-Server Architecture",
    category: "architecture",
    description: "Typical web app request flow",
    mermaid: `flowchart TB
    subgraph Client
      UI[React UI]
    end
    subgraph Server
      API[FastAPI]
      DB[(PostgreSQL)]
      AI[Gemini AI]
    end
    UI -->|HTTPS + JWT| API
    API --> DB
    API --> AI`,
  },
  {
    id: "bst-structure",
    title: "Binary Search Tree",
    category: "dsa",
    description: "BST node relationships",
    mermaid: `flowchart TD
    R[Root 8] --> L[Left 3]
    R --> RT[Right 10]
    L --> LL[1]
    L --> LR[6]
    RT --> RTL[9]
    RT --> RTR[14]`,
  },
  {
    id: "auth-sequence",
    title: "JWT Auth Sequence",
    category: "sequence",
    description: "Login and authenticated request flow",
    mermaid: `sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    U->>F: Enter credentials
    F->>B: POST /auth/login
    B-->>F: JWT token
    F->>F: Store token
    F->>B: API call + Bearer token
    B-->>F: Protected data`,
  },
  {
    id: "rag-pipeline",
    title: "RAG Pipeline",
    category: "architecture",
    description: "StudentOS knowledge retrieval flow",
    mermaid: `flowchart LR
    D[Documents] --> C[Chunk + Embed]
    C --> V[(pgvector)]
    Q[User Question] --> S[Semantic Search]
    V --> S
    S --> CTX[Context + Citations]
    CTX --> G[Gemini]`,
  },
];

export const CONCEPT_MAPS: ConceptMapItem[] = [
  {
    id: "os-process",
    title: "Operating System — Process Model",
    summary: "How processes, threads, and scheduling relate",
    tags: ["OS", "Systems"],
    mermaid: `mindmap
  root((OS))
    Processes
      PCB
      Context Switch
      fork/exec
    Memory
      Virtual Memory
      Paging
    Scheduling
      Round Robin
      Priority`,
  },
  {
    id: "dsa-complexity",
    title: "DSA Complexity Classes",
    summary: "Common time complexities and when they apply",
    tags: ["DSA", "Interview"],
    mermaid: `flowchart TB
    subgraph Linear
      A[O n - Array scan]
    end
    subgraph Logarithmic
      B[O log n - Binary search]
    end
    subgraph Quadratic
      C[O n² - Nested loops]
    end
    subgraph Linearithmic
      D[O n log n - Merge sort]`,
  },
  {
    id: "ml-pipeline",
    title: "Machine Learning Pipeline",
    summary: "End-to-end ML workflow for students",
    tags: ["ML", "Data"],
    mermaid: `flowchart LR
    A[Collect Data] --> B[Clean & EDA]
    B --> C[Feature Engineering]
    C --> D[Train Model]
    D --> E[Evaluate]
    E --> F{Good enough?}
    F -->|No| C
    F -->|Yes| G[Deploy]`,
  },
  {
    id: "http-lifecycle",
    title: "HTTP Request Lifecycle",
    summary: "What happens from browser click to response",
    tags: ["Web", "Networking"],
    mermaid: `sequenceDiagram
    participant B as Browser
    participant D as DNS
    participant S as Server
    B->>D: Resolve domain
    D-->>B: IP address
    B->>S: TCP + TLS + HTTP
    S-->>B: Response body`,
  },
];
