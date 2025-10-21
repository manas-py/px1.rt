# PX1RT - Pixel Art Game

A web-based pixel art game built with Flask, featuring a Windows XP-inspired interface and interactive pixel board.

## Features

- **Interactive Pixel Board**: Create pixel art with customizable grid sizes
- **Windows XP Theme**: Authentic Windows XP styling and UI elements
- **Modal Dialogs**: About, Export, Upload, and Custom Game modals
- **Responsive Design**: Mobile-friendly interface with adaptive layout
- **Game Modes**: Multiple game modes and customization options
- **Export Functionality**: Save your pixel art creations

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3
- **Styling**: Custom CSS with Windows XP theming
- **Icons**: Custom SVG cursors and UI elements

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd px1rt
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
px1rt/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   └── style.css         # CSS styling
└── README.md             # This file
```

## API Endpoints

- `GET /` - Main game interface
- `GET /health` - Health check endpoint

## Development

The application runs in debug mode by default. For production deployment, use a proper WSGI server like Gunicorn.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.