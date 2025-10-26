// js/supabase-config.js
// This file connects your website to Supabase

const SUPABASE_URL = 'https://lqrewteclbexiknvhenk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8';

// Create Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to check if user is logged in
function checkAuth() {
    const currentUser = localStorage.getItem('dreamharbour_user');
    return currentUser ? JSON.parse(currentUser) : null;
}

// Function to logout
function logout() {
    localStorage.removeItem('dreamharbour_user');
    window.location.href = 'index.html';
}
