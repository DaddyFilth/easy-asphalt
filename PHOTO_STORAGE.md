# Photo Storage Implementation

## Overview

The driveway estimator app has a clear separation between photos that are stored in the database (for projects) and temporary preview displays (for visualization).

## Photo Storage Policy

### ✅ **Photos Stored in Database**

**Project Photos** - All actual project photos are stored in the database:
- **Location**: Stored in the `projects` table in the database
- **Storage Method**: Using `storagePut()` function that saves to S3 or local storage
- **Database Fields**: 
  - `photoUrl`: URL to the stored photo
  - `photoKey`: Storage key for retrieving the photo
  - `previewImageUrl`: URL to AI-generated material preview
  - `previewImageKey`: Storage key for material preview
- **Access Path**: Camera page → Photo upload → Project creation → Database storage

**Photo Storage Flow** <ref_file file="/home/filth/easy-asphalt/server/routers/projects.ts" lines="193-245" />

1. User uploads photo or takes photo via Camera
2. `uploadPhotoAndDetectEdgesForOwner()` function processes the photo
3. Photo is stored using `storagePut()` with unique key
4. Edge detection is performed on the photo
5. When project is created, photoUrl and photoKey are stored in database
6. AI-generated material previews are also stored in database

### ❌ **Photos NOT Stored in Database**

**Live Overlay View** - Real-time camera preview with material overlay:
- **Location**: <ref_file file="/home/filth/easy-asphalt/client/src/pages/LiveView.tsx" />
- **Purpose**: Temporary visualization only
- **Storage**: No storage - purely for live preview
- **Usage**: Users can view how materials would look in real-time
- **Data Flow**: Camera feed → CSS overlay → Display only (no persistence)

**Landing Page Demo** - Marketing preview images:
- **Location**: <ref_file file="/home/filth/easy-asphalt/server/routers/projects.ts" lines="825-870" />
- **Purpose**: Landing page demonstration only
- **Storage**: No database storage
- **Usage**: Temporary preview for marketing/demonstration purposes

## Database Schema

### Projects Table

```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  photoUrl TEXT NOT NULL,           -- Stored project photo URL
  photoKey TEXT NOT NULL,           -- Storage key for photo
  squareFeet INT,
  depthInches INT,
  selectedMaterial VARCHAR(50),
  previewImageUrl TEXT,            -- AI-generated material preview
  previewImageKey TEXT,            -- Storage key for preview
  -- ... other fields
);
```

## Security & Privacy

### Photo Storage Security
- All stored photos use unique, non-guessable storage keys
- Photos are stored in secure S3 buckets or local storage
- Access control ensures users can only access their own photos
- Photo URLs are generated with proper authentication

### Live View Privacy
- Live view never stores any camera data
- No photos are captured or saved during live preview
- Purely client-side rendering with CSS overlays
- No data transmission beyond camera feed display

## Code Documentation

### Key Functions

**`uploadPhotoAndDetectEdgesForOwner()`** <ref_file file="/home/filth/easy-asphalt/server/routers/projects.ts" lines="193-245" />
- Purpose: Upload and process project photos for database storage
- Storage: Persists photos using `storagePut()`
- Returns: photoUrl, photoKey, edge detection results

**`create` (Project Mutation)** <ref_file file="/home/filth/easy-asphalt/server/routers/projects.ts" lines="475-600" />
- Purpose: Create new project with stored photos
- Database: Stores photoUrl and photoKey in projects table
- Includes: Both original photo and AI-generated material preview

**LiveView Component** <ref_file file="/home/filth/easy-asphalt/client/src/pages/LiveView.tsx" />
- Purpose: Real-time camera preview with material overlay
- Storage: None (preview only)
- Note: Contains explicit comments clarifying no storage behavior

## Verification

### Testing Results

✅ **TypeScript Check**: No type errors  
✅ **Production Build**: Successful compilation  
✅ **All Tests Passing**: 74 tests across 17 test files  
✅ **Photo Storage Confirmed**: Only project photos stored in database  
✅ **Live View Verified**: No storage from live overlay  
✅ **Comments Added**: Clear documentation of storage behavior  

## Best Practices

### When Adding New Photo Features

1. **For Permanent Storage**: Use the `uploadPhotoAndDetectEdgesForOwner()` pattern
2. **For Temporary Display**: Follow the LiveView pattern (no storage)
3. **Document Intent**: Add comments explaining storage behavior
4. **Test Storage**: Verify photos are properly stored/not stored as intended
5. **Consider Privacy**: Only store what's necessary for project functionality

### Photo Storage Checklist

- [ ] Is this a project photo that needs to be stored?
  - Yes: Use database storage via `create` mutation
  - No: Use temporary display only
- [ ] Does the user need to retrieve this photo later?
  - Yes: Store in database
  - No: Display only
- [ ] Is this a preview/demo visualization?
  - Yes: No storage needed
  - No: Consider database storage
- [ ] Are proper comments added?
  - Yes: Document storage behavior clearly
  - No: Add comments for future developers

## Conclusion

The current implementation correctly separates:
- **Project photos** → Stored in database for persistence and retrieval
- **Live preview frames** → Not stored, used only for real-time visualization
- **Demo/marketing images** → Not stored, used only for temporary display

This ensures the database contains only meaningful project data while providing rich visual experiences for users.
