# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is Robby & Claire's wedding website for their November 7, 2026 celebration at Roblar Winery in Santa Ynez, California. The project combines a static frontend with an Express.js backend for RSVP management and invitee validation.

## Architecture

### Frontend
- **Single-page application** with smooth scrolling navigation
- **Tech stack**: Vanilla JavaScript, HTML5, CSS3 with custom properties
- **Design system**: Wine country aesthetic with Roblar Winery-inspired colors (gold, earth tones, sage)
- **Key features**: Interactive timeline, photo gallery with lightbox, dynamic RSVP form, countdown timer

### Backend
- **Express.js server** running on port 3000 (configurable via PORT env var)
- **SQLite database** with two tables: `invitees` and `rsvp_responses`
- **Security**: Rate limiting (5 req/hour), invitee validation with 75% fuzzy matching, CORS enabled

### API Endpoints
**Public:**
- `POST /api/rsvp` - Submit RSVP (rate limited, validates against invitee list)
- `GET /api/health` - Health check

**Admin (requires `Authorization: Bearer <ADMIN_API_KEY>`):**
- `GET /api/rsvps` - Get all RSVPs
- `GET /api/rsvps/:groupId` - Get RSVPs by group
- `GET /api/rsvps/stats` - RSVP statistics
- `GET /api/admin/invitees/count` - Invitee count
- `POST /api/admin/invitees/import` - Import CSV (multipart form)
- `DELETE /api/admin/invitees?confirm=DELETE_ALL` - Clear invitees

## Development Commands

### Server Management
```bash
make start-server    # Start Express server (cd server && node server.js)
make stop-server     # Stop running server process
make install         # Install server dependencies (cd server && npm install)
```

### Database Operations
```bash
make view            # View all RSVP responses in formatted table
make stats           # Show RSVP statistics (guest count, meal preferences)
make guests          # List all guest names with submission times
make dinners         # Show meal selections grouped by type
make groups          # Display RSVPs grouped by party
make export          # Export RSVPs to CSV file
make clean-db        # Delete database file (with confirmation)
```

### Invitee Management
```bash
make invitee-count   # Show total approved invitees
make invitee-import FILE=invitees.csv    # Import invitees from CSV
make invitee-list    # List all normalized invitee names
make invitee-clear   # Delete all invitees (with confirmation)
```

### Development Workflow
```bash
cd server && npm run dev    # Start with nodemon for auto-restart
cd server && npm run start  # Production start
cd server && npm run import-invitees ../file.csv  # Import utility
```

## Key Technical Details

### Environment Configuration
Copy `server/.env.example` to `server/.env` and set:
- `ADMIN_API_KEY` - Required for admin endpoints
- `PORT` - Server port (default: 3000)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 3600000 = 1 hour)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 5)

### Database Schema
- **invitees**: `id`, `name_normalized` (UNIQUE), `created_at`
- **rsvp_responses**: `id`, `guest_name`, `dinner_choice`, `email`, `comments`, `group_id` (UUID), `created_at`

### RSVP Form Features
- **Dynamic guest forms**: 1-2 guests with meal selection
- **Meal options**: Vegetarian (Spring Risotto), Fish (Branzino), Meat (Short Rib)
- **Validation**: Real-time form validation with flash notifications
- **Invitee validation**: Uses `string-similarity` library with 75% threshold for fuzzy matching

### Frontend Architecture
- **Modular JavaScript**: Organized by feature (animations, form handling, lightbox, etc.)
- **CSS custom properties**: Comprehensive design system with glass morphism effects
- **Responsive design**: Mobile-first approach with desktop enhancements
- **Accessibility**: ARIA labels, keyboard navigation, reduced motion support

## File Structure

```
/
├── index.html              # Main frontend application
├── assets/
│   ├── css/
│   │   └── styles.css     # Complete styling system
│   ├── js/
│   │   └── main.js        # All frontend functionality
│   └── images/            # Static assets
├── server/
│   ├── server.js           # Express application
│   ├── database.js         # SQLite operations
│   ├── inviteeManager.js   # Invitee validation logic
│   ├── authMiddleware.js   # Security middleware
│   ├── csvImporter.js      # Invitee import utility
│   └── package.json        # Server dependencies
├── wedding.db             # SQLite database (auto-created)
├── Makefile              # Development operations
└── CLAUDE.md            # This file
```

## Design Guidelines

### Color Palette
- **Primary**: #B8935E (Rich gold - Roblar branding)
- **Secondary**: #D4A574 (Warm wheat - vineyard fields)
- **Accent**: #8B6F47 (Aged bronze - wine barrels)
- **Highlight**: #F4E8D6 (Soft cream - natural elegance)
- **Deep**: #2C1F1A (Deep earth brown)
- **Sage**: #8B9A7A (Muted sage - organic gardens)

### Typography
- **Headings**: Cormorant Garamond (serif, elegant)
- **Body**: Karla (sans-serif, clean, readable)

### Effects
- **Glass morphism**: Varied opacity for depth
- **Gradients**: Wine country-inspired color transitions
- **Animations**: Smooth reveals, parallax scrolling, staggered effects

## Development Workflow

### Local Development
1. Copy `server/.env.example` to `server/.env` and set `ADMIN_API_KEY`
2. Run `make install` to install dependencies
3. Run `make start-server` to start the Express server
4. Open browser to `http://localhost:3000` or access `index.html` directly

### Common Tasks
- **Update wedding details**: Edit `index.html` sections
- **Modify meal options**: Update `main.js` dinnerOptions array
- **Change colors**: Modify CSS custom properties in `:root`
- **Add invitees**: `make invitee-import FILE=invitees.csv` (CSV needs `name` header)
- **View RSVPs**: `make view` or `make stats`
- **Export RSVPs**: `make export` (creates `rsvp_export.csv`)

### Backend Development
- Database operations: `server/database.js`
- API endpoints: `server/server.js`
- Invitee validation logic: `server/inviteeManager.js`
- Admin auth middleware: `server/authMiddleware.js`
- Test API: `curl http://localhost:3000/api/health`
- Query database: `sqlite3 wedding.db`