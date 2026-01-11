# RRJ Watch Webapp

**Live Website:** [rrjwatch.shop](https://rrjwatch.shop)

## How It Was Built

RRJ Watch was designed to create a seamless link between an aquarium's physical environment and a digital management interface. The goal was to automate routine maintenance tasks while providing crystal-clear visibility into water quality.

### Architecture Overview

The system operates on a three-tier architecture:

1.  **IoT Integration**: The core of the physical setup involves custom IoT/hardware components that constantly read sensor data (pH, Temperature, Turbidity). These devices are programmed not just to read data, but to act on it—triggering automated feeders or dispensing pH solutions when thresholds are crossed.

2.  **Real-Time Backend**: I chose **Firebase** as the backend backbone because of its real-time capabilities. The IoT devices push data to the Realtime Database/Firestore, which instantly propagates to the web clients. This ensures that the "Live Dashboard" is truly live, with negligible latency.

3.  **Modern Frontend**: The web application is built with **Next.js**. I used the App Router for modern routing features and optimized performance. The UI is crafted with **Tailwind CSS** and **Shadcn UI** to ensure it looks professional and works perfectly across mobile and desktop devices. State management is handled by **React Query** to efficiently manage the stream of real-time data from Firebase.

## Technology Stack

I utilized a modern, scalable stack to ensure performance and reliability:

### Frontend
*   **Next.js (App Router)**: For server-side rendering and static generation.
*   **React**: UI component architecture.
*   **Tailwind CSS**: For rapid, responsive styling.
*   **Shadcn UI & Radix UI**: For accessible, high-quality UI components.
*   **Recharts**: For visualizing historical sensor data.
*   **React Query**: For managing server state and real-time syncing.

### Backend & Cloud
*   **Firebase**:
    *   **Realtime Database/Firestore**: For syncing sensor data.
    *   **Authentication**: Secure user access.
    *   **Hosting**: Fast and secure content delivery.

### Tools & Libraries
*   **Zod**: For robust schema validation.
*   **React Hook Form**: For efficient form management.
*   **Lucide React**: For consistent iconography.

## 📸 UI Showcase

### Landing & Login
| Landing Page | Feature Scroll 1 |
|:---:|:---:|
| ![Landing Page](/public/images/ui_for_github/landing.jfif) | ![Scroll View 1](/public/images/ui_for_github/scroll2.jfif) |

| Feature Scroll 2 | Login Screen |
|:---:|:---:|
| ![Scroll View 2](/public/images/ui_for_github/scroll3.jfif) | ![Login Screen](/public/images/ui_for_github/login.jfif) |

### Dashboard & Real-Time Monitoring
| Main Dashboard | Dashboard View 2 |
|:---:|:---:|
| ![Dashboard](/public/images/ui_for_github/dashboard.jfif) | ![Dashboard 2](/public/images/ui_for_github/dashboard_2.jfif) |

### Features & Automation
| Automation Settings | History & Logs |
|:---:|:---:|
| ![Automation](/public/images/ui_for_github/automation.jfif) | ![History](/public/images/ui_for_github/history.jfif) |

