# 🧪 Quick Test Guide - Token Refresh Fix

## ✅ Backend Verification

### Test 1: Endpoint Exists
```bash
curl -X POST http://localhost:8005/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"test"}'
```

**Expected**: 401 Unauthorized (with "Invalid or expired refresh token")  
**Status**: ✅ PASS - Endpoint exists and validates tokens

---

## 🧪 Frontend Testing Steps

### Test 1: Login with Remember Me

1. **Clear localStorage first**:
```javascript
// Open browser console
localStorage.clear()
```

2. **Login with credentials**:
   - ✅ Check "Remember Me"
   - Click "Sign In"

3. **Verify localStorage**:
```javascript
// In browser console
console.log('User:', localStorage.getItem('user'))
console.log('Token:', localStorage.getItem('token'))
console.log('RefreshToken:', localStorage.getItem('refreshToken'))
```

**Expected**: All three should exist  
**Status**: ✅ Should PASS

---

### Test 2: Token Refresh Works

1. **Login successfully**

2. **Open browser console**:
```javascript
// Manually expire the access token (simulate expiry)
const state = JSON.parse(localStorage.getItem('persist:root'))
const auth = JSON.parse(state.auth)
auth.tokenExpiry = Date.now() - 1000  // Set to past
state.auth = JSON.stringify(auth)
localStorage.setItem('persist:root', JSON.stringify(state))
```

3. **Refresh page**

4. **Make any API call** (navigate to any page that fetches data)

5. **Check console logs**:
```
Token expired, attempting to refresh...
Refreshing token with refreshToken: <token>
Retrying request with new token...
```

**Expected**: Automatic token refresh, no logout  
**Status**: ✅ Should PASS

---

### Test 3: Invalid Refresh Token

1. **Login successfully**

2. **Corrupt refresh token**:
```javascript
// In browser console
const state = JSON.parse(localStorage.getItem('persist:root'))
const auth = JSON.parse(state.auth)
auth.refreshToken = 'invalid_token'
state.auth = JSON.stringify(auth)
localStorage.setItem('persist:root', JSON.stringify(state))
```

3. **Refresh page**

4. **Make any API call**

**Expected**: Automatic logout and redirect to login  
**Status**: ✅ Should PASS

---

### Test 4: Signup Flow

1. **Clear localStorage**:
```javascript
localStorage.clear()
```

2. **Sign up with new account**

3. **Verify tokens saved**:
```javascript
console.log('User:', localStorage.getItem('user'))
console.log('Token:', localStorage.getItem('token'))
console.log('RefreshToken:', localStorage.getItem('refreshToken'))
```

**Expected**: All three should exist  
**Status**: ✅ Should PASS

---

## 🔍 Debug Commands

### Check Redux State
```javascript
// In browser console
JSON.parse(localStorage.getItem('persist:root'))
```

### Check Auth State
```javascript
// In browser console
const state = JSON.parse(localStorage.getItem('persist:root'))
console.log(JSON.parse(state.auth))
```

### Force Token Refresh
```javascript
// In browser console
const refreshToken = localStorage.getItem('refreshToken')
fetch('http://localhost:8005/api/auth/refresh-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ refreshToken })
})
.then(r => r.json())
.then(data => console.log('Refresh result:', data))
```

---

## 📊 Success Criteria

- ✅ RefreshToken saved to localStorage on login
- ✅ RefreshToken saved to localStorage on signup
- ✅ Automatic token refresh on 401 errors
- ✅ Single refresh call for concurrent requests
- ✅ No infinite loops on auth endpoints
- ✅ Graceful logout on refresh failure
- ✅ Console logs show refresh flow

---

## 🐛 Common Issues

### Issue: "No refresh token available"
**Cause**: Token not saved during login  
**Fix**: Ensure "Remember Me" is checked, or check redux-persist

### Issue: Infinite refresh loop
**Cause**: Refresh endpoint also returns 401  
**Fix**: Verify endpoint exclusion in interceptor

### Issue: Token expired immediately
**Cause**: Server time mismatch  
**Fix**: Sync server time or increase token expiry

---

## 📝 Quick Checklist

Before deploying:
- [ ] Test login with Remember Me
- [ ] Test signup flow
- [ ] Test automatic token refresh
- [ ] Test invalid refresh token handling
- [ ] Test concurrent requests
- [ ] Check console for errors
- [ ] Verify no infinite loops
- [ ] Test logout functionality

---

**Last Updated**: 2025-10-29  
**Status**: Ready for Testing ✅

