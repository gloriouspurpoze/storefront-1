# Testimonials Seed Data Guide

Quick guide to populate your database with sample testimonials.

---

## 🚀 Quick Start

### Option 1: Use the Seed Script (Recommended)

**From the backend directory:**
```bash
cd ../fixer-backend
npm run seed:testimonials
```

**Or using TypeScript directly:**
```bash
npx ts-node src/scripts/seed-testimonials.ts
```

**Or using JavaScript:**
```bash
node src/scripts/seed-testimonials.js
```

### Option 2: Use the Admin Panel

1. Navigate to `/cms/testimonials` in the admin panel
2. Click "Add Testimonial"
3. Fill in the form with the sample data below
4. Click "Create"

---

## 📦 Sample Testimonials Data

Here are 10 sample testimonials you can use:

### Testimonial 1
```json
{
  "customerName": "Sarah Johnson",
  "customerTitle": "Homeowner",
  "customerAvatar": "https://i.pravatar.cc/150?img=1",
  "rating": 5,
  "comment": "Excellent service! The team was professional, punctual, and did an amazing job fixing my plumbing issues. Highly recommend!",
  "service": "Plumbing",
  "isApproved": true,
  "isFeatured": true,
  "displayOrder": 1
}
```

### Testimonial 2
```json
{
  "customerName": "Michael Chen",
  "customerTitle": "Business Owner",
  "customerAvatar": "https://i.pravatar.cc/150?img=2",
  "rating": 5,
  "comment": "Fast response time and quality work. The electrician fixed all our office electrical issues in one visit. Great value for money!",
  "service": "Electrical",
  "isApproved": true,
  "isFeatured": true,
  "displayOrder": 2
}
```

### Testimonial 3
```json
{
  "customerName": "Emily Rodriguez",
  "customerTitle": "Property Manager",
  "customerAvatar": "https://i.pravatar.cc/150?img=3",
  "rating": 5,
  "comment": "Outstanding HVAC service! They installed a new system and it's been working perfectly. Professional team from start to finish.",
  "service": "HVAC",
  "isApproved": true,
  "isFeatured": true,
  "displayOrder": 3
}
```

### Testimonial 4
```json
{
  "customerName": "David Thompson",
  "customerTitle": "Homeowner",
  "customerAvatar": "https://i.pravatar.cc/150?img=4",
  "rating": 4,
  "comment": "Good service overall. The handyman was friendly and completed the job on time. Would use again for future projects.",
  "service": "Handyman",
  "isApproved": true,
  "isFeatured": false,
  "displayOrder": 4
}
```

### Testimonial 5
```json
{
  "customerName": "Lisa Anderson",
  "customerTitle": "Restaurant Owner",
  "customerAvatar": "https://i.pravatar.cc/150?img=5",
  "rating": 5,
  "comment": "Best appliance repair service I've ever used! Fixed our commercial refrigerator quickly and saved us from losing inventory. Thank you!",
  "service": "Appliance Repair",
  "isApproved": true,
  "isFeatured": true,
  "displayOrder": 5
}
```

### Testimonial 6
```json
{
  "customerName": "James Wilson",
  "customerTitle": "Homeowner",
  "customerAvatar": "https://i.pravatar.cc/150?img=6",
  "rating": 5,
  "comment": "Professional painting service! The team painted our entire house and it looks amazing. Clean, efficient, and reasonably priced.",
  "service": "Painting",
  "isApproved": true,
  "isFeatured": false,
  "displayOrder": 6
}
```

### Testimonial 7
```json
{
  "customerName": "Maria Garcia",
  "customerTitle": "Homeowner",
  "customerAvatar": "https://i.pravatar.cc/150?img=7",
  "rating": 5,
  "comment": "Excellent roofing repair! Fixed our leak quickly and provided great advice on maintenance. Very satisfied with the service.",
  "service": "Roofing",
  "isApproved": true,
  "isFeatured": true,
  "displayOrder": 7
}
```

