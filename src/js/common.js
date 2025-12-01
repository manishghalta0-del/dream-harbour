// common.js - central Supabase client + toast
import { createClient } from '@supabase/supabase-js';

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// PASTE YOUR KEYS HERE (ONLY ANON PUBLIC KEY — NOT service_role)
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const SUPABASE_URL = "https://lqrewteclbexiknvhenk.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcmV3dGVjbGJleGlrbnZoZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ2MDMsImV4cCI6MjA3NzA0MDYwM30.YLKmzuy3tfa9S09fzk4lYphBcl6a1jkeur3hUBaAHO8";

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// DO NOT PUT YOUR SERVICE ROLE KEY HERE
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Toast helper
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) {
    console[type === "error" ? "error" : "log"](message);
    return;
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "alert");
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// Get current logged-in user
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch (err) {
    console.error("getCurrentUser", err);
    return null;
  }
}

export default { supabase, showToast, getCurrentUser };