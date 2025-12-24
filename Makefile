# Wedding RSVP Database Management Makefile
# Usage: make [target]

.PHONY: help view stats guests dinners groups clean-db start-server stop-server install export invitee-count invitee-import invitee-list invitee-clear

# Database file location
DB_FILE = wedding.db

help:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   Wedding RSVP Database Management                ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@echo "RSVP Management:"
	@echo "  make view           - View all RSVP responses"
	@echo "  make stats          - Show RSVP statistics"
	@echo "  make guests         - List all guest names"
	@echo "  make dinners        - Show dinner selections breakdown"
	@echo "  make groups         - Show RSVPs grouped by party"
	@echo "  make export         - Export RSVPs to CSV"
	@echo ""
	@echo "Invitee Management:"
	@echo "  make invitee-count  - Show number of approved invitees"
	@echo "  make invitee-import FILE=<csv> - Import invitees from CSV"
	@echo "  make invitee-list   - List all invitees (normalized)"
	@echo "  make invitee-clear  - Delete all invitees (CAUTION!)"
	@echo ""
	@echo "Server Management:"
	@echo "  make start-server   - Start the Express server"
	@echo "  make stop-server    - Stop the Express server"
	@echo "  make install        - Install server dependencies"
	@echo ""
	@echo "Database:"
	@echo "  make clean-db       - Delete the database (CAUTION!)"
	@echo ""

# View all RSVP responses
view:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   All RSVP Responses                              ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No RSVPs yet."; \
	else \
		sqlite3 $(DB_FILE) -header -column \
		"SELECT id, guest_name, dinner_choice, email, \
		substr(comments, 1, 30) as comments_preview, \
		group_id, \
		datetime(created_at, 'localtime') as submitted_at \
		FROM rsvp_responses \
		ORDER BY created_at DESC;"; \
	fi

# Show RSVP statistics
stats:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   RSVP Statistics                                 ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No RSVPs yet."; \
	else \
		sqlite3 $(DB_FILE) -header -column \
		"SELECT \
		COUNT(*) as 'Total Guests', \
		COUNT(DISTINCT group_id) as 'Total Parties', \
		SUM(CASE WHEN dinner_choice = 'vegetarian' THEN 1 ELSE 0 END) as 'Vegetarian', \
		SUM(CASE WHEN dinner_choice = 'fish' THEN 1 ELSE 0 END) as 'Fish (Branzino)', \
		SUM(CASE WHEN dinner_choice = 'meat' THEN 1 ELSE 0 END) as 'Meat (Short Rib)' \
		FROM rsvp_responses;"; \
	fi

# List all guest names
guests:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   Guest List                                      ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No RSVPs yet."; \
	else \
		sqlite3 $(DB_FILE) -header -column \
		"SELECT \
		ROW_NUMBER() OVER (ORDER BY created_at) as '#', \
		guest_name as 'Guest Name', \
		dinner_choice as 'Dinner Choice', \
		datetime(created_at, 'localtime') as 'Submitted At' \
		FROM rsvp_responses \
		ORDER BY created_at;"; \
	fi

# Show dinner selections breakdown
dinners:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   Dinner Selections by Guest                      ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No RSVPs yet."; \
	else \
		echo "🥗 VEGETARIAN (Fresh Spring Risotto):"; \
		sqlite3 $(DB_FILE) -column "SELECT '  • ' || guest_name FROM rsvp_responses WHERE dinner_choice = 'vegetarian' ORDER BY created_at;" || echo "  None"; \
		echo ""; \
		echo "🐟 FISH (Branzino):"; \
		sqlite3 $(DB_FILE) -column "SELECT '  • ' || guest_name FROM rsvp_responses WHERE dinner_choice = 'fish' ORDER BY created_at;" || echo "  None"; \
		echo ""; \
		echo "🥩 MEAT (Short Rib):"; \
		sqlite3 $(DB_FILE) -column "SELECT '  • ' || guest_name FROM rsvp_responses WHERE dinner_choice = 'meat' ORDER BY created_at;" || echo "  None"; \
		echo ""; \
	fi

