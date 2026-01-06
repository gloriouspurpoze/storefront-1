# Seed Data Guide - Homepage Sections & Menus

Quick guide to populate your database with sample homepage sections and menus.

---

## 🚀 Quick Start

### Run the Seed Script

**From the backend directory:**
```bash
cd ../fixer-backend
npm run seed:homepage-menus
```

**Or using TypeScript directly:**
```bash
npx ts-node src/scripts/seed-homepage-menus.ts
```

**Or using JavaScript:**
```bash
node src/scripts/seed-homepage-menus.js
```

---

## 📦 What Gets Created

### Homepage Sections (6 sections)
1. **Hero Banner** - Main landing section
2. **Features** - Why choose us section  
3. **Services** - Services grid
4. **Testimonials** - Customer reviews
5. **Statistics** - Impact numbers
6. **CTA Section** - Call to action

### Menus (3 menus)
1. **Main Navigation** (Header) - Primary nav with nested items
2. **Footer Menu** - Footer links
3. **Mobile Menu** - Mobile navigation

---

## ✅ After Running

1. **Check Homepage Sections:**
   - Go to `/cms/homepage` in admin panel
   - You'll see 6 sections ready to edit

2. **Check Menus:**
   - Go to `/cms/menus` in admin panel
   - You'll see 3 menus (Header, Footer, Mobile)

---

## 🎨 Customize the Data

The seed script is located at:
- `fixer-backend/src/scripts/seed-homepage-menus.ts`
- `fixer-backend/src/scripts/seed-homepage-menus.js`

Edit the arrays in these files to customize:
- Section titles, descriptions, and content
- Menu items and links
- Images and CTAs

---

## 🔄 Re-running

The script is **safe to run multiple times**:
- ✅ Won't create duplicates
- ✅ Skips existing data
- ✅ Only adds new items

---

## 📝 Full Documentation

See `fixer-backend/SEED_HOMEPAGE_MENUS.md` for complete documentation.

