# System Restrictions Integration Plan for Investor Application

## Overview
This plan details how to integrate the Governor's system-wide restrictions from the `systemSettings/main` Firestore document into your investor-facing application.

## 📁 Files to Create/Modify

### 1. **Core Service Layer**

#### **Create: `src/services/systemSettingsService.ts`**
```typescript
// Copy the systemSettingsService from the admin app
// This service handles Firestore connection to systemSettings/main
```

#### **Create: `src/types/systemSettings.ts`**
```typescript
// Define TypeScript interfaces for system settings
// Includes SystemControls and SystemSettings interfaces
```

### 2. **Hooks Layer**

#### **Create: `src/hooks/useSystemControls.ts`**
- Real-time listener for system settings changes
- Helper functions for checking specific restrictions
- Maintenance mode detection
- Page access validation

### 3. **Component Layer**

#### **Create: `src/components/common/FunctionalityGuard.tsx`**
- Wraps components to conditionally disable/hide features
- Shows restriction messages when functionality is disabled
- Supports withdrawals, messaging, and profile updates

#### **Create: `src/components/common/SystemRestrictionBanner.tsx`**
- Displays system-wide restriction messages
- Shows maintenance mode notifications
- Lists disabled functionalities
- Animated for urgent restrictions

### 4. **Layout Integration**

#### **Modify: `src/components/layout/InvestorLayout.tsx`**
```typescript
// Add SystemRestrictionBanner to the top of the layout
import SystemRestrictionBanner from '../common/SystemRestrictionBanner';

// In the render method:
<main className="p-6">
  <SystemRestrictionBanner />
  {children}
</main>
```

### 5. **Feature Integration**

#### **Modify: `src/pages/withdrawals/WithdrawalPage.tsx`**
```typescript
import FunctionalityGuard from '../../components/common/FunctionalityGuard';

// Wrap withdrawal functionality:
<FunctionalityGuard functionality="withdrawals">
  <WithdrawalForm />
</FunctionalityGuard>
```

#### **Modify: `src/pages/messages/MessagesPage.tsx`**
```typescript
import FunctionalityGuard from '../../components/common/FunctionalityGuard';

// Wrap messaging functionality:
<FunctionalityGuard functionality="messaging">
  <MessageInterface />
</FunctionalityGuard>
```

#### **Modify: `src/pages/profile/ProfilePage.tsx`**
```typescript
import FunctionalityGuard from '../../components/common/FunctionalityGuard';

// Wrap profile update forms:
<FunctionalityGuard functionality="profileUpdates">
  <ProfileUpdateForm />
</FunctionalityGuard>
```

## 🔧 Implementation Steps

### Step 1: Install Dependencies
```bash
# Ensure you have the same Firebase dependencies as the admin app
npm install firebase framer-motion lucide-react
```

### Step 2: Firebase Configuration
```typescript
// Ensure your Firebase config points to the same project
// The investor app should connect to the same Firestore database
```

### Step 3: Service Layer Setup
1. Copy `systemSettingsService.ts` from admin app
2. Create `systemSettings.ts` type definitions
3. Test Firestore connection to `systemSettings/main`

### Step 4: Hook Implementation
1. Create `useSystemControls.ts` hook
2. Test real-time updates from Firestore
3. Verify helper functions work correctly

### Step 5: Component Development
1. Create `FunctionalityGuard.tsx` component
2. Create `SystemRestrictionBanner.tsx` component
3. Test with different restriction scenarios

### Step 6: Layout Integration
1. Add `SystemRestrictionBanner` to main layout
2. Test banner display with various restriction levels
3. Verify responsive design

### Step 7: Feature Protection
1. Wrap withdrawal functionality with `FunctionalityGuard`
2. Wrap messaging functionality with `FunctionalityGuard`
3. Wrap profile update functionality with `FunctionalityGuard`
4. Test each guard with enabled/disabled states

### Step 8: Testing Scenarios
1. **No Restrictions**: All features work normally
2. **Partial Restrictions**: Some features disabled, others work
3. **Full Restrictions**: Most features disabled, banner shows allowed pages
4. **Maintenance Mode**: Special maintenance banner displayed
5. **Real-time Updates**: Changes in admin app reflect immediately in investor app

## 🎯 Key Features

### **Real-time Synchronization**
- Changes made by Governor in admin app appear instantly in investor app
- No page refresh required
- Automatic UI updates

### **Granular Control**
- Individual feature toggles (withdrawals, messaging, profile updates)
- Page-level access control
- Custom restriction messages

### **Professional UI**
- Consistent styling with existing app
- Clear restriction messages
- Professional color scheme and typography

### **Graceful Degradation**
- Features hide gracefully when disabled
- Informative fallback messages
- Maintains app usability during restrictions

## 🔒 Security Considerations

### **Firestore Rules**
Ensure your Firestore rules allow investors to read system settings:
```javascript
// In firestore.rules
match /systemSettings/{document} {
  // All authenticated users can read system settings
  allow read: if request.auth != null;
  // Only governor can write
  allow write: if isGovernor();
}
```

### **Client-side Validation**
- All restrictions are enforced on the client side
- Server-side validation should also respect these settings
- Consider implementing server-side checks for critical operations

## 📱 Mobile Responsiveness
- All components are mobile-responsive
- Banners adapt to smaller screens
- Touch-friendly interaction elements

## 🚀 Deployment Checklist
- [ ] Firebase configuration matches admin app
- [ ] Firestore rules allow reading system settings
- [ ] All components render correctly
- [ ] Real-time updates work
- [ ] Mobile responsiveness verified
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility features included

This integration ensures that Governor restrictions set in the admin application are immediately and consistently enforced across the investor-facing application.