# Show RSVPs grouped by party
groups:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   RSVPs by Party                                  ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No RSVPs yet."; \
	else \
		sqlite3 $(DB_FILE) \
		"SELECT \
		'Party ' || ROW_NUMBER() OVER (ORDER BY MIN(created_at)) as 'Party', \
		COUNT(*) as 'Size', \
		GROUP_CONCAT(guest_name, ', ') as 'Guests', \
		MAX(email) as 'Email', \
		datetime(MIN(created_at), 'localtime') as 'Submitted At' \
		FROM rsvp_responses \
		GROUP BY group_id \
		ORDER BY MIN(created_at);" \
		-header -column; \
	fi

# Clean database (with confirmation)
clean-db:
	@echo "⚠️  WARNING: This will DELETE all RSVP data!"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@rm -f $(DB_FILE)
	@echo "✅ Database deleted."

# Start the Express server
start-server:
	@echo "🚀 Starting RSVP server..."
	@cd server && node server.js

# Stop the Express server
stop-server:
	@echo "🛑 Stopping RSVP server..."
	@pkill -f "node server.js" || echo "Server not running"

# Install server dependencies
install:
	@echo "📦 Installing server dependencies..."
	@cd server && npm install
	@echo "✅ Dependencies installed!"

# Export database to CSV
export:
	@echo "📊 Exporting RSVPs to CSV..."
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No RSVPs yet."; \
	else \
		sqlite3 $(DB_FILE) -header -csv \
		"SELECT id, guest_name, dinner_choice, email, comments, group_id, datetime(created_at, 'localtime') as submitted_at \
		FROM rsvp_responses \
		ORDER BY created_at DESC;" > rsvp_export.csv; \
		echo "✅ Exported to rsvp_export.csv"; \
	fi

# ============================================================
# INVITEE MANAGEMENT COMMANDS
# ============================================================

# Show invitee count
invitee-count:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   Invitee Count                                   ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. Run server first to initialize database."; \
	else \
		COUNT=$$(sqlite3 $(DB_FILE) "SELECT COUNT(*) FROM invitees;" 2>/dev/null || echo "0"); \
		echo "Total approved invitees: $$COUNT"; \
	fi

# Import invitees from CSV
invitee-import:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Error: No file specified."; \
		echo "Usage: make invitee-import FILE=path/to/invitees.csv"; \
		echo ""; \
		echo "CSV format (header required):"; \
		echo "  name"; \
		echo "  John Doe"; \
		echo "  Jane Smith"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "❌ Error: File not found: $(FILE)"; \
		exit 1; \
	fi
	@echo "📥 Importing invitees from $(FILE)..."
	@cd server && npm run import-invitees "../$(FILE)"

# List all invitees (normalized names only - hashes not shown)
invitee-list:
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║   Approved Invitees (Normalized)                  ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found. No invitees yet."; \
	else \
		COUNT=$$(sqlite3 $(DB_FILE) "SELECT COUNT(*) FROM invitees;" 2>/dev/null || echo "0"); \
		if [ "$$COUNT" -eq 0 ]; then \
			echo "📋 No invitees in database yet."; \
			echo "Import invitees using: make invitee-import FILE=invitees.csv"; \
		else \
			sqlite3 $(DB_FILE) -header -column \
			"SELECT \
			ROW_NUMBER() OVER (ORDER BY name_normalized) as '#', \
			name_normalized as 'Normalized Name', \
			datetime(created_at, 'localtime') as 'Added At' \
			FROM invitees \
			ORDER BY name_normalized;"; \
		fi; \
	fi

# Clear all invitees (with confirmation)
invitee-clear:
	@echo "⚠️  WARNING: This will DELETE all approved invitees!"
	@echo "This will require re-importing the invitee list."
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@if [ ! -f $(DB_FILE) ]; then \
		echo "❌ Database not found."; \
	else \
		sqlite3 $(DB_FILE) "DELETE FROM invitees;"; \
		echo "✅ All invitees deleted."; \
	fi

