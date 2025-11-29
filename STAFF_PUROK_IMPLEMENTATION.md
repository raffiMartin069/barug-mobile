# Staff Purok Assignment Implementation

## Overview
This implementation fetches and displays staff's assigned puroks (sitios) when they log in. The system retrieves purok assignments from the `staff_purok_assignment` table and joins with the `purok_sitio` table to get the purok names.

## Files Created/Modified

### 1. New Service: `services/staffPurok.ts`
- **Purpose**: Fetch staff purok assignments with purok details
- **Function**: `fetchStaffPurokAssignments(staffId: number)`
- **Returns**: Array of assignments with purok names and codes
- **Query**: Joins `staff_purok_assignment` with `purok_sitio` table

### 2. Updated Service: `services/profile.ts`
- **Modified**: `fetchResidentPlus()` function
- **Changes**: 
  - Now fetches staff purok assignments when staff_id exists
  - Adds `staff_purok_assignments` to the details object
  - Returns assignments in the result object

### 3. New Hook: `hooks/useStaffPuroks.ts`
- **Purpose**: Reusable hook to access staff purok assignments
- **Returns**:
  - `assignments`: Full assignment objects with purok details
  - `purokIds`: Array of purok_sitio_id values
  - `purokNames`: Array of purok names
  - `hasAssignments`: Boolean indicating if staff has assignments

### 4. Updated Screen: `app/(bhw)/(tabs)/bhwhome.tsx`
- **Changes**:
  - Imports and uses `useStaffPuroks` hook
  - Displays assigned puroks in a card with chips
  - Shows purok name and code for each assignment
  - Only displays when staff has assignments

## Data Flow

```
1. Staff logs in
   ↓
2. fetchResidentPlus() is called
   ↓
3. If staff_id exists, fetchStaffPurokAssignments() is called
   ↓
4. Query: staff_purok_assignment JOIN purok_sitio
   ↓
5. Assignments added to profile.staff_purok_assignments
   ↓
6. Profile stored in useAccountRole store
   ↓
7. useStaffPuroks() hook reads from store
   ↓
8. BHW home screen displays assigned puroks
```

## Database Schema

### staff_purok_assignment
- `staff_purok_id` (PK)
- `staff_id` (FK to staff)
- `purok_sitio_id` (FK to purok_sitio)
- `assigned_from` (date)
- `assigned_to` (date, nullable)
- `is_active` (boolean)
- `staff_acc_req_id` (nullable)

### purok_sitio
- `purok_sitio_id` (PK)
- `purok_sitio_code` (e.g., "S04")
- `purok_sitio_name` (e.g., "MAUCO")

## Usage Examples

### In any component:
```typescript
import { useStaffPuroks } from '@/hooks/useStaffPuroks'

function MyComponent() {
  const { assignments, purokNames, hasAssignments } = useStaffPuroks()
  
  if (!hasAssignments) {
    return <Text>No puroks assigned</Text>
  }
  
  return (
    <View>
      {assignments.map(a => (
        <Text key={a.staff_purok_id}>
          {a.purok_sitio_name} ({a.purok_sitio_code})
        </Text>
      ))}
    </View>
  )
}
```

### Direct access from profile:
```typescript
import { useAccountRole } from '@/store/useAccountRole'

function MyComponent() {
  const { getProfile } = useAccountRole()
  const profile = getProfile('resident')
  const assignments = profile?.staff_purok_assignments || []
  
  // Use assignments...
}
```

## Features
- ✅ Fetches active purok assignments only (`is_active = true`)
- ✅ Joins with purok_sitio table to get names and codes
- ✅ Cached in profile store (refreshes every 5 minutes)
- ✅ Reusable hook for easy access
- ✅ Visual display with chips on BHW home screen
- ✅ Handles multiple purok assignments per staff

## Testing
1. Log in as a staff member with purok assignments
2. Navigate to BHW home screen
3. Verify assigned puroks are displayed
4. Check console logs for assignment data

## Future Enhancements
- Filter data by assigned puroks
- Show assignment date ranges
- Add purok selection for filtering
- Display purok statistics
