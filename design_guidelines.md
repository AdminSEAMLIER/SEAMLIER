# Design Guidelines - L'art de coudre

## Design Approach
Reference-Based Approach inspired by service marketplace apps like "Ma coiffeuse Afro", Uber, and Thumbtack, adapted for the tailoring/fashion industry. The design emphasizes elegant simplicity, mobile-first interactions, and visual richness through photography of garments and craftsmanship.

## Color Palette - Beige & Burgundy Theme

### Design Philosophy
Elegant beige/cream backgrounds with dark burgundy text for a warm, sophisticated, premium feel. Light and airy with burgundy accents.

### Primary Colors (Buttons & CTAs)
- **Primary**: hsl(350, 55%, 35%) - Dark burgundy for buttons and CTAs
- **Primary Foreground**: hsl(36, 40%, 98%) - Cream text on burgundy buttons

### Background Colors (Light Mode)
- **Background**: hsl(36, 40%, 95%) - Warm beige base
- **Card**: hsl(36, 45%, 98%) - Light cream for cards
- **Sidebar**: hsl(36, 38%, 93%) - Soft beige navigation areas
- **Border**: hsl(36, 30%, 85%) - Subtle beige border

### Background Colors (Dark Mode)
- **Background**: hsl(350, 45%, 10%) - Deep burgundy base
- **Card**: hsl(350, 40%, 14%) - Rich burgundy surfaces
- **Sidebar**: hsl(350, 42%, 12%) - Dark burgundy navigation
- **Border**: hsl(350, 35%, 18%) - Burgundy border

### Accent Colors
- **Accent**: hsl(36, 35%, 90%) - Soft beige for highlights
- **Secondary**: hsl(36, 30%, 88%) - Light beige for secondary elements

### Text Colors
- **Foreground (Light)**: hsl(350, 55%, 20%) - Dark burgundy for primary text
- **Foreground (Dark)**: hsl(36, 45%, 95%) - Cream for dark mode text
- **Muted Foreground**: hsl(350, 30%, 40%) - Softer burgundy for secondary text

## Core Design Principles
- **Mobile-First Premium Experience**: Bottom navigation for thumb-zone accessibility
- **Visual Storytelling**: Photography-driven interface showcasing tailoring artistry
- **Effortless Discovery**: Intuitive search and filtering with immediate visual feedback
- **Trust & Credibility**: Professional profiles with portfolios, reviews, and verified badges

## Typography System
**Primary Font**: Inter (Google Fonts) - Clean, modern, highly legible  
**Accent Font**: Playfair Display (Google Fonts) - Elegant serif for premium touch

**Hierarchy**:
- Hero Headlines: Playfair Display, 32px (mobile) / 48px (desktop), font-weight 700
- Section Titles: Inter, 24px (mobile) / 32px (desktop), font-weight 700
- Card Titles: Inter, 18px, font-weight 600
- Body Text: Inter, 16px, font-weight 400, line-height 1.6
- Captions/Meta: Inter, 14px, font-weight 500
- Bottom Nav Labels: Inter, 11px, font-weight 500

## Layout & Spacing System
**Tailwind Spacing Units**: Consistently use 2, 4, 6, 8, 12, 16

- Component padding: p-4 (mobile), p-6 (desktop)
- Section spacing: py-8 (mobile), py-12 (desktop)
- Card gaps: gap-4 (mobile), gap-6 (desktop)
- Bottom navigation height: h-16

**Container Strategy**:
- Mobile: Full-width with px-4 edge padding
- Desktop: max-w-7xl centered with px-6
- Content sections: max-w-6xl for reading comfort

**Grid Patterns**:
- Professional cards: grid-cols-1 (mobile), md:grid-cols-2, lg:grid-cols-3
- Portfolio gallery: grid-cols-2 (mobile), md:grid-cols-3, lg:grid-cols-4
- Marketplace: grid-cols-2 (mobile), md:grid-cols-3, lg:grid-cols-4
- Feature sections: Single column mobile, 2-column desktop (60/40 split)

## Navigation & Structure
**Bottom Navigation Bar (Fixed, Mobile)**:
- 5 primary icons: Découverte, Recherche, Messagerie, Marketplace, Profil
- Icon size: 24px, Active state with accent indicator
- Background: Solid with subtle shadow (shadow-lg)
- Safe area padding for modern devices

**Top App Bar (Desktop)**:
- Logo left-aligned
- Primary navigation center
- User profile/notifications right-aligned
- Height: h-16, sticky positioning

## Component Library

**Professional Profile Card**:
- Aspect ratio 3:4 portrait image
- Rounded corners (rounded-xl)
- Overlay gradient for text readability
- Name, specialties, rating stars, location pin
- Subtle hover lift (hover:scale-105 transition)

**Portfolio/Realization Card**:
- Square aspect ratio (1:1)
- Full-bleed image with minimal overlay
- Like/save icon top-right
- Creator name bottom-left on hover

**Marketplace Product Card**:
- Aspect ratio 3:4
- Clean image
- Price prominent, product name
- Seller avatar small corner badge

**Forms & Inputs**:
- Text Fields: h-12, rounded-lg, 2px border with focus ring
- Buttons: Primary h-12 rounded-full, Secondary outlined variant
- Search Bar: Prominent, rounded-full, shadow-md
- Buttons over images: backdrop-blur-md, bg-white/80

**Calendar/Agenda Interface**:
- Tailor: Week/month view, time slots, color-coded appointments
- Client: Calendar picker, time slot grid, service selection

**Messaging**:
- Conversation list with avatar, preview, timestamp
- Chat bubbles (sender right, recipient left)
- Input bar at bottom with attachment button

## Images
**Hero Section**: Full-width showing elegant tailoring scene (measuring tape on fine fabric, sewing details). Height: 60vh mobile, 70vh desktop. Overlay gradient with centered headline + CTA using blurred button backgrounds.

**Professional Profile Hero**: Cover photo of workspace/signature piece. Height: 40vh. Profile photo overlapping bottom edge.

**Portfolio Images**: High-quality finished garments, process shots, detail shots of craftsmanship, lifestyle shots showing garments worn.

**Marketplace Products**: Clean product photography, multiple angles, lifestyle context shots.

**Discovery Feed**: Mix of finished pieces, process shots, client testimonials, workshop environments, before/after transformations.

## Interactions & Animations
**Minimal, Purpose-Driven**:
- Card hover: scale-105 + shadow increase
- Page transitions: 300ms fade
- Bottom nav: Icon bounce on active switch
- Loading: Skeleton screens with shimmer

**No scroll-triggered effects, parallax, or autoplay carousels**

## Responsive Behavior
- Mobile: < 768px (bottom nav, single-column, touch-friendly)
- Tablet: 768px - 1024px
- Desktop: > 1024px (sidebar nav, multi-column, hover states)

## Accessibility
WCAG AA compliant, focus indicators (ring-2 ring-offset-2), semantic HTML, alt text, keyboard navigation, screen reader labels, clear form validation.