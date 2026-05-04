# Driveway Estimator Pro

A professional-grade mobile application that allows homeowners and contractors to capture driveway photos, automatically measure square footage using AI vision, visualize different materials, get real-time local pricing, and share estimates with contractors.

## Features

### Core Functionality
- **📸 Camera Capture**: Take photos of driveways using device camera or upload existing images
- **🤖 AI Edge Detection**: Automatically detect driveway boundaries using LLM vision analysis
- **📐 Manual Adjustment**: Fine-tune measurements with draggable corner points
- **🎨 Material Visualization**: Preview how different materials (hotmix, millings, tar & chip, gravel) look on the specific driveway
- **💰 Real-Time Pricing**: Get accurate material costs based on your location and current regional prices
- **📊 Project Dashboard**: Save and manage all your driveway estimates
- **🔗 Contractor Sharing**: Generate shareable links for contractors with PDF export
- **📧 Email Notifications**: Automatic notifications for homeowners and contractors

### Supported Materials
- **Hot Mix Asphalt** - Professional durable surface
- **Asphalt Millings** - Recycled asphalt, budget-friendly
- **Tar & Chip** - Rustic appearance, good traction
- **Gravel** - Most economical option

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Responsive design
- **Capacitor** - Native iOS/Android wrapper
- **tRPC** - End-to-end type safety

### Backend
- **Express.js** - Node.js server framework
- **tRPC** - Type-safe API procedures
- **Drizzle ORM** - Type-safe database queries
- **MySQL/TiDB** - Database

### Mobile
- **Capacitor** - Cross-platform native app framework
- **@capacitor/camera** - Native camera access
- **@capacitor/geolocation** - GPS location services

### AI & Services
- **LLM Vision** - Automatic edge detection
- **Image Generation** - Photorealistic material previews
- **jsPDF** - PDF export functionality
- **S3 Storage** - Photo and preview storage

## Project Structure

```
driveway-estimator-pro/
├── client/                 # React web app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and hooks
│   │   └── App.tsx        # Main app router
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routers/           # tRPC procedure definitions
│   ├── services/          # Business logic (pricing, edge detection, email)
│   ├── db.ts              # Database queries
│   └── _core/             # Framework code
├── drizzle/               # Database schema and migrations
├── ios/                   # iOS native project (Xcode)
├── android/               # Android native project (Gradle)
├── capacitor.config.ts    # Capacitor configuration
├── package.json           # Dependencies and scripts
└── MOBILE_BUILD.md        # Mobile build instructions
```

## Getting Started

