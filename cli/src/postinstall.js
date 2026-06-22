const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const axios = require('axios');

const CONFIG_DIR = path.join(os.homedir(), '.mybuild');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function main() {
  console.log('\n==================================================');
  console.log('   mybuild CLI Post-Installation Setup');
  console.log('==================================================\n');

  console.log('Configure connection to your self-hosted build VPS.');
  console.log('Leave blank to skip configuration and setup later.\n');

  const finalUrl = await askQuestion('Enter your VPS API Server URL (e.g., http://123.45.67.89:3000): ');
  if (!finalUrl) {
    console.log('\n⚠ Setup skipped. You can configure this later by running: mybuild init\n');
    return;
  }

  const finalKey = await askQuestion('Enter your API Key: ');
  if (!finalKey) {
    console.log('\n⚠ Setup skipped. You can configure this later by running: mybuild init\n');
    return;
  }

  let cleanedUrl = finalUrl;
  if (cleanedUrl.endsWith('/')) {
    cleanedUrl = cleanedUrl.slice(0, -1);
  }

  console.log(`\nConnecting to ${cleanedUrl}/auth/login...`);
  try {
    // Validate connection to VPS
    await axios.post(`${cleanedUrl}/auth/login`, { apiKey: finalKey }, { timeout: 10000 });
    
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiUrl: cleanedUrl, apiKey: finalKey }, null, 2), 'utf8');
    
    console.log('\n✔ Configuration successful! Settings saved in ~/.mybuild/config.json\n');
  } catch (err) {
    console.log('\n✖ Connection failed. Server did not respond or API key is invalid.');
    console.log('Saving settings anyway. You can update this later with "mybuild init".');
    
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ apiUrl: cleanedUrl, apiKey: finalKey }, null, 2), 'utf8');
    console.log('✔ Settings saved in ~/.mybuild/config.json\n');
  }
}

main();
