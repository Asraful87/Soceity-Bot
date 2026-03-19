require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initDatabase } = require('./database/db');
const { startWebhookServer } = require('./server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();
client.components = new Collection(); // buttons + modals

loadCommands(client);
loadEvents(client);

// ── Register Slash Commands & Start ───────────────────────────────────────────
async function main() {
  await initDatabase();

  const commandBodies = [...client.commands.values()].map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('[Deploy] Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandBodies }
    );
    console.log(`[Deploy] ${commandBodies.length} command(s) registered.`);
  } catch (err) {
    console.error('[Deploy] Failed to register commands:', err);
  }

  // Start webhook server (if enabled in .env)
  startWebhookServer();

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(console.error);

module.exports = client;