### Prerequisites
- Node.js 16+ and pnpm
- For mobile development: Xcode (iOS) and/or Android Studio (Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/DaddyFilth/driveway-estimator-pro.git
cd driveway-estimator-pro

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development

**Web Development:**
```bash
pnpm dev
# Opens at http://localhost:3000
```

**Mobile Development:**
```bash
# iOS
pnpm mobile:ios

# Android
pnpm mobile:android
```

See [MOBILE_BUILD.md](./MOBILE_BUILD.md) for detailed mobile development instructions.

### Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/services/pricing.test.ts

# Watch mode
pnpm test --watch
```

### Building

**Web Build:**
```bash
pnpm build
pnpm start
```

**Mobile Build:**
```bash
# Build web assets and sync to native projects
pnpm mobile:build

# Create iOS release build
pnpm mobile:build-ios

# Create Android release build
pnpm mobile:build-android
```

## API Documentation

### tRPC Procedures

#### Projects
- `projects.list` - Get all user projects
- `projects.getById` - Get specific project details
- `projects.create` - Create new project with measurements
- `projects.update` - Update project details
- `projects.delete` - Delete a project
- `projects.uploadPhotoAndDetectEdges` - Upload photo and detect driveway boundaries
- `projects.getPricing` - Get material pricing for location
- `projects.generateMaterialPreview` - Generate photorealistic material preview
- `projects.createShareLink` - Generate shareable contractor link
- `projects.getSharedProject` - Access shared project (public)
- `projects.downloadPDF` - Download project as PDF

#### Authentication
- `auth.me` - Get current user info
- `auth.logout` - Log out current user

## Database Schema

### Users
- `id` - Primary key
- `openId` - OAuth identifier
- `name` - User name
- `email` - Email address
- `role` - admin | user
- `createdAt`, `updatedAt`, `lastSignedIn` - Timestamps

### Projects
- `id` - Primary key
- `userId` - Project owner
- `photoUrl` - Original driveway photo
- `squareFeet` - Calculated area
- `depthInches` - Driveway depth
- `cornerPoints` - JSON array of corner coordinates
- `selectedMaterial` - Material type
- `quantityNeeded` - Material quantity
- `pricePerUnit` - Cost per unit
- `totalCost` - Total estimate
- `previewImageUrl` - Material preview image
- `contractorEmail` - Optional contractor email
- `zipCode` - Location for pricing
- `latitude`, `longitude` - GPS coordinates
- `notes` - Project notes
- `createdAt`, `updatedAt` - Timestamps

### ProjectShares
- `id` - Primary key
- `projectId` - Shared project
- `shareToken` - Unique share token
- `contractorEmail` - Contractor email (optional)
- `createdAt` - Share creation date

### MaterialPrices
- `id` - Primary key
- `zipCode` - Location
- `material` - Material type
- `pricePerUnit` - Cost per unit
- `supplier` - Supplier name
- `lastUpdated` - Price update timestamp

## Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your_jwt_secret_key
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# API Keys
BUILT_IN_FORGE_API_KEY=your_api_key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# App Configuration
VITE_APP_TITLE="Driveway Estimator Pro"
VITE_APP_LOGO=https://example.com/logo.png
```

## Production Deployment

### Web Deployment
The application is deployed using Manus built-in hosting. See the Management UI for deployment options.

### Mobile Distribution

**iOS (Internal Testing):**
1. Build release: `pnpm mobile:build-ios`
2. Archive in Xcode
3. Distribute via TestFlight or Ad Hoc

**Android (Internal Testing):**
1. Build release: `pnpm mobile:build-android`
2. Share APK or upload to Google Play Console internal testing track

See [MOBILE_BUILD.md](./MOBILE_BUILD.md) for detailed instructions.

## Testing

The project includes comprehensive test coverage:

- **Edge Detection Tests** - Verify AI boundary detection accuracy
- **Pricing Service Tests** - Test material cost calculations
- **PDF Export Tests** - Validate PDF generation
- **Authentication Tests** - Verify auth flow
- **Projects Router Tests** - Test all tRPC procedures

Run tests with: `pnpm test`

## Performance Optimizations

- **Code Splitting** - Dynamic imports for large dependencies (jsPDF)
- **Image Optimization** - S3 storage with lazy loading
- **Database Caching** - Material prices cached by ZIP code
- **Mobile-First CSS** - Responsive design optimized for field use
- **Lazy Loading** - Components load on demand

## Known Limitations

- Pricing uses mock data (integrate real supplier APIs for production)
- Email notifications log to console (integrate SendGrid/AWS SES)
- Geolocation defaults to ZIP 10001 (implement reverse geocoding)
- Mobile corner dragging uses mouse events (add touch/pointer for full mobile support)
- LiDAR depth sensor not implemented (requires Capacitor integration)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test: `pnpm test`
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests:
- Check existing GitHub issues
- Review [MOBILE_BUILD.md](./MOBILE_BUILD.md) for mobile-specific help
- Contact the development team

## Roadmap

- [ ] Real supplier API integration for live pricing
- [ ] SendGrid email integration for notifications
- [ ] Reverse geocoding for automatic location detection
- [ ] Capacitor LiDAR support for depth sensing
- [ ] Touch/pointer event support for mobile corner dragging
- [ ] Offline mode for field use without connectivity
- [ ] Contractor dashboard for viewing shared projects
- [ ] Payment integration for booking contractors
- [ ] Multi-language support
- [ ] Dark mode toggle

## Changelog

### v1.0.0 (Initial Release)
- Core driveway measurement and estimation
- AI-powered edge detection
- Material visualization and pricing
- Project persistence and sharing
- Mobile app support (iOS/Android via Capacitor)
- PDF export functionality
