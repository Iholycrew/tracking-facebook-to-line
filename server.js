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

    console.log('📋 Setting cookies from parameters:', params);

    // Set each query parameter as a cookie
    Object.keys(params).forEach(key => {
        const value = params[key];
        res.cookie(key, value, cookieOptions);
        console.log(`🍪 Cookie set: ${key} = ${value}`);
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
            parameters: params,
            cookieCount: Object.keys(params).length,
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

    let redirectUrl;
    let sourceData;
    let dataSource;

    // เงื่อนไขที่ 1: ใช้ cookies หากมี rurl ใน cookies
    if (cookies.rurl && Object.keys(cookies).length > 0) {
        redirectUrl = cookies.rurl;
        sourceData = cookies;
        dataSource = 'cookies';
        console.log('✅ Using cookies as data source');
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
            cookies: cookies,
            queryParams: queryParams,
            message: 'Please provide rurl in either cookies (via /seed) or query parameters'
        });
    }
    
    // Convert all data (except rurl) to query parameters
    const params = new URLSearchParams();
    Object.keys(sourceData).forEach(key => {
        if (key !== 'rurl') { // Exclude rurl from parameters
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