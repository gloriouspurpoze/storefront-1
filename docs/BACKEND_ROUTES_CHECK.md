# Backend Routes Verification

## Issue Fixed
The frontend was making requests to `/api/api/cms/admin/testimonials` (double `/api/api`) due to base URL configuration.

## Frontend Fix Applied
✅ Fixed `src/services/api/cms.service.ts`:
- Changed all endpoints from `/api/cms/admin/...` to `/cms/admin/...`
- Since `REACT_APP_API_URL` already includes `/api`, endpoints should not duplicate it

## Backend Routes That Should Exist

The backend (`fixer-backend`) should have these routes configured:

### Testimonials Routes
```
GET    /api/cms/admin/testimonials
POST   /api/cms/admin/testimonials
GET    /api/cms/admin/testimonials/:id
PUT    /api/cms/admin/testimonials/:id
DELETE /api/cms/admin/testimonials/:id
```

### Other CMS Routes (for reference)
```
GET    /api/cms/admin/homepage
POST   /api/cms/admin/homepage
PUT    /api/cms/admin/homepage/:id
DELETE /api/cms/admin/homepage/:id

GET    /api/cms/admin/banners
POST   /api/cms/admin/banners
PUT    /api/cms/admin/banners/:id
DELETE /api/cms/admin/banners/:id

GET    /api/cms/admin/promotions
POST   /api/cms/admin/promotions
PUT    /api/cms/admin/promotions/:id
DELETE /api/cms/admin/promotions/:id

GET    /api/cms/admin/faqs
POST   /api/cms/admin/faqs
PUT    /api/cms/admin/faqs/:id
DELETE /api/cms/admin/faqs/:id

GET    /api/cms/admin/seo
POST   /api/cms/admin/seo
PUT    /api/cms/admin/seo/:id
DELETE /api/cms/admin/seo/:id

GET    /api/cms/admin/blog/posts
POST   /api/cms/admin/blog/posts
PUT    /api/cms/admin/blog/posts/:id
DELETE /api/cms/admin/blog/posts/:id

GET    /api/cms/admin/blog/categories
POST   /api/cms/admin/blog/categories
PUT    /api/cms/admin/blog/categories/:id
DELETE /api/cms/admin/blog/categories/:id

GET    /api/cms/admin/media
POST   /api/cms/admin/media/upload
DELETE /api/cms/admin/media/:id

GET    /api/cms/admin/pages
POST   /api/cms/admin/pages
GET    /api/cms/admin/pages/:id
PUT    /api/cms/admin/pages/:id
DELETE /api/cms/admin/pages/:id

GET    /api/cms/admin/menus
POST   /api/cms/admin/menus
GET    /api/cms/admin/menus/:id
PUT    /api/cms/admin/menus/:id
DELETE /api/cms/admin/menus/:id
```

## How to Verify Backend Routes

### 1. Check Route Files
Look for route definitions in:
- `fixer-backend/src/modules/cms/routes/admin.ts` or similar
- `fixer-backend/src/routes/cms.ts` or similar

### 2. Check Controller
Verify the controller has testimonial methods:
- `getTestimonials`
- `createTestimonial`
- `updateTestimonial`
- `deleteTestimonial`

### 3. Test the Route
```bash
# Test if route exists (should return 200 or 401, not 404)
curl -X GET http://localhost:8005/api/cms/admin/testimonials \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check Route Registration
Ensure CMS routes are registered in the main app:
```typescript
// In fixer-backend/src/app.ts or main server file
app.use('/api/cms/admin', cmsAdminRoutes);
```

## Expected Response Format

### GET /api/cms/admin/testimonials
```json
{
  "success": true,
  "data": {
    "testimonials": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

Or direct array:
```json
{
  "success": true,
  "data": [...]
}
```

## If Route Doesn't Exist

If the backend route doesn't exist, you need to:

1. **Create the Route:**
   ```typescript
   // In fixer-backend/src/modules/cms/routes/admin.ts
   router.get('/testimonials', cmsController.getTestimonials);
   router.post('/testimonials', cmsController.createTestimonial);
   router.get('/testimonials/:id', cmsController.getTestimonial);
   router.put('/testimonials/:id', cmsController.updateTestimonial);
   router.delete('/testimonials/:id', cmsController.deleteTestimonial);
   ```

2. **Create the Controller Methods:**
   ```typescript
   // In fixer-backend/src/modules/cms/controllers/CMSController.ts
   async getTestimonials(req, res) { ... }
   async createTestimonial(req, res) { ... }
   async updateTestimonial(req, res) { ... }
   async deleteTestimonial(req, res) { ... }
   ```

3. **Create the Service Methods:**
   ```typescript
   // In fixer-backend/src/modules/cms/services/CMSService.ts
   async getTestimonials(query) { ... }
   async createTestimonial(data) { ... }
   async updateTestimonial(id, data) { ... }
   async deleteTestimonial(id) { ... }
   ```

4. **Create the Model:**
   ```typescript
   // In fixer-backend/src/models/Testimonial.ts
   // Define testimonial schema
   ```

## Current Frontend Configuration

- **Base URL:** `http://localhost:8005/api` (from `.env`)
- **Endpoint:** `/cms/admin/testimonials`
- **Final URL:** `http://localhost:8005/api/cms/admin/testimonials` ✅
