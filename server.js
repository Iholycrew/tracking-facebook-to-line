const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Cookie parser middleware
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route - redirect to Facebook LIFF page with query parameters
app.get('/', (req, res) => {
    const queryString = req.url.split('?')[1];
    const redirectUrl = queryString ? `/facebook?${queryString}` : '/facebook';
    res.redirect(redirectUrl);
});

// Facebook LIFF route
app.get('/facebook', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'liff-facebook.html'));
});

// LINE LIFF route
app.get('/line', (req, res) => {    
    res.sendFile(path.join(__dirname, 'public', 'liff-line.html'));
});

// Seed endpoint - set all query parameters as cookies
app.get('/seed', (req, res) => {
    const params = req.query;
    const cookieOptions = {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow JavaScript access
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
    };

    // ดึง prefix จาก parameters (ถ้ามี)
    const prefix = params.prefix || '';
    console.log('📋 Setting cookies from parameters:', params);
    console.log('🏷️ Prefix:', prefix || '(no prefix)');

    // Track cookies that were set
    const setCookies = {};

    // Set each query parameter as a cookie (with optional prefix)
    Object.keys(params).forEach(key => {
        const value = params[key];
        
        // Skip setting prefix as a cookie
        if (key === 'prefix') {
            return;
        }
        
        // Create cookie key with prefix if provided
        const cookieKey = prefix ? `${prefix}_${key}` : key;
        
        res.cookie(cookieKey, value, cookieOptions);
        setCookies[cookieKey] = value;
        console.log(`🍪 Cookie set: ${cookieKey} = ${value}`);
    });

    // Check if line_id parameter exists for redirect
    if (params.line_id) {
        const lineId = params.line_id;
        const lineAddFriendUrl = `https://line.me/R/ti/p/${lineId}`;
        
        console.log(`🔗 Redirecting to LINE add friend: ${lineAddFriendUrl}`);
        
        // Redirect to LINE add friend page
        res.redirect(lineAddFriendUrl);
    } else {
        // Respond with success and cookie information if no line_id
        res.json({
            message: 'Parameters saved as cookies successfully',
            prefix: prefix || '(no prefix)',
            originalParameters: params,
            setCookies: setCookies,
            cookieCount: Object.keys(setCookies).length,
            cookieOptions: {
                maxAge: '30 days',
                httpOnly: false,
                secure: false,
                sameSite: 'lax'
            },
            timestamp: new Date().toISOString(),
            note: 'No line_id parameter found, so no redirect to LINE add friend'
        });
    }
});

// Go endpoint - read all cookies and redirect to rurl with cookies as parameters
app.get('/go', (req, res) => {
    const cookies = req.cookies || {};
    const queryParams = req.query || {};
    
    console.log('📋 Reading cookies:', cookies);
    console.log('📋 Reading query params:', queryParams);

    // ดึง prefix จาก query parameters
    const prefix = queryParams.prefix || '';
    console.log('🏷️ Prefix:', prefix || '(no prefix)');

    let redirectUrl;
    let sourceData = {};
    let dataSource;

    // Function to filter cookies by prefix
    const filterCookiesByPrefix = (cookies, prefix) => {
        const filtered = {};
        
        // ถ้าไม่มี prefix ให้ return object ว่างเลย (ไม่อ่าน cookies)
        if (!prefix) {
            return filtered;
        }
        
        const prefixPattern = `${prefix}_`;
        
        Object.keys(cookies).forEach(key => {
            // เอาเฉพาะ cookie ที่ขึ้นต้นด้วย prefix_
            if (key.startsWith(prefixPattern)) {
                // ตัด prefix_ ออกจากชื่อ key
                const cleanKey = key.substring(prefixPattern.length);
                filtered[cleanKey] = cookies[key];
            }
        });
        
        return filtered;
    };

    // Filter cookies by prefix
    const filteredCookies = filterCookiesByPrefix(cookies, prefix);
    console.log('🍪 Filtered cookies:', filteredCookies);

    // เงื่อนไขที่ 1: ใช้ cookies หากมี rurl ใน cookies (หลังจาก filter แล้ว)
    if (filteredCookies.rurl && Object.keys(filteredCookies).length > 0) {
        redirectUrl = filteredCookies.rurl;
        sourceData = filteredCookies;
        dataSource = 'cookies' + (prefix ? ` (prefix: ${prefix})` : '');
        console.log('✅ Using filtered cookies as data source');
    }
    // เงื่อนไขที่ 2: ใช้ query parameters หากไม่สามารถอ่าน cookies หรือไม่มี rurl ใน cookies
    else if (queryParams.rurl) {
        redirectUrl = queryParams.rurl;
        sourceData = queryParams;
        dataSource = 'query parameters';
        console.log('✅ Using query parameters as data source');
    }
    // ถ้าไม่มีทั้งสองกรณี
    else {
        return res.status(400).json({
            error: 'No rurl found in cookies or query parameters',
            prefix: prefix || '(no prefix)',
            filteredCookies: filteredCookies,
            allCookies: cookies,
            queryParams: queryParams,
            message: 'Please provide rurl in either cookies (via /seed) or query parameters'
        });
    }
    
    // Convert all data (except rurl and prefix) to query parameters
    const params = new URLSearchParams();
    Object.keys(sourceData).forEach(key => {
        if (key !== 'rurl' && key !== 'prefix') { // Exclude rurl and prefix from parameters
            params.append(key, sourceData[key]);
            console.log(`📤 Adding parameter from ${dataSource}: ${key} = ${sourceData[key]}`);
        }
    });

    // Build final URL with parameters
    const queryString = params.toString();
    const finalUrl = queryString ? `${redirectUrl}?${queryString}` : redirectUrl;
    
    console.log(`🔗 Redirecting to: ${finalUrl} (source: ${dataSource})`);
    
    // Redirect to the final URL
    res.redirect(finalUrl);
});

// API route for health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'LIFF Add Friend Server is running',
        timestamp: new Date().toISOString()
    });
});

// API route to get LIFF configuration
app.get('/api/config', (req, res) => {
    res.json({
        liffId: process.env.LIFF_ID || 'YOUR_LIFF_ID',
        externalUrl: process.env.EXTERNAL_URL || 'https://example.com'
    });
});

// API route to log URL parameters
app.get('/api/params', (req, res) => {
    const params = req.query;
    console.log('📋 URL Parameters received:', params);
    
    res.json({
        message: 'Parameters received successfully',
        parameters: params,
        count: Object.keys(params).length,
        timestamp: new Date().toISOString()
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LIFF Server running on port ${PORT}`);
    console.log(`📱 Access your LIFF app at: http://localhost:${PORT}`);
});