### Testimonial 8
```json
{
  "customerName": "Robert Brown",
  "customerTitle": "Business Owner",
  "customerAvatar": "https://i.pravatar.cc/150?img=8",
  "rating": 4,
  "comment": "Good cleaning service. The team was thorough and professional. Our office has never looked better!",
  "service": "Cleaning",
  "isApproved": true,
  "isFeatured": false,
  "displayOrder": 8
}
```

### Testimonial 9
```json
{
  "customerName": "Jennifer Lee",
  "customerTitle": "Homeowner",
  "customerAvatar": "https://i.pravatar.cc/150?img=9",
  "rating": 5,
  "comment": "Amazing landscaping work! Transformed our backyard into a beautiful space. The team was creative and professional throughout.",
  "service": "Landscaping",
  "isApproved": true,
  "isFeatured": true,
  "displayOrder": 9
}
```

### Testimonial 10
```json
{
  "customerName": "Christopher Martinez",
  "customerTitle": "Homeowner",
  "customerAvatar": "https://i.pravatar.cc/150?img=10",
  "rating": 5,
  "comment": "Top-notch carpentry work! Built custom shelves and cabinets exactly as we wanted. Quality craftsmanship and attention to detail.",
  "service": "Carpentry",
  "isApproved": true,
  "isFeatured": false,
  "displayOrder": 10
}
```

---

## 📝 Testimonial Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | string | Yes | Customer's full name |
| `customerTitle` | string | No | Customer's title or role |
| `customerAvatar` | string | No | URL to customer's avatar image |
| `rating` | number | Yes | Rating from 1 to 5 |
| `comment` | string | Yes | The testimonial text |
| `service` | string | No | Service category (e.g., "Plumbing", "Electrical") |
| `isApproved` | boolean | Yes | Whether the testimonial is approved for display |
| `isFeatured` | boolean | Yes | Whether to feature this testimonial prominently |
| `displayOrder` | number | Yes | Order for display (lower numbers appear first) |

---

## ✅ After Adding Testimonials

1. **Check Testimonials:**
   - Go to `/cms/testimonials` in admin panel
   - You'll see all testimonials listed
   - Use filters to view: All, Approved, Pending, or Featured

2. **Approve Testimonials:**
   - Click the approval icon on any testimonial
   - Approved testimonials will be visible on the public site

3. **Feature Testimonials:**
   - Click the star icon to feature testimonials
   - Featured testimonials appear prominently on the homepage

---

## 🎨 Customize the Data

If you're creating a seed script, use this structure:

```typescript
const testimonials = [
  {
    customerName: "Sarah Johnson",
    customerTitle: "Homeowner",
    customerAvatar: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    comment: "Excellent service!...",
    service: "Plumbing",
    isApproved: true,
    isFeatured: true,
    displayOrder: 1
  },
  // ... more testimonials
]
```

---

## 🔄 Re-running

The seed script should be **safe to run multiple times**:
- ✅ Won't create duplicates (check by customerName + comment)
- ✅ Skips existing testimonials
- ✅ Only adds new items

---

## 🐛 Troubleshooting

### Error: "Failed to load testimonials"

1. **Check API Route:**
   - Ensure `/api/cms/admin/testimonials` exists in your backend
   - Verify authentication token is valid

2. **Check Response Structure:**
   - The API should return: `{ testimonials: [...] }` or `{ data: [...] }`
   - Or a direct array: `[...]`

3. **Check Backend:**
   - Ensure testimonials model/collection exists
   - Verify database connection

### No Testimonials Showing

1. **Check Approval Status:**
   - Testimonials need `isApproved: true` to show on public site
   - Use the approval toggle in admin panel

2. **Check Filters:**
   - Make sure you're not filtering them out
   - Try viewing "All" testimonials

---

## 📚 Related Documentation

- See `SEED_DATA_GUIDE.md` for homepage sections and menus
- See backend API documentation for testimonials endpoints
