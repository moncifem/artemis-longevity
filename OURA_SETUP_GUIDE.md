# Oura Ring Integration Guide

## 🎯 Overview
The Artemis Longevity app integrates with Oura Ring to automatically sync your health data and provide personalized insights.

---

## 📍 Where to Connect Your Oura Ring

### Option 1: From Profile Screen (Recommended)
1. Open the app and go to the **Profile** tab (bottom navigation)
2. Look for **"Connected Devices"** section at the top
3. Tap on **"Oura Ring 💍"**
4. Follow the connection steps below

### Option 2: Direct Navigation
- Navigate to `/oura-connect` screen in the app

---

## 🔑 How to Get Your Oura API Token

### Step 1: Get Your Personal Access Token
1. Go to [cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Log in with your Oura account
3. Click **"Create A New Personal Access Token"**
4. Give it a name (e.g., "Artemis Longevity")
5. **Copy the token** - you'll need it in the next step

### Step 2: Connect in the App
1. Open the Oura Connect screen in the app
2. Paste your token in the input field
3. Tap **"Connect Oura Ring 💍"**
4. Wait for confirmation ✨

---

## ✨ What Data Gets Synced

Once connected, the app will automatically sync:

### 📊 Activity Data
- Daily steps
- Active calories burned
- Activity score
- Movement metrics

### 💤 Sleep Data
- Sleep score
- Sleep duration
- Sleep efficiency
- Deep sleep percentage

### ❤️ Readiness Data
- Readiness score
- Resting heart rate
- HRV (Heart Rate Variability)
- Body temperature deviation

### 🎯 Fitness Calculations
- **Fitness Age** - calculated from your Oura scores
- **Auto-filled assessments** - endurance and cardio tests pre-populated
- **Health recommendations** - personalized based on your data

---

## 🔐 Privacy & Security

- **Your token is stored locally** on your device only
- **No cloud storage** - we don't store your token on our servers
- **You control your data** - disconnect anytime from the app
- **Secure API** - all requests use HTTPS encryption

---

## 🎨 Features Enabled with Oura

### 1. Auto-Fill User Profile
- Age, height, weight automatically populated
- No manual data entry needed

### 2. Smart Assessments
- **Endurance test**: Estimated from your activity levels
- **Cardio test**: Based on resting heart rate
- **Grip strength**: Manual input (no sensor data)
- **Flexibility**: Manual input

### 3. Real-Time Health Summary
View on the Oura Connect screen:
- Activity score with daily steps
- Sleep score with average hours
- Readiness score with resting HR
- Calculated fitness age

### 4. Enhanced Reports
- More accurate fitness age calculations
- Trend analysis over time (7-day default)
- Personalized recommendations based on actual data

---

## 🛠️ Troubleshooting

### "Connection Failed" Error
**Solutions:**
1. Check your internet connection
2. Verify your token is copied correctly (no extra spaces)
3. Make sure your Oura account is active
4. Try generating a new token

### "No Data Available"
**Solutions:**
1. Make sure you're wearing your Oura Ring
2. Sync your ring with the Oura app first
3. Wait a few hours for data to populate
4. Check if your ring has recent data in the Oura app

### Token Not Working
**Solutions:**
1. Go back to [cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Delete the old token
3. Create a new one
4. Update it in the app

---

## 📱 Using Without Oura

Don't have an Oura Ring? No problem!
- All features work with manual input
- Manual assessments are still valid
- Grip strength test uses scientific normative data
- You can still track progress over time

---

## 🔄 Disconnecting Your Oura Ring

To disconnect:
1. Go to Profile → Connected Devices → Oura Ring
2. Scroll down
3. Tap **"Disconnect Oura Ring"**
4. Confirm

Your local data remains, but syncing stops.

---

## 💡 Tips for Best Results

1. **Wear your ring consistently** - 24/7 for best data
2. **Sync daily** - Open the Oura app to sync your ring
3. **Check connection weekly** - Verify data is up to date
4. **Retake assessments** - Every month to track progress

---

## 🎉 Benefits

✅ **No manual data entry** - Everything synced automatically  
✅ **Accurate fitness age** - Based on real health metrics  
✅ **Track progress** - See improvements over time  
✅ **Personalized insights** - Recommendations based on your data  
✅ **Science-based** - Uses validated health algorithms  

---

## 📊 Data Mapping

| Oura Metric | Artemis Assessment |
|-------------|-------------------|
| Activity Score + Steps | Endurance Level |
| Resting Heart Rate | Cardio Fitness |
| Readiness Score | Overall Health |
| Activity + Sleep + Readiness | Fitness Age |
| Manual Input | Grip Strength |
| Manual Input | Flexibility |

---

## 🆘 Need Help?

- **In-app**: Tap "?" on the Oura Connect screen
- **Oura Support**: [support.ouraring.com](https://support.ouraring.com)
- **API Docs**: [cloud.ouraring.com/v2/docs](https://cloud.ouraring.com/v2/docs)

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0

