// Compatibility entry point. The PostgreSQL Nest application is the only backend runtime.
// The historical in-memory prototype remains at ../server.ts for migration reference.
import { createApp } from './src/main';

createApp()
  .then(app => app.listen(Number(process.env.PORT || 3001), '0.0.0.0'))
  .catch(error => { console.error(error.message); process.exitCode = 1; });
