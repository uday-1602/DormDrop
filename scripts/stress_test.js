import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runRequest() {
    const start = performance.now();
    try {
        // Fetch listings to simulate user loading the homepage feed
        const { data, error } = await supabase
            .from('listings')
            .select('id, title, price, category')
            .limit(10);
            
        const duration = performance.now() - start;
        if (error) {
            return { success: false, duration, error: error.message };
        }
        return { success: true, duration, count: data?.length || 0 };
    } catch (err) {
        const duration = performance.now() - start;
        return { success: false, duration, error: err.message };
    }
}

async function runStressTest(totalRequests = 100, concurrency = 10) {
    console.log('====================================================');
    console.log('⚡ Starting Supabase API Stress Test for DormDrop...');
    console.log(`📊 Target: ${supabaseUrl}`);
    console.log(`📈 Configuration: ${totalRequests} total requests, batch size of ${concurrency}`);
    console.log('====================================================\n');

    const results = [];
    const batches = Math.ceil(totalRequests / concurrency);

    for (let b = 0; b < batches; b++) {
        const batchStart = performance.now();
        const promises = [];
        
        const countThisBatch = Math.min(concurrency, totalRequests - (b * concurrency));
        for (let i = 0; i < countThisBatch; i++) {
            promises.push(runRequest());
        }

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        const batchDuration = performance.now() - batchStart;
        console.log(`🔹 Batch ${b + 1}/${batches} completed: ${countThisBatch} requests in ${batchDuration.toFixed(1)}ms`);
    }

    console.log('\n=================== RESULTS ===================');
    
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    const successRate = (successes.length / totalRequests) * 100;

    console.log(`✅ Successes: ${successes.length}/${totalRequests} (${successRate.toFixed(1)}%)`);
    console.log(`❌ Failures:  ${failures.length}/${totalRequests}`);

    if (failures.length > 0) {
        console.log('\n⚠️ Sample Failure Errors:');
        failures.slice(0, 3).forEach((f, index) => {
            console.log(`  [${index + 1}] Error: "${f.error}" (took ${f.duration.toFixed(1)}ms)`);
        });
    }

    if (successes.length > 0) {
        const durations = successes.map(s => s.duration).sort((a, b) => a - b);
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = sum / durations.length;
        const min = durations[0];
        const max = durations[durations.length - 1];
        
        // 95th Percentile calculation
        const p95Idx = Math.floor(durations.length * 0.95);
        const p95 = durations[p95Idx] || max;

        console.log('\n⏱️ Latency breakdown (successful requests):');
        console.log(`  🚀 Min Latency:     ${min.toFixed(1)}ms`);
        console.log(`  🐢 Max Latency:     ${max.toFixed(1)}ms`);
        console.log(`  📊 Average Latency: ${avg.toFixed(1)}ms`);
        console.log(`  ⚡ 95th Percentile:  ${p95.toFixed(1)}ms`);
    }
    console.log('====================================================\n');
}

// Default stress test: 100 requests total, concurrency level of 10
runStressTest(100, 10);
