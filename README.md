# FollowMark

**Your bookmarks follow your progress automatically!**

FollowMark is a browser extension that automatically tracks your reading progress across bookmarked pages. Perfect for webcomics, wikis, blogs, YouTube playlists, and any sequential content you want to follow.

## For Users

### What is FollowMark?

FollowMark automatically updates your bookmarks when you visit pages, so your bookmarks always reflect your current progress. When you bookmark a page on a site (like a webcomic chapter or wiki article), FollowMark will:

- Detect when you visit new pages on the same site
- Automatically update your bookmark to point to your latest position
- Show you which sites are being followed with a visual indicator in the toolbar

### Features

- **Automatic Progress Tracking**: Bookmarks update automatically as you browse
- **Multi-Platform Support**: Works with webcomics, wikis, blogs, YouTube, and more
- **Smart URL Recognition**: Special handling for popular platforms:
  - Tapas comics
  - Webtoons
  - YouTube (videos and playlists)
- **Visual Indicators**: Toolbar icon changes to show when a page is being followed
- **Bookmark Integration**: Creates and manages bookmarks in a dedicated "followMarks" folder
- **Cross-Tab Sync**: Works across multiple tabs and windows

### How to Use

1. **Install the Extension** (coming soon to Firefox and Chrome Web Store)
2. **Navigate to a page** you want to follow (e.g., a webcomic chapter)
3. **Bookmark the page** using your browser's bookmark feature
4. **Click the extension icon** and select "Make FollowMark"
5. **Continue browsing** - your bookmark will automatically update as you visit new pages

### Use Cases

- **Webcomics**: Follow multi-chapter comics on Tapas, Webtoons, or independent sites
- **Wikis**: Track your progress through long wiki articles or documentation
- **Blogs**: Follow multi-part blog posts or series
- **YouTube**: Track which videos you've watched in a playlist
- **Tutorials**: Follow step-by-step tutorials across multiple pages

### Installation

FollowMark is currently in development. Installation instructions will be provided once the extension is available on the Firefox Add-ons store and Chrome Web Store.

## For Developers

### Tech Stack

- **TypeScript**: Type-safe development
- **Chrome Extension APIs**: bookmarks, tabs, storage, scripting, notifications
- **Build Tool**: TypeScript compiler (tsc)
- **Testing Tool**: web-ext for development and testing

### Project Structure

```txt
followmark/
├── src/                    # TypeScript source files
│   ├── background.ts       # Background script for tab monitoring
│   ├── popup.ts            # Popup UI logic
│   ├── marks.ts            # Mark creation and bookmark management
│   ├── bookmarks.ts        # Bookmark search and utilities
│   ├── common.ts           # Shared state and utilities
│   ├── check.ts            # Validation utilities
│   ├── build.ts            # HTML/SVG element builders
│   └── definitions.d.ts    # TypeScript type definitions
├── dist/                   # Compiled JavaScript output
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Compiled background script
│   ├── popup.js            # Compiled popup script
│   ├── popup.html          # Popup UI
│   └── icons/              # Extension icons
├── package.json            # Project metadata and scripts
├── tsconfig.json           # TypeScript configuration
├── tsconfig.background.json # Background script TypeScript config
├── tsconfig.popup.json     # Popup script TypeScript config
└── LICENSE                 # GPL-3.0 license
```

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/LuxBrush/followmark.git
   cd followmark
   ```

2. **Install dependencies**:

   ```bash
   bun install
   # or
   npm install
   ```

3. **Install web-ext** (for development testing):

   ```bash
   bun add -d web-ext
   # or
   npm install --save-dev web-ext
   ```

### Building

Compile TypeScript to JavaScript:

```bash
bun run build
# or
npm run build
```

This will compile all TypeScript files from `src/` to `dist/`.

### Development Mode

Watch for file changes and automatically rebuild:

```bash
bun run watch
# or
npm run watch
```

### Testing the Extension

Run the extension in a temporary browser instance:

```bash
bun run preview
# or
npm run preview
```

This will launch Firefox (or Chrome if configured) with the extension loaded from the `dist/` directory.

### Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** following the existing code style
4. **Test thoroughly** using the preview script
5. **Commit your changes** with clear messages
6. **Push to your fork**: `git push origin feature/your-feature`
7. **Submit a pull request**

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions (camelCase for variables, PascalCase for classes)
- Add JSDoc comments for functions and classes
- Keep functions focused and modular
- Use the existing utility functions (e.g., `buildElement`, `notifyMessage`)

### Adding New Platform Support

To add support for a new platform (e.g., a new webcomic site):

1. Add a URL pattern extractor in `src/common.ts` in the `extractors` array
2. The extractor should return a unique page key or `null` if the URL doesn't match
3. Test the extractor with the preview script

Example:

```typescript
const YOUR_SITE_MATCH = /your-pattern-here/;

const extractors: PageKeyExtractor[] = [
  // ... existing extractors
  (_hostname, _title, href) => {
    if (!href.includes("yoursite.com")) return null;
    const matches = href.match(YOUR_SITE_MATCH);
    return matches ? generateHash(matches[1]) : null;
  },
];
```

### License

This project is licensed under GPL-3.0 - see the [LICENSE](LICENSE) file for details.

### Support

For issues, feature requests, or questions, please visit the [GitHub Issues](https://github.com/LuxBrush/followmark/issues) page.
