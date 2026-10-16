// Phusion Passenger entrypoint
if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

import('./dist-server/index.js').catch((err) => {
  console.error('Failed to load backend dist-server/index.js:', err);
});
