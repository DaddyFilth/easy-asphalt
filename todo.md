# Driveway Estimator Pro - Implementation TODO

## Phase 1: Database & Schema
- [ ] Define projects table with user_id, photo_url, measurements, material, pricing
- [ ] Define project_shares table for contractor sharing with unique tokens
- [ ] Define material_prices table for caching regional pricing
- [ ] Create Drizzle migrations and apply to database

## Phase 2: Backend API
- [x] Create tRPC procedure for camera photo upload to S3
- [x] Create tRPC procedure for AI edge detection (LLM vision analysis)
- [x] Create tRPC procedure for local pricing lookup by ZIP code
- [x] Create tRPC procedure for material preview image generation
- [x] Create tRPC procedure for project CRUD (create, read, update, delete)
- [x] Create tRPC procedure for project share link generation
- [x] Create tRPC procedure for sending email notifications (owner + contractor)
- [x] Implement geolocation service to get user ZIP code
- [x] Implement email service integration (SendGrid or similar)
- [x] Write vitest tests for all backend procedures (22 tests passing: pricing, edge detection, auth, projects router)

## Phase 3: Frontend - Camera & Measurement
- [x] Build camera capture component with device permissions
- [x] Build photo upload fallback for desktop testing
- [x] Build corner adjustment UI with draggable markers
- [x] Display AI-detected measurements (square feet)
- [x] Display manual depth input or LiDAR sensor reading
- [x] Build material selector grid (hotmix, millings, tar and chip, gravel)
- [x] Display material pricing and quantity needed
- [x] Create projects dashboard page
- [ ] Add touch/pointer event support for mobile corner dragging
- [ ] Recalculate square footage when corners are adjusted
- [ ] Add permission denied/unavailable error handling for camera

## Phase 4: Frontend - Visualization & Sharing
- [ ] Build material preview canvas overlay
- [ ] Integrate AI image generation for photorealistic material render
- [ ] Build project dashboard with saved projects list
- [ ] Build project detail view with all measurements and pricing
- [ ] Build contractor share UI with email input and link generation
- [ ] Build shareable project summary page (public view)
- [ ] Build PDF export for project summary

## Phase 5: Integration & Testing
- [ ] End-to-end test: capture → measure → select material → generate preview → save project
- [ ] End-to-end test: share project → send email → verify contractor can access
- [ ] Test geolocation and pricing accuracy
- [ ] Test responsive design on mobile devices
- [ ] Performance optimization for image processing
- [ ] Error handling and user feedback for all flows

## Phase 6: Deployment & Polish
- [ ] Create final checkpoint
- [ ] Verify all features working in production
- [ ] Document API endpoints and usage
- [ ] Prepare for user delivery


## Production Readiness Notes

### Backend Services (Needs Real Integration)
- Pricing Service: Currently uses mockPricingByZip. Replace with real supplier API (e.g., landscape supply vendors, asphalt producers)
- Email Service: Currently logs to console. Integrate with SendGrid, AWS SES, or Postmark for production
- Geolocation: Currently defaults to ZIP 10001. Implement reverse geocoding to convert lat/lng to ZIP code

### Frontend Enhancements
- Mobile Touch Support: Add touch/pointer events for corner dragging on mobile devices
- Corner Adjustment: Recalculate square footage dynamically when corners are adjusted
- Error Handling: Add permission denied/unavailable states for camera access
- LiDAR Integration: Add depth sensor support for iPhone Pro devices (requires Capacitor)

### Testing
- Unit tests for all backend procedures using vitest
- Integration tests for photo upload, edge detection, and pricing flows
- End-to-end tests for complete project creation and sharing workflow
