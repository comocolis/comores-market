# Analytics Setup Guide

## Google Analytics 4 Integration ✅

Your app is now fully integrated with Google Analytics 4 (GA4).

### Setup Instructions

#### Step 1: Add Environment Variable

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the following line:

```env
NEXT_PUBLIC_GA_ID=G-4BK10CRPPP
```

3. Save the file

#### Step 2: Restart Development Server

```bash
npm run dev
```

#### Step 3: Verify Integration

1. Open your app in browser: `http://localhost:3000`
2. Open DevTools (F12) → Network tab
3. Filter by "gtag" or "googletagmanager"
4. You should see requests to `www.googletagmanager.com`
5. Look for the Measurement ID `G-4BK10CRPPP` in the requests

#### Step 4: Check GA4 Real-Time Report

1. Go to [Google Analytics 4](https://analytics.google.com)
2. Select your property
3. Navigate to: **Reports** → **Real-time**
4. Within 1-2 seconds, you should see:
   - Active users (showing "1")
   - Recent events (page_view)
   - Location data

---

## What Gets Tracked

### Automatic Tracking:
- ✅ Page views (every route change)
- ✅ Session data
- ✅ Device & browser info
- ✅ Geographic location

### Custom Events:
- ✅ Product searches
- ✅ Category navigation
- ✅ Filter applications
- ✅ Add to favorites
- ✅ Listing creation
- ✅ Boost purchases
- ✅ Pro subscriptions
- ✅ Message sending

---

## Configuration File

Your `.env.example` file already contains the template:

```env
NEXT_PUBLIC_GA_ID=G-4BK10CRPPP
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-16447515729
```

---

## GA4 Dashboard Setup

### Create Custom Dashboard (Recommended):

1. GA4 Dashboard → Click "Create New" → "Dashboard"
2. Add widgets for:
   - **Realtime Users**
   - **Page Views by Page**
   - **Events by Event Name**
   - **Conversions**
   - **User Demographics**

### Key Reports to Check:

1. **Engagement Overview**
   - Path: Reports → Life cycle → Engagement → Overview

2. **User Acquisition**
   - Path: Reports → Life cycle → Acquisition → User acquisition

3. **Monetization** (if applicable)
   - Path: Reports → Monetization

4. **Retention**
   - Path: Reports → Life cycle → Retention

---

## Troubleshooting

### Issue: No events showing in GA4

**Solution:**
1. Verify `.env.local` has the correct GA4 ID
2. Restart the dev server
3. Wait 24-48 hours for historical data (real-time shows instantly)
4. Check DevTools Network tab for googletagmanager requests

### Issue: Events not showing in real-time

**Solution:**
1. Open DevTools Console
2. Type: `window.gtag('event', 'test_event')`
3. Go to GA4 Real-time report
4. Should see new event within 2 seconds

### Issue: "NEXT_PUBLIC_GA_ID is undefined"

**Solution:**
1. Verify file is named `.env.local` (not `.env`)
2. Restart dev server
3. Check syntax: `NEXT_PUBLIC_GA_ID=G-4BK10CRPPP` (no quotes)

---

## Production Deployment

When deploying to production:

1. Add environment variable to your hosting platform:
   - **Netlify**: Site settings → Build & deploy → Environment
   - **Vercel**: Project settings → Environment variables
   - **Other**: Add to your deployment configuration

```
NEXT_PUBLIC_GA_ID=G-4BK10CRPPP
```

2. GA4 will automatically switch to production data
3. Monitor reports 24 hours after deployment

---

## Testing Analytics Events

You can test specific events in the console:

```javascript
// Test page view
window.gtag('event', 'page_view', {
  page_path: '/test',
  page_title: 'Test Page'
});

// Test custom event
window.gtag('event', 'search', {
  search_term: 'test search'
});

// Test conversion
window.gtag('event', 'conversion', {
  conversion_value: 100,
  currency: 'KMF'
});
```

---

## Support Resources

- [GA4 Property Setup](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Tracking](https://support.google.com/analytics/answer/9267744)
- [GA4 Conversion Tracking](https://support.google.com/analytics/answer/12074944)
- [Google Analytics Real-time Report](https://support.google.com/analytics/answer/1638635)

---

## Next Steps

1. ✅ Add GA4 ID to `.env.local`
2. ✅ Restart dev server
3. ✅ Verify in GA4 Real-time report
4. ✅ Monitor Events for 24 hours
5. ✅ Create custom dashboards
6. ✅ Set up conversion goals
7. ✅ Implement Google Search Console

**Your analytics are now ready to track all user interactions!** 📊
