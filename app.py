#!/usr/bin/env python3
"""
Px1rt - Pixel Art Puzzle Game
Simple HTTP server to serve the static website locally
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 5000
HOST = 'localhost'

def main():
    """Start the local development server"""
    
    # Change to the public directory where our static files are
    public_dir = Path(__file__).parent / 'public'
    
    if not public_dir.exists():
        print("Error: 'public' directory not found!")
        print("Make sure you're running this from the project root directory.")
        print(f"Current directory: {Path.cwd()}")
        print(f"Looking for: {public_dir.absolute()}")
        sys.exit(1)
    
    # Change to the public directory
    os.chdir(public_dir)
    print(f"Changed to directory: {Path.cwd()}")
    
    # Create a simple HTTP server
    with socketserver.TCPServer((HOST, PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print("Px1rt - Pixel Art Puzzle Game")
        print("=" * 40)
        print(f"Server running at: http://{HOST}:{PORT}")
        print(f"Serving files from: {public_dir.absolute()}")
        print("=" * 40)
        print("Music toggle: Click the speaker icon in the menu")
        print("Game controls:")
        print("  • Click two pixels to swap colors")
        print("  • Double-click a pixel to cycle colors")
        print("  • Upload images for custom puzzles")
        print("=" * 40)
        print("Press Ctrl+C to stop the server")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped. Thanks for playing Px1rt!")

if __name__ == '__main__':
    main()