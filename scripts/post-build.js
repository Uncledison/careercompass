const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (!fs.existsSync(indexPath)) {
    console.error('dist/index.html not found!');
    process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// PWA Links to inject
const pwaLinks = `
    <link rel="manifest" href="manifest.json" />
    <link rel="apple-touch-icon" href="icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="icon.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="icon.png" />
`;

// Service Worker Registration to inject
const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
          });
        });
      }
    </script>
`;

// Inject before </head>
if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `${pwaLinks}\n</head>`);
    console.log('Injected PWA links');
}

// Inject before </body>
if (!html.includes('serviceWorker.register')) {
    html = html.replace('</body>', `${swScript}\n</body>`);
    console.log('Injected Service Worker script');
}

fs.writeFileSync(indexPath, html);
console.log('Successfully updated dist/index.html');
