// =============================================
// CAPIBARA CONFIGURATION
// =============================================

// YOUR SUPABASE CREDENTIALS
// ⚠️ IMPORTANT: Replace these with your actual credentials!
const SUPABASE_URL = 'https://awdkkgyrtiiystseotdt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGtrZ3lydGlpeXN0c2VvdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MjMxNTgsImV4cCI6MjA2ODI5OTE1OH0.JviPwe8aovJIBRmK78hzg3Pdivj3PtG3JSaCKbASr4U'; // ← ADD YOUR ACTUAL KEY HERE!

// Check if Supabase is available
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase library not loaded! Make sure the script tag is included.');
} else {
    console.log('✅ Supabase library loaded successfully');
    
    // Create the Supabase client
    const { createClient } = supabase;
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('✅ Supabase client created!');
    console.log('📍 Connected to:', SUPABASE_URL);
}

// Configuration validation
function validateConfig() {
    if (SUPABASE_URL === '' || SUPABASE_URL.includes('YOUR-URL-HERE')) {
        console.error('❌ SUPABASE_URL not configured! Please add your Supabase URL.');
        return false;
    }
    
    if (SUPABASE_ANON_KEY === '' || SUPABASE_ANON_KEY.includes('YOUR-KEY-HERE')) {
        console.error('❌ SUPABASE_ANON_KEY not configured! Please add your Supabase anon key.');
        alert('⚠️ Please configure your Supabase credentials in js/config.js');
        return false;
    }
    
    return true;
}

// Run validation
validateConfig();