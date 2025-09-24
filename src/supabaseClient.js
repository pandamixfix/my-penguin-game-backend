// src/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Ошибка: SUPABASE_URL или SUPABASE_SERVICE_KEY не заданы в .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;