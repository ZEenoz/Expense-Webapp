# Product: Installment Dashboard (Expense-Webapp)

## Register
product

## Users
- **Primary**: Thai users who want to track their installments (Shopee, CC, etc.) simply through LINE.
- **Context**: Mobile-first users, often checking balance or marking payments while on the go.
- **Mood**: Precise, organized, and stress-free financial tracking.

## Brand Identity
- **Tone**: Professional, Reliable, Premium, Sleek.
- **Anti-References**: Avoid "Generic Admin Dashboard" looks or "Bank App" clutter.
- **Strategic Principles**:
    1. **LINE-Native**: Everything should feel like it belongs within the LINE app ecosystem.
    2. **Frictionless**: Minimum clicks to record or mark as paid.
    3. **Privacy First**: Data is strictly isolated per UserId.

## Core Features
- Installment Tracking (Current/Total)
- Dynamic Category Management
- Automated LINE Notifications (Reminder Day)
- Batch Payments (Pay All)
- Google Sheets as a Transparent Database

---

# Design System (DESIGN.md)

## Color Palette (OKLCH)
- **Background**: `oklch(14% 0.01 258)` (Deep Slate-950)
- **Primary (Accent)**: `oklch(62% 0.21 278)` (Vibrant Violet-500)
- **Secondary**: `oklch(58% 0.18 240)` (Cool Blue-500)
- **Success**: `oklch(70% 0.17 145)` (Emerald-400)
- **Warning**: `oklch(78% 0.16 84)` (Amber-400)
- **Neutral**: `oklch(92% 0.005 258)` (Text Off-white)

## Typography
- **Headings**: Inter or Outfit, Bold, tight tracking.
- **Body**: Inter, Medium/Regular.
- **Data**: Tabular figures for prices and installments.

## Layout & Elevation
- **Spacing**: Using a 4px grid system.
- **Cards**: Bordered with `white/0.08`, subtle background gradients, no heavy shadows.
- **Motion**: `ease-out-expo` for transitions.
